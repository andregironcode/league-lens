import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';
import { PREMIER_LEAGUE_ID, SCOREBAT_API_TOKEN } from './fallbackService';

// API constants based on the official documentation
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';
const SCOREBAT_FEED_ENDPOINT = `${SCOREBAT_API_URL}/feed`;
const SCOREBAT_COMPETITION_ENDPOINT = `${SCOREBAT_API_URL}/competition`;
const SCOREBAT_TEAM_ENDPOINT = `${SCOREBAT_API_URL}/team`;

// Widget access (free) alternative endpoints
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';

// Reduced CORS proxies to just the most reliable one
const CORS_PROXIES = [
  'https://corsproxy.io/?',
];

// Request timeouts
const API_TIMEOUT = 8000; // 8 seconds timeout for API requests

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

// Get the active API token (env var or default)
const getApiToken = (): string => {
  return import.meta.env.VITE_SCOREBAT_API_TOKEN || SCOREBAT_API_TOKEN;
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
  const id = teamData.url ? new URL(teamData.url).pathname.split('/').pop() || 
             teamData.name.toLowerCase().replace(/\s+/g, '-') : 
             teamData.name.toLowerCase().replace(/\s+/g, '-');
             
  return {
    id,
    name: teamData.name,
    logo: `https://www.sofascore.com/static/images/placeholders/team.svg`
  };
};

// Helper to extract duration from embed code (approximate, as Scorebat doesn't provide duration)
const extractDuration = (): string => {
  const minutes = Math.floor(Math.random() * 7) + 5;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// Helper to extract views (Scorebat doesn't provide views, so we generate a random number)
const generateViews = (): number => {
  return Math.floor(Math.random() * 900000) + 100000;
};

// Helper to extract score from title (approximate, as Scorebat doesn't provide structured score data)
const extractScoreFromTitle = (title: string): { home: number, away: number } => {
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
    const homeTeam = extractTeamInfo(video.side1 || video.team1);
    const awayTeam = extractTeamInfo(video.side2 || video.team2);
    
    const competitionName = video.competition.name;
    const competitionInfo = competitionToLeagueMap[competitionName] || 
                            { id: competitionName.toLowerCase().replace(/[\s:]+/g, '-'), logo: '/leagues/other.png' };
    
    const score = extractScoreFromTitle(video.title);
    
    return {
      id: video.matchId || video.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: video.title,
      date: video.date,
      thumbnailUrl: video.thumbnail || video.image,
      videoUrl: video.matchviewUrl || video.url,
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
    const leagueMap = new Map<string, ScorebatVideo[]>();
    
    videos.forEach(video => {
      const competitionName = video.competition.name;
      if (!leagueMap.has(competitionName)) {
        leagueMap.set(competitionName, []);
      }
      leagueMap.get(competitionName)?.push(video);
    });
    
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

// Fetch videos from Scorebat API main feed endpoint
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  console.log('Starting fetchScorebatVideos with proper API endpoint');
  
  const token = getApiToken();
  
  if (!token) {
    throw new Error('No API token available');
  }
  
  try {
    const apiUrl = `${SCOREBAT_FEED_ENDPOINT}?token=${token}`;
    console.log('Calling Scorebat feed API with token');
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Feed API response structure:', Object.keys(data));
    
    // Check if the response has the expected structure
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} videos in feed`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      // Some API responses might be direct arrays
      console.log(`Found ${data.length} videos in feed (direct array)`);
      return transformVideoArray(data);
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid API response format - expected array or {response: array}');
    }
  } catch (error) {
    console.error('Error fetching from Scorebat API:', error);
    throw error;
  }
};

// Direct API call for Premier League highlights
export const fetchPremierLeagueVideos = async (): Promise<ScorebatVideo[]> => {
  try {
    console.log('Fetching Premier League highlights using direct API with token...');
    
    const token = getApiToken();
    const apiUrl = `${SCOREBAT_COMPETITION_ENDPOINT}/${PREMIER_LEAGUE_ID}/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    }, 8000);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Premier League API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Premier League API response structure:', typeof data, Array.isArray(data) ? 'array' : Object.keys(data));
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} Premier League videos`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} Premier League videos (array format)`);
      return transformVideoArray(data);
    }
    
    console.error('Unexpected Premier League API response format:', data);
    throw new Error('Invalid Premier League API response format');
  } catch (error) {
    console.error('Error fetching Premier League highlights:', error);
    throw error;
  }
};

