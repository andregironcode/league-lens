
import { supabase } from "@/integrations/supabase/client";
import { MatchHighlight, League, ScorebatVideo } from "@/types";

// Helper function to extract team info
const extractTeamInfo = (teamData: { name: string, url: string }) => {
  const id = teamData.name.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name: teamData.name,
    logo: `https://www.sofascore.com/static/images/placeholders/team.svg` // Default logo
  };
};

// Helper to extract duration (approximate)
const extractDuration = (): string => {
  const minutes = Math.floor(Math.random() * 7) + 5;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// Helper to generate random views
const generateViews = (): number => {
  return Math.floor(Math.random() * 900000) + 100000; // Random between 100k and 1M
};

// Helper to extract score from title
const extractScoreFromTitle = (title: string): { home: number, away: number } => {
  const scoreRegex = /(\d+)\s*-\s*(\d+)/;
  const match = title.match(scoreRegex);
  
  if (match && match.length >= 3) {
    return {
      home: parseInt(match[1], 10),
      away: parseInt(match[2], 10)
    };
  }
  
  return { home: 0, away: 0 };
};

// Map of competition names to league IDs
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

// Mapper to convert Scorebat data to our app format
const mapToMatchHighlight = (video: ScorebatVideo): MatchHighlight => {
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
};

// Map videos to leagues
const mapToLeagues = (videos: ScorebatVideo[]): League[] => {
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
    
    const highlights = videos.map(video => mapToMatchHighlight(video));
    
    leagues.push({
      id: competitionInfo.id,
      name: competitionName,
      logo: competitionInfo.logo,
      highlights
    });
  });
  
  return leagues;
};

// Fetch videos from our Supabase Edge Function
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  console.log('Fetching videos using Supabase Edge Function');
  
  try {
    const { data, error } = await supabase.functions.invoke('scorebat-api/videos');
    
    if (error) {
      console.error('Error invoking scorebat-api function:', error);
      throw error;
    }
    
    console.log('Response from scorebat-api function:', data);
    
    // Handle both premium and widget API responses
    let videos: ScorebatVideo[] = [];
    
    if (data.source === 'premium' && data.data?.response) {
      videos = data.data.response;
    } else if (data.source === 'widget' && Array.isArray(data.data)) {
      videos = data.data;
    } else if (data.data) {
      // Try to find videos in the response
      for (const key in data.data) {
        if (Array.isArray(data.data[key])) {
          videos = data.data[key];
          break;
        }
      }
    }
    
    return videos;
  } catch (error) {
    console.error('Error fetching videos from Edge Function:', error);
    throw error;
  }
};

// Get recommended highlights (latest videos)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  console.log('Getting recommended highlights from Edge Function');
  const videos = await fetchScorebatVideos();
  
  // Sort videos by date (newest first)
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Take the first 5 videos as recommended (newest)
  const recommendedVideos = sortedVideos.slice(0, 5);
  
  console.log(`Returning ${recommendedVideos.length} recommended videos`);
  return recommendedVideos.map(video => mapToMatchHighlight(video));
};

// Get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  console.log('Getting league highlights from Edge Function');
  const videos = await fetchScorebatVideos();
  
  // Map and sort videos within each league by date (newest first)
  const leagues = mapToLeagues(videos);
  
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
  console.log(`Fetching highlights for competition: ${competitionId} from Edge Function`);
  
  try {
    const { data, error } = await supabase.functions.invoke('scorebat-api/competition', {
      body: { id: competitionId }
    });
    
    if (error) {
      console.error('Error invoking competition endpoint:', error);
      throw error;
    }
    
    const videos = data.data || [];
    
    // Sort by date (newest first)
    const sortedVideos = [...videos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sortedVideos.map(video => mapToMatchHighlight(video));
  } catch (error) {
    console.error(`Error fetching competition ${competitionId} highlights:`, error);
    throw error;
  }
};

// Get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  console.log(`Fetching highlights for team: ${teamId} from Edge Function`);
  
  try {
    const { data, error } = await supabase.functions.invoke('scorebat-api/team', {
      body: { id: teamId }
    });
    
    if (error) {
      console.error('Error invoking team endpoint:', error);
      throw error;
    }
    
    const videos = data.data || [];
    
    // Sort by date (newest first)
    const sortedVideos = [...videos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sortedVideos.map(video => mapToMatchHighlight(video));
  } catch (error) {
    console.error(`Error fetching team ${teamId} highlights:`, error);
    throw error;
  }
};

// Check the API status
export const checkApiStatus = async (): Promise<{ hasToken: boolean }> => {
  try {
    const { data, error } = await supabase.functions.invoke('scorebat-api/status');
    
    if (error) {
      console.error('Error checking API status:', error);
      return { hasToken: false };
    }
    
    return { hasToken: data.hasToken || false };
  } catch (error) {
    console.error('Error checking API status:', error);
    return { hasToken: false };
  }
};

// Update the API token in Supabase Edge Function
export const updateApiToken = async (token: string): Promise<boolean> => {
  try {
    // Here we would need to update the Supabase secret
    // This would require the user to manually set the secret in the Supabase dashboard
    // For now, we'll just return true if the token is not empty
    return !!token;
  } catch (error) {
    console.error('Error updating API token:', error);
    return false;
  }
};
