const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// GET /resources
router.get('/', (req, res) => {
  const resourcesPath = path.join(__dirname, '../../data/resources.json');

  let resources = {};

  try {
    if (fs.existsSync(resourcesPath)) {
      const fileData = fs.readFileSync(resourcesPath, 'utf8');

      // Try parsing JSON
      resources = JSON.parse(fileData);

      // Validate JSON is an object
      if (typeof resources !== 'object' || resources === null) {
        console.warn("⚠ resources.json is not a valid JSON object.");
        resources = {};
      }

    } else {
      console.warn("⚠ resources.json does NOT exist at:", resourcesPath);
    }

  } catch (err) {
    console.error("❌ ERROR reading or parsing resources.json:", err);
    resources = {}; // fallback to empty object
  }

  res.render('resources', {
    resources,
    user: req.user || null,
    landing: false
  });
});

module.exports = router;
