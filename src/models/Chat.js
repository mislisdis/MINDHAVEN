// models/Chat.js
const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: "What's on your mind today?" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Chat', chatSchema);
