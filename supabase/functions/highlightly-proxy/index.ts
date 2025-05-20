
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// The Highlightly API base URL
const API_BASE_URL = "https://soccer.highlightly.net";

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

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

    // Forward the request to the Highlightly API
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        'Authorization': apiToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    // Log response status
    console.log(`Highlightly API response: ${response.status} ${response.statusText}`);

    // Read the response body
    const responseBody = await response.text();
    
    // Try to parse JSON to check if it's valid
    try {
      JSON.parse(responseBody);
      console.log('Response contains valid JSON');
    } catch (e) {
      console.log('Response is not valid JSON:', responseBody.substring(0, 200));
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
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
