const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(requireAuth);

// Journal entries
router.post('/entries', journalController.createJournalEntry);
router.get('/entries', journalController.getJournalEntries);
router.get('/entries/:id', journalController.getJournalEntry);
router.put('/entries/:id', journalController.updateJournalEntry);
router.delete('/entries/:id', journalController.deleteJournalEntry);

// Quick journal entry (from chat)
router.post('/quick', journalController.quickJournalEntry);

// Mood tracking
router.get('/timeline', journalController.getMoodTimeline);
router.get('/moodboard', journalController.getMoodBoard);
router.get('/stats', journalController.analyzeJournalStats);

// Manual emotion logging
router.post('/log-emotion', async (req, res) => {
  try {
    const moodTracker = require('../modules/moodTracker');
    const userId = req.user._id;
    const { emotion, intensity, message, context, tags } = req.body;
    
    const emotionLog = await moodTracker.logEmotion(userId, {
      emotion,
      intensity,
      message,
      context,
      tags,
      source: 'manual'
    });
    
    res.json({
      success: true,
      message: 'Emotion logged',
      emotionLog
    });
    
  } catch (error) {
    console.error('❌ Error logging emotion:', error);
    res.status(500).json({ error: 'Failed to log emotion' });
  }
});

// Get emotion logs
router.get('/emotion-logs', async (req, res) => {
  try {
    const EmotionLog = require('../models/EmotionLog');
    const userId = req.user._id;
    const { limit = 50 } = req.query;
    
    const logs = await EmotionLog.find({ userId })
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      logs
    });
    
  } catch (error) {
    console.error('❌ Error getting emotion logs:', error);
    res.status(500).json({ error: 'Failed to get emotion logs' });
  }
});

module.exports = router;