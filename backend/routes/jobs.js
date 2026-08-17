const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, loadUser, requireRole, requireVerified } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const SKILL_ALIASES = new Map([
    ['js', 'javascript'], ['reactjs', 'react'], ['node', 'nodejs'],
    ['nodejs', 'nodejs'], ['ml', 'machinelearning'], ['ai', 'artificialintelligence'],
    ['machinelearning', 'machinelearning'], ['datascience', 'datascience'],
]);

function parseList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    } catch {
        // Comma-separated legacy values are handled below.
    }
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizedSkill(value) {
    const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9+#]/g, '');
    return SKILL_ALIASES.get(normalized) || normalized;
}

function recommendationFor(job, studentSkills, studentInterests, action) {
    const requiredSkills = parseList(job.skills);
    const studentSkillSet = new Set(studentSkills.map(normalizedSkill));
    const matchedSkills = requiredSkills.filter((skill) => studentSkillSet.has(normalizedSkill(skill)));
    const searchableJob = `${job.title} ${job.description} ${requiredSkills.join(' ')}`.toLowerCase();
    const matchingInterests = studentInterests.filter((interest) =>
        searchableJob.includes(String(interest).toLowerCase())
    );
    const skillScore = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0.5;
    const matchScore = studentSkills.length
        ? Math.min(99, Math.round(skillScore * 85 + Math.min(matchingInterests.length, 2) * 5 + 5))
        : 0;
    const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
    const reason = !studentSkills.length
        ? 'Add skills to your student profile to receive a personalized match score.'
        : matchedSkills.length
            ? `Matches your ${matchedSkills.slice(0, 3).join(', ')} skill${matchedSkills.length === 1 ? '' : 's'}${missingSkills.length ? `. Build ${missingSkills.slice(0, 2).join(' and ')} to improve your fit.` : '. You cover every listed skill.'}`
            : `This role is a growth opportunity. Add ${missingSkills.slice(0, 3).join(', ')} to become a stronger match.`;

    return {
        ...job,
        skills: requiredSkills,
        matchScore,
        matchedSkills,
        missingSkills,
        reason,
        isSaved: Boolean(action?.isSaved),
        appliedAt: action?.appliedAt || null,
    };
}

router.use(requireAuth, loadUser);

router.get('/recommendations', requireRole('STUDENT'), async (req, res) => {
    try {
        const profile = req.user.studentProfile;
        const studentSkills = parseList(profile?.skills);
        const studentInterests = parseList(profile?.interests);
        const jobs = await prisma.jobOpportunity.findMany({
            where: {
                status: 'ACTIVE',
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: {
                postedBy: { select: { id: true, name: true } },
                actions: { where: { userId: req.user.id }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        });
        const recommendations = jobs
            .map((job) => recommendationFor(job, studentSkills, studentInterests, job.actions[0]))
            .map(({ actions, ...job }) => job)
            .sort((left, right) => right.matchScore - left.matchScore || right.id - left.id);

        res.json({
            profileSkills: studentSkills,
            profileInterests: studentInterests,
            jobs: recommendations,
            summary: {
                total: recommendations.length,
                strongMatches: recommendations.filter((job) => job.matchScore >= 70).length,
                saved: recommendations.filter((job) => job.isSaved).length,
                applied: recommendations.filter((job) => job.appliedAt).length,
            },
        });
    } catch (error) {
        console.error('Get job recommendations error:', error);
        res.status(500).json({ detail: 'Unable to load job recommendations' });
    }
});

router.get('/mine', requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const jobs = await prisma.jobOpportunity.findMany({
            where: { postedByUserId: req.user.id },
            include: { _count: { select: { actions: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(jobs);
    } catch (error) {
        console.error('Get posted jobs error:', error);
        res.status(500).json({ detail: 'Unable to load your opportunities' });
    }
});

router.post('/', requireRole('ALUMNI'), requireVerified, async (req, res) => {
    try {
        const {
            title, company, location, type, description, skills,
            requirements, applicationUrl, status = 'ACTIVE',
        } = req.body || {};
        const cleanSkills = parseList(skills);
        const cleanStatus = String(status).toUpperCase();
        const cleanUrl = String(applicationUrl || '').trim();

        if (![title, company, location, type, description].every((value) => String(value || '').trim())) {
            return res.status(400).json({ detail: 'Complete all required opportunity fields' });
        }
        if (!cleanSkills.length) {
            return res.status(400).json({ detail: 'Add at least one required skill' });
        }
        if (!['ACTIVE', 'DRAFT'].includes(cleanStatus)) {
            return res.status(400).json({ detail: 'Opportunity status must be active or draft' });
        }
        if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
            return res.status(400).json({ detail: 'Application link must start with http:// or https://' });
        }

        const job = await prisma.jobOpportunity.create({
            data: {
                title: String(title).trim(),
                company: String(company).trim(),
                location: String(location).trim(),
                type: String(type).trim(),
                description: String(description).trim(),
                skills: JSON.stringify(cleanSkills),
                requirements: String(requirements || '').trim() || null,
                applicationUrl: cleanUrl || null,
                status: cleanStatus,
                postedByUserId: req.user.id,
            },
            include: { postedBy: { select: { id: true, name: true } } },
        });
        res.status(201).json(job);
    } catch (error) {
        console.error('Post job opportunity error:', error);
        res.status(500).json({ detail: 'Unable to save the opportunity' });
    }
});

router.post('/:id/save', requireRole('STUDENT'), async (req, res) => {
    try {
        const jobId = Number(req.params.id);
        const isSaved = Boolean(req.body?.isSaved);
        const job = await prisma.jobOpportunity.findFirst({ where: { id: jobId, status: 'ACTIVE' } });
        if (!job) return res.status(404).json({ detail: 'Job opportunity not found' });

        const action = await prisma.studentJobAction.upsert({
            where: { userId_jobId: { userId: req.user.id, jobId } },
            update: { isSaved },
            create: { userId: req.user.id, jobId, isSaved },
        });
        res.json(action);
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({ detail: 'Unable to update the saved job' });
    }
});

router.post('/:id/apply', requireRole('STUDENT'), async (req, res) => {
    try {
        const jobId = Number(req.params.id);
        const job = await prisma.jobOpportunity.findFirst({
            where: { id: jobId, status: 'ACTIVE' },
            include: { postedBy: { select: { id: true, name: true } } },
        });
        if (!job) return res.status(404).json({ detail: 'Job opportunity not found' });

        const existing = await prisma.studentJobAction.findUnique({
            where: { userId_jobId: { userId: req.user.id, jobId } },
        });
        if (existing?.appliedAt) {
            return res.json({ action: existing, applicationUrl: job.applicationUrl, alreadyApplied: true });
        }

        const appliedAt = new Date();
        const action = await prisma.studentJobAction.upsert({
            where: { userId_jobId: { userId: req.user.id, jobId } },
            update: { appliedAt },
            create: { userId: req.user.id, jobId, appliedAt },
        });

        if (job.postedByUserId) {
            await prisma.notification.create({
                data: {
                    userId: job.postedByUserId,
                    type: 'JOB_APPLICATION',
                    title: `New interest in ${job.title}`,
                    message: `${req.user.name} applied for your ${job.title} opportunity.`,
                    data: JSON.stringify({ jobId, studentUserId: req.user.id }),
                },
            });
        }

        res.json({ action, applicationUrl: job.applicationUrl, alreadyApplied: false });
    } catch (error) {
        console.error('Apply for job error:', error);
        res.status(500).json({ detail: 'Unable to record this application' });
    }
});

module.exports = router;
