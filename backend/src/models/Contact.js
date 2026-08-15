const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  profilePicUrl: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: [
      'not_connected',
      'connected',
      'interested',
      'highly_interested',
      'not_interested',
      'course_joined',
      'workshop_joined',
      'center_visited',
      'online_mode',
      'follow_up'
    ],
    default: 'not_connected',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  notes: [{
    text: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  customFields: {
    type: Map,
    of: String,
    default: {}
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  lastMessagePreview: {
    type: String,
    default: ''
  },
  lastMessageDirection: {
    type: String,
    enum: ['incoming', 'outgoing', ''],
    default: ''
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  conversationCount: {
    type: Number,
    default: 0
  },
  isOptedIn: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['whatsapp', 'import', 'manual', 'campaign'],
    default: 'whatsapp'
  },
  followUpAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
contactSchema.index({ tags: 1 });
contactSchema.index({ lastMessageAt: -1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Contact', contactSchema);
