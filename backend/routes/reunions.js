const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole, requireVerified } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

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

// ===== REUNION CRUD =====

// Get all reunions for user's batch
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            include: { alumniProfile: true }
        });

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Get user's batch info
        let batchQuery = {};
        if (user.role === 'ALUMNI' && user.alumniProfile) {
            batchQuery = {
                department: user.alumniProfile.department,
                graduationYear: user.alumniProfile.graduationYear
            };
        } else {
            return res.status(400).json({ detail: 'No batch information found' });
        }

        const batch = await prisma.batch.findFirst({
            where: batchQuery,
            include: {
                reunions: {
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
                }
            }
        });

        const reunions = batch?.reunions || [];
        res.json(reunions);
    } catch (error) {
        console.error('Get reunions error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get single reunion with full details
router.get('/:id', requireAuth, async (req, res) => {
    try {
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

        if (!user?.alumniProfile ||
            user.alumniProfile.department !== reunion.batch.department ||
            user.alumniProfile.graduationYear !== reunion.batch.graduationYear) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        res.json(reunion);
    } catch (error) {
        console.error('Get reunion error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Create new reunion (coordinators only)
router.post('/', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const { title, description, proposedDates, venueOptions } = req.body;

        // Verify user is coordinator of their batch
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            include: { alumniProfile: true }
        });

        if (!user?.alumniProfile) {
            return res.status(400).json({ detail: 'Alumni profile not found' });
        }

        const batch = await prisma.batch.findFirst({
            where: {
                department: user.alumniProfile.department,
                graduationYear: user.alumniProfile.graduationYear,
                coordinatorUserId: user.id
            }
        });

        if (!batch) {
            return res.status(403).json({ detail: 'You are not a coordinator for this batch' });
        }

        const reunion = await prisma.reunion.create({
            data: {
                batchId: batch.id,
                title,
                description: description || '',
                proposedDates: JSON.stringify(proposedDates),
                venueOptions: JSON.stringify(venueOptions),
                status: 'PLANNING'
            },
            include: {
                batch: true
            }
        });

        res.status(201).json(reunion);
    } catch (error) {
        console.error('Create reunion error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Update reunion (coordinators only)
router.patch('/:id', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const updates = req.body;

        // Verify coordinator access
        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (reunion.batch.coordinatorUserId !== parseInt(req.userId)) {
            return res.status(403).json({ detail: 'Only batch coordinator can update reunion' });
        }

        // Handle JSON fields
        if (updates.proposedDates) {
            updates.proposedDates = JSON.stringify(updates.proposedDates);
        }
        if (updates.venueOptions) {
            updates.venueOptions = JSON.stringify(updates.venueOptions);
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

        if (reunion.status !== 'PLANNING') {
            return res.status(400).json({ detail: 'Date voting is closed' });
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

        const proposedDates = JSON.parse(reunion.proposedDates);
        const voteCounts = proposedDates.map((_, index) => ({
            optionIndex: index,
            count: votes.filter(v => v.chosenOptionIndex === index).length
        }));

        const totalVotes = votes.length;

        res.json({ voteCounts, totalVotes });
    } catch (error) {
        console.error('Get date votes error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Finalize date (coordinator only)
router.post('/:id/dates/finalize', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { winningDateIndex } = req.body;

        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (reunion.batch.coordinatorUserId !== parseInt(req.userId)) {
            return res.status(403).json({ detail: 'Only batch coordinator can finalize date' });
        }

        const proposedDates = JSON.parse(reunion.proposedDates);
        const finalDate = proposedDates[winningDateIndex];

        const updatedReunion = await prisma.reunion.update({
            where: { id: reunionId },
            data: {
                finalDate: new Date(finalDate),
                status: 'VENUE_VOTING',
                countdownTargetDate: new Date(finalDate)
            }
        });

        res.json(updatedReunion);
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

        if (reunion.status !== 'VENUE_VOTING') {
            return res.status(400).json({ detail: 'Venue voting is not available' });
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

        const venueOptions = JSON.parse(reunion.venueOptions);
        const voteCounts = venueOptions.map((_, index) => ({
            optionIndex: index,
            count: votes.filter(v => v.chosenOptionIndex === index).length
        }));

        const totalVotes = votes.length;

        res.json({ voteCounts, totalVotes });
    } catch (error) {
        console.error('Get venue votes error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Finalize venue (coordinator only)
router.post('/:id/venues/finalize', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { winningVenueIndex } = req.body;

        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (reunion.batch.coordinatorUserId !== parseInt(req.userId)) {
            return res.status(403).json({ detail: 'Only batch coordinator can finalize venue' });
        }

        const venueOptions = JSON.parse(reunion.venueOptions);
        const finalVenue = JSON.stringify(venueOptions[winningVenueIndex]);

        const updatedReunion = await prisma.reunion.update({
            where: { id: reunionId },
            data: {
                finalVenue,
                status: 'CONFIRMED'
            }
        });

        res.json(updatedReunion);
    } catch (error) {
        console.error('Finalize venue error:', error);
        res.status(500).json({ detail: 'Server error' });
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

        const attendance = await prisma.reunionAttendance.upsert({
            where: {
                reunionId_userId: {
                    reunionId,
                    userId
                }
            },
            update: {
                status,
                accommodationNeeded: accommodationNeeded || false,
                dietaryNotes: dietaryNotes || null
            },
            create: {
                reunionId,
                userId,
                status,
                accommodationNeeded: accommodationNeeded || false,
                dietaryNotes: dietaryNotes || null
            }
        });

        res.json(attendance);
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// Get attendance summary
router.get('/:id/attendance/summary', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);

        const attendance = await prisma.reunionAttendance.findMany({
            where: { reunionId }
        });

        const summary = {
            going: attendance.filter(a => a.status === 'GOING').length,
            maybe: attendance.filter(a => a.status === 'MAYBE').length,
            notGoing: attendance.filter(a => a.status === 'NOT_GOING').length,
            accommodationNeeded: attendance.filter(a => a.accommodationNeeded).length
        };

        res.json(summary);
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
});

// ===== EXPENSES =====

// Add expense
router.post('/:id/expenses', requireAuth, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { title, amount, paidByUserId, splitBetweenUserIds } = req.body;
        const payerId = paidByUserId ? parseInt(paidByUserId) : parseInt(req.userId);

        if (!title || amount <= 0) {
            return res.status(400).json({ detail: 'Invalid expense data' });
        }

        const expense = await prisma.reunionExpense.create({
            data: {
                reunionId,
                title,
                amount: parseFloat(amount),
                paidByUserId: payerId,
                splitBetweenUserIds: JSON.stringify(splitBetweenUserIds || [])
            },
            include: {
                paidBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json(expense);
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
                }
            }
        });

        // Calculate what each person owes/is owed
        const balances = {};

        expenses.forEach(expense => {
            const splitBetween = JSON.parse(expense.splitBetweenUserIds);
            if (splitBetween.length === 0) return;
            const amountPerPerson = expense.amount / splitBetween.length;

            // Person who paid gets credited
            balances[expense.paidByUserId] = (balances[expense.paidByUserId] || 0) + expense.amount;

            // Each person in split owes their share
            splitBetween.forEach(personId => {
                balances[personId] = (balances[personId] || 0) - amountPerPerson;
            });
        });

        const userBalance = balances[userId] || 0;

        res.json({
            expenses,
            userBalance,
            balances
        });
    } catch (error) {
        console.error('Get expense calculations error:', error);
        res.status(500).json({ detail: 'Server error' });
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

// Create announcement for a reunion (coordinator only)
router.post('/:id/announcements', requireAuth, requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const reunionId = parseInt(req.params.id);
        const { title, body } = req.body;
        const userId = parseInt(req.userId);

        if (!title?.trim() || !body?.trim()) {
            return res.status(400).json({ detail: 'Title and body are required' });
        }

        // Verify coordinator access
        const reunion = await prisma.reunion.findUnique({
            where: { id: reunionId },
            include: { batch: true }
        });

        if (!reunion) {
            return res.status(404).json({ detail: 'Reunion not found' });
        }

        if (reunion.batch.coordinatorUserId !== userId) {
            return res.status(403).json({ detail: 'Only batch coordinator can post announcements' });
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

        res.status(201).json(announcement);
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