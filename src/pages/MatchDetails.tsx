import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getActiveService } from '@/services/serviceAdapter';
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
    
    // Check if it's finished (has score or video, and is in the past)
    if ((match.score && (match.score.home !== 0 || match.score.away !== 0)) || 
        (match.videoUrl && match.videoUrl !== '') || 
        hoursUntilMatch < -1) {
      return 'finished';
    }
    
    // Upcoming matches - differentiate by time
    if (hoursUntilMatch > 1) {
      return 'preview'; // More than 1 hour before
    } else if (hoursUntilMatch > 0) {
      return 'imminent'; // Less than 1 hour before (but more than 0)
    }
    
    return 'finished'; // Default fallback
  };

  const matchTiming = getMatchTiming();
  const isPreview = matchTiming === 'preview';
  const isImminent = matchTiming === 'imminent';
  const isLive = matchTiming === 'live';
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
  }, [id, isLive, isImminent, isPreview]);

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

  // Generate mock data for preview mode
  const generateTeamForm = (teamName: string) => {
    // Generate last 5 matches form
    const results = ['W', 'L', 'D'];
    const form = Array.from({ length: 5 }, () => 
      results[Math.floor(Math.random() * results.length)]
    );
    
    // Generate stats
    const gamesPlayed = 5;
    const wins = form.filter(r => r === 'W').length;
    const draws = form.filter(r => r === 'D').length;
    const losses = form.filter(r => r === 'L').length;
    
    return {
      form,
      stats: {
        gamesPlayed,
        wins,
        draws, 
        losses,
        over25: Math.floor(Math.random() * 4) + 1, // Out of 5 games
        under25: 5 - (Math.floor(Math.random() * 4) + 1),
        cleanSheets: Math.floor(Math.random() * 3),
        failedToScore: Math.floor(Math.random() * 2),
        conceded: gamesPlayed - Math.floor(Math.random() * 3),
        concededTwo: Math.floor(Math.random() * 3)
      }
    };
  };

  const generateLeaguePosition = (teamName: string) => {
    // Mock league position data
    const position = Math.floor(Math.random() * 20) + 1;
    const points = Math.floor(Math.random() * 50) + 20;
    const played = Math.floor(Math.random() * 10) + 15;
    
    return {
      position,
      points,
      played,
      form: generateTeamForm(teamName).form.slice(0, 3) // Last 3 for standings
    };
  };

  const generateHeadToHead = () => {
    return [
      {
        date: '2024-01-15',
        homeTeam: match?.homeTeam.name || 'Home',
        awayTeam: match?.awayTeam.name || 'Away', 
        score: '2-1',
        competition: 'Premier League'
      },
      {
        date: '2023-08-22',
        homeTeam: match?.awayTeam.name || 'Away',
        awayTeam: match?.homeTeam.name || 'Home',
        score: '0-3', 
        competition: 'Premier League'
      }
    ];
  };

  const generateImpressiveStats = () => {
    const stats = [
      { team: 'home', stat: 'Goals per game', value: '2.3', description: 'Highest in the league' },
      { team: 'away', stat: 'Clean sheets', value: '8', description: 'Best defensive record' },
      { team: 'home', stat: 'Win rate at home', value: '89%', description: 'Unbeaten at home this season' }
    ];
    return stats;
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

  return <div className="min-h-screen bg-black text-white pt-24 pb-16">
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

            {/* League Standings */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '240px'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">League Standings</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Standing */}
                <div className="space-y-3">
                  <div className="flex items-center mb-3">
                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-6 h-6 object-contain mr-2" />
                    <h4 className="text-base font-semibold text-white">{match.homeTeam.name}</h4>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">League Position</span>
                      <span className="text-[#FFC30B] font-bold text-lg">#{generateLeaguePosition(match.homeTeam.name).position}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Points</span>
                      <span className="text-white font-medium">{generateLeaguePosition(match.homeTeam.name).points}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Recent Form</span>
                      <div className="flex space-x-1">
                        {generateLeaguePosition(match.homeTeam.name).form.map((result, index) => (
                          <span key={index} className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-600 text-white' :
                            result === 'D' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Away Team Standing */}
                <div className="space-y-3">
                  <div className="flex items-center mb-3">
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-6 h-6 object-contain mr-2" />
                    <h4 className="text-base font-semibold text-white">{match.awayTeam.name}</h4>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">League Position</span>
                      <span className="text-[#FFC30B] font-bold text-lg">#{generateLeaguePosition(match.awayTeam.name).position}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Points</span>
                      <span className="text-white font-medium">{generateLeaguePosition(match.awayTeam.name).points}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Recent Form</span>
                      <div className="flex space-x-1">
                        {generateLeaguePosition(match.awayTeam.name).form.map((result, index) => (
                          <span key={index} className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-600 text-white' :
                            result === 'D' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Form and Stats */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">Recent Form & Stats (Last 5 Games)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Form */}
                <div className="space-y-3">
                  <div className="flex items-center mb-3">
                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 object-contain mr-2" />
                    <h4 className="text-base font-semibold text-white">{match.homeTeam.name}</h4>
                  </div>
                  
                  {/* Form */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium text-sm">Form (Last 5)</span>
                      <div className="flex space-x-1">
                        {generateTeamForm(match.homeTeam.name).form.map((result, index) => (
                          <span key={index} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-600 text-white' :
                            result === 'D' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.homeTeam.name).stats.over25}/5</div>
                      <div className="text-gray-400 text-xs">Over 2.5 Goals</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.homeTeam.name).stats.cleanSheets}/5</div>
                      <div className="text-gray-400 text-xs">Clean Sheets</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.homeTeam.name).stats.failedToScore}/5</div>
                      <div className="text-gray-400 text-xs">Failed to Score</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.homeTeam.name).stats.concededTwo}/5</div>
                      <div className="text-gray-400 text-xs">Conceded 2+</div>
                    </div>
                  </div>
                </div>

                {/* Away Team Form */}
                <div className="space-y-3">
                  <div className="flex items-center mb-3">
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 object-contain mr-2" />
                    <h4 className="text-base font-semibold text-white">{match.awayTeam.name}</h4>
                  </div>
                  
                  {/* Form */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium text-sm">Form (Last 5)</span>
                      <div className="flex space-x-1">
                        {generateTeamForm(match.awayTeam.name).form.map((result, index) => (
                          <span key={index} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-600 text-white' :
                            result === 'D' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.awayTeam.name).stats.over25}/5</div>
                      <div className="text-gray-400 text-xs">Over 2.5 Goals</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.awayTeam.name).stats.cleanSheets}/5</div>
                      <div className="text-gray-400 text-xs">Clean Sheets</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.awayTeam.name).stats.failedToScore}/5</div>
                      <div className="text-gray-400 text-xs">Failed to Score</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/20">
                      <div className="text-[#FFC30B] font-bold text-base">{generateTeamForm(match.awayTeam.name).stats.concededTwo}/5</div>
                      <div className="text-gray-400 text-xs">Conceded 2+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Head to Head */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">Head-to-Head (Last 2 Meetings)</h3>
              <div className="space-y-3">
                {generateHeadToHead().map((h2h, index) => (
                  <div key={index} className="bg-black/30 backdrop-blur-sm rounded-lg p-3 flex justify-between items-center border border-white/20">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">{new Date(h2h.date).toLocaleDateString()}</span>
                      <span className="text-blue-400 text-sm">{h2h.competition}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white">
                      <span className="font-medium text-sm">{h2h.homeTeam}</span>
                      <span className="bg-[#FFC30B] text-black px-2 py-1 rounded font-bold text-sm">{h2h.score}</span>
                      <span className="font-medium text-sm">{h2h.awayTeam}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Stats */}
            <div 
              className="rounded-xl p-6 border overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-white">Key Stats to Watch</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generateImpressiveStats().map((stat, index) => (
                  <div key={index} className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="flex items-center justify-center mb-2">
                      <img 
                        src={stat.team === 'home' ? match.homeTeam.logo : match.awayTeam.logo} 
                        alt={stat.team === 'home' ? match.homeTeam.name : match.awayTeam.name}
                        className="w-6 h-6 object-contain mr-2" 
                      />
                      <span className="text-white font-medium text-sm">
                        {stat.team === 'home' ? match.homeTeam.name : match.awayTeam.name}
                      </span>
                    </div>
                    <div className="text-[#FFC30B] font-bold text-xl mb-1">{stat.value}</div>
                    <div className="text-white font-medium mb-1 text-sm">{stat.stat}</div>
                    <div className="text-gray-400 text-xs">{stat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isImminent ? (
          // Simple preview for matches less than 1 hour away
          <div className="mb-8 w-full">
            <div className="bg-[#222222] rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-center text-white">Match Starting Soon</h3>
              {timeUntilMatch && (
                <div className="text-center mb-6">
                  <div className="inline-flex items-center bg-yellow-500 text-black px-4 py-2 rounded-full font-semibold animate-pulse">
                    <Clock size={16} className="mr-2" />
                    Starting in {timeUntilMatch}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-300">
                    <Calendar size={20} className="mr-3 text-[#FFC30B]" />
                    <span className="font-medium">Date</span>
                  </div>
                  <p className="text-white ml-8">{exactDate}</p>
                  
                  <div className="flex items-center text-gray-300">
                    <Clock size={20} className="mr-3 text-[#FFC30B]" />
                    <span className="font-medium">Kickoff</span>
                  </div>
                  <p className="text-white ml-8">{formatKickoffTime(match.date)}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-[#191919] rounded-lg border border-yellow-500/20">
                    <p className="text-yellow-400 text-sm text-center">
                      Match begins in less than an hour!
                    </p>
                    <p className="text-gray-400 text-xs text-center mt-2">
                      Lineups and final team news will be available soon
                    </p>
                  </div>
                  
                  <div className="p-4 bg-[#191919] rounded-lg border border-blue-500/20">
                    <p className="text-blue-400 text-sm text-center">
                      Page will automatically switch to live updates when match begins
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Existing video player for finished/live matches
          <div className="mb-8 w-full">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg" ref={videoContainerRef}>
              {match.videoUrl ? (
                <iframe 
                  className="w-full h-full" 
                  src={getVideoEmbedUrl(match.videoUrl)} 
                  title={match.title} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="mb-2">
                      <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm">Video highlight not available</p>
                    <p className="text-xs mt-1">Check back later for match highlights</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Match Events Timeline section */}
        <section 
          className="mb-6 relative overflow-hidden p-6"
          style={{
            background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
            borderRadius: '20px'
          }}
        >
          <h3 className="text-lg font-semibold mb-4 text-center text-white">
            {isPreview ? 'Match Preview' : isImminent ? 'Pre-Match' : 'Match Events'}
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
            <div className="text-center py-6">
              <div className="text-gray-400 text-sm">
                <div className="mb-2">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-base">No detailed match events available</p>
                <p className="text-xs mt-1">Event timeline will be shown when data is available</p>
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
    </div>;
};
export default MatchDetails;