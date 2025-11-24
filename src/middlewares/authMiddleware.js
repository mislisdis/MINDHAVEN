const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Make sure you have a User model

exports.requireAuth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    console.log('No token found');
    return res.status(401).json({ error: 'Unauthorized — no token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized — user not found' });

    req.user = user; // <-- now req.user._id will work
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({ error: 'Unauthorized — token invalid' });
  }
};
