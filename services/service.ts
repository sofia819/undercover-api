import { Game, Player, Status, Role, Clue, Vote } from '../types.js';
import { getWords } from './word-service.js';

const games: { [gameId: string]: Game } = {};

const gamePlayers: { [gameId: string]: { [playerName: string]: Player } } = {};

const gamePlayerOrders: { [gameId: string]: string[] } = {};

const gameEliminations: { [gameId: string]: string[] } = {};

const gameClues: { [gameId: string]: Clue[] } = {};

const gameVotes: { [gameId: string]: Vote[] } = {};

export const createGame = async () => {
  const gameId: string = generateRandomCode();
  await getWords()
    .then((words) => words.replace(' ', '').split(','))
    .then(([civilianWord, spyWord]) => {
      games[gameId] = {
        gameId,
        civilianWord,
        spyWord,
        gameStatus: Status.WAITING,
        currentRoundIndex: -1,
        maxRoundIndex: 2,
      };
      gamePlayers[gameId] = {};
      gamePlayerOrders[gameId] = [];
      gameClues[gameId] = [];
      gameVotes[gameId] = [];
      gameEliminations[gameId] = [];
    });

  return gameId;
};

export const restartGame = async (gameId: string) => {
  await getWords()
    .then((words) => words.replace(' ', '').split(','))
    .then(([civilianWord, spyWord]) => {
      games[gameId] = {
        gameId,
        civilianWord,
        spyWord,
        gameStatus: Status.WAITING,
        currentRoundIndex: -1,
        maxRoundIndex: 2,
      };
      Object.keys(gamePlayers[gameId] || {}).forEach((player) =>
        joinGame(gameId, player)
      );
      gameClues[gameId] = [];
      gameVotes[gameId] = [];
      gameEliminations[gameId] = [];
    });
};

const generateRandomCode = (): string =>
  Math.random().toString(36).substring(3, 7);

const joinGame = (gameId: string, playerName: string) => {
  gamePlayers[gameId][playerName] = {
    playerName,
    role: Role.CIVILIAN,
    isActive: true,
  };
  gamePlayerOrders[gameId].push(playerName);

  return true;
};

const leaveGame = (gameId: string, playerName: string) => {
  delete gamePlayers[gameId]?.[playerName];
  gamePlayerOrders[gameId] = gamePlayerOrders[gameId]?.filter(
    (player) => player !== playerName
  );
  gameEliminations[gameId] = gameEliminations[gameId]?.filter(
    (player) => player !== playerName
  );

  gameClues[gameId]?.forEach((clues) => delete clues[playerName]);
  gameVotes[gameId]?.forEach((votes) => delete votes[playerName]);

  checkSpyStatus(games?.[gameId]);

  if (Object.keys(gamePlayers[gameId] || {}).length === 0) {
    delete games?.[gameId];
    delete gamePlayers?.[gameId];
  }
};

const startGame = (gameId: string) => {
  updateGameStatus(gameId);
  incrementRound(gameId);

  const players = gamePlayers[gameId];
  const shuffled = shufflePlayers(Object.keys(players || {}));
  gamePlayerOrders[gameId] = shuffled;

  const spyPlayerIndex = Math.floor(Math.random() * (shuffled.length - 1));
  players[shuffled[spyPlayerIndex]].role = Role.SPY;
};

