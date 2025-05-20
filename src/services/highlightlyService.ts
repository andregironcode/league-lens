import { MatchHighlight, League, Team } from '@/types';

// Use our local proxy instead of direct API calls
const API_BASE_URL = '/api';

// Helper function to make authenticated requests to the Highlightly API via our proxy
async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const fullUrl = url.toString();
  
  // Log the request details for debugging
  console.log(`🔍 Proxy API Request:
  URL: ${fullUrl}
  Method: GET
  Target: https://soccer.highlightly.net${endpoint}`);
  
  try {
    // No need to include headers as proxy handles authentication
    const response = await fetch(fullUrl);
    
    // Log response details for debugging
    console.log(`📥 Proxy Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text available');
      console.error(`❌ API error (${response.status}): ${response.statusText}`, errorText);
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Check the content type to handle different response formats
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API Response (${endpoint}): ${JSON.stringify(data).substring(0, 500)}...`);
      return data;
    } else {
      // If not JSON, log the response body to help debug
      const textResponse = await response.text();
      console.error('❌ Received non-JSON response:', textResponse.substring(0, 500) + '...');
      
      // Fallback to mock data temporarily if API isn't working
      console.warn('⚠️ Falling back to mock data for now');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching from API:', error);
    // Check for network connectivity issues vs API errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('🌐 Network error: Check your internet connection or proxy settings');
    }
    throw error;
  }
}

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
    
    // Try using the proxy first
    try {
      const data = await fetchFromAPI('/highlights', { limit: limit.toString() });
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('⚠️ No data returned from Highlightly API or empty array');
        // If API returns empty array or invalid data, fall back to mock data
        return getMockHighlights(limit);
      }
      
      const transformedHighlights = data.map(transformHighlight);
      console.log(`✅ Transformed ${transformedHighlights.length} highlights from API`);
      return transformedHighlights;
    } catch (error) {
      console.error('❌ API request failed, falling back to mock data:', error);
      return getMockHighlights(limit);
    }
  } catch (error) {
    console.error('❌ Error fetching recent highlights:', error);
    return getMockHighlights(limit);
  }
}

// Fallback mock data function
function getMockHighlights(limit = 10): MatchHighlight[] {
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
    },
    // Add more mock highlights as needed
  ];
  
  return mockHighlights.slice(0, limit);
}

// Group highlights by league/competition
export async function getHighlightsByLeague(): Promise<League[]> {
  try {
    console.log('🔍 Fetching highlights by league');
    
    // Try getting data from API first
    try {
      const highlights = await getRecentHighlights(20);
      
      if (highlights.length === 0) {
        console.warn('⚠️ No highlights available to group by league');
        return getMockLeagues();
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
      console.error('❌ API request failed, falling back to mock leagues:', error);
      return getMockLeagues();
    }
  } catch (error) {
    console.error('❌ Error getting highlights by league:', error);
    return getMockLeagues();
  }
}

// Fallback mock leagues function
function getMockLeagues(): League[] {
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

// Get matches with an optional filter by date
export async function getMatches(date?: string, leagueId?: string, teamId?: string, countryCode?: string): Promise<any[]> {
  try {
    console.log(`🔍 Fetching matches with filters: date=${date}, leagueId=${leagueId}, teamId=${teamId}, countryCode=${countryCode}`);
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (leagueId) params.leagueId = leagueId;
    if (teamId) params.teamId = teamId;
    if (countryCode) params.countryCode = countryCode;
    
    const data = await fetchFromAPI('/matches', params);
    
    if (!Array.isArray(data)) {
      console.error('❌ Invalid matches data format from API', data);
      return [];
    }
    
    console.log(`✅ Fetched ${data.length} matches`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    return [];
  }
}

// Get match details by ID
export async function getMatchById(id: string): Promise<any> {
  try {
    console.log(`Fetching match details for ID: ${id}`);
    const data = await fetchFromAPI(`/matches/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching match with ID ${id}:`, error);
    throw error;
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

// Get match lineups
export async function getMatchLineups(matchId: string): Promise<any> {
  try {
    console.log(`Fetching lineups for match: ${matchId}`);
    const data = await fetchFromAPI(`/lineups/${matchId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching lineups for match ${matchId}:`, error);
    return null;
  }
}

// Get match statistics
export async function getMatchStats(matchId: string): Promise<any> {
  try {
    console.log(`Fetching statistics for match: ${matchId}`);
    const data = await fetchFromAPI(`/statistics/${matchId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching statistics for match ${matchId}:`, error);
    return null;
  }
}

// Get live events for a match
export async function getMatchEvents(matchId: string): Promise<any> {
  try {
    console.log(`Fetching events for match: ${matchId}`);
    const data = await fetchFromAPI(`/events/${matchId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching events for match ${matchId}:`, error);
    return [];
  }
}

// Get leagues list
export async function getLeagues(): Promise<any[]> {
  try {
    console.log('Fetching leagues list');
    const data = await fetchFromAPI('/leagues');
    console.log(`Fetched ${data?.length || 0} leagues`);
    return data || [];
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return [];
  }
}

// Get teams list
export async function getTeams(): Promise<any[]> {
  try {
    console.log('Fetching teams list');
    const data = await fetchFromAPI('/teams');
    console.log(`Fetched ${data?.length || 0} teams`);
    return data || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

// Get league standings
export async function getStandings(leagueId: string, season?: string): Promise<any> {
  try {
    console.log(`Fetching standings for league: ${leagueId}, season: ${season || 'current'}`);
    const params: Record<string, string> = { leagueId };
    if (season) params.season = season;
    
    const data = await fetchFromAPI('/standings', params);
    return data;
  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error);
    return null;
  }
}

// Get head to head information
export async function getHeadToHead(teamIdOne: string, teamIdTwo: string): Promise<any> {
  try {
    console.log(`Fetching head-to-head stats for teams: ${teamIdOne} vs ${teamIdTwo}`);
    const data = await fetchFromAPI('/head-2-head', { teamIdOne, teamIdTwo });
    return data;
  } catch (error) {
    console.error(`Error fetching head to head for teams ${teamIdOne} vs ${teamIdTwo}:`, error);
    return null;
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
