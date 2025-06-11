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
import ScorelineBanner, { TimingState } from '@/components/match-details/ScorelineBanner';

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
  const [timing, setTiming] = useState<TimingState>({ state: 'unknown' });
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
        
        // Check for competition ID with better logging
        const competitionId = matchData?.competition?.id;
        console.log(`[MatchDetails] Competition data:`, {
          id: competitionId,
          name: matchData?.competition?.name,
          fullCompetition: matchData?.competition
        });
        
        if (competitionId) {
          try {
            console.log(`[MatchDetails] Fetching standings for competition ID: ${competitionId}`);
            console.log(`[MatchDetails] Match date: ${matchData.date}`);
            console.log(`[MatchDetails] Calculated season: ${formattedSeason} (API: ${apiSeason})`);
            
            const standingsResponse = await getStandingsForLeague(competitionId, apiSeason);
            console.log(`[MatchDetails] Raw standings response:`, standingsResponse);
            
            if (standingsResponse && (standingsResponse.groups || standingsResponse.standings || standingsResponse.data)) {
              // Trust the API response structure completely
              let standingsData = [];
              
              if (standingsResponse.groups && Array.isArray(standingsResponse.groups) && standingsResponse.groups.length > 0) {
                // Use groups format as-is
                standingsData = standingsResponse.groups[0].standings || [];
              } else if (standingsResponse.standings && Array.isArray(standingsResponse.standings)) {
                // Use direct standings format as-is
                standingsData = standingsResponse.standings;
              } else {
                // Default to empty if structure is unexpected
                standingsData = [];
              }
              
              // Use API data directly without mapping
              setStandings(standingsData);
              console.log(`[MatchDetails] Successfully loaded ${standingsData.length} teams for standings`);
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
                const fallbackResponse = await getStandingsForLeague(competitionId, fallbackSeason);
                console.log(`[MatchDetails] Fallback response:`, fallbackResponse);
                
                if (fallbackResponse && (fallbackResponse.groups || fallbackResponse.standings || fallbackResponse.data)) {
                  // Trust the API fallback response structure completely  
                  let standingsData = [];
                  
                  if (fallbackResponse.groups && Array.isArray(fallbackResponse.groups) && fallbackResponse.groups.length > 0) {
                    standingsData = fallbackResponse.groups[0].standings || [];
                  } else if (fallbackResponse.standings && Array.isArray(fallbackResponse.standings)) {
                    standingsData = fallbackResponse.standings;
                  } else {
                    standingsData = [];
                  }
                  
                  // Use API data directly without mapping
                  console.log(`[MatchDetails] Fallback success! Using ${fallbackSeason} data (${standingsData.length} teams)`);
                  setStandings(standingsData);
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
          // Check if we have valid team IDs before making API calls
          const homeTeamId = matchData?.homeTeam?.id;
          const awayTeamId = matchData?.awayTeam?.id;
          
          console.log(`[MatchDetails] Fetching form data for teams:`, {
            homeTeamId,
            awayTeamId,
            homeTeamName: matchData?.homeTeam?.name,
            awayTeamName: matchData?.awayTeam?.name
          });
          
          if (!homeTeamId || !awayTeamId) {
            console.warn(`[MatchDetails] Missing team IDs - Home: ${homeTeamId}, Away: ${awayTeamId}`);
            console.warn(`[MatchDetails] Skipping form and H2H data fetch`);
            setHomeTeamForm([]);
            setAwayTeamForm([]);
            setH2hData([]);
          } else {
            const [homeForm, awayForm, h2h] = await Promise.all([
              getLastFiveGames(homeTeamId).catch(err => {
                console.log(`[MatchDetails] Home team form not available:`, err.message);
                return [];
              }),
              getLastFiveGames(awayTeamId).catch(err => {
                console.log(`[MatchDetails] Away team form not available:`, err.message);
                return [];
              }),
              getHeadToHead(homeTeamId, awayTeamId).catch(err => {
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
          }
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

  /**
   * Compute timing state fully trusting Highlightly API fields.
   * No mapping/transformation – we simply read what is available.
   * 
   * NOTE: The Highlightly API provides timestamps in UTC format (with Z suffix)
   * We properly parse this to ensure accurate time calculations regardless of user's timezone.
   */
  const computeTiming = (m: EnhancedMatchHighlight): TimingState => {
    if (!m) return { state: 'unknown' };

    // Prefer API fixture status if present
    const rawStatus = (m.fixture as any)?.status?.short ?? '';

    // Get the raw kickoff time from the API (fully trust API data)
    // Fix for the "+1 hour away" bug - ensure proper UTC handling
    const kickoffTs = (() => {
      try {
        // Log raw values for debugging
        console.log('[MatchDetails] Raw match data for timing:', {
          date: m.date,
          timestamp: (m.fixture as any)?.timestamp,
          fixture: m.fixture,
          status: (m.fixture as any)?.status
        });

        // IMPORTANT: First, check for valid status codes that override time calculations
        if (rawStatus === 'FT') {
          // Match is finished - no need for precise timestamp
          return Date.now() - 90 * 60 * 1000; // Set to 90 minutes ago for fullTime state
        }
        
        const liveCodes = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'];
        if (liveCodes.includes(rawStatus)) {
          // Match is live - use current time minus elapsed minutes if available
          const elapsed = (m.fixture as any)?.status?.elapsed ?? 0;
          return Date.now() - (elapsed * 60 * 1000);
        }

        // For upcoming matches, calculate precise kickoff time
        // First choice: Use fixture timestamp if available (typically in UTC seconds)
        if ((m.fixture as any)?.timestamp) {
          const timestamp = ((m.fixture as any).timestamp as number);
          // Safety check - validate timestamp is reasonable (after 2020, before 2030)
          if (timestamp > 1577836800 && timestamp < 1893456000) { // 2020-01-01 to 2030-01-01
            return timestamp * 1000; // Convert seconds to milliseconds
          } else {
            console.warn('[MatchDetails] Invalid timestamp detected:', timestamp);
          }
        }
        
        // Second choice: Parse ISO date string
        if (m.date) {
          // The API should provide dates in ISO8601 UTC format (with Z suffix)
          // But we need to handle various formats safely
          let dateStr = m.date;
          
          // Fix common issues with API date format
          // Remove any extra quotes that might be in the date string
          dateStr = dateStr.replace(/\"/g, '');
          
          // Ensure UTC timezone indicator (Z)
          if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
            dateStr = `${dateStr}Z`;
          }
          
          const parsedDate = new Date(dateStr);
          
          // Validate the parsed date (should be between 2020-2030)
          if (!isNaN(parsedDate.getTime()) && 
              parsedDate.getFullYear() >= 2020 && 
              parsedDate.getFullYear() <= 2030) {
            return parsedDate.getTime();
          } else {
            console.warn('[MatchDetails] Invalid date parsed:', dateStr, parsedDate);
          }
        }
        
        // Final fallback: If all attempts failed, return a reasonable time
        console.warn('[MatchDetails] Unable to determine match time, using fallback');
        return Date.now() + 24 * 60 * 60 * 1000; // Default to 1 day in the future
      } catch (err) {
        console.error('[MatchDetails] Error calculating kickoff time:', err);
        // Safe fallback in case of any errors
        return Date.now() + 24 * 60 * 60 * 1000; // Default to 1 day in the future
      }
    })();
    
    // Current time in UTC milliseconds for consistent comparison
    const now = Date.now();
    const diffMs = kickoffTs - now;
    
    // Log timestamps for debugging
    console.log('[MatchDetails] Time calculation:', {
      kickoffTs,
      now,
      diffMs,
      diffMinutes: Math.floor(diffMs / (60 * 1000)),
      kickoffTime: new Date(kickoffTs).toISOString(),
      nowTime: new Date(now).toISOString(),
      rawStatus
    });

    // Status-based state determination
    if (rawStatus === 'FT') {
      return { state: 'fullTime' };
    }

    // LIVE codes encountered in Highlightly
    const liveCodes = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'];
    if (liveCodes.includes(rawStatus)) {
      const elapsedLabel = (m.fixture as any)?.status?.elapsed
        ? `${(m.fixture as any).status.elapsed}′`
        : rawStatus;
      return { state: 'live', elapsedLabel };
    }

    // Not started yet (NS / TBD)
    if (rawStatus === 'NS' || rawStatus === 'TBD' || diffMs > 0) {
      // Apply reasonable limits to diffMs to prevent absurd countdown displays
      const cappedDiffMs = Math.min(diffMs, 7 * 24 * 60 * 60 * 1000); // Cap at 7 days
      
      if (cappedDiffMs > 60 * 60 * 1000) {
        return { state: 'preview', startsIn: cappedDiffMs };
      }
      return { state: 'imminent', startsIn: cappedDiffMs };
    }

    return { state: 'unknown' };
  };

  // Re-evaluate timing every 30 s for live/preview states
  useEffect(() => {
    if (!match) return;
    setTiming(computeTiming(match));

    const interval = setInterval(() => {
      setTiming(computeTiming(match));
    }, 30000);
    return () => clearInterval(interval);
  }, [match]);

  const isFullTime = timing.state === 'fullTime';
  const isLive     = timing.state === 'live';
  const isPreMatch = timing.state === 'preview' || timing.state === 'imminent';

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

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-16 md:pt-20 max-w-4xl">
        <div className="mb-6">
          <button onClick={handleGoBack} className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </button>
        </div>
        
        {/* Scoreline banner (shows countdown / live clock / final score) */}
        <div className="mb-8 w-full space-y-6">
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

            <ScorelineBanner match={match} timing={timing} />

            {/* Show timeline during live or after FT if events exist */}
            {(isLive || isFullTime) && match.events && match.events.length > 0 && (
              <ScorelineTimeline 
                homeTeam={match.homeTeam} 
                awayTeam={match.awayTeam} 
                matchEvents={match.events} 
                matchDate={match.date}
              />
            )}
          </div>
        </div>

        {/* Tabs / rest of page – always present, but hide sections with missing data */}
        {/* TAB NAVIGATION */}
        <div className="flex justify-center gap-6" style={{ backgroundColor: '#000000' }}>
          {[
            { key: 'home',    label: 'Home',    always: true },
            { key: 'lineups', label: 'Lineups', available: !!match.lineups?.homeTeam },
            { key: 'stats',   label: 'Stats',   available: Array.isArray(match.statistics) && match.statistics.length > 0 },
            { key: 'standings', label: 'Standings', always: true },
          ]
            .filter(t => t.always || t.available)
            .map(tab => (
              <button 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-medium text-white transition-all duration-200 focus:outline-none ${
                  activeTab === tab.key ? '' : 'hover:opacity-70'
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
              {/* Highlights */}
              <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                <HighlightsCarousel highlights={videoHighlightsList} loading={highlightsLoading} />
              </div>
              {/* Form & H2H */}
              <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                <TeamFormStats 
                  homeMatches={homeTeamForm}
                  awayMatches={awayTeamForm}
                  homeTeamId={match.homeTeam.id}
                  homeTeamName={match.homeTeam.name}
                  awayTeamId={match.awayTeam.id}
                  awayTeamName={match.awayTeam.name}
                />
                <HeadToHeadStats 
                  matches={h2hData} 
                  homeTeamId={match.homeTeam.id} 
                  homeTeamName={match.homeTeam.name}
                  awayTeamId={match.awayTeam.id}
                  awayTeamName={match.awayTeam.name}
                />
              </div>
            </div>
          )}

          {activeTab === 'lineups' && match.lineups?.homeTeam && (
            <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
              <TeamLineups lineups={match.lineups} />
            </div>
          )}

          {activeTab === 'stats' && Array.isArray(match.statistics) && match.statistics.length > 0 && (
            <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
              <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH STATISTICS</h4>
              <MatchStatistics statistics={match.statistics} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
            </div>
          )}

          {activeTab === 'standings' && (
            <div className="space-y-8">
              {/* Standings */}
              <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                <h4 className="text-lg font-semibold mb-6 text-center text-white">LEAGUE STANDINGS</h4>
                {standingsLoading ? (
                  <div className="text-center py-8"><div className="w-8 h-8 border-l-4 border-white/80 rounded-full animate-spin mx-auto"></div></div>
                ) : (
                  <StandingsTable standings={standings} homeTeamId={match.homeTeam.id} awayTeamId={match.awayTeam.id} />
                )}
              </div>

              {/* Timeline (events) – show if available */}
              {match.events && match.events.length > 0 && (
                <div className="rounded-3xl p-6" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
                  <h4 className="text-lg font-semibold mb-6 text-center text-white">MATCH TIMELINE</h4>
                  <MatchTimeline homeTeam={match.homeTeam} awayTeam={match.awayTeam} matchEvents={match.events} />
                </div>
              )}
            </div>
          )}
        </div>
        {/* End Tab content */}

        {/* If nothing else matches (e.g. still loading pre-match data) */}
        {isPreMatch && (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold">Match has not started yet.</h2>
          </div>
        )}

        {!isPreMatch && !isFullTime && !isLive && (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold">This view is not yet implemented.</h2>
          </div>
        )}
      </div>
    </main>
  );
};

export default MatchDetails; 