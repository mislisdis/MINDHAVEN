// Sends text to your Python model API and returns predicted emotion
const axios = require('axios');

async function analyzeEmotion(text) {
  // Make sure this matches your Flask port
  const url = process.env.MODEL_API_URL || 'http://127.0.0.1:5001/predict';

  try {
<<<<<<< Updated upstream
    const res = await axios.post(url, { text });
=======
    const res = await axios.post(url, { text }, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000 // 5 second timeout
    });
>>>>>>> Stashed changes

    // Flask returns something like { emotion: 'joy', confidence: 0.97 }
    const emotion =
      res.data && res.data.emotion ? res.data.emotion.toString().toLowerCase() : 'neutral';

    console.log(`🧠 Emotion detected: ${emotion} (${res.data.confidence})`);
    return emotion;
  } catch (err) {
<<<<<<< Updated upstream
    console.error('❌ EmotionAnalyzer error:', err.message);
    return 'neutral'; // fallback if API fails
=======
    console.error("❌ EmotionAnalyzer error:", err.message);
    // Fallback emotion detection
    const fallback = detectEmotionFallback(text);
    return { emotion: fallback.emotion, confidence: fallback.confidence };
>>>>>>> Stashed changes
  }
}

// Simple fallback emotion detection
function detectEmotionFallback(text) {
  const lowerText = text.toLowerCase();
  
  if (/(sad|unhappy|depressed|miserable|heartbroken)/.test(lowerText)) {
    return { emotion: 'sadness', confidence: 0.7 };
  }
  if (/(happy|joy|excited|great|awesome|amazing)/.test(lowerText)) {
    return { emotion: 'joy', confidence: 0.7 };
  }
  if (/(angry|mad|furious|upset|annoyed)/.test(lowerText)) {
    return { emotion: 'anger', confidence: 0.7 };
  }
  if (/(scared|afraid|fear|worried|anxious)/.test(lowerText)) {
    return { emotion: 'fear', confidence: 0.7 };
  }
  
  return { emotion: 'neutral', confidence: 0.5 };
}

module.exports = analyzeEmotion;