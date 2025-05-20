
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

    // Important: According to Highlightly documentation, we need to set the API key as the 
    // value of a header with the name 'c05d22e5-9a84-4a95-83c7-77ef598647ed'
    const apiKeyHeaderName = 'c05d22e5-9a84-4a95-83c7-77ef598647ed';
    
    // Log the headers for debugging
    console.log(`Setting up headers with API key header: ${apiKeyHeaderName}`);
    
    // Create headers object with the API key header
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      [apiKeyHeaderName]: apiToken  // Set the API key as the value of the specific header name
    };
    
    console.log('Final request headers:', Object.keys(headers).join(', '));
    
    // Forward the request to the Highlightly API
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    console.log(`Highlightly API response: ${response.status} ${response.statusText}`);
    
    // Log any headers in the response for debugging
    console.log('Response headers:', [...response.headers.entries()].map(([k, v]) => `${k}: ${v}`).join(', '));

    // Read the response body
    const responseBody = await response.text();
    
    // Try to parse JSON to check if it's valid and log for debugging
    try {
      const jsonResponse = JSON.parse(responseBody);
      console.log('Response contains valid JSON:', JSON.stringify(jsonResponse).substring(0, 200));
      
      // Check for specific error messages that might help debugging
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
