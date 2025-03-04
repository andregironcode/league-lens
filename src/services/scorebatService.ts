import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';
import { getApiToken } from './tokenService';

// API constants
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';

// Widget access (free) alternative endpoints
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';
const SCOREBAT_VIDEO_URL = 'https://www.scorebat.com/embed/videopage';

// Reduced CORS proxies to just the most reliable one
const CORS_PROXIES = [
  'https://corsproxy.io/?',
];

// Request timeouts
const API_TIMEOUT = 5000; // 5 seconds timeout for API requests

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

// Helper for request with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

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

// Try endpoints with timeout to fetch data from Scorebat
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  console.log('Starting fetchScorebatVideos with optimized endpoint attempts');
  
  // Get API token from service
  const API_TOKEN = getApiToken();
  
  // Try premium API first if we have a token
  if (API_TOKEN) {
    try {
      console.log('API token found, attempting premium API');
      const apiUrl = `${SCOREBAT_API_URL}/feed?token=${API_TOKEN}`;
      
      // Direct API call with timeout
      const response = await fetchWithTimeout(apiUrl, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Premium API call succeeded');
        
        if (data && data.response && Array.isArray(data.response) && data.response.length > 0) {
          return transformPremiumApiResponse(data);
        }
      }
      console.warn('Premium API call failed or returned invalid data');
    } catch (error) {
      console.error('Error with premium API:', error);
    }
  }
  
  // Try the widget API as second option with CORS proxy
  try {
    // Try a single endpoint with CORS proxy
    const endpoint = `${SCOREBAT_WIDGET_URL}videopage?_format=json`;
    const proxyUrl = `${CORS_PROXIES[0]}${encodeURIComponent(endpoint)}`;
    
    console.log('Trying widget API with CORS proxy');
    const response = await fetchWithTimeout(proxyUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim() !== '') {
        try {
          const data = JSON.parse(text);
          return extractAndTransformVideos(data);
        } catch (e) {
          // If it's HTML, try to extract JSON
          if (text.includes('<!doctype html>') || text.includes('<html')) {
            const stateMatch = text.match(/__PRELOADED_STATE__\s*=\s*({.+?});/s);
            if (stateMatch && stateMatch[1]) {
              const data = JSON.parse(stateMatch[1]);
              return extractAndTransformVideos(data);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Widget API attempt failed:', error);
  }
  
  // If all attempts failed, throw error to trigger fallback
  throw new Error('All API attempts failed');
};

// Helper to extract videos from various data structures
const extractAndTransformVideos = (data: any): ScorebatVideo[] => {
  let videoArray: any[] = [];
  
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
  }
  
  if (videoArray.length === 0) {
    throw new Error('No videos found in API response');
  }
  
  console.log(`Found ${videoArray.length} videos`);
  
  // Transform to standard format
  return transformVideoArray(videoArray);
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
};

// Fetch data for a specific competition with timeout
export const fetchCompetitionVideos = async (competitionId: string): Promise<ScorebatVideo[]> => {
  try {
    const proxyUrl = `${CORS_PROXIES[0]}${encodeURIComponent(`${SCOREBAT_WIDGET_URL}competition/${competitionId}?json=1`)}`;
    console.log(`Fetching competition ${competitionId} highlights...`);
    
    const response = await fetchWithTimeout(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Competition API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data format
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

// Fetch data for a specific team with timeout
export const fetchTeamVideos = async (teamId: string): Promise<ScorebatVideo[]> => {
  try {
    const proxyUrl = `${CORS_PROXIES[0]}${encodeURIComponent(`${SCOREBAT_WIDGET_URL}team/${teamId}?json=1`)}`;
    console.log(`Fetching team ${teamId} highlights...`);
    
    const response = await fetchWithTimeout(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Team API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data format
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
    console.error(`Error fetching team ${teamId} highlights:`, error);
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
