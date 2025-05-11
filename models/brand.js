const mongoose = require('mongoose');
const initConnections = require('.');

const BrandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
    },
    { timestamps: true }
);

const { primaryDB, secondaryDB } = initConnections();

module.exports = {
    PrimaryBrand: primaryDB.model('brand', BrandSchema),
    SecondaryBrand: secondaryDB.model('brand', BrandSchema),
};
