// Sends text to your Python model API and returns predicted emotion
const axios = require('axios');

async function analyzeEmotion(text) {
  // Make sure this matches your Flask port
  const url = process.env.MODEL_API_URL || 'http://127.0.0.1:5001/predict';

  try {
    const res = await axios.post(url, { text });

    // Flask returns something like { emotion: 'joy', confidence: 0.97 }
    const emotion =
      res.data && res.data.emotion ? res.data.emotion.toString().toLowerCase() : 'neutral';

    console.log(`🧠 Emotion detected: ${emotion} (${res.data.confidence})`);
    return emotion;
  } catch (err) {
    console.error('❌ EmotionAnalyzer error:', err.message);
    return 'neutral'; // fallback if API fails
  }
}

module.exports = analyzeEmotion;
