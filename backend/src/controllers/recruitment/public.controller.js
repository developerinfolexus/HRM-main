const JobDescription = require('../../models/Recruitment/JobDescription');
const Candidate = require('../../models/Recruitment/Candidate');
const { successResponse, errorResponse } = require('../../utils/response');
const recruitmentService = require('../../services/recruitment.service');
const emailService = require('../../services/email.service');
const excelService = require('../../services/excel.service');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

// Helper to Process Resume Data
const fs = require('fs');
const path = require('path');

// Helper to Process Resume Data
const processResume = async (candidateData, job) => {
    try {
        if (candidateData.resumeBase64) {
            // Remove header if present
            const parts = candidateData.resumeBase64.split(';base64,');
            const base64Data = parts.length > 1 ? parts.pop() : candidateData.resumeBase64;
            const mimeType = candidateData.resumeBase64.startsWith('data:image') ? 'image/png' : 'application/pdf';
            const buffer = Buffer.from(base64Data, 'base64');

            // 1. Save Resume File to Disk
            const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            const safeName = candidateData.name.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${safeName}_${Date.now()}.pdf`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, buffer);

            candidateData.resume = fileName; // Update filename
            console.log(`Public App: Saved resume to ${filePath}`);

            // 2. Extract Text
            const resumeText = await recruitmentService.extractTextFromResume(buffer, mimeType);
            candidateData.resumeText = resumeText;
            console.log(`Public App: Text extracted length: ${resumeText ? resumeText.length : 0}`);

            if (resumeText) {
                // 3. Analyze Resume
                const parsedData = recruitmentService.analyzeResume(resumeText);

                // Merge Parsed Data
                candidateData.extractedSkills = parsedData.extractedSkills;
                candidateData.extractedExperience = parsedData.extractedExperience;
                candidateData.projects = parsedData.projects || [];
                candidateData.certifications = parsedData.certifications || [];
                candidateData.companies = parsedData.companies || [];
                candidateData.internships = parsedData.internships || [];
                candidateData.isFresher = parsedData.isFresher;

                // 4. Calculate Score (Since we have the Job, we just score it)
                if (job) {
                    const atsResult = recruitmentService.calculateATSScore(resumeText, job, parsedData);
                    candidateData.atsScore = atsResult.score;
                    candidateData.atsScoreBreakdown = atsResult.breakdown;
                    candidateData.matchedSkills = atsResult.matchedSkills;
                    candidateData.missingSkills = atsResult.missingSkills;
                    candidateData.jobDescription = job._id;
                    console.log(`Public App: ATS Score calculated: ${atsResult.score}`);
                }
            }
        }
    } catch (e) {
        logger.error("Public Resume processing failed", e);
    }
};

exports.getAllActiveJobs = async (req, res) => {
    try {
        const jobs = await JobDescription.find({ status: 'Active' })
            .select('title role description requiredSkills experience customFields createdAt')
            .sort({ createdAt: -1 });

        return successResponse(res, { jobs }, 'Active jobs retrieved');
    } catch (error) {
        logger.error('Public Get All Jobs Error:', error);
        return errorResponse(res, 'Server Error', 500);
    }
};

exports.getJobDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 'Invalid Job ID', 400);
        }

        const job = await JobDescription.findOne({ _id: id, status: 'Active' })
            .select('title role description requiredSkills experience customFields createdAt');

        if (!job) {
            return errorResponse(res, 'Job not found or inactive', 404);
        }

        return successResponse(res, { job }, 'Job details retrieved');
    } catch (error) {
        logger.error('Public Get Job Error:', error);
        return errorResponse(res, 'Server Error', 500);
    }
};

exports.submitApplication = async (req, res) => {
    try {
        const {
            jobId,
            name,
            email,
            phone,
            resumeBase64,
            customResponses = [],
            experience,
            linkedin,
            address,
            currentLocation,
            currentCtc,
            expectedCtc,
            comments,
            experienceLevel
        } = req.body;

        // Validation
        if (!jobId || !name || !email || !resumeBase64) {
            return errorResponse(res, 'Missing required fields', 400);
        }

        const job = await JobDescription.findById(jobId);
        if (!job || job.status !== 'Active') {
            return errorResponse(res, 'Job not valid', 400);
        }

        // Validate Custom Fields
        if (job.customFields && job.customFields.length > 0) {
            for (const field of job.customFields) {
                if (field.required) {
                    const response = customResponses.find(r => r.label === field.label);
                    // Check if response exists and is not empty string/null
                    if (!response || (response.answer === undefined || response.answer === null || response.answer === '')) {
                        return errorResponse(res, `Missing required field: ${field.label}`, 400);
                    }
                }
            }
        }

        // Create Candidate
        const candidateData = {
            name,
            email,
            phone,
            experience: experience ? parseInt(experience) : 0, // Fallback if number passed
            experienceLevel: experienceLevel || experience, // Store the string selection
            linkedin,
            address,
            currentLocation,
            currentSalary: currentCtc ? parseFloat(currentCtc) : undefined,
            expectedSalary: expectedCtc ? parseFloat(expectedCtc) : undefined,
            comments,
            appliedFor: job.role, // Using role as appliedFor 
            jobDescription: job._id,
            resumeBase64, // Store base64
            resume: `${name.replace(/\s+/g, '_')}_Resume.pdf`, // Dummy filename
            source: 'Company Career Page',
            status: 'New',
            customResponses
        };

        // Process Resume (Extract text, Analyze, Score)
        await processResume(candidateData, job);

        const candidate = await Candidate.create(candidateData);

        // Send Email
        await emailService.sendCandidateStatusEmail(candidate);

        // Send Email
        await emailService.sendCandidateStatusEmail(candidate);

        // Append to local Excel sheet
        try {
            await excelService.appendCandidate(candidate);
        } catch (excelError) {
            logger.warn("Excel append failed silently:", excelError);
        }

        // Append to Google Sheet (if configured)
        try {
            // We need to fetch settings inside the controller since it's dynamic
            const RecruitmentSettings = require('../../models/Recruitment/RecruitmentSettings');
            const settings = await RecruitmentSettings.findOne(); // or .getSettings() if static exists
            if (settings && settings.internalResponseSpreadsheetId) {
                const googleService = require('../../services/google.service');

                // Construct Row Data (Array)
                const rowValues = [
                    new Date().toLocaleString(),
                    candidate.name || "",
                    candidate.email || "",
                    candidate.phone || "",
                    candidate.appliedFor || "",
                    (candidate.experience || 0).toString(),
                    candidate.experienceLevel || "",
                    (candidate.atsScore || 0).toString(),
                    candidate.status || "New",
                    candidate.currentLocation || "",
                    candidate.address || "",
                    (candidate.currentSalary || "").toString(),
                    (candidate.expectedSalary || "").toString(),
                    candidate.linkedin || "",
                    candidate.resume || "",
                    candidate.comments || ""
                ];

                // Add Custom Responses (values only, in order)
                if (candidate.customResponses) {
                    for (const r of candidate.customResponses) {
                        let cellValue = r.answer || "";
                        // Check if it's a base64 file
                        if (typeof cellValue === 'string' && cellValue.startsWith('data:')) {
                            try {
                                const fileName = `${candidate.name.replace(/\s+/g, '_')}_${r.label.replace(/\s+/g, '_')}`;
                                // We need to upload to Drive and get a link
                                // Assuming uploadFileToDrive(base64Data, filename) returns a URL
                                cellValue = await googleService.uploadFileToDrive(cellValue, fileName);
                            } catch (e) {
                                logger.error("Failed to upload file to Drive for Sheet:", e);
                                cellValue = "File Upload Failed";
                            }
                        }
                        rowValues.push(cellValue);
                    }
                }

                await googleService.appendSheetRow(settings.internalResponseSpreadsheetId, 'Form Responses 1!A1', rowValues);
            }
        } catch (googleError) {
            logger.warn("Google Sheet append failed silently:", googleError);
        }

        return successResponse(res, { candidateId: candidate._id }, 'Application submitted successfully', 201);

    } catch (error) {
        logger.error('Public Application Submit Error:', error);
        return errorResponse(res, error.message, 500);
    }
};
