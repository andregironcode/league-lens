import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';
import { createServer } from 'http';
import { getFromCache, setInCache, clearCache, getCacheStats, shouldBypassCache } from './cache.js';
import MatchScheduler from './services/matchScheduler.js';
import EnhancedMatchScheduler from './services/enhancedMatchScheduler.js';
import MatchService from './services/matchService.js';
import DatabaseMatchService from './services/databaseMatchService.js';
import MatchWebSocketServer from './websocket.js';

// Initialize environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Initialize match schedulers
const matchScheduler = new MatchScheduler();
const enhancedMatchScheduler = new EnhancedMatchScheduler();
const matchService = new MatchService();
const databaseMatchService = new DatabaseMatchService();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Highlightly API configuration
// According to official documentation: https://highlightly.net/documentation/football/
// Using direct Highlightly API URL
const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
// Use the direct Highlightly API key from the environment variables
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;

// Top leagues configuration - CORRECT Highlightly API IDs
const topLeaguesConfig = [
  { id: '33973', name: 'Premier League' },
  { id: '119924', name: 'La Liga' },
  { id: '115669', name: 'Serie A' },
  { id: '67162', name: 'Bundesliga' },
  { id: '52695', name: 'Ligue 1' },
  { id: '2486', name: 'UEFA Champions League' },
];

// Rate limit tracking
const rateLimitState = {
    retryAfter: 0,
    lastRequest: 0,
    requestCount: 0,
    windowStart: Date.now()
};

const callHighlightlyApi = async (path, retryCount = 0) => {
    const requestUrl = `${HIGHLIGHTLY_API_URL}/${path}`;
    
    // Check if we need to wait before making request
    const now = Date.now();
    if (rateLimitState.retryAfter > now) {
        const waitTime = rateLimitState.retryAfter - now;
        console.log(`[API] Rate limited - waiting ${waitTime}ms before request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Add small delay between requests to avoid hitting rate limits
    const timeSinceLastRequest = now - rateLimitState.lastRequest;
    if (timeSinceLastRequest < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
    }
    
    try {
        console.log(`[API] Calling: ${requestUrl}`);
        rateLimitState.lastRequest = Date.now();
        
        const response = await axios.get(requestUrl, {
            headers: {
                'x-api-key': HIGHLIGHTLY_API_KEY,
                'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
                'User-Agent': 'LeagueLens/1.0',
            },
            timeout: 30000,
            validateStatus: status => status < 500 // Don't throw on 4xx errors
        });
        
        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers['retry-after'];
            const rateLimitReset = response.headers['x-ratelimit-reset'];
            
            let waitTime = 1000; // Default 1 second
            
            if (retryAfter) {
                waitTime = parseInt(retryAfter) * 1000;
            } else if (rateLimitReset) {
                waitTime = Math.max(0, parseInt(rateLimitReset) * 1000 - Date.now());
            } else {
                // Exponential backoff
                waitTime = Math.min(Math.pow(2, retryCount) * 1000, 30000);
            }
            
            rateLimitState.retryAfter = Date.now() + waitTime;
            
            if (retryCount < 5) {
                console.log(`[API] Rate limited (429) - retrying after ${waitTime}ms (attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return callHighlightlyApi(path, retryCount + 1);
            } else {
                console.error(`[API] Rate limit exceeded after ${retryCount} retries`);
                return null;
            }
        }
        
        if (response.status >= 400) {
            console.error(`[API] Error ${response.status}: ${response.statusText}`);
            return null;
        }
        
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error(`[API] Request timeout for ${requestUrl}`);
        } else {
            console.error(`[API] Error fetching ${requestUrl}:`, error.message);
        }
        return null;
    }
};

