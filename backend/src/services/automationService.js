const Automation = require('../models/Automation');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const Workspace = require('../models/Workspace');
const whatsappService = require('./whatsappService');
const logger = require('../utils/logger');

class AutomationService {
  constructor() {
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  // Check if a message matches keyword conditions
  _matchesKeyword(messageBody, conditions) {
    if (!conditions || !conditions.keywords || !conditions.keywords.length) {
      return false;
    }

    const matchType = conditions.matchType || 'contains';
    const caseSensitive = conditions.caseSensitive || false;
    const body = caseSensitive ? messageBody : messageBody.toLowerCase();

    return conditions.keywords.some(keyword => {
      const kw = caseSensitive ? keyword : keyword.toLowerCase();
      if (matchType === 'exact') {
        return body === kw;
      } else if (matchType === 'starts_with') {
        return body.startsWith(kw);
      } else {
        // contains
        return body.includes(kw);
      }
    });
  }

  // Check if current time in workspace timezone is outside working hours
  async _isOffHours(contact) {
    if (!contact.workspace) return false;

    const workspace = await Workspace.findById(contact.workspace);
    if (!workspace || !workspace.workingHours || !workspace.workingHours.enabled) {
      return false;
    }

    const { timezone = 'Asia/Kolkata', schedule } = workspace.workingHours;
    if (!schedule) return false;

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      const parts = formatter.formatToParts(new Date());
      const partObj = {};
      parts.forEach(p => { partObj[p.type] = p.value; });

      // weekday returns "Monday", "Tuesday", etc.
      const dayName = String(partObj.weekday).toLowerCase();
      const currentHour = partObj.hour;
      const currentMinute = partObj.minute;
      const currentTimeStr = `${currentHour}:${currentMinute}`;

      const dayConfig = schedule[dayName];
      if (!dayConfig) return false;

      // If it's a non-working day, it is off-hours
      if (!dayConfig.isWorking) return true;

      const { start, end } = dayConfig;
      if (!start || !end) return false;

      // If current time is outside start and end, it is off-hours
      if (currentTimeStr < start || currentTimeStr > end) {
        return true;
      }

      return false;
    } catch (err) {
      logger.error(`Error calculating off-hours for workspace timezone: ${err.message}`);
      return false;
    }
  }

  // Trigger automations based on incoming messages
  async triggerMessageAutomations(contact, message) {
    try {
      const workspaceId = contact.workspace;

      // Find all active automations for the workspace (or unassigned workspace automations)
      const query = workspaceId ? {
        isActive: true,
        $or: [
          { workspace: workspaceId },
          { workspace: null },
          { workspace: { $exists: false } }
        ]
      } : { isActive: true };

      const automations = await Automation.find(query).sort({ priority: -1 });

      if (!automations || automations.length === 0) return;

      const messageBody = message.content?.body || '';

      for (const automation of automations) {
        let shouldTrigger = false;

        // Apply basic filter conditions on Contact (Tags / Statuses) if defined
        if (automation.conditions) {
          const { fromTags, fromStatuses } = automation.conditions;
          if (fromTags && fromTags.length > 0) {
            const hasMatchingTag = fromTags.some(t => contact.tags.includes(t));
            if (!hasMatchingTag) continue;
          }
          if (fromStatuses && fromStatuses.length > 0) {
            if (!fromStatuses.includes(contact.status)) continue;
          }
        }

        // Evaluate triggers
        if (automation.trigger === 'keyword') {
          shouldTrigger = this._matchesKeyword(messageBody, automation.conditions);
        } else if (automation.trigger === 'first_message') {
          const incomingCount = await Message.countDocuments({
            contact: contact._id,
            direction: 'incoming'
          });
          shouldTrigger = (incomingCount <= 1 || contact.conversationCount <= 1);
        } else if (automation.trigger === 'off_hours') {
          shouldTrigger = await this._isOffHours(contact);
        }

        if (shouldTrigger) {
          logger.info(`⚡ Automation "${automation.name}" triggered for contact ${contact.phone}`);
          
          // Increment stats
          automation.stats.triggered = (automation.stats.triggered || 0) + 1;
          await automation.save();

          // Execute action with delay (if any)
          const delayMinutes = automation.conditions?.delayMinutes || 0;
          if (delayMinutes > 0) {
            setTimeout(() => {
              this.executeActions(automation, contact).catch(err => {
                logger.error(`Delayed action execution failed for ${automation.name}: ${err.message}`);
              });
            }, delayMinutes * 60 * 1000);
          } else {
            await this.executeActions(automation, contact);
          }
        }
      }
    } catch (error) {
      logger.error(`Error triggering message automations: ${error.message}`);
    }
  }

