const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'template', 'interactive', 'button', 'reaction', 'contacts', 'unknown'],
    default: 'text'
  },
  content: {
    // For text messages
    body: { type: String, default: '' },

    // For media messages
    mediaUrl: { type: String, default: '' },
    mediaId: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    caption: { type: String, default: '' },
    filename: { type: String, default: '' },

    // For location
    latitude: Number,
    longitude: Number,
    locationName: { type: String, default: '' },
    locationAddress: { type: String, default: '' },

    // For template
    templateName: { type: String, default: '' },
    templateLanguage: { type: String, default: '' },

    // For interactive (button/list replies)
    buttonReplyId: { type: String, default: '' },
    buttonReplyTitle: { type: String, default: '' },
    listReplyId: { type: String, default: '' },
    listReplyTitle: { type: String, default: '' },
    listReplyDescription: { type: String, default: '' }
  },
  // Meta WhatsApp message ID
  metaMessageId: {
    type: String,
    default: '',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  statusTimestamps: {
    sent: Date,
    delivered: Date,
    read: Date,
    failed: Date
  },
  errorMessage: {
    type: String,
    default: ''
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient chat loading
messageSchema.index({ contact: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
