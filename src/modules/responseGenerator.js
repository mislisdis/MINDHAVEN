// src/modules/responseGenerator.js
const fs = require('fs');
const path = require('path');
const { getQuestions } = require('./therapeuticQuestioner');

// ---------- Load intents ----------
let intents = null;
try {
  const p = path.join(__dirname, '../../data/intents.json');
  if (fs.existsSync(p)) {
    intents = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log("✅ Loaded intents.json (responseGenerator)");
  }
} catch (e) {
  console.error("❌ Failed to load intents.json", e);
}

// ---------- Helpers ----------
function safeText(s) { return (s || '').toString().trim(); }

function pickBaseReply(emotion) {
  emotion = (emotion || 'neutral').toLowerCase();
  if (intents && intents[emotion] && intents[emotion].length > 0) {
    const arr = intents[emotion];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return "I'm here with you — what’s on your mind?";
}

// ---------- Severity ----------
function determineSeverity({ emotion, longTerm, confidence = 0.6 }) {
  let severity = 'low';
  if (confidence >= 0.85) severity = 'high';
  else if (confidence >= 0.65) severity = 'medium';

  if (longTerm && longTerm.messageCount >= 8) {
    const negs = ['sadness','grief','anger','fear','anxiety','remorse','disappointment'];
    if (negs.includes((longTerm.dominantEmotion || '').toLowerCase())) {
      severity = severity === 'low' ? 'medium' : 'high';
    }
  }
  return severity;
}

function chooseTone(personality = 'warm', severity = 'low') {
  personality = (personality || 'warm').toLowerCase();
  if (personality === 'calm') return 'calm';
  if (personality === 'direct') return severity === 'high' ? 'calm' : 'neutral';
  if (severity === 'high') return 'calm';
  if (severity === 'medium') return 'warm';
  return 'neutral';
}

function applyTone(reply, tone = 'warm') {
  const extra = "I’m here for you — we can take this at your pace.";
  if (tone === 'calm') return reply.includes(extra) ? reply : `${reply} I'm here with you. Let's take this one step at a time.`;
  if (tone === 'neutral') return reply;
  return reply.includes(extra) ? reply : `${reply} ${extra}`;
}

// ---------- Crisis ----------
const despairIndicators = [
  "i hate my life","what's the point","whats the point","i give up",
  "i can't do this anymore","i cant do this anymore","nothing matters",
  "i'm done","im done","i wish everything would stop","i want to die",
  "kill myself","end it"
];
const negativeEmotions = ['sadness','fear','anger','grief','anxiety','remorse','disappointment'];

// ---------- Soft reinforcement ----------
const softReinforcement = {
  sadness: "You’re not alone — this sounds really heavy.",
  fear: "That sounds worrying. You’re safe to share it here.",
  anger: "It makes sense you’d feel angry about that.",
  grief: "I’m sorry you’re carrying that pain.",
  anxiety: "That’s a lot to carry. We can explore that slowly.",
  happiness: "I’m glad to hear that! That’s wonderful 😄",
  joy: "That’s awesome! Keep enjoying it 😊",
  excitement: "Wow, that sounds exciting! 🎉",
  love: "Sending warm vibes ❤️",
  admiration: "That’s lovely to hear ✨",
  pride: "You should feel proud of that 😌",
  relief: "That’s a relief! Glad things are easing 😌"
};

// ---------- Quick intent detection ----------
const greetingPatterns = ["hi","hello","hey","heyy","heyyy","good morning","good afternoon","good evening","what's up","whats up","sup"];
const thanksPatterns = ["thanks","thank you","thx","ty"];
const pleasePatterns = ["please","pls","plz"];

function isMatch(message, patterns) {
  const m = String(message || "").toLowerCase();
  return patterns.some(p => m === p || m.startsWith(p) || m.includes(` ${p}`));
}

// ---------- Main generator ----------
function generateResponse(rawEmotion, context = null, longTerm = null, options = {}) {
  const rawMessage = (options && options.rawMessage) || "";
  const rawLower = rawMessage.toLowerCase();

  // --- Quick intents ---
  if (isMatch(rawLower, greetingPatterns)) {
    return { reply: "Hi there 😄 How are you feeling right now?", meta: { severity:"low", tone:"warm", personality:"warm" } };
  }
  if (isMatch(rawLower, thanksPatterns)) {
    return { reply: "You're welcome 💛 I'm here anytime you need me.", meta: { severity:"low", tone:"warm", personality:"warm" } };
  }
  if (isMatch(rawLower, pleasePatterns)) {
    return { reply: "Of course — tell me what you’d like me to help you with 😊", meta: { severity:"low", tone:"warm", personality:"warm" } };
  }

  // --- Emotion ---
  let emotion = 'neutral';
  let confidence = 0.6;
  if (typeof rawEmotion === 'string') emotion = rawEmotion;
  else if (rawEmotion && typeof rawEmotion === 'object') {
    emotion = rawEmotion.emotion || 'neutral';
    confidence = typeof rawEmotion.confidence === 'number' ? rawEmotion.confidence : confidence;
  }
  emotion = emotion.toLowerCase();

  // Crisis detection
  let forcedDespair = false;
  if (despairIndicators.some(d => rawLower.includes(d))) {
    forcedDespair = true;
    emotion = 'sadness';
    confidence = Math.max(confidence, 0.99);
  }

  let severity = determineSeverity({ emotion, longTerm, confidence });
  if (forcedDespair || (severity === 'high' && negativeEmotions.includes(emotion))) severity = 'high';
  else if (!negativeEmotions.includes(emotion) && severity === 'high') severity = 'medium';

  const personality = (options && options.personality) || (longTerm && longTerm.personality) || 'warm';
  const tone = chooseTone(personality, severity);

  // --- Base reply ---
  let reply = pickBaseReply(emotion);
  if (severity === 'high' && negativeEmotions.includes(emotion)) {
    reply = softReinforcement[emotion] || "I’m really glad you told me that. This sounds really heavy.";
  } else if (softReinforcement[emotion] && !negativeEmotions.includes(emotion)) {
    reply = softReinforcement[emotion];
  }

  // --- Long-term reference ---
  if (severity !== 'high' && longTerm && longTerm.messageCount >= 8) {
    if (longTerm.dominantEmotion && longTerm.dominantEmotion.toLowerCase() !== emotion) {
      reply += ` I remember you've been feeling more ${longTerm.dominantEmotion} recently. Does any of that connect?`;
    }
  }

  // --- Short-term context (skip trivial messages) ---
  const safeContext = safeText(context || '');
  if (severity !== 'high' && safeContext.split('→').length >= 2) {
    const trivial = ['hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'hmm'];
    const segments = safeContext
      .split('→')
      .map(s => s.trim())
      .filter(s => s.length > 2 && !trivial.includes(s.toLowerCase()));
    
    if (segments.length >= 2) {
      const lastTwo = segments.slice(-2).join(' → ');
      const contextPrompt = `From earlier you said: "${lastTwo}". If you want, we can work through that together.`;
      if (!reply.includes(contextPrompt)) reply += ` ${contextPrompt}`;
    }
  }

  // --- Therapeutic question ---
  const questions = getQuestions(emotion, severity, context);
  if (severity !== 'high' && Array.isArray(questions) && questions.length > 0) {
    reply += ` ${questions[0]}`;
  }

  // --- Final tone ---
  return { reply: applyTone(reply, tone), meta: { severity, tone, personality } };
}

module.exports = generateResponse;
