const EmotionLog = require('../models/EmotionLog');
const JournalEntry = require('../models/JournalEntry');
const MoodPattern = require('../models/MoodPattern');

class MoodTracker {
  constructor() {
    console.log("📊 Mood Tracker initialized");
  }

  // Log an emotion
  async logEmotion(userId, data) {
    try {
      const emotionLog = new EmotionLog({
        userId,
        date: data.date || new Date(),
        emotion: data.emotion,
        intensity: data.intensity || 5,
        message: data.message,
        context: data.context,
        tags: data.tags || [],
        source: data.source || 'manual',
        moodColor: this.getEmotionColor(data.emotion, data.intensity)
      });

      await emotionLog.save();
      
      // Update mood patterns
      await this.updateMoodPatterns(userId);
      
      console.log(`✅ Emotion logged: ${data.emotion} for user ${userId}`);
      return emotionLog;
      
    } catch (error) {
      console.error('❌ Error logging emotion:', error);
      throw error;
    }
  }

  // Get mood timeline for a user
  async getMoodTimeline(userId, period = 'week') {
    try {
      let startDate;
      const now = new Date();
      
      switch(period) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '3months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }
      
      const emotions = await EmotionLog.find({
        userId,
        date: { $gte: startDate }
      }).sort({ date: 1 });
      
      // Group by day for timeline
      const timeline = this.groupByDay(emotions);
      
      // Calculate statistics
      const stats = this.calculateMoodStats(emotions);
      
      // Get recent journal entries
      const journalEntries = await JournalEntry.find({
        userId,
        date: { $gte: startDate }
      }).sort({ date: -1 }).limit(10);
      
      // Get mood patterns
      const patterns = await this.identifyPatterns(userId, startDate);
      
      return {
        timeline,
        stats,
        journalEntries,
        patterns,
        period
      };
      
    } catch (error) {
      console.error('❌ Error getting mood timeline:', error);
      throw error;
    }
  }

