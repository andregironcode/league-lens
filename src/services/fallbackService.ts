import { MatchHighlight, League } from '@/types';
import { getRecommendedHighlights as getMockRecommendedHighlights, 
         getLeagueHighlights as getMockLeagueHighlights,
         getMatchById as getMockMatchById,
         getTeamHighlights as getMockTeamHighlights,
         searchHighlights as mockSearchHighlights } from './highlightService';
import { toast } from 'sonner';

const hasShownAPIError = {
  value: false,
  reset: () => { hasShownAPIError.value = false; }
};

const apiStateTracker = {
  lastSuccessTime: 0,
  retryCount: 0,
  maxRetries: 3,
  cooldownPeriod: 5 * 60 * 1000, // 5 minutes
  
  recordSuccess: () => {
    apiStateTracker.lastSuccessTime = Date.now();
    apiStateTracker.retryCount = 0;
    hasShownAPIError.reset();
    
    window.dispatchEvent(new CustomEvent('scorebat-api-status-change', { 
      detail: { status: 'connected' } 
    }));
  },
  
  shouldRetryApi: () => {
    if (
      (Date.now() - apiStateTracker.lastSuccessTime < apiStateTracker.cooldownPeriod) ||
      (apiStateTracker.retryCount < apiStateTracker.maxRetries)
    ) {
      apiStateTracker.retryCount++;
      return true;
    }
    return false;
  }
};

export const getFallbackData = async <T>(
  apiCall: () => Promise<T>,
  mockCall: () => Promise<T>,
  threshold: number = 1, // Minimum number of items expected
  showToast: boolean = true
): Promise<T> => {
  if (!apiStateTracker.shouldRetryApi()) {
    console.warn('Skipping API call due to previous failures, using fallback data');
    return await mockCall();
  }
  
  try {
    console.log('Attempting to fetch data from Scorebat API...');
    const apiData = await apiCall();
    console.log('API response received');
    
    if (Array.isArray(apiData) && apiData.length >= threshold) {
      console.log('Successfully received live data from Scorebat API');
      apiStateTracker.recordSuccess();
      return apiData;
    }
    
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
      
      window.dispatchEvent(new CustomEvent('scorebat-api-status-change', { 
        detail: { status: 'error', error: errorMessage } 
      }));
    }
    return await mockCall();
  }
};

export const forceRetryAPI = () => {
  apiStateTracker.retryCount = 0;
  hasShownAPIError.reset();
  window.dispatchEvent(new CustomEvent('scorebat-force-refresh'));
  return true;
};

export const hasApiToken = (): boolean => {
  return !!import.meta.env.VITE_SCOREBAT_API_TOKEN;
};

export const isValidTokenFormat = (): boolean => {
  const token = import.meta.env.VITE_SCOREBAT_API_TOKEN;
  if (!token) return false;
  
  return token.length > 20;
};

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

export const getCompetitionHighlightsWithFallback = async (competitionId: string): Promise<MatchHighlight[]> => {
  const { getCompetitionHighlights } = await import('./scorebatService');
  
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
