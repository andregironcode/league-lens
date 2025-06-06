import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Trophy, Calendar, Clock, MapPin, Target, Users, BarChart2, Share2, Plus, Minus } from 'lucide-react';
import Header from '@/components/Header';
import { highlightlyClient } from '@/integrations/highlightly/client';
import { League, Match, StandingsRow, TeamStatistics, LeagueStatistics } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatSeason, parseSeasonFromFormat } from '../utils/seasonFormatting';
import StandingsTable from '@/components/StandingsTable';
import MatchCard from '@/components/MatchCard';
import LeagueStats from '@/components/LeagueStats';

// The LeagueStatistics interface is now defined in @/types

// Helper function to safely get score from match
export const getMatchScore = (match: any) => {
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
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);
  const seasonButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Memoized sorted seasons (newest first)
  const sortedSeasons = useMemo(() => {
    return league?.seasons ? [...league.seasons].sort((a, b) => b.season - a.season) : [];
  }, [league?.seasons]);

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
            // Transform Highlightly API response to match our StandingsRow interface
            const transformedStandings: StandingsRow[] = standingsResponse.groups[0].standings.map((item: any) => ({
              position: item.position,
              team: {
                id: item.team.id.toString(),
                name: item.team.name,
                logo: item.team.logo || ''
              },
              played: item.total?.games || 0,
              won: item.total?.wins || 0,
              drawn: item.total?.draws || 0,
              lost: item.total?.loses || 0,
              goalsFor: item.total?.scoredGoals || 0,
              goalsAgainst: item.total?.receivedGoals || 0,
              goalDifference: (item.total?.scoredGoals || 0) - (item.total?.receivedGoals || 0),
              points: item.points || 0
            }));
            setStandings(transformedStandings);
          } else if (standingsResponse?.data && Array.isArray(standingsResponse.data)) {
            // Transform alternative response format
            const transformedStandings: StandingsRow[] = standingsResponse.data.map((item: any) => ({
              position: item.position,
              team: {
                id: item.team?.id?.toString() || item.teamId?.toString() || '',
                name: item.team?.name || item.teamName || '',
                logo: item.team?.logo || ''
              },
              played: item.total?.games || item.played || 0,
              won: item.total?.wins || item.won || 0,
              drawn: item.total?.draws || item.drawn || 0,
              lost: item.total?.loses || item.lost || 0,
              goalsFor: item.total?.scoredGoals || item.goalsFor || 0,
              goalsAgainst: item.total?.receivedGoals || item.goalsAgainst || 0,
              goalDifference: (item.total?.scoredGoals || item.goalsFor || 0) - (item.total?.receivedGoals || item.goalsAgainst || 0),
              points: item.points || 0
            }));
            setStandings(transformedStandings);
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
              let homeWins = 0;
              let awayWins = 0;
              let draws = 0;
              let cleanSheets = 0;
              let biggestWin: Match | null = null;
              let maxGoalDifference = -1;

              past.forEach(match => {
                const score = getMatchScore(match);
                if (score.home > score.away) homeWins++;
                else if (score.away > score.home) awayWins++;
                else draws++;

                if (score.home === 0 || score.away === 0) {
                  cleanSheets++;
                }

                const goalDifference = Math.abs(score.home - score.away);
                if (goalDifference > maxGoalDifference) {
                  maxGoalDifference = goalDifference;
                  biggestWin = match;
                }
              });

              const totalGoals = past.reduce((sum, match) => {
                const score = getMatchScore(match);
                return sum + score.home + score.away;
              }, 0);

              // Calculate most frequent scorelines
              const scorelineMap = new Map<string, number>();
              past.forEach(match => {
                const score = getMatchScore(match);
                const scoreline = `${score.home}-${score.away}`;
                scorelineMap.set(scoreline, (scorelineMap.get(scoreline) || 0) + 1);
              });

              // Get top 3 most frequent scorelines
              const mostFrequentScorelines = Array.from(scorelineMap.entries())
                .map(([scoreline, count]) => ({ scoreline, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              
              const stats: LeagueStatistics = {
                totalMatches: past.length,
                totalGoals,
                averageGoalsPerMatch: totalGoals / past.length,
                cleanSheetRate: (cleanSheets / (past.length * 2)) * 100,
                totalCleanSheets: cleanSheets,
                homeWins,
                awayWins,
                draws,
                biggestWin,
                mostFrequentScorelines
              };

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

  const handleSeasonChange = (formattedSeason: string) => {
    // Parse the formatted season back to the numeric season for API calls
    const numericSeason = parseSeasonFromFormat(formattedSeason);
    setSelectedSeason(numericSeason.toString());
    navigate(`/league/${leagueId}/${numericSeason}`, { replace: true });
  };

  const handleGoBack = () => navigate('/leagues');

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: `${league?.name} - ${formatSeason(selectedSeason)} Season`,
        url: url,
      });
    } catch (err) {
      await navigator.clipboard.writeText(url);
    }
  };

  // Handle clicking outside the season dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node) &&
          seasonButtonRef.current && !seasonButtonRef.current.contains(event.target as Node)) {
        setIsSeasonDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      if (isSeasonDropdownOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isSeasonDropdownOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSeasonDropdownOpen]);

  const handleSeasonSelect = (formattedSeason: string) => {
    handleSeasonChange(formattedSeason);
    setIsSeasonDropdownOpen(false);
  };

  const updateDropdownPosition = () => {
    if (seasonButtonRef.current) {
      const rect = seasonButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = sortedSeasons.length * 40 + 16; // Estimated height based on sorted seasons
      
      // Check if there's enough space below, otherwise position above
      const spaceBelow = viewportHeight - rect.bottom;
      const shouldPositionAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      
      setDropdownPosition({
        top: shouldPositionAbove 
          ? rect.top + window.scrollY - dropdownHeight - 8 
          : rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const toggleDropdown = () => {
    if (!isSeasonDropdownOpen) {
      updateDropdownPosition();
    }
    setIsSeasonDropdownOpen(!isSeasonDropdownOpen);
  };

  // Handle keyboard navigation for season dropdown
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (sortedSeasons.length === 0) return;

    if (event.key === 'Escape') {
      setIsSeasonDropdownOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    } else if (event.key === 'ArrowDown' && !isSeasonDropdownOpen) {
      event.preventDefault();
      toggleDropdown();
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
            className="rounded-xl overflow-hidden px-4 sm:px-6 py-3 sm:py-4 relative min-h-[100px] sm:min-h-[120px]"
            style={{
              background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
              border: '1px solid #1B1B1B',
            }}
          >
            {/* Share button in top right */}
            <div className="absolute top-3 right-4">
              <button 
                onClick={handleShare} 
                className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            {/* League info and season selector - Left-aligned design */}
            <div className="flex flex-col justify-center py-6 pl-2">
              {/* Country info integrated with league header */}
              <div className="mb-1">
                <div className="text-lg font-semibold tracking-wide ml-[4.5rem] sm:ml-20 uppercase" style={{ color: '#A1A1A1' }}>
                  {league.country?.name || 'International'}
                </div>
              </div>
              
              {/* League logo, title, and season selector - Horizontal layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                {/* League logo and title */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/10">
                      <img 
                        src={league.logo || '/placeholder-league.png'} 
                        alt={league.name} 
                        className="w-9 h-9 sm:w-11 sm:h-11 object-contain filter drop-shadow-sm" 
                      />
                    </div>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full blur-md -z-10"></div>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-2xl sm:text-3xl leading-tight tracking-tight">{league.name}</div>
                  </div>
                </div>

                {/* Custom Season Selector - Aligned to the right */}
                {sortedSeasons.length > 1 && (
                  <div className="flex justify-start sm:justify-end">
                    <div className="relative" ref={seasonDropdownRef}>
                      <button
                        ref={seasonButtonRef}
                        onClick={toggleDropdown}
                        onKeyDown={handleKeyDown}
                        className="bg-black text-white border border-gray-600/50 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 hover:border-gray-400 hover:shadow-lg transition-all duration-200 flex items-center gap-3 min-w-[130px] justify-between group"
                        style={{ backgroundColor: '#000000' }}
                        aria-expanded={isSeasonDropdownOpen}
                        aria-haspopup="listbox"
                        aria-label={`Season selector, currently ${formatSeason(selectedSeason)} selected`}
                      >
                        <span className="tracking-wide">{formatSeason(selectedSeason)}</span>
                        <div className="w-4 h-4 flex items-center justify-center">
                          {isSeasonDropdownOpen ? (
                            <Minus className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" />
                          ) : (
                            <Plus className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" />
                          )}
                    </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal-rendered dropdown to avoid clipping issues */}
              {isSeasonDropdownOpen && sortedSeasons.length > 1 && createPortal(
                <div 
                  className="fixed bg-black border border-gray-600/50 rounded-lg shadow-xl z-[9999] overflow-hidden backdrop-blur-sm"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`
                  }}
                  ref={seasonDropdownRef}
                >
                  {sortedSeasons.map((s, index) => (
                    <button 
                      key={s.season}
                      onClick={() => handleSeasonSelect(formatSeason(s.season))}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-900 transition-all duration-150 ${
                        formatSeason(s.season) === formatSeason(selectedSeason)
                          ? 'bg-gray-800 text-yellow-400 border-l-2 border-yellow-400'
                          : 'text-white hover:text-yellow-100'
                      } ${index === 0 ? 'rounded-t-lg' : ''} ${index === sortedSeasons.length - 1 ? 'rounded-b-lg' : ''}`}
                      style={{ backgroundColor: formatSeason(s.season) === formatSeason(selectedSeason) ? '#1f2937' : '#000000' }}
                    >
                      <span className="tracking-wide">{formatSeason(s.season)} Season</span>
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>

          {/* Plain Tab Navigation */}
          <div className="flex justify-center gap-6" style={{ backgroundColor: '#000000' }}>
            {[
              { key: 'home', label: 'Home' },
              { key: 'standings', label: 'Standings' },
              { key: 'results', label: 'Results' },
              { key: 'fixtures', label: 'Fixtures' },
            ].map(tab => (
                      <button 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-medium text-white transition-all duration-200 focus:outline-none ${
                  activeTab === tab.key
                    ? ''
                    : 'hover:opacity-70'
                }`}
                style={{ backgroundColor: '#000000' }}
              >
                <span className="tracking-wide">{tab.label}</span>
                {activeTab === tab.key && (
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ backgroundColor: '#F7CC45' }}
                  />
                )}
                    </button>
            ))}
              </div>
              
              {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'home' && (
                    <div className="space-y-6">
                {/* Today's Matches */}
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
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
                  {/* Standings Preview */}
                  <div>
                    <div className="flex justify-end items-center mb-4">
                      <button
                        onClick={() => setActiveTab('standings')}
                        className="bg-transparent text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 border border-yellow-400/30 hover:border-yellow-400/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      >
                        View Details
                      </button>
                    </div>
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
                              </div>
                              
                {/* League Statistics */}
                {leagueStats && (
                  <LeagueStats stats={leagueStats} />
                )}
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
