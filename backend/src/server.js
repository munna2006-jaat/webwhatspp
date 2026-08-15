// Fix local DNS issues with MongoDB Atlas SRV resolution
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const signatureVerify = require('./middleware/signatureVerify');
const WebhookService = require('./services/webhookService');

// Import routes
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const campaignRoutes = require('./routes/campaigns');
const automationRoutes = require('./routes/automations');
const teamRoutes = require('./routes/team');
const settingsRoutes = require('./routes/settings');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Initialize WebhookService with Socket.io
const webhookService = new WebhookService(io);
webhookRoutes.setWebhookService(webhookService);
messageRoutes.setIo(io);

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Parse JSON with signature verification for webhook route
app.use('/webhook', express.json({
  verify: (req, res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf;
    try {
      signatureVerify(req, res, buf);
    } catch (err) {
      logger.error('Signature verification failed');
    }
  }
}));

// Regular JSON parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    metaConfigured: env.isMetaConfigured(),
    version: '1.0.0'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_conversation', (contactId) => {
    socket.join(`conversation_${contactId}`);
    logger.info(`Socket ${socket.id} joined conversation_${contactId}`);
  });

  socket.on('leave_conversation', (contactId) => {
    socket.leave(`conversation_${contactId}`);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    logger.success(`🚀 WaCRM Server running on port ${env.PORT}`);
    logger.info(`📡 Webhook URL: http://localhost:${env.PORT}/webhook`);
    logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
    logger.info(`📊 Health check: http://localhost:${env.PORT}/api/health`);

    if (!env.isMetaConfigured()) {
      logger.warn('⚠️  WhatsApp API not configured — running in DEMO mode');
      logger.warn('   Update .env with your Meta API credentials to enable messaging');
    }
  });
};

startServer();
