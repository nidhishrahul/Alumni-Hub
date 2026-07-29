const express = require('express');
const { requireAuth, requireRole, prisma } = require('../middleware/auth');

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/admin/verifications
//  List PENDING / UNDER_REVIEW profiles, filterable by method & department
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { method, department, status } = req.query;

        const where = {
            verificationStatus: { in: status ? [status] : ['PENDING', 'UNDER_REVIEW'] },
            ...(department ? { department } : {}),
        };

        let profiles = await prisma.alumniProfile.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
                verificationRequests: {
                    orderBy: { submittedAt: 'desc' },
                },
            },
            orderBy: { id: 'desc' },
        });

        // Filter by method if specified
        if (method) {
            profiles = profiles.filter(p =>
                p.verificationRequests.some(r => r.method === method)
            );
        }

        const result = profiles.map(p => ({
            profileId: p.id,
            userId: p.user.id,
            name: p.user.name,
            email: p.user.email,
            profilePhotoUrl: p.user.profilePhotoUrl,
            graduationYear: p.graduationYear,
            department: p.department,
            degree: p.degree,
            verificationStatus: p.verificationStatus,
            methodsSummary: [...new Set(p.verificationRequests.map(r => r.method))],
            requestCount: p.verificationRequests.length,
            latestSubmission: p.verificationRequests[0]?.submittedAt || null,
        }));

        res.json(result);
    } catch (err) {
        console.error('Admin list verifications error:', err);
        res.status(500).json({ detail: 'Failed to list verifications' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/admin/verifications/:profileId
//  Detailed evidence view
// ═════════════════════════════════════════════════════════════════════════════
router.get('/:profileId', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);

        const profile = await prisma.alumniProfile.findUnique({
            where: { id: profileId },
            include: {
                user: { select: { id: true, name: true, email: true, profilePhotoUrl: true, createdAt: true } },
                verificationRequests: {
                    orderBy: { submittedAt: 'desc' },
                    include: {
                        referenceAlumni: {
                            select: {
                                id: true,
                                graduationYear: true,
                                department: true,
                                user: { select: { name: true } },
                            },
                        },
                        reviewedByAdmin: {
                            select: { name: true },
                        },
                    },
                },
            },
        });

        if (!profile) return res.status(404).json({ detail: 'Profile not found' });

        res.json({
            profileId: profile.id,
            userId: profile.user.id,
            name: profile.user.name,
            email: profile.user.email,
            profilePhotoUrl: profile.user.profilePhotoUrl,
            memberSince: profile.user.createdAt,
            registerNumber: profile.registerNumber,
            graduationYear: profile.graduationYear,
            department: profile.department,
            degree: profile.degree,
            verificationStatus: profile.verificationStatus,
            isVerified: profile.isVerified,
            requests: profile.verificationRequests.map(r => ({
                id: r.id,
                method: r.method,
                status: r.status,
                documentUrl: r.documentUrl,
                referenceAlumni: r.referenceAlumni ? {
                    id: r.referenceAlumni.id,
                    name: r.referenceAlumni.user.name,
                    graduationYear: r.referenceAlumni.graduationYear,
                    department: r.referenceAlumni.department,
                } : null,
                reviewNotes: r.reviewNotes,
                submittedAt: r.submittedAt,
                reviewedAt: r.reviewedAt,
                reviewedBy: r.reviewedByAdmin?.name || null,
            })),
        });
    } catch (err) {
        console.error('Admin verification detail error:', err);
        res.status(500).json({ detail: 'Failed to get verification details' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/admin/verifications/:profileId/approve
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:profileId/approve', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);

        const profile = await prisma.alumniProfile.findUnique({
            where: { id: profileId },
            include: { user: { select: { id: true, name: true } } },
        });
        if (!profile) return res.status(404).json({ detail: 'Profile not found' });

        // Update profile
        await prisma.alumniProfile.update({
            where: { id: profileId },
            data: { isVerified: true, verificationStatus: 'VERIFIED' },
        });

        // Update all pending verification requests to VERIFIED
        await prisma.verificationRequest.updateMany({
            where: { alumniProfileId: profileId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
            data: { status: 'VERIFIED', reviewedByAdminId: parseInt(req.userId), reviewedAt: new Date() },
        });

        // Send congratulatory notification
        await prisma.notification.create({
            data: {
                userId: profile.user.id,
                type: 'VERIFICATION_APPROVED',
                title: '🎉 Congratulations! You\'re Verified!',
                message: 'Your alumni profile has been verified. You now have full access to all alumni features including posting availability, coordinating reunions, and more.',
                data: JSON.stringify({ profileId }),
            },
        });

        res.json({ message: 'Alumni verified successfully' });
    } catch (err) {
        console.error('Approve verification error:', err);
        res.status(500).json({ detail: 'Failed to approve verification' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/admin/verifications/:profileId/reject
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:profileId/reject', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { note } = req.body;
        if (!note || !note.trim()) return res.status(400).json({ detail: 'Rejection note is required' });

        const profileId = parseInt(req.params.profileId);

        const profile = await prisma.alumniProfile.findUnique({
            where: { id: profileId },
            include: { user: { select: { id: true } } },
        });
        if (!profile) return res.status(404).json({ detail: 'Profile not found' });

        // Update profile
        await prisma.alumniProfile.update({
            where: { id: profileId },
            data: { verificationStatus: 'REJECTED', isVerified: false },
        });

        // Send rejection notification
        await prisma.notification.create({
            data: {
                userId: profile.user.id,
                type: 'VERIFICATION_REJECTED',
                title: 'Verification Update',
                message: `Your verification was not approved. Admin note: ${note.trim()}`,
                data: JSON.stringify({ profileId, note: note.trim() }),
            },
        });

        res.json({ message: 'Verification rejected' });
    } catch (err) {
        console.error('Reject verification error:', err);
        res.status(500).json({ detail: 'Failed to reject verification' });
    }
});

module.exports = router;
