// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { 
  login, 
  logout, 
  adminLogin, 
  adminLogout 
} = require('../controllers/authController');

// User authentication
router.post('/login', login);
router.post('/logout', logout);

// Admin authentication
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);

module.exports = router;
