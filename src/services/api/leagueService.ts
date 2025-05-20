
import { fetchFromAPI } from './highlightlyClient';

// Get leagues list
export async function getLeagues(): Promise<any[]> {
  try {
    console.log('Fetching leagues list');
    // Add a required parameter (any value will work)
    const data = await fetchFromAPI('/leagues', { includeAll: 'true' });
    console.log(`Fetched ${data?.length || 0} leagues`);
    return data || [];
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return [];
  }
}

// Get league details by ID
export async function getLeagueById(id: string): Promise<any> {
  try {
    console.log(`Fetching league details for ID: ${id}`);
    const data = await fetchFromAPI(`/leagues/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching league with ID ${id}:`, error);
    throw error;
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
