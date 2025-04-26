const express = require('express');
const router = express.Router();
const {register,login,sidebarUsers}= require('../controllers/authController');
const authenticate = require('../middleware/middleware');

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

router.get('/sidebar',authenticate, sidebarUsers);

module.exports = router;
