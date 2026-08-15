const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.apiUrl = env.META_API_URL;
    this.headers = env.META_HEADERS;
  }

  // Check if API is configured
  _checkConfig() {
    if (!env.isMetaConfigured()) {
      logger.warn('WhatsApp API not configured — using placeholder tokens. Messages will not be sent.');
      return false;
    }
    return true;
  }

  // Send Text Message
  async sendText(to, text) {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured', to, text };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: true, body: text }
      }, { headers: this.headers });

      logger.message('outgoing', to, 'text');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send text to ${to}: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Send Image
  async sendImage(to, imageUrl, caption = '') {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link: imageUrl, caption }
      }, { headers: this.headers });

      logger.message('outgoing', to, 'image');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send image to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Send Document
  async sendDocument(to, documentUrl, filename, caption = '') {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { link: documentUrl, filename, caption }
      }, { headers: this.headers });

      logger.message('outgoing', to, 'document');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send document to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Send Video
  async sendVideo(to, videoUrl, caption = '') {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'video',
        video: { link: videoUrl, caption }
      }, { headers: this.headers });

      logger.message('outgoing', to, 'video');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send video to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Send Location
  async sendLocation(to, latitude, longitude, name = '', address = '') {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'location',
        location: { latitude, longitude, name, address }
      }, { headers: this.headers });

      logger.message('outgoing', to, 'location');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send location to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Send Template Message
  async sendTemplate(to, templateName, languageCode = 'en', components = []) {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
        }
      };

      if (components.length > 0) {
        payload.template.components = components;
      }

      const response = await axios.post(`${this.apiUrl}/messages`, payload, { headers: this.headers });
      logger.message('outgoing', to, 'template');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send template to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Send Interactive Button Message
  async sendButtons(to, bodyText, buttons, headerText = '', footerText = '') {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const interactive = {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((btn, i) => ({
            type: 'reply',
            reply: { id: `btn_${i}_${Date.now()}`, title: btn.substring(0, 20) }
          }))
        }
      };

      if (headerText) interactive.header = { type: 'text', text: headerText };
      if (footerText) interactive.footer = { text: footerText };

      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive
      }, { headers: this.headers });

      logger.message('outgoing', to, 'interactive_button');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send buttons to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Send Interactive List Message
  async sendList(to, bodyText, buttonText, sections, headerText = '', footerText = '') {
    if (!this._checkConfig()) {
      return { mock: true, message: 'API not configured' };
    }

    try {
      const interactive = {
        type: 'list',
        body: { text: bodyText },
        action: { button: buttonText, sections }
      };

      if (headerText) interactive.header = { type: 'text', text: headerText };
      if (footerText) interactive.footer = { text: footerText };

      const response = await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive
      }, { headers: this.headers });

      logger.message('outgoing', to, 'interactive_list');
      return response.data;
    } catch (error) {
      logger.error(`Failed to send list to ${to}: ${error.message}`);
      throw error;
    }
  }

  // Mark Message as Read
  async markAsRead(messageId) {
    if (!this._checkConfig()) return { mock: true };

    try {
      await axios.post(`${this.apiUrl}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      }, { headers: this.headers });
      return { success: true };
    } catch (error) {
      logger.error(`Failed to mark as read: ${error.message}`);
      throw error;
    }
  }

  // Get Media URL (for downloading incoming media)
  async getMediaUrl(mediaId) {
    if (!this._checkConfig()) return { mock: true };

    try {
      const response = await axios.get(
        `https://graph.facebook.com/${env.META_API_VERSION}/${mediaId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get media URL: ${error.message}`);
      throw error;
    }
  }

  // Download Media
  async downloadMedia(mediaUrl) {
    if (!this._checkConfig()) return { mock: true };

    try {
      const response = await axios.get(mediaUrl, {
        headers: { 'Authorization': `Bearer ${env.META_ACCESS_TOKEN}` },
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to download media: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
