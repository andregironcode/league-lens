import { MatchHighlight, League } from '@/types';
import { getRecommendedHighlights as getMockRecommendedHighlights, 
         getLeagueHighlights as getMockLeagueHighlights,
         getMatchById as getMockMatchById,
         getTeamHighlights as getMockTeamHighlights,
         searchHighlights as mockSearchHighlights } from './highlightService';
import { toast } from 'sonner';

const hasShownAPIError = {
  value: false
};

export const getFallbackData = async <T>(
  apiCall: () => Promise<T>,
  mockCall: () => Promise<T>,
  threshold: number = 1, // Minimum number of items expected
  showToast: boolean = true
): Promise<T> => {
  try {
    console.log('Attempting to fetch data from Scorebat API...');
    const apiData = await apiCall();
    console.log('API response received');
    
    // Check if the API data meets minimum requirements
    if (Array.isArray(apiData) && apiData.length >= threshold) {
      console.log('Successfully received live data from Scorebat API');
      // Reset the error flag if we get successful data
      hasShownAPIError.value = false;
      return apiData;
    }
    
    // If not, fall back to mock data
    console.warn('API data did not meet threshold requirements, using fallback data');
    if (showToast && !hasShownAPIError.value) {
      toast.warning('Using demo data - API returned insufficient data', {
        description: 'The Scorebat API returned insufficient data. Using demo data for now.',
        duration: 5000,
      });
      hasShownAPIError.value = true;
    }
    return await mockCall();
  } catch (error) {
    console.error('Error in API call, using fallback data:', error);
    if (showToast && !hasShownAPIError.value) {
      // Check if it's a specific 403 error related to permissions
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('403')) {
        toast.error('API Authentication Error', {
          description: 'Your Scorebat API token may be invalid or expired. Please check your subscription. Displaying demo data instead.',
          duration: 7000,
        });
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Failed to parse')) {
        toast.error('API Format Changed - Using demo data', {
          description: 'The Scorebat API response format has changed. We\'re working on updating our integration. Using demo data for now.',
          duration: 5000,
        });
      } else if (errorMessage.includes('No videos found')) {
        toast.error('No Videos Available - Using demo data', {
          description: 'The Scorebat API did not return any videos. This might be a temporary issue. Using demo data for now.',
          duration: 5000,
        });
      } else if (errorMessage.includes('HTML')) {
        toast.error('API Format Error - Using demo data', {
          description: 'The Scorebat API returned HTML instead of JSON. We\'re working to fix this issue. Using demo data for now.',
          duration: 5000,
        });
      } else {
        toast.error('API Error - Using demo data', {
          description: 'There was an error accessing the Scorebat API. Check your network connection or try again later.',
          duration: 5000,
        });
      }
      hasShownAPIError.value = true;
    }
    return await mockCall();
  }
};

// Fallback functions that try the real API first, then fall back to mock data
export const getRecommendedHighlightsWithFallback = async (): Promise<MatchHighlight[]> => {
  const { getRecommendedHighlights } = await import('./scorebatService');
  return getFallbackData(getRecommendedHighlights, getMockRecommendedHighlights, 3);
};

export const getLeagueHighlightsWithFallback = async (): Promise<League[]> => {
  const { getLeagueHighlights } = await import('./scorebatService');
  return getFallbackData(getLeagueHighlights, getMockLeagueHighlights, 2);
};

export const getMatchByIdWithFallback = async (id: string): Promise<MatchHighlight | null> => {
  const { getMatchById } = await import('./scorebatService');
  return getFallbackData(
    () => getMatchById(id), 
    () => getMockMatchById(id), 
    1
  );
};

export const getTeamHighlightsWithFallback = async (teamId: string): Promise<MatchHighlight[]> => {
  const { getTeamHighlights } = await import('./scorebatService');
  return getFallbackData(
    () => getTeamHighlights(teamId), 
    () => getMockTeamHighlights(teamId), 
    1
  );
};

export const searchHighlightsWithFallback = async (query: string): Promise<MatchHighlight[]> => {
  const { searchHighlights } = await import('./scorebatService');
  return getFallbackData(
    () => searchHighlights(query), 
    () => mockSearchHighlights(query), 
    1
  );
};

// We need this function to get competition highlights
export const getCompetitionHighlightsWithFallback = async (competitionId: string): Promise<MatchHighlight[]> => {
  const { getCompetitionHighlights } = await import('./scorebatService');
  
  // For the mock data, we'll filter the league highlights to find the right competition
  const mockCompetitionHighlights = async (id: string) => {
    const leagues = await getMockLeagueHighlights();
    const league = leagues.find(l => l.id === id);
    return league ? league.highlights : [];
  };
  
  return getFallbackData(
    () => getCompetitionHighlights(competitionId), 
    () => mockCompetitionHighlights(competitionId), 
    1
  );
};
