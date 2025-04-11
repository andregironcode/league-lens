
import { useState, useEffect } from 'react';
import { fetchMatches } from '@/services/highlightService';
import { fetchHighlights } from '@/services/highlightService';
import { Calendar, Video } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import VideoPlayerDialog from '@/components/VideoPlayerDialog';

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
}

const FinishedMatchesSection = () => {
  const [finishedMatches, setFinishedMatches] = useState<FinishedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentMatches = async () => {
      try {
        const allMatches = await fetchMatches();
        // Filter for finished matches only
        const finished = allMatches.filter((match: any) => 
          match.status === 'FINISHED' || 
          match.status === 'FT'
        );
        
        // Sort by date, most recent first
        finished.sort((a: any, b: any) => 
          new Date(b.date || b.kickoff).getTime() - new Date(a.date || a.kickoff).getTime()
        );
        
        // Check which matches have highlights available
        const finishedWithHighlights = await Promise.all(
          finished.slice(0, 20).map(async (match: any) => {
            try {
              const highlights = await fetchHighlights(match.id);
              return {
                ...match,
                hasHighlights: highlights && highlights.length > 0
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

    fetchRecentMatches();
  }, []);

  const formatMatchDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM');
    } catch (e) {
      return '-';
    }
  };

  const handleMatchClick = async (match: FinishedMatch) => {
    if (match.hasHighlights) {
      try {
        // Fetch highlight data and show in dialog
        const highlightData = await fetchHighlights(match.id);
        setSelectedMatch({ ...match, videos: highlightData });
        setIsDialogOpen(true);
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
        // Navigate to match details as fallback
        navigate(`/match/${match.id}`);
      }
    } else {
      // Navigate to match details page
      navigate(`/match/${match.id}`);
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
          <div 
            key={match.id} 
            className="bg-highlight-800 rounded-lg p-4 hover:bg-highlight-700 transition-colors cursor-pointer"
            onClick={() => handleMatchClick(match)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center text-xs text-gray-400">
                <Calendar size={12} className="mr-1" />
                <span>{formatMatchDate(match.date)}</span>
              </div>
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
                <span className="text-xs text-gray-400 mt-1 font-medium">FT</span>
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
            
            {match.hasHighlights && (
              <div className="mt-2 flex justify-center">
                <div className="flex items-center text-xs text-[#FFC30B] bg-[#FFC30B] bg-opacity-10 px-2 py-1 rounded">
                  <Video size={12} className="mr-1" />
                  <span>Highlights Available</span>
                </div>
              </div>
            )}
          </div>
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
