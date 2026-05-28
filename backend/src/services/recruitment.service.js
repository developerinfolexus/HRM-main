const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const mongoose = require('mongoose');
const Tesseract = require('tesseract.js'); // OCR
const fs = require('fs');
const path = require('path');

const JobDescription = require('../models/Recruitment/JobDescription');
const Candidate = require('../models/Recruitment/Candidate');
const googleService = require('./google.service');
const storageService = require('./storage.service');
const logger = require('../utils/logger');

// --- Resume Parsing ---

/**
 * Extract text from Resume Buffer based on MimeType
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<string>}
 */
const extractTextFromResume = async (buffer, mimeType) => {
    try {
        if (mimeType === 'application/pdf') {
            const data = await pdfParse(buffer);
            let text = data.text;

            logger.info(`PDF Parsed Text Length: ${text ? text.trim().length : 0}`);
            if (text && text.trim().length > 0) {
                logger.info(`PDF Text Preview: ${text.substring(0, 50).replace(/\n/g, ' ')}...`);
            }

            // OCR Fallback for Scanned PDFs
            if (!text || text.trim().length < 100) {
                logger.info('Short text detected in PDF. Attempting OCR with Tesseract...');

                try {
                    // Write buffer to temp file for PDF processing
                    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                    const tempFile = path.join(tempDir, `ocr_${Date.now()}.pdf`);
                    fs.writeFileSync(tempFile, buffer);

                    let ocrText = '';
                    const puppeteer = require('puppeteer');

                    logger.info("Launching Puppeteer for OCR preprocessing...");
                    const browser = await puppeteer.launch({
                        headless: "new",
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                    const page = await browser.newPage();
                    logger.info("Puppeteer page created. Setting content...");

                    // Helper to get number of pages (approximate or just scroll)
                    // For simplicity, we just take a screenshot of the first 2 viewports or use PDF printing features?
                    // Puppeteer renders PDF in Chrome PDF Viewer by default on `file://` URL for PDF?
                    // Actually, Chrome headless might not render the PDF viewer plugin.
                    // Alternative: Use pdf.js inside a page context? No that's complex.
                    // WAIT. Headless Chrome DOES NOT support PDF Viewer. It downloads the PDF instead.

                    // PLAN B: Use pdf-lib to split pages? No.
                    // PLAN C: We installed pdf-img-convert, did it fail?
                    // User said "npm install failed".
                    // Okay, let's try `pdf-parse` again? No it failed.

                    // PLAN D: Use a simple screenshot strategy assuming the PDF renders? 
                    // NO, Headless Chrome won't render PDF.

                    // REVERT STRATEGY: 
                    // Use 'pdf-parse' raw info differently? No.

                    // We need a JS PDF renderer. 
                    // `pdfjs-dist` is usually the way.
                    // But I don't want to install new packages if install failed.
                    // Wait, `pdf-parse` uses `pdfjs-dist` internally? No, it uses its own.

                    // Let's try to use `pdf-lib` (installed!) to convert to... images? No, pdf-lib edits PDFs.
                    // `pdfkit` (installed!) creates PDFs.

                    // Is there ANY installed package that renders PDF to image?
                    // `pdf-img-convert` FAILED to install.

                    // OK, I must fix `npm install`.
                    // It failed with exit code 1. Probably network?
                    // I will TRY to install `pdf-img-convert` again, effectively.
                    // Or `pdf2pic` (requires GM).

                    // Best bet: Try `npm install pdf-img-convert` again with --legacy-peer-deps?
                    // Or explain to user.

                    // Actually, let's look at `pdf-parse`. It extracts text.
                    // If it returns empty, it's an image.
                    // Maybe the user's resume IS text but `pdf-parse` is failing for another reason?
                    // But the error says "Could not read text".

                    // Let's try `npm install pdf-img-convert` one more time. It is the cleanest solution.
                    // If that fails, I am stuck without a renderer.

                    // WAIT! `mammoth` is for docx.

                    // Let's try to use the *existing* `pdf-to-img` but fix the Path?
                    // User is on Windows. `pdftoppm` needs to be in Path.
                    // I can't put it in Path easily.

                    // What if I use `tesseract.js` directly on the PDF buffer?
                    // Tesseract.js recognizes images. Does it recognize PDF?
                    // No.

                    // OK, I will try to use `puppeteer` to render a generic HTML page that uses PDF.js from a CDN?
                    // That works!
                    // 1. Launch puppeteer.
                    // 2. Go to a data URL html that imports PDF.js.
                    // 3. Render the PDF buffer.
                    // 4. Screenshot.

                    // That is robust!
                    // I need PDF.js library. I can fetch it from CDN.

                    // Let's try this Puppeteer + PDF.js via CDN approach.
                    // It requires internet access (which he has).

                    await page.setContent(`
                        <html>
                        <head>
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
                        </head>
                        <body>
                            <canvas id="the-canvas"></canvas>
                            <script>
                                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                                async function render(base64) {
                                    try {
                                        const loadingTask = pdfjsLib.getDocument({data: atob(base64)});
                                        const pdf = await loadingTask.promise;
                                        const page = await pdf.getPage(1);
                                        const scale = 2.0; // Increased scale
                                        const viewport = page.getViewport({scale: scale});
                                        const canvas = document.getElementById('the-canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        await page.render({canvasContext: context, viewport: viewport}).promise;
                                        return "Done";
                                    } catch(e) { return "Error: " + e.message; }
                                }
                            </script>
                        </body>
                        </html>
                    `);

                    // Pass buffer as base64
                    const base64PDF = buffer.toString('base64');
                    console.log("Evaluating render script in puppeteer...");
                    const renderResult = await page.evaluate((b64) => render(b64), base64PDF);
                    console.log("Render Result:", renderResult);

                    // Screenshot
                    const imageBuffer = await page.screenshot({ encoding: 'binary', fullPage: true });
                    console.log("Screenshot taken. buffer length:", imageBuffer.length);

                    await browser.close();

                    // OCR the screenshot
                    console.log("Starting Tesseract recognize...");
                    const result = await Tesseract.recognize(imageBuffer, 'eng');
                    if (result && result.data && result.data.text) {
                        ocrText = result.data.text;
                        console.log("Tesseract Result Length:", ocrText.length);
                    } else {
                        console.log("Tesseract returned no text.");
                    }

                    // Cleanup
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

                } catch (pe) {
                    console.error("Puppeteer OCR Failed:", pe);
                }

                if (ocrText.trim().length > 50) {
                    console.log(`OCR Success! Extracted ${ocrText.length} characters.`);
                    return ocrText;
                }

                // End of Puppeteer Block

                console.warn('OCR produced little or no text.');
                // End of OCR block, return what we have (empty or short text)
                // But wait, if text was < 50, we tried OCR. If OCR gave nothing, we return original text (which is short) or empty?
                // The original logic returned '' if OCR failed.
                return '';
            }
            return text;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } else if (mimeType && mimeType.startsWith('image/')) {
            // Native Tesseract support for Images
            logger.info('Image resume detected. Running OCR...');
            const result = await Tesseract.recognize(buffer, 'eng');
            return result.data.text;
        } else {
            logger.warn('Unsupported resume format for text extraction:', mimeType);
            return '';
        }
    } catch (error) {
        console.error('Error extracting text from resume:', error);
        if (error.stack) console.error(error.stack);
        return '';
    }
};

// --- Resume Parsing & Analysis ---

/**
 * Parsed Resume Data Structure
 * @typedef {Object} ParsedResume
 * @property {string[]} skills
 * @property {number} experienceYears
 * @property {Object[]} companies
 * @property {Object[]} projects
 * @property {Object[]} certifications
 * @property {Object[]} internships
 * @property {boolean} isFresher
 */

/**
 * Analyze Resume Text to Extract Structured Data
 * @param {string} text 
 * @returns {ParsedResume}
 */
const analyzeResume = (text) => {
    if (!text) return null;
    const cleanText = text.replace(/\r\n/g, '\n');
    const lowerText = cleanText.toLowerCase();

    // 1. Defining Section Keywords
    const sections = {
        skills: ['technical skills', 'skills', 'core competencies', 'technologies', 'skill set', 'tech stack'],
        experience: ['work experience', 'professional experience', 'experience', 'work history', 'employment history', 'career summary', 'employment'],
        projects: ['projects', 'academic projects', 'key projects', 'project details', 'personal projects'],
        education: ['education', 'academic qualifications', 'qualifications', 'academic background'],
        certifications: ['certifications', 'courses', 'certificates', 'achievements', 'awards', 'certification'],
        internships: ['internships', 'industrial training', 'internship', 'summer internship']
    };

    /**
     * Advanced Section Segmentation Strategy:
     * 1. Find ALL occurrences of ALL section headers.
     * 2. Store them as { key: 'experience', index: 120, label: 'Work Experience' }.
     * 3. Sort by index.
     * 4. The content of a section matches the text between its index and the next section's index.
     */

    const foundSections = [];
    const allKeys = Object.entries(sections); // [['skills', []], ...]

    allKeys.forEach(([sectionKey, keywords]) => {
        keywords.forEach(keyword => {
            // Match keyword at start of line or preceded by newlines
            // Using a slightly more relaxed regex to catch headers that might not be perfect
            const regex = new RegExp(`(^|\\n)\\s*${keyword}\\s*[:\\-]?\\s*(\\n|$)`, 'gi');
            let match;
            while ((match = regex.exec(cleanText)) !== null) {
                // We found a potential header
                // Verify it's not part of a sentence? e.g. "I have experience in..."
                const matchLen = match[0].trim().length;
                if (matchLen < 60) {
                    foundSections.push({
                        key: sectionKey,
                        index: match.index,
                        raw: match[0],
                        debug: match[0].trim()
                    });
                }
            }
        });
    });


    // Validating intersections and overlaps: if "Project" and "Key Projects" both match at same index, pick longest
    // Actually, we just sort them. Small overlaps shouldn't matter if we handle logic right.
    foundSections.sort((a, b) => a.index - b.index);

    // Filter duplicates/overlaps (greedy approach: if two start near same spot, take first or longest)
    const uniqueSections = [];
    if (foundSections.length > 0) {
        uniqueSections.push(foundSections[0]);
        for (let i = 1; i < foundSections.length; i++) {
            const prev = uniqueSections[uniqueSections.length - 1];
            const curr = foundSections[i];
            // If current starts within previous's range (heuristic overlap)
            if (curr.index < prev.index + prev.raw.length) {
                // keep the one with longer keyword maybe? or just skip
                continue;
            }
            uniqueSections.push(curr);
        }
    }

    // Now extract content
    const extractedData = {};
    uniqueSections.forEach((section, i) => {
        const start = section.index + section.raw.length;
        const end = (i < uniqueSections.length - 1) ? uniqueSections[i + 1].index : cleanText.length;
        const content = cleanText.substring(start, end).trim();

        // Append if multiple headers map to same key (e.g. Experience repeated?)
        // Usually resumes have one block. We'll verify.
        if (extractedData[section.key]) {
            extractedData[section.key] += '\n' + content;
        } else {
            extractedData[section.key] = content;
        }
    });

    // --- Helper Parsing Logic for Blocks ---

    // Experience Years Extraction (Looking globally first as it's often at top)
    let experienceYears = 0;
    const expMatch = cleanText.match(/Total\s*Experience\s*[:\-]?\s*(\d+(\.\d+)?)/i) ||
        cleanText.match(/(\d+(\.\d+)?)\+?\s*Years\s*of\s*Experience/i);
    if (expMatch) experienceYears = parseFloat(expMatch[1]);


    // Skills Parsing
    let extractedSkills = [];
    if (extractedData.skills) {
        const cleanBlock = extractedData.skills.replace(/Languages[:\-]|Tools[:\-]|Frameworks[:\-]|Database[:\-]|Web Technologies[:\-]/gi, '');
        extractedSkills = cleanBlock
            .split(/[,•\n|]/)
            .map(s => s.trim())
            .filter(s => s && s.length > 1 && s.length < 35 && !/^\d+$/.test(s) && !/skill|experience/i.test(s));
    }

    // Projects Parsing
    const projects = [];
    if (extractedData.projects) {
        const lines = extractedData.projects.split('\n').map(l => l.trim()).filter(l => l);
        let currentProject = null;
        logger.info(`Analyzing Projects Block: ${extractedData.projects.substring(0, 100)}...`);

        lines.forEach(line => {
            // Heuristic: check if line is a bullet point
            const isBullet = /^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\u27A2]/.test(line);

            // Project Title Candidates:
            // 1. Not a bullet AND length > 2 AND has letters
            // 2. IS a bullet BUT contains a colon (e.g. "* Project Name: Description")
            // 3. IS a bullet BUT is short and Title Cased (heuristic)

            let isPotentialTitle = false;
            if (!isBullet && line.length > 2 && /[a-zA-Z]/.test(line)) {
                isPotentialTitle = true;
            } else if (isBullet && line.includes(':') && line.length < 100) {
                isPotentialTitle = true;
            } else if (isBullet && line.length < 50 && !line.includes('.')) {
                // Heuristic: bullet + short text + no period (usually not a sentence) -> might be title
                isPotentialTitle = true;
            }

            if (isPotentialTitle) {
                // Cleanup: Remove bullet if present
                let titleClean = line.replace(/^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\u27A2]\s*/, '').trim();

                // Remove Date from end if present (e.g. Dec 2022 - Jan 2023)
                titleClean = titleClean.replace(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})\s*[-–to]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|Present|Current)/gi, '').trim();

                // Remove Tech Stack separator like " — Python..."
                const separatorMatch = titleClean.match(/ [—–\-:] /);
                if (separatorMatch) {
                    titleClean = titleClean.split(separatorMatch[0])[0].trim();
                }

                if (titleClean.length > 2 && titleClean.length < 100) {
                    if (currentProject) projects.push(currentProject);
                    currentProject = { title: titleClean, description: '' };
                } else if (currentProject) {
                    // Was a bullet but turned out to be noise/description ? 
                    // Treat as description
                    const descPart = line.replace(/^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\u27A2]\s*/, '');
                    currentProject.description += (currentProject.description ? ' \n' : '') + descPart;
                }
            } else if (currentProject) {
                const descPart = line.replace(/^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\u27A2]\s*/, '');
                currentProject.description += (currentProject.description ? ' ' : '') + descPart;
            }
        });
        if (currentProject) projects.push(currentProject);
    }
    logger.info(`Extracted ${projects.length} projects.`);

    // Experience Companies Parsing
    const companies = [];
    if (extractedData.experience) {
        // Regex for dates
        const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*['’]?\d{2,4}|\d{1,2}\/\d{4}|\d{4})\s*[-–to]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*['’]?\d{2,4}|\d{1,2}\/\d{4}|\d{4}|Present|Current|Now)/gi;

        let match;
        const matches = [];
        while ((match = dateRegex.exec(extractedData.experience)) !== null) {
            matches.push({ index: match.index, duration: match[0], end: match.index + match[0].length });
        }

        // Mapping matches to text blocks preceding them
        matches.forEach((m, i) => {
            const rangeStart = (i === 0) ? 0 : matches[i - 1].end;
            const blockBefore = extractedData.experience.substring(rangeStart, m.index).trim();
            const lines = blockBefore.split('\n').filter(l => l.trim().length > 0);

            let company = "Unknown Company";
            let role = "Unknown Role";

            if (lines.length > 0) {
                // If there are multiple lines, assume standard format: Company \n Role
                // Check last few lines
                const lastLine = lines[lines.length - 1];
                const secondLast = lines.length > 1 ? lines[lines.length - 2] : null;

                if (secondLast && secondLast.split(' ').length < 10) { // Check if it's likely a name (short)
                    company = secondLast;
                    role = lastLine;
                } else {
                    // Single line logic
                    const separator = lastLine.match(/ [—–\-|] /);
                    if (separator) {
                        const parts = lastLine.split(separator[0]);
                        role = parts[0].trim();
                        company = parts[1].trim();
                    } else {
                        // Try to guess based on keywords
                        if (/developer|engineer|intern|trainee|manager|lead|consultant/i.test(lastLine)) {
                            role = lastLine;
                            company = secondLast || ""; // Try to grab previous line if possible
                        } else {
                            company = lastLine;
                            role = "";
                        }
                    }
                }
            }

            // New fallback: If company is empty/unknown but we have text AFTER the date, look ahead!
            // Sometimes: Date \n Company \n Role
            if ((company === "Unknown Company" || !company) && extractedData.experience.length > m.end) {
                const blockAfter = extractedData.experience.substring(m.end, m.end + 100).split('\n')[0].trim();
                if (blockAfter && blockAfter.length < 50) {
                    // Only swap if we really failed before
                    if (role === "Unknown Role") {
                        role = "Role/Company (See Description)";
                    }
                    // Actually, parsing lookahead is tricky without iterating forward. 
                    // Let's stick to lookbehind improvements for now.
                }
            }

            // Clean up
            if (role) role = role.replace(/[—–\-]/g, '').trim();
            if (company) company = company.replace(/[—–\-]/g, '').trim();

            companies.push({
                name: company.substring(0, 60),
                role: role.substring(0, 60),
                duration: m.duration,
                domain: "Unknown"
            });
        });
    }

    // Internships aggregation (Fallback to Experience companies if specific block missing or empty)
    const internships = [];
    // 1. Dedicated Section
    if (extractedData.internships) {
        extractedData.internships.split('\n').filter(l => l.trim().length > 3).forEach(line => {
            if (!/internship|page|training/i.test(line)) {
                internships.push({ company: line.substring(0, 80), domain: "Internship", duration: "See Resume" });
            }
        });
    }

    // 2. Scan extracted companies for "Intern" keyword
    companies.forEach(comp => {
        if (/intern|trainee|fresher|student|apprentice|fellow/i.test(comp.role) ||
            /intern|trainee|fresher|student|apprentice|fellow/i.test(comp.name)) {

            const exists = internships.some(i => i.company === comp.name || (comp.name === "" && i.company === comp.role));
            if (!exists) {
                internships.push({
                    company: comp.name || comp.role,
                    domain: comp.role,
                    duration: comp.duration
                });
            }
        }
    });


    // Certifications
    const certifications = [];
    if (extractedData.certifications) {
        extractedData.certifications.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 100).forEach(l => {
            // Check for dash separator for Issuer
            const separator = l.match(/ [—–-] /);
            let name = l;
            let issuer = '';

            if (separator) {
                const parts = l.split(separator[0]);
                name = parts[0].trim();
                issuer = parts[1].trim();
            }

            certifications.push({ name: name, issuer: issuer, year: '' });
        });
    }

    // Fresher Calculation
    let isFresher = false;
    if (lowerText.includes('fresher')) isFresher = true;
    if (experienceYears === 0) {
        // If we found 'real' companies (not internships), user might not be fresher
        // But if Exp years says 0, likely they are listed but small duration? 
        // Let's trust experienceYears first. If 0, then fresher unless specific override.
        // Also check if extracted companies look like full time? 
        // For safety, 0 exp = fresher is good default.
        isFresher = true;
    }
    // If explicitly has internships but 0 exp
    if (internships.length > 0 && experienceYears === 0) isFresher = true;

    return {
        extractedSkills: [...new Set(extractedSkills)].slice(0, 20),
        extractedExperience: experienceYears,
        companies: companies.slice(0, 10),
        projects: projects.slice(0, 8),
        certifications: certifications.slice(0, 8),
        internships: internships.slice(0, 5),
        isFresher
    };
};


