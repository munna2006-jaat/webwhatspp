const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/wacrm',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Meta WhatsApp Cloud API
  META_API_VERSION: process.env.META_API_VERSION || 'v21.0',
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
  META_PHONE_NUMBER_ID: process.env.META_PHONE_NUMBER_ID,
  META_BUSINESS_ACCOUNT_ID: process.env.META_BUSINESS_ACCOUNT_ID,
  META_APP_SECRET: process.env.META_APP_SECRET,

  // Webhook
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'default_verify_token',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Derived
  get META_API_URL() {
    return `https://graph.facebook.com/${this.META_API_VERSION}/${this.META_PHONE_NUMBER_ID}`;
  },

  get META_HEADERS() {
    return {
      'Authorization': `Bearer ${this.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
  },

  isMetaConfigured() {
    return this.META_ACCESS_TOKEN &&
           this.META_ACCESS_TOKEN !== 'PLACEHOLDER_ACCESS_TOKEN' &&
           this.META_PHONE_NUMBER_ID &&
           this.META_PHONE_NUMBER_ID !== 'PLACEHOLDER_PHONE_NUMBER_ID';
  }
};

module.exports = env;
