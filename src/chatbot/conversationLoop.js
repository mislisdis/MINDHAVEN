<<<<<<< Updated upstream
// src/chatbot/conversationLoop.js

=======
// src/chatbot/conversationLoop.js - Upgraded with Local NLP, Emotional Memory, Rich Context
const fs = require('fs');
const path = require('path');
const { NlpManager } = require('node-nlp');
>>>>>>> Stashed changes
const analyzeEmotion = require('../modules/emotionAnalyzer');
const { generateResponse } = require('../modules/responseGenerator');
const { recommendResources } = require('../modules/resourceRecommender');
const ChatHistory = require('../models/ChatHistory');
<<<<<<< Updated upstream
=======
const Message = require('../models/Message');
const { createMemory, queryMemory } = require('../modules/vectorMemory');
const { checkForCrisis } = require('../modules/safetyFilter');
const moodTracker = require('../modules/moodTracker');

// Local NLP & Sentiment (optional)
let nlp = null, its = null, as = null, sentiment = null;
try {
  const winkNLP = require('wink-nlp');
  const model = require('wink-eng-lite-web-model');
  nlp = winkNLP(model);
  its = nlp.its;
  as = nlp.as;
  console.log('🧩 wink-nlp ready');
} catch (e) {
  console.warn('⚠️ wink-nlp not available:', e.message);
}
try {
  const Sentiment = require('sentiment');
  sentiment = new Sentiment();
  console.log('🧪 sentiment analyzer ready');
} catch (e) {
  console.warn('⚠️ sentiment lib not available:', e.message);
}

// Utility lowercase helper
const lc = (s) => (s || '').toLowerCase();

// Local NLP manager wrapper
class LocalNLP {
  constructor() {
    this.manager = new NlpManager({ languages: ['en'], forceNER: false });
    this.trained = false;
  }

  loadIntents(intentsPath) {
    try {
      const raw = fs.readFileSync(intentsPath, 'utf8');
      const data = JSON.parse(raw);
      let added = 0;

      // We support two shapes:
      // 1) { intentKey: { utterances: string[], answers?: string[] } }
      // 2) { intentKey: string[] } -> responses only (skip training, we can't infer utterances)
      Object.entries(data).forEach(([key, val]) => {
        if (val && typeof val === 'object' && !Array.isArray(val) && Array.isArray(val.utterances)) {
          val.utterances.forEach(u => {
            if (u && typeof u === 'string') {
              this.manager.addDocument('en', u, key);
              added++;
            }
          });
        }
      });

      // Add a small keyword fallback rule set for common conversational intents
      const fallback = [
        { intent: 'greetings', utterances: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'] },
        { intent: 'gratitude', utterances: ['thanks', 'thank you', 'appreciate it'] },
        { intent: 'farewell', utterances: ['bye', 'goodbye', 'see you', 'talk later'] },
        { intent: 'affirm', utterances: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'absolutely', 'definitely'] },
        { intent: 'deny', utterances: ['no', 'nope', 'nah', 'not really'] },
        { intent: 'exam_failure', utterances: ['i failed my exam', 'i failed my exams', 'i flunked', 'bad grades', 'poor results'] },
      ];
      fallback.forEach(({ intent, utterances }) => {
        utterances.forEach(u => this.manager.addDocument('en', u, intent));
      });

      return { added };
    } catch (err) {
      console.warn('⚠️ LocalNLP loadIntents failed:', err.message);
      return { added: 0 };
    }
  }

  async trainIfNeeded(intentsPath) {
    if (this.trained) return;
    this.loadIntents(intentsPath);
    await this.manager.train();
    this.manager.save();
    this.trained = true;
    console.log('🧩 Local NLP trained');
  }

  async classify(text) {
    if (!this.trained) return { intent: null, score: 0 };
    try {
      const res = await this.manager.process('en', text);
      const intent = res.intent && res.intent !== 'None' ? res.intent : null;
      const score = typeof res.score === 'number' ? res.score : 0;
      return { intent, score, raw: res };
    } catch (err) {
      return { intent: null, score: 0 };
    }
  }
}
>>>>>>> Stashed changes

/**
 * Handles a full user ↔ bot conversation cycle.
 * Maintains short-term memory of the last few messages.
 */
