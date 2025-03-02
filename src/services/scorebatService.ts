
import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';

// API constants
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';

// Widget access (free) alternative endpoints
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';
const SCOREBAT_VIDEO_URL = 'https://www.scorebat.com/embed/videopage';

// CORS proxies to bypass cross-origin restrictions
// Having multiple options improves reliability
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://crossorigin.me/'
];

// Create a map of competition names to league IDs
const competitionToLeagueMap: Record<string, { id: string, logo: string }> = {
  'ENGLAND: Premier League': { id: 'england-premier-league', logo: '/leagues/premierleague.png' },
  'SPAIN: La Liga': { id: 'spain-la-liga', logo: '/leagues/laliga.png' },
  'GERMANY: Bundesliga': { id: 'germany-bundesliga', logo: '/leagues/bundesliga.png' },
  'ITALY: Serie A': { id: 'italy-serie-a', logo: '/leagues/seriea.png' },
  'FRANCE: Ligue 1': { id: 'france-ligue-1', logo: '/leagues/ligue1.png' },
  'NETHERLANDS: Eredivisie': { id: 'netherlands-eredivisie', logo: '/leagues/eredivisie.png' },
  'PORTUGAL: Liga Portugal': { id: 'portugal-liga-portugal', logo: '/leagues/portugal.png' },
  'CHAMPIONS LEAGUE': { id: 'champions-league', logo: '/leagues/ucl.png' },
  'EUROPA LEAGUE': { id: 'europa-league', logo: '/leagues/uel.png' },
};

// Common map for conversion between competition names and IDs
const competitionIdMap: Record<string, string> = {
  'england-premier-league': 'ENGLAND: Premier League',
  'spain-la-liga': 'SPAIN: La Liga',
  'germany-bundesliga': 'GERMANY: Bundesliga',
  'italy-serie-a': 'ITALY: Serie A',
  'france-ligue-1': 'FRANCE: Ligue 1',
  'netherlands-eredivisie': 'NETHERLANDS: Eredivisie',
  'portugal-liga-portugal': 'PORTUGAL: Liga Portugal',
  'champions-league': 'CHAMPIONS LEAGUE',
  'europa-league': 'EUROPA LEAGUE',
};

// Helper functions and mappers

// Helper to extract team info from Scorebat data
const extractTeamInfo = (teamData: { name: string, url: string }): Team => {
  // Create a simple ID from team name (lowercase, spaces to dashes)
  const id = teamData.name.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name: teamData.name,
    logo: `https://www.sofascore.com/static/images/placeholders/team.svg` // Default logo
  };
};

