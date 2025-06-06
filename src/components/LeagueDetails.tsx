import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceAdapter } from '@/services/serviceAdapter';
import { League, Match as MatchType, StandingsRow, CalculatedSeasonStats, MatchState } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CalendarDays, ListChecks, BarChart3, Trophy, Home, Info } from 'lucide-react';
import StandingsTable from './StandingsTable';
import MatchList from './MatchList';
import SeasonStatsDisplay from './SeasonStatsDisplay';
import TodaysMatchesDisplay from './TodaysMatchesDisplay';
import TopContributorsDisplay from './TopContributorsDisplay';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LEAGUE_COUNTRY_MAPPING, getCountryFlag } from '@/utils/leagueCountryMapping';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeagueDetailsProps {
  league: League;
  initialSeason?: string;
  onSeasonChange: (season: string) => void;
  onBack: () => void;
}

// Helper to parse score string "H - A" into numbers
const parseScore = (scoreString?: string): { home: number | null; away: number | null } => {
  if (!scoreString || !scoreString.includes(' - ')) {
    return { home: null, away: null };
  }
  const parts = scoreString.split(' - ');
  const home = parseInt(parts[0], 10);
  const away = parseInt(parts[1], 10);
  return { home: isNaN(home) ? null : home, away: isNaN(away) ? null : away };
};

