export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface Country {
  code: string;
  name: string;
  logo?: string;
}

export interface FixtureScore {
  home?: number;
  away?: number;
  fulltime?: {
    home: number;
    away: number;
  };
  final?: {
    home: number;
    away: number;
  };
}

export interface Match {
  id: string | number;
  date: string;
  time?: string;
  timestamp?: number;
  timezone?: string;
  status?: string | { short?: string; long?: string; elapsed?: number }; // Support both string and object format
  fixture?: {
    status?: { short?: string; long?: string; elapsed?: number };
    date?: string;
  };
  league: {
    id: string | number;
    name: string;
    logo?: string;
    season?: string | number;
    round?: string;
  };
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  score?: {
    halftime?: string;
    fulltime?: string;
    extratime?: string | null;
    penalty?: string | null;
  };
  goals?: {
    home: number | null;
    away: number | null;
  };
  events?: any[];
  highlights?: MatchHighlight[];
  state?: MatchState;
  round?: string;
  country?: Country;
}

export interface MatchHighlight {
  id: string;
  title: string;
  date: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  views: number;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    home: number;
    away: number;
  };
  competition: {
    id: string;
    name: string;
    logo: string;
  };
  status?: { short?: string; long?: string; elapsed?: number };
}

export interface League {
  id: string;
  name: string;
  logo: string;
  country?: Country;
  seasons?: { season: number; startDate?: string; endDate?: string }[];
  highlights: MatchHighlight[];
}

export interface Season {
  season: number;
  startDate?: string;
  endDate?: string;
}

export interface MatchTeam {
  id: string | number;
  name: string;
  logo: string;
}

export interface MatchState {
  status: string;
  description: string;
  minute?: number;
  ftScore?: string;
  htScore?: string;
  score?: {
    current?: string;
    penalties?: string;
    halfTime?: string;
    fullTime?: string;
  };
}

export interface MatchEvent {
  team: Team;
  time: string;
  type: string;
  player: string;
  assist?: string;
  substituted?: string;
}

export interface EnhancedMatchHighlight extends MatchHighlight {
  lineups?: Lineups;
  statistics?: TeamStatistics[];
  events?: MatchEvent[];
  status?: { short?: string; long?: string; elapsed?: number };
}

export interface LeagueWithMatches {
  id: string;
  name: string;
  logo: string;
  country?: Country;
  matches: Match[];
}

export interface TableRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Fixture {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  competition: string;
  venue?: string;
}

export interface TeamDetails {
  team: Team;
  leagueStanding: string;
  europeanCompetition: string | null;
  europeanStanding: string | null;
  leagueTable: TableRow[];
  europeanTable: TableRow[];
  fixtures: Fixture[];
}

export interface Player {
  name: string;
  number: number;
  position: string;
}

export interface Lineups {
  homeTeam: {
    id: string;
    name: string;
    logo: string;
    formation: string;
    initialLineup: Player[][];
    substitutes: Player[];
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string;
    formation: string;
    initialLineup: Player[][];
    substitutes: Player[];
  };
}

export interface MatchStatistic {
  value: number | string;
  displayName: string;
}

export interface TeamStatistics {
  team: Team;
  statistics: MatchStatistic[];
}

export interface CalculatedSeasonStats {
  totalMatchesPlayed: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  drawPercentage: number;
  cleanSheetsTotal: number;
  matchesWithAtLeastOneCleanSheet: number;
  cleanSheetRate: number;
  frequentScorelines: { score: string; count: number }[];
  biggestMatch: Match | null;
}

export interface StandingsRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueInfo {
  id: string;
  name: string;
  type: string;
  logo: string;
}

export interface LeagueResponseItem {
  league: LeagueInfo;
  country: Country;
  seasons: Season[];
}

export interface LeagueStatistics {
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  cleanSheetRate: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  biggestWin: Match | null;
}

export interface MatchStatistic {
  type: string;
}
