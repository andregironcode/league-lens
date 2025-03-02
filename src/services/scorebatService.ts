import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';

// API constants
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';

// Widget access (free) doesn't require a token
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';

// CORS proxy to bypass cross-origin restrictions
const CORS_PROXY = 'https://corsproxy.io/?';

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

// Fetch data from Scorebat API using the CORS proxy and the official v3 API
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  try {
    // Get the API token from environment variables
    const API_TOKEN = import.meta.env.VITE_SCOREBAT_API_TOKEN || '';
    
    if (!API_TOKEN) {
      console.warn('No Scorebat API token found. Using free widget access instead.');
      return fetchFromWidgetAPI();
    }
    
    console.log('Using Scorebat API token for authenticated access');
    
    // Use the CORS proxy with the official v3 API
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${SCOREBAT_API_URL}?token=${API_TOKEN}`)}`;
    console.log('Fetching from Scorebat API v3:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Scorebat API v3 error response: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorText);
      
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.error('Empty response from Scorebat API v3');
      throw new Error('Empty response from API');
    }
    
    let data;
    
    try {
      data = JSON.parse(text);
      console.log('Successfully parsed JSON response from API v3:', data);
    } catch (e) {
      console.error('Failed to parse API v3 response as JSON:', e);
      console.error('Raw response:', text);
      throw new Error('Failed to parse API v3 response');
    }
    
    if (!data || !data.response || !Array.isArray(data.response)) {
      console.error('Unexpected API response format:', data);
      throw new Error('Unexpected API response format');
    }
    
    console.log(`Received ${data.response.length} videos from API v3`);
    
    // Check if the response is empty or has no videos
    if (data.response.length === 0) {
      console.error('No videos found in API v3 response');
      throw new Error('No videos found in API response');
    }
    
    // Transform the v3 API data format to match our expected ScorebatVideo format
    const transformedData: ScorebatVideo[] = data.response.map(item => ({
      id: item.matchId || item.title,
      title: item.title,
      embed: item.embed || '',
      url: item.matchviewUrl || '',
      thumbnail: item.thumbnail,
      date: item.date,
      competition: {
        id: item.competitionId || '',
        name: item.competition || 'Unknown',
        url: item.competitionUrl || '',
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
    }));
    
    console.log('Transformed video data count from v3 API:', transformedData.length);
    
    if (transformedData.length === 0) {
      throw new Error('No videos found after transformation');
    }
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching from Scorebat API v3 with CORS Proxy:', error);
    console.log('Falling back to widget API due to error with v3 API');
    // If any errors occur with the official API, fall back to the widget API
    return fetchFromWidgetAPI();
  }
};

