// Sends text to your Python model API and returns predicted label
const axios = require('axios');

async function analyzeEmotion(text) {
  const url = process.env.MODEL_API_URL || 'http://127.0.0.1:5000/predict';
  try {
    const res = await axios.post(url, { text });
    // model_api.py returns something like { label: 'joy', score: 0.9 }
    const label = res.data && res.data.label ? res.data.label.toString().toLowerCase() : 'neutral';
    return label;
  } catch (err) {
    console.error('EmotionAnalyzer error:', err.message);
    return 'neutral'; // gracefully degrade
  }
}

module.exports = analyzeEmotion;
