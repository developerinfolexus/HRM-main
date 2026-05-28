const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Store in uploads folder so it maps to a persistent volume (if applicable) or is easy to find
const FILE_PATH = path.join(process.cwd(), 'uploads', 'candidates_applications.xlsx');

/**
 * Append a new candidate to the Excel sheet
 * @param {Object} candidate - The candidate Mongoose document
 */
exports.appendCandidate = async (candidate) => {
    try {
        const workbook = new ExcelJS.Workbook();
        let worksheet;

        // Check if directory exists
        const dir = path.dirname(FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(FILE_PATH)) {
            try {
                await workbook.xlsx.readFile(FILE_PATH);
                worksheet = workbook.getWorksheet('Candidates');
            } catch (readErr) {
                logger.error("Error reading existing Excel file (might be corrupted or locked), creating new one.", readErr);
                worksheet = null; // Force create new logic if needed, or handle backup
            }
        }

        if (!worksheet) {
            worksheet = workbook.addWorksheet('Candidates');
            worksheet.columns = [
                { header: 'Applied Date', key: 'appliedDate', width: 18 },
                { header: 'Full Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Phone', key: 'phone', width: 15 },
                { header: 'Applying For', key: 'role', width: 20 },
                { header: 'Exp (Years)', key: 'experience', width: 12 },
                { header: 'Exp Level', key: 'experienceLevel', width: 15 },
                { header: 'ATS Score', key: 'score', width: 10 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Current Loc', key: 'location', width: 20 },
                { header: 'Address', key: 'address', width: 30 },
                { header: 'Current CTC', key: 'currentCtc', width: 15 },
                { header: 'Expected CTC', key: 'expectedCtc', width: 15 },
                { header: 'LinkedIn', key: 'linkedin', width: 30 },
                { header: 'Resume File', key: 'resume', width: 25 },
                { header: 'Comments', key: 'comments', width: 30 },
                // Custom columns will be dynamically appended
            ];

            // Style the header
            worksheet.getRow(1).font = { bold: true };
        }

        // Dynamically add columns for custom responses if they don't exist
        if (candidate.customResponses && candidate.customResponses.length > 0) {
            const currentKeys = worksheet.columns.map(c => c.key);
            candidate.customResponses.forEach(cr => {
                // Sanitize label to make a key
                const rawKey = cr.label ? cr.label.slice(0, 30).trim() : 'unknown'; // truncate key
                const key = `cust_${rawKey.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;

                if (!currentKeys.includes(key)) {
                    // Add new column
                    const newCols = [...worksheet.columns];
                    newCols.push({ header: cr.label, key: key, width: 20 });
                    worksheet.columns = newCols;

                    // Style new header
                    worksheet.getRow(1).getCell(newCols.length).font = { bold: true };
                }
            });
        }

        // Prepare Row Data
        const rowData = {
            appliedDate: new Date().toLocaleString(),
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            role: candidate.appliedFor,
            experience: candidate.experience,
            experienceLevel: candidate.experienceLevel || "",
            score: candidate.atsScore || 0,
            status: candidate.status,
            location: candidate.currentLocation || "",
            address: candidate.address || "",
            currentCtc: candidate.currentSalary || "",
            expectedCtc: candidate.expectedSalary || "",
            linkedin: candidate.linkedin || "",
            resume: candidate.resume || "",
            comments: candidate.comments || ""
        };

        // Add custom data
        if (candidate.customResponses) {
            candidate.customResponses.forEach(cr => {
                const rawKey = cr.label ? cr.label.slice(0, 30).trim() : 'unknown';
                const key = `cust_${rawKey.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                rowData[key] = cr.answer;
            });
        }

        worksheet.addRow(rowData);

        await workbook.xlsx.writeFile(FILE_PATH);
        logger.info(`Candidate ${candidate.email} appended to Excel file: ${FILE_PATH}`);

    } catch (error) {
        logger.error("Failed to append candidate to Excel:", error);
        // Do not throw, we don't want to fail the API request just because Excel failed
    }
};
