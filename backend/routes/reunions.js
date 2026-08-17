const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole, requireVerified } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const {
    ACTIVE_VOTING_STATUSES,
    finalizeDueReunions,
    finalizeReunion,
    notifyReunionAnnouncement,
    notifyReunionCreated,
    parseOptions,
    voteCounts,
} = require('../services/reunionService');


const router = express.Router();
const prisma = new PrismaClient();
const MAYBE_DECISION_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const normalizeMoney = (value) => Number(value.toFixed(2));

const getOrganizerUserId = (reunion) => reunion.createdByUserId;

const isReunionOrganizer = (reunion, userId) =>
    getOrganizerUserId(reunion) === Number(userId);

const hasReunionAudienceAccess = (reunion, user) => {
    const profile = user?.alumniProfile;
    if (!profile || profile.graduationYear !== reunion.batch.graduationYear) return false;
    if (isReunionOrganizer(reunion, user.id)) return true;
    if (reunion.audienceType === 'WHOLE_BATCH') return true;
    return reunion.audienceType === 'DEPARTMENT' &&
        profile.department === reunion.targetDepartment;
};

const reunionAudienceProfileFilter = (reunion) => ({
    isVerified: true,
    graduationYear: reunion.batch.graduationYear,
    ...(reunion.audienceType === 'DEPARTMENT'
        ? { department: reunion.targetDepartment }
        : {}),
});

async function expireMaybeAttendance(reunionId) {
    return prisma.reunionAttendance.updateMany({
        where: {
            ...(reunionId ? { reunionId: Number(reunionId) } : {}),
            status: 'MAYBE',
            maybeDeadline: { not: null, lte: new Date() },
        },
        data: {
            status: 'NOT_GOING',
            maybeDeadline: null,
        },
    });
}

