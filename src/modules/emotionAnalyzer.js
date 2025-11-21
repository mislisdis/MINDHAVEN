const axios = require('axios');

async function analyzeEmotion(text) {
  const url = process.env.MODEL_API_URL || 'http://127.0.0.1:5001/predict';

  try {
    const res = await axios.post(url, { text }, {
      headers: { "Content-Type": "application/json" }
    });

    const emotion = res.data?.emotion?.toLowerCase() || "neutral";

    console.log(`🧠 Emotion detected from model: ${emotion}`);
    return emotion;

  } catch (err) {
    console.error("❌ EmotionAnalyzer error:", err.message);
    return "neutral";
  }
}

module.exports = analyzeEmotion;
