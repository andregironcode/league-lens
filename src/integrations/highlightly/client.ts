/**
 * Highlightly Football API Client
 * 
 * This client handles all API requests to the Highlightly Football API
 * Documentation: https://highlightly.net/documentation/football/
 * 
 * Features:
 * - API request caching to reduce API calls
 * - Request deduplication to prevent duplicate simultaneous requests
 * - Rate limit handling with exponential backoff
 * - Error handling with fallback options
 * - Uses proxy server to avoid CORS issues
 * - Smart TTL based on data type
 */

// Use our local proxy server URL for development and Vercel API for production
const isDevelopment = import.meta.env.DEV;
const PROXY_URL = isDevelopment 
  ? (import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/highlightly')
  : '/api/highlightly';

// No headers needed as the proxy server will handle authentication
const headers = {
  'Content-Type': 'application/json'
};

console.log(`[Highlightly] Using proxy server at: ${PROXY_URL}`);

// Smart cache duration based on data type
const getCacheDuration = (endpoint: string): number => {
  const endpointLower = endpoint.toLowerCase();
  
  // Live match data - very short cache
  if (endpointLower.includes('/matches') && endpointLower.includes('date=')) {
    const today = new Date().toISOString().split('T')[0];
    if (endpointLower.includes(today)) {
      return 5 * 60 * 1000; // 5 minutes for today's matches
    }
    return 30 * 60 * 1000; // 30 minutes for past/future matches
  }
  
  // Highlights - medium cache
  if (endpointLower.includes('/highlights')) return 30 * 60 * 1000; // 30 minutes
  
  // Standings - dynamic cache
  if (endpointLower.includes('/standings')) return 15 * 60 * 1000; // 15 minutes
  
  // Static league info - long cache
  if (endpointLower.includes('/leagues/') && !endpointLower.includes('matches')) {
    return 4 * 60 * 60 * 1000; // 4 hours for league details
  }
  
  // Team info - medium-long cache
  if (endpointLower.includes('/teams/')) return 2 * 60 * 60 * 1000; // 2 hours
  
  // Statistics and events - short cache
  if (endpointLower.includes('/statistics') || endpointLower.includes('/events')) {
    return 5 * 60 * 1000; // 5 minutes
  }
  
  // Lineups - medium cache
  if (endpointLower.includes('/lineups')) return 60 * 60 * 1000; // 1 hour
  
  // Default cache
  return 30 * 60 * 1000; // 30 minutes
};

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache: Record<string, CacheEntry<any>> = {};

// Request deduplication - track pending requests
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Check if a cache entry is still valid
 */
function isCacheValid<T>(cacheKey: string): boolean {
  const entry = cache[cacheKey];
  if (!entry) return false;
  
  const now = Date.now();
  return now - entry.timestamp < entry.ttl;
}

/**
 * Get data from cache
 */
function getFromCache<T>(cacheKey: string): T | null {
  if (isCacheValid<T>(cacheKey)) {
    const entry = cache[cacheKey];
    const remainingTTL = Math.round((entry.ttl - (Date.now() - entry.timestamp)) / 1000);
    console.log(`[Highlightly] Cache HIT for ${cacheKey} (${remainingTTL}s remaining)`);
    return entry.data;
  }
  return null;
}

/**
 * Save data to cache with smart TTL
 */
function saveToCache<T>(cacheKey: string, data: T, endpoint: string): void {
  const ttl = getCacheDuration(endpoint);
  cache[cacheKey] = {
    data,
    timestamp: Date.now(),
    ttl
  };
  console.log(`[Highlightly] Cached data for ${cacheKey} (TTL: ${Math.round(ttl/1000)}s)`);
}

/**
 * Clear cache entries that have expired
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  Object.keys(cache).forEach(key => {
    if (!isCacheValid(key)) {
      delete cache[key];
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`[Highlightly] Cleaned up ${cleanedCount} expired cache entries`);
  }
}

// Cleanup expired cache every 5 minutes
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

/**
 * Clear a specific cache entry or all cache if no key provided
 */
function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    delete cache[cacheKey];
    console.log(`[Highlightly] Cleared cache for ${cacheKey}`);
  } else {
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log(`[Highlightly] Cleared all cache`);
  }
}

/**
 * Handle API rate limiting with exponential backoff
 */
