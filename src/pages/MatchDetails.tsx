
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarIcon, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header';
import VideoPlayerDialog from '@/components/VideoPlayerDialog';
import { getMatchById, getHighlightById, getMatchStats } from '@/services/highlightlyService';

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [highlight, setHighlight] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch both match details and highlight
        const [matchData, highlightData, statsData] = await Promise.allSettled([
          getMatchById(id),
          getHighlightById(id),
          getMatchStats(id)
        ]);
        
        if (matchData.status === 'fulfilled' && matchData.value) {
          setMatch(matchData.value);
        }
        
        if (highlightData.status === 'fulfilled' && highlightData.value) {
          setHighlight(highlightData.value);
        }
        
        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value);
        }
        
        // If we couldn't get either match or highlight data
        if (
          (matchData.status === 'rejected' || !matchData.value) && 
          (highlightData.status === 'rejected' || !highlightData.value)
        ) {
          setError('Could not find match or highlight data');
        }
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-highlight-800 rounded w-64"></div>
            <div className="h-64 bg-highlight-800 rounded"></div>
            <div className="h-40 bg-highlight-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <Link to="/" className="flex items-center text-highlight-300 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Error</h2>
            <p className="mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-700 hover:bg-red-600 px-6 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const matchData = match || highlight;
  if (!matchData) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <Link to="/" className="flex items-center text-highlight-300 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Match Not Found</h2>
            <p className="mb-6">We couldn't find the match you're looking for.</p>
            <Link to="/" className="bg-highlight-600 hover:bg-highlight-500 px-6 py-2 rounded-md inline-block">
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <Link to="/" className="flex items-center text-highlight-300 hover:text-white mb-6 transition">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        
        {/* Match Header */}
        <div className="bg-gradient-to-b from-highlight-900/60 to-highlight-900/10 rounded-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center mb-6 md:mb-0">
              <div className="text-center md:text-left md:mr-6 mb-4 md:mb-0">
                <img 
                  src={matchData.homeTeam?.logo || 'https://www.sofascore.com/static/images/placeholders/team.svg'} 
                  alt={matchData.homeTeam?.name} 
                  className="h-16 md:h-20 mx-auto md:mx-0 mb-2"
                />
                <h3 className="text-lg md:text-xl font-semibold">{matchData.homeTeam?.name}</h3>
              </div>
              
              <div className="flex flex-col items-center mx-4 md:mx-8">
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {matchData.score?.fullTime?.home || matchData.homeGoals || '?'} - {matchData.score?.fullTime?.away || matchData.awayGoals || '?'}
                </div>
                <div className="text-sm text-gray-400 uppercase">
                  {matchData.status === 'FINISHED' ? 'Final Score' : matchData.status || 'Match'}
                </div>
              </div>
              
              <div className="text-center md:text-left md:ml-6">
                <img 
                  src={matchData.awayTeam?.logo || 'https://www.sofascore.com/static/images/placeholders/team.svg'} 
                  alt={matchData.awayTeam?.name} 
                  className="h-16 md:h-20 mx-auto md:mx-0 mb-2"
                />
                <h3 className="text-lg md:text-xl font-semibold">{matchData.awayTeam?.name}</h3>
              </div>
            </div>
            
            {highlight && (
              <button
                onClick={() => setVideoOpen(true)}
                className="bg-highlight-600 hover:bg-highlight-500 text-white rounded-md px-6 py-3 transition"
              >
                Watch Highlights
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8 text-sm text-gray-300">
            {matchData.date && (
              <div className="flex items-center">
                <CalendarIcon size={16} className="mr-2 text-gray-400" />
                {formatDate(matchData.date)}
              </div>
            )}
            
            {matchData.date && (
              <div className="flex items-center">
                <Clock size={16} className="mr-2 text-gray-400" />
                {formatTime(matchData.date)}
              </div>
            )}
            
            {matchData.venue && (
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-gray-400" />
                {matchData.venue.name || matchData.venue}
              </div>
            )}
            
            {matchData.competition && (
              <div className="flex items-center">
                <span className="inline-block h-4 w-4 mr-2">
                  <img 
                    src={matchData.competition.logo || '/placeholder.svg'} 
                    alt="" 
                    className="h-full w-full object-contain"
                  />
                </span>
                {matchData.competition.name}
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Section */}
        {stats && (
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Match Statistics</h2>
            
            <div className="space-y-4">
              {stats.statistics?.map((stat: any, index: number) => (
                <div key={index} className="grid grid-cols-3 items-center">
                  <div className="text-right">{stat.homeValue || 0}</div>
                  <div className="text-center text-gray-400 font-medium px-4">
                    {stat.type}
                    <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-highlight-500"
                        style={{ 
                          width: `${(Number(stat.homeValue) / (Number(stat.homeValue) + Number(stat.awayValue)) * 100) || 0}%`,
                          marginLeft: 'auto'
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-left">{stat.awayValue || 0}</div>
                </div>
              ))}
              
              {(!stats.statistics || stats.statistics.length === 0) && (
                <p className="text-center text-gray-400 py-4">No statistics available for this match</p>
              )}
            </div>
          </div>
        )}
        
        {/* Highlight Video Section */}
        {highlight && highlight.embedUrl && (
          <VideoPlayerDialog 
            open={videoOpen} 
            onOpenChange={setVideoOpen}
            videoUrl={highlight.embedUrl}
            title={`${matchData.homeTeam?.name || ''} vs ${matchData.awayTeam?.name || ''}`}
          />
        )}
      </div>
    </div>
  );
};

export default MatchDetails;
