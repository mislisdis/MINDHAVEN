const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/chatbotController');
const { requireAuth } = require('../middlewares/authMiddleware');

// POST /api/chatbot/message (protected)
router.post('/message', requireAuth, handleMessage);

module.exports = router;
