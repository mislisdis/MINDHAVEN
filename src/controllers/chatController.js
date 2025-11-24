const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chats.' });
  }
};

exports.createChat = async (req, res) => {
  try {
    const chat = await Chat.create({ user: req.user._id });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Could not create new chat.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages.' });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { chatId, sender, text, emotion } = req.body;
    const message = await Message.create({ chat: chatId, sender, text, emotion });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message.' });
  }
};
