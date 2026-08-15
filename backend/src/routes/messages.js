const express = require('express');
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const whatsappService = require('../services/whatsappService');
const auth = require('../middleware/auth');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|csv/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

const router = express.Router();

// Socket.io instance (set from server.js)
let io = null;
router.setIo = (socketIo) => { io = socketIo; };

// GET /api/messages/conversations/list — Get all conversations (for chat list)
// NOTE: This must be defined BEFORE /:contactId to avoid Express matching "conversations" as a contactId
router.get('/conversations/list', auth, async (req, res) => {
  try {
    const { search = '' } = req.query;

    const filter = { lastMessageAt: { $ne: null } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(filter)
      .populate('assignedTo', 'name avatar')
      .sort({ lastMessageAt: -1 })
      .limit(100);

    res.json({ conversations: contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/:contactId — Get chat history
router.get('/:contactId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ contact: req.params.contactId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sentBy', 'name avatar');

    const total = await Message.countDocuments({ contact: req.params.contactId });

    // Return in chronological order for display
    res.json({
      messages: messages.reverse(),
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

// POST /api/messages/send — Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { contactId, type, content } = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    let metaResponse;
    const messageData = {
      contact: contact._id,
      direction: 'outgoing',
      type,
      content: {},
      sentBy: req.user._id,
      status: 'pending',
      timestamp: new Date()
    };

    switch (type) {
      case 'text':
        metaResponse = await whatsappService.sendText(contact.phone, content.body);
        messageData.content.body = content.body;
        break;
      case 'image':
        metaResponse = await whatsappService.sendImage(contact.phone, content.mediaUrl, content.caption);
        messageData.content.mediaUrl = content.mediaUrl;
        messageData.content.caption = content.caption || '';
        break;
      case 'document':
        metaResponse = await whatsappService.sendDocument(contact.phone, content.mediaUrl, content.filename, content.caption);
        messageData.content.mediaUrl = content.mediaUrl;
        messageData.content.filename = content.filename || '';
        messageData.content.caption = content.caption || '';
        break;
      case 'template':
        metaResponse = await whatsappService.sendTemplate(
          contact.phone,
          content.templateName,
          content.templateLanguage || 'en',
          content.components || []
        );
        messageData.content.templateName = content.templateName;
        messageData.content.templateLanguage = content.templateLanguage || 'en';
        break;
      case 'interactive':
        if (content.interactiveType === 'button') {
          metaResponse = await whatsappService.sendButtons(
            contact.phone, content.body, content.buttons, content.header, content.footer
          );
        } else {
          metaResponse = await whatsappService.sendList(
            contact.phone, content.body, content.buttonText, content.sections, content.header, content.footer
          );
        }
        messageData.content.body = content.body;
        break;
      case 'location':
        metaResponse = await whatsappService.sendLocation(
          contact.phone, content.latitude, content.longitude, content.name, content.address
        );
        messageData.content = content;
        break;
      default:
        return res.status(400).json({ error: 'Invalid message type' });
    }

    // Save meta message ID
    if (metaResponse?.messages?.[0]?.id) {
      messageData.metaMessageId = metaResponse.messages[0].id;
      messageData.status = 'sent';
    } else if (metaResponse?.mock) {
      messageData.status = 'sent'; // Mock mode
      messageData.metaMessageId = `mock_${Date.now()}`;
    }

    const message = await Message.create(messageData);

    // Update contact
    const preview = type === 'text' ? content.body?.substring(0, 100) : `${type} message`;
    contact.lastMessageAt = new Date();
    contact.lastMessagePreview = preview;
    contact.lastMessageDirection = 'outgoing';
    await contact.save();

    // Emit via Socket.io
    if (io) {
      const populated = await Message.findById(message._id).populate('sentBy', 'name avatar');
      io.emit('new_message', { message: populated, contact });
      io.emit('contact_updated', contact);
    }

    // Update agent stats
    req.user.stats.totalMessagesSent = (req.user.stats.totalMessagesSent || 0) + 1;
    await req.user.save();

    res.json({ message, metaResponse: metaResponse?.mock ? { mock: true } : undefined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/mark-read — Mark conversation as read
router.post('/mark-read', auth, async (req, res) => {
  try {
    const { contactId } = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    contact.unreadCount = 0;
    await contact.save();

    // Mark as read on WhatsApp too
    const lastIncoming = await Message.findOne({
      contact: contactId,
      direction: 'incoming'
    }).sort({ timestamp: -1 });

    if (lastIncoming?.metaMessageId) {
      await whatsappService.markAsRead(lastIncoming.metaMessageId).catch(() => {});
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/upload — Upload a file (image/document/video)
router.post('/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Build the public URL for the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      url,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
