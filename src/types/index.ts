
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
