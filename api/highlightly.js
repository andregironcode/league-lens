// Vercel serverless function for Highlightly API proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Get the path from the request
    const { path, ...queryParams } = req.query;
    
    // Construct the API path - path comes as an array from Vercel
    const apiPath = Array.isArray(path) ? path.join('/') : (path || '');
    
    // Build query string from remaining parameters
    const queryString = new URLSearchParams(queryParams).toString();
    const fullPath = queryString ? `${apiPath}?${queryString}` : apiPath;
    
    // Highlightly API configuration
    const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
    const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY;
    
    const url = `${HIGHLIGHTLY_API_URL}/${fullPath}`;
    
    console.log(`Proxying request to: ${url}`);
    
    // Prepare headers for Highlightly API
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY
    };
    
    // Make request to Highlightly API
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the API response
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    res.status(500).json({
      error: true,
      message: 'Failed to proxy request to Highlightly API',
      details: error.message
    });
  }
} 