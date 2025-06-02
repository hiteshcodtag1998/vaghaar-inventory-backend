const role = require('../models/role');
const bcrypt = require('bcrypt');
const { PrimaryUser, SecondaryUser } = require('../models/users');

// Add AdminUser
const addAdminUser = async (req, res) => {
    if (req?.body?.password)
        req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = new SecondaryUser(req.body);

    user.save()
        .then((result) => {
            res.status(200).send(result);
        })
        .catch((err) => {
            res.status(402).send(err);
        });
};

// Add Super AdminUser
const addMasterSuperAdminUser = async (req, res) => {
    if (req?.body?.password)
        req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = new PrimaryUser(req.body);

    user.save()
        .then((result) => {
            res.status(200).send(result);
        })
        .catch((err) => {
            res.status(402).send(err);
        });
};

// Get All Users
const getAllUsers = async (req, res) => {
    const findAllUsers = await SecondaryUser.aggregate([
        {
            $lookup: {
                from: 'roles',
                localField: 'roleID',
                foreignField: '_id',
                as: 'roleID',
            },
        },
        {
            $unwind: {
                path: '$roleID',
                preserveNullAndEmptyArrays: true, // Preserve records without matching BrandID
            },
        },
        { $sort: { _id: -1 } },
    ]);
    res.json(findAllUsers);
};

module.exports = { addAdminUser, addMasterSuperAdminUser, getAllUsers };