  // Trigger automations based on status/tag updates
  async triggerContactAutomations(contact, triggerType, changedValue) {
    try {
      const workspaceId = contact.workspace;

      const query = workspaceId ? {
        isActive: true,
        trigger: triggerType,
        $or: [
          { workspace: workspaceId },
          { workspace: null },
          { workspace: { $exists: false } }
        ]
      } : { isActive: true, trigger: triggerType };

      const automations = await Automation.find(query).sort({ priority: -1 });

      if (!automations || automations.length === 0) return;

      for (const automation of automations) {
        let shouldTrigger = false;

        // Apply filters
        if (automation.conditions) {
          const { fromTags, fromStatuses } = automation.conditions;
          if (fromTags && fromTags.length > 0) {
            const hasMatchingTag = fromTags.some(t => contact.tags.includes(t));
            if (!hasMatchingTag) continue;
          }
          if (fromStatuses && fromStatuses.length > 0) {
            if (!fromStatuses.includes(contact.status)) continue;
          }
        }

        if (triggerType === 'status_change') {
          // If we matched the filters above, trigger
          shouldTrigger = true;
        } else if (triggerType === 'tag_change') {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          logger.info(`⚡ Automation "${automation.name}" triggered by ${triggerType} for contact ${contact.phone}`);
          
          automation.stats.triggered = (automation.stats.triggered || 0) + 1;
          await automation.save();

          const delayMinutes = automation.conditions?.delayMinutes || 0;
          if (delayMinutes > 0) {
            setTimeout(() => {
              this.executeActions(automation, contact).catch(err => {
                logger.error(`Delayed action execution failed for ${automation.name}: ${err.message}`);
              });
            }, delayMinutes * 60 * 1000);
          } else {
            await this.executeActions(automation, contact);
          }
        }
      }
    } catch (error) {
      logger.error(`Error triggering contact automations: ${error.message}`);
    }
  }

