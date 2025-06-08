const express = require('express');
const { login, register, getMe, logout } = require('../controller/auth');
const authenticateJWT = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);

router.get('/me', authenticateJWT, getMe);

router.post('/register', register);

router.get('/logout', authenticateJWT, logout);

module.exports = router;
