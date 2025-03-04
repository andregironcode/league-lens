export interface Team {
  id: string;
  name: string;
  logo: string;
  url?: string;
}

export interface MatchHighlight {
  id: string;
  title: string;
  date: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  videoUrl?: string;
  duration?: string;
  views?: number;
  homeTeam: Team;
  awayTeam: Team;
  team1?: Team;
  team2?: Team;
  score: {
    home: number;
    away: number;
  };
  competition: {
    id?: string;
    name: string;
    logo?: string;
    url?: string;
  } | string;
  videos?: Array<{
    id?: string;
    title?: string;
    embed?: string;
  }>;
  matchviewUrl?: string;
  competitionUrl?: string;
  matchId?: string;
  embed?: string;
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

export interface ScorebatVideo {
  id: string;
  title: string;
  embed: string;
  url: string;
  thumbnail: string;
  date: string;
  competition: {
    id?: string;
    name: string;
    url?: string;
  };
  matchviewUrl: string;
  competitionUrl?: string;
  team1: {
    name: string;
    url: string;
  };
  team2: {
    name: string;
    url: string;
  };
  videos?: any[];
  side1?: {
    name: string;
    url: string;
  };
  side2?: {
    name: string;
    url: string;
  };
  matchId?: string;
  image?: string;
}

export interface ScorebatResponse {
  data: ScorebatVideo[];
}

export interface ScorebatMapper {
  mapToMatchHighlight: (video: ScorebatVideo) => MatchHighlight;
  mapToLeagues: (videos: ScorebatVideo[]) => League[];
}
