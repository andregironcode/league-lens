import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell, Target, RefreshCw, Square } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getActiveService } from '@/services/serviceAdapter';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { MatchHighlight, EnhancedMatchHighlight, Player, Match } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<EnhancedMatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  
  // State for consistent mock data
  const [homeTeamForm, setHomeTeamForm] = useState<any>(null);
  const [awayTeamForm, setAwayTeamForm] = useState<any>(null);
  const [homeLeaguePosition, setHomeLeaguePosition] = useState<any>(null);
  const [awayLeaguePosition, setAwayLeaguePosition] = useState<any>(null);
  const [headToHeadData, setHeadToHeadData] = useState<any[]>([]);
  const [impressiveStats, setImpressiveStats] = useState<any[]>([]);
  
  // State for real API data
  const [realLeagueStandings, setRealLeagueStandings] = useState<any>(null);
  const [realHomeTeamStats, setRealHomeTeamStats] = useState<any>(null);
  const [realAwayTeamStats, setRealAwayTeamStats] = useState<any>(null);
  const [realHeadToHead, setRealHeadToHead] = useState<any>(null);
  const [apiDataLoading, setApiDataLoading] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Determine match status with more granular timing
  const getMatchTiming = () => {
    if (!match) return 'finished';
    
    const matchDate = new Date(match.date);
    const now = new Date();
    const timeDiff = matchDate.getTime() - now.getTime();
    const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
    
    // Check if it's a live match
    if (match.title?.toLowerCase().includes('live') || 
        (Math.abs(hoursUntilMatch) < 1 && match.score && match.score.home !== 0 && match.score.away !== 0)) {
      return 'live';
    }
    
    // Upcoming matches - differentiate by time
    if (hoursUntilMatch > 1) {
      return 'preview'; // More than 1 hour before
    } else if (hoursUntilMatch > 0) {
      return 'imminent'; // Less than 1 hour before (but more than 0)
    }
    
    // For completed matches (in the past)
    if (hoursUntilMatch < 0) {
      // If match has ended and has video highlights, show finished layout
      if (match.videoUrl && match.videoUrl !== '') {
        return 'finished';
      }
      
      // If match has ended but no video highlights yet, show full-time layout
      if (match.score && (match.score.home !== 0 || match.score.away !== 0)) {
        return 'fullTime';
      }
      
      // If match has ended but no score data, default to finished
      return 'finished';
    }
    
    return 'finished'; // Default fallback
  };

  const matchTiming = getMatchTiming();
  const isPreview = matchTiming === 'preview';
  const isImminent = matchTiming === 'imminent';
  const isLive = matchTiming === 'live';
  const isFullTime = matchTiming === 'fullTime';
  const isFinished = matchTiming === 'finished';

  // Add effect to update match timing periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Force a re-render by updating a dummy state if needed
      const currentTiming = getMatchTiming();
      if (currentTiming !== matchTiming) {
        // The timing has changed, component will re-render due to dependency change
        console.log(`[MatchDetails] Match timing changed from ${matchTiming} to ${currentTiming}`);
      }
    }, 60000); // Check every minute

    return () => clearInterval(updateInterval);
  }, [match?.date, matchTiming]);

  // Add effect to refetch match data periodically for live matches or upcoming matches
  useEffect(() => {
    if (!id || !match) return;

    let refetchInterval: NodeJS.Timeout | null = null;

    // Set different refetch intervals based on match timing
    if (isLive) {
      // Refetch every 30 seconds for live matches
      refetchInterval = setInterval(async () => {
        try {
          console.log('[MatchDetails] Refetching live match data...');
          const matchData = await getMatchById(id) as EnhancedMatchHighlight;
          if (matchData) {
            setMatch(matchData);
          }
        } catch (error) {
          console.error('Error refetching match data:', error);
        }
      }, 30000);
    } else if (isImminent) {
      // Refetch every 2 minutes for imminent matches (to catch lineup announcements)
      refetchInterval = setInterval(async () => {
        try {
          console.log('[MatchDetails] Refetching imminent match data...');
          const matchData = await getMatchById(id) as EnhancedMatchHighlight;
          if (matchData) {
            setMatch(matchData);
          }
        } catch (error) {
          console.error('Error refetching match data:', error);
        }
      }, 120000);
    } else if (isPreview) {
      // Refetch every 10 minutes for preview matches (to catch any updates)
      refetchInterval = setInterval(async () => {
        try {
          console.log('[MatchDetails] Refetching preview match data...');
          const matchData = await getMatchById(id) as EnhancedMatchHighlight;
          if (matchData) {
            setMatch(matchData);
          }
        } catch (error) {
          console.error('Error refetching match data:', error);
        }
      }, 600000);
    }

    return () => {
      if (refetchInterval) {
        clearInterval(refetchInterval);
      }
    };
  }, [id, isLive, isImminent, isPreview, isFullTime]);

  // Format kickoff time for upcoming matches
  const formatKickoffTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch {
      return 'TBD';
    }
  };

  const getMatchStatusDisplay = () => {
    if (isLive) return 'LIVE';
    if (isFullTime) return 'FT';
    if (isFinished) return 'FT';
    if (isPreview) return `${formatKickoffTime(match?.date || '')} KO`;
    if (isImminent) return `${formatKickoffTime(match?.date || '')} KO`;
    return 'KO';
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchMatch = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const matchData = await getMatchById(id) as EnhancedMatchHighlight;
        
        if (isMounted) {
          setMatch(matchData);
          if (matchData) {
            const date = new Date(matchData.date);
            setFormattedDate(formatDistanceToNow(date, { addSuffix: true }));
            setExactDate(date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }));
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching match details:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchMatch();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  const getVideoEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    console.log('[MatchDetails] Processing video URL:', url);
    
    // If it's already an embed URL, use it
    if (url.includes('embed')) {
      console.log('[MatchDetails] Already embed URL:', url);
      return url;
    }
    
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      console.log('[MatchDetails] YouTube video ID:', videoId);
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    
    // For other video URLs, try to use them directly
    console.log('[MatchDetails] Using direct video URL:', url);
    return url;
  };

  const handleGoBack = () => {
    setNavigating(true);
    navigate('/');
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link copied!",
        description: "Share this highlight with your friends",
        variant: "default"
      });
    }).catch(error => {
      console.error('Failed to copy: ', error);
    });
  };
  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`);
  };

  // Helper function to calculate time until match
  const getTimeUntilMatch = () => {
    if (!match) return null;
    
    const matchDate = new Date(match.date);
    const now = new Date();
    const timeDiff = matchDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) return null;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const timeUntilMatch = getTimeUntilMatch();

  // Helper function to determine the correct season based on match date
  const getMatchSeason = () => {
    if (!match) return new Date().getFullYear().toString();
    
    const matchDate = new Date(match.date);
    const matchYear = matchDate.getFullYear();
    const matchMonth = matchDate.getMonth(); // 0-based (0 = January)
    
    // For most leagues, the season starts in summer/fall of the previous year
    // and ends in spring/summer of the current year
    // For Brazilian leagues like Carioca, the season typically runs within the calendar year
    
    // If it's a Brazilian league (detected by competition name)
    if (match.competition.name.toLowerCase().includes('carioca') || 
        match.competition.name.toLowerCase().includes('brasil') ||
        match.competition.name.toLowerCase().includes('paulista') ||
        match.competition.name.toLowerCase().includes('mineiro') ||
        match.competition.name.toLowerCase().includes('gaúcho')) {
      return matchYear.toString();
    }
    
    // For European leagues (Premier League, La Liga, etc.)
    // If the match is in Jan-June, it's likely part of the season that started the previous year
    // If the match is in Jul-Dec, it's the start of a new season
    if (matchMonth >= 0 && matchMonth <= 5) { // Jan-June
      return matchYear.toString(); // Use current year for European leagues in spring
    } else { // Jul-Dec
      return (matchYear + 1).toString(); // Next year's season
    }
  };

  const matchSeason = getMatchSeason();

  // Helper function to detect if this is a pre-season or early season match
  const isPreSeasonMatch = () => {
    if (!match) return false;
    
    const matchDate = new Date(match.date);
    const now = new Date();
    const monthsUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // For Brazilian leagues (calendar year season), be more careful
    if (match.competition.name.toLowerCase().includes('carioca') || 
        match.competition.name.toLowerCase().includes('brasileir') ||
        match.competition.name.toLowerCase().includes('brazil')) {
      
      // For Brazilian leagues, check if this is very early in the calendar year
      const matchMonth = matchDate.getMonth(); // 0-11
      const isVeryEarlyInYear = matchMonth <= 1; // January or February
      
      // If it's more than 4 months away AND very early in year, likely pre-season
      return monthsUntilMatch > 4 && isVeryEarlyInYear;
    }
    
    // For European leagues or unknown leagues, use the original logic
    // If the match is more than 3 months in the future, it's likely pre-season
    return monthsUntilMatch > 3;
  };

  // Helper function to check if teams have played enough matches for meaningful stats
  const hasSeasonStarted = (teamData: any) => {
    return teamData && teamData.stats && teamData.stats.gamesPlayed >= 2;
  };

  // Helper function to get appropriate no-data message based on context
  const getNoDataMessage = (dataType: 'form' | 'standings' | 'h2h') => {
    if (isPreSeasonMatch()) {
      switch (dataType) {
        case 'form':
          return `This appears to be a pre-season or early season fixture. ${match?.homeTeam.name} and ${match?.awayTeam.name} may not have played enough matches yet for form analysis.`;
        case 'standings':
          return `League standings for ${match?.competition.name} ${matchSeason} are not yet available. This may be a pre-season fixture or the league season hasn't started.`;
        case 'h2h':
          return `No lifetime encounters found between ${match?.homeTeam.name} and ${match?.awayTeam.name} in our database. This may be their first meeting or they compete in different leagues.`;
        default:
          return 'Data not available for this pre-season fixture.';
      }
    } else {
      switch (dataType) {
        case 'form':
          return `Recent match data for ${match?.homeTeam.name} and ${match?.awayTeam.name} is not available in our database. The teams may be from a lower division with limited coverage.`;
        case 'standings':
          return `Current ${match?.competition.name} ${matchSeason} standings are not available in our database. This competition may have limited API coverage.`;
        case 'h2h':
          return `No historical encounters found between ${match?.homeTeam.name} and ${match?.awayTeam.name} in our database. They may have never met or their meeting history isn't covered in our data.`;
        default:
          return 'Match data is not available in our database.';
      }
    }
  };

  // Fetch real API data
  const fetchRealLeagueStandings = async () => {
    if (!match || getActiveService() !== 'highlightly') return null;
    
    try {
      console.log(`[MatchDetails] Fetching real league standings for ${match.competition.name} (Season: ${matchSeason})...`);
      
      // Try multiple strategies to find league standings with season awareness
      const searchStrategies = [
        // Strategy 1: Try by exact competition name with correct season
        () => highlightlyClient.getStandings({
          league: match.competition.name,
          season: matchSeason
        }),
        // Strategy 2: Try by partial competition name with correct season
        () => highlightlyClient.getStandings({
          league: match.competition.name.split(' ')[0], // First word only
          season: matchSeason
        }),
        // Strategy 3: Try previous season in case data isn't available for current season yet
        () => highlightlyClient.getStandings({
          league: match.competition.name,
          season: (parseInt(matchSeason) - 1).toString()
        }),
        // Strategy 4: Try by leagueId with correct season
        () => {
          const leagueIdMap: {[key: string]: number} = {
            'Premier League': 33973,
            'La Liga': 2486,
            'Bundesliga': 67162,
            'Ligue 1': 52695,
            'Serie A': 61205,
            'Eredivisie': 75672,
            'Primeira Liga': 80778,
            'Carioca': 2470, // Brazilian leagues
            'Carioca C': 2470, // Specific tier
            'Brasileirão': 71,
            'Copa do Brasil': 550,
            'Paulista': 2478
          };
          
          const leagueId = leagueIdMap[match.competition.name];
          if (leagueId) {
            return highlightlyClient.getStandings({
              leagueId: leagueId.toString(),
              season: matchSeason
            });
          }
          return Promise.resolve(null);
        },
        // Strategy 5: Search by country and competition name for Brazilian leagues
        () => {
          if (match.competition.name.toLowerCase().includes('carioca') || 
              match.competition.name.toLowerCase().includes('brasil') ||
              match.competition.name.toLowerCase().includes('paulista')) {
            // Try with just the league name since countryCode is not supported
            return highlightlyClient.getStandings({
              league: match.competition.name,
              season: matchSeason
            });
          }
          return Promise.resolve(null);
        }
      ];
      
      // Try each strategy
      for (let i = 0; i < searchStrategies.length; i++) {
        try {
          console.log(`[MatchDetails] Trying standings strategy ${i + 1} for ${match.competition.name} (Season: ${matchSeason})...`);
          const response = await searchStrategies[i]();
          
          if (response && (response.groups || response.standings || response.data)) {
            console.log(`[MatchDetails] SUCCESS! Found standings for ${match.competition.name} ${matchSeason} using strategy ${i + 1}`);
            return response.groups?.[0]?.standings || response.standings || response.data;
          }
        } catch (strategyError) {
          console.log(`[MatchDetails] Standings strategy ${i + 1} failed:`, strategyError);
          continue;
        }
      }
      
      console.log(`[MatchDetails] No standings found for ${match.competition.name}`);
      return null;
    } catch (error) {
      console.error(`[MatchDetails] Critical error fetching league standings:`, error);
      return null;
    }
  };

  const fetchRealTeamStats = async (teamId: string, teamName: string) => {
    if (!match || getActiveService() !== 'highlightly') return null;
    
    try {
      console.log(`[MatchDetails] Aggressively fetching real team stats for ${teamName} in ${match.competition.name} (Season: ${matchSeason})...`);
      
      // Try multiple search strategies to find real team data with season awareness
      const searchStrategies = [
        // Strategy 1: Search in specific league and season as home team
        () => highlightlyClient.getMatches({
          homeTeamName: teamName,
          leagueName: match.competition.name,
          season: matchSeason,
          limit: '10'
        }),
        // Strategy 2: Search in specific league and season as away team
        () => highlightlyClient.getMatches({
          awayTeamName: teamName,
          leagueName: match.competition.name,
          season: matchSeason,
          limit: '10'
        }),
        // Strategy 3: Search previous season data in case current season is too new
        () => highlightlyClient.getMatches({
          homeTeamName: teamName,
          leagueName: match.competition.name,
          season: (parseInt(matchSeason) - 1).toString(),
          limit: '15'
        }),
        // Strategy 4: Search as home team in any league for this season
        () => highlightlyClient.getMatches({
          homeTeamName: teamName,
          season: matchSeason,
          limit: '15'
        }),
        // Strategy 5: Search as away team in any league for this season
        () => highlightlyClient.getMatches({
          awayTeamName: teamName,
          season: matchSeason,
          limit: '15'
        }),
        // Strategy 6: Search with partial team name in specific league
        () => highlightlyClient.getMatches({
          homeTeamName: teamName.split(' ')[0],
          leagueName: match.competition.name,
          season: matchSeason,
          limit: '15'
        }),
        // Strategy 7: Search by date range around the match date
        () => {
          const matchDate = new Date(match.date);
          const searchDate = matchDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          return highlightlyClient.getMatches({
            homeTeamName: teamName,
            date: searchDate,
            limit: '20'
          });
        },
        // Strategy 8: Search for Brazilian teams specifically
        () => {
          if (match.competition.name.toLowerCase().includes('carioca') || 
              match.competition.name.toLowerCase().includes('brasil') ||
              match.competition.name.toLowerCase().includes('paulista')) {
            return highlightlyClient.getMatches({
              countryName: 'Brazil',
              homeTeamName: teamName,
              season: matchSeason,
              limit: '20'
            });
          }
          return Promise.resolve(null);
        }
      ];
      
      // Try each strategy until we get data
      for (let i = 0; i < searchStrategies.length; i++) {
        try {
          console.log(`[MatchDetails] Trying search strategy ${i + 1} for ${teamName} (Season: ${matchSeason})...`);
          const response = await searchStrategies[i]();
          
          if (response && response.data && response.data.length > 0) {
            console.log(`[MatchDetails] SUCCESS! Found ${response.data.length} matches for ${teamName} using strategy ${i + 1} (Season: ${matchSeason})`);
            return response.data;
          }
        } catch (strategyError) {
          console.log(`[MatchDetails] Strategy ${i + 1} failed for ${teamName}:`, strategyError);
          continue;
        }
      }
      
      console.log(`[MatchDetails] All search strategies failed for ${teamName} (Season: ${matchSeason})`);
      return null;
      
    } catch (error) {
      console.error(`[MatchDetails] Critical error fetching team stats for ${teamName}:`, error);
      return null;
    }
  };

  const fetchRealHeadToHead = async () => {
    if (!match || getActiveService() !== 'highlightly') return null;
    
    try {
      console.log(`[MatchDetails] Fetching lifetime H2H data for ${match.homeTeam.name} vs ${match.awayTeam.name}...`);
      
      // Try multiple search strategies for lifetime head-to-head data (no season restrictions)
      const h2hStrategies = [
        // Strategy 1: Direct search without season restrictions (most recent encounters)
        () => highlightlyClient.getMatches({
          homeTeamName: match.homeTeam.name,
          awayTeamName: match.awayTeam.name,
          limit: '10'
        }),
        // Strategy 2: Reverse order without season restrictions
        () => highlightlyClient.getMatches({
          homeTeamName: match.awayTeam.name,
          awayTeamName: match.homeTeam.name,
          limit: '10'
        }),
        // Strategy 3: Search home team matches and filter for away team (broader search)
        () => highlightlyClient.getMatches({
          homeTeamName: match.homeTeam.name,
          limit: '50'
        }).then(response => {
          if (response?.data) {
            return {
              ...response,
              data: response.data.filter((match_result: any) => {
                const awayTeamName = match_result.awayTeam?.name || match_result.teams?.away?.name || '';
                // Match against various forms of the away team name
                return awayTeamName.toLowerCase().includes(match.awayTeam.name.toLowerCase()) ||
                       match.awayTeam.name.toLowerCase().includes(awayTeamName.toLowerCase()) ||
                       awayTeamName.split(' ').some((word: string) => match.awayTeam.name.toLowerCase().includes(word.toLowerCase()));
              }).slice(0, 10) // Limit to 10 most recent
            };
          }
          return response;
        }),
        // Strategy 4: Search away team matches and filter for home team
        () => highlightlyClient.getMatches({
          homeTeamName: match.awayTeam.name,
          limit: '50'
        }).then(response => {
          if (response?.data) {
            return {
              ...response,
              data: response.data.filter((match_result: any) => {
                const awayTeamName = match_result.awayTeam?.name || match_result.teams?.away?.name || '';
                return awayTeamName.toLowerCase().includes(match.homeTeam.name.toLowerCase()) ||
                       match.homeTeam.name.toLowerCase().includes(awayTeamName.toLowerCase()) ||
                       awayTeamName.split(' ').some((word: string) => match.homeTeam.name.toLowerCase().includes(word.toLowerCase()));
              }).slice(0, 10)
            };
          }
          return response;
        }),
        // Strategy 5: Search with partial team names (first word only)
        () => {
          const homeFirstWord = match.homeTeam.name.split(' ')[0];
          const awayFirstWord = match.awayTeam.name.split(' ')[0];
          return highlightlyClient.getMatches({
            homeTeamName: homeFirstWord,
            awayTeamName: awayFirstWord,
            limit: '15'
          });
        },
        // Strategy 6: Historical search by competition (if they've met in this competition before)
        () => highlightlyClient.getMatches({
          leagueName: match.competition.name,
          limit: '100'
        }).then(response => {
          if (response?.data) {
            return {
              ...response,
              data: response.data.filter((match_result: any) => {
                const homeTeamName = match_result.homeTeam?.name || match_result.teams?.home?.name || '';
                const awayTeamName = match_result.awayTeam?.name || match_result.teams?.away?.name || '';
                
                // Check if this match involves both teams (in either home/away configuration)
                const hasHomeTeam = homeTeamName.toLowerCase().includes(match.homeTeam.name.toLowerCase()) || 
                                   homeTeamName.toLowerCase().includes(match.awayTeam.name.toLowerCase());
                const hasAwayTeam = awayTeamName.toLowerCase().includes(match.homeTeam.name.toLowerCase()) || 
                                   awayTeamName.toLowerCase().includes(match.awayTeam.name.toLowerCase());
                
                return hasHomeTeam && hasAwayTeam;
              }).slice(0, 10)
            };
          }
          return response;
        }),
        // Strategy 7: Multi-year historical search (last 5 years)
        () => {
          const currentYear = new Date().getFullYear();
          const searchYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
          
          return Promise.all(searchYears.map(year => 
            highlightlyClient.getMatches({
              homeTeamName: match.homeTeam.name,
              awayTeamName: match.awayTeam.name,
              season: year.toString(),
              limit: '5'
            }).catch(() => ({ data: [] }))
          )).then(responses => {
            const allMatches = responses.flatMap(response => response.data || []);
            // Sort by date to get most recent first
            allMatches.sort((a: any, b: any) => {
              const dateA = new Date(a.date || a.fixture?.date || '1970-01-01');
              const dateB = new Date(b.date || b.fixture?.date || '1970-01-01');
              return dateB.getTime() - dateA.getTime();
            });
            return { data: allMatches };
          });
        }
      ];
      
      // Try each strategy until we find historical data
      for (let i = 0; i < h2hStrategies.length; i++) {
        try {
          console.log(`[MatchDetails] Trying lifetime H2H strategy ${i + 1}...`);
          const response = await h2hStrategies[i]();
          
          if (response && response.data && response.data.length > 0) {
            // Sort matches by date (most recent first) and take top 5 for processing
            const sortedMatches = response.data.sort((a: any, b: any) => {
              const dateA = new Date(a.date || a.fixture?.date || '1970-01-01');
              const dateB = new Date(b.date || b.fixture?.date || '1970-01-01');
              return dateB.getTime() - dateA.getTime();
            }).slice(0, 5);
            
            console.log(`[MatchDetails] SUCCESS! Found ${sortedMatches.length} lifetime H2H matches using strategy ${i + 1}`);
            console.log(`[MatchDetails] Most recent H2H encounters:`, sortedMatches.map((m: any) => ({
              date: m.date || m.fixture?.date,
              home: m.homeTeam?.name || m.teams?.home?.name,
              away: m.awayTeam?.name || m.teams?.away?.name,
              score: m.score || m.fixture?.score?.fulltime
            })));
            
            return sortedMatches;
          }
        } catch (strategyError) {
          console.log(`[MatchDetails] Lifetime H2H strategy ${i + 1} failed:`, strategyError);
          continue;
        }
      }
      
      console.log(`[MatchDetails] All lifetime H2H search strategies failed`);
      return null;
      
    } catch (error) {
      console.error(`[MatchDetails] Critical error fetching lifetime H2H data:`, error);
      return null;
    }
  };

  // Transform real API data to match our component format
  const transformRealTeamData = (realData: any, teamName: string) => {
    if (!realData) return null;
    
    try {
      // If it's matches data from the API
      if (Array.isArray(realData) && realData.length > 0) {
        const recentMatches = realData.slice(0, 5).map((match: any) => {
          // Determine if this team was home or away
          const isHome = match.homeTeam?.name === teamName || 
                        (match.teams?.home?.name === teamName);
          
          // Extract scores
          let homeScore = 0;
          let awayScore = 0;
          
          if (match.score) {
            homeScore = match.score.home || 0;
            awayScore = match.score.away || 0;
          } else if (match.fixture?.score?.fulltime) {
            homeScore = match.fixture.score.fulltime.home || 0;
            awayScore = match.fixture.score.fulltime.away || 0;
          }
          
          // Determine result for this team
          let result = 'D'; // Default to draw
          if (homeScore !== awayScore) {
            if (isHome) {
              result = homeScore > awayScore ? 'W' : 'L';
            } else {
              result = awayScore > homeScore ? 'W' : 'L';
            }
          }
          
          // Extract team names
          const homeTeamName = match.homeTeam?.name || match.teams?.home?.name || 'Home';
          const awayTeamName = match.awayTeam?.name || match.teams?.away?.name || 'Away';
          const opponent = isHome ? awayTeamName : homeTeamName;
          
          // Extract competition name
          const competition = match.competition?.name || match.league?.name || 'League';
          
          // Extract date
          const matchDate = match.date || match.fixture?.date || new Date().toISOString().split('T')[0];
          
          return {
            result,
            opponent,
            competition,
            isHome,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeScore,
            awayScore,
            date: matchDate
          };
        });
        
        const form = recentMatches.map(m => m.result);
        const wins = form.filter(r => r === 'W').length;
        const draws = form.filter(r => r === 'D').length;
        const losses = form.filter(r => r === 'L').length;
        
        // Calculate stats from real matches
        const stats = {
          gamesPlayed: recentMatches.length,
          wins,
          draws,
          losses,
          over25: recentMatches.filter(m => (m.homeScore + m.awayScore) > 2.5).length,
          under25: recentMatches.filter(m => (m.homeScore + m.awayScore) <= 2.5).length,
          cleanSheets: recentMatches.filter(m => 
            (m.isHome && m.awayScore === 0) || (!m.isHome && m.homeScore === 0)
          ).length,
          failedToScore: recentMatches.filter(m => 
            (m.isHome && m.homeScore === 0) || (!m.isHome && m.awayScore === 0)
          ).length,
          conceded: recentMatches.filter(m => 
            (m.isHome && m.awayScore > 0) || (!m.isHome && m.homeScore > 0)
          ).length,
          concededTwo: recentMatches.filter(m => 
            (m.isHome && m.awayScore >= 2) || (!m.isHome && m.homeScore >= 2)
          ).length
        };
        
        return { form, recentMatches, stats };
      }
    } catch (error) {
      console.log('[MatchDetails] Error transforming real team data:', error);
    }
    
    return null;
  };

  const transformRealHeadToHead = (realData: any) => {
    if (!realData || !Array.isArray(realData)) return [];
    
    try {
      // Take only the 2 most recent encounters for display
      return realData.slice(0, 2).map((match: any) => {
        // Extract scores
        let homeScore = 0;
        let awayScore = 0;
        
        if (match.score) {
          homeScore = match.score.home || 0;
          awayScore = match.score.away || 0;
        } else if (match.fixture?.score?.fulltime) {
          homeScore = match.fixture.score.fulltime.home || 0;
          awayScore = match.fixture.score.fulltime.away || 0;
        }
        
        // Extract team names
        const homeTeamName = match.homeTeam?.name || match.teams?.home?.name || 'Home';
        const awayTeamName = match.awayTeam?.name || match.teams?.away?.name || 'Away';
        
        // Extract and format date
        const matchDate = match.date || match.fixture?.date || '2024-01-15';
        const formattedDate = new Date(matchDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        // Extract competition name and season if available
        const competition = match.competition?.name || match.league?.name || 'Unknown Competition';
        const season = match.season || new Date(matchDate).getFullYear().toString();
        
        return {
          date: formattedDate,
          originalDate: matchDate,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          score: `${homeScore}-${awayScore}`,
          competition: competition,
          season: season,
          // Add context about how recent this encounter was
          yearsSince: Math.floor((new Date().getTime() - new Date(matchDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
        };
      });
    } catch (error) {
      console.log('[MatchDetails] Error transforming lifetime head-to-head data:', error);
    }
    
    return [];
  };

  // Generate consistent mock data when match is loaded
  useEffect(() => {
    console.log('[MatchDetails] useEffect triggered:', {
      match: match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'null',
      homeTeamForm: homeTeamForm ? 'exists' : 'null',
      matchSeason,
      activeService: getActiveService()
    });
    
    if (match && !homeTeamForm) {
      console.log('[MatchDetails] Starting API data fetch...');
      // Start loading API data
      setApiDataLoading(true);
      
      // Only use real data from Highlightly service - no fallbacks to mock data
      if (getActiveService() === 'highlightly') {
        console.log('[MatchDetails] Fetching ONLY real data from Highlightly API...');
        
        // Fetch real data with more aggressive retry logic
        Promise.all([
          fetchRealLeagueStandings(),
          fetchRealTeamStats(match.homeTeam.id, match.homeTeam.name),
          fetchRealTeamStats(match.awayTeam.id, match.awayTeam.name),
          fetchRealHeadToHead()
        ]).then(([standings, homeStats, awayStats, h2h]) => {
          console.log(`[MatchDetails] Real API Results for ${match.homeTeam.name} vs ${match.awayTeam.name} (Season: ${matchSeason}):`, {
            standings: standings ? 'SUCCESS ✓' : 'FAILED ✗',
            homeStats: homeStats ? 'SUCCESS ✓' : 'FAILED ✗',
            awayStats: awayStats ? 'SUCCESS ✓' : 'FAILED ✗',
            h2h: h2h ? 'SUCCESS ✓' : 'FAILED ✗',
            matchDate: match.date,
            detectedSeason: matchSeason,
            competition: match.competition.name
          });
          
          // Store real data
          setRealLeagueStandings(standings);
          setRealHomeTeamStats(homeStats);
          setRealAwayTeamStats(awayStats);
          setRealHeadToHead(h2h);
          
          // Transform real data
          const realHomeTeamData = transformRealTeamData(homeStats, match.homeTeam.name);
          const realAwayTeamData = transformRealTeamData(awayStats, match.awayTeam.name);
          const realH2HData = transformRealHeadToHead(h2h);
          
          console.log('[MatchDetails] Transformed real data:', {
            realHomeTeamData: realHomeTeamData ? 'SUCCESS ✓' : 'FAILED ✗',
            realAwayTeamData: realAwayTeamData ? 'SUCCESS ✓' : 'FAILED ✗',
            realH2HData: realH2HData.length > 0 ? 'SUCCESS ✓' : 'FAILED ✗'
          });
          
          // Only use real data - set to null if not available
          setHomeTeamForm(realHomeTeamData);
          setAwayTeamForm(realAwayTeamData);
          setHeadToHeadData(realH2HData);
          
          // Log what data we're using
          console.log('[MatchDetails] Preview data loaded (REAL DATA ONLY):', {
            homeTeamForm: realHomeTeamData ? 'REAL API DATA ✓' : 'NO DATA AVAILABLE',
            awayTeamForm: realAwayTeamData ? 'REAL API DATA ✓' : 'NO DATA AVAILABLE', 
            headToHead: realH2HData.length > 0 ? 'REAL API DATA ✓' : 'NO DATA AVAILABLE',
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name
          });
          
          // For league positions, try to extract from real standings only
          if (standings && Array.isArray(standings)) {
            const homePosition = standings.find((standing: any) => 
              standing.team?.name === match.homeTeam.name
            );
            const awayPosition = standings.find((standing: any) => 
              standing.team?.name === match.awayTeam.name
            );
            
            setHomeLeaguePosition(homePosition ? {
              position: homePosition.rank || homePosition.position || standings.indexOf(homePosition) + 1,
              points: homePosition.total?.points || homePosition.points || 0,
              played: homePosition.total?.games || homePosition.played || 0,
              form: realHomeTeamData?.form?.slice(0, 3) || []
            } : null);
            
            setAwayLeaguePosition(awayPosition ? {
              position: awayPosition.rank || awayPosition.position || standings.indexOf(awayPosition) + 1,
              points: awayPosition.total?.points || awayPosition.points || 0,
              played: awayPosition.total?.games || awayPosition.played || 0,
              form: realAwayTeamData?.form?.slice(0, 3) || []
            } : null);
          } else {
            console.log('[MatchDetails] No real league standings available');
            setHomeLeaguePosition(null);
            setAwayLeaguePosition(null);
          }
          
          // Generate impressive stats only if we have real data
          if (realHomeTeamData || realAwayTeamData) {
            setImpressiveStats([
              {
                team: 'home',
                stat: 'Recent form',
                value: realHomeTeamData?.stats?.wins ? `${realHomeTeamData.stats.wins}W` : 'N/A',
                description: realHomeTeamData ? 'from last 5 matches' : 'Data unavailable'
              },
              {
                team: 'away', 
                stat: 'Recent form',
                value: realAwayTeamData?.stats?.wins ? `${realAwayTeamData.stats.wins}W` : 'N/A',
                description: realAwayTeamData ? 'from last 5 matches' : 'Data unavailable'
              }
            ]);
          } else {
            setImpressiveStats([]);
          }
          
          setApiDataLoading(false);
          console.log('[MatchDetails] Real data loading complete!');
          
          // Show toast notification about successful real data loading
          if (standings || homeStats || awayStats || h2h) {
            toast({
              title: "✅ Real Data Loaded",
              description: `Successfully loaded live data from Highlightly API for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
              variant: "default",
            });
          } else {
            toast({
              title: "⚠️ Limited Data Available", 
              description: "Could not fetch complete match data from API. Some sections may be empty.",
              variant: "default",
            });
          }
        }).catch((error) => {
          console.error('[MatchDetails] Error fetching real data:', error);
          
          // Set all data to null/empty - no fallbacks to mock data
          setHomeTeamForm(null);
          setAwayTeamForm(null);
          setHomeLeaguePosition(null);
          setAwayLeaguePosition(null);
          setHeadToHeadData([]);
          setImpressiveStats([]);
          
          setApiDataLoading(false);
          
          // Show error toast notification
          toast({
            title: "❌ API Error",
            description: "Failed to load real match data from Highlightly API. Please check your connection.",
            variant: "destructive",
          });
        });
      } else {
        console.log('[MatchDetails] Not using Highlightly service - no data available');
        setApiDataLoading(false);
        toast({
          title: "ℹ️ No Data Source",
          description: "Switch to Highlightly service in the header to view real match data.",
          variant: "default",
        });
      }
    }
  }, [match, homeTeamForm, matchSeason]);

  if (loading) {
    return <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-highlight-800 rounded w-48 mb-6"></div>
          <div className="aspect-video bg-highlight-800 rounded mb-8"></div>
          <div className="h-10 bg-highlight-800 rounded w-3/4 mb-6"></div>
          <div className="h-20 bg-highlight-800 rounded mb-8"></div>
        </div>
      </div>;
  }

  if (!match) {
    return <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-white">Match not found</h1>
          <button onClick={handleGoBack} className={`mt-4 flex items-center mx-auto text-sm font-medium px-4 py-2 rounded-md bg-highlight-800 hover:bg-highlight-700 transition-colors text-white ${navigating ? 'opacity-50 cursor-wait' : ''}`} disabled={navigating}>
            <ArrowLeft size={16} className="mr-2" />
            {navigating ? 'Going back...' : 'Go back'}
          </button>
        </div>
      </div>
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button 
          onClick={handleGoBack} 
          className={`flex items-center mb-6 px-4 py-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10 transition-colors text-white font-medium ${navigating ? 'opacity-50 cursor-wait' : ''}`} 
          disabled={navigating}
        >
          <ArrowLeft size={18} className="mr-2" />
          {navigating ? 'Going back...' : 'Back to Home'}
        </button>

        {/* Video player or Match Preview */}
        {isPreview ? (
          // Detailed preview for matches more than 1 hour away
          <div className="mb-8 w-full space-y-6">
            {/* Teams and Match Info - Main Box */}
            <div 
              className="rounded-xl overflow-hidden p-6 relative"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '200px'
              }}
            >
              {/* Country and League/Tournament Info - Top Left */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <img
                  src={match.competition.logo}
                  alt={match.competition.name}
                  className="w-5 h-5 object-contain rounded-full bg-white p-0.5"
                  style={{ minWidth: '20px', minHeight: '20px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{match.competition.name}</div>
                  <div className="text-xs text-gray-400">International • Europe</div>
                </div>
              </div>

              {/* Reminder Toggle - Top Right */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent ${
                    reminderEnabled ? 'bg-[#FFC30B]' : 'bg-black/30 backdrop-blur-sm border border-white/20'
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white transition-transform shadow-sm ${
                      reminderEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  >
                    <Bell 
                      className={`h-3 w-3 ${reminderEnabled ? 'text-[#FFC30B]' : 'text-gray-400'}`}
                    />
                  </span>
                </button>
              </div>

              {/* Teams Section - Centered */}
              <div className="flex items-center justify-center mt-16 mb-6">
                {/* Home Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name}
                    className="w-16 h-16 object-contain mx-auto mb-3" 
                  />
                  <div className="text-white font-medium text-base">{match.homeTeam.name}</div>
                </div>

                {/* Match Time and Day - Centered */}
                <div className="text-center px-8">
                  <div className="text-white text-xl font-bold mb-1">
                    {new Date(match.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: false 
                    })}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      weekday: 'long'
                    })}
                  </div>
                  {timeUntilMatch && (
                    <div className="text-yellow-400 text-sm font-medium mt-2">
                      {timeUntilMatch.includes('h') ? `Kickoff in ${timeUntilMatch}` : `Starting in ${timeUntilMatch}`}
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name}
                    className="w-16 h-16 object-contain mx-auto mb-3" 
                  />
                  <div className="text-white font-medium text-base">{match.awayTeam.name}</div>
                </div>
              </div>

              {/* Full Date - Bottom */}
              <div className="text-center text-gray-400 text-sm">
                {new Date(match.date).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Pre-season fixture banner */}
            {isPreSeasonMatch() && (
              <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-orange-400 mr-2">🏟️</div>
                  <h4 className="text-white font-semibold">Pre-Season Fixture</h4>
                </div>
                <p className="text-center text-sm text-gray-300 mb-2">
                  This appears to be an early season or pre-season match for {match.competition.name} {matchSeason}.
                </p>
                <p className="text-center text-xs text-gray-400">
                  Statistical data will become more comprehensive once the regular season begins and teams have played several matches.
                </p>
              </div>
            )}

            {/* League Standings */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">League Standings</h3>
              
              {apiDataLoading ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  {getActiveService() === 'highlightly' ? 'Loading real standings from Highlightly API...' : 'Loading standings...'}
                </div>
              ) : (
                <>
                  {/* Show data source indicator */}
                  {getActiveService() === 'highlightly' && realLeagueStandings && (
                    <div className="text-center mb-4">
                      <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">
                        ✓ Real API Data
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Home Team Position */}
                    {homeLeaguePosition ? (
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {homeLeaguePosition.position}
                        </div>
                        <div className="text-sm text-gray-400">Position</div>
                        <div className="text-lg font-semibold text-white mt-2">
                          {match.homeTeam.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {homeLeaguePosition.points} pts • {homeLeaguePosition.played} games
                        </div>
                        <div className="flex justify-center space-x-1 mt-2">
                          {(homeLeaguePosition.form || []).map((result: string, idx: number) => (
                            <div key={idx} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-gray-400 text-sm">
                          <div className="mb-2">📊</div>
                          <div className="text-white font-medium text-sm mb-1">{match.homeTeam.name}</div>
                          <div className="text-xs">
                            {isPreSeasonMatch() 
                              ? "Season hasn't started yet" 
                              : "No standings data available"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Away Team Position */}
                    {awayLeaguePosition ? (
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {awayLeaguePosition.position}
                        </div>
                        <div className="text-sm text-gray-400">Position</div>
                        <div className="text-lg font-semibold text-white mt-2">
                          {match.awayTeam.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {awayLeaguePosition.points} pts • {awayLeaguePosition.played} games
                        </div>
                        <div className="flex justify-center space-x-1 mt-2">
                          {(awayLeaguePosition.form || []).map((result: string, idx: number) => (
                            <div key={idx} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-gray-400 text-sm">
                          <div className="mb-2">📊</div>
                          <div className="text-white font-medium text-sm mb-1">{match.awayTeam.name}</div>
                          <div className="text-xs">
                            {isPreSeasonMatch() 
                              ? "Season hasn't started yet" 
                              : "No standings data available"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Show comprehensive empty state if neither team has standings */}
                  {!homeLeaguePosition && !awayLeaguePosition && (
                    <div className="text-center py-4 mt-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-2">📋</div>
                        <p className="text-white font-medium text-sm mb-2">League Standings Unavailable</p>
                        <p className="text-xs px-4">
                          {getNoDataMessage('standings')}
                        </p>
                        {isPreSeasonMatch() && (
                          <p className="text-gray-500 text-xs mt-3 px-4">
                            📅 League tables will be updated once the {match.competition.name} {matchSeason} season begins and teams have played matches.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Last Matches */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Team Headers */}
              <div className="flex items-center mb-6">
                <div className="flex-1 text-center">
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                    {match.homeTeam.name}
                  </h4>
                </div>
                <div className="flex-1 text-center">
                  <h3 className="text-lg font-semibold mb-4 text-center text-white">
                    Last Matches
                  </h3>
                </div>
                <div className="flex-1 text-center">
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                    {match.awayTeam.name}
                  </h4>
                </div>
              </div>
              
              {apiDataLoading ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  {getActiveService() === 'highlightly' ? 'Loading real team data from Highlightly API...' : 'Loading form data...'}
                </div>
              ) : (
                <>
                  {/* Show data source indicator */}
                  {getActiveService() === 'highlightly' && (realHomeTeamStats || realAwayTeamStats) && (
                    <div className="text-center mb-4">
                      <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">
                        ✓ Real API Data from Highlightly
                      </span>
                    </div>
                  )}
                  
                  {/* Pre-season context banner */}
                  {isPreSeasonMatch() && (homeTeamForm || awayTeamForm) && (
                    <div className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-center text-xs text-orange-300">
                        🏆 Pre-season fixture: Form data shown is from the previous season ({parseInt(matchSeason) - 1})
                      </p>
                    </div>
                  )}
                  
                  {homeTeamForm || awayTeamForm ? (
                    <>
                      {/* Form circles with OUTCOME */}
                      <div className="flex justify-center items-center mb-8">
                        <div className="flex flex-col items-center space-y-6">
                          <div className="flex justify-between items-center w-full max-w-lg">
                            <div className="flex space-x-1.5">
                              {Array.from({ length: 5 }, (_, index) => {
                                const result = homeTeamForm?.form?.[index];
                                return (
                                  <div key={index} className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                                    result === 'W' ? 'bg-green-500 text-white' : 
                                    result === 'L' ? 'bg-red-500 text-white' : 
                                    result === 'D' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400'
                                  }`}>
                                    {result || '?'}
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="text-center px-4">
                              <div className="text-white text-sm font-medium">VS</div>
                            </div>
                            
                            <div className="flex space-x-1.5">
                              {Array.from({ length: 5 }, (_, index) => {
                                const result = awayTeamForm?.form?.[index];
                                return (
                                  <div key={index} className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                                    result === 'W' ? 'bg-green-500 text-white' : 
                                    result === 'L' ? 'bg-red-500 text-white' : 
                                    result === 'D' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400'
                                  }`}>
                                    {result || '?'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-2">📊</div>
                        <p className="text-white font-medium text-sm mb-2">Team Form Data Unavailable</p>
                        <p className="text-xs px-4">
                          {getNoDataMessage('form')}
                        </p>
                        {isPreSeasonMatch() && (
                          <p className="text-gray-500 text-xs mt-3 px-4">
                            📅 Form data will be updated once teams have played matches in the {match.competition.name} {matchSeason} season.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Head to Head */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">Head to Head</h3>
              
              {apiDataLoading ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  {getActiveService() === 'highlightly' ? 'Loading lifetime encounters from Highlightly API...' : 'Loading head-to-head data...'}
                </div>
              ) : (
                <>
                  {/* Show data source indicator */}
                  {getActiveService() === 'highlightly' && headToHeadData.length > 0 && (
                    <div className="text-center mb-4">
                      <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">
                        ✓ Real API Data from Highlightly
                      </span>
                    </div>
                  )}
                  
                  {headToHeadData.length > 0 ? (
                    <div className="space-y-3">
                      {headToHeadData.map((encounter, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-400">{encounter.date}</div>
                            <div className="text-sm text-gray-400">{encounter.competition}</div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="text-center flex-1">
                              <div className="text-white font-medium text-sm">{encounter.homeTeam}</div>
                            </div>
                            <div className="text-center px-4">
                              <div className="text-white font-bold text-lg">{encounter.score}</div>
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-white font-medium text-sm">{encounter.awayTeam}</div>
                            </div>
                          </div>
                          {encounter.yearsSince > 0 && (
                            <div className="text-center mt-2">
                              <div className="text-xs text-gray-500">
                                {encounter.yearsSince === 1 ? '1 year ago' : `${encounter.yearsSince} years ago`}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-2">⚽</div>
                        <p className="text-white font-medium text-sm mb-2">No Recent Encounters</p>
                        <p className="text-xs px-4">
                          {getNoDataMessage('h2h')}
                        </p>
                        <p className="text-gray-500 text-xs mt-3 px-4">
                          📈 This could be their first meeting or they may compete in different leagues. Check back as our database continues to expand!
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : isImminent ? (
          // Imminent match layout for matches starting within 1 hour
          <div className="mb-8 w-full space-y-6">
            {/* Teams and Match Info - Main Box with Imminent Styling */}
            <div 
              className="rounded-xl overflow-hidden p-6 relative"
              style={{
                background: 'linear-gradient(45deg, #FFC30B 0%, #FF8C00 100%)',
                border: '2px solid #FFC30B',
                minHeight: '200px'
              }}
            >
              {/* Competition Info - Top Left */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <img
                  src={match.competition.logo}
                  alt={match.competition.name}
                  className="w-5 h-5 object-contain rounded-full bg-white p-0.5"
                  style={{ minWidth: '20px', minHeight: '20px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-black truncate">{match.competition.name}</div>
                  <div className="text-xs text-black/70">Starting Soon</div>
                </div>
              </div>

              {/* Countdown Badge - Top Right */}
              <div className="absolute top-4 right-4">
                <div className="bg-black/20 backdrop-blur-sm border border-black/30 rounded-full px-3 py-1">
                  <div className="text-black text-xs font-bold">
                    ⏰ {timeUntilMatch || 'Starting Soon'}
                  </div>
                </div>
              </div>

              {/* Teams Section - Centered */}
              <div className="flex items-center justify-center mt-16 mb-6">
                {/* Home Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name}
                    className="w-20 h-20 object-contain mx-auto mb-3" 
                  />
                  <div className="text-black font-bold text-lg">{match.homeTeam.name}</div>
                  {homeLeaguePosition && (
                    <div className="text-black/70 text-sm mt-1">
                      #{homeLeaguePosition.position} • {homeLeaguePosition.points} pts
                    </div>
                  )}
                </div>

                {/* Match Time - Centered */}
                <div className="text-center px-8">
                  <div className="text-black text-3xl font-bold mb-2">
                    {new Date(match.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: false 
                    })}
                  </div>
                  <div className="text-black/80 text-lg font-semibold mb-2">KICKOFF</div>
                  <div className="text-black/70 text-sm">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      weekday: 'long'
                    })}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name}
                    className="w-20 h-20 object-contain mx-auto mb-3" 
                  />
                  <div className="text-black font-bold text-lg">{match.awayTeam.name}</div>
                  {awayLeaguePosition && (
                    <div className="text-black/70 text-sm mt-1">
                      #{awayLeaguePosition.position} • {awayLeaguePosition.points} pts
                    </div>
                  )}
                </div>
              </div>

              {/* Full Date - Bottom */}
              <div className="text-center text-black/70 text-sm">
                {new Date(match.date).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Quick Stats Preview */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">Quick Preview</h3>
              
              {/* Form comparison */}
              {homeTeamForm && awayTeamForm ? (
                <div className="flex justify-center items-center mb-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex justify-between items-center w-full max-w-lg">
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm mb-2">{match.homeTeam.name}</div>
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }, (_, index) => {
                            const result = homeTeamForm.form?.[index];
                            return (
                              <div key={index} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                                result === 'W' ? 'bg-green-500 text-white' : 
                                result === 'L' ? 'bg-red-500 text-white' : 
                                result === 'D' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400'
                              }`}>
                                {result || '?'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="text-center px-6">
                        <div className="text-yellow-400 text-lg font-bold">VS</div>
                        <div className="text-gray-400 text-xs">Recent Form</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm mb-2">{match.awayTeam.name}</div>
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }, (_, index) => {
                            const result = awayTeamForm.form?.[index];
                            return (
                              <div key={index} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                                result === 'W' ? 'bg-green-500 text-white' : 
                                result === 'L' ? 'bg-red-500 text-white' : 
                                result === 'D' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400'
                              }`}>
                                {result || '?'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <div className="text-sm">Form data will be available once the season progresses</div>
                </div>
              )}

              {/* League positions if available */}
              {(homeLeaguePosition || awayLeaguePosition) && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-center">
                    <div className="text-yellow-400 text-xl font-bold">
                      #{homeLeaguePosition?.position || '?'}
                    </div>
                    <div className="text-gray-400 text-xs">League Position</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-center">
                    <div className="text-yellow-400 text-xl font-bold">
                      #{awayLeaguePosition?.position || '?'}
                    </div>
                    <div className="text-gray-400 text-xs">League Position</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isFullTime ? (
          // Full-time result display with vertical timeline
          <div className="mb-8 w-full space-y-6">
            {/* Teams and Final Score - Main Box */}
            <div 
              className="rounded-xl overflow-hidden p-6 relative"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '200px'
              }}
            >
              {/* Competition Info - Top Left */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <img
                  src={match.competition.logo}
                  alt={match.competition.name}
                  className="w-5 h-5 object-contain rounded-full bg-white p-0.5"
                  style={{ minWidth: '20px', minHeight: '20px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{match.competition.name}</div>
                  <div className="text-xs text-gray-400">International • Europe</div>
                </div>
              </div>

              {/* Share Actions - Top Right */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <Share2 className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Teams Section - Centered */}
              <div className="flex items-center justify-center mt-16 mb-6">
                {/* Home Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name}
                    className="w-20 h-20 object-contain mx-auto mb-3" 
                  />
                  <div className="text-white font-medium text-lg">{match.homeTeam.name}</div>
                  {homeLeaguePosition && (
                    <div className="text-gray-400 text-sm mt-1">
                      #{homeLeaguePosition.position} • {homeLeaguePosition.points} pts
                    </div>
                  )}
                </div>

                {/* Final Score and Result - Centered */}
                <div className="text-center px-8">
                  <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    FULL TIME
                  </div>
                  <div className="text-white text-6xl font-bold mb-2">
                    {match.score?.home || 0} - {match.score?.away || 0}
                  </div>
                  <div className="text-gray-400 text-sm mb-3">FINAL SCORE</div>
                  <div className="text-yellow-400 text-lg font-semibold mb-2">
                    {match.score && match.score.home > match.score.away 
                      ? `${match.homeTeam.name} Wins!`
                      : match.score && match.score.away > match.score.home
                      ? `${match.awayTeam.name} Wins!`
                      : 'Draw!'
                    }
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name}
                    className="w-20 h-20 object-contain mx-auto mb-3" 
                  />
                  <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
                  {awayLeaguePosition && (
                    <div className="text-gray-400 text-sm mt-1">
                      #{awayLeaguePosition.position} • {awayLeaguePosition.points} pts
                    </div>
                  )}
                </div>
              </div>

              {/* Match Events Timeline - Inside Score Container */}
              <div className="mt-8 mb-6">
                <div className="relative max-w-4xl mx-auto">
                  {/* Timeline line with gradient blend */}
                  <div className="absolute left-1/2 transform -translate-x-0.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>
                  
                  {/* Timeline events - chronological order (bottom to top) */}
                  <div className="space-y-6">
                    
                    {/* 78' - Substitution (Home team - left side) */}
                    <div className="flex items-center">
                      <div className="w-1/2 pr-8 text-right">
                        <div className="backdrop-blur-sm rounded-lg p-3 inline-block">
                          <div className="flex items-center gap-3 justify-end">
                            <div className="text-left">
                              <div className="text-white font-medium">Substitution</div>
                              <div className="text-gray-400 text-sm">Player Out → Player In</div>
                              <div className="text-gray-300 text-sm font-bold mt-1">78'</div>
                            </div>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
                              <RefreshCw size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-1/2 pl-8">
                      </div>
                    </div>

                    {/* 67' - Goal (Away team - right side) */}
                    <div className="flex items-center">
                      <div className="w-1/2 pr-8">
                      </div>
                      <div className="w-1/2 pl-8 text-left">
                        <div className="backdrop-blur-sm rounded-lg p-3 inline-block">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
                              <Target size={16} />
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">Goal</div>
                              <div className="text-gray-400 text-sm">Player Name</div>
                              <div className="text-gray-300 text-sm font-bold mt-1">67'</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 45' - Yellow Card (Away team - right side) */}
                    <div className="flex items-center">
                      <div className="w-1/2 pr-8">
                      </div>
                      <div className="w-1/2 pl-8 text-left">
                        <div className="backdrop-blur-sm rounded-lg p-3 inline-block">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black">
                              <Square size={16} />
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">Yellow Card</div>
                              <div className="text-gray-400 text-sm">Player Name</div>
                              <div className="text-gray-300 text-sm font-bold mt-1">45'</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 23' - Goal (Home team - left side) */}
                    <div className="flex items-center">
                      <div className="w-1/2 pr-8 text-right">
                        <div className="backdrop-blur-sm rounded-lg p-3 inline-block">
                          <div className="flex items-center gap-3 justify-end">
                            <div className="text-left">
                              <div className="text-white font-medium">Goal</div>
                              <div className="text-gray-400 text-sm">Player Name</div>
                              <div className="text-gray-300 text-sm font-bold mt-1">23'</div>
                            </div>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
                              <Target size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-1/2 pl-8">
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Match Date - Bottom */}
              <div className="text-center text-gray-400 text-sm">
                <Clock size={14} className="inline mr-1" />
                {new Date(match.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })} • {new Date(match.date).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false 
                })}
              </div>
            </div>

            {/* League Standings - Same as preview */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">League Standings</h3>
              
              {apiDataLoading ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  {getActiveService() === 'highlightly' ? 'Loading real standings from Highlightly API...' : 'Loading standings...'}
                </div>
              ) : (
                <>
                  {/* Show data source indicator */}
                  {getActiveService() === 'highlightly' && realLeagueStandings && (
                    <div className="text-center mb-4">
                      <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">
                        ✓ Real API Data
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Home Team Position */}
                    {homeLeaguePosition ? (
                      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {homeLeaguePosition.position}
                        </div>
                        <div className="text-sm text-gray-400">Position</div>
                        <div className="text-lg font-semibold text-white mt-2">
                          {match.homeTeam.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {homeLeaguePosition.points} pts • {homeLeaguePosition.played} games
                        </div>
                        <div className="flex justify-center space-x-1 mt-2">
                          {(homeLeaguePosition.form || []).map((result: string, idx: number) => (
                            <div key={idx} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                        <div className="text-gray-400 text-sm">
                          <div className="mb-2">📊</div>
                          <div className="text-white font-medium text-sm mb-1">{match.homeTeam.name}</div>
                          <div className="text-xs">No standings data available</div>
                        </div>
                      </div>
                    )}

                    {/* Away Team Position */}
                    {awayLeaguePosition ? (
                      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {awayLeaguePosition.position}
                        </div>
                        <div className="text-sm text-gray-400">Position</div>
                        <div className="text-lg font-semibold text-white mt-2">
                          {match.awayTeam.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {awayLeaguePosition.points} pts • {awayLeaguePosition.played} games
                        </div>
                        <div className="flex justify-center space-x-1 mt-2">
                          {(awayLeaguePosition.form || []).map((result: string, idx: number) => (
                            <div key={idx} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                        <div className="text-gray-400 text-sm">
                          <div className="mb-2">📊</div>
                          <div className="text-white font-medium text-sm mb-1">{match.awayTeam.name}</div>
                          <div className="text-xs">No standings data available</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Show comprehensive empty state if neither team has standings */}
                  {!homeLeaguePosition && !awayLeaguePosition && (
                    <div className="text-center py-4 mt-4 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-2">📋</div>
                        <p className="text-white font-medium text-sm mb-2">League Standings Unavailable</p>
                        <p className="text-xs px-4">
                          {getNoDataMessage('standings')}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          // Video player for finished matches or live matches
          <div className="mb-8 w-full">
            {match.videoUrl ? (
              <div ref={videoContainerRef} className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getVideoEmbedUrl(match.videoUrl)}
                  title={match.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚽</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {match.homeTeam.name} {match.score?.home || 0} - {match.score?.away || 0} {match.awayTeam.name}
                  </h2>
                  <div className="text-gray-400 text-sm mb-4">{getMatchStatusDisplay()}</div>
                  {isLive && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white text-sm font-medium">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      LIVE
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Match Events Timeline */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-center text-white">Match Events</h3>
          {match.events && match.events.length > 0 ? (
            <div className="space-y-3">
              {match.events.map((event, index) => (
                <div key={index} className="flex items-center p-3 bg-black/30 backdrop-blur-sm rounded border border-white/10">
                  <div className="text-yellow-400 font-bold text-sm mr-3">{event.time}'</div>
                  <div className="flex-1">
                    <div className="text-white text-sm">{event.type}</div>
                    <div className="text-gray-400 text-xs">{event.player}</div>
                  </div>
                  <div className="text-gray-400 text-xs">{event.team.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 text-sm">
                <div className="mb-2">📊</div>
                <p className="text-white font-medium text-sm mb-2">No match events available</p>
                <p className="text-xs px-4">
                  Event timeline will be shown when data is available
                </p>
              </div>
            </div>
          )}
        </section>
        
        <section className="mb-4">
          <div className="flex flex-wrap items-center text-sm text-gray-400 mb-4 space-x-6">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{exactDate}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{(isPreview || isImminent) ? `Kickoff: ${formatKickoffTime(match.date)}` : formattedDate}</span>
            </div>
            {!(isPreview || isImminent) && (
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
                <span>{new Intl.NumberFormat('en-US').format(match.views || 0)} views</span>
            </div>
            )}
            {/* Data source indicator */}
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${getActiveService() === 'highlightly' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
              <span className="text-xs">{getActiveService() === 'highlightly' ? 'Live API' : 'Mock Data'}</span>
            </div>
          </div>
        </section>

        <div className="mb-6">
          <div className="grid grid-cols-2 gap-0 mb-0">
            <button onClick={() => setActiveTab('stats')} className={`flex justify-center items-center py-2 px-4 font-medium text-sm transition-colors ${activeTab === 'stats' ? 'bg-[#FFC30B] text-black rounded-tl-lg' : 'bg-black/30 backdrop-blur-sm text-white hover:bg-white/10 rounded-tl-lg border border-white/10'}`}>
              <BarChart4 className="w-4 h-4 mr-2" />
              Match Stats
            </button>
            <button onClick={() => setActiveTab('lineups')} className={`flex justify-center items-center py-2 px-4 font-medium text-sm transition-colors ${activeTab === 'lineups' ? 'bg-[#FFC30B] text-black rounded-tr-lg' : 'bg-black/30 backdrop-blur-sm text-white hover:bg-white/10 rounded-tr-lg border border-white/10'}`}>
              <Shirt className="w-4 h-4 mr-2" />
              Lineups
            </button>
          </div>
          
          <div 
            className="rounded-b-lg p-6 border overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {activeTab === 'stats' ? (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-center text-white">
                  {(isPreview || isImminent) ? 'Pre-Match Information' : 'Match Statistics'}
                </h3>
                
                {(isPreview || isImminent) ? (
                  <div className="text-center py-6">
                    <div className="text-gray-400 text-sm">
                      <div className="mb-3">
                        <BarChart4 className="w-8 h-8 mx-auto text-gray-400" />
                      </div>
                      <p className="text-base text-white mb-2">Match Statistics</p>
                      <p className="text-sm">
                        {isPreview 
                          ? 'Detailed match statistics including possession, shots, and other metrics will be available during and after the match.'
                          : 'Live match statistics will start appearing once the game begins.'
                        }
                      </p>
                      <p className="text-xs mt-2 text-blue-400">
                        {isPreview ? 'Statistics are updated in real-time during the game!' : 'Almost kickoff time!'}
                      </p>
                    </div>
                  </div>
                ) : match.statistics && match.statistics.length >= 2 ? (
                  // Display real statistics from API
                  <div className="space-y-4">
                    {match.statistics[0].statistics.map((stat, index) => {
                      const homeValue = stat.value;
                      const awayValue = match.statistics![1]?.statistics[index]?.value || 0;
                      
                      // Calculate percentages for visual bars
                      let homePercent = 50;
                      let awayPercent = 50;
                      
                      if (typeof homeValue === 'number' && typeof awayValue === 'number') {
                        const total = homeValue + awayValue;
                        if (total > 0) {
                          homePercent = (homeValue / total) * 100;
                          awayPercent = (awayValue / total) * 100;
                        }
                      }
                      
                      return (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">{homeValue}</span>
                            <span className="text-sm font-medium text-center text-white">{stat.displayName}</span>
                            <span className="text-sm text-white">{awayValue}</span>
                          </div>
                          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div className="flex h-full">
                              <div className="bg-[#FFC30B] h-full" style={{ width: `${homePercent}%` }}></div>
                              <div className="bg-white h-full" style={{ width: `${awayPercent}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Fallback to mock statistics
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">55%</span>
                        <span className="text-sm font-medium text-center text-white">Possession</span>
                        <span className="text-sm text-white">45%</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-[#FFC30B] h-full" style={{ width: '55%' }}></div>
                          <div className="bg-white h-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">15</span>
                        <span className="text-sm font-medium text-center text-white">Shots</span>
                        <span className="text-sm text-white">12</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-[#FFC30B] h-full" style={{ width: '56%' }}></div>
                          <div className="bg-white h-full" style={{ width: '44%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">6</span>
                        <span className="text-sm font-medium text-center text-white">Shots on Target</span>
                        <span className="text-sm text-white">4</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-[#FFC30B] h-full" style={{ width: '60%' }}></div>
                          <div className="bg-white h-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">8</span>
                        <span className="text-sm font-medium text-center text-white">Corners</span>
                        <span className="text-sm text-white">5</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-[#FFC30B] h-full" style={{ width: '62%' }}></div>
                          <div className="bg-white h-full" style={{ width: '38%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">10</span>
                        <span className="text-sm font-medium text-center text-white">Fouls</span>
                        <span className="text-sm text-white">12</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-[#FFC30B] h-full" style={{ width: '45%' }}></div>
                          <div className="bg-white h-full" style={{ width: '55%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Lineups tab
              <div className="flex flex-col md:flex-row justify-between">
                {(isPreview || isImminent) ? (
                  <div className="text-center py-6 w-full">
                    <div className="text-gray-400 text-sm">
                      <div className="mb-3">
                        <Shirt className="w-8 h-8 mx-auto text-gray-400" />
                      </div>
                      <p className="text-base text-white mb-2">Team Lineups</p>
                      <p className="text-sm">
                        {isPreview 
                          ? 'Official team lineups and formations will be announced approximately 60-90 minutes before kickoff.'
                          : 'Lineups should be announced soon! Check back in a few minutes for confirmed starting XIs.'
                        }
                      </p>
                      <p className="text-xs mt-2 text-blue-400">
                        {isPreview ? 'Check back closer to match time for confirmed lineups!' : 'Lineups coming very soon!'}
                      </p>
                    </div>
                  </div>
                ) : match.lineups ? (
                  // Display real lineups from API
                  <>
                    <div className="md:w-[48%] mb-4 md:mb-0">
                      <h3 className="text-base font-semibold mb-3 flex items-center text-white">
                        <img src={match.lineups.homeTeam.logo} alt={match.lineups.homeTeam.name} className="w-5 h-5 object-contain mr-2" onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} />
                        {match.lineups.homeTeam.name}
                        <span className="ml-2 text-sm text-gray-400">({match.lineups.homeTeam.formation})</span>
                      </h3>
                      <div className="space-y-1">
                        {match.lineups.homeTeam.initialLineup.flat().map((player: Player, index: number) => (
                          <div key={index} className="flex items-center p-2 bg-black/30 backdrop-blur-sm rounded border border-white/10">
                            <span className="text-white text-sm">{player.number}. {player.name}</span>
                            <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                          </div>
                        ))}
                      </div>
                      
                      {match.lineups.homeTeam.substitutes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2 text-gray-300">Substitutes</h4>
                          <div className="space-y-1">
                            {match.lineups.homeTeam.substitutes.map((player: Player, index: number) => (
                              <div key={index} className="flex items-center p-1 bg-black/20 backdrop-blur-sm rounded text-sm border border-white/5">
                                <span className="text-gray-300">{player.number}. {player.name}</span>
                                <span className="ml-auto text-xs text-gray-500">{player.position}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-[48%]">
                      <h3 className="text-base font-semibold mb-3 flex items-center text-white">
                        <img src={match.lineups.awayTeam.logo} alt={match.lineups.awayTeam.name} className="w-5 h-5 object-contain mr-2" onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} />
                        {match.lineups.awayTeam.name}
                        <span className="ml-2 text-sm text-gray-400">({match.lineups.awayTeam.formation})</span>
                      </h3>
                      <div className="space-y-1">
                        {match.lineups.awayTeam.initialLineup.flat().map((player: Player, index: number) => (
                          <div key={index} className="flex items-center p-2 bg-black/30 backdrop-blur-sm rounded border border-white/10">
                            <span className="text-white text-sm">{player.number}. {player.name}</span>
                            <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                          </div>
                        ))}
                      </div>
                      
                      {match.lineups.awayTeam.substitutes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2 text-gray-300">Substitutes</h4>
                          <div className="space-y-1">
                            {match.lineups.awayTeam.substitutes.map((player: Player, index: number) => (
                              <div key={index} className="flex items-center p-1 bg-black/20 backdrop-blur-sm rounded text-sm border border-white/5">
                                <span className="text-gray-300">{player.number}. {player.name}</span>
                                <span className="ml-auto text-xs text-gray-500">{player.position}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Fallback to mock lineups
                  <>
                    <div className="md:w-[48%] mb-4 md:mb-0">
                      <h3 className="text-base font-semibold mb-3 flex items-center text-white">
                        <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 object-contain mr-2" onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} />
                        {match.homeTeam.name}
                      </h3>
                      <div className="space-y-1">
                        {["1. Alisson", "66. Alexander-Arnold", "4. Van Dijk (C)", "32. Matip", "26. Robertson", "3. Fabinho", "6. Thiago", "14. Henderson", "11. Salah", "20. Jota", "10. Mané"].map((player, index) => (
                          <div key={index} className="flex items-center p-2 bg-black/30 backdrop-blur-sm rounded border border-white/10">
                            <span className="text-white text-sm">{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:w-[48%]">
                      <h3 className="text-base font-semibold mb-3 flex items-center text-white">
                        <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 object-contain mr-2" onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} />
                        {match.awayTeam.name}
                      </h3>
                      <div className="space-y-1">
                        {["32. Ramsdale", "18. Tomiyasu", "4. White", "6. Gabriel", "3. Tierney", "5. Partey", "34. Xhaka", "7. Saka", "8. Ødegaard (C)", "35. Martinelli", "9. Lacazette"].map((player, index) => (
                          <div key={index} className="flex items-center p-2 bg-black/30 backdrop-blur-sm rounded border border-white/10">
                            <span className="text-white text-sm">{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={handleShare} className="flex items-center px-4 py-2 rounded-md border border-gray-700 hover:bg-[#222222] transition-colors text-white">
            <Share2 size={16} className="mr-2" />
            Share this highlight
          </button>
        </div>
      </div>
    </div>
  );
};
export default MatchDetails;