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
  const [videoLoadError, setVideoLoadError] = useState(false);
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
          setVideoLoadError(false);
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

  const isValidVideoUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
      console.log('[MatchDetails] Invalid video URL - empty or not string:', url);
      return false;
    }
    
    console.log('[MatchDetails] Checking video URL:', url);
    
    // List of problematic domains that often refuse connections
    const blockedDomains = [
      'streamff.com',
      'streamff.net',
      'streamff.org',
      'streamff.tv',
      'streamable.com',
      'dailymotion.com'
    ];
    
    // Check if URL contains any blocked domains (more thorough check)
    const urlLowerCase = url.toLowerCase();
    const containsBlockedDomain = blockedDomains.some(domain => {
      const isBlocked = urlLowerCase.includes(domain);
      if (isBlocked) {
        console.log(`[MatchDetails] Blocked video URL - contains ${domain}:`, url);
      }
      return isBlocked;
    });
    
    if (containsBlockedDomain) {
      return false;
    }
    
    // Basic URL validation
    try {
      const urlObj = new URL(url);
      console.log('[MatchDetails] Valid video URL:', url, 'Host:', urlObj.hostname);
      return true;
    } catch (error) {
      console.log('[MatchDetails] Invalid video URL format:', url, 'Error:', error);
      return false;
    }
  };

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
      </div>;
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
                background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
                border: '1px solid #1B1B1B',
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
                  {timeUntilMatch && (
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                      {timeUntilMatch.includes('h') ? `KICKOFF IN ${timeUntilMatch}` : `STARTING IN ${timeUntilMatch}`}
                    </div>
                  )}
                  <div className="text-white text-5xl font-bold mb-2">
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
                background: '#000000',
                border: '1px solid #1B1B1B'
              }}
            >
              <h4 className="text-lg font-semibold mb-4 text-center text-white">LEAGUE STANDINGS</h4>
              
              {apiDataLoading ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  {getActiveService() === 'highlightly' ? 'Loading real standings from Highlightly API...' : 'Loading standings...'}
                </div>
              ) : (
                <>
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

            {/* Last Matches with Integrated Head-to-Head */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: '#000000',
                border: '1px solid #1B1B1B'
              }}
            >
              {/* Team Headers */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-center">
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                    {match.homeTeam.name}: LAST MATCHES
                  </h4>
                </div>
                <div className="text-center">
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                    {match.awayTeam.name}: LAST MATCHES
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
                      {/* Form circles */}
                      <div className="flex justify-between items-center mb-8">
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const result = homeTeamForm?.form?.[index];
                            return (
                              <div key={index} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                                result === 'W' ? 'bg-green-500 text-white' : 
                                result === 'L' ? 'bg-red-500 text-white' : 
                                result === 'D' ? 'bg-yellow-500 text-black' : 'bg-gray-800 border border-gray-400 text-gray-400'
                              }`}>
                                {result || '-'}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-center px-8">
                          <div className="text-white text-sm font-medium">OUTCOME</div>
                        </div>
                        
                        <div className="flex space-x-1.5">
                          {Array.from({ length: 10 }, (_, index) => {
                            const result = awayTeamForm?.form?.[index];
                            return (
                              <div key={index} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                                result === 'W' ? 'bg-green-500 text-white' : 
                                result === 'L' ? 'bg-red-500 text-white' : 
                                result === 'D' ? 'bg-yellow-500 text-black' : 'bg-gray-800 border border-gray-400 text-gray-400'
                              }`}>
                                {result || '-'}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 gap-4 mb-8">
                        {/* Over 2.5 Goals */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = homeTeamForm?.recentMatches?.[index];
                              const over25 = match ? (match.homeScore + match.awayScore) > 2.5 : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && over25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-center px-8">
                            <div className="text-white text-sm font-medium">OVER 2.5</div>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = awayTeamForm?.recentMatches?.[index];
                              const over25 = match ? (match.homeScore + match.awayScore) > 2.5 : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && over25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Under 2.5 Goals */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = homeTeamForm?.recentMatches?.[index];
                              const under25 = match ? (match.homeScore + match.awayScore) <= 2.5 : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && under25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-center px-8">
                            <div className="text-white text-sm font-medium">UNDER 2.5</div>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = awayTeamForm?.recentMatches?.[index];
                              const under25 = match ? (match.homeScore + match.awayScore) <= 2.5 : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && under25 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Clean Sheet */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = homeTeamForm?.recentMatches?.[index];
                              const cleanSheet = match ? (match.isHome ? match.awayScore === 0 : match.homeScore === 0) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && cleanSheet && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-center px-8">
                            <div className="text-white text-sm font-medium">CLEAN SHEET</div>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = awayTeamForm?.recentMatches?.[index];
                              const cleanSheet = match ? (match.isHome ? match.awayScore === 0 : match.homeScore === 0) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && cleanSheet && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Failed to Score */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = homeTeamForm?.recentMatches?.[index];
                              const failedToScore = match ? (match.isHome ? match.homeScore === 0 : match.awayScore === 0) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && failedToScore && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-center px-8">
                            <div className="text-white text-sm font-medium">FAILED TO SCORE</div>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = awayTeamForm?.recentMatches?.[index];
                              const failedToScore = match ? (match.isHome ? match.homeScore === 0 : match.awayScore === 0) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && failedToScore && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Conceded */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = homeTeamForm?.recentMatches?.[index];
                              const conceded = match ? (match.isHome ? match.awayScore > 0 : match.homeScore > 0) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && conceded && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-center px-8">
                            <div className="text-white text-sm font-medium">CONCEDED</div>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = awayTeamForm?.recentMatches?.[index];
                              const conceded = match ? (match.isHome ? match.awayScore > 0 : match.homeScore > 0) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && conceded && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Conceded Two */}
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = homeTeamForm?.recentMatches?.[index];
                              const concededTwo = match ? (match.isHome ? match.awayScore >= 2 : match.homeScore >= 2) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && concededTwo && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-center px-8">
                            <div className="text-white text-sm font-medium">CONCEDED TWO</div>
                          </div>
                          
                          <div className="flex space-x-1.5">
                            {Array.from({ length: 10 }, (_, index) => {
                              const match = awayTeamForm?.recentMatches?.[index];
                              const concededTwo = match ? (match.isHome ? match.awayScore >= 2 : match.homeScore >= 2) : false;
                              return (
                                <div key={index} className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center bg-gray-800">
                                  {match && concededTwo && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Head-to-Head Section */}
                      {headToHeadData.length > 0 && (
                        <>
                          <div className="border-t border-white/10 pt-6 mb-4">
                            <h4 className="text-lg font-semibold text-center text-white mb-4">HEAD-TO-HEAD</h4>
                          </div>
                          
                          <div className="space-y-3">
                            {headToHeadData.map((encounter, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                                <div className="text-sm text-gray-400 min-w-[100px]">{encounter.date}</div>
                                <div className="flex items-center justify-center flex-1">
                                  <div className="text-center">
                                    <div className="text-white font-medium text-sm">
                                      {encounter.homeTeam} <span className="text-yellow-400 font-bold mx-3">{encounter.score}</span> {encounter.awayTeam}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-400 min-w-[120px] text-right">{encounter.competition}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
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
          </div>
        ) : isImminent ? (
          // Streamlined imminent layout for matches less than 1 hour away
          <div className="mb-8 w-full">
            <div 
              className="rounded-xl overflow-hidden p-8 relative"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '300px'
              }}
            >
              {/* Competition Info - Top Left */}
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <img
                  src={match.competition.logo}
                  alt={match.competition.name}
                  className="w-6 h-6 object-contain rounded-full bg-white p-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-white">{match.competition.name}</div>
                  <div className="text-xs text-gray-400">Live Soon</div>
                </div>
              </div>

              {/* Actions - Top Right */}
              <div className="absolute top-6 right-6 flex items-center gap-3">
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                    reminderEnabled ? 'bg-[#FFC30B]' : 'bg-black/40 border border-white/20'
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center transform rounded-full bg-white transition-transform ${
                      reminderEnabled ? 'translate-x-11' : 'translate-x-1'
                    }`}
                  >
                    <Bell className={`h-4 w-4 ${reminderEnabled ? 'text-[#FFC30B]' : 'text-gray-400'}`} />
                  </span>
                </button>
                <button
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full bg-black/40 border border-white/20 hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <Share2 className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Imminent Badge - Top Center */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                  STARTING SOON
                </div>
              </div>

              {/* Teams and Score - Centered */}
              <div className="flex items-center justify-center mt-20 mb-8">
                {/* Home Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name}
                    className="w-24 h-24 object-contain mx-auto mb-4" 
                  />
                  <div className="text-white font-semibold text-xl">{match.homeTeam.name}</div>
                  {homeLeaguePosition && (
                    <div className="text-gray-400 text-sm mt-2">
                      #{homeLeaguePosition.position} • {homeLeaguePosition.points} pts
                    </div>
                  )}
                </div>

                {/* Countdown and Time */}
                <div className="text-center px-12">
                  <div className="text-white text-3xl font-bold mb-2">
                    {new Date(match.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: false 
                    })}
                  </div>
                  <div className="text-gray-400 text-sm mb-3">KICKOFF</div>
                  {timeUntilMatch && (
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold">
                      {timeUntilMatch}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs mt-3">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center flex-1">
                  <img 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name}
                    className="w-24 h-24 object-contain mx-auto mb-4" 
                  />
                  <div className="text-white font-semibold text-xl">{match.awayTeam.name}</div>
                  {awayLeaguePosition && (
                    <div className="text-gray-400 text-sm mt-2">
                      #{awayLeaguePosition.position} • {awayLeaguePosition.points} pts
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Form Comparison */}
              {(homeTeamForm || awayTeamForm) && (
                <div className="flex justify-center items-center mt-8">
                  <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                    <div className="text-center text-white text-sm font-medium mb-3">Recent Form</div>
                    <div className="flex items-center gap-4">
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }, (_, index) => {
                          const result = homeTeamForm?.form?.[index];
                          return (
                            <div key={index} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 
                              result === 'L' ? 'bg-red-500 text-white' : 
                              result === 'D' ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400'
                            }`}>
                              {result || '?'}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-white text-sm">VS</div>
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }, (_, index) => {
                          const result = awayTeamForm?.form?.[index];
                          return (
                            <div key={index} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
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
              )}
            </div>
          </div>
        ) : isFullTime ? (
          // Full-time result display with vertical timeline and comprehensive stats
          <div className="mb-8 w-full space-y-6">
            {/* Teams and Final Score - Main Box */}
            <div 
              className="rounded-xl overflow-hidden p-6 relative"
              style={{
                background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
                border: '1px solid #1B1B1B',
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

            {/* Match Highlights Section */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: '#000000',
                border: '1px solid #1B1B1B'
              }}
            >
              <h4 className="text-lg font-semibold mb-4 text-center text-white">MATCH HIGHLIGHTS</h4>
              
              {match.videoUrl ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={getVideoEmbedUrl(match.videoUrl)}
                    title={`${match.homeTeam.name} vs ${match.awayTeam.name} Highlights`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    <div className="mb-3">
                      <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
                        <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-white font-medium text-base mb-3">Highlights Coming Soon</p>
                    <p className="text-sm mb-4 max-w-md mx-auto">
                      Match highlights are being processed and will be available shortly after the final whistle. 
                      Our team is working to bring you the best moments from this match.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs">
                      <div className="flex items-center text-blue-400">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                        Usually available within 2-4 hours
                      </div>
                      <span className="hidden sm:inline text-gray-600">•</span>
                      <button 
                        onClick={() => {
                          window.location.href = 'mailto:support@leaguelens.com?subject=Match%20Highlights%20Request&body=Hi,%20I%27m%20looking%20for%20highlights%20for%20the%20match%20' + encodeURIComponent(`${match.homeTeam.name} vs ${match.awayTeam.name}`) + '%20on%20' + encodeURIComponent(new Date(match.date).toLocaleDateString());
                        }}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Match Statistics Comparison */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: '#000000',
                border: '1px solid #1B1B1B'
              }}
            >
              <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
              
              {match.statistics && match.statistics.length >= 2 ? (
                <div className="space-y-4">
                  {/* Team Headers */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8 object-contain" />
                      <span className="text-white font-medium text-sm">{match.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium text-sm">{match.awayTeam.name}</span>
                      <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8 object-contain" />
                    </div>
                  </div>

                  {/* Statistics Bars */}
                  <div className="space-y-4">
                    {match.statistics[0].statistics.map((stat, index) => {
                      const homeValue = stat.value;
                      const awayValue = match.statistics![1]?.statistics[index]?.value || 0;
                      
                      // Calculate percentages for visual bars
                      let homePercent = 50;
                      let awayPercent = 50;
                      
                      if (typeof homeValue === 'number' && typeof awayValue === 'number') {
                        if (stat.displayName.toLowerCase().includes('possession')) {
                          // Possession: use actual percentages (should add to 100%)
                          const total = homeValue + awayValue;
                          if (total > 0) {
                            homePercent = (homeValue / total) * 100;
                            awayPercent = (awayValue / total) * 100;
                          }
                        } else {
                          // Other stats: scale proportionally, show 0 if value is 0
                          if (homeValue === 0 && awayValue === 0) {
                            homePercent = 0;
                            awayPercent = 0;
                          } else {
                            const maxValue = Math.max(homeValue, awayValue);
                            const maxBarWidth = 40; // Maximum 40% from center (80% total)
                            homePercent = homeValue === 0 ? 0 : (homeValue / maxValue) * maxBarWidth;
                            awayPercent = awayValue === 0 ? 0 : (awayValue / maxValue) * maxBarWidth;
                          }
                        }
                      }
                      
                      // Determine which value is higher for color coding
                      const homeIsHigher = typeof homeValue === 'number' && typeof awayValue === 'number' 
                        ? homeValue >= awayValue 
                        : false;
                      const awayIsHigher = typeof homeValue === 'number' && typeof awayValue === 'number' 
                        ? awayValue > homeValue 
                        : false;
                      
                      return (
                        <div key={index} className="mb-4">
                          {/* Stat name and values */}
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-medium ${homeIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {homeValue}
                            </span>
                            <span className="text-sm font-medium text-white text-center flex-1 mx-4">
                              {stat.displayName}
                            </span>
                            <span className={`text-sm font-medium ${awayIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {awayValue}
                            </span>
                          </div>
                          
                          {/* Horizontal bar chart */}
                          {stat.displayName.toLowerCase().includes('possession') ? (
                            // Ball possession - continuous bar from left to right
                            <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="flex h-full">
                                <div 
                                  className={`h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                  style={{ width: `${homePercent}%` }}
                                ></div>
                                <div 
                                  className={`h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                  style={{ width: `${awayPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            // Other stats - split from center
                            <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden relative">
                              {/* Home team bar (extends left from center) */}
                              <div 
                                className={`absolute right-1/2 top-0 h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                style={{ width: `${homePercent}%` }}
                              ></div>
                              {/* Away team bar (extends right from center) */}
                              <div 
                                className={`absolute left-1/2 top-0 h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                style={{ width: `${awayPercent}%` }}
                              ></div>
                              {/* Center divider line */}
                              <div className="absolute left-1/2 top-0 w-px h-full bg-black transform -translate-x-px"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Fallback to mock statistics with comprehensive football metrics
                <div>
                  {/* Team Headers */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8 object-contain" />
                      <span className="text-white font-medium text-sm">{match.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium text-sm">{match.awayTeam.name}</span>
                      <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8 object-contain" />
                    </div>
                  </div>

                  {/* Mock Statistics */}
                  <div className="space-y-4">
                    {[
                      { name: 'Ball Possession', home: 58, away: 42, unit: '%' },
                      { name: 'Expected Goals', home: 1.7, away: 1.2, unit: '' },
                      { name: 'Shots On Target', home: 8, away: 5, unit: '' },
                      { name: 'Big Scoring Chances', home: 3, away: 2, unit: '' },
                      { name: 'Total Attempts', home: 15, away: 12, unit: '' },
                      { name: 'Blocked Shots', home: 2, away: 4, unit: '' },
                      { name: 'Shots in the Box', home: 10, away: 7, unit: '' },
                      { name: 'Shots from Outside the Box', home: 5, away: 5, unit: '' },
                      { name: 'Woodwork Hits', home: 1, away: 0, unit: '' },
                      { name: 'Fouls', home: 12, away: 15, unit: '' },
                      { name: 'Corners', home: 6, away: 4, unit: '' },
                      { name: 'Throw-ins', home: 18, away: 22, unit: '' },
                      { name: 'Saves', home: 3, away: 6, unit: '' },
                      { name: 'Passes', home: 587, away: 412, unit: '' },
                      { name: 'Offsides', home: 2, away: 1, unit: '' },
                      { name: 'Passes into Final Third', home: 89, away: 67, unit: '' },
                      { name: 'Completed Passes in Final Third', home: 34, away: 28, unit: '' },
                      { name: 'Touches in Opponent\'s Box', home: 18, away: 14, unit: '' },
                      { name: 'Tackles', home: 16, away: 19, unit: '' },
                      { name: 'Completed Tackles', home: 12, away: 14, unit: '' },
                      { name: 'Total Crosses', home: 14, away: 8, unit: '' },
                      { name: 'Successful Crosses', home: 4, away: 2, unit: '' },
                      { name: 'Interceptions', home: 8, away: 12, unit: '' },
                      { name: 'Clearances', home: 15, away: 23, unit: '' },
                      { name: 'Yellow Cards', home: 2, away: 4, unit: '' },
                      { name: 'Red Cards', home: 0, away: 1, unit: '' }
                    ].map((stat, index) => {
                      // Calculate percentages for visual bars
                      let homePercent, awayPercent;
                      
                      if (stat.name.toLowerCase().includes('possession')) {
                        // Possession: use actual percentages (should add to 100%)
                        const total = stat.home + stat.away;
                        homePercent = total > 0 ? (stat.home / total) * 100 : 50;
                        awayPercent = total > 0 ? (stat.away / total) * 100 : 50;
                      } else {
                        // Other stats: scale proportionally, show 0 if value is 0
                        if (stat.home === 0 && stat.away === 0) {
                          homePercent = 0;
                          awayPercent = 0;
                        } else {
                          const maxValue = Math.max(stat.home, stat.away);
                          const maxBarWidth = 40; // Maximum 40% from center (80% total)
                          homePercent = stat.home === 0 ? 0 : (stat.home / maxValue) * maxBarWidth;
                          awayPercent = stat.away === 0 ? 0 : (stat.away / maxValue) * maxBarWidth;
                        }
                      }
                      
                      // Determine which value is higher for color coding
                      const homeIsHigher = stat.home >= stat.away;
                      const awayIsHigher = stat.away > stat.home;
                      
                      return (
                        <div key={index} className="mb-4">
                          {/* Stat name and values */}
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-medium ${homeIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {stat.home}{stat.unit}
                            </span>
                            <span className="text-sm font-medium text-white text-center flex-1 mx-4">
                              {stat.name}
                            </span>
                            <span className={`text-sm font-medium ${awayIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {stat.away}{stat.unit}
                            </span>
                          </div>
                          
                          {/* Horizontal bar chart */}
                          {stat.name.toLowerCase().includes('possession') ? (
                            // Ball possession - continuous bar from left to right
                            <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="flex h-full">
                                <div 
                                  className={`h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                  style={{ width: `${homePercent}%` }}
                                ></div>
                                <div 
                                  className={`h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                  style={{ width: `${awayPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            // Other stats - split from center
                            <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden relative">
                              {/* Home team bar (extends left from center) */}
                              <div 
                                className={`absolute right-1/2 top-0 h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                style={{ width: `${homePercent}%` }}
                              ></div>
                              {/* Away team bar (extends right from center) */}
                              <div 
                                className={`absolute left-1/2 top-0 h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} 
                                style={{ width: `${awayPercent}%` }}
                              ></div>
                              {/* Center divider line */}
                              <div className="absolute left-1/2 top-0 w-px h-full bg-black transform -translate-x-px"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
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

        {/* Only show metadata section for non-preview matches */}
        {!isPreview && (
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
        )}

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