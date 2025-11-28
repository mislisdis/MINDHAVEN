// src/chatbot/conversationLoop.js
const analyzeEmotion = require('../modules/emotionAnalyzer');
const generateResponse = require('../modules/responseGenerator');
const recommendForEmotion = require('../modules/resourceRecommender');
const ChatHistory = require('../models/ChatHistory');
const Message = require('../models/Message');
const { createMemory, queryMemory } = require('../modules/vectorMemory');
const checkForCrisis = require('../modules/safetyFilter');  // FIXED ❗ no getSafetyLevel

class ConversationLoop {
  constructor() {
    this.context = {}; // userId -> { history: [], lastEmotion: "" }
  }

  // Load last 200 messages for a user
  async loadLongTermMemory(userId) {
    try {
      const msgs = await Message.find({ chatUserId: userId })
        .sort({ createdAt: -1 })
        .limit(200);

      if (!msgs.length)
        return { dominantEmotion: "neutral", messageCount: 0, recentTopics: [] };

      const emotionCount = {};
      msgs.forEach(m => {
        const e = (m.emotion || "neutral").toLowerCase();
        emotionCount[e] = (emotionCount[e] || 0) + 1;
      });

      const dominantEmotion =
        Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0][0] ||
        "neutral";

      return {
        dominantEmotion,
        messageCount: msgs.length,
        recentTopics: msgs.slice(0, 5).map(m => m.text)
      };
    } catch (err) {
      console.error("Long-term memory error:", err.message);
      return { dominantEmotion: "neutral", messageCount: 0, recentTopics: [] };
    }
  }

  // Last 3 messages for context
  summarizeContext(history) {
    if (!history || history.length < 2) return null;
    return history.slice(-3).map(h => h.message).join(" → ");
  }

  // Basic conversational cues
  handleCues(message) {
    const msg = message.toLowerCase();

    if (/(hi|hello|hey|good morning|good afternoon|good evening)/.test(msg)) {
      return "Hi! It’s good to hear from you. How are you feeling today? 💛";
    }

    if (/(thank you|thanks|thx)/.test(msg)) {
      return "You're really welcome. Is there anything else on your mind? 😊";
    }

    if (/(bye|goodbye|see you)/.test(msg)) {
      return "Bye for now — take care of yourself. I’m here anytime you want to talk. 🤍";
    }

    return null;
  }

  // Main message processor
  async processMessage(message, userId = null) {
    try {
      if (!message || typeof message !== "string")
        throw new Error("Invalid message");

      const ctxKey = userId || "guest";
      if (!this.context[ctxKey])
        this.context[ctxKey] = { history: [], lastEmotion: "neutral" };

      const userCtx = this.context[ctxKey];

      // ---------------- SAFETY CHECK ----------------
      const crisis = checkForCrisis(message);
      const safetyLevel = crisis.level; // FIXED ❗

      if (safetyLevel === 2) {
        return {
          emotion: "sadness",
          reply:
            "I'm really glad you told me this. What you're feeling is serious, and you deserve real support right now.\n\n" +
            "❤️ Please reach out to someone who can help keep you safe:\n" +
            "📞 Kenya Lifeline Hotline: 1199\n" +
            "💛 Befrienders Kenya: https://www.befrienders.org\n\n" +
            "You’re not alone. I’m here with you.",
          resources: [],
          context: null,
          meta: { severity: "high", tone: "calm" }
        };
      }

      if (safetyLevel === 1) {
        return {
          emotion: "sadness",
          reply:
            "I hear you… and it sounds like you're carrying something heavy. If you’re comfortable, we can talk about it. What happened?",
          resources: [],
          context: null,
          meta: { severity: "medium", tone: "warm" }
        };
      }

      // ---------------- Conversational cues ----------------
      const cueReply = this.handleCues(message);
      if (cueReply) {
        return {
          emotion: "neutral",
          reply: cueReply,
          resources: [],
          context: null,
          meta: { severity: "low", tone: "friendly" }
        };
      }

      // ---------------- Emotion Detection ----------------
      const { emotion, confidence } = await analyzeEmotion(message);

      // Short-term context
      const tempHistory = [...userCtx.history, { message }];
      const shortContext = this.summarizeContext(tempHistory);

      // Long-term memory
      const longTerm = userId ? await this.loadLongTermMemory(userId) : null;

      // Vector memory
      if (userId) {
        try {
          await createMemory(
            userId,
            `${emotion} — ${message.slice(0, 200)}`,
            { source: "auto" }
          );
        } catch (_) {}
      }

      const relatedMemories = userId
        ? await queryMemory(userId, message, 3)
        : [];

      // ---------------- AI Response ----------------
      const genResult = await generateResponse(
        { emotion, confidence },
        shortContext,
        { ...longTerm, relatedMemories },
        {
          personality: (longTerm && longTerm.personality) || "warm",
          rawMessage: message
        }
      );

      const replyText =
        genResult?.reply ||
        "I’m here with you. Can you tell me a bit more about what you mean?";
      const meta = genResult?.meta || {};

      // ---------------- Resource Recommendations ----------------
      const resources = recommendForEmotion(emotion);

      // ---------------- Save message ----------------
      await ChatHistory.create({
        userId: userId || null,
        message,
        botReply: replyText,
        emotion,
        meta: { resourcesReturned: resources.length, ...meta }
      });

      // Update memory
      userCtx.history.push({
        message,
        reply: replyText,
        emotion,
        createdAt: new Date()
      });

      if (userCtx.history.length > 8) userCtx.history.shift();

      return {
        emotion,
        reply: replyText,
        resources,
        context: shortContext,
        meta
      };
    } catch (err) {
      console.error("ConversationLoop error:", err.message);

      return {
        emotion: "neutral",
        reply: "Sorry — something went wrong while processing that. Could you try again?",
        resources: [],
        context: null
      };
    }
  }

  getRecentHistory(userId = null) {
    return this.context[userId || "guest"]?.history || [];
  }

  clearContext(userId = null) {
    delete this.context[userId || "guest"];
  }
}

module.exports = new ConversationLoop();
