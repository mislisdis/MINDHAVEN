// Return resources based on emotion. Loads data/resources.json if present.
const fs = require('fs');
const path = require('path');

let resources = {};
try {
  const p = path.join(__dirname, '../../data/resources.json');
  if (fs.existsSync(p)) resources = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) {
  resources = {};
}

function recommendForEmotion(emotion) {
  const e = (emotion || 'neutral').toLowerCase();
  // resources.json expected shape: { joy: [...], sadness: [...], neutral: [...] }
  if (resources[e]) return resources[e];
  // fallback - show neutral/general resources or empty array
  return resources['neutral'] || [];
}

module.exports = recommendForEmotion;
