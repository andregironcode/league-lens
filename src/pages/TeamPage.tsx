import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Users, Target, BarChart2, Clock, Home, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import HighlightCard from '@/components/HighlightCard';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTeamHighlights, getTeamDetails, getActiveService } from '@/services/serviceAdapter';
import { MatchHighlight, Team, TeamDetails, Match, TableRow } from '@/types';
import { format } from 'date-fns';

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<MatchHighlight[]>([]);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("standings");
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        if (teamId) {
          const [highlightsData, details] = await Promise.all([
            getTeamHighlights(teamId),
            getTeamDetails(teamId, selectedSeason || undefined)
          ]);
          setHighlights(highlightsData);
          setTeamDetails(details);
          
          // Extract available seasons from the team data
          // This assumes the API response contains season information in league data
          const seasons: string[] = [];
          
          // Extract seasons from team's matches and fixtures
          if (details?.apiData) {
            // Try to find seasons in various parts of the raw API response
            const allLeagues = [
              details.league,
              ...Array.isArray(details.apiData.standings) ? 
                  details.apiData.standings.map((s: any) => s.league).filter(Boolean) : 
                  details.apiData.standings?.league ? [details.apiData.standings.league] : []
            ].filter(Boolean);
            
            // Extract unique seasons
            allLeagues.forEach((league: any) => {
              if (league && league.season && !seasons.includes(league.season)) {
                seasons.push(league.season);
              }
            });
            
            // Also check matches for seasons
            [...(details.fixtures || []), ...(details.recentMatches || [])].forEach((match: any) => {
              if (match?.league?.season && !seasons.includes(match.league.season)) {
                seasons.push(match.league.season);
              }
            });
          }
          
          // Sort seasons in descending order (newest first)
          const sortedSeasons = [...new Set(seasons)].sort().reverse();
          setAvailableSeasons(sortedSeasons);
          
          // Set current season as default if not already selected
          if (!selectedSeason && sortedSeasons.length > 0) {
            setSelectedSeason(sortedSeasons[0]); // Set most recent season as default
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, selectedSeason]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewFixtures = () => {
    // Navigate to fixtures tab
    setActiveTab("fixtures");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-highlight-800 rounded-full w-48 mb-6"></div>
          <div className="h-40 bg-highlight-800 rounded-3xl mb-6"></div>
          <div className="h-64 bg-highlight-800 rounded-3xl mb-8"></div>
        </div>
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 sm:px-6">
        <Header />
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-white">Team not found</h1>
          <button 
            onClick={handleGoBack}
            className="mt-4 flex items-center mx-auto text-sm font-medium px-4 py-2 rounded-lg bg-transparent text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-16">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <button 
          onClick={handleGoBack}
          className="flex items-center mb-6 text-sm font-medium hover:underline transition-colors text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </button>

        {/* Team Header */}
        <div className="rounded-3xl p-6 mb-8 border bg-black border-solid border-[#1B1B1B] flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 flex items-center justify-center bg-black/30 rounded-full p-2">
            <img 
              src={teamDetails.team.logo} 
              alt={teamDetails.team.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
              }}
            />
          </div>
          
          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-white mb-2">{teamDetails.team.name}</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              {teamDetails.europeanCompetition && (
                <div className="bg-[#333333] p-3 rounded-lg flex items-center">
                  <Trophy className="text-[#FFC30B] mr-2" size={20} />
                  <div>
                    <p className="text-gray-400 text-xs">{teamDetails.europeanCompetition}</p>
                    <p className="text-white font-bold">{teamDetails.europeanStanding || 'Group Stage'}</p>
                  </div>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="md:ml-auto">
                    <Calendar className="mr-2" size={18} />
                    {selectedSeason ? `Season ${selectedSeason}` : "Select Season"} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black border border-[#1B1B1B]">
                  {availableSeasons.length > 0 ? (
                    availableSeasons.map((season) => (
                      <DropdownMenuItem
                        key={season}
                        className={`${season === selectedSeason ? 'bg-yellow-400/10 text-yellow-400' : 'text-white'} cursor-pointer hover:bg-yellow-400/10 hover:text-yellow-400`}
                        onClick={() => setSelectedSeason(season)}
                      >
                        Season {season}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-gray-400">
                      No seasons available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Team Stats & Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <div className="flex justify-center mb-6">
            <TabsList className="flex justify-center gap-6 bg-transparent">
              <TabsTrigger 
                value="standings" 
                className="relative px-4 py-3 text-sm font-medium text-white transition-all duration-200 border-b-2 border-transparent data-[state=active]:border-yellow-400 hover:opacity-70"
              >
                Standings
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="relative px-4 py-3 text-sm font-medium text-white transition-all duration-200 border-b-2 border-transparent data-[state=active]:border-yellow-400 hover:opacity-70"
              >
                Results
              </TabsTrigger>
              <TabsTrigger 
                value="fixtures" 
                className="relative px-4 py-3 text-sm font-medium text-white transition-all duration-200 border-b-2 border-transparent data-[state=active]:border-yellow-400 hover:opacity-70"
              >
                Fixtures
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Highlights tab removed as requested */}
          
          <TabsContent value="standings">
            <div className="rounded-3xl p-6 border bg-black border-solid border-[#1B1B1B]">
              {/* Display all league standings the team has participated in */}
              
              {/* Main league table */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-6 text-center text-white">
                  {teamDetails.league?.name ? `${teamDetails.league.name.toUpperCase()} TABLE` : 'LEAGUE TABLE'}
                </h2>
                
                {teamDetails.leagueTable.length > 0 ? (
                  <StandingsTable standings={teamDetails.leagueTable} homeTeamId={teamId} />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Trophy size={32} className="mx-auto mb-2" />
                    <p className="text-white font-medium">No Standings Available</p>
                    <p className="text-sm">Standings data is not available for this league.</p>
                  </div>
                )}
              </div>
              
              {/* European competition table if available */}
              {teamDetails.europeanCompetition && (
                <div className="mb-8 pt-4 border-t border-[#1B1B1B]">
                  <h2 className="text-lg font-semibold mb-6 text-center text-white">
                    {teamDetails.europeanCompetition.toUpperCase()}
                  </h2>
                  
                  {teamDetails.europeanTable.length > 0 ? (
                    <StandingsTable standings={teamDetails.europeanTable} homeTeamId={teamId} />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Trophy size={32} className="mx-auto mb-2" />
                      <p className="text-white font-medium">No European Standings</p>
                      <p className="text-sm">European competition standings are not available.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Additional leagues the team might participate in */}
              {teamDetails.apiData?.standings && 
                (Array.isArray(teamDetails.apiData.standings) ? teamDetails.apiData.standings : [teamDetails.apiData.standings])
                  .filter((standingData: any) => {
                    // Only include valid standing data with league info
                    if (!standingData || !standingData.league) {
                      return false;
                    }
                    
                    // Filter out standings that are already shown (main league and European competition)
                    const leagueName = standingData.league.name;
                    return leagueName && 
                           leagueName !== teamDetails.league?.name && 
                           leagueName !== teamDetails.europeanCompetition;
                  })
                  .map((standingData: any, index: number) => {
                    // Extract standings array - handle different API response formats
                    const standings = standingData.standings || [];
                    let tableRows: any[] = [];
                    
                    // Handle nested array format
                    if (Array.isArray(standings) && standings.length > 0) {
                      // Some API responses have nested arrays, others don't
                      tableRows = Array.isArray(standings[0]) ? standings[0] : standings;
                    }
                    
                    if (tableRows.length === 0) {
                      return null;
                    }
                    
                    // Trust the raw API data structure - don't map to a specific format
                    // StandingsTable component already handles all possible API formats
                    
                    return (
                      <div key={`league-${index}`} className="mb-8 pt-4 border-t border-[#1B1B1B]">
                        <h2 className="text-lg font-semibold mb-6 text-center text-white">
                          {standingData.league.name.toUpperCase()}
                        </h2>
                        
                        {tableRows.length > 0 ? (
                          <StandingsTable standings={tableRows} homeTeamId={teamId} />
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Trophy size={32} className="mx-auto mb-2" />
                            <p className="text-white font-medium">No Standings Available</p>
                            <p className="text-sm">Standings data is not available for this league.</p>
                          </div>
                        )}
                      </div>
                    );
                  })
              }
            </div>
          </TabsContent>
          
          {/* New Recent Matches Tab */}
          <TabsContent value="results">
            <div className="rounded-3xl p-6 border bg-black border-solid border-[#1B1B1B]">
              <h2 className="text-lg font-semibold mb-6 text-center text-white">RECENT MATCHES</h2>
              
              {teamDetails.recentMatches && teamDetails.recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {/* Group matches by date */}
                  {Object.entries(
                    teamDetails.recentMatches.reduce((acc, match) => {
                      const date = format(new Date(match.date), 'yyyy-MM-dd');
                      if (!acc[date]) {
                        acc[date] = [];
                      }
                      acc[date].push(match);
                      return acc;
                    }, {} as Record<string, Match[]>)
                  )
                    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                    .map(([date, matches]) => (
                      <div key={date} className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                          {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                        </h3>
                        <div className="space-y-3">
                          {matches.map(match => (
                            <MatchCard key={match.id} match={match} showDate={false} />
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar size={32} className="mx-auto mb-2" />
                  <p className="text-white font-medium">No Recent Matches</p>
                  <p className="text-sm">No past matches found for this team.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="fixtures">
            <div className="rounded-3xl p-6 border bg-black border-solid border-[#1B1B1B]">
              <h2 className="text-lg font-semibold mb-6 text-center text-white">UPCOMING FIXTURES</h2>
              
              {teamDetails.fixtures.length > 0 ? (
                <div className="space-y-4">
                  {teamDetails.fixtures.map((fixture, index) => (
                    <div key={index} className="border border-solid border-[#1B1B1B] bg-black/30 p-4 rounded-lg hover:bg-black/50 transition-colors">
                      <div className="text-gray-400 text-sm mb-2">{fixture.competition}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                            <img 
                              src={fixture.homeTeam.logo} 
                              alt={fixture.homeTeam.name} 
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                          </div>
                          <span className={`ml-2 font-medium ${fixture.homeTeam.id === teamId ? 'text-yellow-400' : 'text-white'}`}>
                            {fixture.homeTeam.name}
                          </span>
                        </div>
                        
                        <span className="text-white px-3 py-1 rounded border border-solid border-[#333333] text-sm">
                          vs
                        </span>
                        
                        <div className="flex items-center">
                          <span className={`mr-2 font-medium ${fixture.awayTeam.id === teamId ? 'text-yellow-400' : 'text-white'}`}>
                            {fixture.awayTeam.name}
                          </span>
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                            <img 
                              src={fixture.awayTeam.logo} 
                              alt={fixture.awayTeam.name} 
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 text-sm border-t border-[#1B1B1B] pt-3">
                        <div className="text-gray-400">
                          <Calendar size={14} className="inline mr-1" />
                          {new Date(fixture.date).toLocaleDateString('en-US', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })}
                        </div>
                        <div className="text-gray-400">
                          <Clock size={14} className="inline mr-1" />
                          {new Date(fixture.date).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Calendar size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-white font-medium">No Upcoming Fixtures</p>
                  <p className="text-sm text-gray-400">No upcoming fixtures available for this team</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeamPage;
