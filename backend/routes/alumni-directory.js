const express = require('express');
const { requireAuth, prisma } = require('../middleware/auth');

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/alumni-directory
//  List all registered alumni with their profiles (visible to students)
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', requireAuth, async (req, res) => {
    try {
        const { search, department, graduationYear } = req.query;

        const where = {
            role: 'ALUMNI',
            alumniProfile: { isNot: null },
        };

        // Optional search filter
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { alumniProfile: { currentCompany: { contains: search } } },
                { alumniProfile: { currentDesignation: { contains: search } } },
                { alumniProfile: { department: { contains: search } } },
            ];
        }

        // Optional department filter
        if (department && department !== 'all') {
            where.alumniProfile = { ...where.alumniProfile, department };
        }

        // Optional graduation year filter
        if (graduationYear && graduationYear !== 'all') {
            where.alumniProfile = {
                ...where.alumniProfile,
                graduationYear: parseInt(graduationYear),
            };
        }

        const alumni = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                alumniProfile: {
                    select: {
                        id: true,
                        graduationYear: true,
                        department: true,
                        degree: true,
                        currentCompany: true,
                        currentDesignation: true,
                        location: true,
                        bio: true,
                        linkedinUrl: true,
                        isVerified: true,
                        isAway: true,
                        availabilityStatuses: {
                            where: { isActive: true },
                            select: { supportType: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Flatten the response for frontend consumption
        const result = alumni
            .filter(a => a.alumniProfile) // safety check
            .map(a => ({
                userId: a.id,
                profileId: a.alumniProfile.id,
                name: a.name,
                email: a.email,
                graduationYear: a.alumniProfile.graduationYear,
                department: a.alumniProfile.department,
                degree: a.alumniProfile.degree,
                company: a.alumniProfile.currentCompany,
                designation: a.alumniProfile.currentDesignation,
                location: a.alumniProfile.location,
                bio: a.alumniProfile.bio,
                linkedinUrl: a.alumniProfile.linkedinUrl,
                isVerified: a.alumniProfile.isVerified,
                isAway: a.alumniProfile.isAway,
                availableFor: a.alumniProfile.availabilityStatuses.map(s => s.supportType),
            }));

        res.json(result);
    } catch (err) {
        console.error('Alumni directory error:', err);
        res.status(500).json({ detail: 'Failed to fetch alumni directory' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/alumni-directory/request
//  Student sends a support/mentorship request to an alumni
// ═════════════════════════════════════════════════════════════════════════════
router.post('/request', requireAuth, async (req, res) => {
    try {
        const { alumniProfileId, supportType, message } = req.body;

        if (!alumniProfileId || !supportType || !message) {
            return res.status(400).json({ detail: 'alumniProfileId, supportType, and message are required' });
        }

        const validTypes = ['MENTORING', 'REFERRALS', 'MOCK_INTERVIEWS', 'GUEST_LECTURES', 'RESUME_REVIEWS', 'PROJECT_GUIDANCE', 'STARTUP_INVESTMENT'];
        if (!validTypes.includes(supportType)) {
            return res.status(400).json({ detail: `supportType must be one of: ${validTypes.join(', ')}` });
        }

        // Verify the alumni profile exists
        const alumniProfile = await prisma.alumniProfile.findUnique({
            where: { id: parseInt(alumniProfileId) },
            include: { user: { select: { id: true, name: true } } },
        });

        if (!alumniProfile) {
            return res.status(404).json({ detail: 'Alumni profile not found' });
        }

        // Check for duplicate pending request
        const existing = await prisma.supportRequest.findFirst({
            where: {
                requestedByUserId: parseInt(req.userId),
                alumniProfileId: parseInt(alumniProfileId),
                supportType,
                status: 'PENDING',
            },
        });

        if (existing) {
            return res.status(400).json({ detail: 'You already have a pending request of this type to this alumni' });
        }

        // Create the support request
        const supportRequest = await prisma.supportRequest.create({
            data: {
                requestedByUserId: parseInt(req.userId),
                alumniProfileId: parseInt(alumniProfileId),
                supportType,
                message,
                status: 'PENDING',
            },
        });

        // Get the student's name for notification
        const student = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            select: { name: true },
        });

        // Send notification to the alumni
        await prisma.notification.create({
            data: {
                userId: alumniProfile.user.id,
                type: 'SUPPORT_REQUEST',
                title: 'New Mentorship Request',
                message: `${student.name} has requested your support for ${supportType.replace(/_/g, ' ').toLowerCase()}.`,
                data: JSON.stringify({ requestId: supportRequest.id, studentName: student.name }),
            },
        });

        res.status(201).json({ message: 'Request sent successfully', request: supportRequest });
    } catch (err) {
        console.error('Support request error:', err);
        res.status(500).json({ detail: 'Failed to send request' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/alumni-directory/my-requests
//  Student views their sent requests
// ═════════════════════════════════════════════════════════════════════════════
router.get('/my-requests', requireAuth, async (req, res) => {
    try {
        const requests = await prisma.supportRequest.findMany({
            where: { requestedByUserId: parseInt(req.userId) },
            include: {
                alumniProfile: {
                    select: {
                        id: true,
                        userId: true,
                        department: true,
                        graduationYear: true,
                        currentCompany: true,
                        currentDesignation: true,
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = requests.map(r => ({
            id: r.id,
            alumniUserId: r.alumniProfile.userId,
            alumniName: r.alumniProfile.user.name,
            alumniCompany: r.alumniProfile.currentCompany,
            alumniDesignation: r.alumniProfile.currentDesignation,
            alumniDepartment: r.alumniProfile.department,
            supportType: r.supportType,
            message: r.message,
            replyMessage: r.replyMessage,
            status: r.status,
            createdAt: r.createdAt,
        }));

        res.json(result);
    } catch (err) {
        console.error('My requests error:', err);
        res.status(500).json({ detail: 'Failed to fetch your requests' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/alumni-directory/incoming-requests
//  Alumni views incoming requests from students
// ═════════════════════════════════════════════════════════════════════════════
router.get('/incoming-requests', requireAuth, async (req, res) => {
    try {
        // Find the alumni profile for this user
        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
        });

        if (!profile) {
            return res.status(404).json({ detail: 'Alumni profile not found' });
        }

        const requests = await prisma.supportRequest.findMany({
            where: { alumniProfileId: profile.id },
            include: {
                requestedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = requests.map(r => ({
            id: r.id,
            studentUserId: r.requestedByUserId,
            studentName: r.requestedBy.name,
            studentEmail: r.requestedBy.email,
            supportType: r.supportType,
            message: r.message,
            replyMessage: r.replyMessage,
            status: r.status,
            createdAt: r.createdAt,
        }));

        res.json(result);
    } catch (err) {
        console.error('Incoming requests error:', err);
        res.status(500).json({ detail: 'Failed to fetch incoming requests' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/alumni-directory/requests/:id/messages
//  Fetch message thread history for a support request
// ═════════════════════════════════════════════════════════════════════════════
router.get('/requests/:id/messages', requireAuth, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);

        const supportRequest = await prisma.supportRequest.findUnique({
            where: { id: requestId },
            include: {
                requestedBy: { select: { id: true, name: true, role: true } },
                alumniProfile: { include: { user: { select: { id: true, name: true, role: true } } } },
            },
        });

        if (!supportRequest) {
            return res.status(404).json({ detail: 'Request not found' });
        }

        let messages = await prisma.mentorshipMessage.findMany({
            where: { supportRequestId: requestId },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Seed initial student message & alumni reply if no messages recorded yet
        if (messages.length === 0 && supportRequest.message) {
            const firstMsg = await prisma.mentorshipMessage.create({
                data: {
                    supportRequestId: requestId,
                    senderId: supportRequest.requestedByUserId,
                    receiverId: supportRequest.alumniProfile.userId,
                    message: supportRequest.message,
                    createdAt: supportRequest.createdAt,
                },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                },
            });

            if (supportRequest.replyMessage) {
                const replyMsg = await prisma.mentorshipMessage.create({
                    data: {
                        supportRequestId: requestId,
                        senderId: supportRequest.alumniProfile.userId,
                        receiverId: supportRequest.requestedByUserId,
                        message: supportRequest.replyMessage,
                    },
                    include: {
                        sender: { select: { id: true, name: true, role: true } },
                    },
                });
                messages = [firstMsg, replyMsg];
            } else {
                messages = [firstMsg];
            }
        }

        res.json(messages);
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ detail: 'Failed to fetch messages' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/alumni-directory/requests/:id/messages
//  Universal chat message endpoint (works for both Student and Alumni)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/requests/:id/messages', requireAuth, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ detail: 'Message cannot be empty' });
        }

        const supportRequest = await prisma.supportRequest.findUnique({
            where: { id: requestId },
            include: { alumniProfile: true },
        });

        if (!supportRequest) {
            return res.status(404).json({ detail: 'Request not found' });
        }

        const currentUserId = parseInt(req.userId);
        const isStudent = currentUserId === supportRequest.requestedByUserId;
        const isAlumni = currentUserId === supportRequest.alumniProfile.userId;

        if (!isStudent && !isAlumni) {
            return res.status(403).json({ detail: 'Not authorized to send messages in this request' });
        }

        const receiverId = isStudent ? supportRequest.alumniProfile.userId : supportRequest.requestedByUserId;

        const newMsg = await prisma.mentorshipMessage.create({
            data: {
                supportRequestId: requestId,
                senderId: currentUserId,
                receiverId,
                message: message.trim(),
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        });

        // Update replyMessage if sent by alumni
        if (isAlumni) {
            await prisma.supportRequest.update({
                where: { id: requestId },
                data: { replyMessage: message.trim() },
            });
        }

        // Broadcast via Socket.IO
        if (req.io) {
            req.io.to(`request_${requestId}`).emit('receive_message', newMsg);
        }

        // Create Notification
        const sender = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { name: true },
        });

        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'NEW_MESSAGE',
                title: `New message from ${sender.name}`,
                message: message.trim(),
                data: JSON.stringify({ requestId: supportRequest.id, senderName: sender.name }),
            },
        });

        res.json({ message: 'Message sent', chatMessage: newMsg });
    } catch (err) {
        console.error('Send chat message error:', err);
        res.status(500).json({ detail: 'Failed to send message' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  PATCH /api/alumni-directory/requests/:id
//  Alumni accepts or declines a request, with optional replyMessage
// ═════════════════════════════════════════════════════════════════════════════
router.patch('/requests/:id', requireAuth, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const { status, replyMessage } = req.body; // ACCEPTED or DECLINED

        if (status && !['ACCEPTED', 'DECLINED'].includes(status)) {
            return res.status(400).json({ detail: 'Status must be ACCEPTED or DECLINED' });
        }

        // Verify the request exists and belongs to this alumni
        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
        });

        if (!profile) {
            return res.status(404).json({ detail: 'Alumni profile not found' });
        }

        const supportRequest = await prisma.supportRequest.findUnique({
            where: { id: requestId },
        });

        if (!supportRequest || supportRequest.alumniProfileId !== profile.id) {
            return res.status(404).json({ detail: 'Request not found' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (replyMessage !== undefined) updateData.replyMessage = replyMessage;

        // Update the request status and reply message
        const updated = await prisma.supportRequest.update({
            where: { id: requestId },
            data: updateData,
        });

        // Save as MentorshipMessage entry so it appears in Live Chat
        if (replyMessage && replyMessage.trim()) {
            const newMsg = await prisma.mentorshipMessage.create({
                data: {
                    supportRequestId: requestId,
                    senderId: parseInt(req.userId),
                    receiverId: supportRequest.requestedByUserId,
                    message: replyMessage.trim(),
                },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                },
            });

            if (req.io) {
                req.io.to(`request_${requestId}`).emit('receive_message', newMsg);
            }
        }

        // Get alumni name for notification
        const alumni = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            select: { name: true },
        });

        if (status) {
            // Send notification to the student
            const notifType = status === 'ACCEPTED' ? 'SUPPORT_ACCEPTED' : 'SUPPORT_DECLINED';
            const notifMessage = status === 'ACCEPTED'
                ? `${alumni.name} has accepted your ${supportRequest.supportType.replace(/_/g, ' ').toLowerCase()} request! ${replyMessage ? `Reply: "${replyMessage}"` : ''}`
                : `${alumni.name} has declined your ${supportRequest.supportType.replace(/_/g, ' ').toLowerCase()} request. ${replyMessage ? `Reply: "${replyMessage}"` : ''}`;

            await prisma.notification.create({
                data: {
                    userId: supportRequest.requestedByUserId,
                    type: notifType,
                    title: status === 'ACCEPTED' ? 'Request Accepted! 🎉' : 'Request Declined',
                    message: notifMessage,
                    data: JSON.stringify({ requestId: supportRequest.id, alumniName: alumni.name, replyMessage }),
                },
            });
        }

        res.json({ message: status ? `Request ${status.toLowerCase()}` : 'Reply saved', request: updated });
    } catch (err) {
        console.error('Update request error:', err);
        res.status(500).json({ detail: 'Failed to update request' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/alumni-directory/requests/:id/reply
//  Alumni sends a direct reply message to an accepted/pending request
// ═════════════════════════════════════════════════════════════════════════════
router.post('/requests/:id/reply', requireAuth, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const { replyMessage } = req.body;

        if (!replyMessage || !replyMessage.trim()) {
            return res.status(400).json({ detail: 'Reply message cannot be empty' });
        }

        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
        });

        if (!profile) {
            return res.status(404).json({ detail: 'Alumni profile not found' });
        }

        const supportRequest = await prisma.supportRequest.findUnique({
            where: { id: requestId },
        });

        if (!supportRequest || supportRequest.alumniProfileId !== profile.id) {
            return res.status(404).json({ detail: 'Request not found' });
        }

        const updated = await prisma.supportRequest.update({
            where: { id: requestId },
            data: { replyMessage: replyMessage.trim() },
        });

        // Save as MentorshipMessage entry so it appears in Live Chat
        const newMsg = await prisma.mentorshipMessage.create({
            data: {
                supportRequestId: requestId,
                senderId: parseInt(req.userId),
                receiverId: supportRequest.requestedByUserId,
                message: replyMessage.trim(),
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        });

        if (req.io) {
            req.io.to(`request_${requestId}`).emit('receive_message', newMsg);
        }

        const alumni = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            select: { name: true },
        });

        await prisma.notification.create({
            data: {
                userId: supportRequest.requestedByUserId,
                type: 'NEW_MESSAGE',
                title: `Message from ${alumni.name}`,
                message: `${alumni.name} replied: "${replyMessage.trim()}"`,
                data: JSON.stringify({ requestId: supportRequest.id, alumniName: alumni.name, replyMessage }),
            },
        });

        res.json({ message: 'Reply sent successfully', request: updated, chatMessage: newMsg });
    } catch (err) {
        console.error('Reply request error:', err);
        res.status(500).json({ detail: 'Failed to send reply' });
    }
});

module.exports = router;
