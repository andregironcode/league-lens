import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueHighlights, getActiveService } from '@/services/serviceAdapter';
import { League, MatchHighlight } from '@/types';
import Header from '@/components/Header';
import LeaguePage from '@/components/LeaguePage';
import { highlightlyClient } from '@/integrations/highlightly/client';

// League country mapping - same comprehensive mapping as other components
const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
  // UEFA Competitions
  '2486': 'EU', '2': 'EU', '3337': 'EU', '3': 'EU',
  
  // Major domestic leagues (1st tier)
  '39': 'GB', // Premier League
  '140': 'ES', // La Liga
  '135': 'IT', // Serie A
  '78': 'DE', // Bundesliga
  '61': 'FR', // Ligue 1
  '216087': 'US', '253': 'US', // MLS
  '94': 'PT', // Liga Portugal
  '307': 'SA', // Saudi Pro League
  '88': 'NL', // Eredivisie
  '71': 'BR', // Série A Brasil
  '128': 'AR', // Primera División Argentina
  '1': 'WORLD', // FIFA World Cup
  
  // Legacy mappings for older league IDs used in this component
  'pl': 'GB', // Premier League (legacy ID)
  'laliga': 'ES', // La Liga (legacy ID)
  'bundesliga': 'DE', // Bundesliga (legacy ID)
  'seriea': 'IT', // Serie A (legacy ID)
  'ligue1': 'FR', // Ligue 1 (legacy ID)
  'eredivisie': 'NL', // Eredivisie (legacy ID)
  'portugal': 'PT', // Liga Portugal (legacy ID)
  'brazil': 'BR', // Brazilian leagues (legacy ID)
  'argentina': 'AR', // Argentine leagues (legacy ID)
  
  // Second tier domestic leagues (2nd division)
  '40': 'GB', // Championship
  '141': 'ES', // Segunda División
  '136': 'IT', // Serie B
  '80': 'DE', // 2. Bundesliga
  '62': 'FR', // Ligue 2
  
  // Additional major leagues and smaller nations
  '106': 'TR', // Süper Lig (Turkey)
  '87': 'DK', // Danish Superliga
  '103': 'NO', // Eliteserien (Norway)
  '113': 'SE', // Allsvenskan (Sweden)
  '119': 'CH', // Swiss Super League
  '169': 'PL', // Ekstraklasa (Poland)
  '345': 'CZ', // Czech First League
  '318': 'GR', // Greek Super League
  '203': 'UA', // Ukrainian Premier League
  '235': 'RU', // Russian Premier League
  '286': 'JP', // J1 League (Japan)
  '292': 'KR', // K League 1 (South Korea)
  '271': 'AU', // A-League (Australia)
  '144': 'BE', // Jupiler Pro League (Belgium)
  
  // Caribbean and Central America
  '515': 'HT', // Ligue Haïtienne (Haiti)
  '516': 'JM', // Jamaica Premier League
  '517': 'TT', // TT Pro League (Trinidad and Tobago)
  '518': 'CR', // Liga FPD (Costa Rica)
  '519': 'GT', // Liga Nacional (Guatemala)
  '520': 'HN', // Liga Nacional (Honduras)
  '521': 'PA', // Liga Panameña de Fútbol
  '522': 'NI', // Primera División (Nicaragua)
  '523': 'SV', // Primera División (El Salvador)
  '524': 'BZ', // Premier League of Belize
  
  // Add more mappings as needed...
};

// Helper function to get country flag based on league ID using comprehensive mapping
const getCountryFlag = (leagueId: string): string => {
  console.log(`[DEBUG LeaguePage] getCountryFlag called with leagueId: "${leagueId}"`);
  
  const countryCode = LEAGUE_COUNTRY_MAPPING[leagueId];
  console.log(`[DEBUG LeaguePage] countryCode for "${leagueId}": ${countryCode}`);
  
  if (!countryCode) {
    console.log(`[DEBUG LeaguePage] No country mapping found for league ID: "${leagueId}", using default flag`);
    return '/icons/default-flag.svg';
  }
  
  const code = countryCode.toUpperCase();
  console.log(`[DEBUG LeaguePage] Uppercase country code: ${code}`);
  
  // Handle special cases
  if (code === 'EU') return 'https://flagcdn.com/w40/eu.png';
  if (code === 'WORLD') return 'https://flagcdn.com/w40/un.png';
  if (code === 'GB' || code === 'EN' || code === 'UK') return 'https://flagcdn.com/w40/gb.png';
  
  // Standard country codes
  const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  console.log(`[DEBUG LeaguePage] Final flag URL: ${flagUrl}`);
  return flagUrl;
};

const LeaguePage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!leagueId) {
          setError('No league ID provided');
          return;
        }

        console.log(`[LeaguePageRoute] Fetching details for league ${leagueId}`);

        // Try to get league details from the API
        try {
          const leagueDetails = await highlightlyClient.getLeagueById(leagueId);
          console.log('[LeaguePageRoute] League details from API:', leagueDetails);
          console.log('[LeaguePageRoute] League details type:', typeof leagueDetails);
          console.log('[LeaguePageRoute] League details is array:', Array.isArray(leagueDetails));
          if (Array.isArray(leagueDetails)) {
            console.log('[LeaguePageRoute] First item in array:', leagueDetails[0]);
          }
          
          if (leagueDetails) {
            // Handle both direct response and wrapped response
            let leagueData;
            if (Array.isArray(leagueDetails)) {
              // If it's an array, take the first item
              leagueData = leagueDetails[0];
            } else if (leagueDetails.data) {
              // If it's wrapped, extract the data
              if (Array.isArray(leagueDetails.data)) {
                leagueData = leagueDetails.data[0];
              } else {
                leagueData = leagueDetails.data;
              }
            } else {
              // Direct response
              leagueData = leagueDetails;
            }
            
            // Ensure we have the league ID
            if (leagueData && !leagueData.id) {
              leagueData.id = leagueId;
            }
            
            console.log('[LeaguePageRoute] Processed league data:', leagueData);
            setLeague(leagueData);
          } else {
            // Fallback: create league object from URL params
            setLeague({
              id: leagueId,
              name: `League ${leagueId}`,
              logo: null,
              country: null
            });
          }
        } catch (err) {
          console.log('[LeaguePageRoute] Could not fetch league details, using fallback');
          // Fallback: create league object from URL params
          setLeague({
            id: leagueId,
            name: `League ${leagueId}`,
            logo: null,
            country: null
          });
        }
      } catch (err) {
        console.error('[LeaguePageRoute] Error:', err);
        setError('Failed to load league details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueDetails();
  }, [leagueId]);

  const handleBack = () => {
    // Go back to the previous page or home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading league details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">League Not Found</h1>
            <p className="text-gray-400 mb-6">The requested league could not be found.</p>
            <button 
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                      target.src = "/icons/default-flag.svg";
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

export default LeaguePageRoute;
