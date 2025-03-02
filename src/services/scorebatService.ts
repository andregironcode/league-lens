import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';

// API constants
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';

// Updated API token from the paid developer plan
const SCOREBAT_API_TOKEN = 'MTk1NDQ4X01UazFORFF4WDFBeU9UZzRNRGcwTXpGZk9XTmtOV0kxWXpBeFlXRTBPVGM1WVRrME5URmtOVEV5TkdKaVlqZGpZV0prTURnd016SXlOUT09';

// Widget access (free) doesn't require a token
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';

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

// Fetch data from Scorebat API using widget endpoints that don't require a paid plan
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  try {
    // Use the widget live feed endpoint which doesn't require authentication
    console.log('Fetching from Scorebat Widget API (feed):', `${SCOREBAT_WIDGET_URL}livescore`);
    
    const response = await fetch(`${SCOREBAT_WIDGET_URL}livescore?json=1`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Scorebat Widget API error response:', errorData);
      throw new Error(`Scorebat Widget API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Scorebat Widget API response data:', data);
    
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
    
    console.log('Transformed video data count:', transformedData.length);
    return transformedData;
  } catch (error) {
    console.error('Error fetching from Scorebat Widget API (feed):', error);
    throw error; // Re-throw to let fallback service handle it
  }
};

// Fetch data for a specific competition using widget API
export const fetchCompetitionVideos = async (competitionId: string): Promise<ScorebatVideo[]> => {
  try {
    // Use the competitionId directly with the widget endpoint
    console.log(`Fetching from Scorebat Widget API (competition ${competitionId}):`, 
      `${SCOREBAT_WIDGET_URL}competition/${competitionId}`);
    
    const response = await fetch(`${SCOREBAT_WIDGET_URL}competition/${competitionId}?json=1`);
    
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
    console.error(`Error fetching from Scorebat Widget API (competition ${competitionId}):`, error);
    throw error; // Re-throw to let fallback service handle it
  }
};

// Fetch data for a specific team using widget API
export const fetchTeamVideos = async (teamId: string): Promise<ScorebatVideo[]> => {
  try {
    // Use the teamId directly with the widget endpoint
    console.log(`Fetching from Scorebat Widget API (team ${teamId}):`, 
      `${SCOREBAT_WIDGET_URL}team/${teamId}`);
    
    const response = await fetch(`${SCOREBAT_WIDGET_URL}team/${teamId}?json=1`);
    
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
    console.error(`Error fetching from Scorebat Widget API (team ${teamId}):`, error);
    throw error; // Re-throw to let fallback service handle it
  }
};

// Get recommended highlights (latest videos from widget API)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  const videos = await fetchScorebatVideos();
  
  // Take the first 5 videos as recommended
  const recommendedVideos = videos.slice(0, 5);
  
  return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Use widget API to get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  const videos = await fetchScorebatVideos();
  return scorebatMapper.mapToLeagues(videos);
};

// Use widget API to get highlights for a specific competition
export const getCompetitionHighlights = async (competitionId: string): Promise<MatchHighlight[]> => {
  const videos = await fetchCompetitionVideos(competitionId);
  return videos.map(video => scorebatMapper.mapToMatchHighlight(video));
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
  return videos.map(video => scorebatMapper.mapToMatchHighlight(video));
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
  
  return matchingVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};
