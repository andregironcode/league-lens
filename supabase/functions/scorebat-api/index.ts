import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Scorebat API endpoints
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';
const SCOREBAT_COMPETITION_URL = 'https://www.scorebat.com/video-api/v3/competition';

// Premier League specific token
const PREMIER_LEAGUE_TOKEN = 'MTk1NDQ4XzE3NDEwODA4NDdfOGNmZWUwYmVmOWVmNGRlOTY0OGE2MGM0NjA1ZGRmMWM1YzljNDc5Yg==';
const PREMIER_LEAGUE_ID = 'england-premier-league';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the Scorebat API tokens
async function getScorebatTokens() {
  const videoApiToken = Deno.env.get('Video API Access Token') || PREMIER_LEAGUE_TOKEN;
  const embedToken = Deno.env.get('Embed Token');
  
  return {
    videoApiToken: videoApiToken || '',
    embedToken: embedToken || '',
    videoApiTokenExists: !!videoApiToken,
    embedTokenExists: !!embedToken
  };
}

// Process request to fetch Scorebat videos
async function fetchScorebatVideos() {
  const { videoApiToken } = await getScorebatTokens();
  console.log('Fetching Scorebat videos...');
  
  // Try premium API if we have a token
  if (videoApiToken) {
    try {
      const apiUrl = `${SCOREBAT_API_URL}/feed?token=${videoApiToken}`;
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

// Fetch Premier League videos using direct API access
async function fetchPremierLeagueVideos() {
  console.log('Fetching Premier League videos with direct API access...');
  try {
    const apiUrl = `${SCOREBAT_COMPETITION_URL}/${PREMIER_LEAGUE_ID}/${PREMIER_LEAGUE_TOKEN}`;
    
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
      source: 'premium',
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
  
  // For Premier League, use the direct API with token
  if (competitionId === PREMIER_LEAGUE_ID) {
    return fetchPremierLeagueVideos();
  }
  
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

// Check API status
async function checkApiStatus() {
  const { videoApiToken } = await getScorebatTokens();
  const result = {
    premium: false,
    widget: false
  };
  
  // Check premium API
  if (videoApiToken) {
    try {
      const apiUrl = `${SCOREBAT_API_URL}/feed?token=${videoApiToken}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          result.premium = true;
        }
      }
    } catch (error) {
      console.error('Error checking premium API:', error);
    }
  }
  
  // Check widget API
  try {
    const widgetUrl = `${SCOREBAT_WIDGET_URL}livescore?json=1`;
    const response = await fetch(widgetUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      await response.json();
      result.widget = true;
    }
  } catch (error) {
    console.error('Error checking widget API:', error);
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
    
    // Route based on endpoint or action
    if (endpoint === 'videos' || action === 'videos') {
      const data = await fetchScorebatVideos();
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
