const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prisma, JWT_SECRET, requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();
const USER_ROLES = new Set(['STUDENT', 'ALUMNI', 'FACULTY']);
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function createToken(user) {
    return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}

function publicUser(user) {
    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return safeUser;
}

function authResponse(user) {
    return {
        access_token: createToken(user),
        token_type: 'bearer',
        user: publicUser(user),
    };
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

// Create an account. The selected role is stored once and checked at login.
router.post('/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            registerNumber,
            graduationYear,
            department,
            degree,
        } = req.body || {};

        const normalizedEmail = normalizeEmail(email);
        const normalizedRole = String(role || 'STUDENT').toUpperCase();

        if (!String(name || '').trim() || !normalizedEmail || !validatePassword(password)) {
            return res.status(400).json({ detail: 'Name, a valid email, and a password of at least 6 characters are required.' });
        }
        if (!USER_ROLES.has(normalizedRole)) {
            return res.status(400).json({ detail: 'Choose Student, Alumni, or Faculty.' });
        }
        if (normalizedRole === 'ALUMNI' && (!graduationYear || !department || !degree)) {
            return res.status(400).json({ detail: 'Graduation year, department, and degree are required for alumni.' });
        }

        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(409).json({ detail: 'An account already exists for this email. Please sign in or reset your password.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name: String(name).trim(),
                email: normalizedEmail,
                passwordHash,
                role: normalizedRole,
                phone: String(phone || '').trim() || null,
                ...(normalizedRole === 'ALUMNI' ? {
                    alumniProfile: {
                        create: {
                            registerNumber: String(registerNumber || '').trim() || null,
                            graduationYear: Number(graduationYear),
                            department: String(department).trim(),
                            degree: String(degree).trim(),
                            verificationStatus: 'PENDING',
                            isVerified: false,
                        },
                    },
                } : {}),
            },
            include: { alumniProfile: true },
        });

        return res.status(201).json(authResponse(user));
    } catch (error) {
        console.error('Authentication registration error:', error);
        return res.status(500).json({ detail: 'Unable to create the account. Please try again.' });
    }
});

// Sign in with credentials and the role selected in the UI.
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const selectedRole = String(role || '').toUpperCase();

        if (!normalizedEmail || typeof password !== 'string' || !USER_ROLES.has(selectedRole)) {
            return res.status(400).json({ detail: 'Enter your email, password, and account role.' });
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { alumniProfile: true },
        });

        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            return res.status(401).json({ detail: 'The email or password is incorrect.' });
        }
        if (user.role !== selectedRole) {
            return res.status(403).json({ detail: `This account is registered as ${user.role.toLowerCase()}. Select that role to sign in.` });
        }

        return res.json(authResponse(user));
    } catch (error) {
        console.error('Authentication login error:', error);
        return res.status(500).json({ detail: 'Unable to sign in. Please try again.' });
    }
});

router.get('/me', requireAuth, loadUser, (req, res) => {
    return res.json(publicUser(req.user));
});

// Update profile details for authenticated user (Student, Alumni, Faculty)
router.put('/profile', requireAuth, loadUser, async (req, res) => {
    try {
        const {
            name,
            phone,
            location,
            bio,
            department,
            degree,
            graduationYear,
            currentCompany,
            currentDesignation,
            linkedinUrl,
            skills,
            interests,
        } = req.body || {};

        const userId = req.user.id;

        // Update User fields if provided
        const userUpdateData = {};
        if (name && String(name).trim()) userUpdateData.name = String(name).trim();
        if (phone !== undefined) userUpdateData.phone = phone ? String(phone).trim() : null;

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: userUpdateData,
            });
        }

        // Handle AlumniProfile upsert
        const profileFields = {
            ...(location !== undefined ? { location: location ? String(location).trim() : null } : {}),
            ...(bio !== undefined ? { bio: bio ? String(bio).trim() : null } : {}),
            ...(department !== undefined ? { department: String(department || 'General').trim() } : {}),
            ...(degree !== undefined ? { degree: String(degree || 'Bachelor').trim() } : {}),
            ...(graduationYear !== undefined && !isNaN(Number(graduationYear)) ? { graduationYear: Number(graduationYear) } : {}),
            ...(currentCompany !== undefined ? { currentCompany: currentCompany ? String(currentCompany).trim() : null } : {}),
            ...(currentDesignation !== undefined ? { currentDesignation: currentDesignation ? String(currentDesignation).trim() : null } : {}),
            ...(linkedinUrl !== undefined ? { linkedinUrl: linkedinUrl ? String(linkedinUrl).trim() : null } : {}),
            ...(skills !== undefined ? { skills: typeof skills === 'string' ? skills : JSON.stringify(skills) } : {}),
            ...(interests !== undefined ? { interests: typeof interests === 'string' ? interests : JSON.stringify(interests) } : {}),
        };

        if (req.user.alumniProfile) {
            await prisma.alumniProfile.update({
                where: { userId },
                data: profileFields,
            });
        } else {
            await prisma.alumniProfile.create({
                data: {
                    userId,
                    department: String(department || 'General').trim(),
                    degree: String(degree || 'Bachelor').trim(),
                    graduationYear: graduationYear ? Number(graduationYear) : new Date().getFullYear(),
                    verificationStatus: 'PENDING',
                    isVerified: false,
                    ...profileFields,
                },
            });
        }

        // Fetch updated user object
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { alumniProfile: true },
        });

        return res.json({
            message: 'Profile updated successfully',
            user: publicUser(updatedUser),
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ detail: 'Unable to update profile. Please try again.' });
    }
});

// In development, return a token so the local UI can open the reset page.
// Production should deliver this token by email instead.
router.post('/forgot-password', async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const message = 'If an account exists for this email, you can reset its password.';
        const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
        if (!user) return res.json({ message });

        const resetToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
            },
        });

        return res.json({
            message,
            ...(process.env.NODE_ENV === 'production' ? {} : { resetToken }),
        });
    } catch (error) {
        console.error('Authentication password-reset request error:', error);
        return res.status(500).json({ detail: 'Unable to request a password reset.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (typeof token !== 'string' || !validatePassword(password)) {
            return res.status(400).json({ detail: 'Use a valid reset link and a password of at least 6 characters.' });
        }

        const user = await prisma.user.findFirst({
            where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
        });
        if (!user) return res.status(400).json({ detail: 'This reset link is invalid or has expired.' });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: await bcrypt.hash(password, 12),
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        return res.json({ message: 'Password updated. You can now sign in.' });
    } catch (error) {
        console.error('Authentication password-reset error:', error);
        return res.status(500).json({ detail: 'Unable to reset the password.' });
    }
});

module.exports = router;
