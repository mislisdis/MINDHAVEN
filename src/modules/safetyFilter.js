// src/modules/safetyFilter.js - URGENT FIX
const severeIndicators = [
  "i want to die", 
  "i will kill myself", 
  "i'm going to kill myself",
  "i plan to die", 
  "i will end it", 
  "i'm ending it all",
  "i want to end everything", 
  "i'm done with life",
  "there's no point anymore", 
  "i can't live anymore",
  "i am going to harm myself", 
  "i'm planning to hurt myself",
  "i want to kill myself",  // MAKE SURE THIS IS HERE
  "kill myself",           // ADD THIS TOO
  "end my life"           // AND THIS
];

const distressIndicators = [
  "i hate my life", 
  "i wish i wasn't here", 
  "life is pointless",
  "i can't do this anymore", 
  "i feel hopeless",
  "i don't want to exist", 
  "i want to disappear", 
  "life sucks",
  "everything hurts", 
  "i'm struggling", 
  "i feel empty",
  "no reason to live", 
  "i feel overwhelmed"
];

/**
 * Returns the severity level of a message:
 * 0 → safe
 * 1 → distress
 * 2 → severe
 */
function getSafetyLevel(message) {
  if (!message || typeof message !== 'string') return 0;
  
  const msg = message.toLowerCase().trim();
  console.log(`🔒 Checking safety for: "${msg}"`);
  
  // Check severe indicators first
  for (const phrase of severeIndicators) {
    if (msg.includes(phrase)) {
      console.log(`🚨 SEVERE CRISIS DETECTED: "${phrase}"`);
      return 2;
    }
  }
  
  // Check distress indicators
  for (const phrase of distressIndicators) {
    if (msg.includes(phrase)) {
      console.log(`⚠️ DISTRESS DETECTED: "${phrase}"`);
      return 1;
    }
  }
  
  return 0;
}

/**
 * Returns object with level for compatibility
 */
function checkForCrisis(message) {
  const level = getSafetyLevel(message);
  console.log(`🔒 Crisis check result: level ${level}`);
  return {
    level: level,
    hasCrisis: level > 0,
    type: level === 2 ? 'severe' : level === 1 ? 'distress' : 'none'
  };
}

module.exports = {
  checkForCrisis,
  getSafetyLevel
};