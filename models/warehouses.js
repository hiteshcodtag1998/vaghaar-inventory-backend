const mongoose = require('mongoose');
const initConnections = require('.');

const WarehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const { primaryDB, secondaryDB } = initConnections();

module.exports = {
    PrimaryWarehouse: primaryDB.model('warehouse', WarehouseSchema),
    SecondaryWarehouse: secondaryDB.model('warehouse', WarehouseSchema),
};