async function handleRateLimit(retryCount: number): Promise<void> {
  // Exponential backoff: 2s, 4s, 8s, 16s, etc.
  const delay = Math.pow(2, retryCount + 1) * 1000;
  console.log(`[Highlightly] Rate limited! Retrying in ${delay}ms (attempt ${retryCount + 1})`);
  
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Make a request to the Highlightly API with caching, deduplication, and rate limit handling
 */
async function apiRequest<T>(endpoint: string, params: Record<string, string> = {}, retryCount = 0): Promise<T> {
  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  
  // Create cache key for deduplication and caching
  const cacheKey = `${endpoint}:${queryParams.toString()}`;
  
  // Check if same request is already in progress (deduplication)
  if (pendingRequests.has(cacheKey)) {
    console.log(`[Highlightly] Deduplicating request: ${cacheKey}`);
    return pendingRequests.get(cacheKey);
  }
  
  // Check cache first
  const cachedData = getFromCache<T>(cacheKey);
  if (cachedData) return cachedData;
  
  // Build full URL
  const url = `${PROXY_URL}${endpoint}?${queryParams.toString()}`;
  
  // Create and store the request promise
  const requestPromise = (async (): Promise<T> => {
    try {
      console.log(`[Highlightly] Fetching ${url}`);
      
      const response = await fetch(url, { headers });
      
      // Log the response status for debugging
      console.log(`[Highlightly] Response status: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error(`[Highlightly] Authentication error: ${response.status}. Please check the proxy server API key.`);
        throw new Error(`Authentication failed: Invalid API key or unauthorized access`);
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        if (retryCount < 3) { // Max 3 retry attempts
          await handleRateLimit(retryCount);
          // Remove from pending requests before retry
          pendingRequests.delete(cacheKey);
          return apiRequest<T>(endpoint, params, retryCount + 1);
        } else {
          console.error(`[Highlightly] Rate limit exceeded after ${retryCount} retries`);
          throw new Error(`Rate limit exceeded: too many requests to Highlightly API`);
        }
      }
      
      // Handle other errors
      if (!response.ok) {
        console.error(`[Highlightly] API request failed with status ${response.status}: ${response.statusText}`);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      // Parse and cache successful response
      const data = await response.json() as T;
      console.log(`[Highlightly] Successfully retrieved data from ${endpoint}`);
      saveToCache<T>(cacheKey, data, endpoint);
      return data;
    } finally {
      // Always clean up pending request
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store the promise to prevent duplicate requests
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}

/**
 * Batch multiple API requests with rate limiting
 */
async function batchApiRequests<T>(requests: Array<{ endpoint: string; params?: Record<string, string> }>, batchSize = 3): Promise<T[]> {
  console.log(`[Highlightly] Batching ${requests.length} requests (batch size: ${batchSize})`);
  
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchPromises = batch.map(req => 
      apiRequest<T>(req.endpoint, req.params || {})
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('[Highlightly] Batch request failed:', result.reason);
      }
    });
    
    // Small delay between batches
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Highlightly API client with optimized methods
 */
export const highlightlyClient = {
  /**
   * Get all highlights with optional filters
   */
  async getHighlights(params: {
    date?: string;
    countryCode?: string;
    countryName?: string;
    leagueName?: string;
    leagueId?: string;
    season?: string;
    match?: string;
    matchId?: string;
    homeTeamId?: string;
    awayTeamId?: string;
    homeTeamName?: string;
    awayTeamName?: string;
    timezone?: string;
    limit?: string;
    offset?: string;
  }) {
    return apiRequest<any>('/highlights', params);
  },
  
  /**
   * Get highlight by ID
   */
  async getHighlightById(highlightId: string) {
    return apiRequest<any>(`/highlights/${highlightId}`);
  },
  
  /**
   * Get all matches with optional filters
   */
  async getMatches(params: {
    leagueName?: string;
    leagueId?: string;
    date?: string;
    timezone?: string;
    season?: string;
    homeTeamName?: string;
    awayTeamName?: string;
    limit?: string;
    offset?: string;
  }) {
    try {
      const response = await apiRequest<any>('/matches', params);
      
      // DEBUG: Log the structure of the first match to understand score format
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('[Highlightly] DEBUG: First match structure from API:', {
          id: response.data[0].id,
          date: response.data[0].date,
          teams: {
            home: response.data[0].homeTeam || response.data[0].teams?.home,
            away: response.data[0].awayTeam || response.data[0].teams?.away
          },
          score: response.data[0].score,
          goals: response.data[0].goals,
          fixture: response.data[0].fixture,
          fullMatch: response.data[0] // Log the entire match object
        });
      }
      
      return response;
    } catch (error) {
      console.error('[Highlightly] Error in getMatches:', error);
      throw error;
    }
  },

  /**
   * Optimized: Get matches for multiple leagues in a single batch
   */
  async getMatchesForLeagues(leagueIds: string[], date?: string, season?: string) {
    const requests = leagueIds.map(leagueId => ({
      endpoint: '/matches',
      params: {
        leagueId,
        ...(date && { date }),
        ...(season && { season }),
        limit: '20'
      }
    }));
    
    return batchApiRequests(requests, 2); // Smaller batches for live data
  },
  
  /**
   * Get match by ID
   */
  async getMatchById(matchId: string) {
    return apiRequest<any>(`/matches/${matchId}`);
  },
  
  /**
   * Get all leagues
   */
  async getLeagues(params: {
    limit?: string;
    offset?: string;
    season?: string;
    leagueName?: string;
    countryCode?: string;
    countryName?: string;
  } = {}) {
    return apiRequest<any>('/leagues', params);
  },
  
  /**
   * Get all countries
   */
  async getCountries() {
    return apiRequest<any>('/countries');
  },
  
  /**
   * Get league by ID
   */
  async getLeagueById(leagueId: string) {
    return apiRequest<any>(`/leagues/${leagueId}`);
  },

  /**
   * Optimized: Get multiple leagues by ID in a batch
   */
  async getLeaguesByIds(leagueIds: string[]) {
    const requests = leagueIds.map(leagueId => ({
      endpoint: `/leagues/${leagueId}`
    }));
    
    return batchApiRequests(requests, 4); // Larger batches for static data
  },
  
  /**
   * Get all teams
   */
  async getTeams(params: {
    country?: string;
    league?: string;
    name?: string;
  } = {}) {
    return apiRequest<any>('/teams', params);
  },
  
  /**
   * Get team by ID
   */
  async getTeamById(teamId: string) {
    return apiRequest<any>(`/teams/${teamId}`);
  },
  
  /**
   * Get league standings
   */
  async getStandings(params: {
    league?: string;
    leagueId?: string;
    season?: string;
  }) {
    console.log('[Highlightly Client] Calling standings API with params:', params);
    
    try {
      const response = await apiRequest<any>('/standings', params);
      console.log('[Highlightly Client] Standings API response:', response);
      return response;
    } catch (error) {
      console.error('[Highlightly Client] Standings API error:', error);
      throw error;
    }
  },

  /**
   * Optimized: Get standings for multiple leagues
   */
  async getStandingsForLeagues(leagueIds: string[], season?: string) {
    const requests = leagueIds.map(leagueId => {
      const params: Record<string, string> = { leagueId };
      if (season) {
        params.season = season;
      }
      return {
        endpoint: '/standings',
        params
      };
    });
    
    return batchApiRequests(requests, 3);
  },
  
  /**
   * Get team statistics
   */
  async getTeamStats(params: {
    team: string;
    league?: string;
    season?: string;
  }) {
    return apiRequest<any>('/teams/statistics', params);
  },
  
  /**
   * Get the last five finished games for a team
   */
  async getLastFiveGames(teamId: string) {
    return apiRequest<any>('/last-five-games', { teamId });
  },
  
  /**
   * Get head-to-head stats between two teams
   */
  async getHeadToHead(teamIdOne: string, teamIdTwo: string) {
    return apiRequest<any>('/head-2-head', { teamIdOne, teamIdTwo });
  },

  /**
   * Get lineups by match ID
   */
  async getLineups(matchId: string) {
    return apiRequest<any>(`/lineups/${matchId}`);
  },

  /**
   * Get match statistics by match ID
   */
  async getStatistics(matchId: string) {
    return apiRequest<any>(`/statistics/${matchId}`);
  },

  /**
   * Get live events by match ID
   */
  async getLiveEvents(matchId: string) {
    return apiRequest<any>(`/events/${matchId}`);
  },

  /**
   * Optimized: Get complete match details (match + lineups + statistics) in a batch
   */
  async getCompleteMatchDetails(matchId: string) {
    const requests = [
      { endpoint: `/matches/${matchId}` },
      { endpoint: `/lineups/${matchId}` },
      { endpoint: `/statistics/${matchId}` }
    ];
    
    const [matchData, lineups, statistics] = await Promise.allSettled(
      requests.map(req => apiRequest<any>(req.endpoint))
    );
    
    return {
      match: matchData.status === 'fulfilled' ? matchData.value : null,
      lineups: lineups.status === 'fulfilled' ? lineups.value : null,
      statistics: statistics.status === 'fulfilled' ? statistics.value : null
    };
  },

  /**
   * Get geo restrictions for a highlight
   */
  async getHighlightGeoRestrictions(highlightId: string) {
    return apiRequest<any>(`/highlights/geo-restrictions/${highlightId}`);
  },

  /**
   * Utility: Clear cache
   */
  clearCache,

  /**
   * Utility: Get cache stats
   */
  getCacheStats() {
    const now = Date.now();
    const stats = {
      total: Object.keys(cache).length,
      valid: 0,
      expired: 0,
      pendingRequests: pendingRequests.size,
      byType: {} as Record<string, number>
    };

    Object.entries(cache).forEach(([key, entry]) => {
      if (now - entry.timestamp < entry.ttl) {
        stats.valid++;
      } else {
        stats.expired++;
      }

      const type = key.split(':')[0].split('/')[1] || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }
};
