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

// New types for Scorebat API
export interface ScorebatVideo {
  id: string;
  title: string;
  embed: string;
  url: string;
  thumbnail: string;
  date: string;
  competition: {
    id: string;
    name: string;
    url: string;
  };
  matchviewUrl: string;
  competitionUrl: string;
  team1: {
    name: string;
    url: string;
  };
  team2: {
    name: string;
    url: string;
  };
}

export interface ScorebatResponse {
  data: ScorebatVideo[];
}

// Helper interface to convert Scorebat data to our format
export interface ScorebatMapper {
  mapToMatchHighlight: (video: ScorebatVideo) => MatchHighlight;
  mapToLeagues: (videos: ScorebatVideo[]) => League[];
}
