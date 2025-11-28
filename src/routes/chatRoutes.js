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
      chat,
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
// Generate bot reply using AI engine
// -------------------------
router.post('/:chatId/botMessage', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;
    const chatId = req.params.chatId;

    const ai = await conversationLoop.processMessage(message, userId);

    const botMessage = new Message({
      chat: chatId,
      sender: "bot",
      text: ai.reply,
      emotion: ai.emotion
    });

    await botMessage.save();

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

// -------------------------
// Delete a chat
// -------------------------
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(500).json({ message: 'Server error deleting chat' });
  }
});

// -------------------------
// Rename a chat
// -------------------------
router.patch('/:id', async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title: req.body.title },
      { new: true }
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json({ message: "Chat renamed", chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
