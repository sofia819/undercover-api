import pool from './db.js';

const createTable = async () => {
  await pool.query('DROP TABLE IF EXISTS rooms');

  await pool.query(`CREATE TABLE rooms (
	roomId VARCHAR(4) PRIMARY KEY,
    players VARCHAR(50)[],
	civilianWord VARCHAR(50),
    spyWord VARCHAR(50),
    currentPlayer VARCHAR(50) NULL,
    spyPlayers VARCHAR(50)[]
);`);
};

const getGameById = (roomId: string) =>
  pool.query(
    `SELECT roomId AS "roomId",
    players,
	civilianWord AS "civilianWord",
    spyWord AS "spyWord",
    currentPlayer AS "currentPlayer",
    spyPlayers AS "spyPlayers" FROM rooms WHERE roomId = $1`,
    [roomId]
  );

const createGame = (
  roomId: string,
  players: string[],
  civilianWord: string,
  undercoverWord: string,
  currentPlayer: string
) =>
  pool.query(
    'INSERT INTO rooms (roomId, players, civilianWord, spyWord, currentPlayer) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [roomId, players, civilianWord, undercoverWord, currentPlayer]
  );

const addPlayer = (roomId: string, newPlayer: string) =>
  pool.query(
    'UPDATE rooms SET players = array_append(players, $1) WHERE roomId = $2',
    [newPlayer, roomId]
  );

const startGame = (roomId: string, players: string[], spyPlayer: string) =>
  pool.query(
    'UPDATE rooms SET players = $1, currentPlayer = $2, spyPlayers = $3 WHERE roomId = $4',
    [players, players[0], [spyPlayer], roomId]
  );

export const gameDao = {
  createTable,
  getGameById,
  createGame,
  addPlayer,
  startGame,
};
