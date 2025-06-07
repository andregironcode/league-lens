import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell, Target, RefreshCw, Square, Users, Video, BarChart2, Goal, Replace, Info, Home, Trophy } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getStandingsForLeague, getLastFiveGames, getHeadToHead, getHighlightsForMatch } from '@/services/serviceAdapter';
import { MatchHighlight, EnhancedMatchHighlight, Player, Match, MatchEvent, StandingsRow } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { formatSeason } from '../utils/seasonFormatting';
import StandingsTable from '@/components/StandingsTable';
import TeamFormStats from '@/components/TeamFormStats';
import HeadToHeadStats from '@/components/HeadToHeadStats';
import MatchTimeline from '@/components/match-details/MatchTimeline';
import ScorelineTimeline from '@/components/match-details/ScorelineTimeline';
import MatchStatistics from '@/components/match-details/MatchStatistics';
import TeamLineups from '@/components/match-details/TeamLineups';
import HighlightsCarousel from '@/components/match-details/HighlightsCarousel';

// Helper component for displaying a single player
const PlayerDisplay = ({ player }: { player: Player }) => (
  <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gray-800/60">
    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
      {player.number}
    </div>
    <div>
      <div className="font-medium text-white text-sm leading-tight">{player.name}</div>
      <p className="text-sm font-light text-gray-400">{player.position}</p>
    </div>
  </div>
);

