const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding AlumniConnect database...\n");

    // ── 0. Purge Existing Data (Reverse Dependency Order) ─────────────────────
    console.log("🧹 Purging existing database records...");
    await prisma.studentJobAction.deleteMany();
    await prisma.jobOpportunity.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.supportRequest.deleteMany();
    await prisma.verificationRequest.deleteMany();
    await prisma.availabilityStatus.deleteMany();
    await prisma.reunionDateVote.deleteMany();
    await prisma.reunionVenueVote.deleteMany();
    await prisma.reunionAttendance.deleteMany();
    await prisma.reunionExpense.deleteMany();
    await prisma.reunionPhoto.deleteMany();
    await prisma.announcementRead.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.reunion.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.alumniProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log("✓ Database clean\n");

    // Standard hashed password for all seed accounts
    const passwordHash = await bcrypt.hash("password123", 10);

    // ── 1. Admin User ──────────────────────────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            email: "admin@alumniconnect.edu",
            passwordHash,
            name: "Dr. Kavitha Ramesh",
            role: "ADMIN",
            phone: "+91-9876543210",
        },
    });
    console.log(`  ✓ Admin: ${admin.name} (${admin.email})`);

    // ── 2. Five Verified Alumni ────────────────────────────────────────────────
    const alumniData = [
        {
            email: "rahul.sharma@gmail.com",
            name: "Rahul Sharma",
            phone: "+91-9001122334",
            profile: {
                registerNumber: "CSE2019001",
                graduationYear: 2023,
                department: "Computer Science",
                degree: "B.Tech",
                currentCompany: "Google",
                currentDesignation: "Software Engineer",
                location: "Bangalore, India",
                linkedinUrl: "https://linkedin.com/in/rahulsharma",
                bio: "Backend engineer passionate about distributed systems. Love mentoring juniors on system design.",
                isVerified: true,
                verificationStatus: "VERIFIED",
            },
            availability: [
                { supportType: "MENTORING", capacityPerMonth: 4, notes: "System design & backend roles" },
                { supportType: "REFERRALS", capacityPerMonth: 2, notes: "Google India referrals only" },
                { supportType: "MOCK_INTERVIEWS", capacityPerMonth: 3, notes: null },
            ],
        },
        {
            email: "priya.nair@outlook.com",
            name: "Priya Nair",
            phone: "+91-9112233445",
            profile: {
                registerNumber: "CSE2019015",
                graduationYear: 2023,
                department: "Computer Science",
                degree: "B.Tech",
                currentCompany: "Microsoft",
                currentDesignation: "Product Manager",
                location: "Hyderabad, India",
                linkedinUrl: "https://linkedin.com/in/priyanair",
                bio: "PM at Microsoft Azure. Happy to guide students transitioning from engineering to product roles.",
                isVerified: true,
                verificationStatus: "VERIFIED",
            },
            availability: [
                { supportType: "RESUME_REVIEWS", capacityPerMonth: 5, notes: "PM resumes preferred" },
                { supportType: "MENTORING", capacityPerMonth: 2, notes: "Product management career paths" },
            ],
        },
        {
            email: "arun.kumar@yahoo.com",
            name: "Arun Kumar",
            phone: "+91-9223344556",
            profile: {
                registerNumber: "ECE2018042",
                graduationYear: 2022,
                department: "Electronics",
                degree: "B.Tech",
                currentCompany: "Tesla",
                currentDesignation: "Embedded Systems Engineer",
                location: "San Francisco, USA",
                linkedinUrl: "https://linkedin.com/in/arunkumar",
                bio: "Working on firmware for Tesla's autopilot. Passionate about hardware-software interfaces.",
                isVerified: true,
                verificationStatus: "VERIFIED",
            },
            availability: [
                { supportType: "PROJECT_GUIDANCE", capacityPerMonth: 2, notes: "Embedded / IoT projects only" },
                { supportType: "GUEST_LECTURES", capacityPerMonth: 1, notes: "Available on weekends IST" },
            ],
        },
        {
            email: "sneha.reddy@gmail.com",
            name: "Sneha Reddy",
            phone: "+91-9334455667",
            profile: {
                registerNumber: "CSE2017008",
                graduationYear: 2021,
                department: "Computer Science",
                degree: "M.Tech",
                currentCompany: "Flipkart",
                currentDesignation: "Senior Data Scientist",
                location: "Bangalore, India",
                linkedinUrl: "https://linkedin.com/in/snehareddy",
                bio: "ML engineer turned data scientist. Built recommendation systems serving 200M+ users.",
                isVerified: true,
                verificationStatus: "VERIFIED",
            },
            availability: [
                { supportType: "MENTORING", capacityPerMonth: 3, notes: "ML/AI career guidance" },
                { supportType: "MOCK_INTERVIEWS", capacityPerMonth: 2, notes: "Data science interviews" },
                { supportType: "STARTUP_INVESTMENT", capacityPerMonth: 1, notes: "AI/ML startups, seed stage" },
            ],
        },
        {
            email: "vijay.patel@proton.me",
            name: "Vijay Patel",
            phone: "+91-9445566778",
            profile: {
                registerNumber: "CSE2019030",
                graduationYear: 2023,
                department: "Computer Science",
                degree: "B.Tech",
                currentCompany: "Razorpay",
                currentDesignation: "Full Stack Developer",
                location: "Pune, India",
                linkedinUrl: "https://linkedin.com/in/vijaypatel",
                bio: "Full stack dev at Razorpay. Open to helping juniors with web dev.",
                isVerified: true,
                verificationStatus: "VERIFIED",
            },
            availability: [
                { supportType: "REFERRALS", capacityPerMonth: 3, notes: "Razorpay & fintech startups" },
                { supportType: "RESUME_REVIEWS", capacityPerMonth: 4, notes: null },
                { supportType: "PROJECT_GUIDANCE", capacityPerMonth: 2, notes: "Web dev / React / Node.js projects" },
            ],
        },
    ];

    const alumniUsers = [];
    for (const a of alumniData) {
        const user = await prisma.user.create({
            data: {
                email: a.email,
                passwordHash,
                name: a.name,
                role: "ALUMNI",
                phone: a.phone,
                alumniProfile: {
                    create: {
                        ...a.profile,
                        verificationRequests: {
                            create: {
                                method: "REGISTER_NUMBER",
                                status: "VERIFIED",
                                reviewedByAdminId: admin.id,
                                reviewNotes: "Register number verified against university records.",
                                reviewedAt: new Date(),
                            },
                        },
                        availabilityStatuses: {
                            create: a.availability.map((av) => ({
                                supportType: av.supportType,
                                isActive: true,
                                capacityPerMonth: av.capacityPerMonth,
                                notes: av.notes ?? null,
                            })),
                        },
                    },
                },
            },
            include: { alumniProfile: true },
        });
        alumniUsers.push(user);
        console.log(`  ✓ Alumni: ${user.name} (${a.profile.currentCompany})`);
    }

    // ── 3. Three Students ──────────────────────────────────────────────────────
    const studentData = [
        { email: "ananya.s@student.edu", name: "Ananya Subramaniam", phone: "+91-8001122334", skills: ["Python", "SQL", "Data Science"] },
        { email: "deepak.m@student.edu", name: "Deepak Murugan", phone: "+91-8112233445", skills: ["JavaScript", "React", "Node.js"] },
        { email: "ishita.g@student.edu", name: "Ishita Gupta", phone: "+91-8223344556", skills: ["Linux", "Networking", "Security"] },
    ];

    const students = [];
    for (const s of studentData) {
        const user = await prisma.user.create({
            data: {
                email: s.email,
                passwordHash,
                name: s.name,
                role: "STUDENT",
                phone: s.phone,
                studentProfile: {
                    create: {
                        graduationYear: 2027,
                        department: "Computer Science",
                        degree: "B.Tech",
                        skills: JSON.stringify(s.skills),
                        interests: JSON.stringify(["Career Growth", "Mentorship"]),
                    },
                },
            },
        });
        students.push(user);
        console.log(`  ✓ Student: ${user.name}`);
    }

    // ── 4. Sample Batch + Reunion ──────────────────────────────────────────────
    await prisma.jobOpportunity.createMany({
        data: [
            { title: "Machine Learning Engineer Intern", company: "Google", location: "Bangalore", type: "Internship", description: "Build and evaluate machine-learning services.", skills: JSON.stringify(["Python", "TensorFlow", "Machine Learning"]), status: "ACTIVE" },
            { title: "Full Stack Developer", company: "Microsoft", location: "Hyderabad", type: "Full-time", description: "Create accessible web applications and reliable Node.js services.", skills: JSON.stringify(["React", "Node.js", "TypeScript", "Azure"]), status: "ACTIVE" },
            { title: "Data Science Intern", company: "Amazon", location: "Chennai", type: "Internship", description: "Analyze product data and prototype predictive models.", skills: JSON.stringify(["Python", "SQL", "Statistics", "Data Science"]), status: "ACTIVE" },
        ],
    });

    const batch = await prisma.batch.create({
        data: {
            department: "Computer Science",
            graduationYear: 2023,
            coordinatorUserId: alumniUsers[0].id,
        },
    });

    const reunion = await prisma.reunion.create({
        data: {
            batchId: batch.id,
            createdByUserId: alumniUsers[0].id,
            audienceType: "DEPARTMENT",
            targetDepartment: "Computer Science",
            title: "CSE 2023 – 4-Year Reunion 🎉",
            proposedDates: JSON.stringify(["2027-01-15", "2027-02-14", "2027-03-01"]),
            venueOptions: JSON.stringify([
                { name: "College Auditorium", address: "Main Campus, Chennai", votes: 0 },
                { name: "Taj Coromandel", address: "Nungambakkam, Chennai", votes: 0 },
            ]),
            status: "PLANNING",
            votingDeadline: new Date("2026-12-31T18:00:00Z"),
            countdownTargetDate: new Date("2027-03-01T18:00:00Z"),
        },
    });

    // ── Sample Support Requests ────────────────────────────────────────────────
    await prisma.supportRequest.create({
        data: {
            requestedByUserId: students[0].id,
            alumniProfileId: alumniUsers[0].alumniProfile.id,
            supportType: "MENTORING",
            message: "Hi Rahul! I'm a 3rd year student interested in system design. Would love to get your mentorship.",
            status: "PENDING",
        },
    });

    console.log("\n✅ Seeding complete! All passwords set to: password123");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        prisma.$disconnect();
        process.exit(1);
    });
