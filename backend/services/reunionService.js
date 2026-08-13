const { prisma } = require('../middleware/auth');

const ACTIVE_VOTING_STATUSES = ['PLANNING', 'DATE_VOTING', 'VENUE_VOTING', 'VOTING'];

function parseOptions(value) {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function voteCounts(optionCount, votes) {
    const counts = Array.from({ length: optionCount }, () => 0);
    for (const vote of votes) {
        if (Number.isInteger(vote.chosenOptionIndex) &&
            vote.chosenOptionIndex >= 0 &&
            vote.chosenOptionIndex < optionCount) {
            counts[vote.chosenOptionIndex] += 1;
        }
    }
    return counts;
}

function winningIndex(counts, tieBreaker) {
    if (!counts.length) return -1;
    const highest = Math.max(...counts);
    const tied = counts
        .map((count, index) => ({ count, index }))
        .filter((entry) => entry.count === highest)
        .map((entry) => entry.index);

    return tied.sort(tieBreaker)[0];
}

async function notifyVerifiedReunionAudience(client, reunion, notification) {
    const recipients = await client.user.findMany({
        where: {
            role: 'ALUMNI',
            alumniProfile: {
                is: {
                    isVerified: true,
                    graduationYear: reunion.batch.graduationYear,
                    ...(reunion.audienceType === 'DEPARTMENT'
                        ? { department: reunion.targetDepartment }
                        : {}),
                },
            },
        },
        select: { id: true },
    });

    if (!recipients.length) return 0;

    await client.notification.createMany({
        data: recipients.map(({ id }) => ({
            userId: id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: JSON.stringify(notification.data),
        })),
    });

    return recipients.length;
}

async function notifyReunionCreated(reunion) {
    return notifyVerifiedReunionAudience(prisma, reunion, {
        type: 'REUNION_CREATED',
        title: 'New batch reunion voting opened',
        message: reunion.title + ' is open for date and venue voting until ' +
            new Date(reunion.votingDeadline).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
            }) + '.',
        data: {
            reunionId: reunion.id,
            audienceType: reunion.audienceType,
            department: reunion.targetDepartment,
            graduationYear: reunion.batch.graduationYear,
        },
    });
}

async function notifyReunionAnnouncement(reunion, announcement) {
    return notifyVerifiedReunionAudience(prisma, reunion, {
        type: 'REUNION_ANNOUNCEMENT',
        title: announcement.title,
        message: announcement.body,
        data: {
            reunionId: reunion.id,
            announcementId: announcement.id,
            audienceType: reunion.audienceType,
            department: reunion.targetDepartment,
            graduationYear: reunion.batch.graduationYear,
        },
    });
}

async function finalizeReunion(reunionId, { force = false } = {}) {
    const reunion = await prisma.reunion.findUnique({
        where: { id: Number(reunionId) },
        include: {
            batch: true,
            dateVotes: { select: { chosenOptionIndex: true } },
            venueVotes: { select: { chosenOptionIndex: true } },
        },
    });

    if (!reunion || reunion.finalizedAt || !ACTIVE_VOTING_STATUSES.includes(reunion.status)) {
        return reunion;
    }

    if (!force && (!reunion.votingDeadline || reunion.votingDeadline > new Date())) {
        return reunion;
    }

    const proposedDates = parseOptions(reunion.proposedDates);
    const venueOptions = parseOptions(reunion.venueOptions);
    if (!proposedDates.length || !venueOptions.length) {
        throw new Error('Reunion has no date or venue options to finalize');
    }

    const dateCounts = voteCounts(proposedDates.length, reunion.dateVotes);
    const venueCounts = voteCounts(venueOptions.length, reunion.venueVotes);
    const bestDateIndex = winningIndex(dateCounts, (left, right) => {
        const leftTime = new Date(proposedDates[left]).getTime();
        const rightTime = new Date(proposedDates[right]).getTime();
        if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
            return leftTime - rightTime;
        }
        return left - right;
    });
    const bestVenueIndex = winningIndex(venueCounts, (left, right) => left - right);
    const finalDate = new Date(proposedDates[bestDateIndex]);
    const finalVenue = venueOptions[bestVenueIndex];

    if (Number.isNaN(finalDate.getTime())) {
        throw new Error('Winning reunion date is invalid');
    }

    return prisma.$transaction(async (transaction) => {
        const claimed = await transaction.reunion.updateMany({
            where: {
                id: reunion.id,
                finalizedAt: null,
                status: { in: ACTIVE_VOTING_STATUSES },
            },
            data: {
                finalDate,
                finalVenue: JSON.stringify(finalVenue),
                countdownTargetDate: finalDate,
                status: 'CONFIRMED',
                finalizedAt: new Date(),
            },
        });

        if (!claimed.count) {
            return transaction.reunion.findUnique({
                where: { id: reunion.id },
                include: { batch: true },
            });
        }

        await notifyVerifiedReunionAudience(transaction, reunion, {
            type: 'REUNION_FINALIZED',
            title: 'Your batch reunion is confirmed',
            message: reunion.title + ' is confirmed for ' +
                finalDate.toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                }) + ' at ' + (finalVenue.name || 'the selected venue') + '.',
            data: {
                reunionId: reunion.id,
                audienceType: reunion.audienceType,
                department: reunion.targetDepartment,
                graduationYear: reunion.batch.graduationYear,
                finalDate: finalDate.toISOString(),
                finalVenue,
                dateVotes: dateCounts[bestDateIndex],
                venueVotes: venueCounts[bestVenueIndex],
            },
        });

        return transaction.reunion.findUnique({
            where: { id: reunion.id },
            include: { batch: true },
        });
    });
}

async function finalizeDueReunions() {
    const due = await prisma.reunion.findMany({
        where: {
            finalizedAt: null,
            status: { in: ACTIVE_VOTING_STATUSES },
            votingDeadline: { not: null, lte: new Date() },
        },
        select: { id: true },
    });

    for (const reunion of due) {
        try {
            await finalizeReunion(reunion.id);
        } catch (error) {
            console.error('Automatic reunion finalization failed:', reunion.id, error);
        }
    }

    return due.length;
}

module.exports = {
    ACTIVE_VOTING_STATUSES,
    finalizeDueReunions,
    finalizeReunion,
    notifyReunionCreated,
    notifyReunionAnnouncement,
    notifyVerifiedReunionAudience,
    parseOptions,
    voteCounts,
};
