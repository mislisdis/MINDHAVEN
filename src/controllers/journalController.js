// src/controllers/journalController.js
const JournalEntry = require('../models/JournalEntry');
const EmotionLog = require('../models/EmotionLog');
const journalAnalyzer = require('../modules/journalAnalyzer');
const moodTracker = require('../modules/moodTracker');

// Place shared save logic at the top
async function analyzeAndSaveEntry({ userId, title, content, tags = [], analyze = true, quick = false }, res) {
  // Clean up content
  const cleanContent = typeof content === 'string' ? content.replace(/^"+|"+$/g, '').trim() : '';
  if (!cleanContent) {
    return res.status(400).json({ success: false, error: 'Content cannot be empty' });
  }

  let analysis = null;
  let errorStack = null;
  try {
    analysis = analyze ? await journalAnalyzer.analyzeEntry(cleanContent, userId) : null;
  } catch (err) {
    errorStack = err.stack;
    console.error('❌ Journal analysis failed:', err.message, err.stack);
    // DIAGNOSTIC LOGGING
    console.error({
      userId, title, inputContent: content, cleanContent, tags, analyze, quick,
      errorType: 'analyzeEntry', errorMsg: err.message, errorStack: err.stack
    });
    return res.status(500).json({ success: false, error: 'Journal analysis failed. Please try again later.', diagnostic: { userId, title, inputContent: content, cleanContent, tags, analyze, quick, error: err.message, errorStack: err.stack } });
  }

  // If analysis is fallback (only neutral/general) AND sentiment score is zero, log diagnostic and do NOT save
  const isNeutralOnly = Array.isArray(analysis?.emotions) && analysis.emotions.length === 1 && analysis.emotions[0] === 'neutral';
  const isGeneralOnly = Array.isArray(analysis?.topics) && analysis.topics.length === 1 && analysis.topics[0] === 'general';
  const sentimentScore = analysis?.sentiment?.score ?? 0;
  if (!analysis || (isNeutralOnly && isGeneralOnly && sentimentScore === 0)) {
    const diagnostic = { userId, title, cleanContent, analysis, content, tags, analyze, quick };
    console.warn('⚠️ Analysis fallback - not saving entry!', diagnostic);
    return res.status(500).json({ success: false, error: 'Failed to analyze your entry. Please try rephrasing and try again.', diagnostic });
  }

  const entryData = {
    userId,
    title: title || (quick ? undefined : 'Untitled Entry'),
    content: cleanContent,
    tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []),
    wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
    date: new Date(),
    isAnalyzed: !!analysis,
    emotions: analysis.emotions || [],
    dominantEmotion: analysis.dominantEmotion || 'neutral',
    moodColor: analysis.moodColor || '#6c757d',
    emotionIntensity: analysis.emotionIntensity || 5,
    topics: analysis.topics || [],
    reflectionQuestions: analysis.reflectionQuestions || [],
    gratitudeList: analysis.gratitudeList || [],
    insights: analysis.insights || '',
  };
  if (quick) entryData.tags = [ ...(entryData.tags || []), 'quick' ];
  const entry = new JournalEntry(entryData);
  await entry.save();
  return res.json({ success: true, journalEntry: entry, analysis });
}

// ---------------------------
// Create a journal entry
// ---------------------------
async function createJournalEntry(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized - Please log in' });
    const { title, content, tags, analyze } = req.body || {};
    await analyzeAndSaveEntry({ userId, title, content, tags, analyze: analyze !== false }, res);
  } catch (error) {
    console.error('❌ createJournalEntry error:', error);
    return res.status(500).json({ success: false, error: 'Failed to save journal entry' });
  }
}

// ---------------------------
// Quick journal entry
// ---------------------------
async function quickJournalEntry(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { content = '' } = req.body || {};
    await analyzeAndSaveEntry({ userId, content, quick: true }, res);
  } catch (err) {
    console.error('❌ quickJournalEntry error:', err);
    return res.status(500).json({ error: 'Failed to save quick journal entry' });
  }
}