// Helper to extract duration from embed code (approximate, as Scorebat doesn't provide duration)
const extractDuration = (): string => {
  // Random duration between 5 and 12 minutes
  const minutes = Math.floor(Math.random() * 7) + 5;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// Helper to extract views (Scorebat doesn't provide views, so we generate a random number)
const generateViews = (): number => {
  return Math.floor(Math.random() * 900000) + 100000; // Random between 100k and 1M
};

// Helper to extract score from title (approximate, as Scorebat doesn't provide structured score data)
const extractScoreFromTitle = (title: string): { home: number, away: number } => {
  // Try to find patterns like "Team1 3-2 Team2" or "Team1 3 - 2 Team2"
  const scoreRegex = /(\d+)\s*-\s*(\d+)/;
  const match = title.match(scoreRegex);
  
  if (match && match.length >= 3) {
    return {
      home: parseInt(match[1], 10),
      away: parseInt(match[2], 10)
    };
  }
  
  return {
    home: 0,
    away: 0
  };
};

// Mapper to convert Scorebat data to our application format
const scorebatMapper: ScorebatMapper = {
  mapToMatchHighlight: (video: ScorebatVideo): MatchHighlight => {
    const homeTeam = extractTeamInfo(video.team1);
    const awayTeam = extractTeamInfo(video.team2);
    
    // Extract competition info
    const competitionName = video.competition.name;
    const competitionInfo = competitionToLeagueMap[competitionName] || 
                            { id: competitionName.toLowerCase().replace(/[\s:]+/g, '-'), logo: '/leagues/other.png' };
    
    // Try to extract score from title
    const score = extractScoreFromTitle(video.title);
    
    return {
      id: video.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: video.title,
      date: video.date,
      thumbnailUrl: video.thumbnail,
      videoUrl: video.url,
      duration: extractDuration(),
      views: generateViews(),
      homeTeam,
      awayTeam,
      score,
      competition: {
        id: competitionInfo.id,
        name: competitionName,
        logo: competitionInfo.logo
      }
    };
  },
  
  mapToLeagues: (videos: ScorebatVideo[]): League[] => {
    // Group videos by competition
    const leagueMap = new Map<string, ScorebatVideo[]>();
    
    videos.forEach(video => {
      const competitionName = video.competition.name;
      if (!leagueMap.has(competitionName)) {
        leagueMap.set(competitionName, []);
      }
      leagueMap.get(competitionName)?.push(video);
    });
    
    // Convert to League objects
    const leagues: League[] = [];
    
    leagueMap.forEach((videos, competitionName) => {
      const competitionInfo = competitionToLeagueMap[competitionName] || 
                              { id: competitionName.toLowerCase().replace(/[\s:]+/g, '-'), logo: '/leagues/other.png' };
      
      const highlights = videos.map(video => scorebatMapper.mapToMatchHighlight(video));
      
      leagues.push({
        id: competitionInfo.id,
        name: competitionName,
        logo: competitionInfo.logo,
        highlights
      });
    });
    
    return leagues;
  }
};

// Try multiple endpoints to fetch data from Scorebat
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  console.log('Starting fetchScorebatVideos with multiple endpoint attempts');
  
  // Start with trying the premium API since it's more reliable
  try {
    // Check if we have an API token
    const API_TOKEN = import.meta.env.VITE_SCOREBAT_API_TOKEN || '';
    
    if (API_TOKEN) {
      console.log('API token found, attempting premium API');
      return await fetchFromPremiumAPI();
    } else {
      console.log('No API token found, skipping premium API');
    }
  } catch (premiumError) {
    console.error('Error with premium API, will try widget API:', premiumError);
  }
  
  try {
    // Try widget API as fallback
    console.log('Attempting widget API fallback');
    const widgetVideos = await fetchFromWidgetAPI();
    
    if (widgetVideos.length > 0) {
      console.log(`Successfully retrieved ${widgetVideos.length} videos from widget API`);
      return widgetVideos;
    }
    
    throw new Error('No videos found in widget API response');
  } catch (secondError) {
    console.error('All API attempts failed:', secondError);
    
    // Try one more method - fetch directly from the main page
    try {
      console.log('Attempting direct page scraping as last resort');
      return await fetchFromMainPage();
    } catch (finalError) {
      console.error('All methods failed:', finalError);
      throw finalError; // Re-throw to trigger fallback to demo data
    }
  }
};

