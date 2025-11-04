const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/chatbotController');

// POST /api/chatbot/message
router.post('/message', handleMessage);

module.exports = router;
