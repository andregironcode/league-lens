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
  date?: string;
  time?: string;
  timestamp?: number;
  timezone?: string;
  // Original status fields (keeping for backward compatibility)
  status?: string | { short?: string; long?: string; elapsed?: number };
  fixture?: {
    status?: { short?: string; long?: string; elapsed?: number };
    date?: string;
    time?: string;
    timestamp?: number;
    score?: FixtureScore;
    events?: MatchEvent[];
  };
  // New state object from Highlightly API
  state?: {
    description?: string;
    clock?: number;
    score?: {
      current?: string;
      penalties?: string | null;
    };
  };
  league?: {
    id: string | number;
    name: string;
    logo?: string;
    season?: string | number;
    round?: string;
  };
  // Support both competition and league properties (API might use either)
  competition?: {
    id: string | number;
    name: string;
    logo?: string;
    season?: string | number;
    round?: string;
  };
  // Support both direct team objects and teams container
  homeTeam?: MatchTeam;
  awayTeam?: MatchTeam;
  teams?: {
    home?: MatchTeam;
    away?: MatchTeam;
  };
  // Support all possible score formats
  score?: {
    halftime?: string | { home?: number; away?: number };
    fulltime?: string | { home?: number; away?: number };
    extratime?: string | { home?: number; away?: number } | null;
    penalty?: string | { home?: number; away?: number } | null;
    home?: number;
    away?: number;
    current?: string;
    penalties?: string;
  };
  goals?: {
    home: number;
    away: number;
  };
  events?: MatchEvent[];
  highlights?: MatchHighlight[];
  // Support single highlight object
  highlight?: {
    videoUrl?: string;
    url?: string;
  };
  // Support direct video properties
  video?: string;
  videoUrl?: string;
  venue?: {
    id: string;
    name: string;
    city: string;
  };
  lineups?: any[];
}

export interface MatchHighlight {
  id: string;
  title: string;
  date?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: string;
  views?: number;
  homeTeam?: Team;
  awayTeam?: Team;
  score?: {
    home?: number;
    away?: number;
    current?: string;
    penalties?: string;
  };
  competition?: {
    id: string;
    name: string;
    logo: string;
  };
  status?: { short?: string; long?: string; elapsed?: number };
  
  // Additional properties from Highlightly API
  type?: 'VERIFIED' | 'UNVERIFIED';
  imgUrl?: string;
  description?: string;
  url?: string;
  embedUrl?: string;
  channel?: string;
  source?: 'youtube' | 'other' | string;
  match?: {
    id: string;
    round?: string;
    date?: string;
    country?: Country;
    awayTeam?: Team;
    homeTeam?: Team;
    league?: {
      id: string;
      logo: string;
      name: string;
      season?: number;
    };
  };
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
  league?: {
    id: string;
    name: string;
    logo: string;
    season?: string;
  };
  leagueStanding: string;
  europeanCompetition: string | null;
  europeanStanding: string | null;
  leagueTable: TableRow[];
  europeanTable: TableRow[];
  fixtures: Fixture[];
  // Recent matches with full scoreline details
  recentMatches: Match[];
  // Raw API data references
  apiData?: {
    teamInfo?: any;
    teamStats?: any;
    lastFiveGames?: any;
    standings?: any;
  };
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
  totalCleanSheets: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  biggestWin: Match | null;
  mostFrequentScorelines: { scoreline: string; count: number }[];
}

export interface MatchStatistic {
  type: string;
}
