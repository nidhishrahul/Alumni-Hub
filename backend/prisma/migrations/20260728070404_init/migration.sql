-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "phone" TEXT,
    "profilePhotoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlumniProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "registerNumber" TEXT,
    "graduationYear" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "currentCompany" TEXT,
    "currentDesignation" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "AlumniProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alumniProfileId" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "documentUrl" TEXT,
    "referenceAlumniId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedByAdminId" INTEGER,
    "reviewNotes" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "VerificationRequest_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "AlumniProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerificationRequest_referenceAlumniId_fkey" FOREIGN KEY ("referenceAlumniId") REFERENCES "AlumniProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VerificationRequest_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilityStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alumniProfileId" INTEGER NOT NULL,
    "supportType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capacityPerMonth" INTEGER,
    "notes" TEXT,
    CONSTRAINT "AvailabilityStatus_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "AlumniProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestedByUserId" INTEGER NOT NULL,
    "alumniProfileId" INTEGER NOT NULL,
    "supportType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportRequest_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "AlumniProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "department" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "coordinatorUserId" INTEGER NOT NULL,
    CONSTRAINT "Batch_coordinatorUserId_fkey" FOREIGN KEY ("coordinatorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reunion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "proposedDates" TEXT NOT NULL,
    "venueOptions" TEXT NOT NULL,
    "finalDate" DATETIME,
    "finalVenue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "countdownTargetDate" DATETIME,
    CONSTRAINT "Reunion_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReunionDateVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reunionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "chosenOptionIndex" INTEGER NOT NULL,
    CONSTRAINT "ReunionDateVote_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReunionDateVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReunionVenueVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reunionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "chosenOptionIndex" INTEGER NOT NULL,
    CONSTRAINT "ReunionVenueVote_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReunionVenueVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReunionAttendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reunionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GOING',
    "accommodationNeeded" BOOLEAN NOT NULL DEFAULT false,
    "dietaryNotes" TEXT,
    CONSTRAINT "ReunionAttendance_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReunionAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReunionExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reunionId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidByUserId" INTEGER NOT NULL,
    "splitBetweenUserIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReunionExpense_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReunionExpense_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReunionPhoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reunionId" INTEGER NOT NULL,
    "uploadedByUserId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReunionPhoto_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReunionPhoto_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchId" INTEGER,
    "authorUserId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Announcement_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniProfile_userId_key" ON "AlumniProfile"("userId");

-- CreateIndex
CREATE INDEX "AlumniProfile_isVerified_idx" ON "AlumniProfile"("isVerified");

-- CreateIndex
CREATE INDEX "AlumniProfile_graduationYear_idx" ON "AlumniProfile"("graduationYear");

-- CreateIndex
CREATE INDEX "AlumniProfile_department_idx" ON "AlumniProfile"("department");

-- CreateIndex
CREATE INDEX "AlumniProfile_verificationStatus_idx" ON "AlumniProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "VerificationRequest_alumniProfileId_idx" ON "VerificationRequest"("alumniProfileId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationRequest_referenceAlumniId_idx" ON "VerificationRequest"("referenceAlumniId");

-- CreateIndex
CREATE INDEX "VerificationRequest_reviewedByAdminId_idx" ON "VerificationRequest"("reviewedByAdminId");

-- CreateIndex
CREATE INDEX "AvailabilityStatus_supportType_idx" ON "AvailabilityStatus"("supportType");

-- CreateIndex
CREATE INDEX "AvailabilityStatus_isActive_idx" ON "AvailabilityStatus"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityStatus_alumniProfileId_supportType_key" ON "AvailabilityStatus"("alumniProfileId", "supportType");

-- CreateIndex
CREATE INDEX "SupportRequest_requestedByUserId_idx" ON "SupportRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "SupportRequest_alumniProfileId_idx" ON "SupportRequest"("alumniProfileId");

-- CreateIndex
CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");

-- CreateIndex
CREATE INDEX "SupportRequest_supportType_idx" ON "SupportRequest"("supportType");

-- CreateIndex
CREATE INDEX "Batch_coordinatorUserId_idx" ON "Batch"("coordinatorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_department_graduationYear_key" ON "Batch"("department", "graduationYear");

-- CreateIndex
CREATE INDEX "Reunion_batchId_idx" ON "Reunion"("batchId");

-- CreateIndex
CREATE INDEX "Reunion_status_idx" ON "Reunion"("status");

-- CreateIndex
CREATE INDEX "ReunionDateVote_reunionId_idx" ON "ReunionDateVote"("reunionId");

-- CreateIndex
CREATE INDEX "ReunionDateVote_userId_idx" ON "ReunionDateVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReunionDateVote_reunionId_userId_key" ON "ReunionDateVote"("reunionId", "userId");

-- CreateIndex
CREATE INDEX "ReunionVenueVote_reunionId_idx" ON "ReunionVenueVote"("reunionId");

-- CreateIndex
CREATE INDEX "ReunionVenueVote_userId_idx" ON "ReunionVenueVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReunionVenueVote_reunionId_userId_key" ON "ReunionVenueVote"("reunionId", "userId");

-- CreateIndex
CREATE INDEX "ReunionAttendance_reunionId_idx" ON "ReunionAttendance"("reunionId");

-- CreateIndex
CREATE INDEX "ReunionAttendance_userId_idx" ON "ReunionAttendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReunionAttendance_reunionId_userId_key" ON "ReunionAttendance"("reunionId", "userId");

-- CreateIndex
CREATE INDEX "ReunionExpense_reunionId_idx" ON "ReunionExpense"("reunionId");

-- CreateIndex
CREATE INDEX "ReunionExpense_paidByUserId_idx" ON "ReunionExpense"("paidByUserId");

-- CreateIndex
CREATE INDEX "ReunionPhoto_reunionId_idx" ON "ReunionPhoto"("reunionId");

-- CreateIndex
CREATE INDEX "ReunionPhoto_uploadedByUserId_idx" ON "ReunionPhoto"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "Announcement_batchId_idx" ON "Announcement"("batchId");

-- CreateIndex
CREATE INDEX "Announcement_authorUserId_idx" ON "Announcement"("authorUserId");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