// --- ATS Scoring ---

/**
 * Calculate ATS Score
 * @param {string} resumeText 
 * @param {Object} jd 
 * @param {ParsedResume} parsedData
 * @returns {Object} Score details
 */
const calculateATSScore = (resumeText, jd, parsedData) => {
    if (!resumeText || !jd) {
        return { score: 0, breakdown: {}, matchedSkills: [], missingSkills: [] };
    }

    const text = resumeText.toLowerCase();

    // 1. Skills Match (40%)
    const matchedSkills = [];
    const missingSkills = [];
    const jdSkills = jd.requiredSkills || [];

    jdSkills.forEach(skill => {
        if (text.includes(skill.toLowerCase())) {
            matchedSkills.push(skill);
        } else {
            missingSkills.push(skill);
        }
    });

    const skillsScoreRaw = jdSkills.length > 0 ? (matchedSkills.length / jdSkills.length) : 0;
    const skillsScore = Math.round(skillsScoreRaw * 100);

    // 2. Experience Match (25%) - Logic varies for Fresher
    let expScore = 0;
    const requiredExp = jd.experienceRequired || 0; // Assuming JD has this field, or 0

    if (parsedData.isFresher) {
        // For freshers, experience "relevance" is judged by Internship presence
        if (parsedData.internships.length > 0) expScore = 100;
        else expScore = 50; // Base score for being a fresher if position allows
    } else {
        // Experienced
        if (parsedData.extractedExperience >= requiredExp) expScore = 100;
        else expScore = Math.round((parsedData.extractedExperience / (requiredExp || 1)) * 100);
    }

    // 3. Domain Match (10%)
    // Check if JD Title words appear in Resume
    let domainScore = 0;
    const jdKeywords = jd.title.split(' ').filter(w => w.length > 3);
    const matchedKeywords = jdKeywords.filter(w => text.includes(w.toLowerCase()));
    domainScore = Math.round((matchedKeywords.length / jdKeywords.length) * 100);

    // 4. Projects (15%)
    let projectScore = 0;
    if (parsedData.projects.length > 0) projectScore = 100;
    else if (parsedData.isFresher) projectScore = 0; // Critical for freshers
    else projectScore = 50; // Less critical for senior roles if they have exp

    // 5. Certifications (10%)
    let certScore = 0;
    if (parsedData.certifications.length > 0) certScore = 100;

    // Weighted Total
    // Skills 40, Exp 25, Domain 10, Proj 15, Cert 10
    const totalScore = Math.round(
        (skillsScore * 0.40) +
        (expScore * 0.25) +
        (domainScore * 0.10) +
        (projectScore * 0.15) +
        (certScore * 0.10)
    );

    return {
        score: totalScore,
        breakdown: {
            skillsMatch: skillsScore,
            experienceRelevance: expScore,
            domainMatch: domainScore,
            projectScore: projectScore,
            certificationScore: certScore
        },
        matchedSkills,
        missingSkills
    };
};

