
import { toast } from 'sonner';

// API Base URL
const API_BASE_URL = 'https://soccer.highlightly.net';

// API Key
const API_KEY = 'ba92a323-13fd-4cd8-91a9-408f4de89d3f';

// Headers for API requests
const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json',
};

/**
 * Fetch matches from the API
 */
export const fetchMatches = async (date?: string, leagueId?: string, countryCode?: string) => {
  try {
    let url = `${API_BASE_URL}/matches`;
    
    // Add query parameters if provided
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (leagueId) params.append('leagueId', leagueId);
    if (countryCode) params.append('countryCode', countryCode);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    toast.error('Failed to load match data');
    return [];
  }
};

/**
 * Fetch matches filtered by league
 */
export const fetchMatchesByLeague = async (leagueName: string) => {
  try {
    const url = `${API_BASE_URL}/matches?league=${encodeURIComponent(leagueName)}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch matches by league: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching matches by league:', error);
    toast.error(`Failed to load matches for ${leagueName}`);
    return [];
  }
};

/**
 * Fetch matches filtered by country
 */
export const fetchMatchesByCountry = async (countryCode: string) => {
  try {
    const url = `${API_BASE_URL}/matches?country=${encodeURIComponent(countryCode)}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch matches by country: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching matches by country:', error);
    toast.error(`Failed to load matches for this country`);
    return [];
  }
};

/**
 * Fetch highlights for a specific match
 */
export const fetchHighlights = async (matchId: string) => {
  try {
    const url = `${API_BASE_URL}/highlights?matchId=${matchId}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch highlights: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching highlights:', error);
    // Not showing toast here as this might be called frequently and silently
    return [];
  }
};

/**
 * Fetch leagues for filtering
 */
export const fetchLeagues = async () => {
  try {
    const url = `${API_BASE_URL}/leagues`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leagues: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching leagues:', error);
    toast.error('Failed to load leagues');
    return [];
  }
};

/**
 * Fetch a specific match by ID
 */
export const fetchMatchById = async (matchId: string) => {
  try {
    const url = `${API_BASE_URL}/matches/${matchId}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch match: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching match:', error);
    toast.error('Failed to load match details');
    return null;
  }
};

/**
 * Fetch standings for a league
 */
export const fetchStandings = async (leagueId: string) => {
  try {
    const url = `${API_BASE_URL}/standings?leagueId=${leagueId}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch standings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching standings:', error);
    toast.error('Failed to load standings');
    return [];
  }
};

/**
 * Fetch statistics for a match
 */
export const fetchStatistics = async (matchId: string) => {
  try {
    const url = `${API_BASE_URL}/statistics/${matchId}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching match statistics:', error);
    toast.error('Failed to load match statistics');
    return null;
  }
};

/**
 * Fetch lineups for a match
 */
export const fetchLineups = async (matchId: string) => {
  try {
    const url = `${API_BASE_URL}/lineups/${matchId}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lineups: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching match lineups:', error);
    toast.error('Failed to load match lineups');
    return null;
  }
};

// For fetching match by ID - simple alias function
export const getMatchById = async (id: string) => {
  try {
    const match = await fetchMatchById(id);
    return match;
  } catch (error) {
    console.error('Error getting match by ID:', error);
    toast.error('Failed to load match details');
    return null;
  }
};