// Optimized batch processing with rate limiting
const executeBatchWithRateLimit = async (apiCalls, batchSize = 3) => {
  console.log(`[Cache Warmer] Processing ${apiCalls.length} API calls in batches of ${batchSize}`);
  
  for (let i = 0; i < apiCalls.length; i += batchSize) {
    const batch = apiCalls.slice(i, i + batchSize);
    console.log(`[Cache Warmer] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(apiCalls.length/batchSize)}`);
    
    await Promise.all(batch.map(async (call) => {
      const data = await callHighlightlyApi(call.path);
      if (data) {
        await setInCache(call.cacheKey, data, call.ttl);
      }
    }));
    
    // Delay between batches to be API-friendly
    if (i + batchSize < apiCalls.length) {
      console.log('[Cache Warmer] Waiting 200ms before next batch...');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
};

// Smart cache warming - different strategies for different data types
const warmUpLiveData = async () => {
  console.log('[Cache Warmer] Warming up live data (matches for today)...');
  
  const today = new Date().toISOString().split('T')[0];
  const season = new Date().getFullYear().toString();
  
  const apiCalls = topLeaguesConfig.map(league => ({
    path: `matches?leagueId=${league.id}&date=${today}&season=${season}`,
    cacheKey: `/api/highlightly/matches?leagueId=${league.id}&date=${today}&season=${season}`,
    ttl: 300 // 5 minutes for live data
  }));
  
  await executeBatchWithRateLimit(apiCalls, 2); // Smaller batches for live data
};

const warmUpStandings = async () => {
  console.log('[Cache Warmer] Warming up standings data...');
  
  const season = new Date().getFullYear().toString();
  
  const apiCalls = topLeaguesConfig.map(league => ({
    path: `standings?leagueId=${league.id}&season=${season}`,
    cacheKey: `/api/highlightly/standings?leagueId=${league.id}&season=${season}`,
    ttl: 1800 // 30 minutes
  }));
  
  await executeBatchWithRateLimit(apiCalls, 3);
};

const warmUpHighlights = async () => {
  console.log('[Cache Warmer] Warming up highlights data...');
  
  const season = new Date().getFullYear().toString();
  
  const apiCalls = topLeaguesConfig.map(league => ({
    path: `highlights?leagueId=${league.id}&season=${season}&limit=20`,
    cacheKey: `/api/highlightly/highlights?leagueId=${league.id}&season=${season}&limit=20`,
    ttl: 3600 // 1 hour
  }));
  
  await executeBatchWithRateLimit(apiCalls, 3);
};

const warmUpStaticData = async () => {
  console.log('[Cache Warmer] Warming up static data (leagues)...');
  
  const apiCalls = topLeaguesConfig.map(league => ({
    path: `leagues/${league.id}`,
    cacheKey: `/api/highlightly/leagues/${league.id}`,
    ttl: 86400 // 24 hours
  }));
  
  await executeBatchWithRateLimit(apiCalls, 4);
};

const warmUpExtendedMatches = async () => {
  console.log('[Cache Warmer] Warming up extended match data (yesterday, today, tomorrow)...');
  
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24*60*60*1000).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0];
  const season = today.getFullYear().toString();
  
  const apiCalls = [];
  
  [yesterday, todayStr, tomorrow].forEach(date => {
    const ttl = date === todayStr ? 300 : 3600; // 5 min for today, 1 hour for others
    
    topLeaguesConfig.forEach(league => {
      apiCalls.push({
        path: `matches?leagueId=${league.id}&date=${date}&season=${season}`,
        cacheKey: `/api/highlightly/matches?leagueId=${league.id}&date=${date}&season=${season}`,
        ttl
      });
    });
  });
  
  await executeBatchWithRateLimit(apiCalls, 3);
};

