import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { League } from '@/types'; // Assuming League type is suitable for ExtendedLeague prop of LeagueDetails
import Header from '@/components/Header';
import LeagueDetails from '@/components/LeagueDetails'; // Correctly import LeagueDetails
import { highlightlyClient } from '@/integrations/highlightly/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// LEAGUE_COUNTRY_MAPPING and getCountryFlag can remain if needed for fallback logo/country
const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
  // UEFA Competitions
  '2': 'EU', '3': 'EU', '848': 'EU', 
  '2486': 'EU',
  '33973': 'GB', '119924': 'ES', '115669': 'IT', '67162': 'DE', '52695': 'FR', 
  '216087': 'US', '253': 'US', 
  '63': 'PT', '307': 'SA', '88': 'NL', '71': 'BR', '128': 'AR', '1': 'WORLD',
  '40': 'GB', '141': 'ES', '136': 'IT', '80': 'DE', '62': 'FR',
  '106': 'TR', '87': 'DK', '103': 'NO', '113': 'SE', '119': 'CH', '169': 'PL',
  '345': 'CZ', '318': 'GR', '203': 'UA', '235': 'RU', '286': 'JP', '292': 'KR', '271': 'AU', '144': 'BE',
  '515': 'HT', '516': 'JM', '517': 'TT', '518': 'CR', '519': 'GT', '520': 'HN', '521': 'PA', '522': 'NI', '523': 'SV', '524': 'BZ',
};

const getCountryFlag = (leagueId: string): string => {
  const countryCode = LEAGUE_COUNTRY_MAPPING[leagueId];
  if (!countryCode) return '/icons/default-flag.svg';
  const code = countryCode.toUpperCase();
  if (code === 'EU') return 'https://flagcdn.com/w40/eu.png';
  if (code === 'WORLD') return 'https://flagcdn.com/w40/un.png';
  if (code === 'GB' || code === 'EN' || code === 'UK') return 'https://flagcdn.com/w40/gb.png';
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};


const LeaguePage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [leagueDetails, setLeagueDetails] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialLeagueData = async () => {
      if (!leagueId) {
        setError('No league ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`[LeaguePage] Fetching details for league ${leagueId}`);
        const rawLeagueDetails = await highlightlyClient.getLeagueById(leagueId);
        console.log('[LeaguePage] Raw league details from API:', rawLeagueDetails);

        let currentLeagueData = null;
        if (Array.isArray(rawLeagueDetails)) {
          currentLeagueData = rawLeagueDetails[0];
        } else if (rawLeagueDetails && rawLeagueDetails.data) {
          currentLeagueData = Array.isArray(rawLeagueDetails.data) ? rawLeagueDetails.data[0] : rawLeagueDetails.data;
        } else if (rawLeagueDetails) {
          currentLeagueData = rawLeagueDetails;
        }
        
        // Ensure the fetched data has an id, otherwise it's not valid league data.
        if (currentLeagueData && currentLeagueData.id) {
          // Add a default logo if missing, using getCountryFlag if country info is not directly on league
          if (!currentLeagueData.logo && currentLeagueData.country && currentLeagueData.country.code) {
             // Attempt to use country code from league.country object if available
             const countryCode = currentLeagueData.country.code.toUpperCase();
             if (countryCode === 'EU') currentLeagueData.logo = 'https://flagcdn.com/w40/eu.png';
             else if (countryCode === 'WORLD') currentLeagueData.logo = 'https://flagcdn.com/w40/un.png';
             else if (countryCode === 'GB' || countryCode === 'EN' || countryCode === 'UK') currentLeagueData.logo = 'https://flagcdn.com/w40/gb.png';
             else currentLeagueData.logo = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
          } else if (!currentLeagueData.logo) {
             // Fallback to using leagueId with LEAGUE_COUNTRY_MAPPING if league.country is not present
             currentLeagueData.logo = getCountryFlag(leagueId) || '/icons/default-league.png';
          }

          // Ensure seasons is an array
          if (!currentLeagueData.seasons || !Array.isArray(currentLeagueData.seasons)) {
            currentLeagueData.seasons = [];
          }

          setLeagueDetails(currentLeagueData as League);
          console.log('[LeaguePage] Processed league details:', currentLeagueData);
        } else {
          console.warn('[LeaguePage] Could not parse valid league data from API, using fallback.');
          const fallbackLeague: League = {
            id: leagueId,
            name: `League ${leagueId}`,
            logo: getCountryFlag(leagueId) || '/icons/default-league.png',
            country: LEAGUE_COUNTRY_MAPPING[leagueId] 
              ? { code: LEAGUE_COUNTRY_MAPPING[leagueId], name: LEAGUE_COUNTRY_MAPPING[leagueId], logo: getCountryFlag(leagueId) } 
              : undefined, // Make country undefined if not found, to match ExtendedLeague
            seasons: [], // Ensure seasons is an array
            highlights: [] // Required by League type
          };
          setLeagueDetails(fallbackLeague);
          setError('Partial league details loaded (fallback). Some features might be unavailable if the league is not found in the API.');
        }
      } catch (err: any) {
        console.error('[LeaguePage] Error fetching league details:', err);
        setError('Failed to load initial league details. ' + (err.message || ''));
        const fallbackLeague: League = {
          id: leagueId,
          name: `League ${leagueId}`,
          logo: getCountryFlag(leagueId) || '/icons/default-league.png',
          country: LEAGUE_COUNTRY_MAPPING[leagueId] 
            ? { code: LEAGUE_COUNTRY_MAPPING[leagueId], name: LEAGUE_COUNTRY_MAPPING[leagueId], logo: getCountryFlag(leagueId) } 
            : undefined,
          seasons: [],
          highlights: []
        };
        setLeagueDetails(fallbackLeague);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialLeagueData();
  }, [leagueId]);

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading league details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state is shown if leagueDetails could not be set even to a fallback
  if (error && !leagueDetails) { 
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center text-center p-4">
          <div>
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!leagueDetails) {
     // This case should ideally be covered by loading or error state with fallback
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center text-center p-4">
             <p className="text-muted-foreground">League data is currently unavailable.</p>
             <Button onClick={handleBack} variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
      </div>
    );
  }

  // At this point, leagueDetails should be available (either from API or fallback)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {/* LeagueDetails component will have its own padding/container */}
      <LeagueDetails league={leagueDetails} onBack={handleBack} />
      {/* Display a less intrusive error if fallback was used but LeagueDetails can still render */}
      {error && leagueDetails && leagueDetails.name === `League ${leagueId}` && (
         <p className="text-center text-sm text-yellow-500 p-2">Showing fallback data. Full league details might be unavailable.</p>
      )}
    </div>
  );
};

export default LeaguePage;
