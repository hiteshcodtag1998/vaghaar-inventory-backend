// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Bearer header
    if (!token) return res.status(401).send('Access Denied');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid Token');
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateJWT;
