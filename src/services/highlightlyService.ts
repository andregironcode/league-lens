
import { MatchHighlight, League, Team } from '@/types';

const API_BASE_URL = 'https://soccer.highlightly.net';
const API_KEY = 'c05d22e5-9a84-4a95-83c7-77ef598647ed';

// Control flag to enable/disable mock data
const USE_MOCK_DATA = false;

// Helper function to make authenticated requests to the Highlightly API
async function fetchFromAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const fullUrl = url.toString();
  console.log(`🔍 Highlightly API Request: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    // Log full response details for debugging
    console.log(`📥 API Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text available');
      console.error(`❌ API error (${response.status}): ${response.statusText}`, errorText);
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Highlightly API Response (${endpoint}):`, data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching from Highlightly API:', error);
    // Check for network connectivity issues vs API errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('🌐 Network error: Check your internet connection or CORS settings');
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
      if (USE_MOCK_DATA) {
        console.log('⚠️ Using mock highlight data due to API error');
        return getMockHighlights(limit);
      }
      return [];
    }
    
    const transformedHighlights = data.map(transformHighlight);
    console.log(`✅ Transformed ${transformedHighlights.length} highlights`);
    return transformedHighlights;
  } catch (error) {
    console.error('❌ Error fetching recent highlights:', error);
    
    if (USE_MOCK_DATA) {
      // Return mock data for development/testing
      console.log('⚠️ Returning mock highlight data');
      return getMockHighlights(limit);
    }
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
      if (USE_MOCK_DATA) {
        console.log('⚠️ Using mock league data');
        return getMockLeagues();
      }
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
    
    if (USE_MOCK_DATA) {
      // Return mock data for development/testing
      console.log('⚠️ Returning mock league data');
      return getMockLeagues();
    }
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
      if (USE_MOCK_DATA) {
        return getMockMatches(leagueId);
      }
      return [];
    }
    
    console.log(`✅ Fetched ${data.length} matches`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    
    if (USE_MOCK_DATA) {
      // Return mock data for development/testing
      console.log('⚠️ Returning mock match data');
      return getMockMatches(leagueId);
    }
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

// Generate mock data for development and testing when API is not available
function getMockHighlights(limit = 5): MatchHighlight[] {
  const leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];
  const teams = [
    { name: 'Manchester United', logo: 'https://www.sofascore.com/images/team-logo/football_team_33.png' },
    { name: 'Arsenal', logo: 'https://www.sofascore.com/images/team-logo/football_team_42.png' },
    { name: 'Chelsea', logo: 'https://www.sofascore.com/images/team-logo/football_team_38.png' },
    { name: 'Barcelona', logo: 'https://www.sofascore.com/images/team-logo/football_team_2817.png' },
    { name: 'Real Madrid', logo: 'https://www.sofascore.com/images/team-logo/football_team_2829.png' },
    { name: 'Bayern Munich', logo: 'https://www.sofascore.com/images/team-logo/football_team_2672.png' },
    { name: 'Juventus', logo: 'https://www.sofascore.com/images/team-logo/football_team_2692.png' },
    { name: 'PSG', logo: 'https://www.sofascore.com/images/team-logo/football_team_1644.png' },
  ];
  
  return Array(limit).fill(0).map((_, index) => {
    const randomTeam1 = teams[Math.floor(Math.random() * teams.length)];
    let randomTeam2 = teams[Math.floor(Math.random() * teams.length)];
    
    // Ensure we don't have the same team twice
    while (randomTeam1.name === randomTeam2.name) {
      randomTeam2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const randomLeague = leagues[Math.floor(Math.random() * leagues.length)];
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 4);
    
    // Generate a random date within the last week
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    return {
      id: `mock-${index}`,
      title: `${randomTeam1.name} vs ${randomTeam2.name}`,
      date: date.toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=3276&ixlib=rb-4.0.3',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: `${Math.floor(Math.random() * 5) + 2}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
      views: Math.floor(Math.random() * 1000000),
      homeTeam: {
        id: `home-${index}`,
        name: randomTeam1.name,
        logo: randomTeam1.logo
      },
      awayTeam: {
        id: `away-${index}`,
        name: randomTeam2.name,
        logo: randomTeam2.logo
      },
      score: {
        home: homeScore,
        away: awayScore
      },
      competition: {
        id: `comp-${randomLeague.toLowerCase().replace(' ', '')}`,
        name: randomLeague,
        logo: '/placeholder.svg'
      }
    };
  });
}

