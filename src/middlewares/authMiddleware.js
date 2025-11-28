// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// -----------------------------
// Require normal user auth
// -----------------------------
const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ error: 'Unauthorized — no token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized — user not found' });
    }

    req.user = user; // attach full user object to req
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(401).json({ error: 'Unauthorized — token invalid' });
  }
};

// -----------------------------
// Require admin access
// -----------------------------
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.token; // use same cookie as adminLogin
    if (!token) return res.redirect('/admin/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the token payload has admin flag
    if (!decoded.admin) return res.redirect('/admin/login');

    // Optional: Verify admin still exists in DB
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) return res.redirect('/admin/login');

    req.user = user; // attach full user object
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    return res.redirect('/admin/login');
  }
};

module.exports = { requireAuth, requireAdmin };