// Full cache warming for server startup and daily refresh
const warmUpCache = async () => {
  console.log('[Cache Warmer] Starting comprehensive cache warming...');
  const startTime = Date.now();
  
  try {
    // Clear old cache
    await clearCache();
    
    // Warm up data in priority order
    await warmUpStaticData();     // League info (rarely changes)
    await warmUpExtendedMatches(); // Match data for 3 days
    await warmUpHighlights();     // Recent highlights
    await warmUpStandings();      // League standings
    
    const duration = Date.now() - startTime;
    const stats = await getCacheStats();
    
    console.log(`[Cache Warmer] Completed in ${duration}ms`);
    console.log(`[Cache Warmer] Cache stats:`, stats);
    
  } catch (error) {
    console.error('[Cache Warmer] Error during cache warming:', error);
  }
};

// Middleware with enhanced CORS configuration
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Bypass-Cache', 'X-Real-Time', 'Cache-Control'],
  exposedHeaders: ['X-Cache', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset', 'Retry-After']
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint with cache stats
app.get('/api/health', async (req, res) => {
  const stats = await getCacheStats();
  const schedulerStatus = matchScheduler.getStatus();
  res.json({ 
    status: 'ok', 
    message: 'Highlightly API Proxy Server is running',
    cache: stats,
    scheduler: schedulerStatus
  });
});

// Manual trigger for fetching upcoming matches (for testing)
app.post('/api/admin/fetch-matches', async (req, res) => {
  try {
    console.log('[Server] Manual fetch triggered by admin...');
    
    // Force trigger the fetchUpcomingMatches method
    await matchScheduler.fetchUpcomingMatches();
    
    res.json({ 
      success: true, 
      message: 'Match fetch completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Server] Manual fetch failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Match scheduler endpoints
app.get('/api/scheduler/status', (req, res) => {
  const status = matchScheduler.getStatus();
  res.json(status);
});

app.post('/api/scheduler/start', async (req, res) => {
  try {
    matchScheduler.start();
    res.json({ message: 'Match scheduler started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start match scheduler', details: error.message });
  }
});

app.post('/api/scheduler/stop', (req, res) => {
  matchScheduler.stop();
  res.json({ message: 'Match scheduler stopped' });
});

// Main feed endpoint - shows matches from -1 to +5 days for top 8 leagues
app.get('/api/feed/matches', async (req, res) => {
  try {
    const cacheKey = '/api/feed/matches';
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Use database service to avoid API rate limits
    const feedData = await databaseMatchService.getTopLeaguesMatches();
    
    // Cache for 5 minutes
    await setInCache(cacheKey, feedData, 300);
    res.json(feedData);

  } catch (error) {
    console.error('[API] Error fetching feed matches:', error);
    res.status(500).json({ error: 'Failed to fetch feed matches' });
  }
});

// For You section endpoint - top 5 weighted matches from last 7 days
app.get('/api/for-you/matches', async (req, res) => {
  try {
    const cacheKey = '/api/for-you/matches';
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Use database service to avoid API rate limits
    const forYouData = await databaseMatchService.getForYouMatches();
    
    // Cache for 30 minutes
    await setInCache(cacheKey, forYouData, 1800);
    res.json(forYouData);

  } catch (error) {
    console.error('[API] Error fetching for you matches:', error);
    res.status(500).json({ error: 'Failed to fetch for you matches' });
  }
});

// Legacy upcoming matches endpoint for backward compatibility
app.get('/api/upcoming-matches', async (req, res) => {
  try {
    const feedData = await databaseMatchService.getTopLeaguesMatches();
    const upcomingMatches = feedData.matches.filter(match => 
      new Date(match.utc_date || match.date) >= new Date()
    );
    
    res.json({
      matches: upcomingMatches,
      leagues: feedData.leagues,
      lastUpdated: feedData.lastUpdated,
      scheduler: enhancedMatchScheduler.getStatus()
    });

  } catch (error) {
    console.error('[API] Error fetching upcoming matches:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming matches' });
  }
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  const stats = await getCacheStats();
  res.json(stats);
});

app.post('/api/cache/warm', async (req, res) => {
  res.json({ message: 'Cache warming started' });
  warmUpCache(); // Run in background
});

app.post('/api/cache/clear', async (req, res) => {
  await clearCache();
  res.json({ message: 'Cache cleared' });
});

// Proxy middleware for Highlightly API with enhanced rate limit handling
app.use('/api/highlightly', async (req, res) => {
  const cacheKey = req.originalUrl;
  
  // Check if we should bypass cache
  const bypassCache = shouldBypassCache(req);
  
  // Check cache first unless bypassed
  if (!bypassCache) {
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }
  } else {
    console.log(`[Proxy] Bypassing cache for ${req.url}`);
  }

  // Parse the URL to separate path from query string
  const urlParts = req.url.split('?');
  const pathPart = urlParts[0].replace(/^\/?/, '');
  const queryPart = urlParts.length > 1 ? `?${urlParts[1]}` : '';
  
  // Use our enhanced API call function
  const data = await callHighlightlyApi(`${pathPart}${queryPart}`);
  
  if (data) {
    // Store with smart TTL (unless cache bypass)
    if (!bypassCache) {
      await setInCache(cacheKey, data);
    }
    res.set('X-Cache', bypassCache ? 'BYPASS' : 'MISS');
    res.json(data);
  } else {
    // Check if we have stale data as fallback
    const staleData = await getFromCache(cacheKey, true); // Allow expired cache
    if (staleData) {
      console.log(`[Proxy] Returning stale cache for ${req.url} due to API failure`);
      res.set('X-Cache', 'STALE');
      res.json(staleData);
    } else {
      res.status(503).json({
        error: true,
        message: 'Service temporarily unavailable - API rate limited',
        retry_after: Math.ceil((rateLimitState.retryAfter - Date.now()) / 1000)
      });
    }
  }
});

// Intelligent cron scheduling
console.log('[Cron] Setting up intelligent cache refresh schedules...');

// Every 5 minutes: Update live match data only (minimal API calls)
cron.schedule('*/5 * * * *', () => {
  console.log('[Cron] Refreshing live match data...');
  warmUpLiveData();
}, {
  timezone: "Europe/Paris"
});

// Every 30 minutes: Update standings
cron.schedule('*/30 * * * *', () => {
  console.log('[Cron] Refreshing standings...');
  warmUpStandings();
}, {
  timezone: "Europe/Paris"
});

// Every hour: Update highlights
cron.schedule('0 * * * *', () => {
  console.log('[Cron] Refreshing highlights...');
  warmUpHighlights();
}, {
  timezone: "Europe/Paris"
});

// Every 6 hours: Extended match data refresh
cron.schedule('0 */6 * * *', () => {
  console.log('[Cron] Refreshing extended match data...');
  warmUpExtendedMatches();
}, {
  timezone: "Europe/Paris"
});

// Daily at midnight: Full cache refresh
cron.schedule('0 0 * * *', () => {
  console.log('[Cron] Daily full cache refresh...');
  warmUpCache();
}, {
  timezone: "Europe/Paris"
});

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// Initialize WebSocket server
const wsServer = new MatchWebSocketServer(server);

// Start the server
server.listen(PORT, async () => {
  console.log(`Highlightly API Proxy Server running on port ${PORT}`);
  console.log(`API URL: ${HIGHLIGHTLY_API_URL}`);
  console.log(`API Key: ${HIGHLIGHTLY_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`WebSocket Server: ✓ Active`);
  
  // Initialize enhanced match scheduler
  try {
    console.log('[Server] Starting enhanced match scheduler...');
    enhancedMatchScheduler.start();
    console.log('[Server] ✅ Enhanced match scheduler started successfully');
  } catch (error) {
    console.error('[Server] ❌ Failed to start enhanced match scheduler:', error);
  }
  
  // Initial cache warming
  setTimeout(() => {
    warmUpCache();
  }, 1000); // Delay to let server fully start
});

export default app;
