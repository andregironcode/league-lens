
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueHighlights, fetchPremierLeagueFromScoreBat } from '@/services/highlightService';
import { League, MatchHighlight, ScoreBatMatch } from '@/types';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import { ArrowLeft, PlayCircle, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

// Helper function to get country flag based on league ID - same as in LeagueSection
const getCountryFlag = (leagueId: string): string => {
  const flagMap: Record<string, string> = {
    'pl': 'https://flagcdn.com/w40/gb-eng.png', // English flag
    'laliga': 'https://flagcdn.com/w40/es.png', // Spanish flag
    'bundesliga': 'https://flagcdn.com/w40/de.png', // German flag
    'seriea': 'https://flagcdn.com/w40/it.png', // Italian flag
    'ligue1': 'https://flagcdn.com/w40/fr.png', // French flag
    'eredivisie': 'https://flagcdn.com/w40/nl.png', // Dutch flag
    'portugal': 'https://flagcdn.com/w40/pt.png', // Portuguese flag
    'brazil': 'https://flagcdn.com/w40/br.png', // Brazilian flag
    'argentina': 'https://flagcdn.com/w40/ar.png', // Argentine flag
  };
  
  return flagMap[leagueId] || 'https://www.sofascore.com/static/images/placeholders/tournament.svg';
};

const LeaguePage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreBatMatches, setScoreBatMatches] = useState<ScoreBatMatch[]>([]);
  const [scoreBatLoading, setScoreBatLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        // Get all leagues
        const leaguesData = await getLeagueHighlights();
        // Find the specific league by ID
        const leagueData = leaguesData.find(l => l.id === leagueId);
        
        if (leagueData) {
          setLeague(leagueData);
        }
        setLoading(false);
        
        // Automatically fetch ScoreBat data for Premier League
        if (leagueId === 'pl') {
          fetchScoreBatMatches();
        }
      } catch (error) {
        console.error('Error fetching league data:', error);
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

  const fetchScoreBatMatches = async () => {
    if (leagueId !== 'pl') {
      toast({
        title: "API Limited",
        description: "ScoreBat API integration is only available for Premier League",
        variant: "destructive"
      });
      return;
    }

    setScoreBatLoading(true);
    try {
      const data = await fetchPremierLeagueFromScoreBat();
      if (data && data.response) {
        setScoreBatMatches(data.response);
        toast({
          title: "Live Matches Loaded",
          description: `Loaded ${data.response.length} matches from ScoreBat API`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching ScoreBat matches:', error);
      toast({
        title: "API Error",
        description: "Failed to load matches from ScoreBat API",
        variant: "destructive"
      });
    } finally {
      setScoreBatLoading(false);
    }
  };

  // Parse team names from match title (e.g., "Manchester United - Liverpool")
  const parseTeamNames = (title: string): { home: string; away: string } => {
    const parts = title.split(' - ');
    return {
      home: parts[0] || '',
      away: parts[1] || ''
    };
  };

  // Format date for display
  const formatMatchDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy • HH:mm');
    } catch (error) {
      return dateString;
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
              
              {/* ScoreBat API Matches Section */}
              {leagueId === 'pl' && (
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Live Matches</h2>
                    <Button 
                      variant="outline" 
                      onClick={fetchScoreBatMatches}
                      disabled={scoreBatLoading}
                      size="sm"
                    >
                      {scoreBatLoading ? 'Refreshing...' : 'Refresh Matches'}
                    </Button>
                  </div>
                  
                  {scoreBatLoading && scoreBatMatches.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-video bg-highlight-800 rounded-lg mb-2"></div>
                          <div className="h-5 bg-highlight-800 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-highlight-800 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : scoreBatMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {scoreBatMatches.map((match, index) => {
                        const teams = parseTeamNames(match.title);
                        return (
                          <div key={index} className="bg-highlight-800 rounded-lg overflow-hidden hover:bg-highlight-700 transition-colors">
                            <div className="relative">
                              <img 
                                src={match.thumbnail} 
                                alt={match.title}
                                className="w-full aspect-video object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://www.sofascore.com/static/images/placeholders/tournament.svg";
                                }}
                              />
                              <a 
                                href={match.matchviewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all"
                              >
                                <PlayCircle className="w-16 h-16 text-[#FFC30B]" />
                              </a>
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white">{teams.home}</h3>
                                <span className="text-sm text-white">vs</span>
                                <h3 className="font-bold text-white text-right">{teams.away}</h3>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center">
                                  <Calendar size={12} className="mr-1" />
                                  <span>{formatMatchDate(match.date)}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="mr-1">Watch</span>
                                  <ExternalLink size={12} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-highlight-800 p-6 rounded-lg text-center">
                      <p className="text-gray-400">No live matches available right now. Check back later or refresh.</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-300">Highlights</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {league.highlights.map((highlight: MatchHighlight) => (
                    <div key={highlight.id} className="transform transition-all duration-300 hover:scale-105">
                      <HighlightCard highlight={highlight} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">League not found</h2>
              <p className="text-gray-400 mb-6">The league you're looking for doesn't exist or is not available.</p>
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
