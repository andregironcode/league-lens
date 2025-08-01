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
    // --- DEBUG LOGGING START ---
    console.log('[PROXY DEBUG] Request URL:', req.url);
    console.log('[PROXY DEBUG] Request Query:', JSON.stringify(req.query, null, 2));
    // --- DEBUG LOGGING END ---

    // Get the path from the request
    const { path, ...queryParams } = req.query;
    
    // Construct the API path - path comes as an array from Vercel
    let apiPath = Array.isArray(path) ? path.join('/') : (path || '');
    
    // Explicitly handle the fixtures route to be safe
    if (apiPath.startsWith('fixtures/')) {
        // This ensures the path is correctly interpreted, e.g., "fixtures/12345"
        console.log("Handling as a fixture request.");
    }
    
    // Build query string from remaining parameters
    const queryString = new URLSearchParams(queryParams).toString();
    const fullPath = queryString ? `${apiPath}?${queryString}` : apiPath;
    
    // Highlightly API configuration
    const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
    const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY22 || process.env.HIGHLIGHTLY_API_KEY;
    
    const url = `${HIGHLIGHTLY_API_URL}/${fullPath}`;
    
    console.log(`Proxying request to: ${url}`);
    
    // Make request to Highlightly API
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API responded with status ${response.status}: ${errorText}`);
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