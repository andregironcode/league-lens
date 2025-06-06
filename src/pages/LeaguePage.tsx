import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Trophy, Calendar, Clock, MapPin, Target, Users, BarChart2, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { League, Match, StandingsRow, TeamStatistics } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import StandingsTable from '@/components/StandingsTable';

interface LeagueStatistics {
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  cleanSheetRate: number;
  frequentScorelines: { score: string; count: number }[];
  biggestMatch: Match | null;
}

// Helper function to safely get score from match
const getMatchScore = (match: any) => {
  // Handle the API's actual response format: match.state.score.current = "X - Y"
  if (match.state?.score?.current) {
    const [home, away] = match.state.score.current.split('-').map((s: string) => parseInt(s.trim(), 10));
    return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
  }
  
  // Fallback to other possible formats
  if (match.score && typeof match.score === 'object') {
    if (match.score.fulltime) {
      const [home, away] = match.score.fulltime.split('-').map((s: string) => parseInt(s.trim(), 10));
      return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
    }
    // Handle numeric score properties if they exist
    if (typeof match.score.home === 'number' && typeof match.score.away === 'number') {
      return { home: match.score.home || 0, away: match.score.away || 0 };
    }
  }
  return { home: 0, away: 0 };
};

interface MatchCardProps {
  match: Match;
  showDate?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, showDate = true }) => {
  // Helper function to safely get status string
  const getStatusString = (status: any): string => {
    if (typeof status === 'string') {
      return status.toLowerCase();
    }
    if (typeof status === 'object' && status !== null) {
      return status.long?.toLowerCase() || status.short?.toLowerCase() || '';
    }
    return '';
  };

  const statusString = getStatusString(match.status);
  const stateDescription = match.state?.description?.toLowerCase() || '';
  const isFinished = statusString.includes('finished') || 
                   statusString.includes('ft') ||
                   stateDescription.includes('finished');
  
  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd');
  };

  // Helper function to safely get score
  const getScore = (scoreData: any) => {
    // Handle the API's actual response format: match.state.score.current = "X - Y"
    if (match.state?.score?.current) {
      const [home, away] = match.state.score.current.split('-').map((s: string) => parseInt(s.trim(), 10));
      return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
    }
    
    // Fallback to other possible formats
    if (scoreData && typeof scoreData === 'object') {
      if (scoreData.fulltime) {
        const [home, away] = scoreData.fulltime.split('-').map((s: string) => parseInt(s.trim(), 10));
        return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
      }
      if (scoreData.home !== undefined && scoreData.away !== undefined) {
        return { home: scoreData.home || 0, away: scoreData.away || 0 };
      }
    }
    return { home: 0, away: 0 };
  };

  const scoreData = getScore(match.score);

  return (
    <Link 
      to={`/match/${match.id}`} 
      className="block bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:bg-gray-800/50 transition-colors"
    >
      {showDate && (
        <div className="text-xs text-gray-400 mb-2">
          {formatMatchDate(match.date)} • {formatMatchTime(match.date)}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <img 
            src={match.homeTeam?.logo || '/placeholder-team.png'} 
            alt={match.homeTeam?.name} 
            className="w-8 h-8 object-contain"
          />
          <span className="text-white text-sm font-medium truncate">
            {match.homeTeam?.name}
          </span>
        </div>
        
        <div className="text-center px-4">
          {isFinished ? (
            <div className="text-yellow-400 font-bold text-lg">
              {scoreData.home} - {scoreData.away}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              {formatMatchTime(match.date)}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <span className="text-white text-sm font-medium truncate text-right">
            {match.awayTeam?.name}
          </span>
          <img 
            src={match.awayTeam?.logo || '/placeholder-team.png'} 
            alt={match.awayTeam?.name} 
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>
      
      {!isFinished && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            Upcoming
          </span>
        </div>
      )}
    </Link>
  );
};

const TodaysMatches: React.FC<{ matches: Match[] }> = ({ matches }) => {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar size={32} className="mx-auto mb-2" />
        <p className="text-white font-medium">No Matches Today</p>
        <p className="text-sm">There are no matches scheduled for today in this league.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} showDate={false} />
      ))}
    </div>
  );
};

