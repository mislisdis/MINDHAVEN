// src/controllers/userController.js
const User = require('../models/User');

exports.createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // ⚠️ Prevent duplicates
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ name, email });
    await user.save();

    res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      user,
    });
  } catch (err) {
    console.error('UserController error:', err.message);
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(50);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};
