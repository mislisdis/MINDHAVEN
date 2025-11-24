// src/models/Memory.js
const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: { type: String, required: true },        // short human summary of the understanding
  keywords: { type: [String], default: [] },       // extracted keywords
  vector: { type: [Number], default: [] },         // simple numeric vector (sparse TF)
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memory', MemorySchema);
