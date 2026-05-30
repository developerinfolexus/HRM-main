const mongoose = require('mongoose');
require('dotenv').config();
const recruitmentService = require('./src/services/recruitment.service');
const RecruitmentSettings = require('./src/models/Recruitment/RecruitmentSettings');

const runSync = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm';
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const settings = await RecruitmentSettings.findOne();
        if (!settings || !settings.googleSpreadsheetId) {
            console.error('No Spreadsheet ID found in settings.');
            return;
        }

        console.log(`Syncing with Spreadsheet ID: ${settings.googleSpreadsheetId}`);
        const result = await recruitmentService.syncCandidates(settings.googleSpreadsheetId);
        console.log('Sync Result:', result);

    } catch (error) {
        console.error('Sync Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runSync();