// Fetch data for a specific competition
export const fetchCompetitionVideos = async (competitionId: string): Promise<ScorebatVideo[]> => {
  try {
    console.log(`Fetching competition ${competitionId} highlights...`);
    
    const token = getApiToken();
    const apiUrl = `${SCOREBAT_COMPETITION_ENDPOINT}/${competitionId}/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Competition API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} videos for competition ${competitionId}`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} videos for competition ${competitionId}`);
      return transformVideoArray(data);
    }
    
    throw new Error('Invalid competition API response format');
  } catch (error) {
    console.error(`Error fetching competition ${competitionId} highlights:`, error);
    throw error;
  }
};

// Fetch data for a specific team
export const fetchTeamVideos = async (teamId: string): Promise<ScorebatVideo[]> => {
  try {
    console.log(`Fetching team ${teamId} highlights...`);
    
    const token = getApiToken();
    const apiUrl = `${SCOREBAT_TEAM_ENDPOINT}/${teamId}/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Team API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} videos for team ${teamId}`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} videos for team ${teamId}`);
      return transformVideoArray(data);
    }
    
    throw new Error('Invalid team API response format');
  } catch (error) {
    console.error(`Error fetching team ${teamId} highlights:`, error);
    throw error;
  }
};

// Helper to transform an array of video objects with flexible format handling
const transformVideoArray = (videoArray: any[]): ScorebatVideo[] => {
  console.log('First video object structure:', videoArray.length > 0 ? Object.keys(videoArray[0]) : 'empty array');
  
  if (videoArray.length > 0) {
    const sampleVideo = videoArray[0];
    // Log the structure of the first video to understand the format
    console.log('Sample competition:', sampleVideo.competition);
    console.log('Sample team1/side1:', sampleVideo.side1 || sampleVideo.team1);
    console.log('Sample team2/side2:', sampleVideo.side2 || sampleVideo.team2);
  }
  
  return videoArray.map((item: any) => {
    // Ensure we have a competition object with at least a name
    const competition = typeof item.competition === 'string' 
      ? { id: '', name: item.competition, url: '' }
      : item.competition || { id: '', name: 'Unknown', url: '' };
      
    // Process side1/team1
    const side1 = item.side1 || (item.team1 ? {
      name: item.team1.name || 'Unknown',
      url: item.team1.url || '',
    } : {
      name: 'Unknown',
      url: '',
    });
    
    // Process side2/team2  
    const side2 = item.side2 || (item.team2 ? {
      name: item.team2.name || 'Unknown',
      url: item.team2.url || '',
    } : {
      name: 'Unknown',
      url: '',
    });
    
    // Create a normalized video object
    return {
      id: item.matchId || item.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title || `${side1.name} vs ${side2.name}`,
      embed: item.embed || '',
      url: item.matchviewUrl || item.url || '',
      thumbnail: item.thumbnail || item.image || '',
      date: item.date || new Date().toISOString(),
      competition: competition,
      matchviewUrl: item.matchviewUrl || item.url || '',
      competitionUrl: item.competitionUrl || competition.url || '',
      side1: side1,
      side2: side2,
      // Keep legacy properties for backward compatibility
      team1: {
        name: side1.name || 'Unknown',
        url: side1.url || '',
      },
      team2: {
        name: side2.name || 'Unknown',
        url: side2.url || '',
      },
      videos: item.videos || []
    };
  });
};

// Get recommended highlights (latest videos from API)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  console.log('Getting recommended highlights from API');
  const videos = await fetchScorebatVideos();
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const recommendedVideos = sortedVideos.slice(0, 5);
  
  console.log(`Returning ${recommendedVideos.length} recommended videos`);
  return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  console.log('Getting league highlights from API');
  const videos = await fetchScorebatVideos();
  
  const leagues = scorebatMapper.mapToLeagues(videos);
  
  leagues.forEach(league => {
    league.highlights.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
  
  console.log(`Returning ${leagues.length} leagues with highlights`);
  return leagues;
};

// Get highlights for a specific competition
export const getCompetitionHighlights = async (competitionId: string): Promise<MatchHighlight[]> => {
  console.log(`Getting highlights for competition ${competitionId}`);
  const videos = await fetchCompetitionVideos(competitionId);
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get Premier League highlights using the direct API
export const getPremierLeagueHighlights = async (): Promise<MatchHighlight[]> => {
  console.log('Getting Premier League highlights from direct API');
  const videos = await fetchPremierLeagueVideos();
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get a specific match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  const videos = await fetchScorebatVideos();
  const video = videos.find(v => v.id === id);
  
  if (!video) return null;
  
  return scorebatMapper.mapToMatchHighlight(video);
};

// Get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  const videos = await fetchTeamVideos(teamId);
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Search highlights
export const searchHighlights = async (query: string): Promise<MatchHighlight[]> => {
  if (!query.trim()) return [];
  
  const videos = await fetchScorebatVideos();
  const normalizedQuery = query.toLowerCase().trim();
  
  const matchingVideos = videos.filter(video => {
    return (
      video.title.toLowerCase().includes(normalizedQuery) ||
      video.team1.name.toLowerCase().includes(normalizedQuery) ||
      video.team2.name.toLowerCase().includes(normalizedQuery) ||
      video.competition.name.toLowerCase().includes(normalizedQuery)
    );
  });
  
  const sortedVideos = [...matchingVideos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};
