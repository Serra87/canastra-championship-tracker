
// Tournament types

export type TeamId = string;
export type RoundId = string;
export type MatchId = string;

export interface Player {
  id: string;
  name: string;
  contact?: string;
}

export interface Team {
  id: TeamId;
  name: string;
  players: Player[];
  lives: number;
  eliminated: boolean;
  reregistered: boolean;
}

export enum MatchStatus {
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED"
}

export interface Match {
  id: MatchId;
  roundId: RoundId;
  teamOneId: TeamId;
  teamTwoId: TeamId;
  teamOneScore: number;
  teamTwoScore: number;
  winner?: TeamId;
  loser?: TeamId;
  status: MatchStatus;
  startTime?: Date;
  endTime?: Date;
}

export interface Round {
  id: RoundId;
  roundNumber: number;
  matches: Match[];
  completed: boolean;
  createdAt: Date;
}

export interface Tournament {
  id: string;
  name: string;
  teams: Team[];
  rounds: Round[];
  currentRound: number;
}
