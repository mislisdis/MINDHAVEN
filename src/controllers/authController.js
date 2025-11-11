const bcrypt = require('bcrypt');
const User = require('../models/User');

// Lock policy constants
const MAX_ATTEMPTS = 4;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // 🔒 Check if account is locked
    if (user.isLocked && user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        error: `Account locked. Try again in ${minutes} minute(s).`
      });
    }

    // 🧩 Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      // ❌ Increment failed attempts
      user.failedAttempts += 1;

      // Lock account if limit exceeded
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        await user.save();
        return res.status(403).json({
          error: 'Too many failed attempts. Account locked for 15 minutes.'
        });
      }

      await user.save();
      return res.status(401).json({
        error: `Invalid password. Attempt ${user.failedAttempts}/${MAX_ATTEMPTS}`
      });
    }

    // ✅ Password is correct → reset attempts
    user.failedAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    // (Here you’d issue JWT or start a session)
    res.json({
      ok: true,
      message: 'Login successful',
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
};
