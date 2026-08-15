const express = require('express');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/campaigns
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('targetContacts', 'name phone status');
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns
router.post('/', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { name, description, templateName, templateLanguage, templateParams, audience, scheduledAt } = req.body;

    if (!name || !templateName) {
      return res.status(400).json({ error: 'Campaign name and template are required' });
    }

    // Resolve audience to contacts
    const contactFilter = {};
    if (audience?.tags?.length) contactFilter.tags = { $in: audience.tags };
    if (audience?.statuses?.length) contactFilter.status = { $in: audience.statuses };
    if (audience?.assignedTo) contactFilter.assignedTo = audience.assignedTo;
    if (audience?.dateRange?.from) contactFilter.createdAt = { $gte: new Date(audience.dateRange.from) };
    if (audience?.dateRange?.to) {
      contactFilter.createdAt = { ...contactFilter.createdAt, $lte: new Date(audience.dateRange.to) };
    }

    const targetContacts = await Contact.find(contactFilter).select('_id');

    const campaign = await Campaign.create({
      name,
      description,
      templateName,
      templateLanguage: templateLanguage || 'en',
      templateParams: templateParams || [],
      audience: audience || {},
      targetContacts: targetContacts.map(c => c._id),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'draft',
      stats: { total: targetContacts.length },
      createdBy: req.user._id
    });

    res.status(201).json({ campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/campaigns/:id/status
router.put('/:id/status', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    campaign.status = status;
    if (status === 'running') campaign.startedAt = new Date();
    if (status === 'completed') campaign.completedAt = new Date();
    await campaign.save();

    // TODO: If status is 'running', add to Bull queue for processing

    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
