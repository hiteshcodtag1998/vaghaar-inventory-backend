const mongoose = require('mongoose');
require('dotenv').config();

const PRIMARY_DB_URL =
    process.env.PRIMARY_DB_URL ||
    'mongodb+srv://root:root@cluster0.xqkpjz8.mongodb.net/';
const SECONDARY_DB_URL =
    process.env.SECONDARY_DB_URL ||
    'mongodb+srv://root:root@cluster0.xqkpjz8.mongodb.net/';

const connectToDatabase = (uri, dbName, label) => {
    const connection = mongoose.createConnection(uri, {
        dbName, // ✅ Pass DB name separately here
        useUnifiedTopology: true,
        useNewUrlParser: true,
        maxPoolSize: 10,
    });

    connection.on('connected', () => {
        console.log(`${label} database connected.`);
    });

    connection.on('error', (err) => {
        console.error(`${label} database connection error:`, err);
    });

    return connection;
};

const initConnections = () => {
    try {
        const primaryDB = connectToDatabase(
            PRIMARY_DB_URL,
            'vaghaar_dev_prim',
            'Primary'
        );
        const secondaryDB = connectToDatabase(
            SECONDARY_DB_URL,
            'vaghaar_dev_seco',
            'Secondary'
        );

        return { primaryDB, secondaryDB };
    } catch (error) {
        console.error('Error initializing database connections:', error);
        process.exit(1);
    }
};

module.exports = initConnections;
