import pool from './db.js';

const createTable = async () => {
  await pool.query('DROP TABLE IF EXISTS rooms');

  await pool.query(`CREATE TABLE rooms (
	roomId VARCHAR(4) PRIMARY KEY,
    players VARCHAR(50)[],
	civilianWord VARCHAR(50),
    spyWord VARCHAR(50),
    spyPlayers VARCHAR(50)[]
);`);
};

const getGameById = (roomId: string) =>
  pool.query(
    `SELECT roomId AS "roomId",
    players,
	civilianWord AS "civilianWord",
    spyWord AS "spyWord",
    spyPlayers AS "spyPlayers" FROM rooms WHERE roomId = $1`,
    [roomId]
  );

const createGame = (
  roomId: string,
  players: string[],
  civilianWord: string,
  undercoverWord: string
) =>
  pool.query(
    'INSERT INTO rooms (roomId, players, civilianWord, spyWord) VALUES ($1, $2, $3, $4) RETURNING *',
    [roomId, players, civilianWord, undercoverWord]
  );

const addPlayer = (roomId: string, newPlayer: string) =>
  pool.query(
    'UPDATE rooms SET players = array_append(players, $1) WHERE roomId = $2',
    [newPlayer, roomId]
  );

const removePlayer = (roomId: string, playerToRemove: string) =>
  pool.query(
    'UPDATE rooms SET players = array_remove(players, $1) WHERE roomId = $2',
    [playerToRemove, roomId]
  );

const startGame = (roomId: string, players: string[], spyPlayer: string) =>
  pool.query(
    'UPDATE rooms SET players = $1, spyPlayers = $2 WHERE roomId = $3',
    [players, [spyPlayer], roomId]
  );

export const gameDao = {
  createTable,
  getGameById,
  createGame,
  addPlayer,
  removePlayer,
  startGame,
};
