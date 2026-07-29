const express = require('express');
const { requireAuth, prisma } = require('../middleware/auth');

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/notifications
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', requireAuth, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: parseInt(req.userId) },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: parseInt(req.userId), isRead: false },
        });

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error('Notifications error:', err);
        res.status(500).json({ detail: 'Failed to get notifications' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/notifications/:id/read
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/read', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const notification = await prisma.notification.findUnique({ where: { id } });

        if (!notification || notification.userId !== parseInt(req.userId)) {
            return res.status(404).json({ detail: 'Notification not found' });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ detail: 'Failed to mark notification as read' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/notifications/read-all
// ═════════════════════════════════════════════════════════════════════════════
router.post('/read-all', requireAuth, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: parseInt(req.userId), isRead: false },
            data: { isRead: true },
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark all read error:', err);
        res.status(500).json({ detail: 'Failed to mark all notifications as read' });
    }
});

module.exports = router;
