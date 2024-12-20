import { Game, Player, Status, Role, Clue, Vote, GameState } from '../types.js';

const games: { [gameId: string]: Game } = {};

const gamePlayers: { [gameId: string]: { [playerName: string]: Player } } = {};

const gamePlayerOrders: { [gameId: string]: string[] } = {};

const clues: { [gameId: string]: Clue[] } = {};

const votes: { [gameId: string]: Vote[] } = {};

export const createGame = (): string => {
  const gameId: string = generateGameId();

  games[gameId] = {
    gameId,
    civilianWord: 'car',
    spyWord: 'van',
    gameStatus: Status.WAITING,
    currentRoundIndex: -1,
    maxRoundIndex: 2,
  };
  gamePlayers[gameId] = {};
  gamePlayerOrders[gameId] = [];
  clues[gameId] = [];
  votes[gameId] = [];

  return gameId;
};

const generateGameId = (): string => (games['a'] ? 'b' : 'a'); // Math.random().toString(36).substring(3, 7);

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
  gamePlayerOrders[gameId] = gamePlayerOrders[gameId].filter(
    (player) => player != playerName
  );
  delete gamePlayers[gameId][playerName];
};

const startGame = (gameId: string) => {
  updateGameStatus(gameId);
  incrementRound(gameId);

  const players = gamePlayers[gameId];
  const shuffled = shufflePlayers(Object.keys(players));
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

  clues[gameId].push({});
  votes[gameId].push({});
};

const submitClue = (gameId: string, playerName: string, text: string) => {
  const round = games[gameId].currentRoundIndex;
  clues[gameId][round][playerName] = text;
  updateGameStatus(gameId);
};

const submitVote = (
  gameId: string,
  playerName: string,
  votedPlayerName: string
) => {
  const round = games[gameId].currentRoundIndex;
  votes[gameId][round][votedPlayerName] =
    votes[gameId][round][votedPlayerName] + 1 || 1;
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
  const status = game.gameStatus;

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

  // broadcast results if game ended?
};

const handleWaitingStatus = (game: Game) => {
  game.gameStatus = Status.CLUE;
};

const handleClueStatus = (game: Game) => {
  const playersSubmittedClues = Object.keys(
    clues[game.gameId][game.currentRoundIndex]
  );
  const allActivePlayers = getActivePlayerNames(
    Object.values(gamePlayers[game.gameId])
  );

  console.log(allActivePlayers);

  if (!containsAll(playersSubmittedClues, allActivePlayers)) {
    return;
  }

  game.gameStatus = Status.VOTE;
};

const handleVoteStatus = (game: Game) => {
  const currentVotes = votes[game.gameId][game.currentRoundIndex];
  const currentVoteCount = Object.values(currentVotes).reduce(
    (sum, vote) => sum + vote
  );
  const allActivePlayers = getActivePlayerNames(
    Object.values(gamePlayers[game.gameId])
  );

  if (allActivePlayers.length != currentVoteCount) {
    return;
  }

  const playerWithMostVotes = Object.keys(currentVotes).reduce((a, b) =>
    currentVotes[a] > currentVotes[b] ? a : b
  );
  gamePlayers[game.gameId][playerWithMostVotes].isActive = false;
  incrementRound(game.gameId);

  let numActivePlayers = 0;
  Object.values(gamePlayers[game.gameId]).forEach(
    (player) => numActivePlayers + (player.isActive ? 1 : 0)
  );

  game.gameStatus =
    game.currentRoundIndex === game.maxRoundIndex || numActivePlayers === 0
      ? Status.COMPLETE
      : Status.CLUE;
};

const didCiviliansWin = (gameId: string) => {
  let numActiveSpies = 0;
  Object.values(gamePlayers[gameId]).forEach(
    (player) =>
      numActiveSpies + (player.role === Role.SPY && player.isActive ? 1 : 0)
  );

  return numActiveSpies === 0;
};

const getActivePlayerNames = (players: Player[]) => {
  return players
    .filter((player) => player.isActive)
    .map((player) => player.playerName);
};

const containsAll = (arr1: any[], arr2: any[]) =>
  arr2.every((arr2Item) => arr1.includes(arr2Item));

const getGameInfo = (gameId: string) => {
  const game = games[gameId];
  return {
    gameId: game.gameId,
    gameStatus: game.gameStatus,
    currentRoundIndex: game.currentRoundIndex,
    maxRoundIndex: game.maxRoundIndex,
    players: gamePlayers[gameId],
    playerOrder: gamePlayerOrders[gameId],
    clues: clues[gameId],
    votes: votes[gameId],
  };
};

export const service = {
  createGame,
  joinGame,
  leaveGame,
  startGame,
  submitClue,
  submitVote,
  getWord,
  getGameInfo,
  didCiviliansWin,
};
