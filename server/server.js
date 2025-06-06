import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';
import { getFromCache, setInCache, clearCache } from './cache.js';

// Initialize environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Highlightly API configuration
// According to official documentation: https://highlightly.net/documentation/football/
// Using direct Highlightly API URL
const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
// Use the direct Highlightly API key from the environment variables
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;

const callHighlightlyApi = async (path) => {
    const requestUrl = `${HIGHLIGHTLY_API_URL}/${path}`;
    try {
        console.log(`[Cache Warmer] Calling: ${requestUrl}`);
        const response = await axios.get(requestUrl, {
            headers: {
                'x-api-key': HIGHLIGHTLY_API_KEY,
                'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
            },
            timeout: 30000,
        });
        return response.data;
    } catch (error) {
        console.error(`[Cache Warmer] Error fetching ${requestUrl}:`, error.message);
        return null;
    }
};

const warmUpCache = async () => {
    console.log('[Cache Warmer] Starting cache warming process...');
    await clearCache();

    // 1. Fetch top leagues
    const topLeaguesConfig = [
      { id: '39', name: 'Premier League' },
      { id: '140', name: 'La Liga' },
      { id: '135', name: 'Serie A' },
      { id: '78', name: 'Bundesliga' },
      { id: '61', name: 'Ligue 1' },
      { id: '2', name: 'Champions League' },
    ];
    
    const season = new Date().getFullYear().toString();
    const date = new Date().toISOString().split('T')[0];

    for (const league of topLeaguesConfig) {
        // Fetch and cache league details
        const leagueDetailPath = `leagues/${league.id}`;
        const leagueDetailData = await callHighlightlyApi(leagueDetailPath);
        if (leagueDetailData) {
            await setInCache(`/api/highlightly/${leagueDetailPath}`, leagueDetailData);
        }

        // Fetch and cache matches for today
        const matchesPath = `matches?leagueId=${league.id}&date=${date}&season=${season}`;
        const matchesData = await callHighlightlyApi(matchesPath);
        if (matchesData) {
            await setInCache(`/api/highlightly/${matchesPath}`, matchesData);
        }
    }

    console.log('[Cache Warmer] Cache warming process finished.');
};

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Highlightly API Proxy Server is running' });
});

// Proxy middleware for Highlightly API
app.use('/api/highlightly', async (req, res) => {
  const cacheKey = req.originalUrl;
  const cachedData = await getFromCache(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  // Parse the URL to separate path from query string - declare at top of function scope
  const urlParts = req.url.split('?');
  const pathPart = urlParts[0].replace(/^\/?/, '');
  const queryPart = urlParts.length > 1 ? `?${urlParts[1]}` : '';
  
  // Construct the full URL to the Highlightly API
  const requestUrl = pathPart ? `${HIGHLIGHTLY_API_URL}/${pathPart}${queryPart}` : HIGHLIGHTLY_API_URL;
  
  try {
    console.log(`Mapped endpoint ${req.url} to ${requestUrl}`);
    
    // Prepare headers for Highlightly API
    // Try both standard API key auth and RapidAPI-style headers
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': HIGHLIGHTLY_API_KEY, // Standard API key auth
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY // RapidAPI style
    };
    
    console.log('Using API key:', HIGHLIGHTLY_API_KEY ? '✓ Configured' : '✗ Missing');
    
    console.log(`Proxying request to: ${requestUrl}`);
    
    try {
      // Forward the request to the Highlightly API
      // Don't use axios's params option as the URL already includes the query parameters
      // This prevents duplicate parameters like 'limit=25,25'
      const response = await axios({
        method: req.method,
        url: requestUrl,
        headers,
        data: req.method !== 'GET' ? req.body : undefined,
        timeout: 30000, // Increased to 30 seconds timeout to handle slow API responses
      });
      
      // Store the API response in the cache
      await setInCache(cacheKey, response.data);

      // Return the API response to the client
      res.status(response.status).json(response.data);
    } catch (axiosError) {
      // Handle axios errors separately to provide better diagnostics
      console.error('Axios request failed:', axiosError.message);
      
      if (axiosError.code === 'ENOTFOUND') {
        console.error(`DNS resolution failed for ${requestUrl} - API endpoint might not exist`);
        return res.status(502).json({
          error: true,
          message: 'API endpoint not found - DNS resolution failed',
          details: axiosError.message,
          code: 'DNS_LOOKUP_FAILED'
        });
      }
      
      if (axiosError.code === 'ECONNREFUSED') {
        console.error(`Connection refused for ${requestUrl} - API endpoint might be down`);
        return res.status(502).json({
          error: true,
          message: 'API endpoint refused connection - service might be down',
          details: axiosError.message,
          code: 'CONNECTION_REFUSED'
        });
      }
      
      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        console.error(`Request timeout for ${requestUrl} - API is taking too long to respond`);
        return res.status(504).json({
          error: true,
          message: 'API request timeout - the service is taking too long to respond',
          details: axiosError.message,
          code: 'TIMEOUT'
        });
      }
      
      throw axiosError; // Let the outer catch handle other types of errors
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // Handle API errors and provide meaningful responses
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API error response:', error.response.status);
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      console.error('Request headers:', JSON.stringify(error.config?.headers || {}, null, 2));
      console.error('Request URL:', error.config?.url);
      
      res.status(error.response.status).json({
        error: true,
        message: `Highlightly API returned ${error.response.status}: ${error.message}`,
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
      console.error('Request details:', JSON.stringify({
        method: req.method,
        url: requestUrl, // Now properly scoped
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': HIGHLIGHTLY_API_KEY ? '***' : 'Missing',
          'x-rapidapi-key': HIGHLIGHTLY_API_KEY ? '***' : 'Missing'
        }
      }, null, 2));
      
      res.status(502).json({
        error: true,
        message: 'No response received from the Highlightly API',
        details: error.message,
        request: {
          url: requestUrl,
          method: req.method
        }
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      res.status(500).json({
        error: true,
        message: 'Error setting up the request',
        details: error.message
      });
    }
  }
});

// Schedule a cron job to clear the cache at midnight CET
cron.schedule('0 0 * * *', () => {
    console.log('Running cron job to clear and warm up cache at midnight CET');
    warmUpCache();
}, {
    timezone: "Europe/Paris" // CET is equivalent to Europe/Paris timezone
});

// Start the server
app.listen(PORT, () => {
  console.log(`Highlightly API Proxy Server running on port ${PORT}`);
  console.log(`API URL: ${HIGHLIGHTLY_API_URL}`);
  console.log(`API Key: ${HIGHLIGHTLY_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  // Warm up cache on server start
  warmUpCache();
});

export default app;
