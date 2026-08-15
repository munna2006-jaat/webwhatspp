const express = require('express');
const env = require('../config/env');
const logger = require('../utils/logger');

const router = express.Router();

// This will be set from server.js after Socket.io is initialized
let webhookService = null;
router.setWebhookService = (service) => { webhookService = service; };

// GET /webhook — Meta Verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WEBHOOK_VERIFY_TOKEN) {
    logger.success('Webhook verified successfully!');
    return res.status(200).send(challenge);
  }

  logger.error('Webhook verification failed');
  return res.sendStatus(403);
});

// POST /webhook — Receive Messages & Status Updates
router.post('/', async (req, res) => {
  // Always respond 200 immediately — Meta requires fast response
  res.sendStatus(200);

  try {
    const body = req.body;

    if (!body.object || body.object !== 'whatsapp_business_account') {
      return;
    }

    if (webhookService) {
      await webhookService.processWebhook(body);
    } else {
      logger.warn('WebhookService not initialized — messages will not be processed');
    }
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
  }
});

module.exports = router;