  // Group emotions by day
  groupByDay(emotions) {
    const grouped = {};
    
    emotions.forEach(emotion => {
      const dateStr = emotion.date.toISOString().split('T')[0];
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: dateStr,
          emotions: [],
          averageIntensity: 0,
          dominantEmotion: null,
          count: 0
        };
      }
      
      grouped[dateStr].emotions.push({
        emotion: emotion.emotion,
        intensity: emotion.intensity,
        time: emotion.date.toISOString(),
        message: emotion.message,
        color: emotion.moodColor
      });
      
      grouped[dateStr].count++;
    });
    
    // Calculate averages and dominant emotion for each day
    Object.values(grouped).forEach(day => {
      // Calculate average intensity
      const totalIntensity = day.emotions.reduce((sum, e) => sum + e.intensity, 0);
      day.averageIntensity = Math.round(totalIntensity / day.emotions.length);
      
      // Find dominant emotion
      const emotionCounts = {};
      day.emotions.forEach(e => {
        emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      });
      
      const dominant = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0];
      
      day.dominantEmotion = dominant ? dominant[0] : 'neutral';
      day.dominantColor = this.getEmotionColor(day.dominantEmotion, day.averageIntensity);
    });
    
    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Calculate mood statistics
  calculateMoodStats(emotions) {
    if (emotions.length === 0) {
      return {
        totalLogs: 0,
        averageIntensity: 0,
        mostCommonEmotion: 'neutral',
        moodTrend: 'stable',
        emotionalRange: 0
      };
    }
    
    // Count emotions
    const emotionCounts = {};
    let totalIntensity = 0;
    
    emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      totalIntensity += e.intensity;
    });
    
    // Find most common emotion
    const mostCommon = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    // Calculate mood trend (simple implementation)
    const recentEmotions = emotions.slice(-5);
    const recentIntensity = recentEmotions.reduce((sum, e) => sum + e.intensity, 0) / recentEmotions.length;
    const olderEmotions = emotions.slice(0, 5);
    const olderIntensity = olderEmotions.reduce((sum, e) => sum + e.intensity, 0) / olderEmotions.length;
    
    let moodTrend = 'stable';
    if (recentIntensity > olderIntensity + 2) moodTrend = 'improving';
    else if (recentIntensity < olderIntensity - 2) moodTrend = 'declining';
    
    // Calculate emotional range
    const intensities = emotions.map(e => e.intensity);
    const emotionalRange = Math.max(...intensities) - Math.min(...intensities);
    
    return {
      totalLogs: emotions.length,
      averageIntensity: Math.round(totalIntensity / emotions.length),
      mostCommonEmotion: mostCommon ? mostCommon[0] : 'neutral',
      emotionDistribution: emotionCounts,
      moodTrend,
      emotionalRange
    };
  }

  // Identify mood patterns
  async identifyPatterns(userId, startDate) {
    try {
      const emotions = await EmotionLog.find({
        userId,
        date: { $gte: startDate }
      });
      
      if (emotions.length < 5) {
        return { message: "Need more data to identify patterns" };
      }
      
      const patterns = {
        timeOfDay: this.analyzeTimePatterns(emotions),
        weekly: this.analyzeWeeklyPatterns(emotions),
        triggers: this.identifyTriggers(emotions),
        copingEffectiveness: this.analyzeCopingStrategies(emotions)
      };
      
      return patterns;
      
    } catch (error) {
      console.error('❌ Error identifying patterns:', error);
      return {};
    }
  }

  // Analyze time of day patterns
  analyzeTimePatterns(emotions) {
    const timeSlots = {
      morning: { emotions: [], count: 0 },
      afternoon: { emotions: [], count: 0 },
      evening: { emotions: [], count: 0 },
      night: { emotions: [], count: 0 }
    };
    
    emotions.forEach(emotion => {
      const hour = new Date(emotion.date).getHours();
      
      if (hour >= 5 && hour < 12) {
        timeSlots.morning.emotions.push(emotion.emotion);
        timeSlots.morning.count++;
      } else if (hour >= 12 && hour < 17) {
        timeSlots.afternoon.emotions.push(emotion.emotion);
        timeSlots.afternoon.count++;
      } else if (hour >= 17 && hour < 22) {
        timeSlots.evening.emotions.push(emotion.emotion);
        timeSlots.evening.count++;
      } else {
        timeSlots.night.emotions.push(emotion.emotion);
        timeSlots.night.count++;
      }
    });
    
    // Calculate dominant emotion for each time slot
    Object.keys(timeSlots).forEach(slot => {
      if (timeSlots[slot].emotions.length > 0) {
        const counts = {};
        timeSlots[slot].emotions.forEach(e => {
          counts[e] = (counts[e] || 0) + 1;
        });
        
        const dominant = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])[0];
        
        timeSlots[slot].dominantEmotion = dominant ? dominant[0] : 'neutral';
        timeSlots[slot].averageIntensity = 5; // Default, could calculate from actual data
      }
    });
    
    return timeSlots;
  }

  // Analyze weekly patterns
  analyzeWeeklyPatterns(emotions) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyPatterns = {};
    
    daysOfWeek.forEach(day => {
      weeklyPatterns[day] = { emotions: [], count: 0 };
    });
    
    emotions.forEach(emotion => {
      const day = new Date(emotion.date).getDay();
      const dayName = daysOfWeek[day];
      
      weeklyPatterns[dayName].emotions.push(emotion.emotion);
      weeklyPatterns[dayName].count++;
    });
    
    // Calculate dominant emotion for each day
    daysOfWeek.forEach(day => {
      if (weeklyPatterns[day].emotions.length > 0) {
        const counts = {};
        weeklyPatterns[day].emotions.forEach(e => {
          counts[e] = (counts[e] || 0) + 1;
        });
        
        const dominant = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])[0];
        
        weeklyPatterns[day].dominantEmotion = dominant ? dominant[0] : 'neutral';
      }
    });
    
    return weeklyPatterns;
  }

  // Identify potential triggers
  identifyTriggers(emotions) {
    // Simple trigger identification based on message content
    const triggers = [];
    
    emotions.forEach(emotion => {
      if (emotion.message) {
        const lowerMessage = emotion.message.toLowerCase();
        
        if (lowerMessage.includes('work') || lowerMessage.includes('job')) {
          if (!triggers.includes('work')) triggers.push('work');
        }
        
        if (lowerMessage.includes('school') || lowerMessage.includes('exam')) {
          if (!triggers.includes('academic')) triggers.push('academic');
        }
        
        if (lowerMessage.includes('family') || lowerMessage.includes('friend')) {
          if (!triggers.includes('relationships')) triggers.push('relationships');
        }
        
        if (lowerMessage.includes('money') || lowerMessage.includes('bill')) {
          if (!triggers.includes('finance')) triggers.push('finance');
        }
        
        if (lowerMessage.includes('health') || lowerMessage.includes('sick')) {
          if (!triggers.includes('health')) triggers.push('health');
        }
      }
    });
    
    return triggers;
  }

  // Analyze coping strategies effectiveness
  analyzeCopingStrategies(emotions) {
    // This would integrate with a coping strategies database
    return {
      mostEffective: ['journaling', 'deep breathing', 'talking to someone'],
      suggested: ['exercise', 'meditation', 'creative expression']
    };
  }

  // Update mood patterns (called after logging emotions)
  async updateMoodPatterns(userId) {
    try {
      // Get recent emotions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentEmotions = await EmotionLog.find({
        userId,
        date: { $gte: oneWeekAgo }
      });
      
      if (recentEmotions.length >= 3) {
        // Calculate weekly pattern
        const emotionStats = new Map();
        
        recentEmotions.forEach(e => {
          if (!emotionStats.has(e.emotion)) {
            emotionStats.set(e.emotion, {
              count: 0,
              totalIntensity: 0
            });
          }
          
          const stat = emotionStats.get(e.emotion);
          stat.count++;
          stat.totalIntensity += e.intensity;
        });
        
        // Convert to object format
        const statsObj = {};
        emotionStats.forEach((value, key) => {
          statsObj[key] = {
            count: value.count,
            averageIntensity: Math.round(value.totalIntensity / value.count),
            dominant: false
          };
        });
        
        // Mark dominant emotion
        let maxCount = 0;
        let dominantEmotion = null;
        
        emotionStats.forEach((value, key) => {
          if (value.count > maxCount) {
            maxCount = value.count;
            dominantEmotion = key;
          }
        });
        
        if (dominantEmotion && statsObj[dominantEmotion]) {
          statsObj[dominantEmotion].dominant = true;
        }
        
        // Create or update mood pattern
        await MoodPattern.findOneAndUpdate(
          {
            userId,
            period: 'weekly',
            startDate: { $lte: oneWeekAgo },
            endDate: { $gte: new Date() }
          },
          {
            userId,
            period: 'weekly',
            startDate: oneWeekAgo,
            endDate: new Date(),
            emotionStats: statsObj,
            topTopics: this.identifyTriggers(recentEmotions),
            moodTrend: this.calculateMoodStats(recentEmotions).moodTrend,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }
      
    } catch (error) {
      console.error('❌ Error updating mood patterns:', error);
    }
  }

  // Get emotion color
  getEmotionColor(emotion, intensity = 5) {
    const colorMap = {
      'joy': { base: '#FFD700', dark: '#FFA500' },
      'sadness': { base: '#4169E1', dark: '#00008B' },
      'anger': { base: '#FF4500', dark: '#8B0000' },
      'fear': { base: '#9370DB', dark: '#4B0082' },
      'anxiety': { base: '#BA55D3', dark: '#800080' },
      'neutral': { base: '#A9A9A9', dark: '#696969' },
      'stress': { base: '#FF6347', dark: '#B22222' },
      'excitement': { base: '#FF69B4', dark: '#C71585' },
      'gratitude': { base: '#32CD32', dark: '#006400' },
      'love': { base: '#FF1493', dark: '#8B008B' },
      'hope': { base: '#87CEEB', dark: '#4682B4' },
      'pride': { base: '#FF8C00', dark: '#FF4500' }
    };
    
    const colors = colorMap[emotion] || colorMap['neutral'];
    return intensity > 7 ? colors.dark : colors.base;
  }

  // Get mood board data
  async getMoodBoard(userId, period = 'month') {
    try {
      const timeline = await this.getMoodTimeline(userId, period);
      const journalEntries = await JournalEntry.find({ userId })
        .sort({ date: -1 })
        .limit(50); // Get more entries for better analysis

      // Create mood board with colors
      const moodBoard = {
        colors: [],
        emotions: {},
        wordCloud: [],
        topics: [],
        averageIntensity: 0,
        insights: []
      };

      // Process timeline for visual data
      let totalIntensity = 0;
      let intensityCount = 0;

      timeline.timeline.forEach(day => {
        moodBoard.colors.push({
          date: day.date,
          color: day.dominantColor || '#A9A9A9',
          emotion: day.dominantEmotion,
          intensity: day.averageIntensity
        });

        // Count emotions for distribution
        if (day.dominantEmotion) {
          moodBoard.emotions[day.dominantEmotion] = (moodBoard.emotions[day.dominantEmotion] || 0) + 1;
        }

        // Calculate average intensity
        if (day.averageIntensity) {
          totalIntensity += day.averageIntensity;
          intensityCount++;
        }
      });

      // Calculate average intensity
      moodBoard.averageIntensity = intensityCount > 0 ? Math.round(totalIntensity / intensityCount) : 5;

      // Generate word cloud from journal entries
      if (journalEntries.length > 0) {
        moodBoard.wordCloud = this.generateWordCloud(journalEntries);
      }

      // Extract topics from recent entries
      const allTopics = new Set();
      journalEntries.forEach(entry => {
        if (entry.topics && Array.isArray(entry.topics)) {
          entry.topics.forEach(topic => allTopics.add(topic));
        }
      });
      moodBoard.topics = Array.from(allTopics).slice(0, 10);

      // Generate insights
      moodBoard.insights = await this.generateMoodInsights(userId, timeline, journalEntries);

      return moodBoard;

    } catch (error) {
      console.error('❌ Error getting mood board:', error);
      // Return empty mood board instead of throwing
      return {
        colors: [],
        emotions: {},
        wordCloud: [],
        topics: [],
        averageIntensity: 5,
        insights: ['Unable to load mood data at this time.']
      };
    }
  }

  // Generate word cloud from journal entries
  generateWordCloud(journalEntries) {
    const wordFreq = {};
    
    journalEntries.forEach(entry => {
      const words = entry.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });
    
    // Convert to array and sort by frequency
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({
        text: word,
        value: count,
        size: Math.min(100, Math.max(20, count * 5))
      }));
  }

  // Check if word is a stop word
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'but', 'for', 'with', 'that', 'this', 'have', 'from',
      'like', 'just', 'know', 'what', 'when', 'where', 'how', 'why', 'who',
      'was', 'were', 'are', 'is', 'am', 'be', 'been', 'being', 'has', 'had',
      'will', 'would', 'could', 'should', 'can', 'cannot', 'couldnt', 'shouldnt',
      'wont', 'wouldnt', 'shall', 'shan\'t', 'might', 'must', 'need', 'needs'
    ]);
    
    return stopWords.has(word);
  }

  // Generate mood insights
  async generateMoodInsights(userId, timeline, journalEntries) {
    const insights = [];
    
    // Mood trend insight
    if (timeline.stats.moodTrend === 'improving') {
      insights.push("Your mood has been improving recently. Notice what's been contributing to this positive trend.");
    } else if (timeline.stats.moodTrend === 'declining') {
      insights.push("I notice a downward trend in your mood. Would you like to explore what might be contributing to this?");
    }
    
    // Most common emotion insight
    if (timeline.stats.mostCommonEmotion !== 'neutral') {
      insights.push(`Your most frequent emotion has been ${timeline.stats.mostCommonEmotion}. This might indicate areas that need attention or reflection.`);
    }
    
    // Journal consistency insight
    if (journalEntries.length >= 7) {
      insights.push("Great job maintaining your journal! Regular reflection is a powerful tool for self-awareness.");
    } else if (journalEntries.length < 3) {
      insights.push("Consider journaling more frequently. Even a few sentences each day can provide valuable insights.");
    }
    
    // Emotional range insight
    if (timeline.stats.emotionalRange > 6) {
      insights.push("You're experiencing a wide range of emotions. This emotional diversity is normal and human.");
    }
    
    // Pattern-based insights
    if (timeline.patterns && timeline.patterns.timeOfDay) {
      const timePatterns = timeline.patterns.timeOfDay;
      
      if (timePatterns.evening.count > timePatterns.morning.count * 2) {
        insights.push("You tend to reflect more in the evenings. Consider what makes this time particularly conducive to introspection.");
      }
    }
    
    return insights;
  }
}

module.exports = new MoodTracker();