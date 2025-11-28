// src/controllers/feedbackController.js
const collectFeedback = require('../modules/feedbackCollector');
const ChatHistory = require('../models/ChatHistory');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { message, rating, chatId } = req.body;

    // Validate message
    if (!message) {
      return res.render('feedback', { error: 'Feedback message required' });
    }

    // Save feedback
    const fb = await collectFeedback({
      userId: req.user?._id,
      message,
      rating
    });

    // Optional: link feedback to a chat
    if (chatId) {
      await ChatHistory.findByIdAndUpdate(chatId, { $set: { 'meta.feedbackId': fb._id } });
    }

    // ✅ Redirect user back to the chat page
    res.redirect('/chat');

  } catch (err) {
    console.error('FeedbackController error:', err);
    res.render('feedback', { error: 'Something went wrong. Please try again.' });
  }
};