const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  templateName: {
    type: String,
    required: [true, 'Template name is required']
  },
  templateLanguage: {
    type: String,
    default: 'en'
  },
  templateParams: [{
    type: { type: String, default: 'text' },
    text: String
  }],
  // Audience filter criteria
  audience: {
    tags: [String],
    statuses: [String],
    dateRange: {
      from: Date,
      to: Date
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Target contacts (resolved from audience filter)
  targetContacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],
  scheduledAt: {
    type: Date,
    default: null
  },
  startedAt: Date,
  completedAt: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);
