
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

    // CRITICAL: According to Highlightly documentation for direct subscription,
    // the API key needs to be the VALUE of a header with the name 'c05d22e5-9a84-4a95-83c7-77ef598647ed'
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    // This is the API key header name required by Highlightly
    headers['c05d22e5-9a84-4a95-83c7-77ef598647ed'] = apiToken;
    
    console.log('Headers prepared with: Accept, Content-Type, and the special API key header');
    
    // Forward the request to the Highlightly API
    const response = await fetch(targetUrl.toString(), {
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
      console.log('Response contains valid JSON:', JSON.stringify(jsonResponse).substring(0, 200));
      
      if (jsonResponse.error || jsonResponse.message) {
        console.error('API error message:', jsonResponse.error || jsonResponse.message);
      }
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
