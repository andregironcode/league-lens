import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Share2, Shirt, BarChart4, MapPin, Bell, Target, RefreshCw, Square, Users, Video, BarChart2, Goal, Replace, Info, Home, Trophy } from 'lucide-react';
import Header from '@/components/Header';
import { getMatchById, getStandingsForLeague, getLastFiveGames, getHeadToHead } from '@/services/serviceAdapter';
import { highlightlyService } from '@/services/highlightlyService';
import { MatchHighlight, EnhancedMatchHighlight, Player, Match, MatchEvent, StandingsRow } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import StandingsTable from '@/components/StandingsTable';
import TeamFormStats from '@/components/TeamFormStats';
import HeadToHeadStats from '@/components/HeadToHeadStats';

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

const MatchTimeline: React.FC<{ events: MatchEvent[], homeTeamId: string }> = ({ events, homeTeamId }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Clock size={24} className="mx-auto mb-2" />
        No timeline events available for this match.
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => parseEventTime(a.time) - parseEventTime(b.time));

  return (
    <div className="w-full max-h-96 overflow-y-auto relative pt-4 pr-2">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5 bg-gray-700/50" />
      {sortedEvents.map((event, index) => {
        const isHomeEvent = event.team.id.toString() === homeTeamId;
        const { icon, text } = getEventDisplay(event);

        if (!text) return null;

        const EventContent = () => (
          <div className="flex items-center gap-3">
            <div className="flex-grow">{text}</div>
            <div className="w-8 h-8 flex-shrink-0 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700/80">
              {icon}
            </div>
          </div>
        );

        return (
          <div key={index} className="flex items-center my-2">
            {/* Home Event */}
            <div className="w-1/2 pr-6 text-right">
              {isHomeEvent && <EventContent />}
            </div>

            {/* Time Marker */}
            <div className="w-10 h-6 rounded-full bg-gray-700/80 text-white text-xs font-mono flex items-center justify-center z-10 border-2 border-gray-900">
              {event.time}
            </div>

            {/* Away Event */}
            <div className="w-1/2 pl-6 text-left">
              {!isHomeEvent && <EventContent />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper component for displaying a full team lineup
const TeamLineupDisplay = ({ lineup, teamName }: { lineup?: { formation: string; initialLineup: Player[][]; substitutes: Player[] }, teamName: string }) => {
  if (!lineup || !lineup.initialLineup || lineup.initialLineup.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 bg-gray-900/50 rounded-lg">
        <Users size={32} className="mx-auto mb-3" />
        <p className="font-semibold text-white">Lineup Unavailable</p>
        <p className="text-sm">Lineup information is not yet available for {teamName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-lg font-semibold text-white">{teamName}</h4>
        <p className="text-yellow-400 font-bold text-md">Formation: {lineup.formation || 'N/A'}</p>
      </div>
      
      <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/40" style={{
          backgroundImage: `url('/football-pitch.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        <div className="space-y-4 min-h-[300px] flex flex-col justify-around">
          {lineup.initialLineup.map((row: Player[], rowIndex: number) => (
            <div key={rowIndex} className="flex justify-around items-center">
              {row.map((player: Player) => (
                <div key={player.number} className="text-center w-28">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto border-2 border-white/70 shadow-md">
                    {player.number}
                  </div>
                  <p className="text-white text-xs mt-1 bg-black/60 px-2 py-0.5 rounded-full truncate">{player.name}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-3">Substitutes</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lineup.substitutes?.map((player: Player) => (
            <PlayerDisplay key={player.number} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
};

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
        const formattedSeason = `${seasonYear}-${(seasonYear + 1).toString().slice(-2)}`;
        
        // Extract API season from formatted season (e.g., "2024-25" -> "2024")
        const apiSeason = formattedSeason.split('-')[0];
        
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
            const highlightsData = await highlightlyService.getHighlightsForMatch(id);
            setVideoHighlightsList(highlightsData);
          } catch (highlightsError) {
            console.error("Failed to fetch match highlights:", highlightsError);
            toast({
              title: "Could Not Load Highlights",
              description: "There was an issue fetching the match highlights.",
              variant: "destructive",
            });
          } finally {
            setHighlightsLoading(false);
          }
        } else {
          setError("Match not found.");
        }

        // Fetch form and H2H data in parallel
        setFormAndH2hLoading(true);
        try {
          const [homeForm, awayForm, h2h] = await Promise.all([
            getLastFiveGames(matchData.homeTeam.id),
            getLastFiveGames(matchData.awayTeam.id),
            getHeadToHead(matchData.homeTeam.id, matchData.awayTeam.id),
          ]);
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
    if (!match) return { status: 'loading' };

    const matchDate = new Date(match.date);
    const now = new Date();
    const timeDiff = matchDate.getTime() - now.getTime();
    const hoursUntilMatch = timeDiff / (1000 * 60 * 60);

    if (match.status?.long === 'Match Finished' || match.status?.short === 'FT') {
        return { status: 'fullTime' };
    }
    if (match.status?.long?.includes('In Play') || match.status?.short === 'LIVE') {
        return { status: 'live' };
    }
    if (hoursUntilMatch > 1) {
        return { status: 'preview', hours: Math.floor(hoursUntilMatch) };
    }
    if (hoursUntilMatch > 0) {
        return { status: 'imminent', minutes: Math.floor(hoursUntilMatch * 60) };
    }
    // Default for past matches that might not be explicitly "Finished"
    return { status: 'fullTime' };
  };

  const isValidVideoUrl = (url: string): boolean => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const getVideoEmbedUrl = (url: string): string => {
    if (!isValidVideoUrl(url)) return '';
    try {
      const videoId = new URL(url).searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    } catch {
      return '';
    }
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
              className="rounded-xl overflow-hidden p-6 relative"
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
                    <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">FULL TIME</div>
                    <div className="text-white text-6xl font-bold mb-2">{match.score?.home ?? 0} - {match.score?.away ?? 0}</div>
                    <div className="text-gray-400 text-sm mb-3">FINAL SCORE</div>
                  </div>
                  <div className="text-center flex-1">
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />
                    <div className="text-white font-medium text-lg">{match.awayTeam.name}</div>
                  </div>
                </div>
                
                <MatchTimeline events={match.events || []} homeTeamId={match.homeTeam.id} />
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-2 flex justify-around sm:justify-center space-x-1 sm:space-x-2">
              {[
                { key: 'home', label: 'Home', icon: Home },
                { key: 'lineups', label: 'Lineups', icon: Users },
                { key: 'stats', label: 'Stats', icon: BarChart2 },
                { key: 'standings', label: 'Standings', icon: Trophy },
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
            
            {/* TAB CONTENT */}
            <div className="pt-2">
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* Highlights Section */}
                  <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                    <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH HIGHLIGHTS</h4>
                    {highlightsLoading ? (
                      <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                    ) : videoHighlightsList.length > 0 ? (
                      <div className="space-y-6">
                        {videoHighlightsList.slice(0, 3).map((highlight, index) => (
                          isValidVideoUrl(highlight.videoUrl) && (
                            <div key={highlight.id || index} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/50">
                              <div className="aspect-video bg-black relative">
                                {highlight.videoUrl.includes('youtube.com') || highlight.videoUrl.includes('youtu.be') ? (
                                  <iframe
                                    className="w-full h-full"
                                    src={getVideoEmbedUrl(highlight.videoUrl)}
                                    title={highlight.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <a href={highlight.videoUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                                      <img src={highlight.thumbnailUrl || '/placeholder-thumbnail.jpg'} alt={highlight.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => (e.currentTarget.src = '/placeholder-thumbnail.jpg')} />
                                      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-center justify-center">
                                        <Video className="text-white w-12 h-12" />
                                      </div>
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h5 className="text-white font-semibold mb-2" title={highlight.title}>{highlight.title}</h5>
                                <div className="flex justify-between items-center text-sm text-gray-400">
                                  <span>{highlight.duration || 'N/A'}</span>
                                  <span>{highlight.views?.toLocaleString() || 0} views</span>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                        {videoHighlightsList.length > 3 && (
                          <div className="text-center mt-4">
                            <p className="text-gray-400 text-sm">
                              Showing {Math.min(3, videoHighlightsList.length)} of {videoHighlightsList.length} highlights
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400"><Eye size={32} className="mx-auto mb-2" /><p className="text-white font-medium">No Highlights Available</p><p className="text-sm">There are currently no highlight clips for this match.</p></div>
                    )}
                  </div>

                  {/* Form and H2H Section */}
                  <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                    <h3 className="text-lg font-bold text-white text-center mb-6">Match Preview</h3>
                    {formAndH2hLoading ? (
                      <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                    ) : (
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
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'lineups' && (
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                      <TeamLineupDisplay lineup={match.lineups?.homeTeam} teamName={match.homeTeam.name} />
                      <TeamLineupDisplay lineup={match.lineups?.awayTeam} teamName={match.awayTeam.name} />
                   </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                  <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
                  {match.statistics && match.statistics.length >= 2 ? (
                     <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex items-center space-x-3"><img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8 object-contain" /><span className="text-white font-medium text-sm">{match.homeTeam.name}</span></div>
                           <div className="flex items-center space-x-3"><span className="text-white font-medium text-sm">{match.awayTeam.name}</span><img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8 object-contain" /></div>
                        </div>
                        <div className="space-y-4">
                          {match.statistics[0].statistics.map((stat, index) => {
                              const homeValue = stat.value;
                              const awayValue = match.statistics![1]?.statistics[index]?.value || 0;
                              let homePercent = 50, awayPercent = 50;
                              if (typeof homeValue === 'number' && typeof awayValue === 'number') {
                                const total = homeValue + awayValue;
                                if (total > 0) {
                                  homePercent = (homeValue / total) * 100;
                                  awayPercent = (awayValue / total) * 100;
                                }
                              } else if (typeof homeValue === 'string' && homeValue.includes('%')) {
                                const homeVal = parseFloat(homeValue);
                                const awayVal = typeof awayValue === 'string' ? parseFloat(awayValue) : 0;
                                homePercent = homeVal;
                                awayPercent = awayVal;
                              }
                              
                              const homeIsHigher = typeof homeValue === 'number' && typeof awayValue === 'number' ? homeValue >= awayValue : false;
                              const awayIsHigher = typeof homeValue === 'number' && typeof awayValue === 'number' ? awayValue > homeValue : false;
                              
                              return (
                                <div key={index} className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-medium ${homeIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>{homeValue}</span>
                                    <span className="text-sm font-medium text-white text-center flex-1 mx-4">{stat.displayName}</span>
                                    <span className={`text-sm font-medium ${awayIsHigher ? 'text-yellow-400' : 'text-gray-400'}`}>{awayValue}</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                    <div className={`h-full ${homeIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} style={{ width: `${homePercent}%` }}></div>
                                    <div className={`h-full ${awayIsHigher ? 'bg-yellow-400' : 'bg-gray-600'}`} style={{ width: `${awayPercent}%` }}></div>
                                  </div>
                                </div>
                              );
                           })}
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-8 text-gray-400"><BarChart4 size={32} className="mx-auto mb-2" /><p>Match statistics are not yet available.</p></div>
                  )}
                </div>
              )}

              {activeTab === 'standings' && (
                <div className="space-y-8">
                  {/* Standings Section */}
                  <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                    <h4 className="text-lg font-semibold mb-6 text-center text-white">LEAGUE STANDINGS</h4>
                    {standingsLoading ? (
                      <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                    ) : (
                      <StandingsTable standings={standings} homeTeamId={match.homeTeam.id} awayTeamId={match.awayTeam.id} />
                    )}
                  </div>

                  {/* Timeline Section */}
                  <div className="rounded-xl p-6 border bg-black border-solid border-[#1B1B1B]">
                    <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH TIMELINE</h4>
                    <MatchTimeline events={match.events || []} homeTeamId={match.homeTeam.id} />
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