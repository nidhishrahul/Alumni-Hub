/**
 * ADDED FOR VERIFICATION FEATURE
 *
 * AI Verification Routes — /api/ai-verification
 *
 * Endpoints:
 *   POST /trigger/:profileId   — Trigger ML verification for an alumni profile
 *   GET  /status/:profileId    — Get AI verification status for a profile
 *   GET  /admin/queue          — Admin: list pending review queue
 *   POST /admin/:queueId/approve — Admin: approve a pending review
 *   POST /admin/:queueId/reject  — Admin: reject a pending review
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

// ─── Multer config for proof/certificate uploads ─────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `proof_${req.userId}_${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    },
});

// Python ML microservice URL (configurable via .env)
const AI_VERIFICATION_URL = process.env.AI_VERIFICATION_URL || 'http://localhost:5050';

// Direct AI Risk threshold cutoff (<= 50 is VERIFIED, > 50 is REJECTED)
const RISK_THRESHOLD_CUTOFF = parseFloat(process.env.AI_RISK_THRESHOLD_CUTOFF || '50');

// ─── Helper: Call Python ML service ─────────────────────────────────────────

async function callMLService(alumniData, dbRecord) {
    const payload = {
        name: alumniData.name || '',
        email: alumniData.email || '',
        department: alumniData.department || '',
        degree: alumniData.degree || '',
        graduationYear: alumniData.graduationYear || null,
        registerNumber: alumniData.registerNumber || '',
        linkedinUrl: alumniData.linkedinUrl || '',
        currentCompany: alumniData.currentCompany || '',
        currentDesignation: alumniData.currentDesignation || '',
        location: alumniData.location || '',
        bio: alumniData.bio || '',
        skills: alumniData.skills || '',
        interests: alumniData.interests || '',
        phone: alumniData.phone || '',
        profilePhotoUrl: alumniData.profilePhotoUrl || '',
        dbRecords: dbRecord ? {
            name: dbRecord.name || '',
            department: dbRecord.department || '',
            degree: dbRecord.degree || '',
            graduationYear: dbRecord.graduationYear || null,
            registerNumber: dbRecord.registerNumber || '',
        } : null,
    };

    const response = await fetch(`${AI_VERIFICATION_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`ML service returned ${response.status}: ${text}`);
    }

    return response.json();
}

// ─── Helper: Fallback Rule-Based Risk Score Evaluation ────────────────────────

function fallbackEvaluation(submitted, dbRecord) {
    let riskScore = 45.0;
    let nameSimilarity = 0.5;
    let deptMatch = 0;
    let degreeMatch = 0;
    let linkedinValid = 0;

    if (dbRecord) {
        if (submitted.name && dbRecord.name) {
            const sName = submitted.name.toLowerCase().trim();
            const dName = dbRecord.name.toLowerCase().trim();
            if (sName === dName) {
                nameSimilarity = 1.0;
            } else if (sName.includes(dName) || dName.includes(sName)) {
                nameSimilarity = 0.85;
            }
        }
        if (submitted.department && dbRecord.department &&
            submitted.department.toLowerCase().trim() === dbRecord.department.toLowerCase().trim()) {
            deptMatch = 1;
        }
        if (submitted.degree && dbRecord.degree &&
            submitted.degree.toLowerCase().trim() === dbRecord.degree.toLowerCase().trim()) {
            degreeMatch = 1;
        }
    }

    if (submitted.linkedinUrl && submitted.linkedinUrl.includes('linkedin.com/in/')) {
        linkedinValid = 1;
    }

    if (submitted.hasProofImage) {
        riskScore -= 20;
    }

    if (nameSimilarity >= 0.8 && (deptMatch === 1 || degreeMatch === 1)) {
        riskScore = Math.max(5, riskScore - 25);
    } else if (nameSimilarity > 0.5) {
        riskScore = Math.max(15, riskScore - 15);
    }

    if (linkedinValid === 1) {
        riskScore = Math.max(5, riskScore - 10);
    }

    if (submitted.registerNumber && submitted.registerNumber.trim()) {
        riskScore = Math.max(5, riskScore - 10);
    }

    let classification = 'MEDIUM_RISK';
    if (riskScore <= 20) classification = 'LOW_RISK';
    else if (riskScore > 60) classification = 'HIGH_RISK';

    return {
        riskScore,
        classification,
        features: {
            name_similarity: nameSimilarity,
            department_match: deptMatch,
            degree_match: degreeMatch,
            linkedin_valid: linkedinValid,
            image_proof_provided: submitted.hasProofImage ? 1 : 0
        },
        algorithm: 'Rule-Based Heuristic (Node.js Engine)'
    };
}

// ─── Exported helper for use in auth.js ─────────────────────────────────────

async function triggerAIVerification(profileId) {
    try {
        // Fetch alumni profile with user data
        const profile = await prisma.alumniProfile.findUnique({
            where: { id: profileId },
            include: {
                user: {
                    select: {
                        name: true, email: true, phone: true, profilePhotoUrl: true,
                    },
                },
            },
        });

        if (!profile) {
            console.error(`AI Verification: Profile ${profileId} not found`);
            return;
        }

        // Build submitted data object
        const submitted = {
            name: profile.user.name,
            email: profile.user.email,
            phone: profile.user.phone,
            profilePhotoUrl: profile.user.profilePhotoUrl,
            department: profile.department,
            degree: profile.degree,
            graduationYear: profile.graduationYear,
            registerNumber: profile.registerNumber,
            linkedinUrl: profile.linkedinUrl,
            currentCompany: profile.currentCompany,
            currentDesignation: profile.currentDesignation,
            location: profile.location,
            bio: profile.bio,
            skills: profile.skills,
            interests: profile.interests,
        };

        // Use existing profile data as "DB record" for cross-verification
        // In production, this would query the university's student records DB
        const dbRecord = {
            name: profile.user.name,
            department: profile.department,
            degree: profile.degree,
            graduationYear: profile.graduationYear,
            registerNumber: profile.registerNumber,
        };

        // Log the trigger
        await prisma.verificationLog.create({
            data: {
                alumniProfileId: profileId,
                action: 'TRIGGER',
                inputData: JSON.stringify(submitted),
            },
        });

        // Call ML service
        const result = await callMLService(submitted, dbRecord);
        const riskScore = result.riskScore;

        // Log the result
        await prisma.verificationLog.create({
            data: {
                alumniProfileId: profileId,
                action: result.classification === 'LOW_RISK' ? 'AUTO_VERIFY'
                    : result.classification === 'HIGH_RISK' ? 'AUTO_REJECT'
                        : 'PENDING_REVIEW',
                riskScore,
                outputData: JSON.stringify(result),
            },
        });

        // Decision logic with full database state synchronization
        if (riskScore <= RISK_THRESHOLD_CUTOFF) {
            // VERIFIED — direct model auto-verification
            await prisma.alumniProfile.update({
                where: { id: profileId },
                data: {
                    isVerified: true,
                    verificationStatus: 'VERIFIED',
                    riskScore,
                    aiVerificationStatus: 'VERIFIED_BY_MODEL',
                    verifiedAt: new Date(),
                },
            });

            // Create notification for alumni
            await prisma.notification.create({
                data: {
                    userId: profile.user.id || profile.userId,
                    type: 'VERIFICATION_APPROVED',
                    title: 'Profile Verified by AI Model',
                    message: `Congratulations! Your alumni profile has been verified by our AI verification model (Risk Score: ${riskScore.toFixed(1)}/100).`,
                    data: JSON.stringify({ profileId, riskScore }),
                },
            });

        } else {
            // REJECTED — high risk score detected
            await prisma.alumniProfile.update({
                where: { id: profileId },
                data: {
                    isVerified: false,
                    verificationStatus: 'REJECTED',
                    riskScore,
                    aiVerificationStatus: 'REJECTED_HIGH_RISK',
                },
            });

            await prisma.notification.create({
                data: {
                    userId: profile.user.id || profile.userId,
                    type: 'VERIFICATION_REJECTED',
                    title: 'Verification Unsuccessful — High Risk Detected',
                    message: `Our AI verification model detected high risk factors with your submitted credentials (Risk Score: ${riskScore.toFixed(1)}/100). Please upload valid proof or update credentials.`,
                    data: JSON.stringify({ profileId, riskScore }),
                },
            });
        }

        console.log(`✅ AI Verification complete for profile ${profileId}: score=${riskScore}, status=${result.classification}`);

    } catch (err) {
        console.error(`❌ AI Verification failed for profile ${profileId}:`, err.message);
        // Don't throw — this is fire-and-forget from registration
    }
}


// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/ai-verification/submit (Interactive Credential Submission)
// ═════════════════════════════════════════════════════════════════════════════

router.post('/submit', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), async (req, res) => {
    try {
        const userId = parseInt(req.userId);
        const profile = await prisma.alumniProfile.findUnique({
            where: { userId },
            include: { user: { select: { id: true, email: true, name: true } } },
        });

        if (!profile) {
            return res.status(404).json({ detail: 'Alumni profile not found for this user.' });
        }

        const {
            registerNumber,
            department,
            degree,
            graduationYear,
            linkedinUrl,
            currentCompany,
            currentDesignation,
            bio,
            resumeText,
            links,
        } = req.body || {};

        // Handle uploaded proof pictures / PDF files (Front & Back)
        const frontFile = req.files?.image?.[0] || req.file;
        const backFile = req.files?.backImage?.[0];

        let uploadedImageUrl = req.body?.imageUrl || '';
        if (frontFile) {
            console.log('📸 Front file detected in Express backend:', frontFile.filename);
            uploadedImageUrl = `/uploads/certificates/${frontFile.filename}`;
        }
        if (backFile) {
            console.log('📸 Back file detected in Express backend:', backFile.filename);
            if (!uploadedImageUrl) uploadedImageUrl = `/uploads/certificates/${backFile.filename}`;
        }
        if (!frontFile && !backFile) {
            console.log('⚠️ No files attached in req.files (Form submission was text-only)');
        }

        // Validate that AT LEAST ONE credential was provided (no single field is mandatory!)
        const hasRegisterNumber = !!(registerNumber && registerNumber.trim());
        const hasLinkedin = !!(linkedinUrl && linkedinUrl.trim());
        const hasResume = !!(resumeText && resumeText.trim());
        const hasLinks = !!(links && links.trim());
        const hasImage = !!(uploadedImageUrl && uploadedImageUrl.trim());
        const hasAcademicDetails = !!(department && department.trim() && graduationYear);

        if (!hasRegisterNumber && !hasLinkedin && !hasResume && !hasLinks && !hasImage && !hasAcademicDetails) {
            return res.status(400).json({
                detail: 'Please provide at least one credential (e.g. Register Number, LinkedIn URL, ID Picture, Resume summary, or Links).',
            });
        }

        // Update profile fields with submitted credentials
        const updatedProfile = await prisma.alumniProfile.update({
            where: { id: profile.id },
            data: {
                ...(registerNumber ? { registerNumber: registerNumber.trim() } : {}),
                ...(department ? { department: department.trim() } : {}),
                ...(degree ? { degree: degree.trim() } : {}),
                ...(graduationYear ? { graduationYear: parseInt(graduationYear) } : {}),
                ...(linkedinUrl ? { linkedinUrl: linkedinUrl.trim() } : {}),
                ...(currentCompany ? { currentCompany: currentCompany.trim() } : {}),
                ...(currentDesignation ? { currentDesignation: currentDesignation.trim() } : {}),
                ...(bio ? { bio: bio.trim() } : {}),
            },
        });

        // Query institutional database records for cross-verification
        let matchedProfile = null;

        // 1. Primary lookup by Register Number if provided
        if (updatedProfile.registerNumber) {
            matchedProfile = await prisma.alumniProfile.findFirst({
                where: {
                    registerNumber: updatedProfile.registerNumber,
                    id: { not: profile.id },
                },
                include: { user: { select: { name: true } } },
            });
        }

        // 2. Secondary lookup by student name & department if no register number match
        if (!matchedProfile && profile.user.name) {
            matchedProfile = await prisma.alumniProfile.findFirst({
                where: {
                    user: { name: { contains: profile.user.name } },
                    department: updatedProfile.department || undefined,
                    id: { not: profile.id },
                },
                include: { user: { select: { name: true } } },
            });
        }

        // Construct institutional DB record comparison object
        const dbRecord = {
            name: matchedProfile?.user?.name || profile.user.name,
            department: matchedProfile?.department || updatedProfile.department || 'Computer Science',
            degree: matchedProfile?.degree || updatedProfile.degree || 'B.Tech',
            graduationYear: matchedProfile?.graduationYear || updatedProfile.graduationYear || 2022,
            registerNumber: matchedProfile?.registerNumber || updatedProfile.registerNumber || '',
        };

        // Prepare data payload for Python ML service
        const submittedData = {
            name: profile.user.name,
            email: profile.user.email,
            department: updatedProfile.department,
            degree: updatedProfile.degree,
            graduationYear: updatedProfile.graduationYear,
            registerNumber: updatedProfile.registerNumber,
            linkedinUrl: updatedProfile.linkedinUrl,
            currentCompany: updatedProfile.currentCompany,
            currentDesignation: updatedProfile.currentDesignation,
            location: updatedProfile.location,
            bio: updatedProfile.bio,
            resumeText: resumeText || '',
            links: links || '',
            imageUrl: uploadedImageUrl,
            hasProofImage: hasImage,
        };

        const dbData = dbRecord ? {
            name: dbRecord.name,
            department: dbRecord.department,
            degree: dbRecord.degree,
            graduationYear: dbRecord.graduationYear,
            registerNumber: dbRecord.registerNumber,
        } : null;

        // Call Python ML service synchronously
        let result;
        try {
            // Build flat payload matching the Python VerifyRequest schema
            const mlPayload = {
                name: submittedData.name || '',
                email: submittedData.email || '',
                department: submittedData.department || '',
                degree: submittedData.degree || '',
                graduationYear: submittedData.graduationYear || null,
                registerNumber: submittedData.registerNumber || '',
                linkedinUrl: submittedData.linkedinUrl || '',
                currentCompany: submittedData.currentCompany || '',
                currentDesignation: submittedData.currentDesignation || '',
                location: submittedData.location || '',
                bio: submittedData.bio || '',
                skills: submittedData.skills || '',
                interests: submittedData.interests || '',
                phone: submittedData.phone || '',
                resumeText: submittedData.resumeText || '',
                profilePhotoUrl: submittedData.imageUrl || '',
                imageFilePath: frontFile ? frontFile.path : '',
                backImageFilePath: backFile ? backFile.path : '',
                dbRecords: dbData,
            };

            const mlRes = await fetch(`${AI_VERIFICATION_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mlPayload),
            });

            if (!mlRes.ok) {
                const errText = await mlRes.text();
                throw new Error(`ML service returned ${mlRes.status}: ${errText}`);
            }

            result = await mlRes.json();
        } catch (mlErr) {
            console.warn('⚠️ Python ML service unavailable, running Node.js fallback evaluation:', mlErr.message);
            result = fallbackEvaluation(submittedData, dbData);
        }

        // If proof picture was uploaded or University DB matched, adjust risk score in alumni's favor
        let riskScore = result?.riskScore !== undefined ? result.riskScore : (result?.risk_score !== undefined ? result.risk_score : 35.0);
        if (hasImage && riskScore > 15) {
            riskScore = Math.max(10, riskScore - 15); // Reward picture proof with 15pt risk score drop
        }

        // Re-evaluate classification after adjustment
        if (riskScore <= RISK_THRESHOLD_CUTOFF) {
            result.classification = 'VERIFIED';
        } else {
            result.classification = 'REJECTED';
        }

        // Log the verification attempt
        await prisma.verificationLog.create({
            data: {
                alumniProfileId: profile.id,
                action: result.classification === 'VERIFIED' ? 'AUTO_VERIFY' : 'AUTO_REJECT',
                riskScore,
                outputData: JSON.stringify({ ...result, submittedData }),
            },
        });

        let finalStatus = 'REJECTED';
        let isVerified = false;

        // Direct binary decision logic
        if (riskScore <= RISK_THRESHOLD_CUTOFF) {
            // VERIFIED — auto-verify profile directly
            finalStatus = 'VERIFIED';
            isVerified = true;
            await prisma.alumniProfile.update({
                where: { id: profile.id },
                data: {
                    isVerified: true,
                    verificationStatus: 'VERIFIED',
                    riskScore,
                    aiVerificationStatus: 'VERIFIED_LOW_RISK',
                    verifiedAt: new Date(),
                },
            });

            await prisma.notification.create({
                data: {
                    userId: profile.user.id,
                    type: 'VERIFICATION_APPROVED',
                    title: 'Profile Verified by AI Model',
                    message: `Congratulations! Your alumni profile has been verified by our AI verification model (Risk Score: ${riskScore.toFixed(1)}/100).`,
                    data: JSON.stringify({ profileId: profile.id, riskScore }),
                },
            });

        } else {
            // REJECTED — high risk detected
            finalStatus = 'REJECTED_HIGH_RISK';
            isVerified = false;
            await prisma.alumniProfile.update({
                where: { id: profile.id },
                data: {
                    isVerified: false,
                    verificationStatus: 'REJECTED',
                    riskScore,
                    aiVerificationStatus: 'REJECTED_HIGH_RISK',
                },
            });

            await prisma.notification.create({
                data: {
                    userId: profile.user.id,
                    type: 'VERIFICATION_REJECTED',
                    title: 'Verification Unsuccessful (High Risk)',
                    message: `Our AI verification model was unable to verify your profile (Risk Score: ${riskScore.toFixed(1)}/100). Please review your credentials or upload valid ID proof.`,
                    data: JSON.stringify({ profileId: profile.id, riskScore }),
                },
            });
        }

        // ═════════════════════════════════════════════════════════════════════════
        //  SENIOR SDE TERMINAL LOGGING — VERIFICATION SUBMISSION & MODEL OUTPUT
        // ═════════════════════════════════════════════════════════════════════════
        console.log('\n================================================================================');
        console.log(' 🎓 ALUMNI AI VERIFICATION SUBMISSION EVALUATION');
        console.log('================================================================================');
        console.log(` 👤 User: ${profile.user.name} (${profile.user.email}) | User ID: ${profile.userId}`);
        if (req.file) {
            console.log(` 📷 ID Proof File Uploaded : ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);
        } else if (uploadedImageUrl) {
            console.log(` 📷 ID Proof Image URL     : ${uploadedImageUrl}`);
        } else {
            console.log(' 📷 ID Proof Image         : None Provided');
        }
        console.log(' 📝 Extracted Submitted Credentials:');
        console.log(`    - Register No : ${submittedData.registerNumber || 'N/A'}`);
        console.log(`    - Dept/Degree : ${submittedData.department || 'N/A'} / ${submittedData.degree || 'N/A'} (${submittedData.graduationYear || 'N/A'})`);
        console.log(`    - LinkedIn    : ${submittedData.linkedinUrl || 'N/A'}`);
        console.log(`    - Work Info   : ${submittedData.currentCompany || 'N/A'} (${submittedData.currentDesignation || 'N/A'})`);
        console.log(' 🏢 University Database Cross-Reference:');
        console.log(`    - DB Match Found : ${matchedProfile ? 'YES (' + matchedProfile.user.name + ')' : 'No cross-match found'}`);
        console.log('\n 🤖 ML MODEL EVALUATION OUTPUT:');
        console.log('    ----------------------------------------------------------------------------');
        console.log(`    Risk Score     : ${riskScore.toFixed(1)} / 100`);
        console.log(`    Classification : ${result.classification || finalStatus}`);
        console.log(`    Fraud Prob     : ${result.fraudProbability !== undefined ? result.fraudProbability.toFixed(4) : (riskScore / 100).toFixed(4)}`);
        console.log(`    Algorithm      : ${result.algorithm || 'CatBoost/RandomForest'}`);
        if (result.extractedCollegeDetails) {
            console.log('\n 📄 RESUME COLLEGE DETAILS EXTRACTED:');
            console.log(`    - University : ${result.extractedCollegeDetails.university || 'N/A'}`);
            console.log(`    - Degree     : ${result.extractedCollegeDetails.degree || 'N/A'}`);
            console.log(`    - Department : ${result.extractedCollegeDetails.department || 'N/A'}`);
            console.log(`    - Grad Year  : ${result.extractedCollegeDetails.graduation_year || 'N/A'}`);
            console.log(`    - Reg Number : ${result.extractedCollegeDetails.register_number || 'N/A'}`);
            console.log(`    - CGPA/Grade : ${result.extractedCollegeDetails.cgpa || 'N/A'}`);
        }
        console.log('\n 📊 Extracted Feature Vector:');
        console.log(JSON.stringify(result.features || {}, null, 6));
        console.log('================================================================================\n');

        return res.json({
            message: 'Verification evaluation complete',
            riskScore,
            classification: result.classification,
            aiVerificationStatus: finalStatus,
            isVerified,
            features: result.features,
            algorithm: result.algorithm || 'CatBoost/RandomForest',
            extractedCollegeDetails: result.extractedCollegeDetails || null,
            ocrExtractedText: result.ocrExtractedText || null,
            groqStructured: result.groqStructured || null,
        });

    } catch (err) {
        console.error('Interactive verification submission error:', err.message, err.stack);
        return res.status(500).json({ detail: err.message || 'Failed to evaluate verification submission' });
    }
});


// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/ai-verification/trigger/:profileId
// ═════════════════════════════════════════════════════════════════════════════

router.post('/trigger/:profileId', requireAuth, async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);
        const profile = await prisma.alumniProfile.findUnique({ where: { id: profileId } });
        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        // Only allow re-triggering if still PENDING
        if (profile.aiVerificationStatus !== 'PENDING') {
            return res.status(400).json({
                detail: `Verification already processed (status: ${profile.aiVerificationStatus})`,
            });
        }

        // Run async — respond immediately
        triggerAIVerification(profileId);
        res.json({ message: 'AI verification triggered', profileId });

    } catch (err) {
        console.error('AI verification trigger error:', err);
        res.status(500).json({ detail: 'Failed to trigger verification' });
    }
});


// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/ai-verification/status/:profileId
// ═════════════════════════════════════════════════════════════════════════════

router.get('/status/:profileId', requireAuth, async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);
        const profile = await prisma.alumniProfile.findUnique({
            where: { id: profileId },
            select: {
                id: true,
                riskScore: true,
                aiVerificationStatus: true,
                verifiedAt: true,
            },
        });

        if (!profile) return res.status(404).json({ detail: 'Profile not found' });

        res.json(profile);
    } catch (err) {
        console.error('AI verification status error:', err);
        res.status(500).json({ detail: 'Failed to get verification status' });
    }
});


// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/ai-verification/admin/queue
// ═════════════════════════════════════════════════════════════════════════════

router.get('/admin/queue', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { status } = req.query;
        const where = {
            reviewStatus: status || 'PENDING',
        };

        const queue = await prisma.aIReviewQueue.findMany({
            where,
            include: {
                alumniProfile: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, profilePhotoUrl: true },
                        },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });

        const result = queue.map(item => ({
            queueId: item.id,
            profileId: item.alumniProfileId,
            riskScore: item.riskScore,
            features: item.features ? JSON.parse(item.features) : null,
            submittedAt: item.submittedAt,
            reviewStatus: item.reviewStatus,
            reviewedAt: item.reviewedAt,
            reviewNotes: item.reviewNotes,
            alumni: {
                userId: item.alumniProfile.user.id,
                name: item.alumniProfile.user.name,
                email: item.alumniProfile.user.email,
                profilePhotoUrl: item.alumniProfile.user.profilePhotoUrl,
                department: item.alumniProfile.department,
                degree: item.alumniProfile.degree,
                graduationYear: item.alumniProfile.graduationYear,
                registerNumber: item.alumniProfile.registerNumber,
                linkedinUrl: item.alumniProfile.linkedinUrl,
            },
        }));

        res.json(result);
    } catch (err) {
        console.error('Admin queue error:', err);
        res.status(500).json({ detail: 'Failed to load review queue' });
    }
});


// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/ai-verification/admin/:queueId/approve
// ═════════════════════════════════════════════════════════════════════════════

router.post('/admin/:queueId/approve', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const queueId = parseInt(req.params.queueId);
        const item = await prisma.aIReviewQueue.findUnique({
            where: { id: queueId },
            include: { alumniProfile: { include: { user: { select: { id: true } } } } },
        });

        if (!item) return res.status(404).json({ detail: 'Review item not found' });
        if (item.reviewStatus !== 'PENDING') {
            return res.status(400).json({ detail: `Already reviewed (status: ${item.reviewStatus})` });
        }

        // Update queue item
        await prisma.aIReviewQueue.update({
            where: { id: queueId },
            data: {
                reviewStatus: 'APPROVED',
                reviewedByAdminId: parseInt(req.userId),
                reviewedAt: new Date(),
                reviewNotes: req.body.notes || null,
            },
        });

        // Update alumni profile
        await prisma.alumniProfile.update({
            where: { id: item.alumniProfileId },
            data: {
                isVerified: true,
                verificationStatus: 'VERIFIED',
                aiVerificationStatus: 'VERIFIED_BY_ADMIN',
                verifiedAt: new Date(),
            },
        });

        // Log
        await prisma.verificationLog.create({
            data: {
                alumniProfileId: item.alumniProfileId,
                action: 'ADMIN_APPROVE',
                riskScore: item.riskScore,
                outputData: JSON.stringify({ adminId: req.userId, notes: req.body.notes }),
            },
        });

        // Notify alumni
        await prisma.notification.create({
            data: {
                userId: item.alumniProfile.user.id,
                type: 'VERIFICATION_APPROVED',
                title: 'Profile Verified by Admin',
                message: 'An administrator has verified your alumni profile. You now have a "Verified" badge.',
                data: JSON.stringify({ profileId: item.alumniProfileId }),
            },
        });

        res.json({ message: 'Alumni approved successfully' });
    } catch (err) {
        console.error('Admin approve error:', err);
        res.status(500).json({ detail: 'Failed to approve' });
    }
});


// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/ai-verification/admin/:queueId/reject
// ═════════════════════════════════════════════════════════════════════════════

router.post('/admin/:queueId/reject', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { notes } = req.body;
        if (!notes || !notes.trim()) {
            return res.status(400).json({ detail: 'Rejection notes are required' });
        }

        const queueId = parseInt(req.params.queueId);
        const item = await prisma.aIReviewQueue.findUnique({
            where: { id: queueId },
            include: { alumniProfile: { include: { user: { select: { id: true } } } } },
        });

        if (!item) return res.status(404).json({ detail: 'Review item not found' });
        if (item.reviewStatus !== 'PENDING') {
            return res.status(400).json({ detail: `Already reviewed (status: ${item.reviewStatus})` });
        }

        // Update queue item
        await prisma.aIReviewQueue.update({
            where: { id: queueId },
            data: {
                reviewStatus: 'REJECTED',
                reviewedByAdminId: parseInt(req.userId),
                reviewedAt: new Date(),
                reviewNotes: notes.trim(),
            },
        });

        // Update alumni profile
        await prisma.alumniProfile.update({
            where: { id: item.alumniProfileId },
            data: {
                isVerified: false,
                verificationStatus: 'REJECTED',
                aiVerificationStatus: 'REJECTED_BY_ADMIN',
            },
        });

        // Log
        await prisma.verificationLog.create({
            data: {
                alumniProfileId: item.alumniProfileId,
                action: 'ADMIN_REJECT',
                riskScore: item.riskScore,
                outputData: JSON.stringify({ adminId: req.userId, notes: notes.trim() }),
            },
        });

        // Notify alumni
        await prisma.notification.create({
            data: {
                userId: item.alumniProfile.user.id,
                type: 'VERIFICATION_REJECTED',
                title: 'Verification Unsuccessful',
                message: `An administrator has reviewed your profile and was unable to verify it. Reason: ${notes.trim()}`,
                data: JSON.stringify({ profileId: item.alumniProfileId }),
            },
        });

        res.json({ message: 'Alumni rejected' });
    } catch (err) {
        console.error('Admin reject error:', err);
        res.status(500).json({ detail: 'Failed to reject' });
    }
});


module.exports = router;
module.exports.triggerAIVerification = triggerAIVerification;
