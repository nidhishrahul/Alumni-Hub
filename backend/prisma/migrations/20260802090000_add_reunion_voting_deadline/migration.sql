ALTER TABLE Reunion ADD COLUMN votingDeadline DATETIME;
ALTER TABLE Reunion ADD COLUMN finalizedAt DATETIME;

CREATE INDEX Reunion_votingDeadline_idx ON Reunion(votingDeadline);
