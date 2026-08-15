const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const auth = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

// POST /api/auth/signup — DISABLED (admin-only accounts)
router.post('/signup', (req, res) => {
  res.status(403).json({ error: 'Registration is disabled. Contact admin.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password').populate('workspace');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        workspace: user.workspace
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('workspace');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/me
router.put('/me', auth, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['name', 'avatar', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).populate('workspace');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
