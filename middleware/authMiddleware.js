const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
    const token = req.cookies.token; // read from cookie instead of header
    console.log('req.cookies', req.cookies, req.body);

    if (!token) {
        return res
            .status(401)
            .json({ message: 'Access Denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(403)
                .json({ message: 'Invalid or expired token.' });
        }

        req.user = decoded;
        next();
    });
}

module.exports = authenticateJWT;
