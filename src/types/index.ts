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

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time?: string;
  status: string; // 'finished', 'live', 'upcoming'
  score?: {
    home: number;
    away: number;
  };
  competition: {
    id: string;
    name: string;
    logo: string;
  };
  venue?: string;
  fixture?: {
    date: string;
    status: {
      short: string;
    };
  };
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
}

export interface League {
  id: string;
  name: string;
  logo: string;
  country?: Country;
  highlights: MatchHighlight[];
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
}
