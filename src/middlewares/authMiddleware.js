// Basic skeleton for JWT auth. Use when you implement auth.
const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  console.log('Cookies:', req.cookies);  // <-- see if token is present
  const token = req.cookies.token;
  if (!token) {
    console.log('No token found, redirecting to login');
    return res.redirect('/login');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT payload:', payload);
    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.redirect('/login');
  }
};

