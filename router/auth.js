const express = require('express');
const { login, register, getMe } = require('../controller/auth');

const router = express.Router();

router.post('/login', login);

router.get('/me', getMe);

router.post('/register', register);

module.exports = router;
