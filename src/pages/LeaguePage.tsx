import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueHighlights, getActiveService } from '@/services/serviceAdapter';
import { League, MatchHighlight, TableRow, Match } from '@/types';
import Header from '@/components/Header';
import LeagueDetails from '@/components/LeagueDetails';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import HighlightCard from '@/components/HighlightCard';

type TabType = 'highlights' | 'standings' | 'matches' | 'teams';

// League country mapping - same comprehensive mapping as other components
const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
  // UEFA Competitions
  '2': 'EU', '3': 'EU', '848': 'EU', // UEFA competitions
  '2486': 'EU', // UEFA Champions League (corrected from ES/La Liga)
  
  // Major domestic leagues (1st tier)
  '33973': 'GB', // Premier League
  '119924': 'ES', // La Liga (corrected ID)
  '115669': 'IT', // Serie A (Italy)
  '67162': 'DE', // Bundesliga
  '52695': 'FR', // Ligue 1
  '216087': 'US', '253': 'US', // MLS
  '63': 'PT', // Liga Portugal
  '307': 'SA', // Saudi Pro League
  '88': 'NL', // Eredivisie
  '71': 'BR', // Série A Brasil
  '128': 'AR', // Primera División Argentina
  '1': 'WORLD', // FIFA World Cup
  
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
  const [activeTab, setActiveTab] = useState<TabType>('highlights');
  const [standings, setStandings] = useState<TableRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

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

            // Fetch initial standings if available
            if (leagueData.hasStandings) {
              fetchStandings(leagueId);
            }

            // Fetch initial matches
            fetchMatches(leagueId);
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

  const fetchStandings = async (leagueId: string) => {
    try {
      setLoadingTab(true);
      const response = await highlightlyClient.getStandings({ leagueId });
      if (response && response.data) {
        setStandings(response.data);
      }
    } catch (err) {
      console.error('[LeaguePageRoute] Error fetching standings:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchMatches = async (leagueId: string) => {
    try {
      setLoadingTab(true);
      const response = await highlightlyClient.getMatches({ leagueId });
      if (response && response.data) {
        setMatches(response.data);
      }
    } catch (err) {
      console.error('[LeaguePageRoute] Error fetching matches:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Fetch data based on tab if not already loaded
    if (tab === 'standings' && standings.length === 0 && league?.hasStandings) {
      fetchStandings(leagueId!);
    } else if (tab === 'matches' && matches.length === 0) {
      fetchMatches(leagueId!);
    }
  };

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
                <div>
                  <h1 className="text-3xl font-bold">{league.name}</h1>
                  {league.country && (
                    <p className="text-gray-400">{league.country.name}</p>
                  )}
                </div>
              </div>
              
              {/* League Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1a1a1a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">League Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Season</span>
                      <span className="text-white">{league.season || 'Current'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Teams</span>
                      <span className="text-white">{league.totalTeams || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Round</span>
                      <span className="text-white">{league.currentRound || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">Current Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="text-white">{league.status || 'Active'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Updated</span>
                      <span className="text-white">
                        {league.lastUpdated 
                          ? new Date(league.lastUpdated).toLocaleDateString() 
                          : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">Coverage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Standings</span>
                      <span className="text-white">{league.hasStandings ? 'Available' : 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Live Matches</span>
                      <span className="text-white">{league.hasLiveMatches ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Statistics</span>
                      <span className="text-white">{league.hasStatistics ? 'Available' : 'Not Available'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* League Content Tabs */}
              <div className="mb-8">
                <div className="border-b border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button 
                      onClick={() => handleTabChange('highlights')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === 'highlights' 
                          ? 'border-yellow-400 text-yellow-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                      Highlights
                    </button>
                    {league.hasStandings && (
                      <button 
                        onClick={() => handleTabChange('standings')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                          ${activeTab === 'standings' 
                            ? 'border-yellow-400 text-yellow-400' 
                            : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                          }`}
                      >
                        Standings
                      </button>
                    )}
                    <button 
                      onClick={() => handleTabChange('matches')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === 'matches' 
                          ? 'border-yellow-400 text-yellow-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                      Matches
                    </button>
                    <button 
                      onClick={() => handleTabChange('teams')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === 'teams' 
                          ? 'border-yellow-400 text-yellow-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                      Teams
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Tab Content */}
              {loadingTab ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Highlights Tab */}
                  {activeTab === 'highlights' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-300">Recent Highlights</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(league.highlights || []).map((highlight: MatchHighlight) => (
                          <div key={highlight.id} className="transform transition-all duration-300 hover:scale-105">
                            <HighlightCard highlight={highlight} />
                          </div>
                        ))}
                        
                        {(!league.highlights || league.highlights.length === 0) && (
                          <div className="col-span-full text-center py-8">
                            <p className="text-gray-400">No highlights available for this league yet.</p>
                            <p className="text-sm text-gray-500 mt-2">Check back later for match highlights.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Standings Tab */}
                  {activeTab === 'standings' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-300">League Standings</h2>
                      {standings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-700">
                                <th className="py-3 px-4 text-left">#</th>
                                <th className="py-3 px-4 text-left">Team</th>
                                <th className="py-3 px-4 text-center">P</th>
                                <th className="py-3 px-4 text-center">W</th>
                                <th className="py-3 px-4 text-center">D</th>
                                <th className="py-3 px-4 text-center">L</th>
                                <th className="py-3 px-4 text-center">GF</th>
                                <th className="py-3 px-4 text-center">GA</th>
                                <th className="py-3 px-4 text-center">GD</th>
                                <th className="py-3 px-4 text-center">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((row) => (
                                <tr key={row.team.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                                  <td className="py-3 px-4">{row.position}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={row.team.logo} 
                                        alt={row.team.name} 
                                        className="w-6 h-6 object-contain"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = "/icons/default.svg";
                                        }}
                                      />
                                      <span>{row.team.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">{row.played}</td>
                                  <td className="py-3 px-4 text-center">{row.won}</td>
                                  <td className="py-3 px-4 text-center">{row.drawn}</td>
                                  <td className="py-3 px-4 text-center">{row.lost}</td>
                                  <td className="py-3 px-4 text-center">{row.goalsFor}</td>
                                  <td className="py-3 px-4 text-center">{row.goalsAgainst}</td>
                                  <td className="py-3 px-4 text-center">{row.goalDifference}</td>
                                  <td className="py-3 px-4 text-center font-bold">{row.points}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No standings available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matches Tab */}
                  {activeTab === 'matches' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-300">Recent & Upcoming Matches</h2>
                      {matches.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {matches.map((match) => (
                            <div 
                              key={match.id} 
                              className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#222222] transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">
                                  {new Date(match.date).toLocaleDateString()}
                                </span>
                                <span className={`text-sm px-2 py-1 rounded ${
                                  match.status === 'live' 
                                    ? 'bg-red-500 text-white' 
                                    : match.status === 'finished'
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-green-600 text-white'
                                }`}>
                                  {match.status.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <img 
                                    src={match.homeTeam.logo} 
                                    alt={match.homeTeam.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/icons/default.svg";
                                    }}
                                  />
                                  <span className="font-medium">{match.homeTeam.name}</span>
                                </div>
                                
                                <div className="px-4 text-center">
                                  {match.score ? (
                                    <div className="text-xl font-bold">
                                      {match.score.home} - {match.score.away}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-400">
                                      {match.time || 'TBD'}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3 flex-1 justify-end">
                                  <span className="font-medium">{match.awayTeam.name}</span>
                                  <img 
                                    src={match.awayTeam.logo} 
                                    alt={match.awayTeam.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/icons/default.svg";
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {match.venue && (
                                <div className="mt-2 text-sm text-gray-400 text-center">
                                  {match.venue}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No matches available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teams Tab */}
                  {activeTab === 'teams' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-300">Teams</h2>
                      <div className="text-center py-8">
                        <p className="text-gray-400">Teams information coming soon.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
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
