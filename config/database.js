const mongoose = require('mongoose');

// Create separate connections for different databases
let userDbConnection = null;
let servicesDbConnection = null;

const connectUserDatabase = async () => {
    try {
        userDbConnection = await mongoose.createConnection(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to User Database');
        return userDbConnection;
    } catch (err) {
        console.error('❌ Error connecting to User Database:', err);
        throw err;
    }
};

const connectServicesDatabase = async () => {
    try {
        servicesDbConnection = await mongoose.createConnection(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to Services Database');
        return servicesDbConnection;
    } catch (err) {
        console.error('❌ Error connecting to Services Database:', err);
        throw err;
    }
};

const connectDatabase = async () => {
    try {
        // Connect to both databases
        await Promise.all([
            connectUserDatabase(),
            connectServicesDatabase()
        ]);
        console.log('🚀 All databases connected successfully');
    } catch (err) {
        console.error('❌ Failed to connect to databases:', err);
        throw err;
    }
};

const getUserDbConnection = () => {
    if (!userDbConnection) {
        throw new Error('User database not connected. Make sure to call connectDatabase() first.');
    }
    return userDbConnection;
};

const getServicesDbConnection = () => {
    if (!servicesDbConnection) {
        throw new Error('Services database not connected. Make sure to call connectDatabase() first.');
    }
    return servicesDbConnection;
};

// Lazy model initialization functions
const getUserModel = (modelName, schema) => {
    const connection = getUserDbConnection();
    return connection.model(modelName, schema);
};

const getServicesModel = (modelName, schema) => {
    const connection = getServicesDbConnection();
    return connection.model(modelName, schema);
};

// Graceful shutdown
const closeConnections = async () => {
    try {
        if (userDbConnection) {
            await userDbConnection.close();
            console.log('🔌 User database connection closed');
        }
        if (servicesDbConnection) {
            await servicesDbConnection.close();
            console.log('🔌 Services database connection closed');
        }
    } catch (err) {
        console.error('❌ Error closing database connections:', err);
    }
};

module.exports = {
    connectDatabase,
    getUserDbConnection,
    getServicesDbConnection,
    getUserModel,
    getServicesModel,
    closeConnections
};