const parseEventTime = (time: string): number => {
  if (!time) return 999;
  const cleanedTime = time.replace(/'/g, '');
  if (cleanedTime.includes('+')) {
    const parts = cleanedTime.split('+').map(p => parseInt(p, 10));
    return parts.reduce((a, b) => a + b, 0);
  }
  return parseInt(cleanedTime, 10) || 999;
};

const getEventDisplay = (event: MatchEvent) => {
  const { type, player, assist, substituted } = event;

  let icon: React.ReactNode;
  let text: React.ReactNode;

  const lowerCaseType = type.toLowerCase();

  if (lowerCaseType.includes('goal')) {
    icon = <Goal className={lowerCaseType.includes('own') ? "text-red-500" : "text-yellow-400"} size={16} />;
    text = (
      <p>
        <span className="font-bold">{player}</span>
        {assist && <span className="text-xs text-gray-400"> (assist: {assist})</span>}
        {lowerCaseType.includes('own') && <span className="text-red-500"> (Own Goal)</span>}
      </p>
    );
  } else if (lowerCaseType.includes('card')) {
    icon = <Square size={12} className={lowerCaseType.includes('yellow') ? "text-yellow-400 fill-current" : "text-red-500 fill-current"} />;
    text = <p className="font-bold">{player}</p>;
  } else if (lowerCaseType.includes('subst')) {
    icon = <Replace className="text-blue-400" size={16} />;
    text = (
      <div>
        <p className="text-green-400 text-sm">In: <span className="font-semibold">{player}</span></p>
        {substituted && <p className="text-red-400 text-xs">Out: <span className="font-semibold">{substituted}</span></p>}
      </div>
    );
  } else {
    // Fallback for other event types
    icon = <Info size={16} className="text-gray-400" />;
    text = <p>{player} ({type})</p>;
  }

  return { icon, text };
};

// Removed inline TeamLineupDisplay - now using imported component

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<EnhancedMatchHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoHighlightsList, setVideoHighlightsList] = useState<MatchHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [homeTeamForm, setHomeTeamForm] = useState<Match[]>([]);
  const [awayTeamForm, setAwayTeamForm] = useState<Match[]>([]);
  const [h2hData, setH2hData] = useState<Match[]>([]);
  const [formAndH2hLoading, setFormAndH2hLoading] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setError("Match ID is missing.");
      setLoading(false);
      return;
    }

    const fetchMatchAndHighlights = async () => {
      setLoading(true);
      setError(null);
      setHighlightsLoading(true);
      setStandingsLoading(true);

      try {
        const matchData = await getMatchById(id);
        setMatch(matchData);

        if (matchData?.videoUrl) {
          // This seems to be for a single primary highlight, keeping logic
        }

        // Calculate the season using proper football season logic
        // Football seasons span two years: 2024-25 season runs from Aug 2024 to May 2025
        const matchDate = new Date(matchData.date);
        const matchYear = matchDate.getFullYear();
        const matchMonth = matchDate.getMonth() + 1; // getMonth() is 0-indexed
        
        console.log(`[MatchDetails] Season calculation:`);
        console.log(`[MatchDetails] - Match date: ${matchData.date}`);
        console.log(`[MatchDetails] - Match year: ${matchYear}, month: ${matchMonth}`);
        
        // If match is in Jan-May, it belongs to the previous year's season
        // If match is in Jun-Dec, it belongs to the current year's season
        const seasonYear = matchMonth <= 5 ? matchYear - 1 : matchYear;
        
        console.log(`[MatchDetails] - Season year (start): ${seasonYear} (month <= 5: ${matchMonth <= 5})`);
        
        // Create formatted season display (e.g., "2024-25")
        const formattedSeason = formatSeason(seasonYear);
        
        // Extract API season from formatted season (e.g., "2024-25" -> "2024")
        const apiSeason = seasonYear.toString();
        
        console.log(`[MatchDetails] - Formatted season: ${formattedSeason}`);
        console.log(`[MatchDetails] - API season: ${apiSeason}`);
        
        if (matchData?.competition?.id) {
          try {
            console.log(`[MatchDetails] Fetching standings for competition ID: ${matchData.competition.id}`);
            console.log(`[MatchDetails] Match date: ${matchData.date}`);
            console.log(`[MatchDetails] Calculated season: ${formattedSeason} (API: ${apiSeason})`);
            
            const standingsResponse = await getStandingsForLeague(matchData.competition.id, apiSeason);
            console.log(`[MatchDetails] Raw standings response:`, standingsResponse);
            
            if (standingsResponse && (standingsResponse.groups || standingsResponse.standings || standingsResponse.data)) {
              // Handle response format - API returns groups with standings
              let standingsData = [];
              
              if (standingsResponse.groups && Array.isArray(standingsResponse.groups) && standingsResponse.groups.length > 0) {
                // Groups format (most common for leagues)
                standingsData = standingsResponse.groups[0].standings || [];
                console.log(`[MatchDetails] Using groups format - ${standingsData.length} teams`);
              } else if (Array.isArray(standingsResponse)) {
                // Direct array format
                standingsData = standingsResponse;
                console.log(`[MatchDetails] Using direct array format - ${standingsData.length} teams`);
              } else if (standingsResponse.data && Array.isArray(standingsResponse.data)) {
                // Data array format
                standingsData = standingsResponse.data;
                console.log(`[MatchDetails] Using data array format - ${standingsData.length} teams`);
              } else if (standingsResponse.league && standingsResponse.league.standings) {
                // League.standings format
                standingsData = standingsResponse.league.standings[0] || [];
                console.log(`[MatchDetails] Using league.standings format - ${standingsData.length} teams`);
              } else if (standingsResponse.standings && Array.isArray(standingsResponse.standings)) {
                // Direct standings format
                standingsData = standingsResponse.standings;
                console.log(`[MatchDetails] Using direct standings format - ${standingsData.length} teams`);
              } else if (standingsResponse[0] && standingsResponse[0].standings) {
                // First element has standings
                standingsData = standingsResponse[0].standings;
                console.log(`[MatchDetails] Using first element standings format - ${standingsData.length} teams`);
              }
              
              // Map the API response format to our expected StandingsRow format
              const mappedStandings: StandingsRow[] = standingsData.map((standing: any, index: number) => {
                const totalStats = standing.total || {};
                
                return {
                  position: standing.position || index + 1,
                  team: {
                    id: standing.team?.id || '',
                    name: standing.team?.name || '',
                    logo: standing.team?.logo || ''
                  },
                  points: standing.points || 0,
                  played: totalStats.games || totalStats.played || 0,
                  won: totalStats.wins || 0,
                  drawn: totalStats.draws || 0,
                  lost: totalStats.loses || totalStats.lost || 0, // Note: API uses "loses"
                  goalsFor: totalStats.scoredGoals || totalStats.goalsFor || 0,
                  goalsAgainst: totalStats.receivedGoals || totalStats.goalsAgainst || 0,
                  goalDifference: (totalStats.scoredGoals || 0) - (totalStats.receivedGoals || 0)
                };
              });
              
              console.log(`[MatchDetails] Successfully mapped ${mappedStandings.length} teams for standings`);
              setStandings(mappedStandings);
            } else {
              console.log(`[MatchDetails] No standings found in response`);
              setStandings([]); // No standings available
            }
          } catch (standingsError) {
            console.error("[MatchDetails] Failed to fetch standings:", standingsError);
            
            // Smart fallback: If current season fails with 404, try previous season
            if (standingsError.message && standingsError.message.includes('404')) {
              const fallbackSeason = (seasonYear - 1).toString();
              console.log(`[MatchDetails] Season ${apiSeason} not available, trying fallback to ${fallbackSeason}...`);
              
              try {
                const fallbackResponse = await getStandingsForLeague(matchData.competition.id, fallbackSeason);
                console.log(`[MatchDetails] Fallback response:`, fallbackResponse);
                
                if (fallbackResponse && (fallbackResponse.groups || fallbackResponse.standings || fallbackResponse.data)) {
                  // Use the same processing logic as above
                  let standingsData = [];
                  
                  if (fallbackResponse.groups && Array.isArray(fallbackResponse.groups) && fallbackResponse.groups.length > 0) {
                    standingsData = fallbackResponse.groups[0].standings || [];
                  } else if (Array.isArray(fallbackResponse)) {
                    standingsData = fallbackResponse;
                  } else if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
                    standingsData = fallbackResponse.data;
                  } else if (fallbackResponse.league && fallbackResponse.league.standings) {
                    standingsData = fallbackResponse.league.standings[0] || [];
                  } else if (fallbackResponse.standings && Array.isArray(fallbackResponse.standings)) {
                    standingsData = fallbackResponse.standings;
                  } else if (fallbackResponse[0] && fallbackResponse[0].standings) {
                    standingsData = fallbackResponse[0].standings;
                  }
                  
                  const mappedStandings: StandingsRow[] = standingsData.map((standing: any, index: number) => {
                    const totalStats = standing.total || {};
                    
                    return {
                      position: standing.position || index + 1,
                      team: {
                        id: standing.team?.id || '',
                        name: standing.team?.name || '',
                        logo: standing.team?.logo || ''
                      },
                      points: standing.points || 0,
                      played: totalStats.games || totalStats.played || 0,
                      won: totalStats.wins || 0,
                      drawn: totalStats.draws || 0,
                      lost: totalStats.loses || totalStats.lost || 0,
                      goalsFor: totalStats.scoredGoals || totalStats.goalsFor || 0,
                      goalsAgainst: totalStats.receivedGoals || totalStats.goalsAgainst || 0,
                      goalDifference: (totalStats.scoredGoals || 0) - (totalStats.receivedGoals || 0)
                    };
                  });
                  
                  console.log(`[MatchDetails] Fallback success! Using ${fallbackSeason} data (${mappedStandings.length} teams)`);
                  setStandings(mappedStandings);
                  return; // Exit successfully
                }
              } catch (fallbackError) {
                console.error(`[MatchDetails] Fallback to ${fallbackSeason} also failed:`, fallbackError);
              }
            }
            
            // If we get here, both the original request and fallback failed
            setStandings([]); // Set to empty on error
          }
        } else {
          console.log(`[MatchDetails] No competition ID available for standings`);
          setStandings([]); // No league info, so no standings
        }

        // Fetch video highlights list
        if (matchData) {
          setHighlightsLoading(true);
          try {
            const highlightsData = await getHighlightsForMatch(id);
            setVideoHighlightsList(highlightsData);
            console.log(`[MatchDetails] Highlights fetched:`, highlightsData.length, 'highlights');
          } catch (highlightsError) {
            console.log(`[MatchDetails] No highlights available for match ${id}:`, highlightsError.message);
            setVideoHighlightsList([]); // Set empty array instead of keeping loading state
          } finally {
            setHighlightsLoading(false);
          }
        } else {
          setError("Match not found.");
        }

        // Fetch form and H2H data in parallel
        setFormAndH2hLoading(true);
        try {
          console.log(`[MatchDetails] Fetching form data for teams:`, matchData.homeTeam.id, matchData.awayTeam.id);
          
          const [homeForm, awayForm, h2h] = await Promise.all([
            getLastFiveGames(matchData.homeTeam.id).catch(err => {
              console.log(`[MatchDetails] Home team form not available:`, err.message);
              return [];
            }),
            getLastFiveGames(matchData.awayTeam.id).catch(err => {
              console.log(`[MatchDetails] Away team form not available:`, err.message);
              return [];
            }),
            getHeadToHead(matchData.homeTeam.id, matchData.awayTeam.id).catch(err => {
              console.log(`[MatchDetails] Head-to-head data not available:`, err.message);
              return [];
            }),
          ]);
          
          console.log(`[MatchDetails] Form data results:`, {
            homeFormGames: homeForm.length,
            awayFormGames: awayForm.length,
            h2hGames: h2h.length
          });
          
          setHomeTeamForm(homeForm);
          setAwayTeamForm(awayForm);
          setH2hData(h2h);
        } catch (error) {
          console.error("Failed to fetch form and H2H data:", error);
          // Set to empty arrays on error to avoid crashing the component
          setHomeTeamForm([]);
          setAwayTeamForm([]);
          setH2hData([]);
        } finally {
          setFormAndH2hLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch match details:", err);
        setError("Could not load match details. Please try again later.");
        toast({
          title: "Error Loading Match",
          description: "There was a problem retrieving the details for this match.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setHighlightsLoading(false);
        setStandingsLoading(false);
      }
    };

    fetchMatchAndHighlights();
  }, [id, toast]);

  const getMatchTiming = () => {
    if (!match) return { status: 'unknown' };
    
    const now = new Date();
    const matchDate = new Date(match.date);
    const diffMs = now.getTime() - matchDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < -60) return { status: 'preview' };
    if (diffMinutes >= -60 && diffMinutes < 0) return { status: 'imminent' };
    return { status: 'fullTime' };
  };

  const handleGoBack = () => navigate(-1);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Match: ${match?.homeTeam.name} vs ${match?.awayTeam.name}`,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      toast({ title: "Sharing not supported or failed.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full mx-auto flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-l-4 border-yellow-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-semibold">Loading Match Details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error || "Could not find match data."}</p>
          <button
            onClick={handleGoBack}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <ArrowLeft className="mr-2 -ml-1 h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { status } = getMatchTiming();
  const isFullTime = status === 'fullTime';
  // You can define other states like isPreview, isImminent if you build out those views
  
  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button onClick={handleGoBack} className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            Back to Matches
          </button>
        </div>
        
        {/* We will focus on the FullTime view as requested */}
        {isFullTime ? (
          <div className="mb-8 w-full space-y-6">
            {/* Teams and Final Score - Main Box */}
            <div 
              className="rounded-3xl overflow-hidden p-6 relative"
              style={{
                background: 'linear-gradient(15deg, #000000 0%, #000000 60%, #1F1F1F 100%)',
                border: '1px solid #1B1B1B',
              }}
            >
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <img src={match.competition.logo} alt={match.competition.name} className="w-5 h-5 object-contain rounded-full bg-white p-0.5" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{match.competition.name}</div></div>
              </div>
              <div className="absolute top-4 right-4">
                <button onClick={handleShare} className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-white/10">
                  <Share2 className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center mt-12 mb-6">
                <div className="flex items-center justify-center mb-6 w-full">
                  <div className="text-center flex-1">
                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
                    <div className="text-white font-medium text-lg">{match.homeTeam.name}</div>
                  </div>
                  <div className="text-center px-8">
                    <div className="font-bold mb-2" style={{ color: '#FF4C4C', fontSize: '16px' }}>FULL TIME</div>
                    <div className="text-center font-bold mb-2" style={{ color: '#FFFFFF' }}>
                      {(() => {
                        const scoreText = match.score?.current || 
                         (match.score?.home !== undefined && match.score?.away !== undefined 
                           ? `${match.score.home} - ${match.score.away}` 
                           : '0 - 0');
                        
                        // Split the score to style numbers and dash separately
                        const parts = scoreText.split(' - ');
                        if (parts.length === 2) {
                          return (
                            <>
                              <span style={{ fontSize: '45px' }}>{parts[0]}</span>
                              <span style={{ fontSize: '48px' }}> - </span>
                              <span style={{ fontSize: '45px' }}>{parts[1]}</span>
                            </>
                          );
                        }
                        return <span style={{ fontSize: '45px' }}>{scoreText}</span>;
                      })()}
                    </div>
                    {/* Show penalty scores if available */}
                    {match.score?.penalties && (
                      <div className="text-gray-400 text-sm mb-3">
                        ({match.score.penalties})
                      </div>
                    )}
                  </div>
                  <div className="text-center flex-1">
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
                    <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
                  </div>
                </div>
                
                <ScorelineTimeline 
                  homeTeam={match.homeTeam} 
                  awayTeam={match.awayTeam} 
                  matchEvents={match.events || []} 
                  matchDate={match.date}
                />
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex justify-center gap-6" style={{ backgroundColor: '#000000' }}>
              {[
                { key: 'home', label: 'Home' },
                { key: 'lineups', label: 'Lineups' },
                { key: 'stats', label: 'Stats' },
                { key: 'standings', label: 'Standings' },
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
            
            {/* TAB CONTENT */}
            <div className="pt-2">
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* Highlights Section */}
                  <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                    <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH HIGHLIGHTS</h4>
                    <HighlightsCarousel highlights={videoHighlightsList} loading={highlightsLoading} />
                  </div>

                  {/* Form and H2H Section */}
                  <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                    <h3 className="text-lg font-bold text-white text-center mb-6">Match Preview</h3>
                    {formAndH2hLoading ? (
                      <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                    ) : (homeTeamForm.length > 0 || awayTeamForm.length > 0 || h2hData.length > 0) ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <TeamFormStats matches={homeTeamForm} teamId={match.homeTeam.id} teamName={match.homeTeam.name} />
                          <TeamFormStats matches={awayTeamForm} teamId={match.awayTeam.id} teamName={match.awayTeam.name} />
                        </div>
                        <div className="my-8 border-t border-gray-800"></div>
                        <HeadToHeadStats
                          matches={h2hData}
                          homeTeamId={match.homeTeam.id}
                          homeTeamName={match.homeTeam.name}
                          awayTeamId={match.awayTeam.id}
                          awayTeamName={match.awayTeam.name}
                        />
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Target size={32} className="mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">Match Preview Data Unavailable</p>
                        <p className="text-sm max-w-md mx-auto">
                          Team form statistics and head-to-head records are not available through the current API endpoints.
                          This feature will be available once additional endpoints are implemented.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'lineups' && (
                <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                  <TeamLineups lineups={match.lineups} homeTeamName={match.homeTeam.name} awayTeamName={match.awayTeam.name} />
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                  <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
                  <MatchStatistics statistics={match.statistics || []} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
                </div>
              )}

              {activeTab === 'standings' && (
                <div className="space-y-8">
                  {/* Standings Section */}
                  <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                    <h4 className="text-lg font-semibold mb-6 text-center text-white">LEAGUE STANDINGS</h4>
                    {standingsLoading ? (
                      <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                    ) : (
                      <StandingsTable standings={standings} homeTeamId={match.homeTeam.id} awayTeamId={match.awayTeam.id} />
                    )}
                  </div>

                  {/* Timeline Section */}
                  <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                    <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH TIMELINE</h4>
                    <MatchTimeline homeTeam={match.homeTeam} awayTeam={match.awayTeam} matchEvents={match.events || []} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold">Match Status: {status}</h2>
            <p className="text-gray-400 mt-2">This view is not yet implemented. Only the 'Full-Time' view has been built as requested.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default MatchDetails; 