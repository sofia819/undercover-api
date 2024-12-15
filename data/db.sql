-- Connect to database in PSQL terminal
-- \c database_name
-- Show tables in the database connected
-- \dt

CREATE DATABASE undercover;

DROP TABLE IF EXISTS rooms;

CREATE TABLE rooms (
	roomId VARCHAR(4) PRIMARY KEY,
    players VARCHAR(50)[],
	civilianWord VARCHAR(50),
    spyWord VARCHAR(50),
    currentPlayer VARCHAR(50) NULL,
    spyPlayers VARCHAR(50)[]
);