async function addOrganizers(reunions) {
    const organizerIds = [...new Set(reunions.map(getOrganizerUserId).filter(Boolean))];
    const organizers = organizerIds.length
        ? await prisma.user.findMany({
            where: { id: { in: organizerIds } },
            select: { id: true, name: true, email: true },
        })
        : [];
    const organizersById = new Map(organizers.map((organizer) => [organizer.id, organizer]));

    return reunions.map((reunion) => ({
        ...reunion,
        organizer: organizersById.get(getOrganizerUserId(reunion)) || null,
    }));
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/reunion-photos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'reunion-photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

router.use(requireAuth, requireRole('ALUMNI'), requireVerified);

router.param('id', async (req, res, next, rawId) => {
    try {
        const reunionId = Number(rawId);
        if (!Number.isInteger(reunionId)) {
            return res.status(400).json({ detail: 'Invalid reunion id' });
        }

        await expireMaybeAttendance(reunionId);

        const [reunion, user] = await Promise.all([
            prisma.reunion.findUnique({
                where: { id: reunionId },
                include: { batch: true },
            }),
            prisma.user.findUnique({
                where: { id: Number(req.userId) },
                include: { alumniProfile: true },
            }),
        ]);

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (!hasReunionAudienceAccess(reunion, user)) {
            return res.status(403).json({ detail: 'This reunion is not available to your batch audience' });
        }

        req.reunionAccess = reunion;
        req.alumniProfile = user.alumniProfile;
        await finalizeReunion(reunionId);
        next();
    } catch (error) {
        console.error('Reunion access check failed:', error);
        res.status(500).json({ detail: 'Unable to verify reunion access' });
    }
});

// ===== REUNION CRUD =====

// Get all reunions for user's batch
router.get('/', requireAuth, async (req, res) => {
    try {
        await expireMaybeAttendance();
        await finalizeDueReunions();

        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            include: { alumniProfile: true }
        });

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        if (user.role !== 'ALUMNI' || !user.alumniProfile) {
            return res.status(400).json({ detail: 'No batch information found' });
        }

        const reunions = await prisma.reunion.findMany({
            where: {
                AND: [
                    {
                        batch: {
                            graduationYear: user.alumniProfile.graduationYear,
                        },
                    },
                    {
                        OR: [
                            { createdByUserId: user.id },
                            { audienceType: 'WHOLE_BATCH' },
                            {
                                audienceType: 'DEPARTMENT',
                                targetDepartment: user.alumniProfile.department,
                            },
                        ],
                    },
                ],
            },
            include: {
                batch: true,
                _count: {
                    select: {
                        dateVotes: true,
                        venueVotes: true,
                        attendance: true,
                        expenses: true,
                        photos: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.json(await addOrganizers(reunions));
    } catch (error) {
        console.error('Get reunions error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Departments represented by verified alumni in the signed-in user's class.
router.get('/audience/departments', requireAuth, async (req, res) => {
    try {
        const currentProfile = await prisma.alumniProfile.findUnique({
            where: { userId: Number(req.userId) },
            select: { graduationYear: true },
        });
        if (!currentProfile) {
            return res.status(400).json({ detail: 'Alumni profile not found' });
        }

        const departments = await prisma.alumniProfile.findMany({
            where: {
                isVerified: true,
                graduationYear: currentProfile.graduationYear,
            },
            distinct: ['department'],
            select: { department: true },
            orderBy: { department: 'asc' },
        });

        res.json({ departments: departments.map(({ department }) => department) });
    } catch (error) {
        console.error('Get reunion departments error:', error);
        res.status(500).json({ detail: 'Unable to load batch departments' });
    }
});

// Get single reunion with full details
router.get('/:id', requireAuth, async (req, res) => {
    try {
        await finalizeReunion(parseInt(req.params.id));

        const reunion = await prisma.reunion.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                batch: {
                    include: {
                        coordinator: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                dateVotes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                venueVotes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                attendance: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                expenses: {
                    include: {
                        paidBy: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                photos: {
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        // Verify user is part of this batch
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            include: { alumniProfile: true }
        });

        if (!hasReunionAudienceAccess(reunion, user)) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        const [reunionWithOrganizer] = await addOrganizers([reunion]);
        const viewerId = Number(req.userId);

        // The general reunion response includes only the viewer's own RSVP.
        // The creator must use the protected attendance-details endpoint below
        // to retrieve batchmate planning notes.
        const visibleAttendance = reunion.attendance.filter(
            (entry) => entry.userId === viewerId
        );

        res.json({
            ...reunionWithOrganizer,
            isOrganizer: isReunionOrganizer(reunion, viewerId),
            attendance: visibleAttendance,
        });
    } catch (error) {
        console.error('Get reunion error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Create a reunion for the signed-in verified alumni's graduation-year batch.
router.post('/', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const {
            title,
            description,
            proposedDates,
            venueOptions,
            votingDeadline,
            audienceType,
            targetDepartment,
        } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            include: { alumniProfile: true }
        });

        if (!user?.alumniProfile) {
            return res.status(400).json({ detail: 'Alumni profile not found' });
        }

        const cleanTitle = String(title || '').trim();
        const cleanDescription = String(description || '').trim();
        const cleanAudienceType = String(audienceType || 'DEPARTMENT').toUpperCase();
        const cleanTargetDepartment = cleanAudienceType === 'DEPARTMENT'
            ? String(targetDepartment || '').trim()
            : null;
        const dates = Array.isArray(proposedDates)
            ? [...new Set(proposedDates.map((value) => String(value).trim()).filter(Boolean))]
            : [];
        const venues = Array.isArray(venueOptions)
            ? venueOptions
                .map((venue) => ({
                    name: String(venue?.name || '').trim(),
                    address: String(venue?.address || '').trim(),
                    mapLink: String(venue?.mapLink || '').trim(),
                }))
                .filter((venue) => venue.name && venue.address)
            : [];
        const normalizedDates = dates.map((date) => new Date(date));
        const deadline = new Date(votingDeadline);

        if (!cleanTitle || !cleanDescription) {
            return res.status(400).json({ detail: 'Title and description are required' });
        }
        if (!['DEPARTMENT', 'WHOLE_BATCH'].includes(cleanAudienceType)) {
            return res.status(400).json({ detail: 'Choose a valid reunion audience' });
        }
        if (cleanAudienceType === 'DEPARTMENT') {
            if (!cleanTargetDepartment) {
                return res.status(400).json({ detail: 'Choose a department for this reunion' });
            }
            const verifiedDepartmentMembers = await prisma.alumniProfile.count({
                where: {
                    isVerified: true,
                    graduationYear: user.alumniProfile.graduationYear,
                    department: cleanTargetDepartment,
                },
            });
            if (!verifiedDepartmentMembers) {
                return res.status(400).json({
                    detail: 'The selected department has no verified alumni in this batch',
                });
            }
        }
        if (normalizedDates.length < 2 || normalizedDates.length > 6 ||
            normalizedDates.some((date) => Number.isNaN(date.getTime()))) {
            return res.status(400).json({ detail: 'Provide 2 to 6 valid reunion date options' });
        }
        if (venues.length < 2 || venues.length > 6) {
            return res.status(400).json({ detail: 'Provide 2 to 6 valid venue options' });
        }
        if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
            return res.status(400).json({ detail: 'Voting deadline must be in the future' });
        }
        if (normalizedDates.some((date) => date <= deadline)) {
            return res.status(400).json({
                detail: 'Voting must close before every proposed reunion date',
            });
        }
        let batch = await prisma.batch.findFirst({
            where: {
                department: user.alumniProfile.department,
                graduationYear: user.alumniProfile.graduationYear,
            }
        });

        if (!batch) {
            batch = await prisma.batch.create({
                data: {
                    department: user.alumniProfile.department,
                    graduationYear: user.alumniProfile.graduationYear,
                    coordinatorUserId: user.id,
                },
            });
        }

        const reunion = await prisma.reunion.create({
            data: {
                batchId: batch.id,
                createdByUserId: user.id,
                audienceType: cleanAudienceType,
                targetDepartment: cleanTargetDepartment,
                title: cleanTitle,
                description: cleanDescription,
                proposedDates: JSON.stringify(normalizedDates.map((date) => date.toISOString())),
                venueOptions: JSON.stringify(venues),
                votingDeadline: deadline,
                status: 'PLANNING',
            },
            include: {
                batch: true
            }
        });

        const notifiedCount = await notifyReunionCreated(reunion);
        res.status(201).json({ ...reunion, notifiedCount });
    } catch (error) {
        console.error('Create reunion error:', error);
        res.status(500).json({ detail: 'Unable to create reunion' });
    }
});

// Update reunion (coordinators only)
router.patch('/:id', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const updates = {};

        // Verify coordinator access
        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (!isReunionOrganizer(reunion, req.userId)) {
            return res.status(403).json({ detail: 'Only the reunion creator can update it' });
        }

        if (reunion.finalizedAt || reunion.status === 'CONFIRMED') {
            return res.status(400).json({ detail: 'A confirmed reunion cannot be edited' });
        }

        if (typeof req.body.title === 'string' && req.body.title.trim()) {
            updates.title = req.body.title.trim();
        }
        if (typeof req.body.description === 'string') {
            updates.description = req.body.description.trim();
        }
        if (Array.isArray(req.body.proposedDates)) {
            updates.proposedDates = JSON.stringify(req.body.proposedDates);
        }
        if (Array.isArray(req.body.venueOptions)) {
            updates.venueOptions = JSON.stringify(req.body.venueOptions);
        }
        const updatedReunion = await prisma.reunion.update({
            where: { id: reunionId },
            data: updates,
            include: {
                batch: true
            }
        });

        res.json(updatedReunion);
    } catch (error) {
        console.error('Update reunion error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Delete a reunion and its related votes, attendance, expenses, photos, and
// announcements. Only the alumni who created the reunion may delete it.
router.delete('/:id', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const reunion = req.reunionAccess;

        if (!isReunionOrganizer(reunion, req.userId)) {
            return res.status(403).json({
                detail: 'Only the reunion creator can delete this reunion',
            });
        }

        await prisma.$transaction([
            prisma.notification.deleteMany({
                where: { data: { contains: `"reunionId":${reunionId}` } },
            }),
            prisma.reunion.delete({ where: { id: reunionId } }),
        ]);

        res.json({ message: 'Reunion deleted successfully', reunionId });
    } catch (error) {
        console.error('Delete reunion error:', error);
        res.status(500).json({ detail: 'Unable to delete the reunion' });
    }
});

// ===== DATE VOTING =====

// Vote for a date
router.post('/:id/dates/vote', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { chosenOptionIndex } = req.body;
        const userId = parseInt(req.userId);

        // Verify reunion exists and user has access
        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        const options = parseOptions(reunion.proposedDates);
        if (!ACTIVE_VOTING_STATUSES.includes(reunion.status) ||
            (reunion.votingDeadline && reunion.votingDeadline <= new Date())) {
            return res.status(400).json({ detail: 'Date voting is closed' });
        }
        if (!Number.isInteger(chosenOptionIndex) ||
            chosenOptionIndex < 0 ||
            chosenOptionIndex >= options.length) {
            return res.status(400).json({ detail: 'Invalid date option' });
        }

        // Upsert vote
        const vote = await prisma.reunionDateVote.upsert({
            where: {
                reunionId_userId: {
                    reunionId,
                    userId
                }
            },
            update: { chosenOptionIndex },
            create: {
                reunionId,
                userId,
                chosenOptionIndex
            }
        });

        res.json({ success: true, vote });
    } catch (error) {
        console.error('Date vote error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get date vote counts
router.get('/:id/dates/votes', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);

        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            select: { proposedDates: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        const votes = await prisma.reunionDateVote.findMany({
            where: { reunionId },
            select: { chosenOptionIndex: true }
        });

        const proposedDates = parseOptions(reunion.proposedDates);
        const counts = voteCounts(proposedDates.length, votes);
        const results = counts.map((count, optionIndex) => ({ optionIndex, count }));

        const totalVotes = votes.length;

        res.json({ voteCounts: results, totalVotes });
    } catch (error) {
        console.error('Get date votes error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Legacy finalize endpoint: results are calculated automatically at the deadline.
router.post('/:id/dates/finalize', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const reunion = await finalizeReunion(reunionId);
        if (!reunion?.finalizedAt) {
            return res.status(400).json({
                detail: 'Voting is still open. Date and venue are finalized automatically at the deadline.',
            });
        }
        res.json(reunion);
    } catch (error) {
        console.error('Finalize date error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// ===== VENUE VOTING =====

// Vote for a venue
router.post('/:id/venues/vote', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { chosenOptionIndex } = req.body;
        const userId = parseInt(req.userId);

        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        const options = parseOptions(reunion.venueOptions);
        if (!ACTIVE_VOTING_STATUSES.includes(reunion.status) ||
            (reunion.votingDeadline && reunion.votingDeadline <= new Date())) {
            return res.status(400).json({ detail: 'Venue voting is closed' });
        }
        if (!Number.isInteger(chosenOptionIndex) ||
            chosenOptionIndex < 0 ||
            chosenOptionIndex >= options.length) {
            return res.status(400).json({ detail: 'Invalid venue option' });
        }

        const vote = await prisma.reunionVenueVote.upsert({
            where: {
                reunionId_userId: {
                    reunionId,
                    userId
                }
            },
            update: { chosenOptionIndex },
            create: {
                reunionId,
                userId,
                chosenOptionIndex
            }
        });

        res.json({ success: true, vote });
    } catch (error) {
        console.error('Venue vote error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get venue vote counts
router.get('/:id/venues/votes', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);

        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            select: { venueOptions: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        const votes = await prisma.reunionVenueVote.findMany({
            where: { reunionId },
            select: { chosenOptionIndex: true }
        });

        const venueOptions = parseOptions(reunion.venueOptions);
        const counts = voteCounts(venueOptions.length, votes);
        const results = counts.map((count, optionIndex) => ({ optionIndex, count }));

        const totalVotes = votes.length;

        res.json({ voteCounts: results, totalVotes });
    } catch (error) {
        console.error('Get venue votes error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Legacy finalize endpoint: results are calculated automatically at the deadline.
router.post('/:id/venues/finalize', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const reunion = await finalizeReunion(reunionId);
        if (!reunion?.finalizedAt) {
            return res.status(400).json({
                detail: 'Voting is still open. Date and venue are finalized automatically at the deadline.',
            });
        }
        res.json(reunion);
    } catch (error) {
        console.error('Finalize venue error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Allow the organizer to trigger the same automatic finalization after the deadline.
router.post('/:id/finalize', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true },
        });

        const userId = parseInt(req.userId);
        if (!isReunionOrganizer(reunion, userId)) {
            return res.status(403).json({
                detail: 'Only the reunion creator can close voting',
            });
        }

        if (!reunion.votingDeadline || reunion.votingDeadline > new Date()) {
            return res.status(400).json({
                detail: 'Voting remains open until the configured deadline',
            });
        }

        const finalized = await finalizeReunion(reunionId);
        res.json(finalized);
    } catch (error) {
        console.error('Finalize reunion error:', error);
        res.status(500).json({ detail: 'Unable to finalize reunion voting' });
    }
});

// ===== ATTENDANCE =====

// Update attendance status
router.post('/:id/attendance', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const userId = parseInt(req.userId);
        const { status, accommodationNeeded, dietaryNotes } = req.body;

        if (!['GOING', 'MAYBE', 'NOT_GOING'].includes(status)) {
            return res.status(400).json({ detail: 'Invalid attendance status' });
        }

        const acceptsPlanningDetails = status !== 'NOT_GOING';
        const cleanDietaryNotes = acceptsPlanningDetails
            ? String(dietaryNotes || '').trim().slice(0, 500) || null
            : null;
        const needsAccommodation = acceptsPlanningDetails && Boolean(accommodationNeeded);
        const existingAttendance = await prisma.reunionAttendance.findUnique({
            where: { reunionId_userId: { reunionId, userId } },
            select: { status: true, maybeDeadline: true },
        });
        const maybeDeadline = status === 'MAYBE'
            ? (existingAttendance?.status === 'MAYBE' && existingAttendance.maybeDeadline
                ? existingAttendance.maybeDeadline
                : new Date(Date.now() + MAYBE_DECISION_WINDOW_MS))
            : null;
        const respondedAt = new Date();

        const attendance = await prisma.reunionAttendance.upsert({
            where: {
                reunionId_userId: {
                    reunionId,
                    userId
                }
            },
            update: {
                status,
                accommodationNeeded: needsAccommodation,
                dietaryNotes: cleanDietaryNotes,
                maybeDeadline,
                respondedAt,
            },
            create: {
                reunionId,
                userId,
                status,
                accommodationNeeded: needsAccommodation,
                dietaryNotes: cleanDietaryNotes,
                maybeDeadline,
                respondedAt,
            }
        });

        res.json(attendance);
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get private RSVP details. Only the user who created this reunion may read
// batchmates' accommodation requirements and planning notes.
router.get('/:id/attendance/details', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const reunion = req.reunionAccess;

        if (!isReunionOrganizer(reunion, req.userId)) {
            return res.status(403).json({
                detail: 'Only the reunion creator can view batchmate attendance notes',
            });
        }

        const attendance = await prisma.reunionAttendance.findMany({
            where: { reunionId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        res.json(attendance);
    } catch (error) {
        console.error('Get organizer attendance details error:', error);
        res.status(500).json({ detail: 'Unable to load attendance details' });
    }
});

// Get attendance summary
router.get('/:id/attendance/summary', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);

        const [attendance, eligibleAlumni] = await Promise.all([
            prisma.reunionAttendance.findMany({
                where: { reunionId }
            }),
            prisma.user.count({
                where: {
                    role: 'ALUMNI',
                    alumniProfile: {
                        is: reunionAudienceProfileFilter(req.reunionAccess),
                    },
                },
            }),
        ]);

        const totalResponses = attendance.length;
        const going = attendance.filter(a => a.status === 'GOING').length;
        const maybe = attendance.filter(a => a.status === 'MAYBE').length;
        const notGoing = attendance.filter(a => a.status === 'NOT_GOING').length;

        const summary = {
            going,
            maybe,
            notGoing,
            accommodationNeeded: attendance.filter(a => a.accommodationNeeded).length,
            totalResponses,
            eligibleAlumni,
            responseRate: eligibleAlumni
                ? Math.round((totalResponses / eligibleAlumni) * 100)
                : 0,
            potentialAttendees: going + maybe,
        };

        res.json(summary);
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// ===== EXPENSES =====

// List confirmed attendees who can be included in an expense split. This
// deliberately exposes no private attendance notes or accommodation details.
router.get('/:id/expenses/candidates', requireAuth, async (req, res) => {
    try {
        const attendance = await prisma.reunionAttendance.findMany({
            where: {
                reunionId: parseInt(req.params.id),
                status: 'GOING',
            },
            select: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        res.json({ candidates: attendance.map(({ user }) => user) });
    } catch (error) {
        console.error('Get expense candidates error:', error);
        res.status(500).json({ detail: 'Unable to load expense candidates' });
    }
});

// Add expense
router.post('/:id/expenses', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { title, amount, paidByUserId, splitBetweenUserIds } = req.body;
        const payerId = paidByUserId ? parseInt(paidByUserId) : parseInt(req.userId);
        const cleanTitle = String(title || '').trim();
        const parsedAmount = Number(amount);
        const totalCents = Math.round(parsedAmount * 100);
        const requestedParticipantIds = Array.isArray(splitBetweenUserIds)
            ? [...new Set(splitBetweenUserIds.map(Number).filter(Number.isInteger))]
            : [];

        if (!cleanTitle || !Number.isFinite(parsedAmount) || totalCents < 1) {
            return res.status(400).json({ detail: 'Enter a valid expense title and amount' });
        }
        if (!requestedParticipantIds.length) {
            return res.status(400).json({ detail: 'Select at least one going attendee' });
        }
        if (totalCents < requestedParticipantIds.length) {
            return res.status(400).json({
                detail: 'The expense must provide at least ₹0.01 per selected attendee',
            });
        }

        const goingAttendance = await prisma.reunionAttendance.findMany({
            where: {
                reunionId,
                status: 'GOING',
                userId: { in: [...new Set([...requestedParticipantIds, payerId])] },
            },
            select: { userId: true },
        });
        const goingUserIds = new Set(goingAttendance.map(({ userId }) => userId));

        if (!goingUserIds.has(payerId)) {
            return res.status(400).json({ detail: 'The payer must be a going attendee' });
        }
        if (requestedParticipantIds.some((userId) => !goingUserIds.has(userId))) {
            return res.status(400).json({ detail: 'Expenses can only be split between going attendees' });
        }

        const result = await prisma.$transaction(async (transaction) => {
            const createdExpense = await transaction.reunionExpense.create({
                data: {
                    reunionId,
                    title: cleanTitle,
                    amount: totalCents / 100,
                    paidByUserId: payerId,
                    splitBetweenUserIds: JSON.stringify(requestedParticipantIds),
                },
            });
            const baseShareCents = Math.floor(totalCents / requestedParticipantIds.length);
            const extraCentCount = totalCents % requestedParticipantIds.length;
            const shareRows = requestedParticipantIds.map((userId, index) => ({
                expenseId: createdExpense.id,
                userId,
                amount: (baseShareCents + (index < extraCentCount ? 1 : 0)) / 100,
                status: userId === payerId ? 'PAID' : 'PENDING',
                paidAt: userId === payerId ? new Date() : null,
            }));
            await transaction.reunionExpenseShare.createMany({
                data: shareRows,
            });

            const expense = await transaction.reunionExpense.findUnique({
                where: { id: createdExpense.id },
                include: {
                    paidBy: { select: { id: true, name: true } },
                    shares: {
                        include: { user: { select: { id: true, name: true } } },
                        orderBy: { id: 'asc' },
                    },
                },
            });

            const recipientIds = requestedParticipantIds.filter((userId) => userId !== payerId);
            if (recipientIds.length) {
                await transaction.notification.createMany({
                    data: recipientIds.map((userId) => ({
                        userId,
                        type: 'EXPENSE_REQUEST',
                        title: `Expense request: ${cleanTitle}`,
                        message: `${expense.paidBy.name} added a reunion expense. Your share is ₹${shareRows.find((share) => share.userId === userId).amount.toFixed(2)}.`,
                        data: JSON.stringify({ reunionId, expenseId: expense.id }),
                    })),
                });
            }

            return { expense, notifiedCount: recipientIds.length };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get expense calculations
router.get('/:id/expenses/calculations', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const userId = parseInt(req.userId);

        const expenses = await prisma.reunionExpense.findMany({
            where: { reunionId },
            include: {
                paidBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                shares: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                    orderBy: { id: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate only unsettled balances. A payer's own share is recorded as
        // paid at creation and never inflates the amount they are owed.
        const balances = {};
        let totalRequested = 0;
        let totalPaid = 0;
        let totalPending = 0;

        expenses.forEach(expense => {
            expense.shares.forEach((share) => {
                totalRequested += share.amount;
                if (share.status === 'PAID') {
                    totalPaid += share.amount;
                    return;
                }

                totalPending += share.amount;
                if (share.userId !== expense.paidByUserId) {
                    balances[expense.paidByUserId] =
                        (balances[expense.paidByUserId] || 0) + share.amount;
                    balances[share.userId] = (balances[share.userId] || 0) - share.amount;
                }
            });
        });

        Object.keys(balances).forEach((balanceUserId) => {
            balances[balanceUserId] = normalizeMoney(balances[balanceUserId]);
        });
        totalRequested = normalizeMoney(totalRequested);
        totalPaid = normalizeMoney(totalPaid);
        totalPending = normalizeMoney(totalPending);

        const userBalance = balances[userId] || 0;

        res.json({
            expenses,
            userBalance,
            balances,
            totals: { totalRequested, totalPaid, totalPending },
        });
    } catch (error) {
        console.error('Get expense calculations error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Participants can update their own share; the payer and reunion organizer can
// also confirm payments for efficient reconciliation.
router.patch('/:id/expenses/:expenseId/shares/:shareId', requireAuth, async (req, res) => {
    try {
        const reunionId = Number(req.params.id);
        const expenseId = Number(req.params.expenseId);
        const shareId = Number(req.params.shareId);
        const status = String(req.body.status || '').toUpperCase();

        if (!['PENDING', 'PAID'].includes(status)) {
            return res.status(400).json({ detail: 'Expense share status must be pending or paid' });
        }

        const share = await prisma.reunionExpenseShare.findUnique({
            where: { id: shareId },
            include: {
                expense: {
                    include: { paidBy: { select: { id: true, name: true } } },
                },
                user: { select: { id: true, name: true } },
            },
        });

        if (!share || share.expenseId !== expenseId || share.expense.reunionId !== reunionId) {
            return res.status(404).json({ detail: 'Expense share not found' });
        }
        if (share.userId === share.expense.paidByUserId && status === 'PENDING') {
            return res.status(400).json({ detail: 'The payer\'s own share is already settled' });
        }

        const userId = Number(req.userId);
        const canManage = share.userId === userId ||
            share.expense.paidByUserId === userId ||
            isReunionOrganizer(req.reunionAccess, userId);
        if (!canManage) {
            return res.status(403).json({ detail: 'You cannot update this expense share' });
        }

        const updatedShare = await prisma.reunionExpenseShare.update({
            where: { id: shareId },
            data: {
                status,
                paidAt: status === 'PAID' ? new Date() : null,
            },
            include: { user: { select: { id: true, name: true } } },
        });

        if (status === 'PAID' && userId !== share.expense.paidByUserId) {
            await prisma.notification.create({
                data: {
                    userId: share.expense.paidByUserId,
                    type: 'EXPENSE_PAID',
                    title: 'Expense share marked paid',
                    message: `${share.user.name} marked ₹${share.amount.toFixed(2)} as paid for ${share.expense.title}.`,
                    data: JSON.stringify({ reunionId, expenseId, shareId }),
                },
            });
        }

        res.json(updatedShare);
    } catch (error) {
        console.error('Update expense share error:', error);
        res.status(500).json({ detail: 'Unable to update expense share' });
    }
});

// ===== PHOTOS =====

// Upload photo
router.post('/:id/photos', requireAuth, upload.single('photo'), async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const userId = parseInt(req.userId);
        const { caption } = req.body;

        if (!req.file) {
            return res.status(400).json({ detail: 'No photo uploaded' });
        }

        const photoUrl = `/uploads/reunion-photos/${req.file.filename}`;

        const photo = await prisma.reunionPhoto.create({
            data: {
                reunionId,
                uploadedByUserId: userId,
                photoUrl,
                caption: caption || null
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json(photo);
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// ===== ANNOUNCEMENTS =====

// Create an announcement for a reunion and notify its verified batch.
router.post('/:id/announcements', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { title, body } = req.body;
        const userId = parseInt(req.userId);

        if (!title?.trim() || !body?.trim()) {
            return res.status(400).json({ detail: 'Title and body are required' });
        }

        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (!isReunionOrganizer(reunion, userId)) {
            return res.status(403).json({ detail: 'Only the reunion creator can post announcements' });
        }

        const announcement = await prisma.announcement.create({
            data: {
                reunionId,
                batchId: reunion.batchId,
                authorUserId: userId,
                title: title.trim(),
                body: body.trim()
            },
            include: {
                author: {
                    select: { id: true, name: true }
                }
            }
        });

        const notifiedCount = await notifyReunionAnnouncement(reunion, announcement);
        res.status(201).json({ ...announcement, notifiedCount });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get announcements for a reunion
router.get('/:id/announcements', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const userId = parseInt(req.userId);

        const announcements = await prisma.announcement.findMany({
            where: { reunionId },
            include: {
                author: {
                    select: { id: true, name: true }
                },
                reads: {
                    where: { userId },
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Add isNew flag
        const result = announcements.map(a => ({
            ...a,
            isNew: a.reads.length === 0 && a.authorUserId !== userId,
            reads: undefined
        }));

        res.json(result);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Mark announcement as read
router.post('/:id/announcements/:announcementId/read', requireAuth, async (req, res) => {
    try {
        const announcementId = parseInt(req.params.announcementId);
        const userId = parseInt(req.userId);

        await prisma.announcementRead.upsert({
            where: {
                announcementId_userId: {
                    announcementId,
                    userId
                }
            },
            update: {},
            create: {
                announcementId,
                userId
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark announcement read error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get user's upcoming reunions (for dashboard countdown)
router.get('/upcoming/my', requireAuth, async (req, res) => {
    try {
        await expireMaybeAttendance();
        await finalizeDueReunions();
        const userId = parseInt(req.userId);

        const attendances = await prisma.reunionAttendance.findMany({
            where: {
                userId,
                status: { in: ['GOING', 'MAYBE'] }
            },
            include: {
                reunion: {
                    include: { batch: true }
                }
            }
        });

        const now = new Date();
        const upcoming = attendances
            .filter(a => a.reunion.finalDate && new Date(a.reunion.finalDate) > now)
            .map(a => a.reunion)
            .sort((a, b) => new Date(a.finalDate) - new Date(b.finalDate));

        res.json(upcoming);
    } catch (error) {
        console.error('Get upcoming reunions error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

module.exports = router;
