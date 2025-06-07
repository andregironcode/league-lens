import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Home, Users, BarChart4, Trophy, Video, Clock } from 'lucide-react';
import Header from '@/components/Header';
import MatchTimeline from '@/components/match-details/MatchTimeline';
import { getMatchById, serviceAdapter } from '@/services/serviceAdapter';
import { EnhancedMatchHighlight } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { formatSeason } from '../utils/seasonFormatting';

const FullTimeSummary: React.FC = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<EnhancedMatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const { toast } = useToast();

  const formatMatchDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${match?.homeTeam.name} vs ${match?.awayTeam.name}`,
        text: `Check out this match result: ${match?.score?.home || 0} - ${match?.score?.away || 0}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Match link has been copied to clipboard",
        });
      }
  } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGoBack = () => navigate(-1);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) {
        setError("Match ID is missing.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[FullTimeSummary] Fetching match data for ID: ${matchId}`);
        const matchData = await getMatchById(matchId);
        console.log(`[FullTimeSummary] Received match data:`, matchData);
        
        if (!matchData) {
          setError("Match not found");
          return;
        }
        
        setMatch(matchData);

        // Fetch standings if competition ID is available
        if (matchData.competition?.id) {
          try {
            setStandingsLoading(true);
            
            const matchDate = new Date(matchData.date);
            const matchYear = matchDate.getFullYear();
            const matchMonth = matchDate.getMonth() + 1;
            const seasonYear = matchMonth <= 5 ? matchYear - 1 : matchYear;
            const apiSeason = seasonYear.toString();

            console.log(`[FullTimeSummary] Fetching standings for league ${matchData.competition.id}, season ${apiSeason}`);
            const standingsResponse = await serviceAdapter.getStandingsForLeague(
              matchData.competition.id, 
              apiSeason
            );
            
            if (standingsResponse?.groups?.[0]?.standings) {
              setStandings(standingsResponse.groups[0].standings);
            }
          } catch (standingsError) {
            console.error("Failed to fetch standings:", standingsError);
          } finally {
            setStandingsLoading(false);
          }
        }
        
      } catch (err: any) {
        console.error('Error fetching match data:', err);
        setError(err.message || 'Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  const isValidVideoUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
    } catch {
      return false;
    }
  };

  const getVideoEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg font-medium">Loading Match Summary...</div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg font-medium mb-4">
            {error || 'Match not found'}
          </div>
          <button 
            onClick={handleGoBack} 
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const matchDate = new Date(match.date);
  const matchYear = matchDate.getFullYear();
  const matchMonth = matchDate.getMonth() + 1;
  const seasonYear = matchMonth <= 5 ? matchYear - 1 : matchYear;
  const matchSeason = seasonYear.toString();
  const formattedSeason = formatSeason(seasonYear);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Back Home Button */}
        <div className="flex justify-start">
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-white px-4 py-2 rounded-lg transition-colors border border-gray-600/50 hover:border-gray-500"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Matches</span>
          </button>
        </div>

        {/* Main Match Summary */}
        <div 
          className="rounded-3xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
            border: '1px solid #1B1B1B'
          }}
        >
          {/* Competition Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={match.competition.logo} 
                alt={match.competition.name} 
                className="w-8 h-8 object-contain rounded-md bg-white p-1" 
              />
              <div>
                <div className="text-white font-medium">{match.competition.name}</div>
                <div className="text-gray-400 text-sm">{formatMatchDate(match.date)}</div>
              </div>
            </div>
            <button 
              onClick={handleShare}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Teams and Score */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div className="flex flex-col items-center">
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name}
                    className="w-20 h-20 object-contain mb-3"
                />
                <div className="text-white font-medium text-lg">{match.homeTeam.name}</div>
                </div>
              </div>

              {/* Score and Status */}
              <div className="px-8 text-center">
                <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  FULL TIME
                </div>
                <div className="text-white text-6xl font-bold mb-2">
                  {match.score?.home ?? 0} - {match.score?.away ?? 0}
                </div>
                <div className="text-gray-400 text-sm">FINAL SCORE</div>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <div className="flex flex-col items-center">
                <img 
                  src={match.awayTeam.logo} 
                  alt={match.awayTeam.name}
                    className="w-20 h-20 object-contain mb-3"
                />
                <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
              </div>
            </div>
              </div>
              
            {/* Match Timeline/Events */}
            <MatchTimeline homeTeam={match.homeTeam} awayTeam={match.awayTeam} matchEvents={match.events || []} />
                    </div>
                    </div>

        {/* TAB NAVIGATION */}
        <div className="rounded-3xl p-2 flex justify-around sm:justify-center space-x-1 sm:space-x-2" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
          {[
            { key: 'home', label: 'Home', icon: Home },
            { key: 'lineups', label: 'Lineups', icon: Users },
            { key: 'stats', label: 'Stats', icon: BarChart4 },
            { key: 'standings', label: 'Standings', icon: Trophy },
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
          {activeTab === 'home' && (
            <div className="space-y-6">
          {/* Video Highlights */}
          <div 
                className="rounded-3xl p-6 overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
          <h4 className="text-lg font-semibold mb-4 text-center text-white">MATCH HIGHLIGHTS</h4>
          
            {match.videoUrl && isValidVideoUrl(match.videoUrl) ? (
                  <div className="aspect-video rounded-xl overflow-hidden" style={{ backgroundColor: '#191919' }}>
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
                        <div className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: '#191919' }}>
                          <Video className="text-4xl text-gray-500" size={32} />
                    </div>
                  </div>
                  <p className="text-white font-medium text-base mb-3">Video Highlights Not Available</p>
                  <p className="text-sm mb-4 max-w-md mx-auto">
                    Video highlights are not included in the current API response for this match. 
                      </p>
                </div>
              </div>
            )}
          </div>

              {/* Match Information */}
              <div 
                className="rounded-3xl p-6 overflow-hidden"
            style={{
              background: '#000000',
              border: '1px solid #1B1B1B'
            }}
          >
            <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH INFORMATION</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#191919' }}>
                  <h5 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-yellow-400" />
                      Match Details
                  </h5>
                  <div className="space-y-2">
                      <div className="text-white font-medium">Status: Full Time</div>
                      <div className="text-gray-400 text-sm">
                        Date: {new Date(match.date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Time: {new Date(match.date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          hour12: false 
                        })}
                      </div>
                  </div>
                </div>

                  <div className="rounded-xl p-4" style={{ backgroundColor: '#191919' }}>
                  <h5 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-400" />
                      Competition
                  </h5>
                  <div className="space-y-2">
                      <div className="text-white font-medium">{match.competition.name}</div>
                      <div className="text-gray-400 text-sm">Season: {formattedSeason}</div>
                      </div>
                  </div>
                </div>
            </div>
          </div>
        )}

          {activeTab === 'lineups' && (
            <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
              <h4 className="text-lg font-semibold mb-6 text-center text-white">TEAM LINEUPS</h4>
              <div className="text-center py-8 text-gray-400">
                <p>Team lineups will be displayed here once implemented.</p>
            </div>
          </div>
          )}

          {activeTab === 'stats' && (
            <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
              <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
              <div className="text-center py-8 text-gray-400">
                <p>Match statistics will be displayed here once implemented.</p>
                              </div>
                              </div>
          )}

          {activeTab === 'standings' && (
            <div className="space-y-8">
              <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                <h4 className="text-lg font-semibold mb-6 text-center text-white">LEAGUE STANDINGS</h4>
                {standingsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                              </div>
                ) : standings.length > 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>Standings data received: {standings.length} teams</p>
                        </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Trophy size={32} className="mx-auto mb-2" />
                    <p>League standings are not available for this match.</p>
                        </div>
                )}
                    </div>
        </div>
      )}
          </div>
        </div>
    </div>
  );
};

export default FullTimeSummary; 