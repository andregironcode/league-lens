
import { fetchFromAPI } from './highlightlyClient';

// Get matches with an optional filter by date
export async function getMatches(date?: string, leagueId?: string, teamId?: string, countryCode?: string): Promise<any[]> {
  try {
    console.log(`🔍 Fetching matches with filters: date=${date}, leagueId=${leagueId}, teamId=${teamId}, countryCode=${countryCode}`);
    const params: Record<string, string> = {};
    
    // Highlightly API requires at least one parameter
    if (date) params.date = date;
    else params.date = new Date().toISOString().split('T')[0]; // Use today's date as default
    
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
