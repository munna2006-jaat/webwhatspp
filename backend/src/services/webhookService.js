const Contact = require('../models/Contact');
const Message = require('../models/Message');
const logger = require('../utils/logger');

class WebhookService {
  constructor(io) {
    this.io = io;
  }

  // Main entry point for processing webhook payloads
  async processWebhook(body) {
    if (!body.entry) return;

    for (const entry of body.entry) {
      for (const change of (entry.changes || [])) {
        const value = change.value;

        if (value.messages) {
          for (const message of value.messages) {
            await this.processIncomingMessage(message, value.contacts);
          }
        }

        if (value.statuses) {
          for (const status of value.statuses) {
            await this.processStatusUpdate(status);
          }
        }
      }
    }
  }

  // Process incoming message
  async processIncomingMessage(message, contacts) {
    try {
      const from = message.from;
      const contactInfo = contacts?.find(c => c.wa_id === from);
      const profileName = contactInfo?.profile?.name || '';

      logger.message('incoming', from, message.type);

      // Find or create contact
      let contact = await Contact.findOne({ phone: from });
      if (!contact) {
        contact = await Contact.create({
          phone: from,
          name: profileName,
          status: 'not_connected',
          source: 'whatsapp',
          isOptedIn: true
        });
        logger.info(`New contact created: ${from} (${profileName})`);
      } else if (profileName && !contact.name) {
        contact.name = profileName;
      }

      // Parse message content
      const content = this._parseMessageContent(message);

      // Save message to database
      const savedMessage = await Message.create({
        contact: contact._id,
        direction: 'incoming',
        type: message.type || 'text',
        content,
        metaMessageId: message.id,
        status: 'delivered',
        timestamp: new Date(parseInt(message.timestamp) * 1000)
      });

      // Update contact
      contact.lastMessageAt = new Date();
      contact.lastMessagePreview = this._getMessagePreview(message);
      contact.lastMessageDirection = 'incoming';
      contact.unreadCount = (contact.unreadCount || 0) + 1;
      contact.conversationCount = (contact.conversationCount || 0) + 1;
      await contact.save();

      // Emit real-time event via Socket.io
      if (this.io) {
        const populatedMessage = await Message.findById(savedMessage._id).populate('contact');
        this.io.emit('new_message', {
          message: populatedMessage,
          contact: contact
        });
        this.io.emit('contact_updated', contact);
      }

      return { contact, message: savedMessage };
    } catch (error) {
      logger.error(`Error processing incoming message: ${error.message}`);
      throw error;
    }
  }

  // Process status updates (sent, delivered, read)
  async processStatusUpdate(status) {
    try {
      const messageId = status.id;
      const newStatus = status.status; // sent, delivered, read, failed

      const message = await Message.findOne({ metaMessageId: messageId });
      if (!message) return;

      message.status = newStatus;
      if (!message.statusTimestamps) message.statusTimestamps = {};
      message.statusTimestamps[newStatus] = new Date(parseInt(status.timestamp) * 1000);

      if (status.errors) {
        message.status = 'failed';
        message.errorMessage = status.errors[0]?.message || 'Unknown error';
      }

      await message.save();

      // Emit status update via Socket.io
      if (this.io) {
        this.io.emit('message_status', {
          messageId: message._id,
          metaMessageId: messageId,
          contactId: message.contact,
          status: message.status
        });
      }

      logger.info(`Message ${messageId} status: ${newStatus}`);
    } catch (error) {
      logger.error(`Error processing status update: ${error.message}`);
    }
  }

  // Parse message content based on type
  _parseMessageContent(message) {
    const content = {};

    switch (message.type) {
      case 'text':
        content.body = message.text?.body || '';
        break;
      case 'image':
        content.mediaId = message.image?.id || '';
        content.mimeType = message.image?.mime_type || '';
        content.caption = message.image?.caption || '';
        break;
      case 'video':
        content.mediaId = message.video?.id || '';
        content.mimeType = message.video?.mime_type || '';
        content.caption = message.video?.caption || '';
        break;
      case 'audio':
        content.mediaId = message.audio?.id || '';
        content.mimeType = message.audio?.mime_type || '';
        break;
      case 'document':
        content.mediaId = message.document?.id || '';
        content.mimeType = message.document?.mime_type || '';
        content.filename = message.document?.filename || '';
        content.caption = message.document?.caption || '';
        break;
      case 'sticker':
        content.mediaId = message.sticker?.id || '';
        content.mimeType = message.sticker?.mime_type || '';
        break;
      case 'location':
        content.latitude = message.location?.latitude;
        content.longitude = message.location?.longitude;
        content.locationName = message.location?.name || '';
        content.locationAddress = message.location?.address || '';
        break;
      case 'button':
        content.body = message.button?.text || '';
        content.buttonReplyId = message.button?.payload || '';
        break;
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          content.buttonReplyId = message.interactive.button_reply?.id || '';
          content.buttonReplyTitle = message.interactive.button_reply?.title || '';
          content.body = content.buttonReplyTitle;
        } else if (message.interactive?.type === 'list_reply') {
          content.listReplyId = message.interactive.list_reply?.id || '';
          content.listReplyTitle = message.interactive.list_reply?.title || '';
          content.listReplyDescription = message.interactive.list_reply?.description || '';
          content.body = content.listReplyTitle;
        }
        break;
      case 'reaction':
        content.body = message.reaction?.emoji || '';
        break;
      default:
        content.body = JSON.stringify(message);
    }

    return content;
  }

  // Get a short preview of the message for the chat list
  _getMessagePreview(message) {
    switch (message.type) {
      case 'text': return message.text?.body?.substring(0, 100) || '';
      case 'image': return '📷 Photo' + (message.image?.caption ? `: ${message.image.caption.substring(0, 50)}` : '');
      case 'video': return '🎥 Video';
      case 'audio': return '🎵 Audio';
      case 'document': return `📄 ${message.document?.filename || 'Document'}`;
      case 'sticker': return '🏷️ Sticker';
      case 'location': return `📍 ${message.location?.name || 'Location'}`;
      case 'button': return message.button?.text || 'Button reply';
      case 'interactive': return message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Interactive reply';
      default: return 'Message';
    }
  }
}

module.exports = WebhookService;