// Fallback function to fetch data from the widget API
const fetchFromWidgetAPI = async (): Promise<ScorebatVideo[]> => {
  try {
    // New direct video highlights API with explicit JSON parameter
    const widgetUrl = `${SCOREBAT_WIDGET_URL}videopage?_=js`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(widgetUrl)}`;
    
    console.log('Fetching from Scorebat Widget Videopage API with CORS Proxy');
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Widget API error: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.error('Empty response from Scorebat Widget API');
      throw new Error('Empty response from Widget API');
    }
    
    let data;
    
    // Check if it's actually HTML with JSON embedded
    if (text.includes('<!doctype html>') || text.includes('<html')) {
      console.warn('Received HTML instead of JSON. Attempting to extract data from HTML.');
      
      // Look for the __PRELOADED_STATE__ variable in the HTML
      const stateMatch = text.match(/__PRELOADED_STATE__\s*=\s*({.+?});/s);
      
      if (stateMatch && stateMatch[1]) {
        try {
          data = JSON.parse(stateMatch[1]);
          console.log('Successfully extracted data from HTML response');
        } catch (e) {
          console.error('Failed to parse extracted JSON from HTML', e);
          throw new Error('Failed to parse widget API response');
        }
      } else {
        // Try another approach - look for a JSON object anywhere in the response
        const jsonMatch = text.match(/({".+})/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            data = JSON.parse(jsonMatch[1]);
            console.log('Found and extracted JSON object from response');
          } catch (e) {
            console.error('Failed to parse JSON object from response', e);
            throw new Error('Could not extract data from HTML response');
          }
        } else {
          console.error('No usable data found in HTML response');
          throw new Error('Could not extract data from HTML response');
        }
      }
    } else {
      // If it's already JSON, parse it directly
      try {
        data = JSON.parse(text);
        console.log('Successfully parsed JSON response from widget API');
      } catch (e) {
        console.error('JSON parse error:', e);
        throw new Error('Failed to parse widget API response');
      }
    }
    
    // Check for valid data structure
    if (!data) {
      console.error('No data found in response');
      throw new Error('No data found in response');
    }
    
    // Use the videos array if it exists, otherwise try the matches array or response array
    let videoArray = [];
    
    if (data.videos && Array.isArray(data.videos)) {
      videoArray = data.videos;
      console.log('Using videos array from response');
    } else if (data.matches && Array.isArray(data.matches)) {
      videoArray = data.matches;
      console.log('Using matches array from response');
    } else if (data.response && Array.isArray(data.response)) {
      videoArray = data.response;
      console.log('Using response array from data');
    } else {
      console.error('No usable video array found in data:', data);
      throw new Error('No videos found in API response');
    }
    
    // Check if the video array is empty
    if (videoArray.length === 0) {
      console.error('Widget API returned empty video array');
      throw new Error('No videos found in Widget API response');
    }
    
    // Transform the data format from widget to match our expected ScorebatVideo format
    const transformedData: ScorebatVideo[] = videoArray.map(item => ({
      id: item.id || item.matchId || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title,
      embed: item.embed || '',
      url: item.url || item.matchviewUrl || '',
      thumbnail: item.thumbnail || item.image || '',
      date: item.date,
      competition: {
        id: item.competition?.id || '',
        name: item.competition?.name || item.competition || 'Unknown',
        url: item.competition?.url || item.competitionUrl || '',
      },
      matchviewUrl: item.matchviewUrl || item.url || '',
      competitionUrl: item.competitionUrl || item.competition?.url || '',
      team1: {
        name: item.side1?.name || item.team1 || 'Unknown',
        url: item.side1?.url || '',
      },
      team2: {
        name: item.side2?.name || item.team2 || 'Unknown',
        url: item.side2?.url || '',
      }
    }));
    
    console.log('Transformed widget video data count:', transformedData.length);
    
    if (transformedData.length === 0) {
      throw new Error('No videos found after transformation');
    }
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching from Scorebat Widget API with CORS Proxy:', error);
    throw error;
  }
};

// Fetch data for a specific competition using the CORS proxy
export const fetchCompetitionVideos = async (competitionId: string): Promise<ScorebatVideo[]> => {
  try {
    // Use the CORS proxy with the competition endpoint
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${SCOREBAT_WIDGET_URL}competition/${competitionId}?json=1`)}`;
    console.log(`Fetching from Scorebat Widget API (competition ${competitionId}) with CORS Proxy:`, proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Scorebat Widget API error response (competition):', errorData);
      throw new Error(`Scorebat Widget API competition error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Scorebat Widget API competition ${competitionId} response data:`, data);
    
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
    
    console.log(`Transformed competition video data count:`, transformedData.length);
    return transformedData;
  } catch (error) {
    console.error(`Error fetching from Scorebat Widget API (competition ${competitionId}) with CORS Proxy:`, error);
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
  const videos = await fetchScorebatVideos();
  
  // Sort videos by date (newest first)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Take the first 5 videos as recommended (newest)
  const recommendedVideos = sortedVideos.slice(0, 5);
  
  return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Use widget API to get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  const videos = await fetchScorebatVideos();
  
  // Sort videos within each league by date (newest first)
  const leagues = scorebatMapper.mapToLeagues(videos);
  
  // Sort highlights within each league by date (newest first)
  leagues.forEach(league => {
    league.highlights.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
  
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