function getMockLeagues(): League[] {
  const mockHighlights = getMockHighlights(20);
  const leagueMap = new Map<string, League>();
  
  // Use the competition names from the mock highlights
  mockHighlights.forEach(highlight => {
    if (!leagueMap.has(highlight.competition.id)) {
      leagueMap.set(highlight.competition.id, {
        id: highlight.competition.id,
        name: highlight.competition.name,
        logo: highlight.competition.logo,
        highlights: []
      });
    }
    
    leagueMap.get(highlight.competition.id)?.highlights.push(highlight);
  });
  
  return Array.from(leagueMap.values());
}

function getMockMatches(leagueId?: string): any[] {
  const competitions = {
    'pl': { id: 'pl', name: 'Premier League', logo: '/placeholder.svg' },
    'laliga': { id: 'laliga', name: 'La Liga', logo: '/placeholder.svg' },
    'bundesliga': { id: 'bundesliga', name: 'Bundesliga', logo: '/placeholder.svg' },
    'seriea': { id: 'seriea', name: 'Serie A', logo: '/placeholder.svg' },
    'ligue1': { id: 'ligue1', name: 'Ligue 1', logo: '/placeholder.svg' }
  };
  
  const teams = {
    'pl': [
      { id: '33', name: 'Manchester United', logo: 'https://www.sofascore.com/images/team-logo/football_team_33.png' },
      { id: '42', name: 'Arsenal', logo: 'https://www.sofascore.com/images/team-logo/football_team_42.png' },
      { id: '38', name: 'Chelsea', logo: 'https://www.sofascore.com/images/team-logo/football_team_38.png' },
      { id: '36', name: 'Manchester City', logo: 'https://www.sofascore.com/images/team-logo/football_team_36.png' },
      { id: '35', name: 'Liverpool', logo: 'https://www.sofascore.com/images/team-logo/football_team_35.png' },
    ],
    'laliga': [
      { id: '2817', name: 'Barcelona', logo: 'https://www.sofascore.com/images/team-logo/football_team_2817.png' },
      { id: '2829', name: 'Real Madrid', logo: 'https://www.sofascore.com/images/team-logo/football_team_2829.png' },
    ]
  };
  
  const selectedLeague = leagueId || 'pl';
  const competition = competitions[selectedLeague as keyof typeof competitions] || competitions.pl;
  const leagueTeams = (teams[selectedLeague as keyof typeof teams] || teams.pl);
  
  return Array(5).fill(0).map((_, index) => {
    const teamIndices = Array(leagueTeams.length).fill(0).map((_, i) => i);
    const homeTeamIndex = teamIndices.splice(Math.floor(Math.random() * teamIndices.length), 1)[0];
    const awayTeamIndex = teamIndices[Math.floor(Math.random() * teamIndices.length)];
    
    const homeTeam = leagueTeams[homeTeamIndex];
    const awayTeam = leagueTeams[awayTeamIndex];
    
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 4);
    
    // Generate a date within a few hours of now
    const date = new Date();
    date.setHours(date.getHours() + Math.floor(Math.random() * 5));
    
    return {
      id: `mock-match-${selectedLeague}-${index}`,
      date: date.toISOString(),
      status: ['Not Started', 'First Half', 'Half Time', 'Second Half', 'Finished'][Math.floor(Math.random() * 5)],
      homeTeam,
      awayTeam,
      score: {
        fullTime: {
          home: homeScore,
          away: awayScore
        }
      },
      venue: {
        id: `venue-${index}`,
        name: `${homeTeam.name} Stadium`
      },
      competition
    };
  });
}
