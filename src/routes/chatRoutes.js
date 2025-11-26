// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const Message = require('../models/Message');
const conversationLoop = require('../chatbot/conversationLoop');

// -------------------------
// Get all chats for user
// -------------------------
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// -------------------------
// Create a new chat
// -------------------------
router.post('/new', async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.user._id,
      title: "What's on your mind today?"
    });

    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// -------------------------
// Load messages for a chat
// -------------------------
router.get('/:chatId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// -------------------------
// Save a user/bot message
// -------------------------
router.post('/message', async (req, res) => {
  try {
    const { chat, sender, text, emotion } = req.body;

    const message = new Message({
      chat,      // MUST be "chat", not "chatId"
      sender,
      text,
      emotion
    });

    await message.save();
    res.json(message);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// -------------------------
// Generate bot reply using
// ConversationLoop AI Engine
// -------------------------
router.post('/:chatId/botMessage', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;
    const chatId = req.params.chatId;

    // RUN THE AI ENGINE 🔥
    const ai = await conversationLoop.processMessage(message, userId);

    // Save bot message
    const botMessage = new Message({
      chat: chatId,
      sender: "bot",
      text: ai.reply,
      emotion: ai.emotion
    });

    await botMessage.save();

    // Return AI result to frontend
    res.json({
      reply: ai.reply,
      emotion: ai.emotion,
      recommendation: ai.resources?.length > 0 ? ai.resources[0] : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bot failed to respond' });
  }
});

module.exports = router;
