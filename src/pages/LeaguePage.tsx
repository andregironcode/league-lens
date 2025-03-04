
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueHighlights } from '@/services/highlightService';
import { League, MatchHighlight } from '@/types';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      } catch (error) {
        console.error('Error fetching league data:', error);
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

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