const MatchesByDate: React.FC<{ matches: Match[]; title: string }> = ({ matches, title }) => {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar size={32} className="mx-auto mb-2" />
        <p className="text-white font-medium">No {title}</p>
        <p className="text-sm">No matches found for this category.</p>
      </div>
    );
  }

  // Group matches by date
  const matchesByDate = matches.reduce((acc, match) => {
    const date = format(new Date(match.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="space-y-6">
      {Object.entries(matchesByDate)
        .sort(([a], [b]) => title === 'Results' ? b.localeCompare(a) : a.localeCompare(b))
        .map(([date, dayMatches]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
              {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
            </h3>
            <div className="space-y-3">
              {dayMatches.map((match) => (
                <MatchCard key={match.id} match={match} showDate={false} />
              ))}
            </div>
          </div>
        ))
      }
    </div>
  );
};

const LeaguePage: React.FC = () => {
  const { leagueId, season } = useParams<{ leagueId: string; season?: string }>();
  const navigate = useNavigate();
  
  const [league, setLeague] = useState<League | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [todaysMatches, setTodaysMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [leagueStats, setLeagueStats] = useState<LeagueStatistics | null>(null);
  
  // Loading states
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);

  const [selectedSeason, setSelectedSeason] = useState<string>(season || '');

  useEffect(() => {
    if (!leagueId) {
      setError("League ID is missing.");
      setLoading(false);
      return;
    }

    const fetchLeagueData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch league details
        const response = await highlightlyClient.getLeagueById(leagueId);
        console.log('[LeaguePage] Raw league details from API:', response);

        // Handle different response formats
        let currentLeagueData = null;
        if (Array.isArray(response)) {
          currentLeagueData = response[0];
        } else if (response && response.data) {
          currentLeagueData = Array.isArray(response.data) ? response.data[0] : response.data;
        } else if (response) {
          currentLeagueData = response;
        }

        if (currentLeagueData && currentLeagueData.id) {
          const leagueData: League = {
            id: currentLeagueData.id.toString(),
            name: currentLeagueData.name,
            logo: currentLeagueData.logo,
            country: currentLeagueData.country,
            seasons: currentLeagueData.seasons.map((s: any) => ({
              season: s.season,
              startDate: s.start,
              endDate: s.end
            })),
            highlights: [] // Initialize empty highlights array
          };

          setLeague(leagueData);

          // Set selected season if not already set
          if (!selectedSeason && leagueData.seasons && leagueData.seasons.length > 0) {
            // Find current season or default to first
            const currentSeasonData = currentLeagueData.seasons.find((s: any) => s.current);
            const selectedSeasonData = currentSeasonData || currentLeagueData.seasons[0];
            setSelectedSeason(selectedSeasonData.season.toString());
          }
        } else {
          throw new Error('Invalid league data received from API');
        }
      } catch (err) {
        console.error('[LeaguePage] Error fetching league data:', err);
        setError('Failed to load league details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

  useEffect(() => {
    if (!league || !selectedSeason) return;

    const fetchLeagueContent = async () => {
      try {
        setStandingsLoading(true);
        setMatchesLoading(true);

        // Fetch standings
        try {
          const standingsResponse = await highlightlyClient.getStandings({
            leagueId: league.id,
            season: selectedSeason
          });
          
          if (standingsResponse?.groups && standingsResponse.groups.length > 0 && standingsResponse.groups[0].standings) {
            setStandings(standingsResponse.groups[0].standings);
          } else if (standingsResponse?.data && Array.isArray(standingsResponse.data)) {
            setStandings(standingsResponse.data);
          }
        } catch (standingsErr) {
          console.error('[LeaguePage] Error fetching standings:', standingsErr);
        } finally {
          setStandingsLoading(false);
        }

        // Fetch matches
        try {
          const matchesResponse = await highlightlyClient.getMatches({
            leagueId: league.id,
            season: selectedSeason,
            limit: '100' // Get more matches to categorize them
          });

          if (matchesResponse?.data && Array.isArray(matchesResponse.data)) {
            const matches = matchesResponse.data;
            const now = new Date();
            const today = format(now, 'yyyy-MM-dd');

            // Categorize matches
            const todayMatches = matches.filter(match => 
              format(new Date(match.date), 'yyyy-MM-dd') === today
            );

            const upcoming = matches.filter(match => {
              const matchDate = new Date(match.date);
              const isUpcoming = matchDate > now;
              const statusStr = match.status?.toLowerCase() || '';
              const stateDesc = match.state?.description?.toLowerCase() || '';
              const isNotFinished = !statusStr.includes('finished') && 
                                  !statusStr.includes('ft') &&
                                  !stateDesc.includes('finished');
              return isUpcoming && isNotFinished;
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const past = matches.filter(match => {
              const matchDate = new Date(match.date);
              const statusStr = match.status?.toLowerCase() || '';
              const stateDesc = match.state?.description?.toLowerCase() || '';
              const isFinished = statusStr.includes('finished') || 
                               statusStr.includes('ft') ||
                               stateDesc.includes('finished') ||
                               matchDate < now;
              return isFinished;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTodaysMatches(todayMatches);
            setUpcomingMatches(upcoming);
            setPastMatches(past);

            // Calculate league statistics from match data
            if (past.length > 0) {
              const stats: LeagueStatistics = {
                totalMatches: past.length,
                totalGoals: past.reduce((sum, match) => {
                  const score = getMatchScore(match);
                  return sum + score.home + score.away;
                }, 0),
                averageGoalsPerMatch: 0,
                cleanSheetRate: 0,
                frequentScorelines: [],
                biggestMatch: null
              };

              stats.averageGoalsPerMatch = stats.totalGoals / stats.totalMatches;
              setLeagueStats(stats);
            }
          }
        } catch (matchesErr) {
          console.error('[LeaguePage] Error fetching matches:', matchesErr);
        } finally {
          setMatchesLoading(false);
        }
      } catch (err) {
        console.error('[LeaguePage] Error fetching league content:', err);
      }
    };

    fetchLeagueContent();
  }, [league, selectedSeason]);

  const handleSeasonChange = (newSeason: string) => {
    setSelectedSeason(newSeason);
    navigate(`/league/${leagueId}/${newSeason}`, { replace: true });
  };

  const handleGoBack = () => navigate('/leagues');

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: `${league?.name} - ${selectedSeason} Season`,
        url: url,
      });
    } catch (err) {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading league details...</p>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error || "Could not find league data."}</p>
          <button
            onClick={handleGoBack}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <ArrowLeft className="mr-2 -ml-1 h-5 w-5" />
            Back to Leagues
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button onClick={handleGoBack} className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            Back to Leagues
          </button>
        </div>

        {/* League Header - Similar to Match Header */}
        <div className="mb-8 w-full space-y-6">
          <div 
            className="rounded-xl overflow-hidden p-6 relative"
            style={{
              background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
              border: '1px solid #1B1B1B',
            }}
          >
            {/* Country info in top left */}
            <div className="absolute top-4 left-4 flex items-center gap-3">
              {league.country?.logo && (
                <img 
                  src={league.country.logo} 
                  alt={league.country.name} 
                  className="w-5 h-5 object-contain rounded-full bg-white p-0.5" 
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {league.country?.name || 'International'}
                </div>
              </div>
            </div>

            {/* Share button in top right */}
            <div className="absolute top-4 right-4">
              <button 
                onClick={handleShare} 
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10"
              >
                <Share2 className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* League info and season selector */}
            <div className="flex flex-col items-center justify-center mt-12 mb-6">
              <div className="flex items-center justify-center mb-6 w-full">
                <div className="text-center">
                  <img 
                    src={league.logo || '/placeholder-league.png'} 
                    alt={league.name} 
                    className="w-20 h-20 object-contain mx-auto mb-3" 
                  />
                  <div className="text-white font-bold text-3xl mb-2">{league.name}</div>
                  <div className="text-gray-400 text-lg mb-4">{selectedSeason} Season</div>
                  
                  {/* Season Selector */}
                  {league.seasons && league.seasons.length > 1 && (
                    <div className="flex justify-center">
                      <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                                               {league.seasons.map((s) => (
                         <option key={s.season} value={s.season.toString()}>
                           {s.season} Season
                         </option>
                       ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Similar to Match Page */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-2 flex justify-around sm:justify-center space-x-1 sm:space-x-2">
            {[
              { key: 'home', label: 'Home', icon: Home },
              { key: 'standings', label: 'Standings', icon: Trophy },
              { key: 'results', label: 'Results', icon: BarChart2 },
              { key: 'fixtures', label: 'Fixtures', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-initial sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black ${
                  activeTab === tab.key
                    ? 'bg-yellow-500 text-black shadow-lg scale-105'
                    : 'text-white bg-gray-800/50 hover:bg-gray-700/70'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Today's Matches */}
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                  <h4 className="text-lg font-semibold mb-6 text-center text-white">TODAY'S MATCHES</h4>
                  {matchesLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <TodaysMatches matches={todaysMatches} />
                  )}
                </div>

                {/* League Preview Section */}
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                  <h3 className="text-lg font-bold text-white text-center mb-6">League Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standings Preview */}
                    <div>
                      <h4 className="text-md font-semibold text-white mb-4">Current Standings (Top 5)</h4>
                      {standingsLoading ? (
                        <div className="text-center py-4">
                          <div className="w-6 h-6 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : standings.length > 0 ? (
                        <StandingsTable standings={standings.slice(0, 5)} />
                      ) : (
                        <p className="text-gray-400 text-center py-4">No standings available</p>
                      )}
                    </div>

                    {/* League Stats */}
                    <div>
                      <h4 className="text-md font-semibold text-white mb-4">Season Statistics</h4>
                      {leagueStats ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Total Matches:</span>
                            <span className="text-white font-medium">{leagueStats.totalMatches}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Total Goals:</span>
                            <span className="text-white font-medium">{leagueStats.totalGoals}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Goals per Match:</span>
                            <span className="text-white font-medium">
                              {leagueStats.averageGoalsPerMatch.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-4">No statistics available</p>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Matches Preview */}
                  <div className="mt-8">
                    <h4 className="text-md font-semibold text-white mb-4">Next Fixtures</h4>
                    {matchesLoading ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : upcomingMatches.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingMatches.slice(0, 3).map((match) => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No upcoming fixtures</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'standings' && (
              <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                <h4 className="text-lg font-semibold mb-6 text-center text-white">LEAGUE STANDINGS</h4>
                {standingsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : standings.length > 0 ? (
                  <StandingsTable standings={standings} />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Trophy size={32} className="mx-auto mb-2" />
                    <p className="text-white font-medium">No Standings Available</p>
                    <p className="text-sm">Standings data is not available for this season.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH RESULTS</h4>
                {matchesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <MatchesByDate matches={pastMatches} title="Results" />
                )}
              </div>
            )}

            {activeTab === 'fixtures' && (
              <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                <h4 className="text-lg font-semibold mb-6 text-center text-white">UPCOMING FIXTURES</h4>
                {matchesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <MatchesByDate matches={upcomingMatches} title="Fixtures" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LeaguePage;
