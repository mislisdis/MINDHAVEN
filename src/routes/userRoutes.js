const express = require('express');
const router = express.Router();
const { createUser, listUsers } = require('../controllers/userController');

router.post('/register', createUser);
router.get('/', listUsers);

module.exports = router;
