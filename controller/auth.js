const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/handler');
const { PrimaryUser, SecondaryUser } = require('../models/users');

const { JWT_SECRET } = process.env;

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Try finding user from Secondary first, then Primary
        let user =
            (await SecondaryUser.findOne({ email })) ||
            (await PrimaryUser.findOne({ email }));

        if (!user) {
            throw new ApiError('Invalid email or password', 401);
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError('Invalid email or password', 401);
        }

        // Populate role manually if needed
        await user.populate('roleID');

        // Prepare JWT payload
        const payload = {
            id: user._id,
            email: user.email,
            role: user.roleID,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // ✅ Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
            sameSite: 'Strict', // or "Lax" depending on your frontend/backend domains
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        // Only expose safe user fields
        const userData = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleID: user.roleID,
        };

        return sendSuccess(res, { user: userData }, 'Login successful'); // ✅ No token in body
    } catch (err) {
        next(err); // Global error handler
    }
};

// @desc    Register User
exports.register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phoneNumber, imageUrl } =
            req.body;

        // Check if user already exists in either collection
        const existingUser =
            (await PrimaryUser.findOne({ email })) ||
            (await SecondaryUser.findOne({ email }));

        if (existingUser) {
            throw new ApiError('User already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const userData = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            imageUrl,
        };

        // Save to both Primary and Secondary
        const [savedPrimaryUser, savedSecondaryUser] = await Promise.all([
            new PrimaryUser(userData).save(),
            new SecondaryUser(userData).save(),
        ]);

        return sendSuccess(
            res,
            { user: savedPrimaryUser },
            'User registered successfully',
            201
        );
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

exports.getMe = (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return sendSuccess(res, { user: decoded }, 'Data fetched successful');
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
    });
    return sendSuccess(res, null, 'Logged out successfully');
};
