import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { highlightlyClient } from '@/integrations/highlightly/client';
import type { Match, Team as BaseTeam } from '@/types';

// Extend the base types with additional properties needed in this component
interface ExtendedLeague {
  id: string;
  name: string;
  logo?: string;
  country?: {
    code: string;
    name: string;
    logo?: string;
  };
  seasons?: {
    season: number;
  }[];
}

interface StandingsRow {
  position: number;
  team: {
    id: string;
    name: string;
    logo?: string;
  };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface ExtendedTeam extends BaseTeam {
  founded?: number;
  venue?: {
    name: string;
    capacity?: number;
  };
}

interface LeagueDetailsProps {
  league: ExtendedLeague;
  onBack: () => void;
}

const LeagueDetails: React.FC<LeagueDetailsProps> = ({ league, onBack }) => {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<ExtendedTeam[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'highlights'>('overview');
  const [showAllMatches, setShowAllMatches] = useState(false);

  useEffect(() => {
    fetchAllLeagueData();
  }, [league.id]);

  const fetchAllLeagueData = async () => {
    // Don't make API calls if league.id is not available
    if (!league?.id) {
      console.log('[LeaguePage] League ID not available, skipping API calls');
      setStandingsLoading(false);
      setMatchesLoading(false);
      setTeamsLoading(false);
      setHighlightsLoading(false);
      return;
    }
    
    await Promise.all([
      fetchStandings(),
      fetchAllMatches(),
      fetchTeams(),
      fetchHighlights()
    ]);
  };

  const fetchStandings = async () => {
    try {
      setStandingsLoading(true);
      setStandingsError(null);
      
      console.log(`[LeaguePage] Fetching standings for league ${league.id}`);
      
      // Try with current season - use 2024 instead of old season data
      const currentSeason = new Date().getFullYear(); // Always use current year
      
      console.log(`[LeaguePage] Using season: ${currentSeason}`);
      
      // Fix: API requires leagueId (not league) and season parameters
      try {
        console.log(`[LeaguePage] Trying standings with leagueId=${league.id} and season=${currentSeason}...`);
        
        // Use the highlightlyClient with correct parameter names
        const response = await highlightlyClient.getStandings({ 
          league: league.id,  // Client interface uses "league" but API expects "leagueId"
          season: currentSeason.toString()
        });
        
        console.log(`[LeaguePage] Raw standings response:`, response);
        
        // Handle response format - API returns groups with standings
        let standingsData = [];
        if (response.groups && Array.isArray(response.groups) && response.groups.length > 0) {
          // Use first group's standings
          standingsData = response.groups[0].standings || [];
          console.log(`[LeaguePage] Using response.groups[0].standings`);
        } else if (Array.isArray(response)) {
          standingsData = response;
          console.log(`[LeaguePage] Using direct array response`);
        } else if (response?.data && Array.isArray(response.data)) {
          standingsData = response.data;
          console.log(`[LeaguePage] Using response.data array`);
        } else if (response?.league?.standings) {
          standingsData = response.league.standings[0] || []; // First group of standings
          console.log(`[LeaguePage] Using response.league.standings[0]`);
        } else {
          console.log(`[LeaguePage] Trying to find standings in response object:`, Object.keys(response));
          // Try to find standings data in different possible locations
          if (response.standings && Array.isArray(response.standings)) {
            standingsData = response.standings;
          } else if (response[0] && response[0].standings) {
            standingsData = response[0].standings;
          }
        }
        
        // Use API response format directly without mapping
        setStandings(standingsData);
        console.log(`[LeaguePage] Final standings data:`, standingsData);
        console.log(`[LeaguePage] Loaded ${standingsData.length} standings entries`);
        
      } catch (firstError) {
        console.log(`[LeaguePage] Current season failed, trying 2024...`);
        try {
          const response = await highlightlyClient.getStandings({ 
            league: league.id,
            season: '2024'
          });
          console.log(`[LeaguePage] Success with 2024 season!`, response);
          
          // Handle response format (same logic as above)
          let standingsData = [];
          if (response.groups && Array.isArray(response.groups) && response.groups.length > 0) {
            standingsData = response.groups[0].standings || [];
          } else if (Array.isArray(response)) {
            standingsData = response;
          } else if (response.data && Array.isArray(response.data)) {
            standingsData = response.data;
          } else if (response.league && response.league.standings) {
            standingsData = response.league.standings[0] || [];
          }
          
          // Use API response format directly without mapping
          setStandings(standingsData);
          console.log(`[LeaguePage] Final standings data:`, standingsData);
          console.log(`[LeaguePage] Loaded ${standingsData.length} standings entries with 2024`);
          
        } catch (secondError) {
          console.log(`[LeaguePage] All standings approaches failed:`, firstError, secondError);
          throw secondError;
        }
      }
    } catch (err) {
      console.error('[LeaguePage] Error fetching standings:', err);
      setStandingsError('Failed to load standings');
    } finally {
      setStandingsLoading(false);
    }
  };

  const fetchAllMatches = async () => {
    try {
      const response = await highlightlyClient.getMatches({
        leagueId: league.id,
        season: '2024'
      });

      if (response.data && Array.isArray(response.data)) {
        // Use API response directly without transformation
        setAllMatches(response.data);
        
        // Filter for upcoming matches using API response format
        const upcoming = response.data.filter((match: any) => 
          match.fixture?.status?.short !== 'FT'
        );
        setUpcomingMatches(upcoming);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      setTeamsError(null);
      
      console.log(`[LeaguePage] Fetching teams for league ${league.id}`);
      
      // Try different approaches for teams API since league parameter might not be supported
      let response;
      try {
        // First try with league parameter (as documented)
        response = await highlightlyClient.getTeams({
          league: league.id
        });
      } catch (firstError) {
        console.log(`[LeaguePage] league parameter failed, trying without parameters...`);
        try {
          // If that fails, try without any parameters (get all teams)
          response = await highlightlyClient.getTeams({});
        } catch (secondError) {
          console.log(`[LeaguePage] Both approaches failed:`, firstError, secondError);
          throw secondError;
        }
      }
      
      console.log(`[LeaguePage] Raw teams response:`, response);
      console.log(`[LeaguePage] Teams response type:`, typeof response);
      console.log(`[LeaguePage] Teams response is array:`, Array.isArray(response));
      if (response?.data) {
        console.log(`[LeaguePage] Teams response.data:`, response.data);
        console.log(`[LeaguePage] Teams response.data is array:`, Array.isArray(response.data));
      }
      
      let teamsData = [];
      if (Array.isArray(response)) {
        teamsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        teamsData = response.data;
      }
      
      // Filter teams to only show those from this league if possible
      // Since teams API returns all teams, we might need to filter them
      // For now, let's limit to a reasonable number for display
      const limitedTeams = teamsData.slice(0, 20);
      
      setTeams(limitedTeams);
      console.log(`[LeaguePage] Loaded ${limitedTeams.length} teams (limited from ${teamsData.length})`);
    } catch (err) {
      console.error('[LeaguePage] Error fetching teams:', err);
      setTeamsError('Failed to load teams');
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchHighlights = async () => {
    try {
      setHighlightsLoading(true);
      setHighlightsError(null);
      
      console.log(`[LeaguePage] Fetching highlights for league ${league.id}`);
      const response = await highlightlyClient.getHighlights({
        leagueId: league.id,
        limit: '6'
      });
      
      console.log(`[LeaguePage] Raw highlights response:`, response);
      
      let highlightsData = [];
      if (Array.isArray(response)) {
        highlightsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        highlightsData = response.data;
      }
      
      setHighlights(highlightsData);
      console.log(`[LeaguePage] Loaded ${highlightsData.length} highlights`);
    } catch (err) {
      console.error('[LeaguePage] Error fetching highlights:', err);
      setHighlightsError('Failed to load highlights');
    } finally {
      setHighlightsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMatchClick = (matchId: string | number) => {
    navigate(`/match/${matchId}`);
  };

  const StandingsTable = () => (
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="px-4 py-3">
        <h3 className="text-lg font-semibold text-white">League Table</h3>
      </div>
      
      {standingsLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading standings...</p>
        </div>
      ) : standingsError ? (
        <div className="p-8 text-center">
          <p className="text-red-400">{standingsError}</p>
        </div>
      ) : standings.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400">No standings available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-[#121212]">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-2 py-3 text-left w-12">#</th>
                <th className="px-3 py-3 text-left min-w-[180px]">Team</th>
                <th className="px-2 py-3 text-center w-10">P</th>
                <th className="px-2 py-3 text-center w-10">W</th>
                <th className="px-2 py-3 text-center w-10">D</th>
                <th className="px-2 py-3 text-center w-10">L</th>
                <th className="px-2 py-3 text-center w-12 hidden sm:table-cell">GF</th>
                <th className="px-2 py-3 text-center w-12 hidden sm:table-cell">GA</th>
                <th className="px-2 py-3 text-center w-12">GD</th>
                <th className="px-2 py-3 text-center w-12 font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {standings.map((row, index) => (
                <tr key={row.team?.id || index} className="hover:bg-[#222222] transition-colors">
                  {/* Position */}
                  <td className="px-2 py-3">
                    <span className={`text-sm font-medium ${
                      row.position <= 4 ? 'text-green-400' :
                      row.position <= 6 ? 'text-blue-400' :
                      row.position >= standings.length - 2 ? 'text-red-400' :
                      'text-white'
                    }`}>
                      {row.position || index + 1}
                    </span>
                  </td>
                  
                  {/* Team */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {row.team?.logo && (
                        <img 
                          src={row.team.logo} 
                          alt={row.team.name}
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                      <span className="text-white text-sm font-medium truncate">
                        {row.team?.name}
                      </span>
                    </div>
                  </td>
                  
                  {/* Played */}
                  <td className="px-2 py-3 text-center text-sm text-gray-300">{row.played}</td>
                  
                  {/* Won */}
                  <td className="px-2 py-3 text-center text-sm text-gray-300">{row.won}</td>
                  
                  {/* Drawn */}
                  <td className="px-2 py-3 text-center text-sm text-gray-300">{row.drawn}</td>
                  
                  {/* Lost */}
                  <td className="px-2 py-3 text-center text-sm text-gray-300">{row.lost}</td>
                  
                  {/* Goals For - Hidden on small screens */}
                  <td className="px-2 py-3 text-center text-sm text-gray-300 hidden sm:table-cell">{row.goalsFor}</td>
                  
                  {/* Goals Against - Hidden on small screens */}
                  <td className="px-2 py-3 text-center text-sm text-gray-300 hidden sm:table-cell">{row.goalsAgainst}</td>
                  
                  {/* Goal Difference */}
                  <td className="px-2 py-3 text-center text-sm">
                    <span className={row.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                    </span>
                  </td>
                  
                  {/* Points */}
                  <td className="px-2 py-3 text-center">
                    <span className="text-white font-semibold">{row.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Mobile-friendly legend for hidden columns */}
          <div className="px-4 py-2 text-xs text-gray-500 sm:hidden border-t border-gray-700/30">
            GF = Goals For, GA = Goals Against, GD = Goal Difference
          </div>
        </div>
      )}
    </div>
  );

  const MatchesList = ({ matches, title }: { matches: Match[], title: string }) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="divide-y divide-gray-700/30">
          {matches.map((match) => {
            // Use the API response format directly - trust the structure from Highlightly API
            let homeScore: number | undefined = undefined;
            let awayScore: number | undefined = undefined;

            // Check goals object first (most reliable source)
            if (match.goals?.home !== undefined && match.goals?.away !== undefined) {
              homeScore = match.goals.home;
              awayScore = match.goals.away;
            }

            const hasScore = homeScore !== undefined && awayScore !== undefined;
            const isFinished = match.status === 'finished';
            const isLive = match.status === 'live';

            return (
              <div 
                key={match.id}
                className={`py-2 cursor-pointer hover:bg-gray-800/30 ${isLive ? 'bg-green-900/20' : ''}`}
                onClick={() => handleMatchClick(match.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={match.homeTeam.logo} 
                      alt={match.homeTeam.name} 
                      className="w-6 h-6 object-contain"
                    />
                    <span className={isFinished ? 'text-gray-400' : 'text-white'}>
                      {match.homeTeam.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasScore ? (
                      <span className="font-semibold">
                        {homeScore} - {awayScore}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {isLive ? 'LIVE' : formatDate(match.date)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={isFinished ? 'text-gray-400' : 'text-white'}>
                      {match.awayTeam.name}
                    </span>
                    <img 
                      src={match.awayTeam.logo} 
                      alt={match.awayTeam.name} 
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-700/30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <div className="flex items-center gap-4">
                {league.logo && (
                  <img 
                    src={league.logo} 
                    alt={league.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{league.name || `League ${league.id}`}</h1>
                  {league.country && (
                    <div className="flex items-center gap-2 mt-1">
                      {league.country.logo && (
                        <img 
                          src={league.country.logo} 
                          alt={league.country.name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                      <span className="text-gray-400 text-sm">{league.country.name}</span>
                    </div>
                  )}
                  {!league.id && (
                    <div className="mt-2 px-3 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                      League details are limited - some data may not be available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 mt-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'matches', label: 'Matches' },
              { key: 'teams', label: 'Teams' },
              { key: 'highlights', label: 'Highlights' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key 
                    ? 'border-yellow-400 text-white' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="rounded-3xl p-6 border bg-black border-solid border-[#1B1B1B]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StandingsTable />
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <MatchesList matches={recentMatches} title="Recent Matches" />
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <MatchesList matches={upcomingMatches} title="Upcoming Matches" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading matches...</p>
              </div>
            ) : (
              <>
                {/* Matches Summary */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{allMatches.length}</div>
                        <div className="text-sm text-gray-400">Total Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{recentMatches.filter(m => m.goals).length}</div>
                        <div className="text-sm text-gray-400">With Scores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{upcomingMatches.length}</div>
                        <div className="text-sm text-gray-400">Upcoming</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowAllMatches(!showAllMatches)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {showAllMatches ? 'Show Less' : `View All ${allMatches.length} Matches`}
                    </button>
                  </div>
                </div>

                {/* Matches Display */}
                {showAllMatches ? (
                  <div className="space-y-4">
                    {/* DEBUG: Show match data structure */}
                    {allMatches.length > 0 && (
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <h4 className="text-red-400 font-bold mb-2">DEBUG: Match Data Structure</h4>
                        <div className="text-xs text-gray-300 space-y-2">
                          <div>Total matches: {allMatches.length}</div>
                          <div>Matches with goals object: {allMatches.filter(m => m.goals).length}</div>
                          <div className="max-h-32 overflow-y-auto">
                            <strong>First match sample:</strong>
                            <pre className="whitespace-pre-wrap text-xs">
                              {JSON.stringify(allMatches[0], null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                      <div className="px-4 py-3">
                        <h3 className="text-lg font-semibold text-white">Complete Match History</h3>
                        <p className="text-sm text-gray-400">All matches sorted by date (most recent first)</p>
                      </div>
                      
                      {allMatches.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-400">No matches available</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-700/30 max-h-[600px] overflow-y-auto">
                          {allMatches.map((match) => {
                            // Better score extraction
                            let homeScore: number | undefined = undefined;
                            let awayScore: number | undefined = undefined;
                            
                            // Use API response format directly - trust Highlightly API structure
                            if (match.goals?.home !== undefined && match.goals?.away !== undefined) {
                              homeScore = match.goals.home;
                              awayScore = match.goals.away;
                            }

                            const hasScore = homeScore !== undefined && awayScore !== undefined;

                            return (
                              <div 
                                key={match.id} 
                                className="p-4 hover:bg-[#222222] transition-colors cursor-pointer"
                                onClick={() => handleMatchClick(match.id)}
                                title="Click to view match details"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    {/* Home Team */}
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {match.homeTeam.logo && (
                                        <img 
                                          src={match.homeTeam.logo} 
                                          alt={match.homeTeam.name}
                                          className="w-6 h-6 object-contain flex-shrink-0"
                                          onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                      )}
                                      <span className="text-white text-sm font-medium truncate">{match.homeTeam.name}</span>
                                    </div>
                                    
                                    {/* Score */}
                                    <div className="flex items-center gap-2 px-4 flex-shrink-0">
                                      {hasScore ? (
                                        <span className="text-white font-bold text-lg bg-[#2a2a2a] px-3 py-1 rounded">
                                          {homeScore} - {awayScore}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-sm bg-[#2a2a2a] px-3 py-1 rounded">
                                          {formatDate(match.date)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Away Team */}
                                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                      <span className="text-white text-sm font-medium truncate">{match.awayTeam.name}</span>
                                      {match.awayTeam.logo && (
                                        <img 
                                          src={match.awayTeam.logo} 
                                          alt={match.awayTeam.name}
                                          className="w-6 h-6 object-contain flex-shrink-0"
                                          onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Status and Date */}
                                  <div className="ml-4 text-right flex-shrink-0 flex items-center gap-2">
                                    <div>
                                      <div className={`text-xs px-2 py-1 rounded mb-1 ${
                                        hasScore ? 'bg-green-600 text-white' :
                                        new Date(match.date) > new Date() ? 'bg-blue-600 text-white' :
                                        'bg-gray-600 text-white'
                                      }`}>
                                        {hasScore ? 'FT' : 
                                         new Date(match.date) > new Date() ? 'SCH' : 'N/A'}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {new Date(match.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    {/* Click indicator */}
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <MatchesList matches={recentMatches} title="Recent Matches" />
                    <MatchesList matches={upcomingMatches} title="Upcoming Matches" />
                  </>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'teams' && (
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="px-4 py-3">
              <h3 className="text-lg font-semibold text-white">Teams</h3>
            </div>
            
            {teamsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading teams...</p>
              </div>
            ) : teamsError ? (
              <div className="p-8 text-center">
                <p className="text-red-400">{teamsError}</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No teams available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {teams.map((team) => (
                  <div key={team.id} className="bg-[#121212] rounded-lg p-4 hover:bg-[#222222] transition-colors">
                    <div className="flex items-center gap-3">
                      {team.logo && (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                      <div>
                        <h4 className="text-white font-medium">{team.name}</h4>
                        {team.founded && (
                          <p className="text-gray-400 text-sm">Founded: {team.founded}</p>
                        )}
                        {team.venue && (
                          <p className="text-gray-400 text-sm">{team.venue.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'highlights' && (
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="px-4 py-3">
              <h3 className="text-lg font-semibold text-white">League Highlights</h3>
            </div>
            
            {highlightsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading highlights...</p>
              </div>
            ) : highlightsError ? (
              <div className="p-8 text-center">
                <p className="text-red-400">{highlightsError}</p>
              </div>
            ) : highlights.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No highlights available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {highlights.map((highlight, index) => (
                  <div key={highlight.id || index} className="bg-[#121212] rounded-lg overflow-hidden hover:bg-[#222222] transition-colors">
                    {highlight.thumbnail && (
                      <img 
                        src={highlight.thumbnail} 
                        alt={highlight.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    )}
                    <div className="p-3">
                      <h4 className="text-white font-medium text-sm line-clamp-2">{highlight.title}</h4>
                      {highlight.date && (
                        <p className="text-gray-400 text-xs mt-1">{formatDate(highlight.date)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueDetails; 