const express = require('express');
const { login, register, getMe, logout } = require('../controller/auth');

const router = express.Router();

router.post('/login', login);

router.get('/me', getMe);

router.post('/register', register);

router.post('/logout', logout);

module.exports = router;
