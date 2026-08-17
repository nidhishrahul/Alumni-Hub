ALTER TABLE "Reunion" ADD COLUMN "audienceType" TEXT NOT NULL DEFAULT 'DEPARTMENT';
ALTER TABLE "Reunion" ADD COLUMN "targetDepartment" TEXT;

-- Existing reunions were created within a department batch, so retain that
-- audience when introducing explicit department/whole-batch classification.
UPDATE "Reunion"
SET "targetDepartment" = (
    SELECT "Batch"."department"
    FROM "Batch"
    WHERE "Batch"."id" = "Reunion"."batchId"
)
WHERE "audienceType" = 'DEPARTMENT' AND "targetDepartment" IS NULL;

CREATE INDEX "Reunion_audienceType_idx" ON "Reunion"("audienceType");
CREATE INDEX "Reunion_targetDepartment_idx" ON "Reunion"("targetDepartment");
