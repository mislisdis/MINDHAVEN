const fs = require('fs');
const path = require('path');

let intents = null;

try {
  const p = path.join(__dirname, '../../data/intents.json');
  if (fs.existsSync(p)) {
    intents = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log("✅ Loaded intents.json");
  }
} catch (e) {
  console.error("❌ Failed to load intents.json", e);
  intents = null;
}

const fallback = {
  admiration: ["That sounds inspiring — what about it stood out to you?"],
  amusement: ["Glad something made you smile! Want to share it?"],
  anger: ["I hear your frustration. Want to talk about what's upsetting you?"],
  annoyance: ["Sounds irritating. What happened?"],
  approval: ["It seems you feel positive about that — that’s great!"],
  caring: ["You sound thoughtful and caring. Want to talk more?"],
  confusion: ["It seems confusing. Want to walk through it together?"],
  curiosity: ["You're curious — what are you wondering about?"],
  desire: ["It sounds like you want something strongly. Want to talk about it?"],
  disappointment: ["That sounds disappointing. Want to share what happened?"],
  disapproval: ["It seems something didn’t feel right. What was it?"],
  disgust: ["That sounds unpleasant. Want to explain what happened?"],
  embarrassment: ["That must have felt awkward. I'm here if you want to talk."],
  excitement: ["That’s exciting! Tell me more!"],
  fear: ["That sounds scary. You're not alone — want to talk about it?"],
  gratitude: ["That's kind. What are you feeling grateful for?"],
  grief: ["I'm really sorry you're facing this pain. I'm here for you."],
  joy: ["That’s wonderful! Tell me what made you happy!"],
  love: ["It sounds like you're feeling something strong. Want to talk about it?"],
  nervousness: ["You sound tense — want to talk through it?"],
  optimism: ["I like your hopeful outlook. What makes you feel positive?"],
  pride: ["You sound proud — and you should be! Tell me more."],
  realization: ["That sounds like an important realization. What led to it?"],
  relief: ["I'm glad something eased your stress. Want to talk about it?"],
  remorse: ["It sounds like you feel regret. What happened?"],
  sadness: ["I'm really sorry you're feeling down. Want to talk about it?"],
  surprise: ["That sounds surprising! What happened?"],
  neutral: ["I'm here — what's on your mind?"]
};

function generateResponse(emotion, context = null) {
  emotion = (emotion || "neutral").toLowerCase();

  // Determine base reply using intents.json or fallback
  let baseReply = null;
  if (intents && intents[emotion] && intents[emotion].length > 0) {
    const arr = intents[emotion];
    baseReply = arr[Math.floor(Math.random() * arr.length)];
  } else {
    baseReply = fallback[emotion]
      ? fallback[emotion][Math.floor(Math.random() * fallback[emotion].length)]
      : fallback["neutral"][0];
  }

  // Only append a contextual follow-up when it's appropriate:
  // - a context summary exists and is non-trivial
  // - the detected emotion is one where a follow-up is empathetic/useful
  const followUpEmotions = new Set([
    'sadness',
    'grief',
    'fear',
    'anger',
    'remorse',
    'disappointment',
    'confusion',
    'nervousness',
    'anxiety'
  ]);

  const hasMeaningfulContext = context && String(context).trim().length > 10;
  const emotionAllowsFollowUp = followUpEmotions.has(emotion);

  if (hasMeaningfulContext && emotionAllowsFollowUp) {
    return `${baseReply} By the way, earlier you mentioned: "${context}". Is this related?`;
  }

  return baseReply;
}

module.exports = generateResponse;
