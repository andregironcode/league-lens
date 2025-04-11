import { MatchHighlight, League, Team, TableRow, Fixture, TeamDetails } from '@/types';

// New function to fetch data from ScoreBat API for Premier League
export const fetchPremierLeagueFromScoreBat = async (): Promise<any> => {
  try {
    const response = await fetch('https://www.scorebat.com/video-api/v3/competition/england-premier-league/?token=MTk1NDQ4XzE3NDExMTE1MDBfMzZhOThmNzNlODQ0ODk1NTA2NzFhNWE0YTJjZjE5NWU0MWFhMzY1MA==');
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('ScoreBat API Response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching from ScoreBat:', error);
    throw error;
  }
};

// In a real application, this would be fetched from an actual API
// For now, we'll use mock data to simulate the API response

export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: '1',
      title: 'Manchester City vs Arsenal',
      date: '2023-04-26T19:30:00Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGZvb3RiYWxsfGVufDB8fDB8fHww',
      videoUrl: 'https://www.youtube.com/watch?v=38qkI3jAl68',
      duration: '10:24',
      views: 1243000,
      homeTeam: {
        id: 'mci',
        name: 'Manchester City',
        logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
      },
      awayTeam: {
        id: 'ars',
        name: 'Arsenal',
        logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
      },
      score: {
        home: 4,
        away: 1
      },
      competition: {
        id: 'pl',
        name: 'Premier League',
        logo: '/leagues/premierleague.png'
      }
    },
    {
      id: '2',
      title: 'Barcelona vs Real Madrid',
      date: '2023-04-25T19:00:00Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGZvb3RiYWxsfGVufDB8fDB8fHww',
      videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
      duration: '12:08',
      views: 3567000,
      homeTeam: {
        id: 'fcb',
        name: 'Barcelona',
        logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
      },
      awayTeam: {
        id: 'rma',
        name: 'Real Madrid',
        logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
      },
      score: {
        home: 2,
        away: 3
      },
      competition: {
        id: 'laliga',
        name: 'La Liga',
        logo: '/leagues/laliga.png'
      }
    },
    {
      id: '3',
      title: 'Bayern Munich vs Borussia Dortmund',
      date: '2023-04-23T16:30:00Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vdGJhbGx8ZW58MHx8MHx8fDA%3D',
      videoUrl: 'https://www.youtube.com/watch?v=sApmPP5ku5k',
      duration: '9:45',
      views: 1876000,
      homeTeam: {
        id: 'bay',
        name: 'Bayern Munich',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
      },
      awayTeam: {
        id: 'bvb',
        name: 'Borussia Dortmund',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'
      },
      score: {
        home: 3,
        away: 2
      },
      competition: {
        id: 'bundesliga',
        name: 'Bundesliga',
        logo: '/leagues/bundesliga.png'
      }
    }
  ];
};

