const analyzeEmotion = require('../modules/emotionAnalyzer');
const generateResponse = require('../modules/responseGenerator');
const recommendForEmotion = require('../modules/resourceRecommender');
const ChatHistory = require('../models/ChatHistory');

exports.handleMessage = async (req, res, next) => {
  try {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Clean / preprocess message if needed (you can call textPreprocessor here)
    const emotion = await analyzeEmotion(message); // call model
    const reply = generateResponse(emotion);
    const resources = recommendForEmotion(emotion); // optional

    // Save chat history
    const record = new ChatHistory({
      userId: userId || null,
      message,
      botReply: reply,
      emotion,
      meta: { resourcesReturned: resources.length }
    });
    await record.save();

    return res.json({ emotion, reply, resources });
  } catch (err) {
    next(err);
  }
};
