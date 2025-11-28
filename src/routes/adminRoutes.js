const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { adminLogin, adminLogout } = require('../controllers/authController');

console.log('Admin routes loaded');

// Ping route
router.get('/_ping', (req, res) => res.send('admin ok'));

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin-login');
});

// Admin login POST
router.post('/login', adminLogin);

// Admin logout POST
router.post('/logout', adminLogout);

// Admin dashboard (protected)
router.get('/', requireAdmin, getAdminDashboard);

module.exports = router;
