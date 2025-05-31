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
            <span className="text-sm font-medium bg-[#333333] px-3 py-1 rounded-full text-white mb-3">FT</span>
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
              <span className="text-4xl md:text-5xl font-bold px-4 text-center text-white">
                {match.score.home} <span className="text-gray-400">-</span> {match.score.away}
              </span>
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

        {/* Match title */}
        

        {/* Video player */}
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
                  <div className="mb-2">📹</div>
                  <p className="text-sm">Video highlight not available</p>
                  <p className="text-xs mt-1">Check back later for match highlights</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Match Events Timeline section */}
        <section className="mb-8 bg-[#222222] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-center text-white">Match Events</h3>
          
          {match.events && match.events.length > 0 ? (
            <div className="space-y-3">
              {match.events
                .sort((a, b) => {
                  // Sort events by time (handle formats like "45+1", "90+4")
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
                  const getEventIcon = (type: string) => {
                    switch (type) {
                      case 'Goal': return '⚽';
                      case 'Penalty': return '⚽';
                      case 'Own Goal': return '⚽';
                      case 'Yellow Card': return '🟨';
                      case 'Red Card': return '🟥';
                      case 'Substitution': return '↔️';
                      default: return '📋';
                    }
                  };

                  const getEventColor = (type: string) => {
                    switch (type) {
                      case 'Goal': 
                      case 'Penalty':
                      case 'Own Goal': 
                        return 'text-green-400';
                      case 'Yellow Card': return 'text-yellow-400';
                      case 'Red Card': return 'text-red-400';
                      case 'Substitution': return 'text-blue-400';
                      default: return 'text-gray-400';
                    }
                  };

                  const isHomeTeam = event.team.id.toString() === match.homeTeam.id.toString();
                  
                  return (
                    <div key={index} className={`flex items-center p-3 bg-[#191919] rounded-lg ${isHomeTeam ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Team logo */}
                      <img 
                        src={event.team.logo} 
                        alt={event.team.name} 
                        className="w-6 h-6 object-contain flex-shrink-0" 
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                        }} 
                      />
                      
                      {/* Event content */}
                      <div className={`flex-1 ${isHomeTeam ? 'ml-3' : 'mr-3'} ${isHomeTeam ? 'text-left' : 'text-right'}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getEventIcon(event.type)}</span>
                          <span className={`text-sm font-medium ${getEventColor(event.type)}`}>
                            {event.type}
                          </span>
                          <span className="text-sm text-gray-400 font-mono">
                            {event.time}'
                          </span>
                        </div>
                        
                        <div className="mt-1">
                          <span className="text-white text-sm font-medium">
                            {event.player}
                          </span>
                          
                          {/* Additional event details */}
                          {event.type === 'Goal' && event.assist && (
                            <span className="text-gray-400 text-xs ml-2">
                              (Assist: {event.assist})
                            </span>
                          )}
                          
                          {event.type === 'Penalty' && event.assist && (
                            <span className="text-gray-400 text-xs ml-2">
                              (Assist: {event.assist})
                            </span>
                          )}
                          
                          {event.type === 'Substitution' && event.substituted && (
                            <div className="text-gray-400 text-xs mt-1">
                              <span className="text-green-400">IN:</span> {event.player} • 
                              <span className="text-red-400 ml-1">OUT:</span> {event.substituted}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Time on the opposite side */}
                      <div className={`flex-shrink-0 ${isHomeTeam ? 'ml-auto' : 'mr-auto'}`}>
                        <span className="text-xs text-gray-500 font-mono bg-[#333333] px-2 py-1 rounded">
                          {event.time}'
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">
                <div className="mb-2">📋</div>
                <p>No detailed match events available</p>
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
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{new Intl.NumberFormat('en-US').format(match.views)} views</span>
            </div>
          </div>
        </section>

        <div className="mb-8">
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
              // Lineups tab
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
                  // Fallback to mock lineups
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