const shufflePlayers = (players: string[]) => {
  for (let i = players.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  return players;
};

const incrementRound = (gameId: string) => {
  games[gameId].currentRoundIndex += 1;

  gameClues[gameId].push({});
  gameVotes[gameId].push({});
};

const submitClue = (gameId: string, playerName: string, text: string) => {
  const round = games[gameId].currentRoundIndex;
  gameClues[gameId][round][playerName] = text;
  updateGameStatus(gameId);
};

const submitVote = (
  gameId: string,
  playerName: string,
  votedPlayerName: string
) => {
  const round = games[gameId].currentRoundIndex;
  gameVotes[gameId][round][playerName] = votedPlayerName;
  updateGameStatus(gameId);
};

const getWord = (gameId: string, playerName: string) => {
  const game = games[gameId];

  return gamePlayers[gameId][playerName].role === Role.CIVILIAN
    ? game.civilianWord
    : game.spyWord;
};

const updateGameStatus = (gameId: string) => {
  const game = games[gameId];

  switch (game.gameStatus) {
    case Status.WAITING:
      handleWaitingStatus(game);
      break;
    case Status.CLUE:
      handleClueStatus(game);
      break;
    case Status.VOTE:
      handleVoteStatus(game);
      break;
  }
};

const handleWaitingStatus = (game: Game) => {
  game.gameStatus = Status.CLUE;
};

const handleClueStatus = (game: Game) => {
  const playersSubmittedClues = Object.keys(
    gameClues[game.gameId][game.currentRoundIndex] || {}
  );
  const allActivePlayers = getActivePlayerNames(
    Object.values(gamePlayers[game.gameId])
  );

  if (!containsAll(playersSubmittedClues, allActivePlayers)) {
    return;
  }

  game.gameStatus = Status.VOTE;
};

const handleVoteStatus = (game: Game) => {
  const { gameId, currentRoundIndex } = game;
  const currentVotes = gameVotes[gameId][currentRoundIndex];
  const currentVoteCount = Object.keys(currentVotes || {}).length;
  const allActivePlayers = getActivePlayerNames(
    Object.values(gamePlayers[gameId])
  );

  if (allActivePlayers.length != currentVoteCount) {
    return;
  }

  const playerWithMostVotes = getPlayerWithMaxVotes(
    Object.values(currentVotes)
  );
  removePlayer(gameId, playerWithMostVotes);
  checkSpyStatus(game);

  incrementRound(gameId);
};

const removePlayer = (gameId: string, playerToRemove: string) => {
  gamePlayers[gameId][playerToRemove].isActive = false;
  gameEliminations[gameId].push(playerToRemove);
};

const checkSpyStatus = (game: Game) => {
  if (!game || game?.gameStatus === Status.WAITING) {
    return;
  }

  const { gameId, currentRoundIndex, maxRoundIndex } = game;

  const spiesAlive = hasSpies(gameId);

  if (
    (currentRoundIndex === maxRoundIndex ||
      Object.values(gamePlayers[gameId] || {}).filter(
        (player) => player.isActive
      ).length === 2) &&
    spiesAlive
  ) {
    game.gameStatus = Status.SPY_WON;
  } else if (!spiesAlive) {
    game.gameStatus = Status.CIVILIAN_WON;
  } else {
    game.gameStatus = Status.CLUE;
  }
};

const getPlayerWithMaxVotes = (arr: string[]) => {
  const map: { [key: string]: number } = {};
  const counts: { [key: string]: number } = arr.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1;
    return acc;
  }, map);

  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
};

const hasSpies = (gameId: string) => {
  return (
    Object.values(gamePlayers[gameId] || {}).filter(
      (player) => player.isActive && player.role === Role.SPY
    ).length > 0
  );
};

const getActivePlayerNames = (players: Player[]) => {
  return players
    .filter((player) => player.isActive)
    .map((player) => player.playerName);
};

const containsAll = (arr1: any[], arr2: any[]) =>
  arr2.every((arr2Item) => arr1.includes(arr2Item));

const getGameInfo = (gameId: string) => {
  const game = games?.[gameId];

  if (!game) {
    return null;
  }

  const players = gamePlayers[gameId];
  const shouldHideRole =
    game.gameStatus !== Status.CIVILIAN_WON &&
    game.gameStatus !== Status.SPY_WON;
  const hiddenPlayers: { [playerName: string]: Player } = {};
  if (shouldHideRole) {
    Object.keys(players || {}).forEach(
      (playerName) =>
        (hiddenPlayers[playerName] = {
          ...players[playerName],
          role: Role.HIDDEN,
        })
    );
  }

  return {
    gameId: game.gameId,
    gameStatus: game.gameStatus,
    currentRoundIndex: game.currentRoundIndex,
    maxRoundIndex: game.maxRoundIndex,
    players: shouldHideRole ? hiddenPlayers : players,
    playerOrder: gamePlayerOrders[gameId],
    clues: gameClues[gameId],
    votes: gameVotes[gameId],
    eliminatedPlayers: gameEliminations[gameId],
  };
};

export const service = {
  createGame,
  joinGame,
  leaveGame,
  startGame,
  restartGame,
  submitClue,
  submitVote,
  getWord,
  getGameInfo,
};