// ---------------------------
// Get all entries (paginated)
// ---------------------------
async function getJournalEntries(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      JournalEntry.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit),
      JournalEntry.countDocuments({ userId })
    ]);

    return res.json({ success: true, entries, pagination: { page, limit, total } });
  } catch (err) {
    console.error('❌ getJournalEntries error:', err);
    return res.status(500).json({ error: 'Failed to get journal entries' });
  }
}

// ---------------------------
// Get single entry
// ---------------------------
async function getJournalEntry(req, res) {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const entry = await JournalEntry.findOne({ _id: id, userId });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    return res.json({ success: true, entry });
  } catch (err) {
    console.error('❌ getJournalEntry error:', err);
    return res.status(500).json({ error: 'Failed to get journal entry' });
  }
}

// ---------------------------
// Update entry
// ---------------------------
async function updateJournalEntry(req, res) {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { title, content, tags } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const update = {};
    if (title) update.title = title;
    if (content) {
      update.content = content;
      update.wordCount = content.split(/\s+/).filter(Boolean).length;
      const analysis = await journalAnalyzer.analyzeEntry(content, userId);
      update.emotions = analysis?.emotions || [];
      update.dominantEmotion = analysis?.dominantEmotion || 'neutral';
      update.moodColor = analysis?.moodColor || '#6c757d';
      update.emotionIntensity = analysis?.emotionIntensity || 5;
      update.isAnalyzed = true;
    }
    if (tags) update.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];

    const entry = await JournalEntry.findOneAndUpdate({ _id: id, userId }, { $set: update, updatedAt: new Date() }, { new: true });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    return res.json({ success: true, entry });
  } catch (err) {
    console.error('❌ updateJournalEntry error:', err);
    return res.status(500).json({ error: 'Failed to update journal entry' });
  }
}

// ---------------------------
// Delete entry
// ---------------------------
async function deleteJournalEntry(req, res) {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await JournalEntry.deleteOne({ _id: id, userId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Entry not found' });

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteJournalEntry error:', err);
    return res.status(500).json({ error: 'Failed to delete journal entry' });
  }
}

// ---------------------------
// Mood timeline
// ---------------------------
async function getMoodTimeline(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const period = req.query.period || 'month';
    const data = await moodTracker.getMoodTimeline(userId, period);

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error('❌ getMoodTimeline error:', err);
    return res.status(500).json({ error: 'Failed to get mood timeline' });
  }
}

// ---------------------------
// Mood board
// ---------------------------
async function getMoodBoard(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const period = req.query.period || 'month';
    const data = await moodTracker.getMoodBoard(userId, period);

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error('❌ getMoodBoard error:', err);
    return res.status(500).json({ error: 'Failed to get mood board' });
  }
}

// ---------------------------
// Journal stats
// ---------------------------
async function analyzeJournalStats(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [count, recent] = await Promise.all([
      JournalEntry.countDocuments({ userId }),
      JournalEntry.find({ userId }).sort({ date: -1 }).limit(30)
    ]);

    const words = recent.reduce((acc, e) => acc + (e.wordCount || (e.content || '').split(/\s+/).filter(Boolean).length), 0);
    const avgWordsPerEntry = recent.length ? Math.round(words / recent.length) : 0;

    const datesSet = new Set(recent.map(e => new Date(e.date).toDateString()));
    let streak = 0;
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (datesSet.has(d.toDateString())) streak++; else break;
    }

    // Calculate emotion distribution
    const emotionDistribution = {};
    recent.forEach(entry => {
      if (entry.emotions && Array.isArray(entry.emotions)) {
        entry.emotions.forEach(emotion => {
          emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        });
      }
    });

    // Calculate topic distribution
    const topicDistribution = {};
    recent.forEach(entry => {
      if (entry.topics && Array.isArray(entry.topics)) {
        entry.topics.forEach(topic => {
          topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;
        });
      }
    });

    const stats = {
      totalEntries: count,
      journalingStreak: streak,
      averageWordsPerEntry: avgWordsPerEntry,
      emotionDistribution,
      topicDistribution
    };

    return res.json({ success: true, stats });
  } catch (err) {
    console.error('❌ analyzeJournalStats error:', err);
    return res.status(500).json({ error: 'Failed to analyze journal stats' });
  }
}

module.exports = {
  createJournalEntry,
  quickJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getMoodTimeline,
  getMoodBoard,
  analyzeJournalStats
};