export const getLeagueHighlights = async (): Promise<League[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      id: 'pl',
      name: 'Premier League',
      logo: '/leagues/premierleague.png',
      highlights: [
        {
          id: '1',
          title: 'Manchester City vs Arsenal',
          date: '2023-04-26T19:30:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGZvb3RiYWxsfGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=38qkI3jAl68',
          duration: '10:24',
          views: 1243000,
          homeTeam: {
            id: 'mci',
            name: 'Manchester City',
            logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
          },
          awayTeam: {
            id: 'ars',
            name: 'Arsenal',
            logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
          },
          score: {
            home: 4,
            away: 1
          },
          competition: {
            id: 'pl',
            name: 'Premier League',
            logo: '/leagues/premierleague.png'
          }
        },
        {
          id: '4',
          title: 'Liverpool vs Manchester United',
          date: '2023-04-22T14:00:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1624526267942-d3a588c5f88d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTN8fGZvb3RiYWxsfGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '11:32',
          views: 2345000,
          homeTeam: {
            id: 'liv',
            name: 'Liverpool',
            logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'
          },
          awayTeam: {
            id: 'manu',
            name: 'Manchester United',
            logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg'
          },
          score: {
            home: 3,
            away: 1
          },
          competition: {
            id: 'pl',
            name: 'Premier League',
            logo: '/leagues/premierleague.png'
          }
        },
        {
          id: '7',
          title: 'Chelsea vs Tottenham',
          date: '2023-04-20T19:45:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGZvb3RiYWxsfGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '9:48',
          views: 1129000,
          homeTeam: {
            id: 'che',
            name: 'Chelsea',
            logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'
          },
          awayTeam: {
            id: 'tot',
            name: 'Tottenham',
            logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg'
          },
          score: {
            home: 2,
            away: 2
          },
          competition: {
            id: 'pl',
            name: 'Premier League',
            logo: '/leagues/premierleague.png'
          }
        }
      ]
    },
    {
      id: 'laliga',
      name: 'La Liga',
      logo: '/leagues/laliga.png',
      highlights: [
        {
          id: '2',
          title: 'Barcelona vs Real Madrid',
          date: '2023-04-25T19:00:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGZvb3RiYWxsfGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '12:08',
          views: 3567000,
          homeTeam: {
            id: 'fcb',
            name: 'Barcelona',
            logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
          },
          awayTeam: {
            id: 'rma',
            name: 'Real Madrid',
            logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
          },
          score: {
            home: 2,
            away: 3
          },
          competition: {
            id: 'laliga',
            name: 'La Liga',
            logo: '/leagues/laliga.png'
          }
        },
        {
          id: '5',
          title: 'Atletico Madrid vs Sevilla',
          date: '2023-04-23T18:15:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1602674535813-8c3b7a8bf481?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzh8fGZvb3RiYWxsfGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '8:56',
          views: 987000,
          homeTeam: {
            id: 'atm',
            name: 'Atletico Madrid',
            logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg'
          },
          awayTeam: {
            id: 'sev',
            name: 'Sevilla',
            logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg'
          },
          score: {
            home: 2,
            away: 0
          },
          competition: {
            id: 'laliga',
            name: 'La Liga',
            logo: '/leagues/laliga.png'
          }
        }
      ]
    },
    {
      id: 'bundesliga',
      name: 'Bundesliga',
      logo: '/leagues/bundesliga.png',
      highlights: [
        {
          id: '3',
          title: 'Bayern Munich vs Borussia Dortmund',
          date: '2023-04-23T16:30:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vdGJhbGx8ZW58MHx8MHx8fDA%3D',
          videoUrl: 'https://www.youtube.com/watch?v=sApmPP5ku5k',
          duration: '9:45',
          views: 1876000,
          homeTeam: {
            id: 'bay',
            name: 'Bayern Munich',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
          },
          awayTeam: {
            id: 'bvb',
            name: 'Borussia Dortmund',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'
          },
          score: {
            home: 3,
            away: 2
          },
          competition: {
            id: 'bundesliga',
            name: 'Bundesliga',
            logo: '/leagues/bundesliga.png'
          }
        },
        {
          id: '6',
          title: 'RB Leipzig vs Bayer Leverkusen',
          date: '2023-04-22T13:30:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1624644128945-212a5dc6eb12?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTB8fGZvb3RiYWxsfGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '10:11',
          views: 765000,
          homeTeam: {
            id: 'rbl',
            name: 'RB Leipzig',
            logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg'
          },
          awayTeam: {
            id: 'b04',
            name: 'Bayer Leverkusen',
            logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg'
          },
          score: {
            home: 1,
            away: 1
          },
          competition: {
            id: 'bundesliga',
            name: 'Bundesliga',
            logo: '/leagues/bundesliga.png'
          }
        }
      ]
    },
    // Adding Serie A
    {
      id: 'seriea',
      name: 'Serie A',
      logo: '/leagues/seriea.png',
      highlights: [
        {
          id: '8',
          title: 'Inter Milan vs AC Milan',
          date: '2023-04-18T19:00:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1559579313-021b6ec9f6d6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fHNvY2NlciUyMGl0YWx5fGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=sApmPP5ku5k',
          duration: '10:15',
          views: 1543000,
          homeTeam: {
            id: 'int',
            name: 'Inter Milan',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'
          },
          awayTeam: {
            id: 'acm',
            name: 'AC Milan',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'
          },
          score: {
            home: 2,
            away: 1
          },
          competition: {
            id: 'seriea',
            name: 'Serie A',
            logo: '/leagues/seriea.png'
          }
        },
        {
          id: '9',
          title: 'Juventus vs Napoli',
          date: '2023-04-16T14:00:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fHNvY2NlciUyMGl0YWx5fGVufDB8fDB8fHww',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '9:45',
          views: 1354000,
          homeTeam: {
            id: 'juv',
            name: 'Juventus',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg'
          },
          awayTeam: {
            id: 'nap',
            name: 'Napoli',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Napoli_logo.svg'
          },
          score: {
            home: 1,
            away: 1
          },
          competition: {
            id: 'seriea',
            name: 'Serie A',
            logo: '/leagues/seriea.png'
          }
        }
      ]
    },
    // Adding Ligue 1
    {
      id: 'ligue1',
      name: 'Ligue 1',
      logo: '/leagues/ligue1.png',
      highlights: [
        {
          id: '10',
          title: 'PSG vs Marseille',
          date: '2023-04-17T20:00:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1522778034537-20a2486be803?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fHNvY2NlciUyMGZyYW5jZXxlbnwwfHwwfHx8MA%3D%3D',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '11:32',
          views: 2135000,
          homeTeam: {
            id: 'psg',
            name: 'Paris Saint-Germain',
            logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'
          },
          awayTeam: {
            id: 'mar',
            name: 'Marseille',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg'
          },
          score: {
            home: 3,
            away: 0
          },
          competition: {
            id: 'ligue1',
            name: 'Ligue 1',
            logo: '/leagues/ligue1.png'
          }
        },
        {
          id: '11',
          title: 'Lyon vs Monaco',
          date: '2023-04-15T16:00:00Z',
          thumbnailUrl: 'https://images.unsplash.com/photo-1504016798967-59a258e9386d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHNvY2NlciUyMGZyYW5jZXxlbnwwfHwwfHx8MA%3D%3D',
          videoUrl: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
          duration: '9:12',
          views: 982000,
          homeTeam: {
            id: 'lyo',
            name: 'Lyon',
            logo: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg'
          },
          awayTeam: {
            id: 'mon',
            name: 'Monaco',
            logo: 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg'
          },
          score: {
            home: 2,
            away: 2
          },
          competition: {
            id: 'ligue1',
            name: 'Ligue 1',
            logo: '/leagues/ligue1.png'
          }
        }
      ]
    }
  ];
};

