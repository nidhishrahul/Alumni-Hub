-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "announcementId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Announcement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchId" INTEGER,
    "reunionId" INTEGER,
    "authorUserId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Announcement_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Announcement_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Announcement" ("authorUserId", "batchId", "body", "createdAt", "id", "title") SELECT "authorUserId", "batchId", "body", "createdAt", "id", "title" FROM "Announcement";
DROP TABLE "Announcement";
ALTER TABLE "new_Announcement" RENAME TO "Announcement";
CREATE INDEX "Announcement_batchId_idx" ON "Announcement"("batchId");
CREATE INDEX "Announcement_reunionId_idx" ON "Announcement"("reunionId");
CREATE INDEX "Announcement_authorUserId_idx" ON "Announcement"("authorUserId");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
CREATE TABLE "new_Reunion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "proposedDates" TEXT NOT NULL,
    "venueOptions" TEXT NOT NULL,
    "finalDate" DATETIME,
    "finalVenue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "countdownTargetDate" DATETIME,
    CONSTRAINT "Reunion_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reunion" ("batchId", "countdownTargetDate", "finalDate", "finalVenue", "id", "proposedDates", "status", "title", "venueOptions") SELECT "batchId", "countdownTargetDate", "finalDate", "finalVenue", "id", "proposedDates", "status", "title", "venueOptions" FROM "Reunion";
DROP TABLE "Reunion";
ALTER TABLE "new_Reunion" RENAME TO "Reunion";
CREATE INDEX "Reunion_batchId_idx" ON "Reunion"("batchId");
CREATE INDEX "Reunion_status_idx" ON "Reunion"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId");
