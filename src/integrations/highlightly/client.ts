/**
 * Highlightly Football API Client
 * 
 * This client handles all API requests to the Highlightly Football API
 * Documentation: https://highlightly.net/documentation/football/
 * 
 * Features:
 * - API request caching to reduce API calls
 * - Rate limit handling with exponential backoff
 * - Error handling with fallback options
 * - Uses proxy server to avoid CORS issues
 */

// Use our local proxy server URL from environment variables
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/highlightly';

// No headers needed as the proxy server will handle authentication
const headers = {
  'Content-Type': 'application/json'
};

console.log(`[Highlightly] Using proxy server at: ${PROXY_URL}`);

// The proxy server handles authentication and CORS issues for us

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};

/**
 * Check if a cache entry is still valid
 */
function isCacheValid<T>(cacheKey: string): boolean {
  const entry = cache[cacheKey];
  if (!entry) return false;
  
  const now = Date.now();
  return now - entry.timestamp < CACHE_DURATION;
}

/**
 * Get data from cache
 */
function getFromCache<T>(cacheKey: string): T | null {
  if (isCacheValid<T>(cacheKey)) {
    console.log(`[Highlightly] Cache hit for ${cacheKey}`);
    return cache[cacheKey].data;
  }
  return null;
}

/**
 * Save data to cache
 */
function saveToCache<T>(cacheKey: string, data: T): void {
  cache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
  console.log(`[Highlightly] Cached data for ${cacheKey}`);
}

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
 * Make a request to the Highlightly API with caching and rate limit handling
 */
async function apiRequest<T>(endpoint: string, params: Record<string, string> = {}, retryCount = 0): Promise<T> {
  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  
  // Build full URL
  const url = `${PROXY_URL}${endpoint}?${queryParams.toString()}`;
  
  // Create cache key
  const cacheKey = `${endpoint}:${queryParams.toString()}`;
  
  // Check cache first
  const cachedData = getFromCache<T>(cacheKey);
  if (cachedData) return cachedData;
  
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
    saveToCache<T>(cacheKey, data);
    return data;
  } catch (error) {
    console.error('[Highlightly] API request failed:', error);
    throw error;
  }
}

/**
 * Highlightly API client
 */
export const highlightlyClient = {
  /**
   * Get all highlights with optional filters
   */
  async getHighlights(params: {
    date?: string;
    country?: string;
    league?: string;
    team?: string;
    match?: string;
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
    date?: string;
    country?: string;
    league?: string;
    team?: string;
    timezone?: string;
    limit?: string;
    offset?: string;
    season?: string; // Added season parameter for 2025 season support
  }) {
    return apiRequest<any>('/matches', params);
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
    country?: string;
    name?: string;
  } = {}) {
    return apiRequest<any>('/leagues', params);
  },
  
  /**
   * Get league by ID
   */
  async getLeagueById(leagueId: string) {
    return apiRequest<any>(`/leagues/${leagueId}`);
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
   * Get standings for a league
   */
  async getStandings(params: {
    league: string;
    season?: string;
  }) {
    return apiRequest<any>('/standings', params);
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
    return apiRequest<any>(`/teams/${teamId}/last5`);
  },
  
  /**
   * Get head-to-head stats between two teams
   */
  async getHeadToHead(params: {
    h2h: string; // Format: "teamId1-teamId2"
  }) {
    return apiRequest<any>('/fixtures/h2h', params);
  }
};
