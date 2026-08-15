const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'business', 'enterprise'],
    default: 'business'
  },
  // WhatsApp API Config
  phoneNumberId: {
    type: String,
    default: ''
  },
  accessToken: {
    type: String,
    default: ''
  },
  appSecret: {
    type: String,
    default: ''
  },
  businessAccountId: {
    type: String,
    default: ''
  },
  webhookVerifyToken: {
    type: String,
    default: ''
  },
  // Business Profile
  businessProfile: {
    about: { type: String, default: '' },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    vertical: { type: String, default: '' },
    logoUrl: { type: String, default: '' }
  },
  // Working Hours
  workingHours: {
    enabled: { type: Boolean, default: false },
    timezone: { type: String, default: 'Asia/Kolkata' },
    schedule: {
      monday:    { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, isWorking: { type: Boolean, default: true } },
      tuesday:   { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, isWorking: { type: Boolean, default: true } },
      wednesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, isWorking: { type: Boolean, default: true } },
      thursday:  { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, isWorking: { type: Boolean, default: true } },
      friday:    { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, isWorking: { type: Boolean, default: true } },
      saturday:  { start: { type: String, default: '09:00' }, end: { type: String, default: '14:00' }, isWorking: { type: Boolean, default: true } },
      sunday:    { start: { type: String, default: '00:00' }, end: { type: String, default: '00:00' }, isWorking: { type: Boolean, default: false } }
    }
  },
  // Quick Replies
  quickReplies: [{
    shortcut: String,
    title: String,
    message: String
  }],
  // Tags config (tag name → color mapping)
  tagColors: {
    type: Map,
    of: String,
    default: {}
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workspace', workspaceSchema);
