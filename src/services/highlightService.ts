
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

// For fetching match by ID
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

// Helper functions for recommended highlights and league highlights
export const getRecommendedHighlights = async () => {
  // This will get the most recent finished matches with highlights
  const matches = await fetchMatches();
  const finishedMatches = matches.filter((match: any) => 
    match.status === 'FINISHED' || match.status === 'FT'
  ).slice(0, 10); // Get latest 10 matches
  
  // Check which matches have highlights
  const withHighlights = await Promise.all(
    finishedMatches.map(async (match: any) => {
      try {
        const highlights = await fetchHighlights(match.id);
        if (highlights && highlights.length > 0) {
          return {
            id: match.id,
            title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
            date: match.date,
            thumbnailUrl: highlights[0]?.thumbnailUrl || '',
            videoUrl: highlights[0]?.videoUrl || '',
            duration: highlights[0]?.duration || '3:00',
            views: Math.floor(Math.random() * 50000) + 10000, // Mock data for now
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: match.score,
            competition: match.competition,
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    })
  );
  
  return withHighlights.filter(Boolean);
};

export const getLeagueHighlights = async () => {
  const leagues = await fetchLeagues();
  const topLeagues = leagues.slice(0, 5); // Get top 5 leagues
  
  const leaguesWithHighlights = await Promise.all(
    topLeagues.map(async (league: any) => {
      const matches = await fetchMatchesByLeague(league.name);
      const finishedMatches = matches.filter((match: any) => 
        match.status === 'FINISHED' || match.status === 'FT'
      ).slice(0, 5); // Get latest 5 matches per league
      
      const highlights = await Promise.all(
        finishedMatches.map(async (match: any) => {
          try {
            const highlightData = await fetchHighlights(match.id);
            if (highlightData && highlightData.length > 0) {
              return {
                id: match.id,
                title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                date: match.date,
                thumbnailUrl: highlightData[0]?.thumbnailUrl || '',
                videoUrl: highlightData[0]?.videoUrl || '',
                duration: highlightData[0]?.duration || '3:00',
                views: Math.floor(Math.random() * 50000) + 10000, // Mock data for now
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                score: match.score,
                competition: match.competition,
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        })
      );
      
      return {
        id: league.id,
        name: league.name,
        logo: league.logo,
        highlights: highlights.filter(Boolean),
      };
    })
  );
  
  return leaguesWithHighlights.filter(league => league.highlights && league.highlights.length > 0);
};

// Specially for Highlightly match format
export const fetchHighlightlyMatch = async (matchId: string) => {
  try {
    // First try to get the match from the matches endpoint
    const match = await fetchMatchById(matchId);
    return match;
  } catch (error) {
    console.error('Error fetching Highlightly match:', error);
    toast.error('Failed to load match details');
    return null;
  }
};
