const mongoose = require('mongoose');
const initConnections = require('.');

const StoreSchema = new mongoose.Schema(
    {
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
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
        image: {
            type: String,
        },
    },
    { timestamps: true }
);

const { primaryDB, secondaryDB } = initConnections();

module.exports = {
    PrimaryStore: primaryDB.model('store', StoreSchema),
    SecondaryStore: secondaryDB.model('store', StoreSchema),
};

// const Store = mongoose.model("store", StoreSchema);
// module.exports = Store;
