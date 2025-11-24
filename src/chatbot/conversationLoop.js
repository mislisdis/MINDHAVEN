// src/chatbot/conversationLoop.js
const analyzeEmotion = require('../modules/emotionAnalyzer');
const generateResponse = require('../modules/responseGenerator');
const recommendForEmotion = require('../modules/resourceRecommender');
const ChatHistory = require('../models/ChatHistory');
const Message = require('../models/Message');
const checkForCrisis = require('../modules/safetyFilter');
const { createMemory, queryMemory } = require('../modules/vectorMemory');

class ConversationLoop {
  constructor() {
    this.context = {}; // userId -> { history: [], lastEmotion: "" }
  }

  async loadLongTermMemory(userId) {
    try {
      // simple aggregation using messages
      const msgs = await Message.find({ userId }).sort({ createdAt: -1 }).limit(200);
      if (!msgs || msgs.length === 0) {
        return { dominantEmotion: "neutral", messageCount: 0, recentTopics: [] };
      }
      const emotionCount = {};
      msgs.forEach(m => {
        const e = (m.emotion || "neutral").toLowerCase();
        emotionCount[e] = (emotionCount[e] || 0) + 1;
      });
      const dominantEmotion = Object.entries(emotionCount).sort((a,b) => b[1]-a[1])[0]?.[0] || "neutral";
      return {
        dominantEmotion,
        messageCount: msgs.length,
        recentTopics: msgs.slice(0,5).map(m=>m.text)
      };
    } catch (err) {
      console.error("Long-term memory error:", err.message);
      return { dominantEmotion: "neutral", messageCount: 0, recentTopics: [] };
    }
  }

  summarizeContext(history) {
    if (!history || history.length < 2) return null;
    const last = history.slice(-3).map(h => h.message);
    return last.join(" → ");
  }

  /**
   * The main entrypoint. Returns { emotion, reply, resources, context, meta }
   */
  async processMessage(message, userId = null) {
    try {
      if (!message || typeof message !== 'string') throw new Error('Invalid message');

      if (!this.context[userId || 'guest']) {
        this.context[userId || 'guest'] = { history: [], lastEmotion: 'neutral' };
      }
      const userCtx = this.context[userId || 'guest'];

      // safety check
      if (checkForCrisis(message)) {
        return {
          emotion: 'sadness',
          reply:
            "I’m really glad you told me that. What you're feeling matters — and you deserve real support right now.\n\n" +
            "📞 Kenya Lifeline Helpline: *1199*\n" +
            "📞 Befrienders Worldwide: https://www.befrienders.org\n\n" +
            "Please talk to someone who can help keep you safe. You are not alone.",
          resources: [],
          context: null,
          meta: { severity: 'high', tone: 'calm' }
        };
      }

      // analyze emotion & confidence
      const emotionResult = await analyzeEmotion(message); // { emotion, confidence }
      const { emotion, confidence } = emotionResult;

      // short context
      const tempHistory = userCtx.history.concat({ message });
      const shortContext = this.summarizeContext(tempHistory);

      // long-term memory
      const longTerm = userId ? await this.loadLongTermMemory(userId) : null;

      // vector memory: create an 'understanding' (NOT raw message)
      // Example: "User feels X about Y" or short summary
      const understanding = `${emotion} — ${message.slice(0, 200)}`; // keep short
      if (userId) {
        try { await createMemory(userId, understanding, { source: 'auto' }); } catch(e) { /* ignore */ }
      }

      // query vector memory for related understandings
      let relatedMemories = [];
      if (userId) {
        relatedMemories = await queryMemory(userId, message, 3);
      }

      // pass longTerm + additional memory summary into generator
      const genOptions = {
        personality: (longTerm && longTerm.personality) || 'warm' ,
        rawMessage: message        
      };

      const genResult = generateResponse(emotionResult, shortContext, { ...longTerm, relatedMemories }, genOptions);
      // genResult may be object { reply, meta }

      const replyText = (genResult && genResult.reply) ? genResult.reply : (typeof genResult === 'string' ? genResult : "Sorry, I didn't quite catch that.");
      const meta = (genResult && genResult.meta) ? genResult.meta : {};

      // resource recommendations
      const resources = recommendForEmotion(emotion);

      // store chat history
      const record = new ChatHistory({
        userId: userId || null,
        message,
        botReply: replyText,
        emotion,
        meta: { resourcesReturned: resources.length, ...meta }
      });
      await record.save();

      // update in-memory context
      userCtx.history.push({ message, reply: replyText, emotion, createdAt: new Date() });
      userCtx.lastEmotion = emotion;
      if (userCtx.history.length > 8) userCtx.history.shift();

      return {
        emotion,
        reply: replyText,
        resources,
        context: shortContext,
        meta
      };

    } catch (err) {
      console.error('ConversationLoop error:', err.message);
      return { emotion: 'neutral', reply: "Sorry — I had trouble processing that. Could you try again?", resources: [], context: null };
    }
  }

  getRecentHistory(userId = null) {
    const userCtx = this.context[userId || 'guest'];
    return userCtx ? userCtx.history : [];
  }

  clearContext(userId = null) {
    delete this.context[userId || 'guest'];
  }
}

module.exports = new ConversationLoop();
