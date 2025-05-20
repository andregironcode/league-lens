
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueHighlights } from '@/services/highlightService';
import { League, MatchHighlight, HighlightlyHighlight } from '@/types';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import HighlightlyMatchCard from '@/components/HighlightlyMatchCard';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getMatches } from '@/services/highlightlyService';
import { Skeleton } from '@/components/ui/skeleton';

const getCountryFlag = (leagueId: string): string => {
  const flagMap: Record<string, string> = {
    'pl': 'https://flagcdn.com/w40/gb-eng.png',
    'laliga': 'https://flagcdn.com/w40/es.png',
    'bundesliga': 'https://flagcdn.com/w40/de.png',
    'seriea': 'https://flagcdn.com/w40/it.png',
    'ligue1': 'https://flagcdn.com/w40/fr.png',
    'eredivisie': 'https://flagcdn.com/w40/nl.png',
    'portugal': 'https://flagcdn.com/w40/pt.png',
    'brazil': 'https://flagcdn.com/w40/br.png',
    'argentina': 'https://flagcdn.com/w40/ar.png',
  };
  
  return flagMap[leagueId] || 'https://www.sofascore.com/static/images/placeholders/tournament.svg';
};

const LeaguePage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightlyMatches, setHighlightlyMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeagueData = async () => {
      setFetchError(null);
      try {
        console.log(`🔍 Fetching league data for leagueId: ${leagueId}`);
        const leaguesData = await getLeagueHighlights();
        console.log(`✅ Fetched ${leaguesData.length} leagues`);
        
        const leagueData = leaguesData.find(l => l.id === leagueId);
        
        if (leagueData) {
          console.log(`✅ Found league: ${leagueData.name} with ${leagueData.highlights.length} highlights`);
          setLeague(leagueData);
        } else {
          console.log(`❌ League with ID ${leagueId} not found`);
          setFetchError(`League with ID ${leagueId} not found`);
        }
        
        setLoading(false);
        
        // Only fetch matches when the page loads
        if (leagueId) {
          fetchHighlightlyMatches();
        }
      } catch (error) {
        console.error('❌ Error fetching league data:', error);
        setFetchError('Failed to load league data from API');
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

  const fetchHighlightlyMatches = async () => {
    setMatchesLoading(true);
    try {
      // Get today's matches for the selected league
      const today = new Date().toISOString().split('T')[0];
      console.log(`🔍 Fetching matches for date: ${today} and leagueId: ${leagueId}`);
      
      const data = await getMatches(today, leagueId);
      console.log(`✅ Fetched ${data.length} matches for ${leagueId} on ${today}`, data);
      
      if (data && Array.isArray(data)) {
        setHighlightlyMatches(data);
        
        if (data.length === 0) {
          toast({
            title: "No Matches Found",
            description: `No matches found for ${leagueId} on ${today}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Live Matches Loaded",
            description: `Loaded ${data.length} matches from Highlightly API`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching Highlightly matches:', error);
      toast({
        title: "API Error",
        description: "Failed to load matches from Highlightly API. See console for details.",
        variant: "destructive"
      });
    } finally {
      setMatchesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      
      <main className="pt-20 pb-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="text-gray-400 hover:text-white pl-0">
                <ArrowLeft size={18} />
                <span className="ml-1">Back</span>
              </Button>
            </Link>
          </div>

          {fetchError && (
            <div className="bg-red-900/40 border border-red-800 rounded-lg p-4 mb-8">
              <div className="flex items-center mb-2">
                <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
                <h3 className="font-medium">API Error</h3>
              </div>
              <p className="text-sm text-gray-300">{fetchError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-highlight-800 rounded w-3/4 max-w-md"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-video bg-highlight-800 rounded"></div>
                ))}
              </div>
            </div>
          ) : league ? (
            <>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    src={getCountryFlag(league.id)}
                    alt={league.name}
                    className="w-12 h-12 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://www.sofascore.com/static/images/placeholders/tournament.svg";
                    }}
                  />
                </div>
                <h1 className="text-3xl font-bold">{league.name}</h1>
              </div>
              
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Live Matches</h2>
                  <Button 
                    variant="outline" 
                    onClick={fetchHighlightlyMatches}
                    disabled={matchesLoading}
                    size="sm"
                  >
                    {matchesLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Matches
                      </>
                    )}
                  </Button>
                </div>
                
                {matchesLoading && highlightlyMatches.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-40 rounded-lg" />
                    ))}
                  </div>
                ) : highlightlyMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {highlightlyMatches.map((match, index) => (
                      <div key={index} className="transform transition-all duration-300 hover:scale-105">
                        <HighlightlyMatchCard highlight={{
                          id: match.id,
                          title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                          date: match.date,
                          thumbnailUrl: '', 
                          embedUrl: '', 
                          homeTeam: match.homeTeam,
                          awayTeam: match.awayTeam,
                          homeGoals: match.score.fullTime.home,
                          awayGoals: match.score.fullTime.away,
                          competition: match.competition
                        }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-highlight-800 p-6 rounded-lg text-center">
                    <p className="text-gray-400 mb-3">No live matches available from Highlightly API right now.</p>
                    <Button 
                      variant="outline" 
                      onClick={fetchHighlightlyMatches}
                      size="sm"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-300">Highlights</h2>
                
                {league.highlights.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {league.highlights.map((highlight: MatchHighlight) => (
                      <div key={highlight.id} className="transform transition-all duration-300 hover:scale-105">
                        <HighlightCard highlight={highlight} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-highlight-800 p-6 rounded-lg text-center">
                    <p className="text-gray-400">No highlights available for this league from Highlightly API.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">League not found</h2>
              <p className="text-gray-400 mb-6">The league you're looking for doesn't exist or is not available in the Highlightly API.</p>
              <Link to="/">
                <Button>Return to Home</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaguePage;
