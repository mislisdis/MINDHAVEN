// Basic skeleton for JWT auth. Use when you implement auth.
const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer) return res.status(401).json({ error: 'Missing token' });
  const token = bearer.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
