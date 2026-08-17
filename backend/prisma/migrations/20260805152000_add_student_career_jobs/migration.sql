CREATE TABLE "StudentProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "graduationYear" INTEGER,
    "department" TEXT,
    "degree" TEXT,
    "location" TEXT,
    "bio" TEXT,
    "skills" TEXT,
    "interests" TEXT,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "StudentProfile" (
    "userId", "graduationYear", "department", "degree", "location", "bio", "skills", "interests"
)
SELECT
    profile."userId", profile."graduationYear", profile."department", profile."degree",
    profile."location", profile."bio", profile."skills", profile."interests"
FROM "AlumniProfile" AS profile
JOIN "User" AS account ON account."id" = profile."userId"
WHERE account."role" = 'STUDENT';

INSERT INTO "StudentProfile" ("userId")
SELECT "id"
FROM "User"
WHERE "role" = 'STUDENT'
  AND "id" NOT IN (SELECT "userId" FROM "StudentProfile");

CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE INDEX "StudentProfile_department_idx" ON "StudentProfile"("department");
CREATE INDEX "StudentProfile_graduationYear_idx" ON "StudentProfile"("graduationYear");

CREATE TABLE "JobOpportunity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "requirements" TEXT,
    "applicationUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "postedByUserId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "JobOpportunity_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "JobOpportunity_status_idx" ON "JobOpportunity"("status");
CREATE INDEX "JobOpportunity_postedByUserId_idx" ON "JobOpportunity"("postedByUserId");
CREATE INDEX "JobOpportunity_createdAt_idx" ON "JobOpportunity"("createdAt");

CREATE TABLE "StudentJobAction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentJobAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentJobAction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobOpportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StudentJobAction_userId_jobId_key" ON "StudentJobAction"("userId", "jobId");
CREATE INDEX "StudentJobAction_userId_idx" ON "StudentJobAction"("userId");
CREATE INDEX "StudentJobAction_jobId_idx" ON "StudentJobAction"("jobId");
CREATE INDEX "StudentJobAction_appliedAt_idx" ON "StudentJobAction"("appliedAt");

INSERT INTO "JobOpportunity" (
    "title", "company", "location", "type", "description", "skills", "requirements", "status"
) VALUES
('Machine Learning Engineer Intern', 'Google', 'Bangalore', 'Internship', 'Build and evaluate machine-learning services with an experienced engineering team.', '["Python","TensorFlow","Machine Learning"]', 'Python projects and sound machine-learning fundamentals.', 'ACTIVE'),
('Full Stack Developer', 'Microsoft', 'Hyderabad', 'Full-time', 'Create accessible web applications and reliable Node.js services.', '["React","Node.js","TypeScript","Azure"]', 'Strong JavaScript fundamentals and experience building web projects.', 'ACTIVE'),
('Data Science Intern', 'Amazon', 'Chennai', 'Internship', 'Analyze product data, build dashboards, and prototype predictive models.', '["Python","SQL","Statistics","Data Science"]', 'Comfort with data analysis and communicating findings.', 'ACTIVE'),
('Cloud Engineering Intern', 'Razorpay', 'Remote', 'Internship', 'Help automate cloud infrastructure and improve deployment reliability.', '["AWS","Docker","Linux","Terraform"]', 'Basic cloud, networking, and scripting knowledge.', 'ACTIVE'),
('Cybersecurity Analyst', 'Deloitte', 'Pune', 'Full-time', 'Monitor security events and help investigate potential threats.', '["Security","Networking","SIEM","Linux"]', 'Understanding of networking and security fundamentals.', 'ACTIVE'),
('Frontend Developer Intern', 'Freshworks', 'Chennai', 'Internship', 'Build responsive product interfaces with a modern frontend team.', '["JavaScript","React","CSS","Git"]', 'A portfolio demonstrating responsive web development.', 'ACTIVE');
