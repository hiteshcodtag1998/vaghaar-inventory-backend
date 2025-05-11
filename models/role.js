const mongoose = require('mongoose');
const initConnections = require('.');

const RoleSchema = new mongoose.Schema(
    {
        name: 'String',
    },
    {
        timestamps: true,
    }
);

const { primaryDB, secondaryDB } = initConnections();

module.exports = {
    PrimaryRole: primaryDB.model('Role', RoleSchema),
    SecondaryRole: secondaryDB.model('Role', RoleSchema),
};

// const Role = mongoose.model("roles", RoleSchema);
// module.exports = Role;
