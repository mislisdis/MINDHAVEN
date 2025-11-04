const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String }, // store hashed password if you add auth
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