// Method to get a match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // First, check recommended highlights
  const recommendedHighlights = await getRecommendedHighlights();
  const matchFromRecommended = recommendedHighlights.find(match => match.id === id);
  if (matchFromRecommended) return matchFromRecommended;
  
  // Then check all league highlights
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    const matchFromLeague = league.highlights.find(match => match.id === id);
    if (matchFromLeague) return matchFromLeague;
  }
  
  // If not found in any list
  return null;
};

// Method to get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const highlights: MatchHighlight[] = [];
  
  // First, check recommended highlights
  const recommendedHighlights = await getRecommendedHighlights();
  const teamHighlightsFromRecommended = recommendedHighlights.filter(
    highlight => highlight.homeTeam.id === teamId || highlight.awayTeam.id === teamId
  );
  highlights.push(...teamHighlightsFromRecommended);
  
  // Then check all league highlights
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    const teamHighlightsFromLeague = league.highlights.filter(
      highlight => highlight.homeTeam.id === teamId || highlight.awayTeam.id === teamId
    );
    highlights.push(...teamHighlightsFromLeague);
  }
  
  // Sort by date, most recent first
  return highlights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Method to get team details including standings and fixtures
export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // First find the team in our existing data
  let team: Team | null = null;
  
  // Check recommended highlights
  const recommendedHighlights = await getRecommendedHighlights();
  for (const highlight of recommendedHighlights) {
    if (highlight.homeTeam.id === teamId) {
      team = highlight.homeTeam;
      break;
    }
    if (highlight.awayTeam.id === teamId) {
      team = highlight.awayTeam;
      break;
    }
  }
  
  // If not found, check league highlights
  if (!team) {
    const leagues = await getLeagueHighlights();
    outerLoop: for (const league of leagues) {
      for (const highlight of league.highlights) {
        if (highlight.homeTeam.id === teamId) {
          team = highlight.homeTeam;
          break outerLoop;
        }
        if (highlight.awayTeam.id === teamId) {
          team = highlight.awayTeam;
          break outerLoop;
        }
      }
    }
  }
  
  if (!team) return null;
  
  // Find which league this team belongs to
  let teamLeague = '';
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    const hasTeam = league.highlights.some(
      highlight => highlight.homeTeam.id === teamId || highlight.awayTeam.id === teamId
    );
    if (hasTeam) {
      teamLeague = league.name;
      break;
    }
  }
  
  // Create mock data for team details
  let europeanCompetition: string | null = null;
  
  // Assign European competition based on team ID
  switch (teamId) {
    case 'mci':
    case 'liv':
    case 'fcb':
    case 'rma':
    case 'bay':
      europeanCompetition = 'UEFA Champions League';
      break;
    case 'ars':
    case 'che':
    case 'atm':
      europeanCompetition = 'UEFA Europa League';
      break;
    case 'tot':
    case 'sev':
      europeanCompetition = 'UEFA Conference League';
      break;
    default:
      europeanCompetition = null;
  }
  
  // Generate league table with the team in a realistic position
  const leagueTable: TableRow[] = generateLeagueTable(teamId, teamLeague);
  
  // Generate European table if applicable
  const europeanTable: TableRow[] = europeanCompetition 
    ? generateEuropeanTable(teamId, europeanCompetition) 
    : [];
  
  // Get the position of the team in the league table
  const teamLeaguePosition = leagueTable.find(row => row.team.id === teamId)?.position || 0;
  const teamEuropeanPosition = europeanTable.find(row => row.team.id === teamId)?.position || 0;
  
  // Generate fixtures
  const fixtures: Fixture[] = generateFixtures(teamId, teamLeague, europeanCompetition);
  
  return {
    team,
    leagueStanding: `${teamLeaguePosition}${getOrdinalSuffix(teamLeaguePosition)}`,
    europeanCompetition,
    europeanStanding: europeanCompetition ? `${teamEuropeanPosition}${getOrdinalSuffix(teamEuropeanPosition)}` : null,
    leagueTable,
    europeanTable,
    fixtures
  };
};

