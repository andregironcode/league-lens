
import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';

// API constants
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';

// Use only the paid API token
const SCOREBAT_API_TOKEN = 'MTk1NDQ4X1AyOTg4MDg0MzFfOWNkNWI1YzAxYmE0OTc5YTk0NTFkNTEyNGJiYjdjYWJkMDgwMzIyNQ==';

// Create a map of competition names to league IDs
const competitionToLeagueMap: Record<string, { id: string, logo: string }> = {
  'ENGLAND: Premier League': { id: 'pl', logo: '/leagues/premierleague.png' },
  'SPAIN: La Liga': { id: 'laliga', logo: '/leagues/laliga.png' },
  'GERMANY: Bundesliga': { id: 'bundesliga', logo: '/leagues/bundesliga.png' },
  'ITALY: Serie A': { id: 'seriea', logo: '/leagues/seriea.png' },
  'FRANCE: Ligue 1': { id: 'ligue1', logo: '/leagues/ligue1.png' },
  'NETHERLANDS: Eredivisie': { id: 'eredivisie', logo: '/leagues/eredivisie.png' },
  'PORTUGAL: Liga Portugal': { id: 'portugal', logo: '/leagues/portugal.png' },
  'CHAMPIONS LEAGUE': { id: 'ucl', logo: '/leagues/ucl.png' },
  'EUROPA LEAGUE': { id: 'uel', logo: '/leagues/uel.png' },
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
    const competitionInfo = competitionToLeagueMap[video.competition.name] || 
                            { id: 'other', logo: '/leagues/other.png' };
    
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
        name: video.competition.name,
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
                              { id: competitionName.toLowerCase().replace(/\s+/g, '-'), logo: '/leagues/other.png' };
      
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

// Fetch data from Scorebat API
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  try {
    console.log('Fetching from Scorebat API:', `${SCOREBAT_API_URL}/feed?token=${SCOREBAT_API_TOKEN}`);
    
    const response = await fetch(`${SCOREBAT_API_URL}/feed?token=${SCOREBAT_API_TOKEN}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Scorebat API error response:', errorData);
      throw new Error(`Scorebat API error: ${response.status}`);
    }
    
    const data: ScorebatResponse = await response.json();
    console.log('Scorebat API response data count:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching from Scorebat API:', error);
    throw error; // Re-throw to let fallback service handle it
  }
};

// Get recommended highlights (latest videos)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  const videos = await fetchScorebatVideos();
  
  // Take the first 5 videos as recommended
  const recommendedVideos = videos.slice(0, 5);
  
  return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  const videos = await fetchScorebatVideos();
  return scorebatMapper.mapToLeagues(videos);
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
  const videos = await fetchScorebatVideos();
  
  // Convert team ID back to team name format (dashes to spaces)
  const teamName = teamId.replace(/-/g, ' ');
  
  // Find videos featuring this team
  const teamVideos = videos.filter(video => {
    const team1Lower = video.team1.name.toLowerCase();
    const team2Lower = video.team2.name.toLowerCase();
    return team1Lower.includes(teamName) || team2Lower.includes(teamName);
  });
  
  return teamVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Search for highlights
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