const LeagueDetails: React.FC<LeagueDetailsProps> = ({ league, initialSeason, onSeasonChange, onBack }) => {
  const navigate = useNavigate();
  const service = serviceAdapter;

  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [allMatchesForSeason, setAllMatchesForSeason] = useState<MatchType[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchType[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchType[]>([]);
  const [todaysMatches, setTodaysMatches] = useState<MatchType[]>([]);
  const [seasonStats, setSeasonStats] = useState<CalculatedSeasonStats | null>(null);
  
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [errorStandings, setErrorStandings] = useState<string | null>(null);
  const [errorMatches, setErrorMatches] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('Home');


  useEffect(() => {
    if (initialSeason) {
      setSelectedSeason(initialSeason);
    } else if (league?.seasons && league.seasons.length > 0) {
      const currentApiSeason = league.seasons.find((s: any) => s.current === true);
      if (currentApiSeason) {
        setSelectedSeason(currentApiSeason.season.toString());
      } else {
        setSelectedSeason(league.seasons[0].season.toString());
      }
    } else {
      setSelectedSeason(new Date().getFullYear().toString());
    }
  }, [league, initialSeason]);

  const fetchLeagueData = useCallback(async () => {
    if (!league?.id || !selectedSeason) return;

    setLoadingStandings(true);
    setErrorStandings(null);
    try {
      const standingsData = await service.getStandingsForLeague(league.id, selectedSeason);
      if (standingsData && standingsData.groups && standingsData.groups.length > 0) {
        // Assuming the first group is the main one, or logic is needed to find the correct group
        const mainGroup = standingsData.groups[0];
        setStandings(mainGroup.standings.map((s: any) => ({ ...s, team: s.team })) as StandingsRow[]);
      } else {
        setStandings([]);
      }
    } catch (err) {
      console.error('Error fetching standings:', err);
      setErrorStandings('Failed to load standings.');
      setStandings([]);
    } finally {
      setLoadingStandings(false);
    }

    setLoadingMatches(true);
    setErrorMatches(null);
    try {
      const allMatches = await service.getAllMatchesForLeagueSeason(league.id, selectedSeason);
      setAllMatchesForSeason(allMatches);

      const today = new Date().toISOString().split('T')[0];
      const past: MatchType[] = [];
      const upcoming: MatchType[] = [];
      const currentDay: MatchType[] = [];
      let tempBiggestMatch: MatchType | null = null;
      let maxGoals = -1;

      let totalGoals = 0;
      let numMatchesPlayed = 0;
      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;
      let cleanSheetsHome = 0;
      let cleanSheetsAway = 0;
      let matchesWithCleanSheet = 0;
      const scorelineCounts: Record<string, number> = {};

      const getStatusString = (status: any): string => {
        if (typeof status === 'object' && status !== null && status.long) {
          return status.long.toLowerCase();
        }
        if (typeof status === 'string') {
          return status.toLowerCase();
        }
        return '';
      };

      allMatches.forEach(match => {
        const matchDate = match.date.split('T')[0];
        const status = getStatusString(match.status) || match.state?.description?.toLowerCase() || '';
        const isFinished = status.includes('finished') || status.includes('ft') || status.includes('aet') || status.includes('pen');
        
        if (matchDate === today && !isFinished) { // Consider live matches for today if not strictly finished
          currentDay.push(match);
        } else if (isFinished) {
          past.push(match);
          numMatchesPlayed++;
          const { home: homeScore, away: awayScore } = parseScore(match.state?.score?.current || match.score?.fulltime);

          if (homeScore !== null && awayScore !== null) {
            const currentScoreString = `${homeScore} - ${awayScore}`;
            scorelineCounts[currentScoreString] = (scorelineCounts[currentScoreString] || 0) + 1;
            totalGoals += homeScore + awayScore;

            if (homeScore > awayScore) homeWins++;
            else if (awayScore > homeScore) awayWins++;
            else draws++;

            let matchHadCleanSheet = false;
            if (homeScore === 0) {
              cleanSheetsAway++;
              matchHadCleanSheet = true;
            }
            if (awayScore === 0) {
              cleanSheetsHome++;
              matchHadCleanSheet = true;
            }
            if(matchHadCleanSheet) matchesWithCleanSheet++;

            const totalMatchGoals = homeScore + awayScore;
            if (totalMatchGoals > maxGoals) {
              maxGoals = totalMatchGoals;
              tempBiggestMatch = match;
            }
          }
        } else if (new Date(matchDate) > new Date(today) || status.includes('not started') || status.includes('scheduled') || status.includes('tba')) {
          upcoming.push(match);
        } else if (matchDate === today && isFinished) { // Finished today
           past.push(match); // Add to past as well for stats
           currentDay.push(match); // Keep in today's list for display
        }
      });
      
      setPastMatches(past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setUpcomingMatches(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setTodaysMatches(currentDay.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())); // Or by time

      const frequentScorelines = Object.entries(scorelineCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([score, count]) => ({ score, count }));

      if (numMatchesPlayed > 0) {
        setSeasonStats({
          totalMatchesPlayed: numMatchesPlayed,
          totalGoals,
          avgGoalsPerMatch: parseFloat((totalGoals / numMatchesPlayed).toFixed(2)),
          homeWins,
          awayWins,
          draws,
          homeWinPercentage: parseFloat(((homeWins / numMatchesPlayed) * 100).toFixed(1)),
          awayWinPercentage: parseFloat(((awayWins / numMatchesPlayed) * 100).toFixed(1)),
          drawPercentage: parseFloat(((draws / numMatchesPlayed) * 100).toFixed(1)),
          cleanSheetsTotal: cleanSheetsHome + cleanSheetsAway,
          matchesWithAtLeastOneCleanSheet: matchesWithCleanSheet,
          cleanSheetRate: parseFloat(((matchesWithCleanSheet / numMatchesPlayed) * 100).toFixed(1)),
          frequentScorelines,
          biggestMatch: tempBiggestMatch,
        });
      } else {
        setSeasonStats(null);
      }

    } catch (err) {
      console.error('Error fetching matches:', err);
      setErrorMatches('Failed to load match data.');
      setAllMatchesForSeason([]);
      setPastMatches([]);
      setUpcomingMatches([]);
      setTodaysMatches([]);
      setSeasonStats(null);
    } finally {
      setLoadingMatches(false);
    }
  }, [league?.id, selectedSeason, service]);

  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    onSeasonChange(season);
  };
  
  const renderCountryFlag = (leagueId: string | number) => {
    const countryCode = LEAGUE_COUNTRY_MAPPING[leagueId.toString()];
    return countryCode ? <img src={getCountryFlag(countryCode)} alt={countryCode} className="w-6 h-4 object-contain rounded-sm" /> : null;
  };


  if (!league || !league.id) {
    return (
      <div className="p-4 text-center">
        <p>League data not found.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leagues
        </Button>
      </div>
    );
  }
  
  // Placeholder for loading state
  // if (loadingStandings || loadingMatches) {
  //   return <div className="p-4 text-center">Loading league details...</div>;
  // }

  return (
    <div className="container mx-auto p-4">
      <Button onClick={onBack} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leagues
      </Button>

      <Card className="mb-6 shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-4 bg-gray-50 p-4 rounded-t-lg">
          <img src={league.logo || '/icons/default-league.png'} alt={league.name} className="w-16 h-16 object-contain" />
          <div>
            <div className="flex items-center space-x-2">
               {renderCountryFlag(league.id)}
               <h1 className="text-3xl font-bold text-gray-800">{league.name}</h1>
            </div>
            {league.country && <p className="text-sm text-gray-500">{league.country.name}</p>}
          </div>
          {league.seasons && league.seasons.length > 0 && (
            <div className="ml-auto">
              <Select value={selectedSeason || ''} onValueChange={handleSeasonChange}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {league.seasons.map((s) => (
                    <SelectItem key={s.season} value={s.season.toString()}>
                      {s.season.toString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-4 gap-2 mb-4">
          <TabsTrigger value="Home" className="flex items-center justify-center gap-2 py-3 text-sm font-medium">
            <Home className="h-5 w-5" /> Home
          </TabsTrigger>
          <TabsTrigger value="Standings" className="flex items-center justify-center gap-2 py-3 text-sm font-medium">
            <Trophy className="h-5 w-5" /> Standings
          </TabsTrigger>
          <TabsTrigger value="Results" className="flex items-center justify-center gap-2 py-3 text-sm font-medium">
            <ListChecks className="h-5 w-5" /> Results
          </TabsTrigger>
          <TabsTrigger value="Fixtures" className="flex items-center justify-center gap-2 py-3 text-sm font-medium">
            <CalendarDays className="h-5 w-5" /> Fixtures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Home">
          <Card>
            <CardHeader><CardTitle>Home Dashboard</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-lg">Welcome to the {league.name} league page for the {selectedSeason} season!</p>
              
              {(loadingMatches || loadingStandings) && <p className="text-center">Loading home content...</p>}
              {errorMatches && <p className="text-center text-red-500">{errorMatches}</p>}
              {errorStandings && <p className="text-center text-red-500">{errorStandings}</p>}

              {!loadingMatches && !errorMatches && (
                <>
                  <TodaysMatchesDisplay matches={todaysMatches} title="Today's Action" />
                  
                  {standings.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>Current Standings (Top 5)</CardTitle></CardHeader>
                      <CardContent><StandingsTable standings={standings.slice(0, 5)} /></CardContent>
                    </Card>
                  )}

                  <MatchList matches={upcomingMatches} title="Upcoming Fixtures (Next 5)" emptyMessage="No upcoming fixtures." maxItems={5} />
                  
                  {seasonStats && (
                    <SeasonStatsDisplay stats={seasonStats} leagueName={league.name} season={selectedSeason} />
                  )}
                  
                  <TopContributorsDisplay leagueName={league.name} season={selectedSeason} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="Standings">
          <Card>
            <CardHeader><CardTitle>League Standings</CardTitle></CardHeader>
            <CardContent>
              {loadingStandings && <p>Loading standings...</p>}
              {errorStandings && <p className="text-red-500">{errorStandings}</p>}
              {!loadingStandings && !errorStandings && standings.length > 0 && <StandingsTable standings={standings} />}
              {!loadingStandings && !errorStandings && standings.length === 0 && <p>No standings available for this season.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="Results">
          <Card>
            <CardHeader><CardTitle>Match Results</CardTitle></CardHeader>
            <CardContent>
              {loadingMatches && <p>Loading results...</p>}
              {errorMatches && <p className="text-red-500">{errorMatches}</p>}
              {!loadingMatches && !errorMatches && (
                <MatchList matches={pastMatches} emptyMessage="No results found for this season yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="Fixtures">
          <Card>
            <CardHeader><CardTitle>Upcoming Fixtures</CardTitle></CardHeader>
            <CardContent>
              {loadingMatches && <p>Loading fixtures...</p>}
              {errorMatches && <p className="text-red-500">{errorMatches}</p>}
              {!loadingMatches && !errorMatches && (
                <MatchList matches={upcomingMatches} emptyMessage="No upcoming fixtures found for this season." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Remove the standalone sections if they are now fully represented in the Home tab or specific tabs */}
      {/* Or keep them if they are meant to be separate detailed views below the tabs */}
      {/* For this iteration, the Home tab provides snippets, and other tabs provide full views. */}
      {/* The below cards for Today's Matches, Season Stats, Top Contributors are effectively duplicated by Home tab content */}
      {/* I will remove them to avoid redundancy for now. They can be added back if specific non-tabbed sections are desired. */}

      {/* 
       <Card className="mt-6">
        <CardHeader><CardTitle>Today's Matches ({selectedSeason})</CardTitle></CardHeader>
        <CardContent>
          {loadingMatches && <p>Loading today's matches...</p>}
          {errorMatches && <p className="text-red-500">{errorMatches}</p>}
          {!loadingMatches && !errorMatches && todaysMatches.length > 0 && (
             <TodaysMatchesDisplay matches={todaysMatches} />
          )}
          {!loadingMatches && !errorMatches && todaysMatches.length === 0 && <p>No matches scheduled for today in this league for the selected season.</p>}
        </CardContent>
      </Card>

       <Card className="mt-6">
        <CardHeader><CardTitle>Season Statistics ({selectedSeason})</CardTitle></CardHeader>
        <CardContent>
          {loadingMatches && <p>Loading season stats...</p>}
          {errorMatches && <p className="text-red-500">{errorMatches}</p>}
          {!loadingMatches && !errorMatches && seasonStats && (
             <SeasonStatsDisplay stats={seasonStats} leagueName={league.name} season={selectedSeason} />
          )}
           {!loadingMatches && !errorMatches && !seasonStats && <p>Not enough data to calculate season statistics.</p>}
        </CardContent>
      </Card>
      
       <Card className="mt-6">
        <CardHeader><CardTitle>Top Contributors ({selectedSeason})</CardTitle></CardHeader>
        <CardContent>
            <TopContributorsDisplay leagueName={league.name} season={selectedSeason} />
        </CardContent>
      </Card>
      */}

    </div>
  );
};

export default LeagueDetails; 