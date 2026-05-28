const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
    try {
        console.log("1. Fetching Job Descriptions...");
        const jdRes = await axios.get(`${API_URL}/job-descriptions`);
        const jds = jdRes.data.data || jdRes.data;
        console.log(`Found ${jds.length} JDs.`);
        jds.forEach(jd => console.log(` - ${jd.title} (Role: ${jd.role})`));

        if (jds.length === 0) {
            console.error("CRITICAL: No Job Descriptions found! ATS Score will always be 0.");
            return;
        }

        const targetRole = jds[0].role || jds[0].title;
        console.log(`\n2. Creating Candidate for Role: '${targetRole}'`);

        // Get a resume file
        const resumeDir = path.join(__dirname, 'uploads', 'resumes');
        if (!fs.existsSync(resumeDir)) {
            console.error("Resume directory not found.");
            return;
        }
        const files = fs.readdirSync(resumeDir).filter(f => f.endsWith('.pdf'));
        if (files.length === 0) {
            console.error("No PDF resumes found to test upload.");
            return;
        }
        const filePath = path.join(resumeDir, files[0]);
        console.log(`Using file: ${filePath}`);

        const fileBuffer = fs.readFileSync(filePath);
        const base64 = fileBuffer.toString('base64');

        const payload = {
            name: "Test User Automata",
            email: `test${Date.now()}@example.com`,
            phone: "9999999999",
            appliedFor: targetRole,
            experience: 2,
            resumeBase64: base64, // sending without prefix for simplicity, api handles it
            status: "New"
        };

        const createRes = await axios.post(`${API_URL}/candidates`, payload);
        const candidate = createRes.data.data || createRes.data;

        console.log("\n3. Candidate Created!");
        console.log(`ID: ${candidate._id}`);
        console.log(`Name: ${candidate.name}`);
        console.log(`Resume File: ${candidate.resume}`);
        console.log(`ATS Score: ${candidate.atsScore}%`);

        if (candidate.atsScore > 0) {
            console.log("SUCCESS: ATS Score generated!");
        } else {
            console.log("WARNING: ATS Score is 0.");
            console.log("Check if the resume text was extracted or if JD keywords match.");
        }

    } catch (error) {
        console.error("Test Failed:", error.response ? error.response.data : error.message);
    }
};

runTest();
