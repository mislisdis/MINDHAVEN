// src/modules/emotionAnalyzer.js
const axios = require('axios');

async function analyzeEmotion(text) {
  const url = process.env.MODEL_API_URL || 'http://127.0.0.1:5001/predict';

  try {
    const res = await axios.post(url, { text }, {
      headers: { "Content-Type": "application/json" }
    });

    const emotion = (res.data?.emotion || 'neutral').toLowerCase();
    const confidence = typeof res.data?.confidence === 'number' ? res.data.confidence : 0.6;

    console.log(`🧠 Emotion detected: ${emotion} (confidence: ${confidence})`);
    return { emotion, confidence };
  } catch (err) {
    console.error("❌ EmotionAnalyzer error:", err.message);
    return { emotion: "neutral", confidence: 0.5 };
  }
}

module.exports = analyzeEmotion;
