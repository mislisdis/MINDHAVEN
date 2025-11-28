// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String },

  email: { type: String, unique: true, sparse: true },

  passwordHash: { type: String },

  failedAttempts: { type: Number, default: 0 },   // 🚨 tracks wrong tries
  isLocked: { type: Boolean, default: false },    // 🔒 lock flag
  lockUntil: { type: Date },                      // ⏰ auto-unlock timer

  createdAt: { type: Date, default: Date.now },

  personality: { 
    type: String, 
    enum: ['warm', 'calm', 'direct', 'neutral'], 
    default: 'warm' 
  },

  isAdmin: { type: Boolean, default: false },     // 👨‍💼 admin flag
});

module.exports = mongoose.model('User', UserSchema);
