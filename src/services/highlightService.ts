
import { MatchHighlight, League } from '@/types';

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
      videoUrl: 'https://www.youtube.com/watch?v=4-H15-CeFQo',
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
          videoUrl: 'https://www.youtube.com/watch?v=4-H15-CeFQo',
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
