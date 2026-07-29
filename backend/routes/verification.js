const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, loadUser, prisma } = require('../middleware/auth');

const router = express.Router();

// ─── Multer config for certificate uploads ──────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `cert_${req.userId}_${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    },
});

const INSTITUTIONAL_EMAIL_DOMAIN = process.env.INSTITUTIONAL_EMAIL_DOMAIN || 'college.edu';

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/verification/status
// ═════════════════════════════════════════════════════════════════════════════
router.get('/status', requireAuth, async (req, res) => {
    try {
        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
            include: {
                verificationRequests: {
                    orderBy: { submittedAt: 'desc' },
                    include: {
                        referenceAlumni: {
                            select: { id: true, user: { select: { name: true } }, graduationYear: true, department: true },
                        },
                    },
                },
            },
        });

        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        // Build checklist
        const requests = profile.verificationRequests;
        const checklist = {
            registerNumber: {
                submitted: requests.some(r => r.method === 'REGISTER_NUMBER'),
                status: requests.find(r => r.method === 'REGISTER_NUMBER')?.status || null,
                value: profile.registerNumber,
            },
            graduationCertificate: {
                submitted: requests.some(r => r.method === 'GRADUATION_CERTIFICATE'),
                status: requests.find(r => r.method === 'GRADUATION_CERTIFICATE')?.status || null,
                documentUrl: requests.find(r => r.method === 'GRADUATION_CERTIFICATE')?.documentUrl || null,
            },
            institutionalEmail: {
                submitted: requests.some(r => r.method === 'INSTITUTIONAL_EMAIL'),
                status: requests.find(r => r.method === 'INSTITUTIONAL_EMAIL')?.status || null,
            },
            alumniReference: {
                submitted: requests.some(r => r.method === 'ALUMNI_REFERENCE'),
                status: requests.find(r => r.method === 'ALUMNI_REFERENCE')?.status || null,
                reference: requests.find(r => r.method === 'ALUMNI_REFERENCE')?.referenceAlumni || null,
            },
            adminApproval: {
                status: profile.verificationStatus,
                reviewNotes: requests.find(r => r.reviewNotes && r.status === 'REJECTED')?.reviewNotes || null,
            },
        };

        const methodCount = [checklist.registerNumber, checklist.graduationCertificate, checklist.institutionalEmail]
            .filter(m => m.submitted).length;

        res.json({
            profileId: profile.id,
            verificationStatus: profile.verificationStatus,
            isVerified: profile.isVerified,
            checklist,
            canSubmitForReview: methodCount >= 1 && profile.verificationStatus === 'PENDING',
            requests,
        });
    } catch (err) {
        console.error('Verification status error:', err);
        res.status(500).json({ detail: 'Failed to get verification status' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/verification/register-number
// ═════════════════════════════════════════════════════════════════════════════
router.post('/register-number', requireAuth, async (req, res) => {
    try {
        const { registerNumber } = req.body;
        if (!registerNumber) return res.status(400).json({ detail: 'Register number is required' });

        const profile = await prisma.alumniProfile.findUnique({ where: { userId: parseInt(req.userId) } });
        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        // Update register number on profile
        await prisma.alumniProfile.update({
            where: { id: profile.id },
            data: { registerNumber },
        });

        // Upsert verification request
        const existing = await prisma.verificationRequest.findFirst({
            where: { alumniProfileId: profile.id, method: 'REGISTER_NUMBER' },
        });

        if (existing) {
            await prisma.verificationRequest.update({
                where: { id: existing.id },
                data: { status: 'PENDING', submittedAt: new Date() },
            });
        } else {
            await prisma.verificationRequest.create({
                data: { alumniProfileId: profile.id, method: 'REGISTER_NUMBER', status: 'PENDING' },
            });
        }

        res.json({ message: 'Register number submitted for verification' });
    } catch (err) {
        console.error('Register number error:', err);
        res.status(500).json({ detail: 'Failed to submit register number' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/verification/certificate
// ═════════════════════════════════════════════════════════════════════════════
router.post('/certificate', requireAuth, upload.single('certificate'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ detail: 'Certificate file is required' });

        const profile = await prisma.alumniProfile.findUnique({ where: { userId: parseInt(req.userId) } });
        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        const documentUrl = `/uploads/certificates/${req.file.filename}`;

        // Upsert verification request
        const existing = await prisma.verificationRequest.findFirst({
            where: { alumniProfileId: profile.id, method: 'GRADUATION_CERTIFICATE' },
        });

        if (existing) {
            await prisma.verificationRequest.update({
                where: { id: existing.id },
                data: { documentUrl, status: 'PENDING', submittedAt: new Date() },
            });
        } else {
            await prisma.verificationRequest.create({
                data: { alumniProfileId: profile.id, method: 'GRADUATION_CERTIFICATE', documentUrl, status: 'PENDING' },
            });
        }

        res.json({ message: 'Certificate uploaded successfully', documentUrl });
    } catch (err) {
        console.error('Certificate upload error:', err);
        res.status(500).json({ detail: 'Failed to upload certificate' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/verification/institutional-email
// ═════════════════════════════════════════════════════════════════════════════
router.post('/institutional-email', requireAuth, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ detail: 'Email is required' });

        if (!email.toLowerCase().endsWith(`@${INSTITUTIONAL_EMAIL_DOMAIN.toLowerCase()}`)) {
            return res.status(400).json({ detail: `Email must end with @${INSTITUTIONAL_EMAIL_DOMAIN}` });
        }

        const profile = await prisma.alumniProfile.findUnique({ where: { userId: parseInt(req.userId) } });
        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.alumniProfile.update({
            where: { id: profile.id },
            data: { emailVerificationToken: token, emailVerificationExpiry: expiry },
        });

        // Stub email send
        const verifyLink = `http://localhost:5173/verify-email?token=${token}`;
        console.log(`\n📧 Institutional email verification for ${email}:`);
        console.log(`   Verification link: ${verifyLink}`);
        console.log(`   Token expires: ${expiry.toISOString()}\n`);

        // Upsert verification request
        const existing = await prisma.verificationRequest.findFirst({
            where: { alumniProfileId: profile.id, method: 'INSTITUTIONAL_EMAIL' },
        });

        if (existing) {
            await prisma.verificationRequest.update({
                where: { id: existing.id },
                data: { status: 'PENDING', submittedAt: new Date(), reviewNotes: `Verification link sent to ${email}` },
            });
        } else {
            await prisma.verificationRequest.create({
                data: {
                    alumniProfileId: profile.id,
                    method: 'INSTITUTIONAL_EMAIL',
                    status: 'PENDING',
                    reviewNotes: `Verification link sent to ${email}`,
                },
            });
        }

        res.json({ message: 'Verification link sent (check server console)' });
    } catch (err) {
        console.error('Institutional email error:', err);
        res.status(500).json({ detail: 'Failed to send verification email' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/verification/verify-email?token=...
// ═════════════════════════════════════════════════════════════════════════════
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ detail: 'Token is required' });

        const profile = await prisma.alumniProfile.findFirst({
            where: { emailVerificationToken: token, emailVerificationExpiry: { gt: new Date() } },
        });

        if (!profile) return res.status(400).json({ detail: 'Invalid or expired token' });

        // Mark email as verified
        await prisma.alumniProfile.update({
            where: { id: profile.id },
            data: { emailVerificationToken: null, emailVerificationExpiry: null },
        });

        // Update verification request
        const verReq = await prisma.verificationRequest.findFirst({
            where: { alumniProfileId: profile.id, method: 'INSTITUTIONAL_EMAIL' },
        });
        if (verReq) {
            await prisma.verificationRequest.update({
                where: { id: verReq.id },
                data: { status: 'VERIFIED', reviewNotes: 'Institutional email verified via token' },
            });
        }

        res.json({ message: 'Institutional email verified successfully!' });
    } catch (err) {
        console.error('Email verify error:', err);
        res.status(500).json({ detail: 'Email verification failed' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/verification/search-alumni?q=...
// ═════════════════════════════════════════════════════════════════════════════
router.get('/search-alumni', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        const alumni = await prisma.alumniProfile.findMany({
            where: {
                isVerified: true,
                userId: { not: parseInt(req.userId) },
                ...(q ? { user: { name: { contains: q } } } : {}),
            },
            take: 20,
            select: {
                id: true,
                graduationYear: true,
                department: true,
                user: { select: { name: true } },
            },
        });

        res.json(alumni.map(a => ({
            id: a.id,
            name: a.user.name,
            graduationYear: a.graduationYear,
            department: a.department,
        })));
    } catch (err) {
        console.error('Search alumni error:', err);
        res.status(500).json({ detail: 'Failed to search alumni' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/verification/alumni-reference
// ═════════════════════════════════════════════════════════════════════════════
router.post('/alumni-reference', requireAuth, async (req, res) => {
    try {
        const { referenceAlumniId } = req.body;
        if (!referenceAlumniId) return res.status(400).json({ detail: 'Reference alumni ID is required' });

        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
            include: { user: { select: { name: true } } },
        });
        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        const refAlumni = await prisma.alumniProfile.findUnique({
            where: { id: parseInt(referenceAlumniId) },
            select: { id: true, userId: true, isVerified: true },
        });
        if (!refAlumni || !refAlumni.isVerified) {
            return res.status(400).json({ detail: 'Referenced alumni must be verified' });
        }

        // Upsert verification request
        const existing = await prisma.verificationRequest.findFirst({
            where: { alumniProfileId: profile.id, method: 'ALUMNI_REFERENCE' },
        });

        let verReq;
        if (existing) {
            verReq = await prisma.verificationRequest.update({
                where: { id: existing.id },
                data: { referenceAlumniId: refAlumni.id, status: 'PENDING', submittedAt: new Date() },
            });
        } else {
            verReq = await prisma.verificationRequest.create({
                data: {
                    alumniProfileId: profile.id,
                    method: 'ALUMNI_REFERENCE',
                    referenceAlumniId: refAlumni.id,
                    status: 'PENDING',
                },
            });
        }

        // Send notification to the referenced alumni
        await prisma.notification.create({
            data: {
                userId: refAlumni.userId,
                type: 'VOUCH_REQUEST',
                title: 'Alumni Verification Vouch Request',
                message: `${profile.user.name} (Class of ${profile.graduationYear}) is requesting your vouch for their alumni verification.`,
                data: JSON.stringify({ requestId: verReq.id, profileId: profile.id }),
            },
        });

        res.json({ message: 'Reference request sent. The alumni will be notified.' });
    } catch (err) {
        console.error('Alumni reference error:', err);
        res.status(500).json({ detail: 'Failed to submit alumni reference' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/verification/vouch/:requestId
// ═════════════════════════════════════════════════════════════════════════════
router.post('/vouch/:requestId', requireAuth, async (req, res) => {
    try {
        const { confirm } = req.body; // true = vouch, false = decline
        const requestId = parseInt(req.params.requestId);

        const verReq = await prisma.verificationRequest.findUnique({
            where: { id: requestId },
            include: { referenceAlumni: true, alumniProfile: { include: { user: { select: { name: true } } } } },
        });

        if (!verReq || verReq.method !== 'ALUMNI_REFERENCE') {
            return res.status(404).json({ detail: 'Vouch request not found' });
        }

        // Verify caller is the referenced alumni
        const callerProfile = await prisma.alumniProfile.findUnique({ where: { userId: parseInt(req.userId) } });
        if (!callerProfile || callerProfile.id !== verReq.referenceAlumniId) {
            return res.status(403).json({ detail: 'You are not the referenced alumni for this request' });
        }

        if (confirm) {
            await prisma.verificationRequest.update({
                where: { id: requestId },
                data: { status: 'VERIFIED', reviewNotes: 'Vouched by referenced alumni' },
            });
        } else {
            await prisma.verificationRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED', reviewNotes: 'Referenced alumni declined to vouch' },
            });
        }

        res.json({ message: confirm ? 'Vouch confirmed' : 'Vouch declined' });
    } catch (err) {
        console.error('Vouch error:', err);
        res.status(500).json({ detail: 'Failed to process vouch' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/verification/submit
// ═════════════════════════════════════════════════════════════════════════════
router.post('/submit', requireAuth, async (req, res) => {
    try {
        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
            include: { verificationRequests: true },
        });
        if (!profile) return res.status(404).json({ detail: 'Alumni profile not found' });

        if (profile.verificationStatus !== 'PENDING') {
            return res.status(400).json({ detail: 'Verification already submitted or completed' });
        }

        // Check minimum: at least one of register number, certificate, or institutional email
        const methods = profile.verificationRequests.map(r => r.method);
        const hasMinimum = ['REGISTER_NUMBER', 'GRADUATION_CERTIFICATE', 'INSTITUTIONAL_EMAIL']
            .some(m => methods.includes(m));

        if (!hasMinimum) {
            return res.status(400).json({
                detail: 'Please submit at least one: register number, graduation certificate, or institutional email',
            });
        }

        await prisma.alumniProfile.update({
            where: { id: profile.id },
            data: { verificationStatus: 'UNDER_REVIEW' },
        });

        res.json({ message: 'Verification submitted for admin review' });
    } catch (err) {
        console.error('Submit verification error:', err);
        res.status(500).json({ detail: 'Failed to submit verification' });
    }
});

module.exports = router;
