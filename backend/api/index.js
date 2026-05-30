'use strict';

require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/database');

// Cache DB connection across warm invocations
let isConnected = false;

const handler = async (req, res) => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (err) {
            console.error('❌ DB connection failed in serverless handler:', err.message);
            return res.status(500).json({ status: 'error', message: 'Database connection failed' });
        }
    }
    return app(req, res);
};

module.exports = handler;
