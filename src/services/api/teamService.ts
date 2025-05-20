
import { fetchFromAPI } from './highlightlyClient';

// Get teams list
export async function getTeams(): Promise<any[]> {
  try {
    console.log('Fetching teams list');
    // Add a required parameter 
    const data = await fetchFromAPI('/teams', { includeAll: 'true' });
    console.log(`Fetched ${data?.length || 0} teams`);
    return data || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

// Get team details by ID
export async function getTeamById(id: string): Promise<any> {
  try {
    console.log(`Fetching team details for ID: ${id}`);
    const data = await fetchFromAPI(`/teams/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching team with ID ${id}:`, error);
    throw error;
  }
}

// Get team statistics
export async function getTeamStatistics(teamId: string, fromDate?: string): Promise<any> {
  try {
    console.log(`Fetching statistics for team: ${teamId}`);
    const params: Record<string, string> = { teamId };
    if (fromDate) params.fromDate = fromDate;
    
    const data = await fetchFromAPI('/teams/statistics', params);
    return data;
  } catch (error) {
    console.error(`Error fetching statistics for team ${teamId}:`, error);
    return null;
  }
}

// Get last five games for a team
export async function getLastFiveGames(teamId: string): Promise<any> {
  try {
    console.log(`Fetching last five games for team: ${teamId}`);
    const data = await fetchFromAPI('/last-five-games', { teamId });
    return data;
  } catch (error) {
    console.error(`Error fetching last five games for team ${teamId}:`, error);
    return [];
  }
}
