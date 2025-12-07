const bcrypt = require('bcrypt');
const User = require('../models/User');

// Lock policy constants
const MAX_ATTEMPTS = 4;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

exports.login = async (req, res, next) => {
  try {
<<<<<<< Updated upstream
=======
    console.log('🔐 Login attempt for:', req.body.email);

>>>>>>> Stashed changes
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    // Validate input
    if (!email || !password) {
      return res.render('login', { 
        error: 'Email and password are required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
<<<<<<< Updated upstream
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
=======
    console.log('📋 Found user:', user ? user.email : 'No user found');

    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.render('login', { 
        error: 'Invalid email or password' 
      });
    }

    // Check account lock
    if (user.isLocked && user.lockUntil > new Date()) {
      console.log('🔒 Account is locked until:', user.lockUntil);
      return res.render('login', { 
        error: 'Account is temporarily locked. Please try again later.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('🔑 Password match:', isMatch);

    if (!isMatch) {
      user.failedAttempts += 1;
      console.log(`❌ Failed attempts: ${user.failedAttempts}`);
      
      // Lock account if too many failed attempts
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        console.log(`🔒 Locking account until ${user.lockUntil}`);
      }
      
      await user.save();
      return res.render('login', { 
        error: 'Invalid email or password' 
      });
    }

    // Successful login - reset failed attempts
    user.failedAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    console.log('✅ Login successful for:', user.email);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        isAdmin: user.isAdmin || false
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('🎫 JWT generated successfully');
    
    // Set cookie with proper options
    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    console.log('🍪 Cookie set successfully');
    console.log('🔄 Redirecting to /chat');
    
    return res.redirect('/chat');
    
  } catch (err) {
    console.error('💥 Login error:', err.message);
    console.error(err.stack);
    return res.render('login', { 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
};

exports.logout = (req, res) => {
  try {
    console.log('👋 Logging out user');
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    console.log('✅ Cookie cleared, redirecting to login');
    return res.redirect('/login');
  } catch (err) {
    console.error('💥 Logout error:', err.message);
    return res.redirect('/login');
  }
};

// Admin login
exports.adminLogin = async (req, res, next) => {
  try {
    console.log('👑 Admin login attempt for:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('admin-login', { 
        error: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });
    console.log('📋 Found admin user:', user ? user.email : 'No user');

    if (!user || !user.isAdmin) {
      console.log('❌ Not an admin or user not found');
      return res.render('admin-login', { 
        error: 'Invalid admin credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      console.log('❌ Invalid password for admin');
      return res.render('admin-login', { 
        error: 'Invalid password' 
      });
    }

    console.log('✅ Admin login successful for:', user.email);
    
    const token = jwt.sign(
      { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        admin: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    
    console.log('🍪 Admin cookie set, redirecting to /admin');
    return res.redirect('/admin');
    
  } catch (err) {
    console.error('💥 Admin login error:', err.message);
    return res.render('admin-login', { 
      error: 'An unexpected error occurred' 
    });
  }
};

exports.adminLogout = (req, res) => {
  try {
    console.log('👑 Admin logging out');
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    return res.redirect('/admin/login');
  } catch (err) {
    console.error('💥 Admin logout error:', err.message);
    return res.redirect('/admin/login');
  }
};
>>>>>>> Stashed changes
