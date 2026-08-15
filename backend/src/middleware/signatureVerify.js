const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');

const verifyWebhookSignature = (req, res, buf) => {
  // Skip signature verification if Meta is not configured
  if (!env.isMetaConfigured()) return;

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    logger.warn('Webhook request without signature');
    return;
  }

  const expectedSignature = 'sha256=' +
    crypto.createHmac('sha256', env.META_APP_SECRET)
          .update(buf)
          .digest('hex');

  if (signature !== expectedSignature) {
    logger.error('Webhook signature verification failed');
    throw new Error('Invalid webhook signature');
  }
};

module.exports = verifyWebhookSignature;
