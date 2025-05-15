
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get matchId from URL query parameters
    const url = new URL(req.url);
    const matchId = url.searchParams.get('matchId');
    
    // Build the request URL
    const apiUrl = matchId 
      ? `https://soccer.highlightly.net/highlights?matchId=${matchId}`
      : 'https://soccer.highlightly.net/highlights';
    
    // Set up the headers for the Highlightly API
    const headers = {
      'Content-Type': 'application/json',
      'x-rapidapi-key': Deno.env.get('HIGHLIGHTLY_API_KEY') || '',
      'x-rapidapi-host': 'soccer.highlightly.net'
    };
    
    // Make the request to the Highlightly API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching highlights: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch highlights: ${response.status}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status 
        }
      );
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Return the data to the frontend
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error(`Error in get-highlights function: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
