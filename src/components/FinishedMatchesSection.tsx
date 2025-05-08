
import { useState, useEffect } from 'react';
import { fetchMatches, fetchHighlights } from '@/services/highlightService';
import VideoPlayerDialog from '@/components/VideoPlayerDialog';
import MatchCard from './MatchCard';

interface FinishedMatch {
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
  status: string;
  date: string;
  competition: {
    name: string;
    logo: string;
  };
  hasHighlights?: boolean;
  embedUrl?: string;
}

interface Props {
  filteredData?: any[] | null;
  showVerifiedOnly?: boolean;
}

const FinishedMatchesSection = ({ filteredData, showVerifiedOnly = false }: Props) => {
  const [finishedMatches, setFinishedMatches] = useState<FinishedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRecentMatches = async () => {
    try {
      // If we have filtered data, use that instead of fetching
      const allMatches = filteredData || await fetchMatches();
      
      // Filter for finished matches only
      const finished = allMatches.filter((match: any) => 
        match.status === 'FINISHED' || 
        match.status === 'FT'
      );
      
      // Apply verification filter if needed
      const verifiedMatches = showVerifiedOnly 
        ? finished.filter((match: any) => match.verified === true)
        : finished;
      
      // Sort by date, most recent first
      verifiedMatches.sort((a: any, b: any) => 
        new Date(b.date || b.kickoff).getTime() - new Date(a.date || a.kickoff).getTime()
      );
      
      // Check which matches have highlights available
      const finishedWithHighlights = await Promise.all(
        verifiedMatches.slice(0, 20).map(async (match: any) => {
          try {
            const highlights = await fetchHighlights(match.id);
            const embedUrl = highlights && highlights.length > 0 && highlights[0].embedUrl ? 
              highlights[0].embedUrl : undefined;
              
            return {
              ...match,
              hasHighlights: highlights && highlights.length > 0,
              embedUrl
            };
          } catch (error) {
            return {
              ...match,
              hasHighlights: false
            };
          }
        })
      );
      
      setFinishedMatches(finishedWithHighlights.slice(0, 12));
    } catch (error) {
      console.error('Failed to fetch finished matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentMatches();
    
    // Set up auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchRecentMatches();
    }, Math.floor(Math.random() * 60000) + 60000); // Refresh between 60-120 seconds
    
    return () => clearInterval(refreshInterval);
  }, [filteredData, showVerifiedOnly]);

  const handleHighlightClick = async (match: FinishedMatch) => {
    try {
      // Fetch highlight data and show in dialog
      const highlightData = await fetchHighlights(match.id);
      setSelectedMatch({ ...match, videos: highlightData });
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Recent Results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-highlight-800 animate-pulse rounded-lg h-28"></div>
          ))}
        </div>
      </div>
    );
  }

  if (finishedMatches.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Recent Results</h2>
        <div className="bg-highlight-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">No recent match results available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Recent Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {finishedMatches.map((match) => (
          <MatchCard 
            key={match.id}
            match={match}
            onHighlightClick={handleHighlightClick}
            matchType="finished"
          />
        ))}
      </div>

      {selectedMatch && (
        <VideoPlayerDialog
          match={selectedMatch}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          matchId={selectedMatch.id}
        />
      )}
    </div>
  );
};

export default FinishedMatchesSection;
