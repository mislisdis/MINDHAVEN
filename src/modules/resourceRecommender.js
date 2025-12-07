<<<<<<< Updated upstream
// Return resources based on emotion. Loads data/resources.json if present.
=======
// src/modules/resourceRecommender.js
>>>>>>> Stashed changes
const fs = require('fs');
const path = require('path');

let resources = {};
<<<<<<< Updated upstream
=======
let resourceHistory = new Map(); // Track when resources were last shown

>>>>>>> Stashed changes
try {
  const p = path.join(__dirname, '../../data/resources.json');
  if (fs.existsSync(p)) resources = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) {
  resources = {};
}

<<<<<<< Updated upstream
function recommendForEmotion(emotion) {
  const e = (emotion || 'neutral').toLowerCase();
  // resources.json expected shape: { joy: [...], sadness: [...], neutral: [...] }
  if (resources[e]) return resources[e];
  // fallback - show neutral/general resources or empty array
  return resources['neutral'] || [];
=======
/**
 * Smart resource recommendation based on:
 * 1. Current emotion
 * 2. Conversation context
 * 3. Time since last resource shown
 * 4. Severity of emotion
 */
function recommendResources(emotion, context = {}, userId = null) {
  const e = emotion.toLowerCase();
  
  // Don't show resources too frequently (minimum 5 messages apart)
  if (userId && resourceHistory.has(userId)) {
    const lastShown = resourceHistory.get(userId);
    const timeSince = Date.now() - lastShown.timestamp;
    const messagesSince = context.messageCount || 0;
    
    if (timeSince < 300000 && messagesSince - lastShown.messageCount < 5) {
      return []; // Too soon to show resources again
    }
  }
  
  // Check severity to determine which resources to show
  let resourceList = [];
  
  if (context.severity === 'high' && resources[e] && resources[e].crisis) {
    resourceList = resources[e].crisis;
  } else if (context.severity === 'medium' && resources[e] && resources[e].medium) {
    resourceList = resources[e].medium;
  } else if (resources[e] && resources[e].general) {
    resourceList = resources[e].general;
  }
  
  // If no specific resources for this emotion, fall back to neutral
  if (resourceList.length === 0 && resources.neutral) {
    resourceList = resources.neutral.general || [];
  }
  
  // Only show 1-2 resources at a time
  const selected = resourceList.slice(0, 2);
  
  // Update history
  if (userId && selected.length > 0) {
    resourceHistory.set(userId, {
      timestamp: Date.now(),
      messageCount: context.messageCount || 0,
      emotion: e
    });
  }
  
  return selected;
>>>>>>> Stashed changes
}

/**
 * Check if resources should be suggested based on conversation patterns
 */
function shouldSuggestResources(conversationContext) {
  if (!conversationContext || conversationContext.length < 3) {
    return false;
  }
  
  const lastThree = conversationContext.slice(-3);
  
  // Check for patterns that might indicate need for resources:
  // 1. Repeated negative emotions
  const negativeEmotions = ['sadness', 'anxiety', 'fear', 'anger', 'depression'];
  const negativeCount = lastThree.filter(msg => 
    negativeEmotions.includes(msg.emotion?.toLowerCase())
  ).length;
  
  // 2. Phrases indicating struggle
  const strugglePhrases = [
    'i need help', 'i dont know what to do', 'im struggling',
    'cant cope', 'overwhelmed', 'helpless'
  ];
  
  const hasStrugglePhrase = lastThree.some(msg =>
    strugglePhrases.some(phrase => 
      msg.text?.toLowerCase().includes(phrase)
    )
  );
  
  // 3. Direct requests for resources
  const resourceRequests = [
    'resources', 'help me find', 'where can i get', 'support',
    'hotline', 'counseling', 'therapy'
  ];
  
  const hasResourceRequest = lastThree.some(msg =>
    resourceRequests.some(word => 
      msg.text?.toLowerCase().includes(word)
    )
  );
  
  return negativeCount >= 2 || hasStrugglePhrase || hasResourceRequest;
}

module.exports = { recommendResources, shouldSuggestResources };