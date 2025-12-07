const natural = require('natural');
const Sentiment = require('sentiment');
const fs = require('fs');
const path = require('path');

class JournalAnalyzer {
  constructor() {
    try {
      this.sentiment = new Sentiment();
      this.tokenizer = new natural.WordTokenizer();
      this.tfidf = new natural.TfIdf();
      
      // Load custom dictionaries if they exist
      this.loadCustomDictionaries();
      
      console.log("✅ Journal Analyzer initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Journal Analyzer:", error);
      this.sentiment = null;
      this.tokenizer = null;
      this.tfidf = null;
    }
  }

  // Load custom emotion dictionaries
  loadCustomDictionaries() {
    try {
      // Try to load custom emotion words
      const customEmotionsPath = path.join(__dirname, 'custom-emotions.json');
      if (fs.existsSync(customEmotionsPath)) {
        const customData = JSON.parse(fs.readFileSync(customEmotionsPath, 'utf8'));
        if (customData.emotions) {
          this.customEmotions = customData.emotions;
          console.log(`📚 Loaded custom emotions dictionary`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load custom dictionaries:', error.message);
    }
  }

  // Main analysis function
  async analyzeEntry(content, userId = null) {
    try {
      // Validate input
      if (!content || typeof content !== 'string') {
        console.error('❌ Invalid content provided to analyzer');
        return this.getFallbackAnalysis('');
      }
      
      console.log(`📖 Analyzing journal entry (${content.length} chars, ${this.countWords(content)} words)`);
      
      // Check if we have the necessary tools
      if (!this.sentiment || !this.tokenizer) {
        console.warn('⚠️ Analyzer tools not available, using fallback');
        return this.getFallbackAnalysis(content);
      }
      
      // 1. Sentiment analysis
      console.log('🔍 Running sentiment analysis...');
      const sentimentResult = this.sentiment.analyze(content);
      console.log(`   Sentiment score: ${sentimentResult.score}`);
      
      // 2. Extract topics using TF-IDF
      console.log('🔍 Extracting topics...');
      const topics = this.extractTopics(content);
      console.log(`   Topics found: ${topics.join(', ')}`);
      
      // 3. Emotion detection from keywords
      console.log('🔍 Detecting emotions...');
      const emotions = this.detectEmotions(content);
      console.log(`   Emotions detected: ${emotions.join(', ')}`);
      
      // 4. Calculate word count and readability
      const wordCount = this.countWords(content);
      console.log(`   Word count: ${wordCount}`);
      
      // 5. Extract gratitude statements
      const gratitudeList = this.extractGratitude(content);
      console.log(`   Gratitude statements: ${gratitudeList.length}`);
      
      // 6. Generate reflection questions
      const reflectionQuestions = this.generateReflectionQuestions(content, emotions, topics);
      
      // 7. Determine dominant emotion
      const dominantEmotion = this.determineDominantEmotion(emotions, sentimentResult);
      console.log(`   Dominant emotion: ${dominantEmotion}`);
      
      // 8. Calculate emotion intensity
      const emotionIntensity = this.calculateEmotionIntensity(sentimentResult, emotions);
      console.log(`   Emotion intensity: ${emotionIntensity}/10`);
      
      // 9. Generate insights
      const insights = this.generateInsights(content, emotions, topics, sentimentResult);
      
      // 10. Assign mood color
      const moodColor = this.getMoodColor(dominantEmotion, emotionIntensity);
      
      // 11. Generate tags
      const tags = this.generateTags(emotions, topics);
      
      const result = {
        emotions,
        dominantEmotion,
        emotionIntensity,
        topics,
        wordCount,
        sentiment: {
          score: sentimentResult.score,
          comparative: sentimentResult.comparative,
          positive: sentimentResult.positive,
          negative: sentimentResult.negative
        },
        gratitudeList,
        reflectionQuestions,
        insights,
        moodColor,
        tags
      };
      
      console.log(`✅ Journal analysis complete: ${dominantEmotion} (${emotionIntensity}/10)`);
      console.log('📊 Analysis summary:', {
        topics: result.topics.length,
        emotions: result.emotions.length,
        gratitude: result.gratitudeList.length,
        questions: result.reflectionQuestions.length
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Journal analysis error:', error);
      console.error('Stack trace:', error.stack);
      return this.getFallbackAnalysis(content);
    }
  }

  // Helper to count words
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Extract topics from content
  extractTopics(content) {
    try {
      if (!content || !this.tokenizer) return [];
      
      const tokens = this.tokenizer.tokenize(content.toLowerCase());
      if (!tokens || tokens.length === 0) return [];
      
      // Enhanced topic keywords with more context
      const topicKeywords = {
        'work': ['work', 'job', 'career', 'boss', 'colleague', 'office', 'meeting', 'project', 'deadline', 'promotion', 'resign', 'hire'],
        'school': ['school', 'study', 'exam', 'homework', 'college', 'university', 'class', 'professor', 'assignment', 'grade', 'graduate', 'test', 'quiz'],
        'relationships': ['friend', 'family', 'partner', 'relationship', 'love', 'breakup', 'marriage', 'dating', 'parent', 'sibling', 'trust', 'communication'],
        'health': ['health', 'sick', 'pain', 'doctor', 'hospital', 'exercise', 'diet', 'mental', 'physical', 'therapy', 'medication', 'recovery'],
        'finance': ['money', 'bill', 'debt', 'salary', 'spend', 'save', 'budget', 'investment', 'loan', 'credit', 'expensive', 'afford'],
        'self_improvement': ['goal', 'habit', 'routine', 'productivity', 'growth', 'learn', 'meditate', 'journal', 'read', 'practice', 'skill'],
        'anxiety': ['worry', 'anxious', 'stress', 'overwhelm', 'pressure', 'panic', 'fearful', 'tense', 'nervous', 'apprehensive'],
        'sleep': ['sleep', 'insomnia', 'tired', 'energy', 'rest', 'dream', 'nightmare', 'fatigue', 'exhausted', 'awake', 'nap'],
        'hobbies': ['hobby', 'game', 'sport', 'music', 'art', 'read', 'write', 'paint', 'draw', 'garden', 'cook', 'travel'],
        'future': ['future', 'plan', 'dream', 'goal', 'aspiration', 'hope', 'ambition', 'wish', 'desire', 'expectation'],
        'gratitude': ['thankful', 'grateful', 'appreciate', 'blessed', 'fortunate', 'lucky', 'privileged', 'content'],
        'creativity': ['create', 'write', 'draw', 'paint', 'compose', 'design', 'build', 'make', 'invent', 'imagine']
      };
      
      const topicScores = {};
      
      tokens.forEach(token => {
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
          if (keywords.includes(token)) {
            topicScores[topic] = (topicScores[topic] || 0) + 1;
          }
        }
      });
      
      // Sort topics by frequency and return top ones
      const sortedTopics = Object.entries(topicScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);
      
      return sortedTopics.length > 0 ? sortedTopics : ['general'];
      
    } catch (error) {
      console.error('Error extracting topics:', error);
      return ['general'];
    }
  }

  // Enhanced emotion detection
  detectEmotions(content) {
    try {
      if (!content) return ['neutral'];
      
      const lowerContent = content.toLowerCase();
      // Emotion keywords expansion
      const emotionKeywords = {
        'joy': ['happy', 'excited', 'joy', 'great', 'good', 'wonderful', 'amazing', 'love', 'delighted', 'thrilled', 'content', 'pleased', 'satisfied'],
        'sadness': ['sad', 'unhappy', 'depressed', 'miserable', 'lonely', 'heartbroken', 'tear', 'grief', 'mourn', 'down', 'blue', 'hopeless', 'fail', 'failed', 'failure', 'loser', 'disappointed'],
        'anger': ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'rage', 'hate', 'irritated', 'outraged', 'resent', 'bitter'],
        'disgust': ['disgust', 'disgusted', 'gross', 'nauseated', 'repulsed', 'revolted', 'nasty'],
        'fear': ['scared', 'afraid', 'fear', 'terrified', 'anxious', 'worried', 'panic', 'dread', 'horror', 'frightened', 'intimidated'],
        'anxiety': ['anxious', 'worried', 'stress', 'overwhelmed', 'pressure', 'nervous', 'tense', 'uneasy', 'restless', 'apprehensive'],
        'gratitude': ['thankful', 'grateful', 'appreciate', 'blessed', 'fortunate', 'lucky', 'privileged', 'thank', 'appreciation'],
        'hope': ['hope', 'optimistic', 'looking forward', 'excited for', "can't wait", 'expectant', 'anticipate', 'aspire', 'wish'],
        'love': ['love', 'affection', 'adore', 'cherish', 'fond', 'caring', 'compassion', 'tender', 'devotion'],
        'surprise': ['surprised', 'astonished', 'amazed', 'shocked', 'stunned', 'startled', 'unexpected', 'wow'],
        'neutral': ['okay', 'fine', 'alright', 'normal', 'usual', 'regular', 'average', 'ordinary', 'typical']
      };
      
      const emotionScores = {};
      
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        let score = 0;
        keywords.forEach(keyword => {
          // Use word boundaries for better matching
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = lowerContent.match(regex);
          if (matches) {
            score += matches.length;
            // Give extra weight for strong emotion words
            if (['furious', 'terrified', 'heartbroken', 'thrilled', 'delighted'].includes(keyword)) {
              score += 2;
            }
          }
        });
        
        if (score > 0) {
          emotionScores[emotion] = score;
        }
      }
      
      // Sort emotions by score and return top 3
      const detectedEmotions = Object.entries(emotionScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([emotion]) => emotion);
      
      return detectedEmotions.length > 0 ? detectedEmotions : ['neutral'];
      
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return ['neutral'];
    }
  }

  // Enhanced gratitude extraction
  extractGratitude(content) {
    try {
      if (!content) return [];
      
      const gratitudePatterns = [
        /I (?:am|feel) (?:grateful|thankful) (?:for|that|because) ([^\.!?]+)/gi,
        /I (?:am|feel) blessed (?:with|to|because) ([^\.!?]+)/gi,
        /I appreciate ([^\.!?]+)/gi,
        /Thank (?:you|god) (?:for|that) ([^\.!?]+)/gi,
        /I (?:am|feel) lucky (?:to|that) ([^\.!?]+)/gi,
        /I (?:am|feel) fortunate (?:to|that) ([^\.!?]+)/gi,
        /Grateful for ([^\.!?]+)/gi,
        /Feeling thankful for ([^\.!?]+)/gi
      ];
      
      const gratitudeList = new Set(); // Use Set to avoid duplicates
      
      gratitudePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Clean up the match
            let cleanMatch = match.trim();
            // Remove the pattern prefix
            cleanMatch = cleanMatch.replace(/^(I (?:am|feel) (?:grateful|thankful|blessed|lucky|fortunate) (?:for|that|because|with|to)|I appreciate|Thank (?:you|god) (?:for|that)|Grateful for|Feeling thankful for)/i, '').trim();
            
            if (cleanMatch.length > 3 && !cleanMatch.toLowerCase().includes('http')) {
              gratitudeList.add(cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1));
            }
          });
        }
      });
      
      // Also look for simple statements
      const simplePatterns = [
        /grateful for ([^\.!?,]+)/gi,
        /thankful for ([^\.!?,]+)/gi,
        /appreciate ([^\.!?,]+)/gi
      ];
      
      simplePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            let cleanMatch = match.replace(/^(grateful for|thankful for|appreciate)/i, '').trim();
            if (cleanMatch.length > 3) {
              gratitudeList.add(cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1));
            }
          });
        }
      });
      
      return Array.from(gratitudeList).slice(0, 5);
      
    } catch (error) {
      console.error('Error extracting gratitude:', error);
      return [];
    }
  }

  // Generate reflection questions
  generateReflectionQuestions(content, emotions, topics) {
    const questions = [];
    
    try {
      // Emotion-based questions
      const emotionQuestions = {
        'sadness': [
          "What might this sadness be trying to tell you about what matters?",
          "Has there been a moment of lightness today, however small?",
          "What would comfort you right now?"
        ],
        'anxiety': [
          "What's one small step that could make this feel 1% more manageable?",
          "What would your wisest self say to your anxious self right now?",
          "Where in your body do you feel this anxiety?"
        ],
        'fear': [
          "What's the smallest version of this fear that you can imagine?",
          "What would help you feel safe right now?",
          "Has this fear taught you anything important?"
        ],
        'joy': [
          "What made this moment of joy feel special?",
          "How can you create more moments like this?",
          "Who could you share this joy with?"
        ],
        'anger': [
          "What need isn't being met right now?",
          "What boundaries might need to be set?",
          "How can you channel this energy constructively?"
        ],
        'gratitude': [
          "How does expressing gratitude change your perspective?",
          "What's one small thing you're grateful for that you usually overlook?",
          "How can you carry this gratitude into tomorrow?"
        ]
      };
      
      // Add emotion-specific questions
      emotions.forEach(emotion => {
        if (emotionQuestions[emotion]) {
          questions.push(...emotionQuestions[emotion].slice(0, 1));
        }
      });
      
      // Topic-based questions
      if (topics.includes('work') || topics.includes('school')) {
        questions.push("What's one boundary that might help you feel more balanced?");
        questions.push("What aspect of this feels most meaningful to you?");
      }
      
      if (topics.includes('relationships')) {
        questions.push("What do you need most in your relationships right now?");
        questions.push("How does this connect to your sense of connection?");
      }
      
      if (topics.includes('health')) {
        questions.push("What's one small thing you could do today to support your health?");
        questions.push("How is your body trying to communicate with you?");
      }
      
      // General reflection questions (fallbacks)
      const generalQuestions = [
        "What's the next layer beneath what you've already explored?",
        "If this feeling had a color or texture, what would it be?",
        "What would you tell a friend who was feeling this way?",
        "What's one small step forward from here?",
        "How would your future self look back on this moment?"
      ];
      
      // Add general questions if we don't have enough
      while (questions.length < 3) {
        const randomQuestion = generalQuestions[Math.floor(Math.random() * generalQuestions.length)];
        if (!questions.includes(randomQuestion)) {
          questions.push(randomQuestion);
        }
      }
      
      return questions.slice(0, 3);
      
    } catch (error) {
      console.error('Error generating reflection questions:', error);
      return [
        "What's on your mind right now?",
        "How does writing this down make you feel?",
        "What's one thing you learned about yourself today?"
      ];
    }
  }

  // Generate tags from emotions and topics
  generateTags(emotions, topics) {
    const tags = new Set();
    
    // Add emotions as tags
    emotions.forEach(emotion => tags.add(emotion));
    
    // Add topics as tags
    topics.slice(0, 3).forEach(topic => tags.add(topic));
    
    // Add date-based tags
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) tags.add('morning');
    else if (hour < 17) tags.add('afternoon');
    else tags.add('evening');
    
    // Add day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    tags.add(days[now.getDay()]);
    
    return Array.from(tags);
  }

  // [Keep the rest of your methods as they are...]
  // (determineDominantEmotion, calculateEmotionIntensity, generateInsights, 
  // getMoodColor, getFallbackAnalysis - they're already good)

  determineDominantEmotion(emotions, sentiment) {
    if (emotions.length === 0) {
      return sentiment.score > 2 ? 'joy' : sentiment.score < -2 ? 'sadness' : 'neutral';
    }
    return emotions[0];
  }

  calculateEmotionIntensity(sentiment, emotions) {
    let intensity = 5; // Default
    
    // Adjust based on sentiment score
    const absScore = Math.abs(sentiment.score);
    if (absScore > 5) intensity = 9;
    else if (absScore > 3) intensity = 7;
    else if (absScore > 1) intensity = 6;
    
    // Adjust based on number of strong emotion words
    const strongEmotions = ['anger', 'fear', 'anxiety', 'sadness', 'joy', 'love'];
    const strongCount = emotions.filter(e => strongEmotions.includes(e)).length;
    if (strongCount > 1) intensity = Math.min(10, intensity + 2);
    
    return intensity;
  }

  generateInsights(content, emotions, topics, sentiment) {
    const insights = [];
    
    if (sentiment.score < -3) {
      insights.push("I notice this entry has a strongly negative tone. It might help to explore what specifically is causing this heaviness.");
    } else if (sentiment.score > 3) {
      insights.push("This entry has a positive tone! It's great to notice and celebrate these moments of lightness.");
    }
    
    if (emotions.length > 2) {
      insights.push("You're experiencing multiple emotions at once, which is completely normal. Complex feelings often need space to be unpacked.");
    }
    
    if (topics.includes('work') && topics.includes('anxiety')) {
      insights.push("Work-related anxiety is common. Consider what specific aspects feel most overwhelming.");
    }
    
    if (this.extractGratitude(content).length > 0) {
      insights.push("Noticing gratitude, even in difficult times, can be a powerful coping strategy.");
    }
    
    return insights.length > 0 ? insights.join(' ') : "Keep writing. Your reflections are valuable.";
  }

  getMoodColor(emotion, intensity) {
    const colorMap = {
      'joy': { base: '#FFD700', dark: '#FFA500' },
      'sadness': { base: '#4169E1', dark: '#00008B' },
      'anger': { base: '#FF4500', dark: '#8B0000' },
      'fear': { base: '#9370DB', dark: '#4B0082' },
      'anxiety': { base: '#BA55D3', dark: '#800080' },
      'neutral': { base: '#A9A9A9', dark: '#696969' },
      'gratitude': { base: '#32CD32', dark: '#006400' },
      'hope': { base: '#87CEEB', dark: '#4682B4' },
      'love': { base: '#FF1493', dark: '#8B0A50' },
      'surprise': { base: '#FF69B4', dark: '#8B4789' }
    };
    
    const colors = colorMap[emotion] || colorMap['neutral'];
    return intensity > 7 ? colors.dark : colors.base;
  }

  getFallbackAnalysis(content) {
    const wordCount = this.countWords(content);
    return {
      emotions: ['neutral'],
      dominantEmotion: 'neutral',
      emotionIntensity: 5,
      topics: ['general'],
      wordCount,
      sentiment: { score: 0, comparative: 0, positive: [], negative: [] },
      gratitudeList: [],
      reflectionQuestions: [
        "What's on your mind right now?",
        "How does writing this down make you feel?",
        "What's one thing you learned about yourself today?"
      ],
      insights: "Thank you for sharing. Keep writing—it's a powerful tool for self-discovery.",
      moodColor: '#A9A9A9',
      tags: ['journal', 'reflection']
    };
  }
}

module.exports = new JournalAnalyzer();