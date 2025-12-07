<<<<<<< Updated upstream
// Simple emotion -> reply mapping. You can expand this or load intents.json
const fs = require('fs');
const path = require('path');

let intents = null;
try {
  const p = path.join(__dirname, '../../data/intents.json');
  if (fs.existsSync(p)) intents = JSON.parse(fs.readFileSync(p, 'utf8'));
=======
// src/modules/responseGenerator.js - CLEAN + FIXED + generateResponse API
const fs = require('fs');
const path = require('path');
const { getQuestions } = require('./therapeuticQuestioner');
const { checkForCrisis } = require('./safetyFilter');

console.log("🧠 Advanced Response Generator Loaded");

// --------------------------------------------------
// LOAD INTENTS.JSON
// --------------------------------------------------
let intents = null;
try {
  const p = path.join(__dirname, "../../data/intents.json");
  if (fs.existsSync(p)) {
    intents = JSON.parse(fs.readFileSync(p, "utf8"));
    console.log("✅ Loaded intents.json");
  } else {
    console.log("⚠️ intents.json not found at:", p);
  }
>>>>>>> Stashed changes
} catch (e) {
  intents = null;
}

<<<<<<< Updated upstream
function generateResponse(emotion) {
  const e = (emotion || 'neutral').toLowerCase();

  // Prefer intents.json if available
  if (intents && intents[e] && Array.isArray(intents[e]) && intents[e].length) {
    const arr = intents[e];
    return arr[Math.floor(Math.random() * arr.length)];
=======
// --------------------------------------------------
// INTENT RESPONSE HANDLER
// --------------------------------------------------
function getIntentResponse(emotion) {
  if (!emotion) return null;
  console.log(`🎯 Looking for intent response for emotion: ${emotion}`);

  if (!intents) {
    console.log('❌ Intents not loaded, using fallback');
    return null;
  }

  const e = emotion.toLowerCase();

  if (intents[e]) {
    const responses = intents[e];
    if (Array.isArray(responses) && responses.length > 0) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      console.log(`✅ Found intent response for ${emotion}`);
      return randomResponse;
    }
  }

  console.log(`❌ No intent found for emotion: ${emotion}`);
  return null;
}

// --------------------------------------------------
// LOAD RESOURCES.JSON (optional, used for tone and context hints)
// --------------------------------------------------
let resources = {};
try {
  const rp = path.join(__dirname, "../../data/resources.json");
  if (fs.existsSync(rp)) {
    resources = JSON.parse(fs.readFileSync(rp, "utf8"));
    console.log("✅ Loaded resources.json");
>>>>>>> Stashed changes
  }

<<<<<<< Updated upstream
  // Fallback mapping
  const map = {
    joy: [
      "That's wonderful — tell me more about what's making you happy!",
      "Love the energy ✨ — what's the highlight of your day?"
    ],
    sadness: [
      "I'm really sorry you're feeling down. I'm here to listen.",
      "It sounds heavy right now. Want to share what's going on?"
    ],
    anger: [
      "I hear your frustration. Want to vent a little?",
      "Anger is valid — do you want to describe what's upsetting you?"
    ],
    fear: [
      "It's okay to feel scared. You're not alone in this.",
      "Take a breath — want to walk through it with me?"
    ],
    neutral: [
      "Got it. How else can I help today?",
      "I'm here — tell me what's on your mind."
    ]
  };

  const list = map[e] || map['neutral'];
  return list[Math.floor(Math.random() * list.length)];
=======
// --------------------------------------------------
// ADVANCED MEMORY CLASS (kept for potential in-module usage)
// --------------------------------------------------
class AdvancedConversationMemory {
  constructor() {
    this.userMemories = new Map();
    console.log("🧠 AdvancedConversationMemory initialized");
  }

  storeMessage(userId, message, emotion, sender = 'user') {
    if (!userId) return null;
    console.log(`💾 Storing message for ${userId}: "${(message||'').substring(0, 30)}..." (${emotion})`);

    if (!this.userMemories.has(userId)) {
      this.userMemories.set(userId, {
        conversationHistory: [],
        emotionHistory: [],
        topicHistory: [],
        resourceHistory: [],
        contextScore: 0,
        lastMessageTime: Date.now()
      });
      console.log(`   Created new memory for user: ${userId}`);
    }

    const userMemory = this.userMemories.get(userId);
    const timestamp = Date.now();

    userMemory.conversationHistory.push({
      message,
      emotion,
      sender,
      timestamp,
      keywords: this.extractKeywords(message)
    });

    if (userMemory.conversationHistory.length > 15)
      userMemory.conversationHistory.shift();

    userMemory.emotionHistory.push({ emotion, confidence: 1, timestamp });
    if (userMemory.emotionHistory.length > 10) userMemory.emotionHistory.shift();

    const topics = this.extractTopics(message, emotion);
    userMemory.topicHistory.push(...topics);

    userMemory.contextScore += 1;
    userMemory.lastMessageTime = timestamp;

    return userMemory;
  }

  extractKeywords(text) {
    if (!text || typeof text !== 'string') return [];

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const stopWords = new Set([
      'the', 'and', 'but', 'for', 'with', 'that', 'this', 'have',
      'from', 'like', 'just', 'know', 'what', 'when', 'where',
      'how', 'why', 'who'
    ]);

    return words.filter(w => !stopWords.has(w)).slice(0, 10);
  }

  extractTopics(text, emotion) {
    if (!text || typeof text !== 'string') return [];

    const topics = [];
    const t = text.toLowerCase();

    if (t.match(/\b(friend|family|parent|partner|boyfriend|girlfriend|spouse|mother|father|sibling)\b/))
      topics.push('relationships');

    if (t.match(/\b(work|job|boss|school|college|university|exam|study|project|deadline)\b/))
      topics.push('work_school');

    if (t.match(/\b(health|pain|tired|sleep|insomnia|weight|doctor|hospital)\b/))
      topics.push('health');

    if (t.match(/\b(self|confidence|worth|future|goal|purpose|identity)\b/))
      topics.push('self_identity');

    switch ((emotion||'').toLowerCase()) {
      case 'sadness': topics.push('loss', 'loneliness'); break;
      case 'anxiety': topics.push('worry', 'fear'); break;
      case 'anger': topics.push('frustration'); break;
    }

    return [...new Set(topics)];
  }

  getContextSummary(userId) {
    if (!userId || !this.userMemories.has(userId)) return null;

    const memory = this.userMemories.get(userId);
    if (memory.conversationHistory.length < 2) return null;

    const recent = memory.conversationHistory.slice(-3);
    const topics = [...new Set(memory.topicHistory.slice(-5))];
    const recentEmotions = memory.emotionHistory.slice(-3).map(e => e.emotion);

    return {
      recentMessages: recent.map(m => m.message.substring(0, 50) + "..."),
      dominantTopics: topics.slice(0, 3),
      emotionPattern: this.getEmotionPattern(recentEmotions),
      engagementLevel: this.calculateEngagement(memory),
      needsResources: this.shouldSuggestResources(memory),
      messageCount: memory.conversationHistory.length
    };
  }

  getEmotionPattern(list) {
    if (!list.length) return { dominant: "neutral", stability: "stable", intensity: "low" };

    const counts = {};
    list.forEach(e => counts[e] = (counts[e] || 0) + 1);

    const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];

    const negative = ['sadness','anger','fear','anxiety'];
    const negCount = list.filter(e => negative.includes(e)).length;

    return {
      dominant,
      stability: new Set(list).size <= 2 ? "stable" : "volatile",
      intensity: negCount >= 2 ? "high" : "low"
    };
  }

  calculateEngagement(memory) {
    const lastHour = Date.now() - (60 * 60 * 1000);
    const msgs = memory.conversationHistory.filter(m => m.timestamp > lastHour).length;

    if (msgs > 5) return "high";
    if (msgs > 2) return "medium";
    return "low";
  }

  shouldSuggestResources(memory) {
    const lastResource = memory.resourceHistory[memory.resourceHistory.length - 1];
    if (lastResource && Date.now() - lastResource.timestamp < 10 * 60 * 1000)
      return false;

    if (memory.conversationHistory.length % 5 === 0)
      return true;

    const recent = memory.conversationHistory.slice(-5);
    const distressWords = [
      'help', 'cant cope', 'overwhelmed', 'lost',
      'alone', 'suicide', 'end it', 'hopeless'
    ];

    if (recent.some(m => distressWords.some(w => m.message.toLowerCase().includes(w))))
      return true;

    const recentEmotions = memory.emotionHistory.slice(-4).map(e => e.emotion);
    const negative = ['sadness','anger','fear','anxiety','grief'];
    if (recentEmotions.filter(e => negative.includes(e)).length >= 3)
      return true;

    return false;
  }
>>>>>>> Stashed changes
}

// --------------------------------------------------
// Core response generator function used by ConversationLoop
// Signature expected by conversationLoop.js:
//   generateResponse(emotion, shortContextArray, longTermObj, extraMeta)
// Returns: { emotion, reply, meta }
// --------------------------------------------------
async function generateResponse(emotion, context = [], longTerm = {}, extra = {}) {
  try {
    const e = (emotion || 'neutral').toLowerCase();
    const messageCount = extra.messageCount || 0;
    const confidence = extra.confidence ?? 0.5;

    // Helper utilities (scoped to this function)
    const lc = (s) => (s || '').toLowerCase();
    const containsAny = (text, arr) => arr.some(p => text.includes(p));
    const avoidRepeat = (replyText, candidates = []) => {
      const r = lc(replyText);
      return candidates.filter(c => c && !r.includes(lc(c)));
    };

    function detectTopicDetails(text) {
      const t = lc(text);
      const relKeywords = ['friend', 'best friend', 'partner', 'relationship', 'boyfriend', 'girlfriend', 'spouse'];
      const commBreak = ['not talking', "isn't talking", 'isnt talking', 'stopped talking', 'ignoring', 'ignore', 'not speaking', 'silent', 'silence', 'distance', 'distant', "won't reply", 'wont reply', 'ghost', 'ghosted'];
      if (containsAny(t, relKeywords)) {
        const subtype = containsAny(t, commBreak) ? 'silence' : (containsAny(t, ['argu', 'fight', 'conflict', 'broke up', 'breakup', 'fallout']) ? 'conflict' : null);
        return { topic: 'relationships', subtype };
      }
      const schoolKeywords = ['school', 'college', 'university', 'exam', 'exams', 'teacher', 'class', 'classes', 'assignment', 'assignments', 'deadline', 'grades', 'results', 'study', 'revision', 'gpa', 'marks'];
      const failureKeywords = ['fail', 'failed', 'failing', 'flunk', 'poor grade', 'bad grade', 'low grade'];
      const workKeywords = ['work', 'boss', 'job', 'project', 'deadline', 'burnout', 'overwork', 'performance review'];
      const successKeywords = ['completed', 'finished', 'submitted', 'launched', 'delivered', 'turned in', 'turned-in', 'done', 'accomplished', 'achieved', 'shipped', 'pass', 'passed'];

      if (containsAny(t, schoolKeywords))
        return { topic: 'work_school', subtype: containsAny(t, failureKeywords) ? 'exam_failure' : 'school' };

      if (containsAny(t, workKeywords)) {
        const subtype = containsAny(t, successKeywords) ? 'work_success' : 'work';
        return { topic: 'work_school', subtype };
      }

      if (containsAny(t, ['sleep', 'tired', 'insomnia', 'sick', 'pain', 'doctor', 'hospital', 'health']))
        return { topic: 'health', subtype: null };
      return { topic: null, subtype: null };
    }

    function buildTopicPrompts(details) {
      switch (details.topic) {
        case 'relationships': {
          const base = [
            "What do you wish you could tell them about how this feels?",
            "What do you think might be happening on their side?",
            "Would it help to think through a kind, low‑pressure message you could send?"
          ];
          if (details.subtype === 'silence') {
            base.unshift(
              "When did you start noticing the distance between you two?",
              "How has the silence been affecting your day to day?"
            );
          } else if (details.subtype === 'conflict') {
            base.unshift(
              "What part of the conflict feels most unresolved for you?",
              "If you could rewind one moment, what would you change about how it went?"
            );
          }
          return base;
        }
        case 'work_school':
          if (details.subtype === 'exam_failure') {
            return [
              "Getting a result like that can feel crushing — what do you think most contributed to it (time, understanding, stress)?",
              "Would it help to plan concrete next steps — like talking to a lecturer/tutor or mapping a light revision plan?",
              "If you were to retake or improve, what’s one small step you could take this week?"
            ];
          } else if (details.subtype === 'work_success') {
            return [
              "That’s a big accomplishment — what part are you most proud of?",
              "What did you learn from this project that you want to carry forward?",
              "Would you like to take a moment to celebrate how far you’ve come?"
            ];
          } else if (details.subtype === 'school') {
            return [
              "What's the toughest part about school right now?",
              "How are you sleeping and pacing your study time?",
              "Is there someone (lecturer, tutor, friend) who could support you with this?"
            ];
          } else if (details.subtype === 'work') {
            return [
              "What's the most stressful part of work for you right now?",
              "What’s one small, manageable step you could take next?",
              "Is there someone who could help unblock you (colleague, manager)?"
            ];
          }
          return [
            "What's the most stressful part of this for you right now?",
            "What's one small, manageable step you could take next?",
            "Is there someone who could support you with this?"
          ];
        case 'health':
          return [
            "Where in your body do you feel this most?",
            "Have any small things helped, even a little?",
            "Would it help to try a brief grounding or breathing exercise together?"
          ];
        default:
          return [];
      }
    }

    function pickNudge(candidates, replyText, avoid = []) {
      const r = lc(replyText);
      const pool = (candidates || []).filter(c => c && !r.includes(lc(c)) && !avoid.some(a => lc(c) === lc(a) || r.includes(lc(a))));
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // 1) Crisis-aware preface (non-blocking; ConversationLoop already handles actual crisis routing)
    const crisisMeta = { hasCrisis: false, safetyLevel: 0 };
    if (extra.rawMessage) {
      try {
        const c = checkForCrisis(extra.rawMessage);
        crisisMeta.hasCrisis = !!c?.hasCrisis;
        crisisMeta.safetyLevel = typeof c?.level === 'number' ? c.level : 0;
      } catch (_) {}
    }

    // 2) Try intents first for emotion-tailored empathy
    let usedIntent = false;
    let reply = getIntentResponse(e);
    if (reply) usedIntent = true;

    // 3) If no intent matched, craft a human-like empathetic template
    if (!reply) {
      const starters = {
        sadness: [
          "I'm really hearing how heavy this feels.",
          "It sounds like you're carrying a lot right now.",
          "I'm sorry you're going through this — it makes sense you'd feel this way."
        ],
        anxiety: [
          "That sounds really tense and worrying.",
          "I can hear the anxiety in this — you're not alone in it.",
          "What you're describing can be really overwhelming."
        ],
        anger: [
          "That does sound frustrating.",
          "It's understandable that you'd feel upset about that.",
          "Your feelings make sense given what happened."
        ],
        joy: [
          "That's wonderful to hear!",
          "I appreciate you sharing this positive moment.",
          "That sounds like a bright spot."
        ],
        fear: [
          "That sounds scary to sit with.",
          "I hear there’s fear in this — that’s valid.",
          "It makes sense that part of this feels frightening."
        ],
        neutral: [
          "I'm here and listening.",
          "Thanks for sharing that.",
          "I’m with you — tell me more."
        ],
        stress: [
          "That sounds like a lot of pressure.",
          "I can hear how much this is weighing on you.",
          "Feeling stretched thin like that is really hard."
        ]
      };

      const followups = getQuestions(e, crisisMeta.safetyLevel === 2 ? 'high' : (confidence < 0.6 ? 'medium' : 'low'));
      const startPool = starters[e] || starters.neutral;
      const start = startPool[Math.floor(Math.random() * startPool.length)];
      const ask = followups && followups.length ? ' ' + followups[0] : '';
      reply = `${start}${ask ? ' ' + ask : ''}`;
    }

    // 4) Context-adapted reflection and nudge selection
    const recentContext = Array.isArray(context) ? context.slice(-2) : [];
    const combined = lc([...recentContext, extra.rawMessage || ''].join(' '));
    const details = detectTopicDetails(combined);

    // Add a brief reflection for sensitive topics
    if (details.topic === 'relationships' && details.subtype === 'silence') {
      const reflections = [
        'It can really hurt when someone close pulls away.',
        'Feeling shut out by a friend can bring up a lot.',
        'Being met with silence from someone who matters is painful.'
      ];
      const reflection = reflections[Math.floor(Math.random() * reflections.length)];
      if (!lc(reply).includes(lc(reflection))) reply = `${reply} ${reflection}`;
    }

    // Success mode handling (celebratory/self-kindness)
    const topicTags = extra.topicTags || [];
    const localSignals = extra.localSignals || {};
    const isSuccess = (Array.isArray(topicTags) && topicTags.includes('success')) || (typeof localSignals.sentimentScore === 'number' && localSignals.sentimentScore >= 2 && ['joy','excitement','approval','optimism'].includes(e));

    const giftWords = ['bought', 'purchase', 'purchased', 'gift', 'treat', 'treated', 'treating', 'bought myself'];
    const isSelfGift = containsAny(combined, giftWords);

    // Build targeted nudges and avoid repeating the generic phrase
    const avoidPhrases = ['What feels most important in this right now?', 'Tell me what you’re thinking.', 'Tell me what you\'re thinking.'];

    const genericNudges = [
      'What part of this feels most present right now?',
      'Would it help to unpack one piece of this together?',
      'What do you feel you need most in this moment?',
      'What would be a gentle next step?'
    ];

    let topicNudges = buildTopicPrompts(details);

    // Inject success celebratory prompts when appropriate
    if (isSuccess) {
      const successPrompts = [
        'That’s worth celebrating — what part are you most proud of?',
        'What did you do that really made this possible?',
        'How would you like to mark this win for yourself?'
      ];
      if (isSelfGift) {
        successPrompts.unshift('That’s a lovely act of self-kindness — how did it feel to gift yourself that?');
      }
      topicNudges = [...successPrompts, ...topicNudges];
    }

    // Long-term memory hint and cadence-based grounding offer
    if (longTerm?.dominantEmotion && longTerm.dominantEmotion !== e && ['sadness','anxiety','fear','anger'].includes(longTerm.dominantEmotion)) {
      topicNudges.push("I remember feelings like this coming up before — what feels different or the same this time?");
    }
    if (messageCount % 4 === 0 && e !== 'joy') {
      topicNudges.push('Would a short grounding exercise help right now?');
    }

    // Repetition guard and selection
    let nudge = null;
    const filteredTopicNudges = avoidRepeat(reply, topicNudges);
    if (details.topic || isSuccess) {
      nudge = pickNudge(filteredTopicNudges, reply, avoidPhrases);
    }
    if (!nudge) {
      const filteredGeneric = avoidRepeat(reply, genericNudges);
      nudge = pickNudge(filteredGeneric, reply, avoidPhrases);
    }
    if (nudge) {
      reply += ` ${nudge}`;
    }

    // 5) Compose meta
    const meta = {
      tone: e === 'joy' ? 'uplifting' : 'warm',
      style: 'empathetic',
      hasQuestions: true,
      hasResources: ['sadness','anxiety','fear','stress','grief'].includes(e),
      safetyLevel: crisisMeta.safetyLevel,
      confidence,
      usedIntent: usedIntent,
      contextUsed: Array.isArray(context) ? context.length : 0,
      longTermUsed: !!longTerm && Object.keys(longTerm || {}).length > 0,
      topic: details.topic || null,
      topicSubtype: details.subtype || null
    };

    return { emotion: e, reply, meta };
  } catch (err) {
    console.error('❌ generateResponse error:', err.message);
    return { emotion: (emotion||'neutral'), reply: "I'm here with you. Would you like to share a bit more?", meta: { error: true, message: err.message } };
  }
}

// --------------------------------------------------
// EXPORT MODULES
// --------------------------------------------------
module.exports = {
  getIntentResponse,
  AdvancedConversationMemory,
  generateResponse
};
