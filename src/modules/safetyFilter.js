const crisisKeywords = [
  "suicide",
  "kill myself",
  "end it",
  "self harm",
  "cut myself",
  "no reason to live",
  "die",
  "ending things"
];

function checkForCrisis(message) {
  const msg = message.toLowerCase();

  for (let word of crisisKeywords) {
    if (msg.includes(word)) {
      return true;
    }
  }

  return false;
}

module.exports = checkForCrisis;
