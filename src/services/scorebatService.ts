
import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';

// API constants
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';
const SCOREBAT_API_TOKEN = 'MTk1NDQ4XzE3MDA1MzIwOTRfZDA4MTZlZjJiZjhjM2YwYmJlOGM0NjIzNmM4YjNlOWJlZjgwMzkzOA==';

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

// Mapper to convert Scorebat data to our application format
const scorebatMapper: ScorebatMapper = {
  mapToMatchHighlight: (video: ScorebatVideo): MatchHighlight => {
    const homeTeam = extractTeamInfo(video.team1);
    const awayTeam = extractTeamInfo(video.team2);
    
    // Extract competition info
    const competitionInfo = competitionToLeagueMap[video.competition.name] || 
                            { id: 'other', logo: '/leagues/other.png' };
    
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
      score: {
        home: 0, // Scorebat doesn't provide scores, would need to be parsed from title
        away: 0
      },
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
    // Add a small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const response = await fetch(`${SCOREBAT_API_URL}/feed?token=${SCOREBAT_API_TOKEN}`);
    
    if (!response.ok) {
      throw new Error(`Scorebat API error: ${response.status}`);
    }
    
    const data: ScorebatResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching from Scorebat API:', error);
    return [];
  }
};

// Get recommended highlights (latest videos)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  try {
    const videos = await fetchScorebatVideos();
    
    // Take the first 5 videos as recommended
    const recommendedVideos = videos.slice(0, 5);
    
    return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
  } catch (error) {
    console.error('Error getting recommended highlights:', error);
    return [];
  }
};

// Get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  try {
    const videos = await fetchScorebatVideos();
    return scorebatMapper.mapToLeagues(videos);
  } catch (error) {
    console.error('Error getting league highlights:', error);
    return [];
  }
};

// Get a specific match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  try {
    const videos = await fetchScorebatVideos();
    const video = videos.find(v => v.id === id);
    
    if (!video) return null;
    
    return scorebatMapper.mapToMatchHighlight(video);
  } catch (error) {
    console.error('Error getting match by ID:', error);
    return null;
  }
};

// Get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting team highlights:', error);
    return [];
  }
};

// Search for highlights
export const searchHighlights = async (query: string): Promise<MatchHighlight[]> => {
  if (!query.trim()) return [];
  
  try {
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
  } catch (error) {
    console.error('Error searching highlights:', error);
    return [];
  }
};
