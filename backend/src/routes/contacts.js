const express = require('express');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/contacts — List all contacts
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status,
      tags,
      assignedTo,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (assignedTo) filter.assignedTo = assignedTo;

    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .populate('assignedTo', 'name avatar')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contacts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name avatar')
      .populate('notes.createdBy', 'name');

    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts
router.post('/', auth, async (req, res) => {
  try {
    const { phone, name, email, tags, status, customFields } = req.body;

    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const existing = await Contact.findOne({ phone });
    if (existing) return res.status(400).json({ error: 'Contact with this phone already exists' });

    const contact = await Contact.create({
      phone,
      name: name || '',
      email: email || '',
      tags: tags || [],
      status: status || 'not_connected',
      customFields: customFields || {},
      source: 'manual'
    });

    res.status(201).json({ contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/contacts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const allowed = ['name', 'email', 'tags', 'status', 'assignedTo', 'customFields', 'followUpAt', 'isOptedIn'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const contact = await Contact.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignedTo', 'name avatar');

    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts/:id/notes — Add note
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    contact.notes.push({
      text: req.body.text,
      createdBy: req.user._id
    });
    await contact.save();

    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts/bulk-update
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { contactIds, updates } = req.body;

    if (!contactIds || !contactIds.length) {
      return res.status(400).json({ error: 'No contacts selected' });
    }

    const allowed = ['status', 'assignedTo'];
    const safeUpdates = {};
    allowed.forEach(field => {
      if (updates[field] !== undefined) safeUpdates[field] = updates[field];
    });

    // Handle tags separately (add to existing)
    if (updates.addTags) {
      await Contact.updateMany(
        { _id: { $in: contactIds } },
        { $addToSet: { tags: { $each: updates.addTags } }, ...safeUpdates }
      );
    } else {
      await Contact.updateMany(
        { _id: { $in: contactIds } },
        safeUpdates
      );
    }

    res.json({ message: `${contactIds.length} contacts updated` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts/bulk-delete
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!contactIds || !contactIds.length) {
      return res.status(400).json({ error: 'No contacts selected' });
    }

    await Contact.deleteMany({ _id: { $in: contactIds } });
    res.json({ message: `${contactIds.length} contacts deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contacts/tags/all — Get all unique tags
router.get('/tags/all', auth, async (req, res) => {
  try {
    const tags = await Contact.distinct('tags');
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