// --- Orchestration ---

/**
 * Process a Single Candidate from Google Form Data
 * @param {Object} formData 
 */
const processCandidateFromGoogle = async (formData) => {
    try {
        console.log(`\n--- Processing Google Candidate: ${formData.email} ---`);
        let candidate = await Candidate.findOne({ email: formData.email });
        let candidateId = candidate ? candidate._id : new mongoose.Types.ObjectId();

        let isNewCandidate = !candidate;
        let isResumeChanged = false;
        let isRoleChanged = false;

        // 1. Job Description Match
        console.log(`Looking for JD matching: '${formData.appliedRole}'`);
        let jd = await JobDescription.findOne({
            $or: [
                { title: { $regex: new RegExp(`^${formData.appliedRole}$`, 'i') } },
                { role: { $regex: new RegExp(`^${formData.appliedRole}$`, 'i') } },
                { title: { $regex: new RegExp(formData.appliedRole, 'i') } },
                { role: { $regex: new RegExp(formData.appliedRole, 'i') } }
            ],
            status: 'Active'
        });

        if (jd) console.log(`Found Matching JD: ${jd.title}`);
        else console.warn(`NO JD Found for: ${formData.appliedRole}`);

        if (candidate && candidate.appliedFor !== formData.appliedRole) {
            isRoleChanged = true;
        }

        // 2. Resume Handling
        let resumeFilename = candidate ? candidate.resume : null;
        let resumeText = candidate ? candidate.resumeText : '';
        let resumeDriveFileId = null;

        const driveFileId = googleService.extractDriveFileId(formData.resumeLink);
        let shouldDownload = false;

        if (driveFileId) {
            resumeDriveFileId = driveFileId;
            if (isNewCandidate) {
                shouldDownload = true;
            } else {
                if (candidate.resumeDriveFileId !== driveFileId) {
                    shouldDownload = true;
                } else if (!fs.existsSync(path.join(process.cwd(), 'uploads/resumes', `${candidate._id}-resume.pdf`))) {
                    console.log("Resume file missing locally. Downloading...");
                    shouldDownload = true;
                }
            }
        }

        if (shouldDownload && driveFileId) {
            try {
                console.log(`Downloading resume from Drive (ID: ${driveFileId})...`);
                const fileBuffer = await googleService.downloadFile(driveFileId);
                if (fileBuffer) {
                    console.log(`Download success. Extracting text...`);
                    // Create uploads directory if not exists
                    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    resumeText = await extractTextFromResume(fileBuffer, 'application/pdf');
                    console.log(`Details: Text Length: ${resumeText ? resumeText.length : 0}`);

                    const targetFileName = `${candidateId}-resume.pdf`;
                    const filePath = path.join(uploadsDir, targetFileName);
                    fs.writeFileSync(filePath, fileBuffer);

                    resumeFilename = targetFileName;
                    isResumeChanged = true;
                    console.log(`Saved resume locally to: ${resumeFilename}`);
                }
            } catch (err) {
                logger.error(`Failed to download/process resume for ${formData.email}: ${err.message}`);
                console.error("Google Resume Process Error:", err);
            }
        }

        // 3. Analysis & ATS Calculation
        let atsResult = {
            score: candidate ? candidate.atsScore : 0,
            breakdown: candidate ? candidate.atsScoreBreakdown : {},
            matchedSkills: candidate ? candidate.matchedSkills : [],
            missingSkills: candidate ? candidate.missingSkills : []
        };
        let parsedResumeData = {
            extractedSkills: [],
            extractedExperience: 0,
            projects: [],
            certifications: [],
            companies: [],
            internships: [],
            isFresher: false
        };

        // CONDITIONAL RE-ANALYSIS: Only re-analyze if resume changed OR candidate is new OR role changed
        // This prevents overwriting existing parsed data during auto-sync
        const shouldReanalyze = isNewCandidate || isResumeChanged || isRoleChanged;

        if (resumeText && shouldReanalyze) {
            logger.info(`Analyzing Resume & Recalculating ATS Score for ${formData.email} (Reason: ${isNewCandidate ? 'New Candidate' : isResumeChanged ? 'Resume Changed' : 'Role Changed'})...`);
            console.log("Running ATS Analysis...");

            // Analyze
            parsedResumeData = analyzeResume(resumeText);

            // Score
            if (jd) {
                atsResult = calculateATSScore(resumeText, jd, parsedResumeData);
                console.log(`ATS Score Calculated: ${atsResult.score}%`);
            } else {
                console.log("Skipping ATS Score (No JD).");
            }
        } else if (candidate && !shouldReanalyze) {
            // Preserve existing parsed data if no changes detected
            logger.info(`Preserving existing parsed data for ${formData.email} (No changes detected)`);
            // Actually, I should keep the complete logic block if I replace the whole function.
            if (candidate) {
                parsedResumeData = {
                    extractedSkills: candidate.extractedSkills,
                    extractedExperience: candidate.extractedExperience,
                    projects: candidate.projects,
                    certifications: candidate.certifications,
                    companies: candidate.companies,
                    internships: candidate.internships,
                    isFresher: candidate.isFresher
                };
            }
            atsResult = {
                score: candidate.atsScore || 0,
                breakdown: candidate.atsScoreBreakdown || {},
                matchedSkills: candidate.matchedSkills || [],
                missingSkills: candidate.missingSkills || []
            };
        }

        // 4. Create or Update Object construction
        const candidateData = {
            _id: candidateId,
            name: formData.fullName, // Changed from formData.name to formData.fullName to match original
            email: formData.email,
            phone: formData.phone,
            appliedFor: formData.appliedRole,
            experience: Math.max(formData.experience || 0, parsedResumeData.extractedExperience || 0, (candidate ? candidate.experience : 0) || 0), // Reverted to original logic
            linkedin: formData.linkedin || (candidate ? candidate.linkedin : ''), // Reverted to original logic
            currentSalary: formData.currentCTC || (candidate ? candidate.currentSalary : ''), // Reverted to original logic
            expectedSalary: formData.expectedCTC || (candidate ? candidate.expectedSalary : ''), // Reverted to original logic
            source: formData.source,
            status: candidate ? candidate.status : (jd ? 'New' : 'JD Not Available'), // Reverted to original logic
            resume: resumeFilename,
            resumeText: resumeText,
            resumeDriveFileId: resumeDriveFileId,
            resumeLink: formData.resumeLink, // Keep original link

            // Parsed Data
            extractedSkills: parsedResumeData.extractedSkills,
            extractedExperience: parsedResumeData.extractedExperience,
            projects: parsedResumeData.projects,
            certifications: parsedResumeData.certifications,
            companies: parsedResumeData.companies,
            internships: parsedResumeData.internships,
            isFresher: parsedResumeData.isFresher,

            // ATS Data
            atsScore: atsResult.score,
            atsScoreBreakdown: atsResult.breakdown,
            matchedSkills: atsResult.matchedSkills,
            missingSkills: atsResult.missingSkills,
            jobDescription: jd ? jd._id : null
        };

        // If new or updated
        if (isNewCandidate) {
            const newCandidate = await Candidate.create(candidateData);
            logger.info(`Created new candidate: ${newCandidate.email}`);
            return newCandidate;
        } else {
            // Update
            Object.assign(candidate, candidateData);
            await candidate.save();
            logger.info(`Updated candidate: ${candidate.email}`);
            return candidate;
        }

    } catch (error) {
        logger.error(`Error processing candidate ${formData.email}:`, error);
        return null;
    }
};

