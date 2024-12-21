export interface Game {
  gameId: string;
  civilianWord: string;
  spyWord: string;
  gameStatus: Status;
  currentRoundIndex: number;
  maxRoundIndex: number;
}

export interface PlayerClient {
  gameId: string;
  playerName: string;
}

export interface Player {
  playerName: string;
  role: Role;
  isActive: boolean;
}

export enum Status {
  WAITING = 'WAITING',
  CLUE = 'CLUE',
  VOTE = 'VOTE',
  COMPLETE = 'COMPLETE',
}

export enum Role {
  CIVILIAN = 'CIVILIAN',
  SPY = 'SPY',
}

export interface Clue {
  [playerName: string]: string;
}

export interface Vote {
  [votedPlayerName: string]: number;
}

export interface GameState {
  gameId: string;
  gameStatus: Status;
  currentRoundIndex: number;
  maxRoundIndex: number;
  players: Player[];
  playerOrder: string[];
  clues: Clue[];
  votes: Vote[];
  winner?: Role;
}

export enum MessageType {
  CONNECTED = 'CONNECTED',
}

export type Message = CreateGameRequest | JoinGameRequest;

export interface GameConnectedRequest {
  type: MessageType.CONNECTED;
  gameId: string;
  playerName: string;
}

export interface CreateGameRequest {
  playerName: string;
}

export interface JoinGameRequest {
  gameId: string;
  playerName: string;
}

export interface StartGameRequest {
  gameId: string;
}

export interface ClueRequest {
  gameId: string;
  playerName: string;
  clue: string;
}

export interface VoteRequest {
  gameId: string;
  playerName: string;
  vote: string;
}

export enum ErrorType {
  INVALID_GAME_ID = 'INVALID_GAME_ID',
  PLAYER_EXISTS = 'PLAYER_EXISTS',
}

export interface ErrorMessage {
  type: ErrorType;
}
