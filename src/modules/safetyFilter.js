// src/modules/safetyFilter.js

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
  "i'm planning to hurt myself"
];

const distressIndicators = [
  "i hate my life",
  "i wish i wasn't here",
  "life is pointless",
  "i can't do this anymore",
  "i feel hopeless",
  "i don’t want to exist",
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
  const msg = message.toLowerCase();

  if (severeIndicators.some(phrase => msg.includes(phrase))) return 2;
  if (distressIndicators.some(phrase => msg.includes(phrase))) return 1;
  return 0;
}

/**
 * Returns true if any crisis indicator is detected
 */
function checkForCrisis(message) {
  return getSafetyLevel(message) > 0;
}

// Export both functions
module.exports = {
  checkForCrisis,
  getSafetyLevel
};
