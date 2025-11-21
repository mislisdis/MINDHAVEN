const fs = require('fs');
const path = require('path');

const resourcePath = path.join(__dirname, '../../data/resources.json');
let resources = {};

try {
  if (fs.existsSync(resourcePath)) {
    resources = JSON.parse(fs.readFileSync(resourcePath, 'utf8'));
  }
} catch (err) {
  console.error("Resource file error:", err.message);
}

function recommendForEmotion(emotion, severity='low') {
  const e = emotion.toLowerCase();
  
  if (!resources[e]) return [];

  if (severity === 'high' && resources[e].crisis) return resources[e].crisis;
  if (severity === 'medium' && resources[e].medium) return resources[e].medium;

  return resources[e].general || [];
}

module.exports = recommendForEmotion;
