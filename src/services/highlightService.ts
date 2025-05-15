
import { fetchHighlightsFromApi } from './apiService';
import { MatchHighlight, League } from '@/types';

// Transform the API response into our MatchHighlight format
const transformApiHighlight = (highlight: any): MatchHighlight => {
  return {
    id: highlight.matchId || highlight.id || String(Math.random()),
    title: `${highlight.homeTeam.name} vs ${highlight.awayTeam.name}`,
    date: highlight.date || new Date().toISOString(),
    thumbnailUrl: highlight.thumbnailUrl || highlight.thumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
    videoUrl: highlight.video || highlight.videoUrl || '',
    duration: highlight.duration || '10:00',
    views: highlight.views || Math.floor(Math.random() * 1000000),
    homeTeam: {
      id: highlight.homeTeam.id || String(highlight.homeTeam.name).toLowerCase().replace(/\s/g, '-'),
      name: highlight.homeTeam.name,
      logo: highlight.homeTeam.logo || `https://api.sofascore.app/api/v1/team/${highlight.homeTeam.id}/logo`
    },
    awayTeam: {
      id: highlight.awayTeam.id || String(highlight.awayTeam.name).toLowerCase().replace(/\s/g, '-'),
      name: highlight.awayTeam.name,
      logo: highlight.awayTeam.logo || `https://api.sofascore.app/api/v1/team/${highlight.awayTeam.id}/logo`
    },
    score: {
      home: highlight.homeGoals || 0,
      away: highlight.awayGoals || 0
    },
    competition: {
      id: highlight.competition?.id || String(highlight.competition?.name).toLowerCase().replace(/\s/g, '-'),
      name: highlight.competition?.name || 'Unknown',
      logo: highlight.competition?.logo || '/placeholder.svg'
    }
  };
};

// Group highlights by competition/league
const groupHighlightsByLeague = (highlights: MatchHighlight[]): League[] => {
  const leaguesMap = new Map<string, League>();
  
  highlights.forEach(highlight => {
    const leagueId = highlight.competition.id;
    
    if (!leaguesMap.has(leagueId)) {
      leaguesMap.set(leagueId, {
        id: leagueId,
        name: highlight.competition.name,
        logo: highlight.competition.logo,
        highlights: []
      });
    }
    
    leaguesMap.get(leagueId)?.highlights.push(highlight);
  });
  
  return Array.from(leaguesMap.values());
};

// Get recommended highlights from API
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  try {
    // Fetch data from the API using our Supabase Edge Function
    const apiResponse = await fetchHighlightsFromApi();
    
    if (!apiResponse || !Array.isArray(apiResponse.highlights)) {
      console.warn('Invalid API response format, falling back to mock data');
      throw new Error('Invalid API response format');
    }
    
    console.log('API highlights:', apiResponse.highlights);
    
    // Transform API response to our format
    const transformedHighlights = apiResponse.highlights
      .map(transformApiHighlight)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent
    
    return transformedHighlights;
  } catch (error) {
    console.error('Error getting recommended highlights:', error);
    // Return an empty array if there's an error
    return [];
  }
};

// Get highlights grouped by league from API
export const getLeagueHighlights = async (): Promise<League[]> => {
  try {
    const highlights = await getRecommendedHighlights();
    
    if (!highlights || highlights.length === 0) {
      throw new Error('No highlights available');
    }
    
    // Group the highlights by league
    const leagues = groupHighlightsByLeague(highlights);
    
    return leagues;
  } catch (error) {
    console.error('Error getting league highlights:', error);
    // Return an empty array if there's an error
    return [];
  }
};

// Get a specific match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  try {
    // Try to fetch the specific match from the API
    const apiResponse = await fetchHighlightsFromApi(id);
    
    if (apiResponse && apiResponse.highlights && apiResponse.highlights[0]) {
      return transformApiHighlight(apiResponse.highlights[0]);
    }
    
    // If not found in specific API call, check in all highlights
    const allHighlights = await getRecommendedHighlights();
    const match = allHighlights.find(highlight => highlight.id === id);
    
    return match || null;
  } catch (error) {
    console.error('Error getting match by ID:', error);
    return null;
  }
};
