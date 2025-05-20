import { MatchHighlight, League, Team } from '@/types';

// Use our local proxy instead of direct API calls
const API_BASE_URL = '/api';
// API key is now handled by the proxy server
const API_KEY = 'c05d22e5-9a84-4a95-83c7-77ef598647ed';

// Control flag to disable mock data
const USE_MOCK_DATA = false;

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
    
    const data = await response.json();
    console.log(`✅ API Response (${endpoint}): ${JSON.stringify(data).substring(0, 500)}...`);
    return data;
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
    const data = await fetchFromAPI('/highlights', { limit: limit.toString() });
    
    if (!data || !Array.isArray(data)) {
      console.error('❌ Invalid data format from highlights API', data);
      return [];
    }
    
    const transformedHighlights = data.map(transformHighlight);
    console.log(`✅ Transformed ${transformedHighlights.length} highlights`);
    return transformedHighlights;
  } catch (error) {
    console.error('❌ Error fetching recent highlights:', error);
    return [];
  }
}

// Group highlights by league/competition
export async function getHighlightsByLeague(): Promise<League[]> {
  try {
    console.log('🔍 Fetching highlights by league');
    const highlights = await getRecentHighlights(20);
    
    if (highlights.length === 0) {
      console.warn('⚠️ No highlights available to group by league');
      return [];
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
    return [];
  }
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
