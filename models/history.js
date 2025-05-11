const mongoose = require('mongoose');
const { HISTORY_TYPE } = require('../utils/constant');
const initConnections = require('.');

const HistorySchema = new mongoose.Schema(
    {
        productID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
        },
        description: {
            type: String,
        },
        notes: {
            type: String,
        },
        type: {
            type: String,
            enum: [
                HISTORY_TYPE.ADD,
                HISTORY_TYPE.UPDATE,
                HISTORY_TYPE.DELETE,
                HISTORY_TYPE.WRITE_OFF,
            ],
        },
        productCode: String,
        purchaseID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'purchases',
        },
        saleID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sales',
        },
        writeOffID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'writeOffs',
        },
        createdById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            default: null,
        },
        updatedById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            default: null,
        },
        historyDate: {
            type: Number,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const { primaryDB, secondaryDB } = initConnections();

module.exports = {
    PrimaryHistory: primaryDB.model('history', HistorySchema),
    SecondaryHistory: secondaryDB.model('history', HistorySchema),
};
