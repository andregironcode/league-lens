
import { MatchHighlight, League } from '@/types';
import { getRecommendedHighlights as getMockRecommendedHighlights, 
         getLeagueHighlights as getMockLeagueHighlights,
         getMatchById as getMockMatchById,
         getTeamHighlights as getMockTeamHighlights,
         searchHighlights as mockSearchHighlights,
         getCompetitionHighlights as getMockCompetitionHighlights } from './highlightService';
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
    console.log('API response:', apiData);
    
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
      } else {
        toast.error('API Error - Using demo data', {
          description: 'There was an error accessing the Scorebat API. Check your network connection.',
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

export const getCompetitionHighlightsWithFallback = async (competitionId: string): Promise<MatchHighlight[]> => {
  const { getCompetitionHighlights } = await import('./scorebatService');
  return getFallbackData(
    () => getCompetitionHighlights(competitionId), 
    () => getMockCompetitionHighlights(competitionId), 
    1
  );
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
