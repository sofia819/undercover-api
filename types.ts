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
  waiting,
  clue,
  vote,
  complete,
}

export enum Role {
  civilian,
  spy,
}

export interface Clue {
  [playerName: string]: string;
}

export interface Vote {
  [votedPlayerName: string]: number;
}

export interface GameState {
  roundIndex: number;
  players: Player[];
  clues: Clue[];
  votes: Vote[];
  gameStatus: Status;
  winner?: Role;
}