class ConversationLoop {
  constructor() {
<<<<<<< Updated upstream
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

      // 🧩 Generate empathetic reply
      const reply = generateResponse(emotion);

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

      return { emotion, reply, resources };
    } catch (err) {
      console.error('ConversationLoop error:', err.message);
      return {
        emotion: 'neutral',
        reply: "Sorry — I had trouble processing that. Could you try again?",
        resources: []
      };
=======
    this.context = {}; // userId -> { history: [], lastEmotion: '', messageCount: 0, emotionalMemory: {...}, carryEmotion: { emotion, remaining } }
    this.intentsPath = path.join(__dirname, '../../data/intents.json');
    this.localNLP = new LocalNLP();

    // Train local NLP asynchronously
    this.localNLP.trainIfNeeded(this.intentsPath).catch(err => {
      console.warn('⚠️ Local NLP training error:', err.message);
    });

    // Startup crisis self-test
    try {
      console.log('\n🔍 TESTING CRISIS DETECTION ON STARTUP...');
      const testMessages = ['hello', "i'm sad", 'I want to kill myself', 'kill myself', 'end my life'];
      testMessages.forEach(msg => {
        try {
          const result = checkForCrisis(msg);
          const level = (typeof result === 'object' && result.level !== undefined) ? result.level : result;
          console.log(`  "${msg}" -> Level: ${level}`);
        } catch (e) {
          console.log(`  "${msg}" -> Error: ${e.message}`);
        }
      });
      console.log('🔍 END CRISIS TEST\n');
    } catch (e) {
      console.warn('⚠️ Crisis test skipped:', e.message);
    }

    console.log('🧠 ConversationLoop initialized with local NLP + emotional memory');
  }

