ALTER TABLE "ReunionAttendance" ADD COLUMN "maybeDeadline" DATETIME;
ALTER TABLE "ReunionAttendance" ADD COLUMN "respondedAt" DATETIME;

UPDATE "ReunionAttendance"
SET "respondedAt" = CURRENT_TIMESTAMP
WHERE "respondedAt" IS NULL;

UPDATE "ReunionAttendance"
SET "maybeDeadline" = datetime(CURRENT_TIMESTAMP, '+2 days')
WHERE "status" = 'MAYBE' AND "maybeDeadline" IS NULL;

CREATE TABLE "ReunionExpenseShare" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "expenseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReunionExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ReunionExpense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReunionExpenseShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "ReunionExpenseShare" ("expenseId", "userId", "amount", "status", "createdAt")
SELECT
    expense."id",
    CAST(participant.value AS INTEGER),
    expense."amount" / json_array_length(expense."splitBetweenUserIds"),
    'PENDING',
    CURRENT_TIMESTAMP
FROM "ReunionExpense" AS expense,
     json_each(expense."splitBetweenUserIds") AS participant
WHERE json_valid(expense."splitBetweenUserIds")
  AND json_array_length(expense."splitBetweenUserIds") > 0;

CREATE UNIQUE INDEX "ReunionExpenseShare_expenseId_userId_key" ON "ReunionExpenseShare"("expenseId", "userId");
CREATE INDEX "ReunionExpenseShare_expenseId_idx" ON "ReunionExpenseShare"("expenseId");
CREATE INDEX "ReunionExpenseShare_userId_idx" ON "ReunionExpenseShare"("userId");
CREATE INDEX "ReunionExpenseShare_status_idx" ON "ReunionExpenseShare"("status");
