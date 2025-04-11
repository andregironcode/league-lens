import { useState, useEffect } from 'react';
import { fetchMatches } from '@/services/highlightService';
import { Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LiveMatch {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  score: {
    home: number;
    away: number;
  };
  time: string;
  status: string;
  competition: {
    name: string;
    logo: string;
  };
}

const LiveMatchesSection = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch live matches
  const fetchLiveMatches = async () => {
    try {
      const allMatches = await fetchMatches();
      // Filter for live matches only
      const livesOnly = allMatches.filter((match: any) => 
        match.status === 'LIVE' || match.status === 'IN_PLAY'
      );
      
      setLiveMatches(livesOnly);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      toast.error('Failed to update live matches');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch matches on initial load
  useEffect(() => {
    fetchLiveMatches();
  }, []);

  // Set up auto-refresh interval (every 60-120 seconds)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchLiveMatches();
    }, 90000); // 90 seconds is in the middle of the 60-120 range

    return () => clearInterval(refreshInterval);
  }, []);

  // Format match time for display
  const formatMatchTime = (time: string) => {
    if (!time) return '';
    
    // If it's a minute number (e.g., '45', '90')
    if (/^\d+$/.test(time)) {
      return `${time}'`;
    }
    
    // Otherwise return as is
    return time;
  };

  // Get appropriate status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'IN_PLAY':
        return 'LIVE';
      case 'HT':
        return 'HT';
      case 'FT':
        return 'FT';
      case 'SUSPENDED':
        return 'SUSPENDED';
      case 'POSTPONED':
        return 'POSTPONED';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Live Matches</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-highlight-800 animate-pulse rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Live Matches</h2>
        <div className="bg-highlight-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">No live matches at the moment</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for live updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          Live Matches
        </h2>
        {lastUpdated && (
          <div className="text-xs text-gray-400 flex items-center">
            <Clock size={12} className="mr-1" />
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveMatches.map((match) => (
          <div key={match.id} className="bg-highlight-800 rounded-lg p-4 hover:bg-highlight-700 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                {getStatusDisplay(match.status)}
              </span>
              <span className="text-xs text-gray-400">{match.competition?.name}</span>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center w-[40%]">
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name}
                  className="w-8 h-8 object-contain mr-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
                <span className="text-white text-sm truncate">{match.homeTeam.name}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center bg-black bg-opacity-50 px-3 py-1 rounded">
                  <span className="text-white font-bold mx-1 text-lg">{match.score.home}</span>
                  <span className="text-gray-400 mx-1">-</span>
                  <span className="text-white font-bold mx-1 text-lg">{match.score.away}</span>
                </div>
                <span className="text-[#FFC30B] text-xs mt-1 font-medium">{formatMatchTime(match.time)}</span>
              </div>
              
              <div className="flex items-center justify-end w-[40%]">
                <span className="text-white text-sm truncate text-right">{match.awayTeam.name}</span>
                <img 
                  src={match.awayTeam.logo} 
                  alt={match.awayTeam.name}
                  className="w-8 h-8 object-contain ml-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveMatchesSection;
