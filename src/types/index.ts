
export interface Team {
  id: string;
  name: string;
  logo: string;
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
  highlights: MatchHighlight[];
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

// Adding types for ScoreBat API
export interface ScoreBatVideo {
  id: string;
  title: string;
  embed: string;
}

export interface ScoreBatMatch {
  title: string;
  competition: string;
  matchviewUrl: string;
  competitionUrl: string;
  thumbnail: string;
  date: string;
  videos: ScoreBatVideo[];
}
