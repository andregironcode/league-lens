import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell, Target, RefreshCw, Square, Users, Video, BarChart2 } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById } from '@/services/serviceAdapter';
import { highlightlyService } from '@/services/highlightlyService';
import { MatchHighlight, EnhancedMatchHighlight, Player, Match } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

// Helper component for displaying a single player
const PlayerDisplay = ({ player }: { player: Player }) => (
  <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gray-800/60">
    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
      {player.number}
    </div>
    <div>
      <div className="font-medium text-white text-sm leading-tight">{player.name}</div>
    </div>
  </div>
);

// Helper component for displaying a full team lineup
const TeamLineupDisplay = ({ lineup, teamName }: { lineup?: { formation: string; initialLineup: Player[][]; substitutes: Player[] }, teamName: string }) => {
  if (!lineup || !lineup.initialLineup || lineup.initialLineup.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 bg-gray-900/50 rounded-lg">
        <Users size={32} className="mx-auto mb-3" />
        <p className="font-semibold text-white">Lineup Unavailable</p>
        <p className="text-sm">Lineup information is not yet available for {teamName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-lg font-semibold text-white">{teamName}</h4>
        <p className="text-yellow-400 font-bold text-md">Formation: {lineup.formation || 'N/A'}</p>
      </div>
      
      <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/40" style={{
          backgroundImage: `url('/football-pitch.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        <div className="space-y-4 min-h-[300px] flex flex-col justify-around">
          {lineup.initialLineup.map((row: Player[], rowIndex: number) => (
            <div key={rowIndex} className="flex justify-around items-center">
              {row.map((player: Player) => (
                <div key={player.number} className="text-center w-28">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto border-2 border-white/70 shadow-md">
                    {player.number}
                  </div>
                  <p className="text-white text-xs mt-1 bg-black/60 px-2 py-0.5 rounded-full truncate">{player.name}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-3">Substitutes</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lineup.substitutes?.map((player: Player) => (
            <PlayerDisplay key={player.number} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<EnhancedMatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoHighlightsList, setVideoHighlightsList] = useState<MatchHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [videoLoadError, setVideoLoadError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setError("Match ID is missing.");
      setLoading(false);
      return;
    }

    const fetchMatchAndHighlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const matchData = await getMatchById(id);
        if (matchData) {
          setMatch(matchData);
          // Fetch highlights after getting match details
          setHighlightsLoading(true);
          try {
            const highlightsData = await highlightlyService.getHighlightsForMatch(id);
            setVideoHighlightsList(highlightsData);
          } catch (highlightsError) {
            console.error("Failed to fetch match highlights:", highlightsError);
            toast({
              title: "Could Not Load Highlights",
              description: "There was an issue fetching the match highlights.",
              variant: "destructive",
            });
          } finally {
            setHighlightsLoading(false);
          }
        } else {
          setError("Match not found.");
        }
      } catch (err) {
        console.error("Failed to fetch match details:", err);
        setError("Could not load match details. Please try again later.");
        toast({
          title: "Error Loading Match",
          description: "There was a problem retrieving the details for this match.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMatchAndHighlights();
  }, [id, toast]);

  const getMatchTiming = () => {
    if (!match) return { status: 'loading' };

    const matchDate = new Date(match.date);
    const now = new Date();
    const timeDiff = matchDate.getTime() - now.getTime();
    const hoursUntilMatch = timeDiff / (1000 * 60 * 60);

    if (match.status?.long === 'Match Finished' || match.status?.short === 'FT') {
        return { status: 'fullTime' };
    }
    if (match.status?.long?.includes('In Play') || match.status?.short === 'LIVE') {
        return { status: 'live' };
    }
    if (hoursUntilMatch > 1) {
        return { status: 'preview', hours: Math.floor(hoursUntilMatch) };
    }
    if (hoursUntilMatch > 0) {
        return { status: 'imminent', minutes: Math.floor(hoursUntilMatch * 60) };
    }
    // Default for past matches that might not be explicitly "Finished"
    return { status: 'fullTime' };
  };

  const isValidVideoUrl = (url: string): boolean => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const getVideoEmbedUrl = (url: string): string => {
    if (!isValidVideoUrl(url)) return '';
    try {
      const videoId = new URL(url).searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    } catch {
      return '';
    }
  };

  const handleGoBack = () => navigate(-1);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Match: ${match?.homeTeam.name} vs ${match?.awayTeam.name}`,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      toast({ title: "Sharing not supported or failed.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-l-4 border-yellow-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-semibold">Loading Match Details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error || "Could not find match data."}</p>
          <button
            onClick={handleGoBack}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <ArrowLeft className="mr-2 -ml-1 h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { status } = getMatchTiming();
  const isFullTime = status === 'fullTime';
  // You can define other states like isPreview, isImminent if you build out those views
  
  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button onClick={handleGoBack} className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            Back to Matches
          </button>
        </div>
        
        {/* We will focus on the FullTime view as requested */}
        {isFullTime ? (
          <div className="mb-8 w-full space-y-6">
            {/* Teams and Final Score - Main Box */}
            <div 
              className="rounded-xl overflow-hidden p-6 relative"
              style={{
                background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
                border: '1px solid #1B1B1B',
              }}
            >
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <img src={match.competition.logo} alt={match.competition.name} className="w-5 h-5 object-contain rounded-full bg-white p-0.5" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{match.competition.name}</div></div>
              </div>
              <div className="absolute top-4 right-4">
                <button onClick={handleShare} className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10">
                  <Share2 className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-center mt-16 mb-6">
                <div className="text-center flex-1">
                  <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
                  <div className="text-white font-medium text-lg">{match.homeTeam.name}</div>
                </div>
                <div className="text-center px-8">
                  <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">FULL TIME</div>
                  <div className="text-white text-6xl font-bold mb-2">{match.score?.home ?? 0} - {match.score?.away ?? 0}</div>
                  <div className="text-gray-400 text-sm mb-3">FINAL SCORE</div>
                </div>
                <div className="text-center flex-1">
                  <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
                  <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-2 flex justify-around sm:justify-center space-x-1 sm:space-x-2">
              {[
                { key: 'summary', label: 'Summary', icon: BarChart2 },
                { key: 'lineups', label: 'Lineups', icon: Users },
                { key: 'highlights', label: 'Highlights', icon: Video },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 sm:flex-initial sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black ${
                    activeTab === tab.key
                      ? 'bg-yellow-500 text-black shadow-lg scale-105'
                      : 'text-white bg-gray-800/50 hover:bg-gray-700/70'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* TAB CONTENT */}
            <div className="pt-2">
              {activeTab === 'summary' && (
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                  <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
                  {match.statistics && match.statistics.length >= 2 ? (
                     <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex items-center space-x-3"><img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8 object-contain" /><span className="text-white font-medium text-sm">{match.homeTeam.name}</span></div>
                           <div className="flex items-center space-x-3"><span className="text-white font-medium text-sm">{match.awayTeam.name}</span><img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8 object-contain" /></div>
                        </div>
                        <div className="space-y-4">
                          {match.statistics[0].statistics.map((stat, index) => {
                              const homeValue = stat.value;
                              const awayValue = match.statistics![1]?.statistics[index]?.value || 0;
                              let homePercent = 50, awayPercent = 50;
                              if (typeof homeValue === 'number' && typeof awayValue === 'number') {
                                const total = homeValue + awayValue;
                                if (total > 0) {
                                  homePercent = (homeValue / total) * 100;
                                  awayPercent = (awayValue / total) * 100;
                                }
                              } else if (typeof homeValue === 'string' && homeValue.includes('%')) {
                                const homeVal = parseFloat(homeValue);
                                const awayVal = typeof awayValue === 'string' ? parseFloat(awayValue) : 0;
                                homePercent = homeVal;
                                awayPercent = awayVal;
                              }
                              
                              const homeIsHigher = typeof homeValue === 'number' && typeof awayValue === 'number' ? homeValue >= awayValue : false;
                              const awayIsHigher = typeof homeValue === 'number' && typeof awayValue === 'number' ? awayValue > homeValue : false;
                              
                              return (
                                <div key={index} className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-medium ${homeIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>{homeValue}</span>
                                    <span className="text-sm font-medium text-white text-center flex-1 mx-4">{stat.displayName}</span>
                                    <span className={`text-sm font-medium ${awayIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>{awayValue}</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                    <div className={`h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} style={{ width: `${homePercent}%` }}></div>
                                    <div className={`h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} style={{ width: `${awayPercent}%` }}></div>
                                  </div>
                                </div>
                              );
                           })}
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-8 text-gray-400"><BarChart4 size={32} className="mx-auto mb-2" /><p>Match statistics are not yet available.</p></div>
                  )}
                </div>
              )}

              {activeTab === 'lineups' && (
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                      <TeamLineupDisplay lineup={match.lineups?.homeTeam} teamName={match.homeTeam.name} />
                      <TeamLineupDisplay lineup={match.lineups?.awayTeam} teamName={match.awayTeam.name} />
                   </div>
                </div>
              )}

              {activeTab === 'highlights' && (
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                  <h4 className="text-lg font-semibold mb-4 text-center text-white">MATCH HIGHLIGHTS</h4>
                  {highlightsLoading ? (
                    <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                  ) : videoHighlightsList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videoHighlightsList.map((highlight, index) => (
                        isValidVideoUrl(highlight.videoUrl) && (
                          <a key={highlight.id || index} href={highlight.videoUrl} target="_blank" rel="noopener noreferrer" className="block bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                            <div className="aspect-video bg-black relative">
                              <img src={highlight.thumbnailUrl || '/placeholder-thumbnail.jpg'} alt={highlight.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => (e.currentTarget.src = '/placeholder-thumbnail.jpg')} />
                              <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-opacity duration-300"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent"><h5 className="text-white text-sm font-semibold truncate" title={highlight.title}>{highlight.title}</h5></div>
                            </div>
                          </a>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400"><Eye size={32} className="mx-auto mb-2" /><p className="text-white font-medium">No Highlights Available</p><p className="text-sm">There are currently no highlight clips for this match.</p></div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold">Match Status: {status}</h2>
            <p className="text-gray-400 mt-2">This view is not yet implemented. Only the 'Full-Time' view has been built as requested.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default MatchDetails; 