const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Automation name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  trigger: {
    type: String,
    enum: [
      'keyword',          // Specific keyword in message
      'first_message',    // First time contact messages
      'off_hours',        // Message received outside working hours
      'tag_change',       // Contact tag is changed
      'status_change',    // Contact status changes
      'no_reply',         // Contact hasn't replied in X time
      'follow_up_due'     // Scheduled follow-up time reached
    ],
    required: true
  },
  // Conditions to match
  conditions: {
    keywords: [String],                         // For keyword trigger
    matchType: {                                // How to match keywords
      type: String,
      enum: ['exact', 'contains', 'starts_with'],
      default: 'contains'
    },
    caseSensitive: { type: Boolean, default: false },
    fromTags: [String],                         // Only for contacts with these tags
    fromStatuses: [String],                     // Only for contacts with these statuses
    delayMinutes: { type: Number, default: 0 }  // Delay before executing action
  },
  // Actions to perform
  actions: [{
    type: {
      type: String,
      enum: [
        'send_text',          // Send text message
        'send_template',      // Send template message
        'send_image',         // Send image
        'send_document',      // Send document
        'send_buttons',       // Send button message
        'send_list',          // Send list message
        'add_tag',            // Add tag to contact
        'remove_tag',         // Remove tag from contact
        'change_status',      // Change contact status
        'assign_to',          // Assign to team member
        'add_note',           // Add note to contact
        'set_follow_up'       // Set follow-up date
      ],
      required: true
    },
    // Action payload (depends on type)
    payload: {
      text: String,
      templateName: String,
      templateLanguage: String,
      templateParams: [String],
      imageUrl: String,
      caption: String,
      documentUrl: String,
      filename: String,
      buttons: [String],
      listSections: mongoose.Schema.Types.Mixed,
      tag: String,
      status: String,
      assignTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      noteText: String,
      followUpDays: Number
    },
    delaySeconds: { type: Number, default: 0 }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0  // Higher = processed first
  },
  stats: {
    triggered: { type: Number, default: 0 },
    executed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Automation', automationSchema);
