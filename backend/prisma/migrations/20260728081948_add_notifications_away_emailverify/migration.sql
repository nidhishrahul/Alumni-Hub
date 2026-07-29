-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AlumniProfile" (
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
    "isAway" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" DATETIME,
    CONSTRAINT "AlumniProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AlumniProfile" ("bio", "currentCompany", "currentDesignation", "degree", "department", "graduationYear", "id", "isVerified", "linkedinUrl", "location", "registerNumber", "userId", "verificationStatus") SELECT "bio", "currentCompany", "currentDesignation", "degree", "department", "graduationYear", "id", "isVerified", "linkedinUrl", "location", "registerNumber", "userId", "verificationStatus" FROM "AlumniProfile";
DROP TABLE "AlumniProfile";
ALTER TABLE "new_AlumniProfile" RENAME TO "AlumniProfile";
CREATE UNIQUE INDEX "AlumniProfile_userId_key" ON "AlumniProfile"("userId");
CREATE INDEX "AlumniProfile_isVerified_idx" ON "AlumniProfile"("isVerified");
CREATE INDEX "AlumniProfile_graduationYear_idx" ON "AlumniProfile"("graduationYear");
CREATE INDEX "AlumniProfile_department_idx" ON "AlumniProfile"("department");
CREATE INDEX "AlumniProfile_verificationStatus_idx" ON "AlumniProfile"("verificationStatus");
CREATE INDEX "AlumniProfile_isAway_idx" ON "AlumniProfile"("isAway");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
