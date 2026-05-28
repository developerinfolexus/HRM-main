const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI.trim());

        logger.info(`MongoDB Atlas Connected: ${conn.connection.host}`);
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        return conn;
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        console.error('❌ MongoDB connection failed:', error.message);

        if (error.message.includes('authentication failed')) {
            console.error('💡 Tip: Check your database username and password in .env file');
        } else if (error.message.includes('Invalid scheme')) {
            console.error('💡 Tip: Ensure MONGODB_URI starts with mongodb:// or mongodb+srv://');
        }

        // Don't exit process here, let server.js handle it
        throw error;
    }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
    console.error('❌ MongoDB error:', err.message);
});

module.exports = connectDB;
