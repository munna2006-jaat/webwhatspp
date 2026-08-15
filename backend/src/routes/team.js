const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/team — List team members
router.get('/', auth, async (req, res) => {
  try {
    const members = await User.find({ workspace: req.user.workspace?._id || req.user.workspace })
      .select('-password')
      .sort({ role: 1, name: 1 });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/team — Add team member (admin only)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'agent',
      workspace: req.user.workspace?._id || req.user.workspace
    });

    res.status(201).json({ member: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/team/:id — Update member
router.put('/:id', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const updates = {};
    const allowed = ['name', 'role', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ member: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/team/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
