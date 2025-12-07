const mongoose = require('mongoose');

const EmotionLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  emotion: { 
    type: String, 
    required: true,
    enum: [
      'admiration', 'amusement', 'anger', 'annoyance', 'approval',
      'caring', 'confusion', 'curiosity', 'desire', 'disappointment',
      'disapproval', 'disgust', 'embarrassment', 'excitement', 'fear',
      'gratitude', 'grief', 'joy', 'love', 'nervousness',
      'optimism', 'pride', 'realization', 'relief', 'remorse',
      'sadness', 'surprise', 'neutral', 'anxiety', 'stress'
    ]
  },
  intensity: { 
    type: Number, 
    min: 1, 
    max: 10, 
    default: 5 
  },
  message: { 
    type: String 
  },
  context: { 
    type: String 
  },
  tags: [{ 
    type: String 
  }],
  source: { 
    type: String, 
    enum: ['chat', 'journal', 'manual', 'reflection'], 
    default: 'chat' 
  },
  moodColor: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
EmotionLogSchema.index({ userId: 1, date: -1 });
EmotionLogSchema.index({ userId: 1, emotion: 1 });

module.exports = mongoose.model('EmotionLog', EmotionLogSchema);