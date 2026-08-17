-- Before createdByUserId existed, only a batch coordinator could create a
-- reunion. Preserve those historical creators, then use createdByUserId as the
-- sole source of organizer identity in application code.
UPDATE "Reunion"
SET "createdByUserId" = (
    SELECT "Batch"."coordinatorUserId"
    FROM "Batch"
    WHERE "Batch"."id" = "Reunion"."batchId"
)
WHERE "createdByUserId" IS NULL;
