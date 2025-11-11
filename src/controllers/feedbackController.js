// src/controllers/feedbackController.js
const collectFeedback = require('../modules/feedbackCollector');
const ChatHistory = require('../models/ChatHistory');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { userId, message, rating, chatId } = req.body;

    // ✅ Basic validation
    if (!message) return res.status(400).json({ error: 'Feedback message required' });
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // 💬 Save feedback
    const fb = await collectFeedback({ userId, message, rating });

    // 🧠 (Optional) Link feedback to a chat record if chatId is passed
    if (chatId) {
      await ChatHistory.findByIdAndUpdate(chatId, { $set: { 'meta.feedbackId': fb._id } });
    }

    res.status(201).json({
      ok: true,
      message: 'Feedback submitted successfully',
      feedback: fb,
    });
  } catch (err) {
    console.error('FeedbackController error:', err.message);
    next(err);
  }
};

/**
 * (Optional) Get all feedback (for admin view)
 */
exports.listFeedback = async (req, res, next) => {
  try {
    const feedback = await require('../models/Feedback').find().sort({ createdAt: -1 }).limit(50);
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
};
