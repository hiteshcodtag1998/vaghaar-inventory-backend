const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/handler');
const { PrimaryUser, SecondaryUser } = require('../models/users');

const { JWT_SECRET } = process.env;

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        let user, source;

        // 1️⃣ Try finding in SecondaryUser using aggregation
        const secondaryResult = await SecondaryUser.aggregate([
            { $match: { email } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roleID',
                    foreignField: '_id',
                    as: 'roleID',
                },
            },
            {
                $addFields: {
                    roleID: { $arrayElemAt: ['$roleID', 0] },
                },
            },
        ]);

        if (secondaryResult.length > 0) {
            user = secondaryResult[0];
            source = 'SecondaryUser';
        } else {
            // 2️⃣ Try finding in PrimaryUser using aggregation
            const primaryResult = await PrimaryUser.aggregate([
                { $match: { email } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'roleID',
                        foreignField: '_id',
                        as: 'roleID',
                    },
                },
                {
                    $addFields: {
                        roleID: { $arrayElemAt: ['$roleID', 0] },
                    },
                },
            ]);

            if (primaryResult.length > 0) {
                user = primaryResult[0];
                source = 'PrimaryUser';
            }
        }

        if (!user) {
            throw new ApiError('Invalid email or password', 401);
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError('Invalid email or password', 401);
        }

        const payload = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleID: user.roleID,
            role: user.role,
            source,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 1000,
        });

        const userData = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleID: user.roleID,
            role: user.role,
            source,
        };

        return sendSuccess(res, { user: userData }, 'Login successful');
    } catch (err) {
        next(err);
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

exports.getMe = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) throw new ApiError('Unauthorized', 401);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user, source;

        // 🔍 Check in SecondaryUser
        const secondaryResult = await SecondaryUser.aggregate([
            { $match: { email: decoded.email } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roleID',
                    foreignField: '_id',
                    as: 'roleID',
                },
            },
            {
                $addFields: {
                    roleID: { $arrayElemAt: ['$roleID', 0] },
                },
            },
            {
                $project: {
                    password: 0, // exclude password
                },
            },
        ]);

        if (secondaryResult.length > 0) {
            user = secondaryResult[0];
            source = 'SecondaryUser';
        } else {
            // 🔍 Check in PrimaryUser
            const primaryResult = await PrimaryUser.aggregate([
                { $match: { email: decoded.email } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'roles',
                        localField: 'roleID',
                        foreignField: '_id',
                        as: 'roleID',
                    },
                },
                {
                    $addFields: {
                        roleID: { $arrayElemAt: ['$roleID', 0] },
                    },
                },
                {
                    $project: {
                        password: 0, // exclude password
                    },
                },
            ]);

            if (primaryResult.length > 0) {
                user = primaryResult[0];
                source = 'PrimaryUser';
            }
        }

        if (!user) throw new ApiError('Unauthorized', 401);

        return sendSuccess(res, { user, source }, 'Data fetched successfully');
    } catch (err) {
        next(err);
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
