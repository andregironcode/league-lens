
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Scorebat API endpoints
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the Scorebat API token
async function getScorebatToken(): Promise<string> {
  // First, check for the token in Supabase secrets
  const scorebatToken = Deno.env.get('SCOREBAT_API_TOKEN');
  
  if (scorebatToken) {
    console.log('Using Scorebat API token from environment variables');
    return scorebatToken;
  } else {
    console.log('No Scorebat API token found in environment variables');
    return '';
  }
}

// Process request to fetch Scorebat videos
async function fetchScorebatVideos() {
  const token = await getScorebatToken();
  console.log('Fetching Scorebat videos...');
  
  // Try premium API if we have a token
  if (token) {
    try {
      const apiUrl = `${SCOREBAT_API_URL}/feed?token=${token}`;
      console.log('Using premium API with token');
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Premium API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched data from premium API');
      
      return {
        source: 'premium',
        data
      };
    } catch (error) {
      console.error('Error using premium API:', error);
      // Fall through to widget API
    }
  }
  
  // Try widget API as fallback
  try {
    const widgetUrl = `${SCOREBAT_WIDGET_URL}livescore?json=1`;
    console.log('Using widget API as fallback');
    
    const response = await fetch(widgetUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Widget API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched data from widget API');
    
    return {
      source: 'widget',
      data
    };
  } catch (error) {
    console.error('Error using widget API:', error);
    throw new Error('All API attempts failed');
  }
}

// Fetch competition-specific videos
async function fetchCompetitionVideos(competitionId: string) {
  console.log(`Fetching videos for competition: ${competitionId}`);
  try {
    const competitionUrl = `${SCOREBAT_WIDGET_URL}competition/${competitionId}?json=1`;
    
    const response = await fetch(competitionUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Competition API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error fetching competition ${competitionId}:`, error);
    throw error;
  }
}

// Fetch team-specific videos
async function fetchTeamVideos(teamId: string) {
  console.log(`Fetching videos for team: ${teamId}`);
  try {
    const teamUrl = `${SCOREBAT_WIDGET_URL}team/${teamId}?json=1`;
    
    const response = await fetch(teamUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Team API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error fetching team ${teamId}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Add CORS headers to all responses
  const responseInit = {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  };
  
  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    
    // Route based on endpoint
    if (endpoint === 'videos') {
      const data = await fetchScorebatVideos();
      return new Response(JSON.stringify(data), responseInit);
    } 
    else if (endpoint === 'competition') {
      const competitionId = url.searchParams.get('id');
      if (!competitionId) {
        return new Response(
          JSON.stringify({ error: 'Competition ID is required' }), 
          { ...responseInit, status: 400 }
        );
      }
      
      const data = await fetchCompetitionVideos(competitionId);
      return new Response(JSON.stringify(data), responseInit);
    } 
    else if (endpoint === 'team') {
      const teamId = url.searchParams.get('id');
      if (!teamId) {
        return new Response(
          JSON.stringify({ error: 'Team ID is required' }), 
          { ...responseInit, status: 400 }
        );
      }
      
      const data = await fetchTeamVideos(teamId);
      return new Response(JSON.stringify(data), responseInit);
    } 
    else if (endpoint === 'status') {
      const token = await getScorebatToken();
      return new Response(
        JSON.stringify({ 
          hasToken: !!token,
          token: token ? '******' : null
        }), 
        responseInit
      );
    }
    
    // Unknown endpoint
    return new Response(
      JSON.stringify({ error: 'Unknown endpoint' }), 
      { ...responseInit, status: 404 }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { ...responseInit, status: 500 }
    );
  }
});
