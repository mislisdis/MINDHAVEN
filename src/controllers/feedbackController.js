const collectFeedback = require('../modules/feedbackCollector');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { userId, message, rating } = req.body;
    if (!message) return res.status(400).json({ error: 'Feedback message required' });

    const fb = await collectFeedback({ userId, message, rating });
    res.json({ ok: true, feedback: fb });
  } catch (err) {
    next(err);
  }
};
