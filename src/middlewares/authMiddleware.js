// Basic skeleton for JWT auth. Use when you implement auth.
const jwt = require('jsonwebtoken');
<<<<<<< Updated upstream
=======
const User = require('../models/User');

// -----------------------------
// Require normal user auth
// -----------------------------
const requireAuth = async (req, res, next) => {
  console.log('🔐 [requireAuth] Checking authentication...');
  console.log('🍪 Cookies:', req.cookies);
  console.log('📍 Request path:', req.path);
  
  const token = req.cookies?.token;

  if (!token) {
    console.log('❌ [requireAuth] No token found in cookies');
    
    // If it's an API request, return JSON error
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Unauthorized — please login first' 
      });
    }
    
    // For page requests, redirect to login
    console.log('🔄 Redirecting to /login');
    return res.redirect('/login');
  }
>>>>>>> Stashed changes

exports.requireAuth = (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer) return res.status(401).json({ error: 'Missing token' });
  const token = bearer.split(' ')[1];
  try {
    console.log('🔍 [requireAuth] Verifying JWT token...');
    
    // Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< Updated upstream
    req.user = payload;
=======
    console.log('✅ [requireAuth] Token verified for user:', payload.email);
    console.log('📋 Token payload:', payload);

    // Fetch user from database
    const user = await User.findById(payload.id);
    if (!user) {
      console.log('❌ [requireAuth] User not found in database');
      
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
          error: 'Unauthorized — user not found' 
        });
      }
      return res.redirect('/login');
    }

    // Attach user to request
    req.user = user;
    console.log(`✅ [requireAuth] Authentication successful for: ${user.email}`);
    console.log('👤 User attached to request:', {
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    });
    
>>>>>>> Stashed changes
    next();
    
  } catch (err) {
<<<<<<< Updated upstream
    return res.status(401).json({ error: 'Invalid token' });
  }
};
=======
    console.error('❌ [requireAuth] JWT verification error:', err.message);
    
    // Clear invalid cookie
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Unauthorized — invalid or expired token' 
      });
    }
    
    console.log('🔄 Redirecting to /login due to invalid token');
    return res.redirect('/login');
  }
};

// -----------------------------
// Require admin access
// -----------------------------
const requireAdmin = async (req, res, next) => {
  console.log('👑 [requireAdmin] Checking admin access...');
  
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      console.log('❌ [requireAdmin] No token found');
      return res.redirect('/admin/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [requireAdmin] Token verified:', decoded.email);

    // Check admin flag in token
    if (!decoded.admin) {
      console.log('❌ [requireAdmin] Token does not have admin flag');
      return res.redirect('/admin/login');
    }

    // Verify admin still exists in DB
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      console.log('❌ [requireAdmin] User is not an admin in database');
      return res.redirect('/admin/login');
    }

    req.user = user;
    console.log(`✅ [requireAdmin] Admin access granted for: ${user.email}`);
    next();
    
  } catch (err) {
    console.error('❌ [requireAdmin] Auth error:', err.message);
    return res.redirect('/admin/login');
  }
};

module.exports = { requireAuth, requireAdmin };
>>>>>>> Stashed changes
