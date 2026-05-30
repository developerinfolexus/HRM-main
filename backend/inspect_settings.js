const mongoose = require('mongoose');
require('dotenv').config();
const RecruitmentSettings = require('./src/models/Recruitment/RecruitmentSettings');

const inspect = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm';
        await mongoose.connect(uri);
        console.log('Connected.');

        const settings = await RecruitmentSettings.findOne();
        console.log('Settings Document:', JSON.stringify(settings, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspect();
