// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const Message = require('../models/Message');

// Get all chats for logged-in user
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create a new chat
router.post('/new', async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.user._id,
      title: "What's on your mind today?" // Default first chat title
    });
    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Save a message
router.post('/message', async (req, res) => {
  try {
    const { chatId, sender, text, emotion } = req.body;
    const message = new Message({ chatId, sender, text, emotion });
    await message.save();
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Bot reply
router.post('/:chatId/botMessage', async (req, res) => {
  try {
    const { message } = req.body;
    // Simple AI placeholder
    const reply = `You said: "${message}"`;
    const emotion = 'neutral';
    res.json({ reply, emotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bot failed to respond' });
  }
});

module.exports = router;
