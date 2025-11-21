// src/controllers/userController.js
const User = require('../models/User');

const bcrypt = require('bcrypt');

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.render('register', { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('register', { error: 'Email already registered' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ name, email, passwordHash });
    await user.save();

    return res.redirect('/login');

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