// Fetch directly from the main page as a last resort
const fetchFromMainPage = async (): Promise<ScorebatVideo[]> => {
  try {
    // Try to fetch the main page
    const proxyUrl = `${CORS_PROXIES[0]}${encodeURIComponent('https://www.scorebat.com/')}`;
    console.log('Fetching main page:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Main page fetch error: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Look for JSON data in the page
    const dataMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/s) || 
                      html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s) ||
                      html.match(/<script[^>]*>var\s+initialData\s*=\s*({.+?});<\/script>/s);
    
    if (dataMatch && dataMatch[1]) {
      console.log('Found data in main page');
      let extractedData;
      
      try {
        extractedData = JSON.parse(dataMatch[1]);
      } catch (parseError) {
        console.error('Error parsing extracted data:', parseError);
        throw new Error('Failed to parse data from main page');
      }
      
      // Find videos in the extracted data
      let videos: any[] = [];
      
      if (extractedData.videos && Array.isArray(extractedData.videos)) {
        videos = extractedData.videos;
      } else if (extractedData.matches && Array.isArray(extractedData.matches)) {
        videos = extractedData.matches;
      } else if (extractedData.items && Array.isArray(extractedData.items)) {
        videos = extractedData.items;
      } else {
        // Search recursively for any array with video-like objects
        const findVideos = (obj: any): any[] => {
          if (!obj || typeof obj !== 'object') return [];
          
          for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0 && 
                obj[key][0] && obj[key][0].title && obj[key][0].url) {
              return obj[key];
            }
            
            if (typeof obj[key] === 'object') {
              const result = findVideos(obj[key]);
              if (result.length > 0) return result;
            }
          }
          
          return [];
        };
        
        videos = findVideos(extractedData);
      }
      
      if (videos.length === 0) {
        throw new Error('No videos found in main page data');
      }
      
      console.log(`Found ${videos.length} videos from main page`);
      
      // Transform to standard format
      return videos.map(item => ({
        id: item.id || item.matchId || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: item.title || `${item.side1?.name || 'Team 1'} vs ${item.side2?.name || 'Team 2'}`,
        embed: item.embed || '',
        url: item.url || item.matchviewUrl || '',
        thumbnail: item.thumbnail || item.image || '',
        date: item.date || new Date().toISOString(),
        competition: {
          id: item.competition?.id || '',
          name: item.competition?.name || item.competition || 'Unknown',
          url: item.competition?.url || item.competitionUrl || '',
        },
        matchviewUrl: item.matchviewUrl || item.url || '',
        competitionUrl: item.competitionUrl || item.competition?.url || '',
        team1: {
          name: item.side1?.name || item.team1?.name || 'Unknown',
          url: item.side1?.url || item.team1?.url || '',
        },
        team2: {
          name: item.side2?.name || item.team2?.name || 'Unknown',
          url: item.side2?.url || item.team2?.url || '',
        }
      }));
    }
    
    throw new Error('Could not find video data in main page');
  } catch (error) {
    console.error('Error fetching from main page:', error);
    throw error;
  }
};

// Fetch from the premium API endpoint (requires token)
const fetchFromPremiumAPI = async (): Promise<ScorebatVideo[]> => {
  try {
    // Get the API token from environment variables
    const API_TOKEN = import.meta.env.VITE_SCOREBAT_API_TOKEN || '';
    
    if (!API_TOKEN) {
      console.warn('No Scorebat API token found. Cannot use premium API.');
      throw new Error('No API token configured');
    }
    
    console.log('Using Scorebat premium API with token');
    
    // Directly use the API endpoint with token - avoiding CORS proxy when possible
    const apiUrl = `${SCOREBAT_API_URL}/feed?token=${API_TOKEN}`;
    
    try {
      // First try without CORS proxy
      console.log('Trying direct API call without CORS proxy');
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors' // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        console.warn(`Direct API call failed with status: ${response.status}`);
        throw new Error(`Direct API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Direct API call succeeded with data');
      
      // Check if the response has the expected structure
      if (!data || !data.response) {
        throw new Error('Unexpected API response format');
      }
      
      // Transform the data
      return transformPremiumApiResponse(data);
      
    } catch (directError) {
      console.warn('Direct API call failed, trying with CORS proxy:', directError);
      
      // Try each CORS proxy in order
      for (const proxy of CORS_PROXIES) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(apiUrl)}`;
          console.log(`Trying with CORS proxy: ${proxy}`);
          
          const proxyResponse = await fetch(proxyUrl, {
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (!proxyResponse.ok) {
            console.warn(`Proxy ${proxy} failed with status: ${proxyResponse.status}`);
            continue; // Try next proxy
          }
          
          const proxyData = await proxyResponse.json();
          console.log(`CORS proxy ${proxy} succeeded with data`);
          
          // Check if the response has the expected structure
          if (!proxyData || !proxyData.response) {
            console.warn(`Proxy ${proxy} returned unexpected format`);
            continue; // Try next proxy
          }
          
          // Transform the data
          return transformPremiumApiResponse(proxyData);
        } catch (proxyError) {
          console.warn(`Error with proxy ${proxy}:`, proxyError);
          // Continue to next proxy
        }
      }
      
      // If all proxies fail
      throw new Error('All CORS proxies failed');
    }
  } catch (error) {
    console.error('Premium API error:', error);
    throw error;
  }
};

// Helper to transform premium API response
const transformPremiumApiResponse = (data: any): ScorebatVideo[] => {
  // Additional logging to debug the response structure
  console.log('Premium API response keys:', Object.keys(data));
  
  if (!data.response) {
    console.warn('Response property missing in API data');
    
    // Try to find any array in the response that might contain videos
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        console.log(`Found potential video array in key: ${key}`);
        return transformVideoArray(data[key]);
      }
    }
    
    throw new Error('No videos found in API response');
  }
  
  if (!Array.isArray(data.response)) {
    console.warn('Response is not an array:', typeof data.response);
    throw new Error('API response format invalid - response is not an array');
  }
  
  if (data.response.length === 0) {
    console.warn('Response array is empty');
    throw new Error('No videos found in API response');
  }
  
  console.log(`Found ${data.response.length} videos from premium API`);
  
  return transformVideoArray(data.response);
};

