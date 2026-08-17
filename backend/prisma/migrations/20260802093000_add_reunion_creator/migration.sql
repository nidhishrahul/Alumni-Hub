ALTER TABLE Reunion ADD COLUMN createdByUserId INTEGER;

CREATE INDEX Reunion_createdByUserId_idx ON Reunion(createdByUserId);
