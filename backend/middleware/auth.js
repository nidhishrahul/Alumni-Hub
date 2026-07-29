const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'alumniconnect-jwt-secret-change-in-production';

/**
 * Middleware: Verify JWT and attach req.user (with alumniProfile if applicable)
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    } catch {
        return res.status(401).json({ detail: 'Invalid or expired token' });
    }
}

/**
 * Middleware: Load full user object onto req.user (call after requireAuth)
 */
async function loadUser(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId) },
            include: {
                alumniProfile: {
                    select: {
                        id: true,
                        isVerified: true,
                        verificationStatus: true,
                        registerNumber: true,
                        graduationYear: true,
                        department: true,
                        degree: true,
                        currentCompany: true,
                        currentDesignation: true,
                        location: true,
                        linkedinUrl: true,
                        bio: true,
                        skills: true,
                        interests: true,
                    },
                },
            },
        });
        if (!user) return res.status(401).json({ detail: 'User not found' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ detail: 'Server error' });
    }
}

/**
 * Middleware factory: Restrict to specific roles
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ detail: 'Insufficient permissions' });
        }
        next();
    };
}

/**
 * Middleware: Require alumni to be verified
 */
async function requireVerified(req, res, next) {
    if (req.userRole !== 'ALUMNI') return next(); // non-alumni pass through

    try {
        const profile = await prisma.alumniProfile.findUnique({
            where: { userId: parseInt(req.userId) },
        });
        if (!profile || !profile.isVerified) {
            return res.status(403).json({ detail: 'Alumni profile not verified' });
        }
        next();
    } catch {
        return res.status(500).json({ detail: 'Server error' });
    }
}

module.exports = { requireAuth, loadUser, requireRole, requireVerified, prisma, JWT_SECRET };
