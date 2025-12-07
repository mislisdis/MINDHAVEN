const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String 
  },
  content: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  emotions: [{ 
    type: String 
  }],
  dominantEmotion: { 
    type: String 
  },
  emotionIntensity: { 
    type: Number, 
    min: 1, 
    max: 10 
  },
  topics: [{ 
    type: String 
  }],
  tags: [{ 
    type: String 
  }],
  wordCount: { 
    type: Number 
  },
  moodColor: { 
    type: String 
  },
  isAnalyzed: { 
    type: Boolean, 
    default: false 
  },
  insights: { 
    type: String 
  },
  reflectionQuestions: [{ 
    type: String 
  }],
  gratitudeList: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
JournalEntrySchema.index({ userId: 1, date: -1 });
JournalEntrySchema.index({ userId: 1, emotions: 1 });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);