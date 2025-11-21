const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Lock policy constants
const MAX_ATTEMPTS = 4;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

exports.login = async (req, res, next) => {
  try {
    console.log('Login attempt:', req.body); // log incoming form data

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('Found user:', user ? user.email : 'No user');

    if (!user) return res.render('login', { error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      user.failedAttempts += 1;
      await user.save();
      console.log(`Failed attempts: ${user.failedAttempts}`);
      return res.render('login', { error: 'Invalid password' });
    }

    console.log('Generating JWT for user:', user.email);
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });
    console.log('JWT cookie set:', token);

    return res.redirect('/chat');
  } catch (err) {
    console.error('Login error:', err.message);
    return res.render('login', { error: 'Unexpected error occurred' });
  }
};