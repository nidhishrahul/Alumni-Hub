require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authRoutes = require('./routes/auth');
const reunionRoutes = require('./routes/reunions');
const verificationRoutes = require('./routes/verification');
const notificationRoutes = require('./routes/notifications');
const alumniDirectoryRoutes = require('./routes/alumni-directory');
// ADDED FOR VERIFICATION FEATURE
const aiVerificationRoutes = require('./routes/ai-verification');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
    },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Pass io object to request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reunions', reunionRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/alumni-directory', alumniDirectoryRoutes);
// ADDED FOR VERIFICATION FEATURE
app.use('/api/ai-verification', aiVerificationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', service: 'AlumniConnect Express API + Socket.IO' });
});

// ═════════════════════════════════════════════════════════════════════════════
//  SOCKET.IO REAL-TIME TWO-WAY MESSAGING
// ═════════════════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    // Join specific mentorship request conversation room
    socket.on('join_room', ({ requestId }) => {
        const room = `request_${requestId}`;
        socket.join(room);
        console.log(`👤 Socket ${socket.id} joined room ${room}`);
    });

    // Leave room
    socket.on('leave_room', ({ requestId }) => {
        const room = `request_${requestId}`;
        socket.leave(room);
        console.log(`👤 Socket ${socket.id} left room ${room}`);
    });

    // Real-time message dispatch
    socket.on('send_message', async (data) => {
        try {
            const { requestId, senderId, receiverId, message } = data;
            if (!requestId || !senderId || !message || !message.trim()) return;

            const reqIdNum = parseInt(requestId);
            const senderIdNum = parseInt(senderId);

            // Lookup support request to ensure correct target receiver ID
            const supportReq = await prisma.supportRequest.findUnique({
                where: { id: reqIdNum },
                include: { alumniProfile: true },
            });

            if (!supportReq) return;

            let actualReceiverId = receiverId ? parseInt(receiverId) : null;
            if (!actualReceiverId) {
                actualReceiverId = senderIdNum === supportReq.requestedByUserId
                    ? supportReq.alumniProfile.userId
                    : supportReq.requestedByUserId;
            }

            // Save message to SQLite database via Prisma
            const savedMessage = await prisma.mentorshipMessage.create({
                data: {
                    supportRequestId: reqIdNum,
                    senderId: senderIdNum,
                    receiverId: actualReceiverId,
                    message: message.trim(),
                },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                },
            });

            // Also update replyMessage on SupportRequest if sent by alumni
            if (savedMessage.sender.role === 'ALUMNI') {
                await prisma.supportRequest.update({
                    where: { id: reqIdNum },
                    data: { replyMessage: message.trim() },
                });
            }

            const room = `request_${reqIdNum}`;
            // Broadcast live message to all clients in room
            io.to(room).emit('receive_message', savedMessage);

            // Also create a notification for receiver
            if (actualReceiverId) {
                await prisma.notification.create({
                    data: {
                        userId: actualReceiverId,
                        type: 'NEW_MESSAGE',
                        title: `New message from ${savedMessage.sender.name}`,
                        message: message.trim(),
                        data: JSON.stringify({ requestId: reqIdNum }),
                    },
                });
            }
        } catch (err) {
            console.error('Socket message handler error:', err);
            socket.emit('error_message', { detail: 'Failed to process real-time message' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ WebSocket client disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 AlumniConnect Express + Socket.IO running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
