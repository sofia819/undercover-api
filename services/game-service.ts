import { gameDao } from '../data/game-data.js';

interface Game {
  roomId: string;
  civilianWord: string;
  spyWord: string;
  players: string[];
  spyPlayers: string[];
}

export const removePlayer = async (roomId: string, playerName: string) =>
  await gameDao.removePlayer(roomId, playerName);

export const getPlayers = async (roomId: string): Promise<string[]> => {
  const game = await getGame(roomId);

  return game.players;
};

export const getWord = async (
  roomId: string,
  playerName: string
): Promise<string> => {
  const game = await getGame(roomId);

  return game.spyPlayers.includes(playerName)
    ? game.spyWord
    : game.civilianWord;
};

export const createRoom = async (): Promise<string> => {
  const roomId = generateRoomId();

  await gameDao.createGame(roomId, [], 'car', 'van');

  return roomId;
};

const generateRoomId = (): string => 'a'; //Math.random().toString(36).substring(3, 7);

export const joinGame = async (roomId: string, playerName: string) => {
  await gameDao.addPlayer(roomId, playerName);
  return true;
};

export const startGame = async (roomId: string) => {
  const room = await getGame(roomId);

  console.log(room);

  // this is the order of players
  const playerNames = shufflePlayers(room.players);

  const spy = playerNames[Math.floor(Math.random() * playerNames.length)];

  await gameDao.startGame(roomId, playerNames, spy);
  return true;
};

//  Fisher-Yates shuffle
const shufflePlayers = (players: string[]) => {
  for (let i = players.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  return players;
};

const getGame = async (roomId: string): Promise<Game> =>
  await gameDao
    .getGameById(roomId)
    .then((games) => games[0])
    .catch((err): any => {
      console.error('No game found', err);
      return null;
    });

export const gameService = {
  getPlayers,
  getWord,
  createRoom,
  joinGame,
  removePlayer,
  startGame,
  getGame,
};
