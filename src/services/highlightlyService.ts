
import { MatchHighlight, League, Team } from '@/types';

// Use Supabase Edge Function as a proxy instead of direct API access
const PROXY_URL = 'https://cctqwyhoryahdauqcetf.supabase.co/functions/v1/highlightly-proxy';

// Helper function to make authenticated requests via our proxy
async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}, retries = 2) {
  const url = new URL(`${PROXY_URL}${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const fullUrl = url.toString();
  
  // Log the request details for debugging
  console.log(`🔍 API Request via proxy to: ${endpoint} with params:`, params);
  
  let attempts = 0;
  let lastError;
  
  while (attempts <= retries) {
    attempts++;
    try {
      // Make the request through our proxy
      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Log response details
      console.log(`📥 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`❌ API error (${response.status}): ${response.statusText}`, errorText);
        
        if (response.status === 403) {
          console.error('💡 403 FORBIDDEN - Authentication error with Highlightly Direct Access API. Make sure:');
          console.error('  1. The API key is valid and active');
          console.error('  2. The API key is correctly set as the VALUE of a header named "c05d22e5-9a84-4a95-83c7-77ef598647ed"');
          console.error('  3. The header name is exactly as shown above (case sensitive)');
        }
        
        // If we get a 429 (rate limit) or 5xx (server error), retry after a delay
        if ((response.status === 429 || response.status >= 500) && attempts <= retries) {
          const retryDelay = response.status === 429 
            ? parseInt(response.headers.get('retry-after') || '2', 10) * 1000
            : 1000 * attempts; // Exponential backoff
            
          console.log(`⏱️ Retrying in ${retryDelay}ms... (Attempt ${attempts} of ${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue; // Retry the request
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // Check for JSON content type
      const contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType || 'not specified'}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Response (${endpoint}): Success`);
        return data;
      } else {
        // If not JSON, log the response body
        const textResponse = await response.text();
        console.error('❌ Received non-JSON response:', textResponse.substring(0, 500) + (textResponse.length > 500 ? '...' : ''));
        throw new Error('API returned non-JSON response');
      }
    } catch (error) {
      console.error(`❌ Error fetching from API (attempt ${attempts}):`, error);
      lastError = error;
      
      // Only retry for network errors
      if (error instanceof TypeError && error.message.includes('fetch') && attempts <= retries) {
        const retryDelay = 1000 * attempts; // Exponential backoff
        console.log(`🌐 Network error. Retrying in ${retryDelay}ms... (Attempt ${attempts} of ${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        break; // Don't retry for other errors
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error(`Failed after ${retries + 1} attempts`);
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

// Fallback mock data function - only used when explicitly requested
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

// Fallback mock leagues function - only used when explicitly requested
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

// Update the test function to check connection with the proxy
export async function testApiConnection(): Promise<{success: boolean, message: string, details?: any}> {
  try {
    console.log('🔍 Testing Edge Function proxy connection to Highlightly...');
    
    // Make a simple request to test the connection
    const response = await fetch(`${PROXY_URL}/highlights?limit=1`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Test request status: ${response.status} ${response.statusText}`);
    
    // Log response headers in a cleaner format
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('Response headers:', responseHeaders);
    
    const text = await response.text();
    console.log('Response preview:', text.length > 500 ? text.substring(0, 500) + '...' : text);
    
    let jsonData = null;
    try {
      jsonData = JSON.parse(text);
      console.log('✅ Response is valid JSON');
      
      // Enhanced success detection
      if (Array.isArray(jsonData) || (jsonData && !jsonData.error)) {
        return {
          success: true,
          message: `Connection successful! Received valid data from Highlightly API.`,
          details: {
            contentType: response.headers.get('content-type'),
            status: response.status,
            dataPreview: Array.isArray(jsonData) 
              ? `Received ${jsonData.length} items` 
              : 'Received JSON object',
            data: jsonData
          }
        };
      } else if (jsonData.error) {
        return {
          success: false,
          message: `API Error: ${jsonData.error}`,
          details: {
            errorType: jsonData.error.includes("Missing mandatory HTTP Headers") 
              ? "Authentication Error - Check API key and header format" 
              : "API Error Response",
            status: response.status,
            responseData: jsonData
          }
        };
      }
    } catch (e) {
      console.error('❌ Response is not valid JSON:', e);
      console.log('Raw response:', text);
    }
    
    if (response.ok) {
      return {
        success: true,
        message: `Proxy connection successful (${response.status} ${response.statusText})`,
        details: {
          contentType: response.headers.get('content-type'),
          dataPreview: jsonData ? 'Valid JSON received' : 'Invalid JSON format',
          responsePreview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        }
      };
    } else {
      return {
        success: false,
        message: `Proxy error: ${response.status} ${response.statusText}`,
        details: {
          responseText: text.substring(0, 500),
          headers: responseHeaders,
          errorType: response.status === 403 
            ? 'API Authentication Error - Check API key and header format' 
            : `HTTP Error ${response.status}`
        }
      };
    }
  } catch (error) {
    console.error('Test request failed:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}