  // Execute all actions defined in the automation rule
  async executeActions(automation, contact) {
    try {
      let isSuccess = true;
      let contactInstance = await Contact.findById(contact._id);

      for (const action of automation.actions) {
        // Handle per-action delay
        if (action.delaySeconds && action.delaySeconds > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delaySeconds * 1000));
        }

        try {
          let msgSent = false;
          let messageData = {
            contact: contactInstance._id,
            direction: 'outgoing',
            type: 'text',
            status: 'sent',
            timestamp: new Date()
          };

          const payload = action.payload || {};

          switch (action.type) {
            case 'send_text': {
              const res = await whatsappService.sendText(contactInstance.phone, payload.text);
              messageData.content = { body: payload.text };
              messageData.metaMessageId = res?.messages?.[0]?.id || `mock_${Date.now()}`;
              msgSent = true;
              break;
            }
            case 'send_template': {
              // Standard template send
              const res = await whatsappService.sendTemplate(
                contactInstance.phone,
                payload.templateName,
                payload.templateLanguage || 'en',
                payload.templateParams || []
              );
              messageData.type = 'template';
              messageData.content = { body: `Template: ${payload.templateName}` };
              messageData.metaMessageId = res?.messages?.[0]?.id || `mock_${Date.now()}`;
              msgSent = true;
              break;
            }
            case 'send_image': {
              const res = await whatsappService.sendImage(contactInstance.phone, payload.imageUrl, payload.caption);
              messageData.type = 'image';
              messageData.content = { mediaId: payload.imageUrl, caption: payload.caption };
              messageData.metaMessageId = res?.messages?.[0]?.id || `mock_${Date.now()}`;
              msgSent = true;
              break;
            }
            case 'send_document': {
              const res = await whatsappService.sendDocument(contactInstance.phone, payload.documentUrl, payload.filename, payload.caption);
              messageData.type = 'document';
              messageData.content = { mediaId: payload.documentUrl, filename: payload.filename, caption: payload.caption };
              messageData.metaMessageId = res?.messages?.[0]?.id || `mock_${Date.now()}`;
              msgSent = true;
              break;
            }
            case 'send_buttons': {
              const res = await whatsappService.sendButtons(contactInstance.phone, payload.text, payload.buttons);
              messageData.type = 'interactive';
              messageData.content = { body: payload.text, buttons: payload.buttons };
              messageData.metaMessageId = res?.messages?.[0]?.id || `mock_${Date.now()}`;
              msgSent = true;
              break;
            }
            case 'send_list': {
              const res = await whatsappService.sendList(contactInstance.phone, payload.text, 'Options', payload.listSections);
              messageData.type = 'interactive';
              messageData.content = { body: payload.text, sections: payload.listSections };
              messageData.metaMessageId = res?.messages?.[0]?.id || `mock_${Date.now()}`;
              msgSent = true;
              break;
            }
            case 'add_tag': {
              if (payload.tag && !contactInstance.tags.includes(payload.tag)) {
                contactInstance.tags.push(payload.tag);
                await contactInstance.save();
              }
              break;
            }
            case 'remove_tag': {
              if (payload.tag) {
                contactInstance.tags = contactInstance.tags.filter(t => t !== payload.tag);
                await contactInstance.save();
              }
              break;
            }
            case 'change_status': {
              if (payload.status && contactInstance.status !== payload.status) {
                contactInstance.status = payload.status;
                await contactInstance.save();
              }
              break;
            }
            case 'assign_to': {
              if (payload.assignTo) {
                contactInstance.assignedTo = payload.assignTo;
                await contactInstance.save();
              }
              break;
            }
            case 'add_note': {
              if (payload.noteText) {
                contactInstance.notes.push({
                  text: payload.noteText,
                  createdBy: automation.createdBy || null
                });
                await contactInstance.save();
              }
              break;
            }
            case 'set_follow_up': {
              if (payload.followUpDays) {
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + parseInt(payload.followUpDays));
                contactInstance.followUpAt = followUpDate;
                await contactInstance.save();
              }
              break;
            }
          }

          if (msgSent) {
            const savedMsg = await Message.create(messageData);
            
            // Update contact with last outgoing message preview
            const preview = messageData.type === 'text' ? messageData.content.body?.substring(0, 100) : `${messageData.type} message`;
            contactInstance.lastMessageAt = new Date();
            contactInstance.lastMessagePreview = preview;
            contactInstance.lastMessageDirection = 'outgoing';
            await contactInstance.save();

            // Emit new message event via socket
            if (this.io) {
              const populated = await Message.findById(savedMsg._id).populate('contact');
              this.io.emit('new_message', { message: populated, contact: contactInstance });
            }
          }

          // Emit updated contact details via socket
          if (this.io) {
            this.io.emit('contact_updated', contactInstance);
          }

        } catch (actionErr) {
          logger.error(`Failed action type ${action.type}: ${actionErr.message}`);
          isSuccess = false;
        }
      }

      // Update statistics
      if (isSuccess) {
        automation.stats.executed = (automation.stats.executed || 0) + 1;
      } else {
        automation.stats.failed = (automation.stats.failed || 0) + 1;
      }
      await automation.save();

    } catch (err) {
      logger.error(`Error executing actions for automation ${automation._id}: ${err.message}`);
    }
  }
}

module.exports = new AutomationService();
