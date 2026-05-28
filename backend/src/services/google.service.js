


const { google } = require('googleapis');
const path = require('path');
const logger = require('../utils/logger');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'];
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

// Initialize Google Auth
const getAuthClient = async () => {
    try {
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            logger.warn('Google Credentials file not found at:', CREDENTIALS_PATH);
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: SCOPES,
        });

        return await auth.getClient();
    } catch (error) {
        logger.error('Error loading Google Auth:', error);
        return null; // Fail gracefully if auth fails
    }
};

/**
 * Fetch data from a Google Sheet
 * @param {string} spreadsheetId 
 * @param {string} range 
 * @returns {Promise<Array<Array<string>>>} Rows of data
 */
const getSheetData = async (spreadsheetId, range) => {
    try {
        const authClient = await getAuthClient();
        if (!authClient) return [];

        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        return response.data.values || [];
    } catch (error) {
        logger.error('Error fetching Google Sheet data:', error);
        throw error;
    }
};

/**
 * Append a row to a Google Sheet
 * @param {string} spreadsheetId 
 * @param {string} range 
 * @param {Array<string>} values 
 */
const appendSheetRow = async (spreadsheetId, range, values) => {
    try {
        const authClient = await getAuthClient();
        if (!authClient) return null;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        const resource = {
            values: [values],
        };

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource,
        });

        return response.data;
    } catch (error) {
        logger.error('Error appending row to Google Sheet:', error);
        throw error;
    }
};

/**
 * Fetch Spreadsheet Metadata (to get sheet names)
 * @param {string} spreadsheetId 
 * @returns {Promise<Object>} Metadata
 */
const getSheetMetadata = async (spreadsheetId) => {
    try {
        const authClient = await getAuthClient();
        if (!authClient) return null;

        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.get({
            spreadsheetId
        });

        return response.data;
    } catch (error) {
        logger.error('Error fetching Spreadsheet Metadata:', error);
        throw error;
    }
};

/**
 * Upload a Base64 file to Google Drive and return valid link
 * @param {string} base64Data 
 * @param {string} fileName 
 * @returns {Promise<string>} Web View Link
 */
const uploadFileToDrive = async (base64Data, fileName) => {
    try {
        const authClient = await getAuthClient();
        if (!authClient) return null;

        const drive = google.drive({ version: 'v3', auth: authClient });

        // Clean base64 string
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let mimeType = 'application/octet-stream';
        let buffer = null;

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Try assuming it is raw base64
            buffer = Buffer.from(base64Data, 'base64');
        }

        const { Readable } = require('stream');
        const bufferStream = new Readable();
        bufferStream.push(buffer);
        bufferStream.push(null);

        // Upload
        const fileMetadata = {
            name: fileName,
        };
        const media = {
            mimeType: mimeType,
            body: bufferStream,
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        const fileId = response.data.id;
        const link = response.data.webViewLink;

        // Make it public (or readable by anyone with link) so Sheet viewers can see it
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return link;

    } catch (error) {
        logger.error("Error uploading file to Drive:", error);
        throw error;
    }
}

/**
 * Download a file from Google Drive
 * @param {string} fileId 
 * @returns {Promise<Buffer>} File buffer
 */
const downloadFile = async (fileId) => {
    try {
        const authClient = await getAuthClient();
        if (!authClient) return null;

        const drive = google.drive({ version: 'v3', auth: authClient });
        const response = await drive.files.get({
            fileId,
            alt: 'media',
        }, { responseType: 'arraybuffer' });

        return Buffer.from(response.data);
    } catch (error) {
        if (error.code === 404 || error.response?.status === 404) {
            logger.error(`Drive API 404: File ${fileId} not found. This usually means the Service Account does not have permission. Please SHARE the 'File responses' folder in Google Drive with: hrm-google-sync@hrms-484804.iam.gserviceaccount.com`);
            return null; // Return null to indicate download failed but handled
        }

        logger.error(`Error downloading file ${fileId} from Drive: [${error.code}] ${error.message}`);
        if (error.response && error.response.data) {
            try {
                const errorData = JSON.parse(Buffer.from(error.response.data).toString());
                logger.error('Drive API Error Details:', JSON.stringify(errorData));
            } catch (e) {
                logger.error('Drive API Raw Error Data:', error.response.data);
            }
        }
        throw error;
    }
};

/**
 * Extract File ID from Google Drive URL
 * @param {string} url 
 * @returns {string|null}
 */
const extractDriveFileId = (url) => {
    if (!url) return null;

    // Pattern 1: /d/FILE_ID/
    const match1 = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match1 && match1[1]) return match1[1];

    // Pattern 2: id=FILE_ID
    const match2 = url.match(/id=([a-zA-Z0-9-_]+)/);
    if (match2 && match2[1]) return match2[1];

    // Pattern 3: open?id=FILE_ID
    const match3 = url.match(/open\?id=([a-zA-Z0-9-_]+)/);
    if (match3 && match3[1]) return match3[1];

    // Pattern 4: just a long string which might be the ID itself (fallback)
    // Be careful not to match entire URLs if they don't fit above
    if (url.length > 20 && !url.includes('/')) return url;

    return null;
};

module.exports = {
    getSheetData,
    appendSheetRow,
    uploadFileToDrive, // Added this
    getSheetMetadata,
    downloadFile,
    extractDriveFileId
};