// Helper to transform an array of video objects with flexible format handling
const transformVideoArray = (videoArray: any[]): ScorebatVideo[] => {
  // Transform with flexible property access
  return videoArray.map((item: any) => ({
    id: item.matchId || item.id || item.title || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: item.title || `${item.side1?.name || 'Team 1'} vs ${item.side2?.name || 'Team 2'}`,
    embed: item.embed || '',
    url: item.matchviewUrl || item.url || '',
    thumbnail: item.thumbnail || item.image || '',
    date: item.date || new Date().toISOString(),
    competition: {
      id: item.competitionId || '',
      name: item.competition || 'Unknown',
      url: item.competitionUrl || '',
    },
    matchviewUrl: item.matchviewUrl || item.url || '',
    competitionUrl: item.competitionUrl || '',
    team1: {
      name: item.side1?.name || 'Unknown',
      url: item.side1?.url || '',
    },
    team2: {
      name: item.side2?.name || 'Unknown',
      url: item.side2?.url || '',
    }
  }));
};

// Fetch from the widget API endpoint (no token required)
const fetchFromWidgetAPI = async (): Promise<ScorebatVideo[]> => {
  try {
    // Try different widget endpoints until one works
    const endpoints = [
      `${SCOREBAT_VIDEO_URL}`,
      `${SCOREBAT_WIDGET_URL}videopage?_format=json`, 
      `${SCOREBAT_WIDGET_URL}livescore?json=1`,
      `${SCOREBAT_WIDGET_URL}feed`
    ];
    
    let lastError = null;
    
    // Try each endpoint with each CORS proxy
    for (const endpoint of endpoints) {
      for (const proxy of CORS_PROXIES) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(endpoint)}`;
          console.log(`Trying widget endpoint with proxy: ${endpoint} via ${proxy}`);
          
          const response = await fetch(proxyUrl, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) {
            console.warn(`Widget endpoint ${endpoint} with proxy ${proxy} failed: ${response.status}`);
            continue; // Try next proxy or endpoint
          }
          
          const text = await response.text();
          if (!text || text.trim() === '') {
            console.warn(`Empty response from ${endpoint} with proxy ${proxy}`);
            continue; // Try next proxy or endpoint
          }
          
          // Try to parse the response as JSON
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            // If it's not valid JSON, it might be HTML with embedded JSON
            if (text.includes('<!doctype html>') || text.includes('<html')) {
              console.log('Received HTML, trying to extract JSON data...');
              
              // Look for the __PRELOADED_STATE__ variable or any JSON object
              const stateMatch = text.match(/__PRELOADED_STATE__\s*=\s*({.+?});/s) || 
                               text.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s) ||
                               text.match(/({".+})/);
              
              if (stateMatch && stateMatch[1]) {
                try {
                  data = JSON.parse(stateMatch[1]);
                  console.log('Successfully extracted data from HTML');
                } catch (parseError) {
                  console.warn('Failed to parse extracted HTML data:', parseError);
                  continue; // Try next proxy or endpoint
                }
              } else {
                console.warn('Could not extract data from HTML response');
                continue; // Try next proxy or endpoint
              }
            } else {
              console.warn('Response is not valid JSON');
              continue; // Try next proxy or endpoint
            }
          }
          
          // Find the videos array in the response
          let videoArray = [];
          
          if (data.videos && Array.isArray(data.videos)) {
            videoArray = data.videos;
          } else if (data.matches && Array.isArray(data.matches)) {
            videoArray = data.matches;
          } else if (data.response && Array.isArray(data.response)) {
            videoArray = data.response;
          } else if (Array.isArray(data)) {
            videoArray = data;
          } else {
            // Try to find any array in the data that looks like videos
            for (const key in data) {
              if (Array.isArray(data[key]) && data[key].length > 0 && 
                  (data[key][0].title || data[key][0].url)) {
                videoArray = data[key];
                break;
              }
            }
            
            if (videoArray.length === 0) {
              console.warn('No videos found in response from endpoint:', endpoint);
              continue; // Try next proxy or endpoint
            }
          }
          
          if (videoArray.length === 0) {
            console.warn('Widget API returned empty video array from endpoint:', endpoint);
            continue; // Try next proxy or endpoint
          }
          
          console.log(`Found ${videoArray.length} videos from widget API endpoint: ${endpoint}`);
          
          // Transform to our standard format
          const transformedData = videoArray.map((item: any) => ({
            id: item.id || item.matchId || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: item.title || `${item.side1?.name || 'Team 1'} vs ${item.side2?.name || 'Team 2'}`,
            embed: item.embed || '',
            url: item.url || item.matchviewUrl || '',
            thumbnail: item.thumbnail || item.image || '',
            date: item.date || new Date().toISOString(),
            competition: {
              id: item.competition?.id || '',
              name: item.competition?.name || item.competition || 'Unknown',
              url: item.competition?.url || item.competitionUrl || '',
            },
            matchviewUrl: item.matchviewUrl || item.url || '',
            competitionUrl: item.competitionUrl || item.competition?.url || '',
            team1: {
              name: item.side1?.name || 'Unknown',
              url: item.side1?.url || '',
            },
            team2: {
              name: item.side2?.name || 'Unknown',
              url: item.side2?.url || '',
            }
          }));
          
          return transformedData;
        } catch (error) {
          console.warn(`Failed with endpoint ${endpoint} and proxy ${proxy}:`, error);
          lastError = error;
          // Continue to the next proxy or endpoint
        }
      }
    }
    
    // If we've tried all endpoints and proxies and none worked, throw the last error
    throw lastError || new Error('All widget API endpoints failed');
    
  } catch (error) {
    console.error('Widget API error:', error);
    throw error;
  }
};

// Fetch data for a specific competition using the CORS proxy
export const fetchCompetitionVideos = async (competitionId: string): Promise<ScorebatVideo[]> => {
  try {
    // Use the CORS proxy with the competition endpoint
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${SCOREBAT_WIDGET_URL}competition/${competitionId}?json=1`)}`;
    console.log(`Fetching competition ${competitionId} highlights...`);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Competition API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data format from widget to match our expected ScorebatVideo format
    const transformedData: ScorebatVideo[] = Array.isArray(data) ? data.map(item => ({
      id: item.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title,
      embed: item.embed || '',
      url: item.url,
      thumbnail: item.thumbnail,
      date: item.date,
      competition: {
        id: item.competition?.id || '',
        name: item.competition?.name || 'Unknown',
        url: item.competition?.url || '',
      },
      matchviewUrl: item.matchviewUrl || '',
      competitionUrl: item.competitionUrl || '',
      team1: {
        name: item.side1?.name || 'Unknown',
        url: item.side1?.url || '',
      },
      team2: {
        name: item.side2?.name || 'Unknown',
        url: item.side2?.url || '',
      }
    })) : [];
    
    return transformedData;
  } catch (error) {
    console.error(`Error fetching competition ${competitionId} highlights:`, error);
    throw error; // Re-throw to let fallback service handle it
  }
};

// Fetch data for a specific team using the CORS proxy
export const fetchTeamVideos = async (teamId: string): Promise<ScorebatVideo[]> => {
  try {
    // Use the CORS proxy with the team endpoint
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${SCOREBAT_WIDGET_URL}team/${teamId}?json=1`)}`;
    console.log(`Fetching from Scorebat Widget API (team ${teamId}) with CORS Proxy:`, proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Scorebat Widget API error response (team):', errorData);
      throw new Error(`Scorebat Widget API team error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Scorebat Widget API team ${teamId} response data:`, data);
    
    // Transform the data format from widget to match our expected ScorebatVideo format
    const transformedData: ScorebatVideo[] = Array.isArray(data) ? data.map(item => ({
      id: item.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title,
      embed: item.embed || '',
      url: item.url,
      thumbnail: item.thumbnail,
      date: item.date,
      competition: {
        id: item.competition?.id || '',
        name: item.competition?.name || 'Unknown',
        url: item.competition?.url || '',
      },
      matchviewUrl: item.matchviewUrl || '',
      competitionUrl: item.competitionUrl || '',
      team1: {
        name: item.side1?.name || 'Unknown',
        url: item.side1?.url || '',
      },
      team2: {
        name: item.side2?.name || 'Unknown',
        url: item.side2?.url || '',
      }
    })) : [];
    
    console.log(`Transformed team video data count:`, transformedData.length);
    return transformedData;
  } catch (error) {
    console.error(`Error fetching from Scorebat Widget API (team ${teamId}) with CORS Proxy:`, error);
    throw error; // Re-throw to let fallback service handle it
  }
};

// Get recommended highlights (latest videos from API)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  console.log('Getting recommended highlights from API');
  const videos = await fetchScorebatVideos();
  
  // Sort videos by date (newest first)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Take the first 5 videos as recommended (newest)
  const recommendedVideos = sortedVideos.slice(0, 5);
  
  console.log(`Returning ${recommendedVideos.length} recommended videos`);
  return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Use widget API to get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  console.log('Getting league highlights from API');
  const videos = await fetchScorebatVideos();
  
  // Sort videos within each league by date (newest first)
  const leagues = scorebatMapper.mapToLeagues(videos);
  
  // Sort highlights within each league by date (newest first)
  leagues.forEach(league => {
    league.highlights.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
  
  console.log(`Returning ${leagues.length} leagues with highlights`);
  return leagues;
};

// Use widget API to get highlights for a specific competition
export const getCompetitionHighlights = async (competitionId: string): Promise<MatchHighlight[]> => {
  const videos = await fetchCompetitionVideos(competitionId);
  
  // Sort by date (newest first)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Use widget API to get a specific match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  // For a specific match, we currently don't have a direct widget API endpoint
  // So we'll get all videos and find the matching one
  const videos = await fetchScorebatVideos();
  const video = videos.find(v => v.id === id);
  
  if (!video) return null;
  
  return scorebatMapper.mapToMatchHighlight(video);
};

// Use widget API to get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  const videos = await fetchTeamVideos(teamId);
  
  // Sort by date (newest first)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Search highlights using widget API data
export const searchHighlights = async (query: string): Promise<MatchHighlight[]> => {
  if (!query.trim()) return [];
  
  const videos = await fetchScorebatVideos();
  const normalizedQuery = query.toLowerCase().trim();
  
  // Search in title, team names, and competition name
  const matchingVideos = videos.filter(video => {
    return (
      video.title.toLowerCase().includes(normalizedQuery) ||
      video.team1.name.toLowerCase().includes(normalizedQuery) ||
      video.team2.name.toLowerCase().includes(normalizedQuery) ||
      video.competition.name.toLowerCase().includes(normalizedQuery)
    );
  });
  
  // Sort by date (newest first)
  const sortedVideos = [...matchingVideos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};
