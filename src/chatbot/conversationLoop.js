// src/chatbot/conversationLoop.js

const analyzeEmotion = require('../modules/emotionAnalyzer');
const generateResponse = require('../modules/responseGenerator');
const recommendForEmotion = require('../modules/resourceRecommender');
const ChatHistory = require('../models/ChatHistory');

/**
 * Handles a full user ↔ bot conversation cycle.
 * Maintains short-term memory of the last few messages.
 */
class ConversationLoop {
  constructor() {
    this.context = {}; // store userId -> { history: [], lastEmotion: '' }
  }

  /**
   * Process a user message and return bot response.
   * @param {string} message - user message
   * @param {string} userId - optional user id
   * @returns {Promise<{emotion: string, reply: string, resources: Array}>}
   */
  
  async processMessage(message, userId = null) {
    try {
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message');
      }

      // Initialize context for user if not present
      if (!this.context[userId || 'guest']) {
        this.context[userId || 'guest'] = { history: [], lastEmotion: 'neutral' };
      }

      const userCtx = this.context[userId || 'guest'];

      // ✳️ Analyze emotion using your Flask model API
      const emotion = await analyzeEmotion(message);

      // 🧩 Generate empathetic reply (include short context summary if available)
      const tempHistory = userCtx.history.concat({ message });
      const replyContext = this.summarizeContext(tempHistory);
      const reply = generateResponse(emotion, replyContext);

      // 📚 Recommend relevant resources
      const resources = recommendForEmotion(emotion);

      // 🗃️ Save conversation to database
      const record = new ChatHistory({
        userId: userId || null,
        message,
        botReply: reply,
        emotion,
        meta: { resourcesReturned: resources.length }
      });
      await record.save();

      // 🧠 Update in-memory conversation context
      userCtx.history.push({ message, reply, emotion });
      userCtx.lastEmotion = emotion;

      // Keep only the last 5 messages
      if (userCtx.history.length > 5) userCtx.history.shift();

      const contextSummary = this.summarizeContext(userCtx.history);

      return {
        emotion,
        reply,
        resources,
        context: contextSummary
      };
    } catch (err) {
      console.error('ConversationLoop error:', err.message);
      return {
        emotion: 'neutral',
        reply: "Sorry — I had trouble processing that. Could you try again?",
        resources: []
      };
    }
  }

  /**
   * Retrieve recent messages for a user.
   */
  getRecentHistory(userId = null) {
    const userCtx = this.context[userId || 'guest'];
    return userCtx ? userCtx.history : [];
  }

  /**
   * Clear conversation context for a user (optional).
   */
  clearContext(userId = null) {
    delete this.context[userId || 'guest'];
  }

  summarizeContext(history) {
    if (!history || history.length === 0) return null;
    const last = history.slice(-3).map(h => h.message);
    return last.join(" → ");
  }
}

module.exports = new ConversationLoop();
