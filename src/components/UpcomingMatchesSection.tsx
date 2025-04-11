
import { useState, useEffect } from 'react';
import { fetchMatches } from '@/services/highlightService';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface UpcomingMatch {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  kickoff: string;
  competition: {
    name: string;
    logo: string;
  };
}

const UpcomingMatchesSection = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      try {
        const allMatches = await fetchMatches();
        // Filter for upcoming matches only
        const upcoming = allMatches.filter((match: any) => 
          match.status === 'SCHEDULED' || 
          match.status === 'TIMED'
        );
        
        // Sort by kickoff time
        upcoming.sort((a: any, b: any) => 
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
        );
        
        setUpcomingMatches(upcoming.slice(0, 12)); // Take the next 12 matches
      } catch (error) {
        console.error('Failed to fetch upcoming matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingMatches();
  }, []);

  // Format kickoff time
  const formatKickoff = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch (e) {
      return '--:--';
    }
  };

  // Format kickoff date
  const formatKickoffDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM');
    } catch (e) {
      return '--';
    }
  };

  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Matches</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-highlight-800 animate-pulse rounded-lg h-28"></div>
          ))}
        </div>
      </div>
    );
  }

  if (upcomingMatches.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Matches</h2>
        <div className="bg-highlight-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">No upcoming matches scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Matches</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingMatches.map((match) => (
          <div key={match.id} className="bg-highlight-800 rounded-lg p-4 hover:bg-highlight-700 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">{match.competition?.name}</span>
              <div className="flex items-center text-xs text-gray-400">
                <Calendar size={12} className="mr-1" />
                <span>{formatKickoffDate(match.kickoff)}</span>
              </div>
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
              
              <div className="flex items-center bg-black bg-opacity-30 px-3 py-1 rounded">
                <Clock size={12} className="text-[#FFC30B] mr-1" />
                <span className="text-white text-sm font-medium">{formatKickoff(match.kickoff)}</span>
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

export default UpcomingMatchesSection;
