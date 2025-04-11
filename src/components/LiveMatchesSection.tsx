
import { useState, useEffect } from 'react';
import { fetchMatches, fetchHighlights } from '@/services/highlightService';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import MatchCard from './MatchCard';
import VideoPlayerDialog from './VideoPlayerDialog';

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
  embedUrl?: string;
}

interface Props {
  filteredData?: any[] | null;
  showVerifiedOnly?: boolean;
}

const LiveMatchesSection = ({ filteredData, showVerifiedOnly = false }: Props) => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to fetch live matches
  const fetchLiveMatches = async () => {
    try {
      // If we have filtered data, use that instead of fetching
      const allMatches = filteredData || await fetchMatches();
      
      // Filter for live matches only
      const livesOnly = allMatches.filter((match: any) => 
        match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === 'HT'
      );
      
      // Apply verification filter if needed
      const verifiedMatches = showVerifiedOnly 
        ? livesOnly.filter((match: any) => match.verified === true)
        : livesOnly;
      
      // Check for highlights
      const matchesWithHighlightsInfo = await Promise.all(
        verifiedMatches.map(async (match: any) => {
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
      
      setLiveMatches(matchesWithHighlightsInfo);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      toast.error('Failed to update live matches');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch matches on initial load and when filters change
  useEffect(() => {
    fetchLiveMatches();
  }, [filteredData, showVerifiedOnly]);

  // Set up auto-refresh interval
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchLiveMatches();
    }, Math.floor(Math.random() * 60000) + 60000); // Refresh between 60-120 seconds

    return () => clearInterval(refreshInterval);
  }, [filteredData, showVerifiedOnly]);

  const handleHighlightClick = async (match: LiveMatch) => {
    try {
      // Fetch highlight data and show in dialog
      const highlightData = await fetchHighlights(match.id);
      setSelectedMatch({ ...match, videos: highlightData });
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
      toast.error('Failed to load match highlights');
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
          <MatchCard 
            key={match.id}
            match={match}
            onHighlightClick={handleHighlightClick}
            matchType="live"
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

export default LiveMatchesSection;
