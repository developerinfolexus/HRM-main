const mongoose = require('mongoose');
require('dotenv').config();
const RecruitmentSettings = require('./src/models/Recruitment/RecruitmentSettings');

const inspect = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm';
        await mongoose.connect(uri);
        // console.log('Connected.'); // Reduce noise

        const settings = await RecruitmentSettings.findOne();
        if (settings) {
            console.log(`SpreadsheetID: '${settings.googleSpreadsheetId}'`);
            console.log(`AutoSync: ${settings.isAutoSyncEnabled}`);
            console.log(`Freq: ${settings.syncFrequencyMinutes}`);
        } else {
            console.log('No Settings Found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspect();
