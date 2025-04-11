
import { useState, useEffect } from 'react';
import { fetchMatches } from '@/services/highlightService';
import MatchCard from './MatchCard';

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
  status: string;
}

interface Props {
  filteredData?: any[] | null;
  showVerifiedOnly?: boolean;
}

const UpcomingMatchesSection = ({ filteredData, showVerifiedOnly = false }: Props) => {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      try {
        // If we have filtered data, use that instead of fetching
        const allMatches = filteredData || await fetchMatches();
        
        // Filter for upcoming matches only
        const upcoming = allMatches.filter((match: any) => 
          match.status === 'SCHEDULED' || 
          match.status === 'TIMED'
        );
        
        // Apply verification filter if needed
        const verifiedMatches = showVerifiedOnly 
          ? upcoming.filter((match: any) => match.verified === true)
          : upcoming;
        
        // Sort by kickoff time
        verifiedMatches.sort((a: any, b: any) => 
          new Date(a.kickoff || a.date).getTime() - new Date(b.kickoff || b.date).getTime()
        );
        
        setUpcomingMatches(verifiedMatches.slice(0, 12)); // Take the next 12 matches
      } catch (error) {
        console.error('Failed to fetch upcoming matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingMatches();
    
    // Set up auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchUpcomingMatches();
    }, Math.floor(Math.random() * 60000) + 60000); // Refresh between 60-120 seconds
    
    return () => clearInterval(refreshInterval);
  }, [filteredData, showVerifiedOnly]);

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
          <MatchCard 
            key={match.id}
            match={match}
            matchType="upcoming"
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingMatchesSection;
