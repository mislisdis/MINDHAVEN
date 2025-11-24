// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }, // new: group messages by chat
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  emotion: { type: String, default: 'neutral' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
