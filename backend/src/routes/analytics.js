const express = require('express');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '14d', teamMember } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
      case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '14d': startDate = new Date(now - 14 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      case 'all': startDate = new Date(0); break;
      default: startDate = new Date(now - 14 * 24 * 60 * 60 * 1000);
    }

    const filter = {};
    const periodFilter = { createdAt: { $gte: startDate } };
    if (teamMember) {
      filter.assignedTo = teamMember;
      periodFilter.assignedTo = teamMember;
    }

    // All-time stats
    const totalDatabase = await Contact.countDocuments(filter);

    // Period stats
    const newLeads = await Contact.countDocuments({ ...filter, ...periodFilter });

    // Status-based counts
    const statusCounts = await Contact.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    // Connected calls (contacts with status = 'connected')
    const connectedCalls = statusMap['connected'] || 0;

    // Untouched leads (no messages sent)
    const untouchedLeads = await Contact.countDocuments({
      ...filter,
      lastMessageAt: null
    });

    // Due follow-ups
    const dueFollowUps = await Contact.countDocuments({
      ...filter,
      followUpAt: { $lte: new Date() }
    });

    res.json({
      stats: {
        totalDatabase,
        newLeads,
        connectedCalls,
        notConnected: statusMap['not_connected'] || 0,
        untouchedLeads,
        dueFollowUps,
        centerVisited: statusMap['center_visited'] || 0,
        highlyInterested: statusMap['highly_interested'] || 0,
        courseJoined: statusMap['course_joined'] || 0,
        workshopJoined: statusMap['workshop_joined'] || 0,
        interested: statusMap['interested'] || 0,
        notInterested: statusMap['not_interested'] || 0,
        onlineMode: statusMap['online_mode'] || 0
      },
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/pipeline
router.get('/pipeline', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily contact acquisition
    const dailyLeads = await Contact.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get daily follow-ups scheduled
    const dailyFollowUps = await Contact.aggregate([
      { $match: { followUpAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$followUpAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get daily successful joins
    const dailyJoins = await Contact.aggregate([
      {
        $match: {
          status: { $in: ['course_joined', 'workshop_joined'] },
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing dates
    const allDates = [];
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d).toISOString().split('T')[0]);
    }

    const leadsMap = Object.fromEntries(dailyLeads.map(d => [d._id, d.count]));
    const followUpsMap = Object.fromEntries(dailyFollowUps.map(d => [d._id, d.count]));
    const joinsMap = Object.fromEntries(dailyJoins.map(d => [d._id, d.count]));

    const pipeline = allDates.map(date => ({
      date,
      acquiredLeads: leadsMap[date] || 0,
      scheduledFollowUps: followUpsMap[date] || 0,
      successfulJoins: joinsMap[date] || 0
    }));

    res.json({ pipeline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/messages — Message stats
router.get('/messages', auth, async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const incoming = await Message.countDocuments({ direction: 'incoming' });
    const outgoing = await Message.countDocuments({ direction: 'outgoing' });

    const statusCounts = await Message.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalMessages,
      incoming,
      outgoing,
      statuses: Object.fromEntries(statusCounts.map(s => [s._id, s.count]))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