/**
 * Sync Candidates from Google Sheet
 * @param {string} spreadsheetId 
 * @param {string} range 
 */
const syncCandidates = async (spreadsheetId, range) => {
    try {
        let targetRange = range;

        // 1. Resolve Sheet Name if range is generic
        if (!targetRange || targetRange.includes('Form Responses 1')) {
            try {
                const metadata = await googleService.getSheetMetadata(spreadsheetId);
                if (metadata && metadata.sheets && metadata.sheets.length > 0) {
                    const formSheet = metadata.sheets.find(s => s.properties.title.includes("Form Responses"));
                    if (formSheet) {
                        targetRange = `${formSheet.properties.title}!A1:Z`;
                    } else {
                        targetRange = `${metadata.sheets[0].properties.title}!A1:Z`;
                    }
                    logger.info(`Resolved Sheet Range: ${targetRange}`);
                }
            } catch (metaError) {
                logger.warn('Failed to fetch metadata, trying default range:', metaError.message);
            }
        }

        const rows = await googleService.getSheetData(spreadsheetId, targetRange || 'Form Responses 1!A1:Z');
        if (!rows || !rows.length) return { count: 0, message: 'No data found in sheet' };

        // 2. Dynamic Column Mapping
        const headers = rows[0].map(h => h.toLowerCase().trim());
        logger.info('Sheet Headers Detected:', headers);

        const findCol = (exactName, keywords) => {
            const idx = headers.indexOf(exactName.toLowerCase());
            if (idx !== -1) return idx;
            return headers.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const map = {
            email: findCol('email', ['email', 'e-mail']),
            name: findCol('name', ['name', 'candidate']),
            phone: findCol('phone number', ['phone', 'mobile']),
            role: findCol('applying for role', ['applying for role', 'role', 'position']),
            experience: findCol('experience (years)', ['experience', 'exp']),
            linkedin: findCol('linkedin profile url', ['linkedin', 'profile']),
            resume: findCol('upload your resume / cv', ['upload your resume', 'resume', 'cv']),
            currentCTC: findCol('current ctc', ['current ctc', 'current salary']),
            expectedCTC: findCol('expected ctc', ['expected ctc', 'expected salary']),
            source: findCol('source', ['source'])
        };

        const parseCTC = (val) => {
            if (!val) return 0;
            const str = val.toString().toUpperCase().replace(/,/g, '');
            let num = parseFloat(str) || 0;
            if (str.includes('LPA') || str.includes('LAKH')) {
                num = num * 100000;
            }
            return num;
        };

        const parseExperience = (val) => {
            if (!val) return 0;
            const str = val.toString().toLowerCase();
            if (str.includes('fresh')) return 0;
            const num = parseFloat(str) || 0;
            if (num > 50) return 0;
            return num;
        };

        let count = 0;
        const sheetEmails = new Set();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const email = row[map.email];
            if (!email) continue;

            sheetEmails.add(email.toLowerCase());

            const formData = {
                fullName: row[map.name] || 'Unknown',
                phone: row[map.phone] || '',
                email: email,
                experience: parseExperience(row[map.experience]),
                linkedin: row[map.linkedin] || '',
                appliedRole: row[map.role] || 'General',
                source: row[map.source] || 'Google Form',
                currentCTC: parseCTC(row[map.currentCTC]),
                expectedCTC: parseCTC(row[map.expectedCTC]),
                resumeLink: row[map.resume] || '',
                responseId: `${email}_${row[map.role] || 'role'}`
            };

            const result = await processCandidateFromGoogle(formData);
            if (result) count++;
        }

        // const sheetEmailList = Array.from(sheetEmails);
        // // REMOVED AUTOMATIC DELETION AS PER USER REQUEST
        // // The system should NOT delete candidates if they are missing from the sheet.
        // // Deletion should only be manual.
        // /* 
        // const deletionResult = await Candidate.deleteMany({
        //     source: 'Google Form',
        //     email: { $nin: sheetEmailList }
        // });

        // if (deletionResult.deletedCount > 0) {
        //     logger.info(`Synced Deletion: Removed ${deletionResult.deletedCount} candidates that were deleted from Google Sheet.`);
        // } 
        // */

        return { count, message: `Synced ${count} candidates from '${targetRange.split('!')[0]}'` };

    } catch (error) {
        logger.error('Sync Candidates Logic Error:', error);
        throw error;
    }
};

module.exports = {
    extractTextFromResume,
    calculateATSScore,
    processCandidateFromGoogle,
    syncCandidates,
    analyzeResume
};
