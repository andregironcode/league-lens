
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import { Toaster } from '@/components/ui/sonner';
import { getCompetitionHighlightsWithFallback } from '@/services/fallbackService';
import { MatchHighlight } from '@/types';
import { AlertCircle, ChevronLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper function to format competition name
const formatCompetitionName = (id: string): string => {
  const competitionNames: Record<string, string> = {
    'england-premier-league': 'Premier League',
    'spain-la-liga': 'La Liga',
    'germany-bundesliga': 'Bundesliga',
    'italy-serie-a': 'Serie A',
    'france-ligue-1': 'Ligue 1',
    'netherlands-eredivisie': 'Eredivisie',
    'portugal-liga-portugal': 'Liga Portugal',
    'champions-league': 'Champions League',
    'europa-league': 'Europa League',
  };
  
  // If we have a predefined name, use it; otherwise format the ID
  return competitionNames[id] || id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to get country flag based on competition ID
const getCompetitionFlag = (competitionId: string): string => {
  const flagMap: Record<string, string> = {
    'england-premier-league': 'https://flagcdn.com/w40/gb-eng.png',
    'spain-la-liga': 'https://flagcdn.com/w40/es.png',
    'germany-bundesliga': 'https://flagcdn.com/w40/de.png',
    'italy-serie-a': 'https://flagcdn.com/w40/it.png',
    'france-ligue-1': 'https://flagcdn.com/w40/fr.png',
    'netherlands-eredivisie': 'https://flagcdn.com/w40/nl.png',
    'portugal-liga-portugal': 'https://flagcdn.com/w40/pt.png',
    'champions-league': 'https://flagcdn.com/w40/eu.png',
    'europa-league': 'https://flagcdn.com/w40/eu.png',
  };
  
  return flagMap[competitionId] || 'https://www.sofascore.com/static/images/placeholders/tournament.svg';
};

const CompetitionPage = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const [highlights, setHighlights] = useState<MatchHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!competitionId) {
      setError('Competition ID is missing');
      setLoading(false);
      return;
    }

    try {
      setIsRefreshing(true);
      
      console.log(`Fetching highlights for competition: ${competitionId}...`);
      const highlightsData = await getCompetitionHighlightsWithFallback(competitionId);
      console.log(`Received competition highlights: ${highlightsData.length}`);
      
      setHighlights(highlightsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching competition highlights:', error);
      setError('Failed to load highlights. Please refresh the page.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [competitionId]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // Formatted competition name for display
  const formattedName = competitionId ? formatCompetitionName(competitionId) : '';

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      <Toaster position="top-center" />
      
      <main className="pt-16 pb-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Link to="/" className="text-gray-400 hover:text-white mr-4">
                <ChevronLeft size={20} />
              </Link>
              
              {competitionId && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                    <img 
                      src={getCompetitionFlag(competitionId)}
                      alt={formattedName}
                      className="w-8 h-8 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.sofascore.com/static/images/placeholders/tournament.svg";
                      }}
                    />
                  </div>
                  <h1 className="text-2xl font-bold">{formattedName}</h1>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="text-white bg-highlight-800 hover:bg-highlight-700"
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-highlight-800 rounded-lg aspect-video"></div>
                  <div className="h-4 bg-highlight-700 rounded mt-2 w-3/4"></div>
                  <div className="h-3 bg-highlight-700 rounded mt-2 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="w-full py-20 flex flex-col items-center justify-center">
              <AlertCircle size={32} className="text-red-500 mb-4" />
              <p className="text-white text-xl mb-2">Error Loading Highlights</p>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button onClick={handleRefresh} variant="default">
                <RefreshCw size={16} className="mr-2" /> Try Again
              </Button>
            </div>
          ) : highlights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map(highlight => (
                <div key={highlight.id}>
                  <HighlightCard highlight={highlight} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-400">No highlights available for this competition.</p>
              <p className="text-sm text-gray-500 mt-2">Try refreshing the page or check back later.</p>
              <Button onClick={handleRefresh} variant="outline" className="mt-4">
                <RefreshCw size={16} className="mr-2" /> Refresh
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#222222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Score90. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All videos are sourced from official channels and we do not host any content.
              Highlights powered by Scorebat API (Developer - Hobby Plan).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompetitionPage;