  // Keyword to emotion heuristic
  enhanceEmotionDetection(message) {
    if (!message || typeof message !== 'string') return null;
    const msg = lc(message.trim());
    const emotionKeywords = {
      yes: 'approval', no: 'disapproval', yeah: 'approval', yep: 'approval', nope: 'disapproval', sure: 'approval', okay: 'neutral', ok: 'neutral',
      fine: 'neutral', maybe: 'confusion', probably: 'optimism', definitely: 'optimism', absolutely: 'approval', never: 'disapproval', always: 'approval',
      sometimes: 'neutral', often: 'neutral', rarely: 'neutral', stressed: 'anxiety', stressing: 'anxiety', stressful: 'anxiety', overwhelmed: 'anxiety',
      anxious: 'anxiety', worried: 'fear', scared: 'fear', afraid: 'fear', terrified: 'fear', happy: 'joy', excited: 'excitement', joyful: 'joy',
      sad: 'sadness', unhappy: 'sadness', depressed: 'sadness', miserable: 'sadness', angry: 'anger', mad: 'anger', furious: 'anger', annoyed: 'annoyance',
      frustrated: 'anger', good: 'joy', great: 'joy', awesome: 'joy', amazing: 'joy', bad: 'sadness', terrible: 'sadness', awful: 'sadness',
      horrible: 'sadness', tired: 'fatigue', exhausted: 'fatigue', bored: 'neutral', lonely: 'sadness', alone: 'sadness', confused: 'confusion',
      lost: 'confusion', hopeful: 'optimism', hopeless: 'sadness'
    };
    const words = msg.split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^\w]/g, '');
      if (emotionKeywords[clean]) return emotionKeywords[clean];
    }
    for (const [keyword, emotion] of Object.entries(emotionKeywords)) {
      if (keyword.length > 3 && msg.includes(keyword)) return emotion;
    }
    return null;
  }

  // Run wink-nlp & sentiment for local signals
  analyzeLocalNLP(text) {
    const out = { sentimentScore: 0, sentimentComparative: 0, hasNegation: false, exclamations: false, intensifiers: false, chunks: [], keywords: [] };
    try {
      if (sentiment) {
        const s = sentiment.analyze(text || '');
        out.sentimentScore = s.score || 0;
        out.sentimentComparative = s.comparative || 0;
      }
      if (nlp) {
        const doc = nlp.readDoc(text || '');
        out.exclamations = (text || '').includes('!');
        const negWords = new Set(['not', "n't", 'never', 'no']);
        const intens = new Set(['very', 'really', 'so', 'extremely', 'highly', 'super']);
        out.hasNegation = doc.tokens().some(t => negWords.has(t.out(its.normal)));
        out.intensifiers = doc.tokens().some(t => intens.has(t.out(its.normal)));
        out.chunks = doc.phrases().out(its.normal) || [];
        const nouns = doc.tokens().filter(t => t.out(its.pos) === 'NOUN').out(its.lemma);
        out.keywords = Array.isArray(nouns) ? Array.from(new Set(nouns)).slice(0, 8) : [];
      }
    } catch (_) {}
    return out;
  }

  // Lightweight topic tagger used for emotional memory
  detectTopicTags(text) {
    const t = lc(text || '');
    const tags = new Set();
    if (/(friend|partner|boyfriend|girlfriend|spouse|relationship)/.test(t)) tags.add('relationships');
    if (/(not talking|stopped talking|ignoring|ghost|ghosted|won't reply|silent|silence)/.test(t)) tags.add('relationship_silence');
    if (/(school|college|university|exam|exams|grades|results|assignment|deadline|study|revision|gpa|marks)/.test(t)) tags.add('school');
    if (/(fail|failed|flunk|poor grade|bad grade|low grade)/.test(t)) tags.add('exam_failure');
    if (/(work|job|boss|project|deadline|performance review|burnout|overwork)/.test(t)) tags.add('work');
    if (/(completed|finished|submitted|launched|delivered|turned in|turned-in|done)/.test(t)) tags.add('success');
    if (/(sleep|tired|insomnia|sick|pain|doctor|hospital|health)/.test(t)) tags.add('health');
    return Array.from(tags);
  }

  // Yes/No handling remains
  handleYesNo(message) {
    if (!message || typeof message !== 'string') return null;
    const msg = lc(message.trim());
    if (['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'absolutely', 'definitely'].includes(msg)) {
      return {
        emotion: 'approval',
        reply: this.getYesResponse(),
        resources: [],
        meta: { tone: 'warm', severity: 'low', yesNoResponse: true }
      };
    }
    if (['no', 'nope', 'nah', 'not really', 'not sure', 'maybe not'].includes(msg)) {
      return {
        emotion: 'disapproval',
        reply: this.getNoResponse(),
        resources: [],
        meta: { tone: 'warm', severity: 'low', yesNoResponse: true }
      };
    }
    return null;
  }

  getYesResponse() {
    const responses = [
      'Thanks for sharing that. Would you like to tell me more about it?',
      'Got it. I appreciate your honesty. What would you like to explore next?',
      'I understand. Tell me more about how you\'re feeling.',
      'Thanks for confirming. What happens next for you in this situation?',
      'I hear you. What aspect of this feels most important to you right now?',
      'That\'s clear. How does that decision or feeling sit with you?',
      'Thanks for being open. Would you like to delve deeper into this?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getNoResponse() {
    const responses = [
      'That\'s completely okay. We can talk about something else that\'s on your mind.',
      'No problem at all. Is there something else you\'d prefer to discuss?',
      'Understood. What would you like to focus on instead?',
      'Alright. Let\'s change topics. What\'s been on your mind lately?',
      'That\'s fine. We can explore whatever feels comfortable for you.',
      'No worries. I\'m here to talk about whatever you need.',
      'That\'s okay. Sometimes it helps to talk about other things first.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Load long-term memory (DB)
  async loadLongTermMemory(userId) {
    try {
      const msgs = await Message.find({ userId }).sort({ createdAt: -1 }).limit(200);
      if (!msgs || msgs.length === 0) return { dominantEmotion: 'neutral', messageCount: 0, recentTopics: [], personality: 'warm' };
      const emotionCount = {};
      msgs.forEach(m => {
        const e = lc(m.emotion || 'neutral');
        emotionCount[e] = (emotionCount[e] || 0) + 1;
      });
      const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
      return { dominantEmotion, messageCount: msgs.length, recentTopics: msgs.slice(0, 5).map(m => m.text), personality: 'warm' };
    } catch (err) {
      console.error('❌ Long-term memory error:', err.message);
      return { dominantEmotion: 'neutral', messageCount: 0, recentTopics: [], personality: 'warm' };
    }
  }

  summarizeContext(history) {
    if (!history || history.length < 2) return null;
    const recent = history.slice(-3).map(h => h.message);
    return recent;
  }

  // Emotional memory updater
  updateEmotionalMemory(userCtx, detectedEmotion, topicTags, sentimentScore = 0) {
    userCtx.emotionalMemory = userCtx.emotionalMemory || { emotions: [], streak: 0, lastEmotion: 'neutral', negativeStreak: 0, topics: [] };
    const mem = userCtx.emotionalMemory;

    // Track emotion history (limit 20)
    if (detectedEmotion) {
      mem.emotions.push({ emotion: detectedEmotion, at: Date.now() });
      if (mem.emotions.length > 20) mem.emotions.shift();
    }

    // Compute streaks
    if (detectedEmotion && mem.lastEmotion === detectedEmotion) {
      mem.streak += 1;
    } else {
      mem.streak = 1;
    }
    mem.lastEmotion = detectedEmotion || mem.lastEmotion;

    const negativeSet = new Set(['sadness', 'anger', 'fear', 'anxiety', 'stress', 'grief']);
    if (detectedEmotion && negativeSet.has(detectedEmotion)) mem.negativeStreak += 1; else mem.negativeStreak = 0;

    // Merge topic tags
    if (Array.isArray(topicTags)) {
      const set = new Set([...(mem.topics || []), ...topicTags]);
      mem.topics = Array.from(set).slice(-10);
    }

    // Sentiment tracking
    mem.sentiments = mem.sentiments || [];
    mem.sentiments.push({ score: sentimentScore, at: Date.now() });
    if (mem.sentiments.length > 20) mem.sentiments.shift();
    mem.lastSentiment = sentimentScore;
    const sum = mem.sentiments.reduce((a, b) => a + (b.score || 0), 0);
    mem.avgSentiment = Number((sum / mem.sentiments.length).toFixed(3));

    return mem;
  }

  // Conversational cues
  handleCues(message) {
    if (!message || typeof message !== 'string') return null;
    const msg = lc(message.trim());
    if (/(^|\b)(hi|hello|hey|good morning|good afternoon|good evening)(\b|!|\.)/.test(msg)) {
      const greetings = [
        'Hi! It\'s good to hear from you. How are you feeling today? 💛',
        "Hello! Thanks for reaching out. What's on your mind?",
        "Hey there! I'm here to listen. How can I support you today?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    if (/(thank you|thanks|thx|appreciate)/.test(msg)) {
      const responses = [
        "You're really welcome. Is there anything else on your mind? 😊",
        'My pleasure. Thank you for sharing with me.',
        "You're most welcome. I'm glad I could be here for you."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    if (/(^|\b)(bye|goodbye|see you|talk later)(\b|!|\.)/.test(msg)) {
      const goodbyes = [
        'Bye for now — take care of yourself. I\'m here anytime you want to talk. 🤍',
        "See you next time. Remember I'm here whenever you need.",
        'Take care. I\'ll be right here when you want to talk again.'
      ];
      return goodbyes[Math.floor(Math.random() * goodbyes.length)];
    }
    if (/(how are you|what's up|how's it going)/.test(msg)) {
      return "Thanks for asking! I'm here and ready to listen. How are you really doing?";
    }
    if (/(uh huh|mhm|hmm|interesting|i see|got it)/.test(msg)) {
      const acknowledgments = [
        "I'm following along. Please continue.",
        'I understand. Tell me more.',
        'Got it. What else would you like to share?'
      ];
      return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    }
    return null;
  }

  // Build rich context object for this turn
  async buildTurnContext(message, userId, userCtx, safetyLevel, apiEmotion, apiConfidence, localIntent, localScore, localSignals) {
    const ctxShort = this.summarizeContext(userCtx.history);
    let topicTags = this.detectTopicTags(message + ' ' + (ctxShort || []).join(' '));
    // Enrich topic tags using wink-nlp signals
    try {
      const set = new Set(topicTags);
      const mergeables = [...(localSignals?.keywords || []), ...(localSignals?.chunks || [])];
      mergeables.forEach(k => {
        const s = (k || '').toLowerCase();
        if (/\b(project|work|manager|boss|task)\b/.test(s)) set.add('work');
        if (/\b(exam|exams|grade|grades|result|results|assignment)\b/.test(s)) set.add('school');
        if (/\b(friend|relationship|partner)\b/.test(s)) set.add('relationships');
      });
      topicTags = Array.from(set);
    } catch (_) {}

    // Long-term memory
    const longTerm = userId ? await this.loadLongTermMemory(userId) : null;

    // Update vector memory asynchronously
    if (userId) {
      try {
        await createMemory(userId, `${apiEmotion || 'neutral'} — ${message.slice(0, 200)}`, { source: 'auto', timestamp: Date.now() });
      } catch (err) {
        console.error('❌ Vector memory error:', err.message);
      }
    }

    const relatedMemories = userId ? (await queryMemory(userId, message, 3).catch(() => [])) : [];

    // Update emotional memory
    const emoMem = this.updateEmotionalMemory(userCtx, apiEmotion, topicTags, localSignals?.sentimentScore || 0);

    // Compose context object
    const contextObj = {
      userId: userId || 'guest',
      message,
      timestamp: Date.now(),
      shortHistory: ctxShort || [],
      lastEmotion: userCtx.lastEmotion || 'neutral',
      lastIntent: userCtx.lastIntent || null,
      detectedIntent: localIntent,
      detectedIntentScore: localScore,
      emotionFromAPI: apiEmotion,
      apiConfidence,
      safety: { level: safetyLevel },
      longTerm: longTerm || {},
      relatedMemories,
      topicTags,
      emotionalMemory: emoMem
    };

    return { contextObj, longTerm: longTerm || {}, shortContext: ctxShort || [], topicTags, emoMem };
  }

  // Main processing
  async processMessage(message, userId = null) {
    console.log(`\n🔍 ====== NEW MESSAGE PROCESSING ======`);
    console.log(`   User: ${userId || 'guest'}`);
    console.log(`   Message: "${message}"`);

    try {
      if (!message || typeof message !== 'string') throw new Error('Invalid message input');
      const ctxKey = userId || 'guest';
      if (!this.context[ctxKey]) {
        this.context[ctxKey] = { history: [], lastEmotion: 'neutral', messageCount: 0, emotionalMemory: null, lastIntent: null };
      }
      const userCtx = this.context[ctxKey];
      userCtx.messageCount += 1;
      // Initialize carry-over container
      if (!userCtx.carryEmotion) userCtx.carryEmotion = { emotion: null, remaining: 0 };

      // Early yes/no
      const keywordEmotion = this.enhanceEmotionDetection(message);
      const yesNoResponse = this.handleYesNo(message);
      if (yesNoResponse) {
        userCtx.history.push({ message, reply: yesNoResponse.reply, emotion: yesNoResponse.emotion, createdAt: new Date(), resourcesGiven: 0 });
        if (userCtx.history.length > 10) userCtx.history.shift();
        userCtx.lastEmotion = yesNoResponse.emotion;
        return yesNoResponse;
      }

      // Safety check
      const crisisResult = checkForCrisis(message);
      const safetyLevel = typeof crisisResult === 'object' && crisisResult.level !== undefined ? crisisResult.level : (typeof crisisResult === 'number' ? crisisResult : 0);
      if (safetyLevel === 2) {
        const crisisResponse = {
          emotion: 'sadness',
          reply: "I'm really glad you told me this. What you're feeling is serious, and you deserve immediate support.\n\n" +
            '❤️ PLEASE REACH OUT RIGHT NOW:\n' +
            '📞 Kenya Lifeline Hotline: 1199 (24/7)\n' +
            '💛 Befrienders Kenya: 0722 178 177\n' +
            '🔗 Emergency Medicine Kenya Foundation: 0800 723 253\n\n' +
            'You are not alone, and your life matters deeply. Please call one of these numbers right now.',
          resources: [
            { title: 'Kenya Lifeline Hotline (24/7)', phone: '1199' },
            { title: 'Befrienders Kenya', phone: '0722 178 177', url: 'https://www.befrienderskenya.org' },
            { title: 'Emergency Medicine Kenya Foundation', phone: '0800 723 253' }
          ],
          context: null,
          meta: { severity: 'high', tone: 'calm', crisis: true, safetyLevel: 2, requiresImmediateAction: true, timestamp: new Date().toISOString() }
        };
        userCtx.history.push({ message, reply: crisisResponse.reply, emotion: crisisResponse.emotion, createdAt: new Date(), resourcesGiven: crisisResponse.resources.length });
        userCtx.lastEmotion = crisisResponse.emotion;
        return crisisResponse;
      }
      if (safetyLevel === 1) {
        const distressResponse = {
          emotion: 'sadness',
          reply: "I hear you… and it sounds like you're carrying something heavy. If you're comfortable, we can talk about it. What happened?",
          resources: [
            { title: 'Mental 360 Kenya', url: 'https://www.mental360.or.ke' },
            { title: 'Basic Needs Watch', url: 'https://www.basicneedswatch.org' }
          ],
          context: null,
          meta: { severity: 'medium', tone: 'warm', safetyLevel: 1, suggestedResources: true }
        };
        userCtx.history.push({ message, reply: distressResponse.reply, emotion: distressResponse.emotion, createdAt: new Date(), resourcesGiven: distressResponse.resources.length });
        userCtx.lastEmotion = distressResponse.emotion;
        return distressResponse;
      }

      // Conversational cues
      const cueReply = this.handleCues(message);
      if (cueReply) {
        const cueResponse = { emotion: 'neutral', reply: cueReply, resources: [], context: null, meta: { severity: 'low', tone: 'friendly', cueBased: true } };
        userCtx.history.push({ message, reply: cueResponse.reply, emotion: cueResponse.emotion, createdAt: new Date(), resourcesGiven: 0 });
        userCtx.lastEmotion = cueResponse.emotion;
        return cueResponse;
      }

      // Fast-path handling for short yes/no/maybe answers
      const trimmed = (message || '').trim().toLowerCase();
      const tokenCount = trimmed.split(/\s+/).filter(Boolean).length;
      if (tokenCount <= 3) {
        // yes/no path uses existing handler
        const yn = this.handleYesNo(trimmed);
        if (yn) {
          userCtx.history.push({ message, reply: yn.reply, emotion: yn.emotion, createdAt: new Date(), resourcesGiven: 0 });
          if (userCtx.history.length > 10) userCtx.history.shift();
          userCtx.lastEmotion = yn.emotion;
          return yn;
        }
        // maybe path
        if (trimmed === 'maybe') {
          const maybeResp = {
            emotion: 'confusion',
            reply: "It's okay to be unsure. What would help you decide what feels right?",
            resources: [],
            context: null,
            meta: { tone: 'warm', severity: 'low', maybeResponse: true }
          };
          userCtx.history.push({ message, reply: maybeResp.reply, emotion: maybeResp.emotion, createdAt: new Date(), resourcesGiven: 0 });
          userCtx.lastEmotion = maybeResp.emotion;
          return maybeResp;
        }
      }

      // Emotion analysis
      let emotion = 'neutral';
      let confidence = 0.5;
      // Local signals via wink-nlp & sentiment
      const localSignals = this.analyzeLocalNLP(message);
      try {
        const emotionResult = await analyzeEmotion(message);
        emotion = (emotionResult && emotionResult.emotion) ? emotionResult.emotion : 'neutral';
        confidence = (emotionResult && emotionResult.confidence) ? emotionResult.confidence : 0.5;
      } catch (err) {
        emotion = this.enhanceEmotionDetection(message) || 'neutral';
      }
      const msgLower = lc(message);
      if (msgLower.includes('stress') || msgLower.includes('stressing') || msgLower.includes('overwhelmed') || msgLower.includes('pressure')) {
        emotion = 'stress';
        confidence = Math.max(confidence, 0.8);
      }
      if (msgLower.includes('anxious') || msgLower.includes('worried')) {
        emotion = 'anxiety';
        confidence = Math.max(confidence, 0.8);
      } else if (msgLower.includes('sad') || msgLower.includes('unhappy') || msgLower.includes('depressed') || msgLower.includes('miserable')) {
        emotion = 'sadness';
        confidence = Math.max(confidence, 0.8);
      } else if (msgLower.includes('happy') || msgLower.includes('better') || msgLower.includes('good') || msgLower.includes('great')) {
        emotion = 'joy';
        confidence = Math.max(confidence, 0.8);
      }
      // Sentiment-driven biasing
      if (typeof localSignals?.sentimentScore === 'number') {
        if (localSignals.sentimentScore >= 2 && !['sadness','anger','fear','anxiety','stress','grief'].includes(emotion)) {
          emotion = 'joy';
          confidence = Math.max(confidence, 0.7);
        } else if (localSignals.sentimentScore <= -2 && ['neutral','joy','optimism','approval'].includes(emotion)) {
          emotion = 'sadness';
          confidence = Math.max(confidence, 0.65);
        }
      }
      // Exclamation emphasis: if exclamations and positive sentiment, boost to celebratory tone
      if (localSignals?.exclamations && (localSignals?.sentimentScore ?? 0) >= 2 && !['sadness','anger','fear','anxiety','stress','grief'].includes(emotion)) {
        emotion = 'joy';
        confidence = Math.max(confidence, 0.8);
      }

      // Emotion carry-over system: apply if present
      const strongSet = new Set(['depressed','sad','sadness','stressed','stress','crying','overwhelmed','hopeless','angry','anger','anxiety','fear','grief']);
      if (userCtx.carryEmotion?.emotion && userCtx.carryEmotion.remaining > 0) {
        // Bias toward carried emotion unless strong positive is explicit
        const carried = userCtx.carryEmotion.emotion;
        if (strongSet.has(carried)) {
          // If current emotion isn't strongly positive, override to carried
          if (!['joy','gratitude','love','optimism','relief','pride','excitement'].includes(emotion)) {
            emotion = carried;
            confidence = Math.max(confidence, 0.8);
          }
          userCtx.carryEmotion.remaining -= 1;
          if (userCtx.carryEmotion.remaining <= 0) userCtx.carryEmotion = { emotion: null, remaining: 0 };
        }
      }

      // Auto log emotions to mood tracker
      if (userId && emotion !== 'neutral' && confidence > 0.6) {
        try {
          await moodTracker.logEmotion(userId, {
            emotion: emotion,
            intensity: Math.round(confidence * 10),
            message: message.substring(0, 150),
            context: 'chat_conversation',
            source: 'chat'
          });
          console.log(`📊 Emotion logged to mood tracker: ${emotion}`);
        } catch (err) {
          console.error(`❌ Failed to log emotion: ${err.message}`);
        }
      }

      // Local NLP intent
      await this.localNLP.trainIfNeeded(this.intentsPath); // no-op if already trained
      const cls = await this.localNLP.classify(message);
      const localIntent = cls.intent;
      const localScore = cls.score || 0;

      // If the message ends with a question mark and no cue was used earlier, offer a clarifying question response
      const endsWithQuestion = /\?\s*$/.test(message || '');
      if (endsWithQuestion) {
        const questionCue = {
          emotion: 'neutral',
          reply: "That's a thoughtful question. Would it help to look at one part of it first?",
          resources: [],
          context: null,
          meta: { severity: 'low', tone: 'curious', questionCue: true }
        };
        userCtx.history.push({ message, reply: questionCue.reply, emotion: questionCue.emotion, createdAt: new Date(), resourcesGiven: 0 });
        userCtx.lastEmotion = questionCue.emotion;
        return questionCue;
      }

      // Build turn context
      const { contextObj, longTerm, shortContext, topicTags, emoMem } = await this.buildTurnContext(
        message,
        userId,
        this.context[ctxKey],
        0,
        emotion,
        confidence,
        localIntent,
        localScore,
        localSignals
      );

      // Generate response
      const genResult = await generateResponse(
        emotion,
        shortContext,
        longTerm,
        {
          rawMessage: message,
          userId: ctxKey,
          confidence: confidence,
          messageCount: this.context[ctxKey].messageCount,
          lastIntent: this.context[ctxKey].lastIntent || null,
          localIntent,
          localIntentScore: localScore,
          emotionalMemory: emoMem,
          topicTags,
          localSignals
        }
      );

      // Resources
      let finalResources = [];
      const shouldGetResources = genResult.meta?.hasResources || (this.context[ctxKey].messageCount % 5 === 0) || ['sadness', 'anxiety', 'fear', 'grief', 'stress'].includes(emotion);
      if (shouldGetResources) {
        const resourceContext = { severity: 'low', messageCount: this.context[ctxKey].messageCount, conversationHistory: this.context[ctxKey].history.slice(-3) };
        try {
          finalResources = recommendResources(emotion, resourceContext, userId) || [];
        } catch (rrErr) {
          finalResources = [];
        }
      }

      // Persist history
      try {
        await ChatHistory.create({
          userId: userId || null,
          message,
          botReply: genResult.reply,
          emotion: genResult.emotion || emotion,
          meta: {
            resourcesReturned: finalResources.length,
            confidence: confidence,
            contextLength: shortContext?.length || 0,
            ...genResult.meta,
            safetyLevel: 0,
            localIntent,
            localIntentScore: localScore,
            topicTags,
            localSignals,
            emotionalMemory: {
              lastEmotion: emoMem.lastEmotion,
              streak: emoMem.streak,
              negativeStreak: emoMem.negativeStreak,
              topics: emoMem.topics,
              lastSentiment: emoMem.lastSentiment,
              avgSentiment: emoMem.avgSentiment
            }
          }
        });
      } catch (err) {
        console.error('❌ Failed to save to ChatHistory:', err.message);
      }

      // Update short-term context and memory
      this.context[ctxKey].history.push({ message, reply: genResult.reply, emotion: genResult.emotion || emotion, createdAt: new Date(), resourcesGiven: finalResources.length });
      if (this.context[ctxKey].history.length > 10) this.context[ctxKey].history.shift();
      this.context[ctxKey].lastEmotion = genResult.emotion || emotion;

      // Update carry-over if a strong emotion is detected now
      try {
        const finalEmotion = (genResult.emotion || emotion || '').toLowerCase();
        const strong = new Set(['depressed','sad','sadness','stressed','stress','crying','overwhelmed','hopeless','angry','anger','anxiety','fear','grief']);
        if (strong.has(finalEmotion)) {
          // Save for next 3–5 messages
          const span = 3 + Math.floor(Math.random() * 3); // 3-5 messages
          this.context[ctxKey].carryEmotion = { emotion: finalEmotion, remaining: span };
        }
      } catch(_) {}
      this.context[ctxKey].lastIntent = localIntent || this.context[ctxKey].lastIntent;

      // Return aggregated result
      return {
        emotion: genResult.emotion || emotion,
        reply: genResult.reply,
        resources: finalResources,
        context: shortContext,
        meta: {
          ...genResult.meta,
          confidence: confidence,
          safetyLevel: 0,
          messageCount: this.context[ctxKey].messageCount,
          conversationDepth: this.context[ctxKey].history.length,
          localIntent,
          localIntentScore: localScore,
          topicTags,
          localSignals,
          emotionalMemory: this.context[ctxKey].emotionalMemory
        }
      };
    } catch (err) {
      console.error('❌ ConversationLoop ERROR:', err.message);
      const lowerMsg = lc(message || '');
      let fallbackReply = "I'm here with you. What would you like to talk about?";
      if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) fallbackReply = "Hi! I'm MindHaven. How are you feeling today?";
      else if (lowerMsg.includes('not okay') || lowerMsg.includes('not good')) fallbackReply = "I hear you're not okay. That sounds really difficult. I'm here with you.";
      else if (lowerMsg.includes('sad') || lowerMsg.includes('unhappy')) fallbackReply = 'I hear the sadness in your words. It\'s okay to feel this way.';
      else if (lowerMsg.includes('stress') || lowerMsg.includes('stressing')) fallbackReply = "I hear the stress in your words. That sounds overwhelming. Would you like to talk about what's causing it?";
      return { emotion: 'neutral', reply: fallbackReply, resources: [], context: null, meta: { error: true, errorMessage: err.message, fallback: true } };
>>>>>>> Stashed changes
    }
  }

  /**
   * Retrieve recent messages for a user.
   */
  getRecentHistory(userId = null) {
<<<<<<< Updated upstream
    const userCtx = this.context[userId || 'guest'];
    return userCtx ? userCtx.history : [];
=======
    const ctxKey = userId || 'guest';
    const history = this.context[ctxKey]?.history || [];
    return history;
>>>>>>> Stashed changes
  }

  /**
   * Clear conversation context for a user (optional).
   */
  clearContext(userId = null) {
<<<<<<< Updated upstream
    delete this.context[userId || 'guest'];
=======
    const ctxKey = userId || 'guest';
    if (this.context[ctxKey]) {
      delete this.context[ctxKey];
      return true;
    }
    return false;
  }

  getUserStats(userId = null) {
    const ctxKey = userId || 'guest';
    const userCtx = this.context[ctxKey];
    if (!userCtx) return null;
    return {
      messageCount: userCtx.messageCount || 0,
      historyLength: userCtx.history.length,
      lastEmotion: userCtx.lastEmotion || 'unknown',
      lastIntent: userCtx.lastIntent || null,
      lastActivity: userCtx.history.length > 0 ? userCtx.history[userCtx.history.length - 1].createdAt : null
    };
>>>>>>> Stashed changes
  }
}

// Singleton export
const conversationLoop = new ConversationLoop();
module.exports = conversationLoop;
