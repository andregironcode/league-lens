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

// Team names to IDs mapping for improved data enrichment
const teamNameToIdMap: Record<string, string> = {
  // Premier League
  'Arsenal': 'arsenal',
  'Aston Villa': 'aston-villa',
  'Bournemouth': 'bournemouth',
  'Brentford': 'brentford',
  'Brighton': 'brighton',
  'Chelsea': 'chelsea',
  'Crystal Palace': 'crystal-palace',
  'Everton': 'everton',
  'Fulham': 'fulham',
  'Leeds': 'leeds',
  'Leicester City': 'leicester-city',
  'Liverpool': 'liverpool',
  'Manchester City': 'manchester-city',
  'Manchester United': 'manchester-united',
  'Newcastle United': 'newcastle-united',
  'Nottingham Forest': 'nottingham-forest',
  'Southampton': 'southampton',
  'Tottenham Hotspur': 'tottenham-hotspur',
  'West Ham United': 'west-ham-united',
  'Wolves': 'wolves',
  
  // La Liga
  'Atletico Madrid': 'atletico-madrid',
  'Barcelona': 'barcelona',
  'Real Madrid': 'real-madrid',
  
  // Other major teams
  'Bayern Munich': 'bayern-munich',
  'Borussia Dortmund': 'borussia-dortmund',
  'Inter Milan': 'inter-milan',
  'AC Milan': 'ac-milan',
  'Juventus': 'juventus',
  'PSG': 'psg',
  
  // Common alternative naming patterns
  'Man United': 'manchester-united',
  'Man Utd': 'manchester-united',
  'Man City': 'manchester-city',
  'Spurs': 'tottenham-hotspur',
  'Atletico': 'atletico-madrid',
  'Barca': 'barcelona',
  'Barça': 'barcelona',
  'Real': 'real-madrid',
  'Bayern': 'bayern-munich',
  'Juve': 'juventus',
  'Inter': 'inter-milan',
  'Paris Saint-Germain': 'psg',
  'Paris SG': 'psg',
};

// Helper to extract team names from title
function extractTeamsFromTitle(title: string): { home: string, away: string } {
  const patterns = [
    /^(.+?)\s+vs\s+(.+?)(?:\s+-\s+|$|\s+\d+-\d+)/i,
    /^(.+?)\s+-\s+(.+?)(?:\s+\d+-\d+|\s+\(|$)/i,
    /^(.+?)\s+v\s+(.+?)(?:\s+-\s+|$|\s+\d+-\d+)/i,
    /^(.+?)[\s-]+(\d+)[^\d]+(\d+)[\s-]+(.+?)(?:\s+\||$)/i, // Format: Team1 2-1 Team2
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    
    if (match) {
      // For the score-in-middle pattern (Team1 2-1 Team2)
      if (match.length >= 5 && /\d+/.test(match[2])) {
        return {
          home: match[1].trim(),
          away: match[4].trim()
        };
      }
      
      if (match.length >= 3) {
        return {
          home: match[1].trim(),
          away: match[2].trim()
        };
      }
    }
  }
  
  return { home: 'Unknown', away: 'Unknown' };
}

// Helper to enrich team data
function enrichTeamData(teamData: any, title: string, isHome: boolean): any {
  // If team data is missing or incomplete
  if (!teamData || (typeof teamData === 'object' && !teamData.name)) {
    // Extract teams from title
    const { home, away } = extractTeamsFromTitle(title);
    const teamName = isHome ? home : away;
    
    // Create team object
    return {
      name: teamName,
      url: '',
      id: teamNameToIdMap[teamName] || teamName.toLowerCase().replace(/\s+/g, '-')
    };
  }
  
  // If team data is a string, convert to object
  if (typeof teamData === 'string') {
    return {
      name: teamData,
      url: '',
      id: teamNameToIdMap[teamData] || teamData.toLowerCase().replace(/\s+/g, '-')
    };
  }
  
  // If team data exists but needs ID enrichment
  if (!teamData.id && teamData.name) {
    teamData.id = teamNameToIdMap[teamData.name] || teamData.name.toLowerCase().replace(/\s+/g, '-');
  }
  
  return teamData;
}

// Process and enrich video data
function enrichVideoData(videos: any[]): any[] {
  return videos.map(video => {
    // Make sure we have team data
    video.team1 = enrichTeamData(video.team1 || video.side1, video.title, true);
    video.team2 = enrichTeamData(video.team2 || video.side2, video.title, false);
    
    // For compatibility
    video.side1 = video.team1;
    video.side2 = video.team2;
    
    return video;
  });
}

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
    
    // Process the data based on its structure
    let processedData;
    
    if (Array.isArray(data)) {
      console.log(`Received array with ${data.length} items`);
      processedData = enrichVideoData(data);
    } else if (data && data.response && Array.isArray(data.response)) {
      console.log(`Received object with response array containing ${data.response.length} items`);
      processedData = enrichVideoData(data.response);
    } else {
      console.log('Received unexpected data format:', typeof data);
      throw new Error('Invalid API response format');
    }
    
    return {
      source: 'api',
      data: processedData
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
    
    // Process the data based on its structure
    let processedData;
    
    if (Array.isArray(data)) {
      console.log(`Received array with ${data.length} items`);
      processedData = enrichVideoData(data);
    } else if (data && data.response && Array.isArray(data.response)) {
      console.log(`Received object with response array containing ${data.response.length} items`);
      processedData = enrichVideoData(data.response);
    } else {
      console.log('Received unexpected data format:', typeof data);
      throw new Error('Invalid API response format');
    }
    
    return { 
      source: 'api',
      data: processedData
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
    
    // Process the data
    let processedData;
    
    if (Array.isArray(data)) {
      console.log(`Received array with ${data.length} items`);
      processedData = enrichVideoData(data);
    } else if (data && data.response && Array.isArray(data.response)) {
      console.log(`Received object with response array containing ${data.response.length} items`);
      processedData = enrichVideoData(data.response);
    } else {
      console.log('Received unexpected data format:', typeof data);
      throw new Error('Invalid API response format');
    }
    
    return { 
      source: 'api',
      data: processedData
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
    
    // Process the data
    let processedData;
    
    if (Array.isArray(data)) {
      console.log(`Received array with ${data.length} items`);
      processedData = enrichVideoData(data);
    } else if (data && data.response && Array.isArray(data.response)) {
      console.log(`Received object with response array containing ${data.response.length} items`);
      processedData = enrichVideoData(data.response);
    } else {
      console.log('Received unexpected data format:', typeof data);
      throw new Error('Invalid API response format');
    }
    
    return { 
      source: 'api',
      data: processedData
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
