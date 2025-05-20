
import { MatchHighlight, League } from '@/types';
import { fetchFromAPI } from './highlightlyClient';

// Transform API highlight data into our application format
function transformHighlight(apiHighlight: any): MatchHighlight {
  return {
    id: apiHighlight.id.toString(),
    title: `${apiHighlight.homeTeam.name} vs ${apiHighlight.awayTeam.name}`,
    date: apiHighlight.date,
    thumbnailUrl: apiHighlight.thumbnailUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGZvb3RiYWxsfGVufDB8fDB8fHww',
    videoUrl: apiHighlight.embedUrl || apiHighlight.videoUrl,
    duration: apiHighlight.duration || '5:00',
    views: apiHighlight.views || Math.floor(Math.random() * 1000000),
    homeTeam: {
      id: (apiHighlight.homeTeam.id || '').toString(),
      name: apiHighlight.homeTeam.name,
      logo: apiHighlight.homeTeam.logo || 'https://www.sofascore.com/static/images/placeholders/team.svg'
    },
    awayTeam: {
      id: (apiHighlight.awayTeam.id || '').toString(),
      name: apiHighlight.awayTeam.name,
      logo: apiHighlight.awayTeam.logo || 'https://www.sofascore.com/static/images/placeholders/team.svg'
    },
    score: {
      home: apiHighlight.homeGoals || 0,
      away: apiHighlight.awayGoals || 0
    },
    competition: {
      id: (apiHighlight.competition?.id || '').toString(),
      name: apiHighlight.competition?.name || 'Unknown Competition',
      logo: apiHighlight.competition?.logo || '/placeholder.svg'
    }
  };
}

// Get recent highlights
export async function getRecentHighlights(limit = 10): Promise<MatchHighlight[]> {
  try {
    console.log(`🔍 Fetching ${limit} recent highlights`);
    
    // Since Highlightly API requires at least one parameter, use current date as filter
    const today = new Date().toISOString().split('T')[0];
    
    const data = await fetchFromAPI('/highlights', { 
      limit: limit.toString(),
      date: today
    });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ No data returned from Highlightly API or empty array');
      throw new Error('No highlights data available');
    }
    
    const transformedHighlights = data.map(transformHighlight);
    console.log(`✅ Transformed ${transformedHighlights.length} highlights from API`);
    return transformedHighlights;
  } catch (error) {
    console.error('❌ Error fetching recent highlights:', error);
    throw error; // Rethrow to handle in the component
  }
}

// Group highlights by league/competition
export async function getHighlightsByLeague(): Promise<League[]> {
  try {
    console.log('🔍 Fetching highlights by league');
    
    // Get highlights from the API
    const highlights = await getRecentHighlights(20);
    
    if (highlights.length === 0) {
      console.warn('⚠️ No highlights available to group by league');
      throw new Error('No highlights data available to group by league');
    }
    
    // Group highlights by competition
    const leagueMap = new Map<string, League>();
    
    highlights.forEach(highlight => {
      const competitionId = highlight.competition.id;
      
      if (!leagueMap.has(competitionId)) {
        leagueMap.set(competitionId, {
          id: competitionId,
          name: highlight.competition.name,
          logo: highlight.competition.logo,
          highlights: []
        });
      }
      
      leagueMap.get(competitionId)?.highlights.push(highlight);
    });
    
    const leagues = Array.from(leagueMap.values());
    console.log(`✅ Grouped highlights into ${leagues.length} leagues`);
    return leagues;
  } catch (error) {
    console.error('❌ Error getting highlights by league:', error);
    throw error; // Rethrow to handle in the component
  }
}

// Get highlight details by ID
export async function getHighlightById(id: string): Promise<any> {
  try {
    console.log(`Fetching highlight details for ID: ${id}`);
    const data = await fetchFromAPI(`/highlights/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching highlight with ID ${id}:`, error);
    throw error;
  }
}

// Check if a highlight video can be embedded in the current region
export async function checkHighlightGeoRestrictions(highlightId: string): Promise<boolean> {
  try {
    console.log(`Checking geo restrictions for highlight: ${highlightId}`);
    const data = await fetchFromAPI(`/highlights/geo-restrictions/${highlightId}`);
    return data?.allowed || false;
  } catch (error) {
    console.error(`Error checking geo restrictions for highlight ${highlightId}:`, error);
    return false;
  }
}

// Fallback mock data function - only used when explicitly requested
export function getMockHighlights(limit = 10): MatchHighlight[] {
  console.log('📦 Using mock highlights data');
  const mockHighlights: MatchHighlight[] = [
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
    }
  ];
  
  return mockHighlights.slice(0, limit);
}

// Fallback mock leagues function - only used when explicitly requested
export function getMockLeagues(): League[] {
  console.log('📦 Using mock leagues data');
  
  return [
    {
      id: 'pl',
      name: 'Premier League',
      logo: '/leagues/premierleague.png',
      highlights: getMockHighlights(3)
    },
    {
      id: 'laliga',
      name: 'La Liga',
      logo: '/leagues/laliga.png',
      highlights: getMockHighlights(3)
    }
  ];
}
