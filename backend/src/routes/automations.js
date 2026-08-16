const express = require('express');
const Automation = require('../models/Automation');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/automations
router.get('/', auth, async (req, res) => {
  try {
    const workspaceId = req.user.workspace?._id || req.user.workspace;
    const query = workspaceId ? {
      $or: [
        { workspace: workspaceId },
        { workspace: null },
        { workspace: { $exists: false } }
      ]
    } : {};
    
    const automations = await Automation.find(query).populate('createdBy', 'name').sort({ priority: -1 });
    res.json({ automations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/automations
router.post('/', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const workspaceId = req.user.workspace?._id || req.user.workspace;
    const automation = await Automation.create({
      ...req.body,
      createdBy: req.user._id,
      workspace: workspaceId
    });
    res.status(201).json({ automation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/automations/:id
router.put('/:id', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const automation = await Automation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ automation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/automations/:id/toggle
router.put('/:id/toggle', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    automation.isActive = !automation.isActive;
    await automation.save();
    res.json({ automation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/automations/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    await Automation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Automation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
