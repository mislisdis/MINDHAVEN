const Feedback = require('../models/Feedback');

async function collectFeedback({ userId, message, rating }) {
  try {
    const fb = new Feedback({ userId, message, rating });
    await fb.save();
    return fb;
  } catch (err) {
    console.error('FeedbackCollector error:', err.message);
    throw err;
  }
}

module.exports = collectFeedback;
