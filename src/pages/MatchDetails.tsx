import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4 } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getActiveService } from '@/services/serviceAdapter';
import { MatchHighlight, EnhancedMatchHighlight, Player } from '@/types';
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
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // Helper function to determine if match is upcoming
  const isUpcomingMatch = (matchData: EnhancedMatchHighlight): boolean => {
    const matchDate = new Date(matchData.date);
    const now = new Date();
    
    // If match date is in the future, it's upcoming
    if (matchDate > now) {
      return true;
    }
    
    // Also check if there's no score and the match hasn't finished
    if (!matchData.score && matchDate <= now) {
      // Could be live or just finished without score data
      return false;
    }
    
    return false;
  };

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

  return <div className="min-h-screen bg-black text-white pt-16 pb-16">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button onClick={handleGoBack} className={`flex items-center mb-6 text-sm font-medium transition-colors ${navigating ? 'opacity-50 cursor-wait' : 'hover:underline'} text-white`} disabled={navigating}>
          <ArrowLeft size={16} className="mr-2" />
          {navigating ? 'Going back...' : 'Back to Home'}
        </button>

        {/* Competition name */}
        <div className="mb-4">
          <span className="inline-block bg-[#222222] text-white text-sm px-3 py-1 rounded-full">
            {match.competition.name}
          </span>
        </div>

        {/* Team names, logos, and score section */}
        <section className="mb-8 bg-[#222222] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col justify-center items-center mb-4">
            <span className={`text-sm font-medium px-3 py-1 rounded-full text-white mb-3 ${
              isUpcomingMatch(match) ? 'bg-blue-600' : 'bg-[#333333]'
            }`}>
              {isUpcomingMatch(match) ? 'UPCOMING' : 'FT'}
            </span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-6 md:mb-0 cursor-pointer hover:opacity-80 transition-opacity md:w-1/3 md:items-end" onClick={() => handleTeamClick(match.homeTeam.id)}>
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-16 h-16 object-contain" onError={e => {
              const target = e.target as HTMLImageElement;
              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
            }} />
              <span className="font-semibold text-lg mt-2 text-white hover:text-[#FFC30B] transition-colors">
                {match.homeTeam.name}
              </span>
            </div>
            
            <div className="flex items-center mb-6 md:mb-0 md:w-1/3 justify-center">
              {!isUpcomingMatch(match) && match.score ? (
              <span className="text-4xl md:text-5xl font-bold px-4 text-center text-white">
                {match.score.home} <span className="text-gray-400">-</span> {match.score.away}
              </span>
              ) : (
                <div className="text-center">
                  <span className="text-2xl md:text-3xl font-bold px-4 text-center text-gray-400">
                    VS
                  </span>
                  <div className="text-sm text-gray-400 mt-2">
                    {new Date(match.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric'
                    })} • {new Date(match.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity md:w-1/3 md:items-start" onClick={() => handleTeamClick(match.awayTeam.id)}>
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-16 h-16 object-contain" onError={e => {
              const target = e.target as HTMLImageElement;
              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
            }} />
              <span className="font-semibold text-lg mt-2 text-white hover:text-[#FFC30B] transition-colors">
                {match.awayTeam.name}
              </span>
            </div>
          </div>
        </section>

        {/* Video player for finished matches OR Match Preview for upcoming matches */}
        {!isUpcomingMatch(match) ? (
          // Show video highlights for finished/live matches
          (() => {
            // Debug logging for video URL validation
            if (match.videoUrl) {
              console.log('[MatchDetails] Video URL found:', match.videoUrl);
              console.log('[MatchDetails] isValidVideoUrl:', isValidVideoUrl(match.videoUrl));
              console.log('[MatchDetails] videoLoadError:', videoLoadError);
              console.log('[MatchDetails] contains streamff:', match.videoUrl.toLowerCase().includes('streamff'));
            }
            
            return match.videoUrl && 
                   isValidVideoUrl(match.videoUrl) && 
                   !videoLoadError && 
                   !match.videoUrl.toLowerCase().includes('streamff');
          })() && (
        <div className="mb-8 w-full">
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg" ref={videoContainerRef}>
              <iframe 
                className="w-full h-full" 
                src={getVideoEmbedUrl(match.videoUrl)} 
                title={match.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                  onError={() => {
                    console.log('[MatchDetails] Video failed to load');
                    setVideoLoadError(true);
                  }}
                  onLoad={() => {
                    console.log('[MatchDetails] Video loaded successfully');
                  }}
                />
              </div>
            </div>
          )
        ) : (
          // Show match preview for upcoming matches
          <div className="mb-8">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] rounded-xl p-6 shadow-xl border border-gray-800/30">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">📅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Match Preview</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Information */}
                <div className="bg-[#2a2a2a] rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    Match Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white">{exactDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white">
                        {new Date(match.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Competition:</span>
                      <span className="text-white">{match.competition.name}</span>
                    </div>
                  </div>
                </div>
                
                {/* Recent Form */}
                <div className="bg-[#2a2a2a] rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BarChart4 className="w-5 h-5 mr-2 text-green-400" />
                    Recent Form
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{match.homeTeam.name}</span>
                        <div className="flex space-x-1">
                          {['W', 'W', 'D', 'L', 'W'].map((result, i) => (
                            <span key={i} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' :
                              result === 'D' ? 'bg-yellow-500 text-black' :
                              'bg-red-500 text-white'
                            }`}>
                              {result}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{match.awayTeam.name}</span>
                        <div className="flex space-x-1">
                          {['L', 'W', 'W', 'D', 'W'].map((result, i) => (
                            <span key={i} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' :
                              result === 'D' ? 'bg-yellow-500 text-black' :
                              'bg-red-500 text-white'
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
            </div>
          </div>
        )}

        {/* Match Events Timeline section OR Predicted Lineups for upcoming matches */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] rounded-xl p-6 shadow-xl border border-gray-800/30">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#FFC30B] to-[#FFD700] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-black text-lg font-bold">{isUpcomingMatch(match) ? '👥' : '⚡'}</span>
                </div>
                <h3 className="text-2xl font-bold text-white">{isUpcomingMatch(match) ? 'Expected Lineups' : 'Match Events'}</h3>
              </div>
            </div>
            
            {!isUpcomingMatch(match) && match.events && match.events.length > 0 ? (
              <div className="relative">
                {/* Central timeline line with gradient */}
                <div className="absolute left-1/2 transform -translate-x-0.5 h-full w-1 bg-gradient-to-b from-[#FFC30B] via-gray-600 to-[#FFC30B] opacity-60 shadow-sm"></div>
                
                <div className="space-y-4">
                  {match.events
                    .sort((a, b) => {
                      const getMinute = (time: string) => {
                        const match = time.match(/(\d+)(?:\+(\d+))?/);
                        if (match) {
                          const base = parseInt(match[1]);
                          const added = match[2] ? parseInt(match[2]) : 0;
                          return base + added;
                        }
                        return parseInt(time) || 0;
                      };
                      return getMinute(a.time) - getMinute(b.time);
                    })
                    .map((event, index) => {
                      const getEventStyle = (type: string) => {
                        switch (type) {
                          case 'Goal': 
                            return { 
                              icon: '⚽', 
                              bg: 'bg-gradient-to-r from-green-500 to-green-600',
                              glow: 'shadow-green-500/50'
                            };
                          case 'Penalty': 
                            return { 
                              icon: '🥅', 
                              bg: 'bg-gradient-to-r from-green-600 to-green-700',
                              glow: 'shadow-green-600/50'
                            };
                          case 'Own Goal': 
                            return { 
                              icon: '😬', 
                              bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                              glow: 'shadow-orange-500/50'
                            };
                          case 'Yellow Card': 
                            return { 
                              icon: '🟨', 
                              bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
                              glow: 'shadow-yellow-500/50'
                            };
                          case 'Red Card': 
                            return { 
                              icon: '🟥', 
                              bg: 'bg-gradient-to-r from-red-500 to-red-600',
                              glow: 'shadow-red-500/50'
                            };
                          case 'Substitution': 
                            return { 
                              icon: '🔄', 
                              bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
                              glow: 'shadow-blue-500/50'
                            };
                          default: 
                            return { 
                              icon: '📋', 
                              bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
                              glow: 'shadow-gray-500/50'
                            };
                        }
                      };

                      const eventStyle = getEventStyle(event.type);
                      const isHomeTeam = event.team.id.toString() === match.homeTeam.id.toString();
                      
                      return (
                        <div key={index} className="relative flex items-center">
                          {/* Timeline dot with animation */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
                            <div className={`w-8 h-8 ${eventStyle.bg} rounded-full flex items-center justify-center shadow-lg ${eventStyle.glow} border-2 border-white/20 transition-all duration-300 hover:scale-110`}>
                              <span className="text-white text-sm">{eventStyle.icon}</span>
                            </div>
                            {/* Pulse animation for goals */}
                            {(event.type === 'Goal' || event.type === 'Penalty') && (
                              <div className="absolute inset-0 w-8 h-8 bg-green-500 rounded-full animate-ping opacity-20"></div>
                            )}
                          </div>
                          
                          {/* Team-specific sides with cards at ultra-extreme distance from center line */}
                          <div className="w-full flex justify-center">
                            <div className={`w-56 ${isHomeTeam ? 'mr-[20rem]' : 'ml-[20rem]'}`}>
                              <div className={`bg-gradient-to-r ${
                                isHomeTeam 
                                  ? 'from-[#2a2a2a] to-[#1f1f1f] border-l-2 border-[#FFC30B]' 
                                  : 'from-[#1f1f1f] to-[#2a2a2a] border-r-2 border-white'
                              } rounded-lg p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm`}>
                                
                                {/* Compact header with time and event type */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`flex items-center space-x-2 ${!isHomeTeam ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                                      event.type === 'Goal' || event.type === 'Penalty' 
                                        ? 'bg-green-500 text-white' 
                                        : event.type === 'Red Card' 
                                        ? 'bg-red-500 text-white'
                                        : event.type === 'Yellow Card'
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-gray-600 text-white'
                                    }`}>
                                      {event.time}'
                                    </span>
                                    <span className="text-white/80 font-medium text-xs uppercase tracking-wider">{event.type}</span>
                                  </div>
                                </div>
                                
                                {/* Compact player and team info */}
                                <div className={`flex items-center space-x-2 ${!isHomeTeam ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                  <div className="flex-shrink-0">
                                    <img 
                                      src={event.team.logo} 
                                      alt={event.team.name} 
                                      className="w-5 h-5 object-contain rounded-full bg-white/10 p-0.5" 
                                      onError={e => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                                      }} 
                                    />
                                  </div>
                                  <div className={`flex-1 min-w-0 ${!isHomeTeam ? 'text-right' : ''}`}>
                                    <p className="text-white font-semibold text-sm leading-tight truncate">{event.player}</p>
                                    {event.type === 'Goal' && event.assist && (
                                      <p className="text-green-300 text-xs opacity-90 truncate">
                                        <span className="font-medium">Assist:</span> {event.assist}
                                      </p>
                                    )}
                                    {event.type === 'Substitution' && event.substituted && (
                                      <p className="text-red-300 text-xs opacity-90 truncate">
                                        <span className="font-medium">Out:</span> {event.substituted}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                  <span className="text-gray-400 text-2xl">📋</span>
                </div>
                <p className="text-gray-400 text-lg">No match events available</p>
                <p className="text-gray-500 text-sm mt-2">Events will appear here when the match begins</p>
              </div>
            )}
          </div>
        </section>
        
        <section className="mb-4">
          <div className="flex flex-wrap items-center text-sm text-gray-400 mb-4 space-x-6">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{exactDate}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{new Intl.NumberFormat('en-US').format(match.views)} views</span>
            </div>
          </div>
        </section>

        <div className="mb-8">
          {isUpcomingMatch(match) ? (
            // Show only lineups for upcoming matches
            <>
              <div className="mb-4">
                <div className="flex justify-center items-center py-3 px-4 font-medium text-sm bg-[#FFC30B] text-black rounded-t-lg">
                  <Shirt className="w-4 h-4 mr-2" />
                  Expected Lineups
                </div>
              </div>
              
              <div className="bg-[#222222] rounded-b-lg p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  {match.lineups ? (
                    // Display real predicted lineups from API
                    <>
                      <div className="md:w-[48%] mb-6 md:mb-0">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                          <img src={match.lineups.homeTeam.logo} alt={match.lineups.homeTeam.name} className="w-6 h-6 object-contain mr-2" onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                          }} />
                          {match.lineups.homeTeam.name}
                          <span className="ml-2 text-sm text-gray-400">({match.lineups.homeTeam.formation})</span>
                        </h3>
                        <div className="space-y-2">
                          {match.lineups.homeTeam.initialLineup.flat().map((player: Player, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                              <span className="text-white text-sm">{player.number}. {player.name}</span>
                              <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="md:w-[48%]">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                          <img src={match.lineups.awayTeam.logo} alt={match.lineups.awayTeam.name} className="w-6 h-6 object-contain mr-2" onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                          }} />
                          {match.lineups.awayTeam.name}
                          <span className="ml-2 text-sm text-gray-400">({match.lineups.awayTeam.formation})</span>
                        </h3>
                        <div className="space-y-2">
                          {match.lineups.awayTeam.initialLineup.flat().map((player: Player, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                              <span className="text-white text-sm">{player.number}. {player.name}</span>
                              <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Show message that lineups will be available closer to match time
                    <div className="w-full text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                        <Shirt className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Lineups Not Available Yet</h3>
                      <p className="text-gray-400 mb-2">Expected lineups will be published closer to kick-off time</p>
                      <p className="text-gray-500 text-sm">Usually available 1-2 hours before the match starts</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Show both tabs for finished matches
            <>
              <div className="grid grid-cols-2 gap-0 mb-4">
                <button onClick={() => setActiveTab('stats')} className={`flex justify-center items-center py-3 px-4 font-medium text-sm ${activeTab === 'stats' ? 'bg-[#FFC30B] text-black rounded-tl-lg' : 'bg-[#222222] text-white hover:bg-[#333333] rounded-tl-lg'}`}>
                  <BarChart4 className="w-4 h-4 mr-2" />
                  Match Stats
                </button>
                <button onClick={() => setActiveTab('lineups')} className={`flex justify-center items-center py-3 px-4 font-medium text-sm ${activeTab === 'lineups' ? 'bg-[#FFC30B] text-black rounded-tr-lg' : 'bg-[#191919] text-white hover:bg-[#252525] rounded-tr-lg'}`}>
                  <Shirt className="w-4 h-4 mr-2" />
                  Lineups
                </button>
              </div>
              
              <div className="bg-[#222222] rounded-b-lg p-6">
                {activeTab === 'stats' ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-center text-white">Match Statistics</h3>
                    
                    {match.statistics && match.statistics.length >= 2 ? (
                      // Display real statistics from API
                      <div className="space-y-6">
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
                            <div key={index} className="mb-6">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-white">{homeValue}</span>
                                <span className="text-sm font-medium text-center text-white">{stat.displayName}</span>
                                <span className="text-sm text-white">{awayValue}</span>
                              </div>
                              <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
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
                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">55%</span>
                            <span className="text-sm font-medium text-center text-white">Possession</span>
                            <span className="text-sm text-white">45%</span>
                          </div>
                          <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                            <div className="flex h-full">
                              <div className="bg-[#FFC30B] h-full" style={{ width: '55%' }}></div>
                              <div className="bg-white h-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">15</span>
                            <span className="text-sm font-medium text-center text-white">Shots</span>
                            <span className="text-sm text-white">12</span>
                          </div>
                          <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                            <div className="flex h-full">
                              <div className="bg-[#FFC30B] h-full" style={{ width: '56%' }}></div>
                              <div className="bg-white h-full" style={{ width: '44%' }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">6</span>
                            <span className="text-sm font-medium text-center text-white">Shots on Target</span>
                            <span className="text-sm text-white">4</span>
                          </div>
                          <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
                            <div className="flex h-full">
                              <div className="bg-[#FFC30B] h-full" style={{ width: '60%' }}></div>
                              <div className="bg-white h-full" style={{ width: '40%' }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">8</span>
                            <span className="text-sm font-medium text-center text-white">Corners</span>
                            <span className="text-sm text-white">5</span>
                          </div>
                          <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
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
                          <div className="w-full h-2 bg-[#191919] rounded-full overflow-hidden">
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
                  // Lineups tab content for finished matches
                  <div className="flex flex-col md:flex-row justify-between">
                    {match.lineups ? (
                      // Display real lineups from API
                      <>
                        <div className="md:w-[48%] mb-6 md:mb-0">
                          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                            <img src={match.lineups.homeTeam.logo} alt={match.lineups.homeTeam.name} className="w-6 h-6 object-contain mr-2" onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }} />
                            {match.lineups.homeTeam.name}
                            <span className="ml-2 text-sm text-gray-400">({match.lineups.homeTeam.formation})</span>
                          </h3>
                          <div className="space-y-2">
                            {match.lineups.homeTeam.initialLineup.flat().map((player: Player, index: number) => (
                              <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                                <span className="text-white text-sm">{player.number}. {player.name}</span>
                                <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                              </div>
                            ))}
                          </div>
                          
                          {match.lineups.homeTeam.substitutes.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-md font-medium mb-2 text-gray-300">Substitutes</h4>
                              <div className="space-y-1">
                                {match.lineups.homeTeam.substitutes.map((player: Player, index: number) => (
                                  <div key={index} className="flex items-center p-1 bg-[#191919] rounded text-sm">
                                    <span className="text-gray-300">{player.number}. {player.name}</span>
                                    <span className="ml-auto text-xs text-gray-500">{player.position}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="md:w-[48%]">
                          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                            <img src={match.lineups.awayTeam.logo} alt={match.lineups.awayTeam.name} className="w-6 h-6 object-contain mr-2" onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }} />
                            {match.lineups.awayTeam.name}
                            <span className="ml-2 text-sm text-gray-400">({match.lineups.awayTeam.formation})</span>
                          </h3>
                          <div className="space-y-2">
                            {match.lineups.awayTeam.initialLineup.flat().map((player: Player, index: number) => (
                              <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                                <span className="text-white text-sm">{player.number}. {player.name}</span>
                                <span className="ml-auto text-xs text-gray-400">{player.position}</span>
                              </div>
                            ))}
                          </div>
                          
                          {match.lineups.awayTeam.substitutes.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-md font-medium mb-2 text-gray-300">Substitutes</h4>
                              <div className="space-y-1">
                                {match.lineups.awayTeam.substitutes.map((player: Player, index: number) => (
                                  <div key={index} className="flex items-center p-1 bg-[#191919] rounded text-sm">
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
                      // Fallback to mock lineups for finished matches
                      <>
                        <div className="md:w-[48%] mb-6 md:mb-0">
                          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                            <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-6 h-6 object-contain mr-2" onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }} />
                            {match.homeTeam.name}
                          </h3>
                          <div className="space-y-2">
                            {["1. Alisson", "66. Alexander-Arnold", "4. Van Dijk (C)", "32. Matip", "26. Robertson", "3. Fabinho", "6. Thiago", "14. Henderson", "11. Salah", "20. Jota", "10. Mané"].map((player, index) => (
                              <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
                                <span className="text-white text-sm">{player}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="md:w-[48%]">
                          <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                            <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-6 h-6 object-contain mr-2" onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                            }} />
                            {match.awayTeam.name}
                          </h3>
                          <div className="space-y-2">
                            {["32. Ramsdale", "18. Tomiyasu", "4. White", "6. Gabriel", "3. Tierney", "5. Partey", "34. Xhaka", "7. Saka", "8. Ødegaard (C)", "35. Martinelli", "9. Lacazette"].map((player, index) => (
                              <div key={index} className="flex items-center p-2 bg-[#191919] rounded">
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
            </>
          )}
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