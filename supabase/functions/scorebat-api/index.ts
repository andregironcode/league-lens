import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Scorebat API endpoints based on the documentation
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';
const SCOREBAT_FEED_ENDPOINT = `${SCOREBAT_API_URL}/feed`;
const SCOREBAT_COMPETITION_ENDPOINT = `${SCOREBAT_API_URL}/competition`;
const SCOREBAT_TEAM_ENDPOINT = `${SCOREBAT_API_URL}/team`;

// Default API token to use if no token is provided in environment variables
const DEFAULT_API_TOKEN = 'MTk1NDQ4XzE3NDEwODA4NDdfOGNmZWUwYmVmOWVmNGRlOTY0OGE2MGM0NjA1ZGRmMWM1YzljNDc5Yg==';
const PREMIER_LEAGUE_ID = 'england-premier-league';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the Scorebat API tokens
async function getScorebatTokens() {
  // First check environment variables
  const videoApiToken = Deno.env.get('Video API Access Token') || DEFAULT_API_TOKEN;
  const embedToken = Deno.env.get('Embed Token');
  
  return {
    videoApiToken: videoApiToken || '',
    embedToken: embedToken || '',
    videoApiTokenExists: !!videoApiToken,
    embedTokenExists: !!embedToken
  };
}

// Process request to fetch Scorebat videos from feed
async function fetchScorebatVideos() {
  const { videoApiToken } = await getScorebatTokens();
  console.log('Fetching Scorebat videos...');
  
  if (!videoApiToken) {
    throw new Error('No API token available');
  }
  
  try {
    const apiUrl = `${SCOREBAT_FEED_ENDPOINT}?token=${videoApiToken}`;
    console.log('Using Scorebat feed API with token');
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched data from Scorebat API');
    
    // Add more detailed logging about the data structure
    if (Array.isArray(data)) {
      console.log(`Received array with ${data.length} items`);
      if (data.length > 0) {
        console.log('First item structure:', Object.keys(data[0]));
      }
    } else if (data && data.response && Array.isArray(data.response)) {
      console.log(`Received object with response array containing ${data.response.length} items`);
      if (data.response.length > 0) {
        console.log('First item structure:', Object.keys(data.response[0]));
      }
    } else {
      console.log('Received unexpected data format:', typeof data);
    }
    
    return {
      source: 'api',
      data
    };
  } catch (error) {
    console.error('Error using Scorebat API:', error);
    throw error;
  }
}

// Fetch Premier League videos using direct API access
async function fetchPremierLeagueVideos() {
  console.log('Fetching Premier League videos with direct API access...');
  
  const { videoApiToken } = await getScorebatTokens();
  
  if (!videoApiToken) {
    throw new Error('No API token available');
  }
  
  try {
    const apiUrl = `${SCOREBAT_COMPETITION_ENDPOINT}/${PREMIER_LEAGUE_ID}/${videoApiToken}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Premier League API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched Premier League data from API');
    
    return { 
      source: 'api',
      data 
    };
  } catch (error) {
    console.error('Error fetching Premier League videos:', error);
    throw error;
  }
}

// Fetch competition-specific videos
async function fetchCompetitionVideos(competitionId: string) {
  console.log(`Fetching videos for competition: ${competitionId}`);
  
  const { videoApiToken } = await getScorebatTokens();
  
  if (!videoApiToken) {
    throw new Error('No API token available');
  }
  
  try {
    const apiUrl = `${SCOREBAT_COMPETITION_ENDPOINT}/${competitionId}/${videoApiToken}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Competition API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched data for competition ${competitionId}`);
    
    return { 
      source: 'api',
      data 
    };
  } catch (error) {
    console.error(`Error fetching competition ${competitionId}:`, error);
    throw error;
  }
}

// Fetch team-specific videos
async function fetchTeamVideos(teamId: string) {
  console.log(`Fetching videos for team: ${teamId}`);
  
  const { videoApiToken } = await getScorebatTokens();
  
  if (!videoApiToken) {
    throw new Error('No API token available');
  }
  
  try {
    const apiUrl = `${SCOREBAT_TEAM_ENDPOINT}/${teamId}/${videoApiToken}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Team API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched data for team ${teamId}`);
    
    return { 
      source: 'api',
      data 
    };
  } catch (error) {
    console.error(`Error fetching team ${teamId}:`, error);
    throw error;
  }
}

// Check API status
async function checkApiStatus() {
  const { videoApiToken } = await getScorebatTokens();
  const result = {
    api: false
  };
  
  // Check API
  if (videoApiToken) {
    try {
      const apiUrl = `${SCOREBAT_FEED_ENDPOINT}?token=${videoApiToken}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          result.api = true;
        }
      }
    } catch (error) {
      console.error('Error checking API:', error);
    }
  }
  
  return result;
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

    // Parse request body if it exists
    let requestBody = {};
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch (e) {
        console.log('No JSON body or error parsing it:', e);
      }
    }
    
    // Handle action parameter for more flexibility
    const action = requestBody.action || url.searchParams.get('action');
    
    // Add detailed logging for incoming requests
    console.log(`Processing request to endpoint: ${endpoint}, action: ${action}`);
    
    // Route based on endpoint or action
    if (endpoint === 'videos' || action === 'videos') {
      const data = await fetchScorebatVideos();
      
      // Additional logging to help debug data structure
      console.log('Returning videos data with structure:', 
        typeof data.data === 'object' ? 
          (Array.isArray(data.data) ? `Array(${data.data.length})` : 
           Object.keys(data.data).join(', ')) : 
          typeof data.data);
          
      return new Response(JSON.stringify(data), responseInit);
    } 
    else if (endpoint === 'premier-league' || action === 'premier-league') {
      try {
        const data = await fetchPremierLeagueVideos();
        return new Response(JSON.stringify(data), responseInit);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to fetch Premier League data' }), 
          { ...responseInit, status: 500 }
        );
      }
    }
    else if (endpoint === 'competition' || action === 'competition') {
      const competitionId = requestBody.id || url.searchParams.get('id');
      if (!competitionId) {
        return new Response(
          JSON.stringify({ error: 'Competition ID is required' }), 
          { ...responseInit, status: 400 }
        );
      }
      
      const data = await fetchCompetitionVideos(competitionId);
      return new Response(JSON.stringify(data), responseInit);
    } 
    else if (endpoint === 'team' || action === 'team') {
      const teamId = requestBody.id || url.searchParams.get('id');
      if (!teamId) {
        return new Response(
          JSON.stringify({ error: 'Team ID is required' }), 
          { ...responseInit, status: 400 }
        );
      }
      
      const data = await fetchTeamVideos(teamId);
      return new Response(JSON.stringify(data), responseInit);
    } 
    else if (endpoint === 'status' || action === 'status') {
      const tokens = await getScorebatTokens();
      return new Response(
        JSON.stringify({ 
          tokens: {
            videoApiToken: tokens.videoApiTokenExists,
            embedToken: tokens.embedTokenExists,
            videoApiTokenUpdated: new Date().toISOString(),
            embedTokenUpdated: new Date().toISOString()
          }
        }), 
        responseInit
      );
    }
    else if (endpoint === 'check' || action === 'check') {
      const apiStatus = await checkApiStatus();
      return new Response(
        JSON.stringify(apiStatus),
        responseInit
      );
    }
    
    // Unknown endpoint or action
    return new Response(
      JSON.stringify({ error: 'Unknown endpoint or action' }), 
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
