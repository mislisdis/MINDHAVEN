// src/controllers/chatbotController.js
const conversationLoop = require('../chatbot/conversationLoop');
const Message = require('../models/Message'); // MongoDB schema

/**
 * Handle incoming user messages from frontend.
 * Stores both user and bot messages in MongoDB.
 */
exports.handleMessage = async (req, res, next) => {
  try {
    const { message, userId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1️⃣ Save user message
    const userMsg = new Message({
      userId,
      sender: 'user',
      text: message
    });
    await userMsg.save();

    // 2️⃣ Process conversation round
    const { emotion, reply, resources } = await conversationLoop.processMessage(message, userId);

    // 3️⃣ Save bot response
    const botMsg = new Message({
      userId,
      sender: 'bot',
      text: reply,
      emotion: emotion || 'neutral'
    });
    await botMsg.save();

    // 4️⃣ Return bot response to frontend
    return res.status(200).json({ emotion, reply, resources });
  } catch (err) {
    console.error('ChatbotController error:', err.message);
    next(err);
  }
};

/**
 * Fetch user-specific chat history to pre-render on page load.
 * Returns messages sorted by creation time.
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    // ✅ Get userId from session (if using authentication)
    const userId = req.user?._id; // assumes user is authenticated
    if (!userId) return res.status(401).send('Unauthorized: User not logged in');

    // Fetch messages from MongoDB
    const messages = await Message.find({ userId }).sort({ createdAt: 1 });

    // Render chat page with pre-rendered messages and userId for frontend
    res.render('chat', { layout: 'main', messages, user: { _id: userId } });
  } catch (err) {
    console.error('ChatbotController getChatHistory error:', err.message);
    next(err);
  }
};

/**
 * Clear user context from memory or DB if needed.
 * Useful to "reset" chat session.
 */
exports.clearContext = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).send('Unauthorized: User not logged in');

    // Optionally clear conversationLoop memory
    conversationLoop.clearContext(userId);

    // Optional: delete messages from MongoDB
    await Message.deleteMany({ userId });

    res.json({ ok: true, message: 'User context cleared' });
  } catch (err) {
    console.error('ChatbotController clearContext error:', err.message);
    next(err);
  }
};
