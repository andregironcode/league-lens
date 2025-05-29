import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  try {
    // Parse the URL to separate path from query string
    const urlParts = req.url.split('?');
    const pathPart = urlParts[0].replace(/^\/?/, '');
    const queryPart = urlParts.length > 1 ? `?${urlParts[1]}` : '';
    
    // Construct the full URL to the Highlightly API
    // Ensure we don't include the leading slash if the URL already has one
    const url = pathPart ? `${HIGHLIGHTLY_API_URL}/${pathPart}${queryPart}` : HIGHLIGHTLY_API_URL;
    
    console.log(`Mapped endpoint ${req.url} to ${url}`);
    
    // Prepare headers for Highlightly API
    // Try both standard API key auth and RapidAPI-style headers
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': HIGHLIGHTLY_API_KEY, // Standard API key auth
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY // RapidAPI style
    };
    
    console.log('Using API key:', HIGHLIGHTLY_API_KEY ? '✓ Configured' : '✗ Missing');
    
    console.log(`Proxying request to: ${url}`);
    
    try {
      // Forward the request to the Highlightly API
      // Don't use axios's params option as the URL already includes the query parameters
      // This prevents duplicate parameters like 'limit=25,25'
      const response = await axios({
        method: req.method,
        url,
        headers,
        data: req.method !== 'GET' ? req.body : undefined,
        timeout: 10000, // 10 seconds timeout
      });
      
      // Return the API response to the client
      res.status(response.status).json(response.data);
    } catch (axiosError) {
      // Handle axios errors separately to provide better diagnostics
      console.error('Axios request failed:', axiosError.message);
      
      if (axiosError.code === 'ENOTFOUND') {
        console.error(`DNS resolution failed for ${url} - API endpoint might not exist`);
        return res.status(502).json({
          error: true,
          message: 'API endpoint not found - DNS resolution failed',
          details: axiosError.message,
          code: 'DNS_LOOKUP_FAILED'
        });
      }
      
      if (axiosError.code === 'ECONNREFUSED') {
        console.error(`Connection refused for ${url} - API endpoint might be down`);
        return res.status(502).json({
          error: true,
          message: 'API endpoint refused connection - service might be down',
          details: axiosError.message,
          code: 'CONNECTION_REFUSED'
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
      const requestUrl = pathPart ? `${HIGHLIGHTLY_API_URL}/${pathPart}${queryPart}` : HIGHLIGHTLY_API_URL;
      console.error('No response received from API');
      console.error('Request details:', JSON.stringify({
        method: req.method,
        url: requestUrl,
        headers: headers
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

// Start the server
app.listen(PORT, () => {
  console.log(`Highlightly API Proxy Server running on port ${PORT}`);
  console.log(`API URL: ${HIGHLIGHTLY_API_URL}`);
  console.log(`API Key: ${HIGHLIGHTLY_API_KEY ? '✓ Configured' : '✗ Missing'}`);
});

export default app;
