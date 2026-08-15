const express = require('express');
const Workspace = require('../models/Workspace');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/settings
router.get('/', auth, async (req, res) => {
  try {
    const workspaceId = req.user.workspace?._id || req.user.workspace;
    let workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Mask access token for security
    const settings = workspace.toObject();
    if (settings.accessToken) {
      settings.accessToken = settings.accessToken.substring(0, 10) + '...' + settings.accessToken.slice(-4);
    }

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings — Update workspace settings
router.put('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const workspaceId = req.user.workspace?._id || req.user.workspace;
    const updates = {};
    const allowed = [
      'name', 'phoneNumberId', 'accessToken', 'appSecret',
      'businessAccountId', 'webhookVerifyToken',
      'businessProfile', 'workingHours', 'quickReplies', 'tagColors'
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const workspace = await Workspace.findByIdAndUpdate(workspaceId, updates, { new: true });
    res.json({ settings: workspace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/quick-replies — Add quick reply
router.post('/quick-replies', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const workspaceId = req.user.workspace?._id || req.user.workspace;
    const workspace = await Workspace.findById(workspaceId);

    workspace.quickReplies.push(req.body);
    await workspace.save();

    res.json({ quickReplies: workspace.quickReplies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/settings/quick-replies/:index
router.delete('/quick-replies/:index', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const workspaceId = req.user.workspace?._id || req.user.workspace;
    const workspace = await Workspace.findById(workspaceId);

    workspace.quickReplies.splice(req.params.index, 1);
    await workspace.save();

    res.json({ quickReplies: workspace.quickReplies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
