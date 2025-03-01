
import { League, MatchHighlight, TeamDetails } from "@/types";

// Match Highlights Data
export const matchHighlightsData: MatchHighlight[] = [
  {
    id: "1",
    title: "Barcelona vs Real Madrid - El Clasico Highlights",
    date: "2023-10-28T19:00:00Z",
    thumbnailUrl: "https://example.com/thumbnail1.jpg",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: "10:35",
    views: 1500000,
    homeTeam: {
      id: "101",
      name: "Barcelona",
      logo: "https://media.api-sports.io/football/teams/529.png"
    },
    awayTeam: {
      id: "102",
      name: "Real Madrid",
      logo: "https://media.api-sports.io/football/teams/541.png"
    },
    score: {
      home: 2,
      away: 1
    },
    competition: {
      id: "201",
      name: "La Liga",
      logo: "https://media.api-sports.io/football/leagues/140.png"
    }
  },
  {
    id: "2",
    title: "Manchester United vs Liverpool - Premier League Classic",
    date: "2023-10-22T15:30:00Z",
    thumbnailUrl: "https://example.com/thumbnail2.jpg",
    videoUrl: "https://www.youtube.com/watch?v=example2",
    duration: "8:42",
    views: 1200000,
    homeTeam: {
      id: "103",
      name: "Manchester United",
      logo: "https://media.api-sports.io/football/teams/33.png"
    },
    awayTeam: {
      id: "104",
      name: "Liverpool",
      logo: "https://media.api-sports.io/football/teams/40.png"
    },
    score: {
      home: 0,
      away: 3
    },
    competition: {
      id: "202",
      name: "Premier League",
      logo: "https://media.api-sports.io/football/leagues/39.png"
    }
  },
  {
    id: "3",
    title: "Bayern Munich vs Borussia Dortmund - Der Klassiker",
    date: "2023-10-15T17:00:00Z",
    thumbnailUrl: "https://example.com/thumbnail3.jpg",
    videoUrl: "https://www.youtube.com/watch?v=example3",
    duration: "9:15",
    views: 980000,
    homeTeam: {
      id: "105",
      name: "Bayern Munich",
      logo: "https://media.api-sports.io/football/teams/157.png"
    },
    awayTeam: {
      id: "106",
      name: "Borussia Dortmund",
      logo: "https://media.api-sports.io/football/teams/165.png"
    },
    score: {
      home: 4,
      away: 0
    },
    competition: {
      id: "203",
      name: "Bundesliga",
      logo: "https://media.api-sports.io/football/leagues/78.png"
    }
  }
];

// Leagues Data
export const leaguesData: League[] = [
  {
    id: "201",
    name: "La Liga",
    logo: "https://media.api-sports.io/football/leagues/140.png",
    highlights: matchHighlightsData.filter(match => match.competition.id === "201")
  },
  {
    id: "202",
    name: "Premier League",
    logo: "https://media.api-sports.io/football/leagues/39.png",
    highlights: matchHighlightsData.filter(match => match.competition.id === "202")
  },
  {
    id: "203",
    name: "Bundesliga",
    logo: "https://media.api-sports.io/football/leagues/78.png",
    highlights: matchHighlightsData.filter(match => match.competition.id === "203")
  }
];

// Team Details Data
export const teamDetailsData: TeamDetails[] = [
  {
    team: {
      id: "101",
      name: "Barcelona",
      logo: "https://media.api-sports.io/football/teams/529.png"
    },
    leagueStanding: "2nd",
    europeanCompetition: "Champions League",
    europeanStanding: "Group Stage - 1st",
    leagueTable: [
      {
        position: 1,
        team: {
          id: "102",
          name: "Real Madrid",
          logo: "https://media.api-sports.io/football/teams/541.png"
        },
        played: 10,
        won: 8,
        drawn: 1,
        lost: 1,
        goalsFor: 22,
        goalsAgainst: 8,
        goalDifference: 14,
        points: 25
      },
      {
        position: 2,
        team: {
          id: "101",
          name: "Barcelona",
          logo: "https://media.api-sports.io/football/teams/529.png"
        },
        played: 10,
        won: 7,
        drawn: 2,
        lost: 1,
        goalsFor: 24,
        goalsAgainst: 10,
        goalDifference: 14,
        points: 23
      }
    ],
    europeanTable: [
      {
        position: 1,
        team: {
          id: "101",
          name: "Barcelona",
          logo: "https://media.api-sports.io/football/teams/529.png"
        },
        played: 3,
        won: 3,
        drawn: 0,
        lost: 0,
        goalsFor: 8,
        goalsAgainst: 2,
        goalDifference: 6,
        points: 9
      }
    ],
    fixtures: [
      {
        id: "f101",
        homeTeam: {
          id: "101",
          name: "Barcelona",
          logo: "https://media.api-sports.io/football/teams/529.png"
        },
        awayTeam: {
          id: "107",
          name: "Sevilla",
          logo: "https://media.api-sports.io/football/teams/536.png"
        },
        date: "2023-11-05T19:00:00Z",
        competition: "La Liga",
        venue: "Camp Nou"
      }
    ]
  }
];
