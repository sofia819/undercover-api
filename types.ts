export interface Game {
  gameId: string;
  civilianWord: string;
  spyWord: string;
  gameStatus: Status;
  currentRoundIndex: number;
  maxRoundIndex: number;
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
