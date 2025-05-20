
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// The Highlightly API base URL
const API_BASE_URL = "https://soccer.highlightly.net";

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Utility function to safely log API key (first 4 and last 4 chars only)
function logSafeApiKey(apiKey) {
  if (!apiKey) return "undefined";
  if (apiKey.length <= 8) return "***hidden***";
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

// Retry mechanism for API requests
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  let retryDelay = 300; // Start with 300ms delay
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Request attempt ${attempt + 1}/${maxRetries} to ${url}`);
      const response = await fetch(url, options);
      
      // If successful or it's a 4xx client error (except 429), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }
      
      // Handle rate limiting explicitly
      if (response.status === 429) {
        console.log(`Rate limited. Retrying after delay...`);
        const retryAfter = response.headers.get("retry-after") || "1";
        retryDelay = parseInt(retryAfter, 10) * 1000;
      }
      
      lastError = new Error(`HTTP error: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`Network error on attempt ${attempt + 1}:`, error);
      lastError = error;
    }
    
    if (attempt < maxRetries - 1) {
      console.log(`Waiting ${retryDelay}ms before next retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay *= 2; // Exponential backoff
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} attempts`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get API key from environment variable
    const apiToken = Deno.env.get('HIGHLIGHTLY_API_KEY');
    if (!apiToken) {
      console.error('API token not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`API key detected (masked): ${logSafeApiKey(apiToken)}`);

    // Parse the request URL
    const url = new URL(req.url);
    const path = url.pathname.replace('/highlightly-proxy', '');
    
    // Build the target URL
    const targetUrl = new URL(path, API_BASE_URL);
    
    // Copy all search params from the original request
    url.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    console.log(`Proxying request to: ${targetUrl}`);

    // IMPORTANT: According to the Highlightly documentation for direct API access subscription,
    // The API key (c05d22e5-9a84-4a95-83c7-77ef598647ed) is actually a fixed header NAME, 
    // not the value. We must use it as the header name, and set our actual API token as its value.
    
    // Create headers object with all required headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // Origin and Referer headers to improve authentication acceptance
      'Origin': 'https://cctqwyhoryahdauqcetf.supabase.co',
      'Referer': 'https://cctqwyhoryahdauqcetf.supabase.co',
    };
    
    // CRITICAL: For direct Highlightly API access, we must use the fixed header name 
    // 'c05d22e5-9a84-4a95-83c7-77ef598647ed' with our API token as its value
    headers['c05d22e5-9a84-4a95-83c7-77ef598647ed'] = apiToken.trim(); // Ensure no whitespace
    
    console.log(`Headers prepared with keys: ${Object.keys(headers).join(', ')}`);
    
    // Forward the request to the Highlightly API with retry mechanism
    const response = await fetchWithRetry(targetUrl.toString(), {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    console.log(`Highlightly API response status: ${response.status} ${response.statusText}`);
    
    // Log headers for debugging
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('Response headers received:', JSON.stringify(responseHeaders));

    // Read the response body
    const responseBody = await response.text();
    
    // Try to parse JSON for debugging
    try {
      const jsonResponse = JSON.parse(responseBody);
      console.log('Response contains valid JSON:', 
        JSON.stringify(jsonResponse).substring(0, 200) + 
        (JSON.stringify(jsonResponse).length > 200 ? '...' : '')
      );
      
      if (jsonResponse.error || jsonResponse.message) {
        console.error('API error message:', jsonResponse.error || jsonResponse.message);
        
        // Add specific error handling for common error messages
        if (jsonResponse.error && jsonResponse.error.includes("Missing mandatory HTTP Headers")) {
          console.error('CRITICAL: Authentication header issue detected.');
          console.error('The Highlightly API requires a specific header format:');
          console.error('Header name: "c05d22e5-9a84-4a95-83c7-77ef598647ed" (fixed string)');
          console.error('Header value: The API key obtained from Highlightly');
          console.error('Current headers sent:', JSON.stringify(Object.keys(headers)));
        }
      }
    } catch (e) {
      console.log('Response is not valid JSON:', responseBody.substring(0, 200) + (responseBody.length > 200 ? '...' : ''));
    }

    // Return the response with CORS headers
    return new Response(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Enhanced error response with more details
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: `Error occurred in Highlightly proxy. Please check the Edge Function logs for more information.`,
        time: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
