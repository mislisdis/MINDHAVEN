// Simple emotion -> reply mapping. You can expand this or load intents.json
const fs = require('fs');
const path = require('path');

let intents = null;
try {
  const p = path.join(__dirname, '../../data/intents.json');
  if (fs.existsSync(p)) intents = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) {
  intents = null;
}

function generateResponse(emotion) {
  const e = (emotion || 'neutral').toLowerCase();

  // Prefer intents.json if available
  if (intents && intents[e] && Array.isArray(intents[e]) && intents[e].length) {
    const arr = intents[e];
    return arr[Math.floor(Math.random() * arr.length)];
  }

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
}

module.exports = generateResponse;