// Helper function to get ordinal suffix for numbers
const getOrdinalSuffix = (i: number): string => {
  const j = i % 10,
        k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

// Generate a realistic league table
const generateLeagueTable = (teamId: string, leagueName: string): TableRow[] => {
  const teamIds = {
    premier_league: ['mci', 'liv', 'ars', 'manu', 'tot', 'che'],
    la_liga: ['rma', 'fcb', 'atm', 'sev'],
    bundesliga: ['bay', 'bvb', 'rbl', 'b04']
  };
  
  let teams: Team[] = [];
  
  // Get team data based on the league
  switch (leagueName) {
    case 'Premier League':
      teams = [
        { id: 'mci', name: 'Manchester City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
        { id: 'liv', name: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
        { id: 'ars', name: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
        { id: 'manu', name: 'Manchester United', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
        { id: 'tot', name: 'Tottenham', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
        { id: 'che', name: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
        { id: 'avl', name: 'Aston Villa', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg' },
        { id: 'new', name: 'Newcastle', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg' }
      ];
      break;
    case 'La Liga':
      teams = [
        { id: 'rma', name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
        { id: 'fcb', name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
        { id: 'atm', name: 'Atletico Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
        { id: 'sev', name: 'Sevilla', logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' },
        { id: 'vil', name: 'Villarreal', logo: 'https://upload.wikimedia.org/wikipedia/en/4/4b/Villarreal_CF_badge.svg' },
        { id: 'rso', name: 'Real Sociedad', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg' }
      ];
      break;
    case 'Bundesliga':
      teams = [
        { id: 'bay', name: 'Bayern Munich', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
        { id: 'bvb', name: 'Borussia Dortmund', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg' },
        { id: 'rbl', name: 'RB Leipzig', logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg' },
        { id: 'b04', name: 'Bayer Leverkusen', logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
        { id: 'bmg', name: 'Borussia Monchengladbach', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg' },
        { id: 'wob', name: 'Wolfsburg', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg' }
      ];
      break;
    default:
      teams = [];
  }
  
  // Make sure our team is in the list
  const teamIndex = teams.findIndex(team => team.id === teamId);
  if (teamIndex === -1) {
    // If the requested team is not part of our standard teams for this league,
    // add a generic one
    teams.push({
      id: teamId,
      name: "Team " + teamId.toUpperCase(),
      logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
    });
  }
  
  // Generate standings, favoring the requested team to be in top 4
  const targetPosition = Math.min(Math.floor(Math.random() * 4) + 1, teams.length);
  
  // Create table rows
  const tableRows: TableRow[] = [];
  
  // Shuffle teams (except put the target team in its position)
  teams = teams.filter(team => team.id !== teamId);
  const shuffled = [...teams].sort(() => 0.5 - Math.random());
  
  // Insert the target team at its position
  shuffled.splice(targetPosition - 1, 0, teams.find(team => team.id === teamId) || {
    id: teamId,
    name: "Team " + teamId.toUpperCase(),
    logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
  });
  
  // Generate the table
  shuffled.forEach((team, index) => {
    const position = index + 1;
    
    // Generate random but realistic stats
    const played = 38; // Full season
    const baseWins = Math.floor(Math.random() * 8) + 8; // 8-15 wins
    
    // Teams at the top win more
    const positionFactor = Math.max(0, (teams.length - position) / teams.length);
    const additionalWins = Math.floor(positionFactor * 12); // Up to 12 more wins for top teams
    
    const won = baseWins + additionalWins;
    const drawn = Math.floor(Math.random() * 10) + 2; // 2-11 draws
    const lost = played - won - drawn;
    
    const goalsFor = won * 2 + drawn + Math.floor(Math.random() * 10);
    const goalsAgainst = lost * 2 + drawn - Math.floor(Math.random() * 5) + 5;
    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn;
    
    tableRows.push({
      position,
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points
    });
  });
  
  // Sort by points, then goal difference
  return tableRows.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }).map((row, index) => ({
    ...row,
    position: index + 1
  }));
};

// Generate a European competition table
const generateEuropeanTable = (teamId: string, competition: string): TableRow[] => {
  let teams: Team[] = [];
  
  // Different teams for different competitions
  switch (competition) {
    case 'UEFA Champions League':
      teams = [
        { id: 'mci', name: 'Manchester City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
        { id: 'liv', name: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
        { id: 'rma', name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
        { id: 'fcb', name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
        { id: 'bay', name: 'Bayern Munich', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
        { id: 'psg', name: 'Paris Saint-Germain', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
        { id: 'int', name: 'Inter Milan', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg' },
        { id: 'ben', name: 'Benfica', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg' }
      ];
      break;
    case 'UEFA Europa League':
      teams = [
        { id: 'ars', name: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
        { id: 'che', name: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
        { id: 'atm', name: 'Atletico Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
        { id: 'rom', name: 'Roma', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg' },
        { id: 'lev', name: 'Bayer Leverkusen', logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
        { id: 'por', name: 'Porto', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg' }
      ];
      break;
    case 'UEFA Conference League':
      teams = [
        { id: 'tot', name: 'Tottenham', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
        { id: 'sev', name: 'Sevilla', logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' },
        { id: 'whu', name: 'West Ham', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg' },
        { id: 'psv', name: 'PSV Eindhoven', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c1/PSV_Eindhoven.svg' },
        { id: 'ren', name: 'Rennes', logo: 'https://upload.wikimedia.org/wikipedia/en/5/5a/Stade_Rennais_FC.svg' },
        { id: 'bas', name: 'Basel', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/FC_Basel_crest.svg' }
      ];
      break;
    default:
      teams = [];
  }
  
  // Make sure our team is in the list
  const teamExists = teams.some(team => team.id === teamId);
  if (!teamExists) {
    teams.push({
      id: teamId,
      name: "Team " + teamId.toUpperCase(),
      logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
    });
  }
  
  // Generate standings, favoring the requested team to be higher
  const targetPosition = Math.min(Math.floor(Math.random() * 4) + 1, teams.length);
  
  // Create table rows with the same approach as the league table
  const tableRows: TableRow[] = [];
  
  // Shuffle teams (except put the target team in its position)
  const nonTargetTeams = teams.filter(team => team.id !== teamId);
  const shuffled = [...nonTargetTeams].sort(() => 0.5 - Math.random());
  
  // Insert the target team at its position
  const targetTeam = teams.find(team => team.id === teamId);
  if (targetTeam) {
    shuffled.splice(targetPosition - 1, 0, targetTeam);
  }
  
  // Generate the table with fewer games (group stage)
  shuffled.forEach((team, index) => {
    const position = index + 1;
    
    // European competition has fewer games
    const played = 6; // Group stage
    
    // Generate random but realistic stats
    const baseWins = Math.floor(Math.random() * 2) + 1; // 1-2 wins
    
    // Teams at the top win more
    const positionFactor = Math.max(0, (teams.length - position) / teams.length);
    const additionalWins = Math.floor(positionFactor * 4); // Up to 4 more wins for top teams
    
    const won = Math.min(played, baseWins + additionalWins);
    const drawn = Math.min(played - won, Math.floor(Math.random() * 3)); // 0-2 draws
    const lost = played - won - drawn;
    
    const goalsFor = won * 2 + drawn + Math.floor(Math.random() * 4);
    const goalsAgainst = lost * 2 + Math.floor(Math.random() * 2);
    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn;
    
    tableRows.push({
      position,
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points
    });
  });
  
  // Sort by points, then goal difference
  return tableRows.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }).map((row, index) => ({
    ...row,
    position: index + 1
  }));
};

// Generate fixtures for a team
const generateFixtures = (teamId: string, league: string, europeanCompetition: string | null): Fixture[] => {
  const fixtures: Fixture[] = [];
  const now = new Date();
  
  // Get possible opponents from both league and European competition
  const leagueTeams = generateLeagueTable(teamId, league)
    .filter(row => row.team.id !== teamId)
    .map(row => row.team);
  
  const europeanTeams = europeanCompetition 
    ? generateEuropeanTable(teamId, europeanCompetition)
        .filter(row => row.team.id !== teamId)
        .map(row => row.team)
    : [];
  
  // Generate 3-5 upcoming fixtures
  const fixtureCount = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < fixtureCount; i++) {
    // Alternate between home and away
    const isHome = i % 2 === 0;
    
    // Alternate between league and European matches if applicable
    const isEuropean = europeanCompetition && i % 3 === 1;
    
    // Select an opponent
    const opponents = isEuropean ? europeanTeams : leagueTeams;
    const opponent = opponents[Math.floor(Math.random() * opponents.length)];
    
    // Calculate date (each 3-7 days in the future)
    const daysToAdd = 3 + i * 4 + Math.floor(Math.random() * 4);
    const fixtureDate = new Date(now);
    fixtureDate.setDate(fixtureDate.getDate() + daysToAdd);
    
    // Set a random time
    const hours = Math.floor(Math.random() * 8) + 12; // Between 12:00 and 20:00
    const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; // 00, 15, 30, or 45 minutes
    fixtureDate.setHours(hours, minutes);
    
    // Grab our team info
    const ourTeam: Team = {
      id: teamId,
      name: "Team " + teamId.toUpperCase(),
      logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
    };
    
    // Look for our team's info in league table
    const leagueTable = generateLeagueTable(teamId, league);
    const ourTeamInfo = leagueTable.find(row => row.team.id === teamId);
    if (ourTeamInfo) {
      ourTeam.name = ourTeamInfo.team.name;
      ourTeam.logo = ourTeamInfo.team.logo;
    }
    
    fixtures.push({
      id: `fixture-${i}`,
      homeTeam: isHome ? ourTeam : opponent,
      awayTeam: isHome ? opponent : ourTeam,
      date: fixtureDate.toISOString(),
      competition: isEuropean ? europeanCompetition! : league,
      venue: isHome ? `${ourTeam.name} Stadium` : `${opponent.name} Stadium`
    });
  }
  
  // Sort by date
  return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Add a search functionality to the service
export const searchHighlights = async (query: string): Promise<MatchHighlight[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  const highlights: MatchHighlight[] = [];
  
  // Get all highlights from all leagues
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    for (const highlight of league.highlights) {
      // Search in team names, match title, competition name
      if (
        highlight.homeTeam.name.toLowerCase().includes(normalizedQuery) ||
        highlight.awayTeam.name.toLowerCase().includes(normalizedQuery) ||
        highlight.title.toLowerCase().includes(normalizedQuery) ||
        highlight.competition.name.toLowerCase().includes(normalizedQuery)
      ) {
        highlights.push(highlight);
      }
    }
  }
  
  // Sort by date, most recent first
  return highlights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
