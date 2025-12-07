const mongoose = require('mongoose');

const MoodPatternSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  period: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'] 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  emotionStats: {
    type: Map,
    of: {
      count: Number,
      averageIntensity: Number,
      dominant: Boolean
    }
  },
  topTopics: [{ 
    type: String 
  }],
  moodTrend: { 
    type: String, 
    enum: ['improving', 'stable', 'declining', 'volatile'] 
  },
  triggers: [{ 
    type: String 
  }],
  copingStrategies: [{ 
    type: String 
  }],
  insights: { 
    type: String 
  },
  recommendations: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MoodPattern', MoodPatternSchema);