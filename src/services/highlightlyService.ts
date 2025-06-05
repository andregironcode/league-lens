import { MatchHighlight, LeagueWithMatches, TeamDetails, League, Match, EnhancedMatchHighlight, Player, Lineups } from '@/types';
import * as mockService from './highlightService';

// Highlightly API client instance
const highlightlyClient = {
  async getLeagues(params: { limit: string; offset: string }) {
    const url = `http://localhost:3001/api/highlightly/leagues?limit=${params.limit}&offset=${params.offset}`;
    const response = await fetch(url);
    return response.json();
  },

  async getMatches(params: { leagueId?: string; date?: string; limit?: string; season?: string; matchId?: string }) {
    let baseUrl = 'http://localhost:3001/api/highlightly/matches?';
    const queryParams = new URLSearchParams();

    if (params.leagueId) queryParams.append('leagueId', params.leagueId);
    if (params.season) queryParams.append('season', params.season);
    if (params.date) queryParams.append('date', params.date);
    if (params.matchId) { // If specific matchId is given, it implies a single match fetch.
      baseUrl = `http://localhost:3001/api/highlightly/matches/${params.matchId}?`;
    }

    // If fetching for a league and season, and no specific date, handle pagination to get all matches.
    if (params.leagueId && params.season && !params.date && !params.matchId) {
      let allMatches: any[] = [];
      let offset = 0;
      const limit = 100; // API default and max is 100
      let totalCount = Infinity;

      while (allMatches.length < totalCount) {
        const currentParams = new URLSearchParams(queryParams.toString());
        currentParams.append('limit', limit.toString());
        currentParams.append('offset', offset.toString());
        
        const response = await fetch(baseUrl + currentParams.toString());
        if (!response.ok) {
          // Handle error, maybe throw or return what's fetched so far
          console.error("Failed to fetch matches:", await response.text());
          break; 
        }
        const pageData = await response.json();
        
        if (pageData.data && Array.isArray(pageData.data)) {
          allMatches = allMatches.concat(pageData.data);
        } else {
          // If no data array, break to avoid infinite loop on unexpected response
          console.error("Unexpected response structure for matches:", pageData);
          break;
        }
        
        if (pageData.pagination && pageData.pagination.totalCount) {
          totalCount = pageData.pagination.totalCount;
        } else {
          // If no pagination info, assume this is all data or break
          break;
        }
        
        offset += limit;
        if (offset >= totalCount) {
          break;
        }
      }
      // The API wraps the data in a 'data' property and includes pagination.
      // To maintain a somewhat consistent return type, we might want to return
      // the same structure, or adjust consumers. For now, returning the aggregated data array.
      return { data: allMatches, pagination: { totalCount: allMatches.length, limit, offset: 0 } }; // Simulate a final pagination object
    } else {
      // For other cases (date specific, single match, or no pagination needed)
      if (params.limit) queryParams.append('limit', params.limit);
      else queryParams.append('limit', '100'); // Default limit for non-paginated specific calls if not set
      
      const response = await fetch(baseUrl + queryParams.toString());
      return response.json();
    }
  },

  async getLeagueById(leagueId: string) {
    const url = `http://localhost:3001/api/highlightly/leagues/${leagueId}`;
    const response = await fetch(url);
    return response.json();
  },

  async getMatchById(matchId: string) {
    const url = `http://localhost:3001/api/highlightly/matches/${matchId}`;
    const response = await fetch(url);
    return response.json();
  },

  async getHighlights(params: { leagueId?: string; season?: string; matchId?: string; limit?: string; offset?: string; date?: string; }) {
    let url = 'http://localhost:3001/api/highlightly/highlights?';
    const queryParams = new URLSearchParams();
    if (params.leagueId) queryParams.append('leagueId', params.leagueId);
    if (params.season) queryParams.append('season', params.season);
    if (params.matchId) queryParams.append('matchId', params.matchId);
    if (params.date) queryParams.append('date', params.date);
    queryParams.append('limit', params.limit || '20');
    queryParams.append('offset', params.offset || '0');

    url += queryParams.toString();
    const response = await fetch(url);
    return response.json();
  },

  async getStandings(params: { leagueId: string; season: string }) {
    const url = `http://localhost:3001/api/highlightly/standings?leagueId=${params.leagueId}&season=${params.season}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching standings for league ${params.leagueId}, season ${params.season}: ${response.status}`);
      // Return a structure that won't break the consuming code, e.g., empty groups
      return { groups: [], league: { id: params.leagueId, season: params.season, name: '', logo: '' } };
    }
    try {
      return await response.json();
    } catch (e) {
      console.error("Error parsing standings JSON:", e);
      return { groups: [], league: { id: params.leagueId, season: params.season, name: '', logo: '' } };
    }
  },

  // Method to get match details by ID (already somewhat covered by getMatches with matchId)
  // but this could be a dedicated method for clarity if only matchId is ever passed.
  async getMatchDetails(matchId: string) {
    const url = `http://localhost:3001/api/highlightly/matches/${matchId}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching match details for match ${matchId}: ${response.status}`);
      return null; // Or throw an error
    }
    return response.json();
  },

  // Method to get lineups by match ID
  async getLineups(matchId: string) {
    const url = `http://localhost:3001/api/highlightly/lineups/${matchId}`;
    console.log(`[Highlightly Client] Calling lineups endpoint: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching lineups for match ${matchId}: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response body:`, errorText);
      return null; // Or throw an error
    }
    const data = await response.json();
    console.log(`[Highlightly Client] Lineups response:`, data);
    return data;
  },

  async getStatistics(matchId: string) {
    const url = `http://localhost:3001/api/highlightly/statistics/${matchId}`;
    console.log(`[Highlightly Client] Calling statistics endpoint: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Highlightly Client] Error fetching statistics for match ${matchId}: ${response.status}`, errorText);
        return null;
      }
      const data = await response.json();
      console.log(`[Highlightly Client] Statistics response for match ${matchId}:`, data);
      return data;
    } catch (error) {
      console.error(`[Highlightly Client] Exception when fetching statistics for match ${matchId}:`, error);
      return null;
    }
  },

  async getLastFiveGames(teamId: string) {
    const url = `http://localhost:3001/api/highlightly/last-five-games?teamId=${teamId}`;
    console.log(`[Highlightly Client] Calling last five games endpoint: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching last 5 games for team ${teamId}: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response body:`, errorText);
      return [];
    }
    const data = await response.json();
    console.log(`[Highlightly Client] Last five games response for team ${teamId}:`, data);
    return data;
  },

  async getHeadToHead(params: { teamIdOne: string; teamIdTwo: string }) {
    const url = `http://localhost:3001/api/highlightly/head-2-head?teamIdOne=${params.teamIdOne}&teamIdTwo=${params.teamIdTwo}`;
    console.log(`[Highlightly Client] Calling head-to-head endpoint: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching H2H for teams ${params.teamIdOne} and ${params.teamIdTwo}: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response body:`, errorText);
      return [];
    }
    const data = await response.json();
    console.log(`[Highlightly Client] Head-to-head response for teams ${params.teamIdOne} and ${params.teamIdTwo}:`, data);
    return data;
  },
};

// Helper function to transform API player to our Player type
const transformApiPlayerToPlayer = (apiPlayer: any): Player => ({
  name: apiPlayer.name || apiPlayer.player?.name || apiPlayer.player_name || 'Unknown Player',
  number: apiPlayer.number || apiPlayer.player?.number || 0,
  position: apiPlayer.position || apiPlayer.player?.pos || apiPlayer.pos || '?',
});

// Helper function to transform API team lineup data
const transformApiLineupTeam = (
  apiTeamLineupData: any,
  fallbackTeamId: string,
  fallbackTeamName: string,
  fallbackTeamLogo: string
): { id: string; name: string; logo: string; formation: string; initialLineup: Player[][]; substitutes: Player[]; } => {
  if (!apiTeamLineupData) {
    return {
      id: fallbackTeamId, name: fallbackTeamName, logo: fallbackTeamLogo,
      formation: 'N/A', initialLineup: [], substitutes: [],
    };
  }

  // Extract team info - handle different API response formats
  const teamInfo = apiTeamLineupData.team || apiTeamLineupData;
  const teamId = (teamInfo.id || fallbackTeamId).toString();
  const teamName = teamInfo.name || fallbackTeamName;
  const teamLogo = teamInfo.logo || fallbackTeamLogo;
  const formation = apiTeamLineupData.formation || 'N/A';

  // Handle substitutes
  const apiSubstitutes = apiTeamLineupData.substitutes || [];
  const substitutes: Player[] = apiSubstitutes.map(transformApiPlayerToPlayer);

  // Handle initial lineup - check for the format from Highlightly API documentation
  const initialLineupData = apiTeamLineupData.initialLineup || apiTeamLineupData.startXI || [];
  
  let initialLineup: Player[][] = [];
  
  // If initialLineup is already an array of arrays (formation rows), use it directly
  if (Array.isArray(initialLineupData) && initialLineupData.length > 0 && Array.isArray(initialLineupData[0])) {
    initialLineup = initialLineupData.map((row: any[]) => 
      row.map(transformApiPlayerToPlayer)
    );
  } 
  // If it's a flat array, try to organize by grid positions
  else if (Array.isArray(initialLineupData) && initialLineupData.length > 0) {
    const startingXIWithGrid = initialLineupData.map((p: any) => ({
      ...transformApiPlayerToPlayer(p),
      gridRow: p.player?.grid ? parseInt(p.player.grid.split(':')[0], 10) : (p.grid ? parseInt(p.grid.split(':')[0], 10) : Infinity),
      gridCol: p.player?.grid ? parseInt(p.player.grid.split(':')[1], 10) : (p.grid ? parseInt(p.grid.split(':')[1], 10) : Infinity),
    })).filter((p: any) => isFinite(p.gridRow) && isFinite(p.gridCol));

    // Group by rows and sort
    const groupedByRow: { [key: number]: any[] } = {};
    startingXIWithGrid.forEach((p: any) => {
      if (!groupedByRow[p.gridRow]) {
        groupedByRow[p.gridRow] = [];
      }
      groupedByRow[p.gridRow].push(p);
    });

    initialLineup = Object.keys(groupedByRow)
      .map(Number)
      .sort((a, b) => a - b)
      .map(rowNum => groupedByRow[rowNum].sort((a: any, b: any) => a.gridCol - b.gridCol));
  }

  console.log(`[Highlightly] Processed lineup for ${teamName}: ${formation} formation, ${initialLineup.length} rows, ${substitutes.length} substitutes`);

  return {
    id: teamId,
    name: teamName,
    logo: teamLogo,
    formation,
    initialLineup,
    substitutes,
  };
};

// Main transformer for a single fixture from the API to our EnhancedMatchHighlight type
const apiFixtureToEnhancedMatch = (rawMatchData: any, id: string): EnhancedMatchHighlight => {
  let homeScore = 0;
  let awayScore = 0;

  if (rawMatchData.state?.score?.current) {
    const scoreMatch = rawMatchData.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[1], 10);
      awayScore = parseInt(scoreMatch[2], 10);
    }
  } else if (rawMatchData.score) {
    homeScore = rawMatchData.score.home ?? 0;
    awayScore = rawMatchData.score.away ?? 0;
  } else if (rawMatchData.goals) {
    homeScore = rawMatchData.goals.home ?? 0;
    awayScore = rawMatchData.goals.away ?? 0;
  }

  const homeTeamDetails = rawMatchData.homeTeam || rawMatchData.teams?.home || {};
  const awayTeamDetails = rawMatchData.awayTeam || rawMatchData.teams?.away || {};
  const leagueDetails = rawMatchData.league || rawMatchData.competition || {};

  const enhancedMatch: EnhancedMatchHighlight = {
    id: rawMatchData.id?.toString() || id,
    title: `${homeTeamDetails.name || 'Home'} vs ${awayTeamDetails.name || 'Away'}`,
    date: rawMatchData.date || new Date().toISOString(),
    thumbnailUrl: rawMatchData.thumbnailUrl || '',
    videoUrl: rawMatchData.videoUrl || rawMatchData.highlights?.url || '',
    duration: rawMatchData.duration || '00:00',
    views: rawMatchData.views || 0,
    homeTeam: {
      id: (homeTeamDetails.id || 'home').toString(),
      name: homeTeamDetails.name || 'Home Team',
      logo: homeTeamDetails.logo || '/teams/default.png'
    },
    awayTeam: {
      id: (awayTeamDetails.id || 'away').toString(),
      name: awayTeamDetails.name || 'Away Team',
      logo: awayTeamDetails.logo || '/teams/default.png'
    },
    score: {
      home: homeScore,
      away: awayScore
    },
    competition: {
      id: (leagueDetails.id || 'unknown').toString(),
      name: leagueDetails.name || 'Unknown Competition',
      logo: leagueDetails.logo || '/leagues/default.png'
    },
    events: rawMatchData.events || [],
    statistics: rawMatchData.statistics || [],
    lineups: undefined,
  };

  if (rawMatchData.lineups && Array.isArray(rawMatchData.lineups) && rawMatchData.lineups.length >= 2) {
    const apiHomeTeamLineup = rawMatchData.lineups.find((l: any) => l.team?.id?.toString() === enhancedMatch.homeTeam.id);
    const apiAwayTeamLineup = rawMatchData.lineups.find((l: any) => l.team?.id?.toString() === enhancedMatch.awayTeam.id);

    if (apiHomeTeamLineup && apiAwayTeamLineup) {
      enhancedMatch.lineups = {
        homeTeam: transformApiLineupTeam(apiHomeTeamLineup, enhancedMatch.homeTeam.id, enhancedMatch.homeTeam.name, enhancedMatch.homeTeam.logo),
        awayTeam: transformApiLineupTeam(apiAwayTeamLineup, enhancedMatch.awayTeam.id, enhancedMatch.awayTeam.name, enhancedMatch.awayTeam.logo),
      };
      console.log('[Highlightly] Successfully processed lineups by ID.');
    } else {
      console.warn('[Highlightly] Could not map API lineups by team ID, attempting by order.');
      enhancedMatch.lineups = {
        homeTeam: transformApiLineupTeam(rawMatchData.lineups[0], enhancedMatch.homeTeam.id, enhancedMatch.homeTeam.name, enhancedMatch.homeTeam.logo),
        awayTeam: transformApiLineupTeam(rawMatchData.lineups[1], enhancedMatch.awayTeam.id, enhancedMatch.awayTeam.name, enhancedMatch.awayTeam.logo),
      };
    }
  } else {
    console.log(`[Highlightly] No lineups field or incomplete lineup data in API response for match ${id}`);
  }

  return enhancedMatch;
};

// Helper function to transform API highlight to our MatchHighlight type
// Transform API match data to our Match type structure
const transformApiMatchToMatch = (apiMatch: any): Match => {
  // Parse score from API format "2 - 0" to our goals structure
  const parseScore = (scoreString: string | null | undefined): { home: number | null; away: number | null } => {
    if (!scoreString || typeof scoreString !== 'string') {
      return { home: null, away: null };
    }
    
    const parts = scoreString.split(' - ');
    if (parts.length === 2) {
      const home = parseInt(parts[0].trim(), 10);
      const away = parseInt(parts[1].trim(), 10);
      return {
        home: isNaN(home) ? null : home,
        away: isNaN(away) ? null : away
      };
    }
    
    return { home: null, away: null };
  };

  const currentScore = apiMatch.state?.score?.current;
  const goals = parseScore(currentScore);

  return {
    id: apiMatch.id,
    date: apiMatch.date,
    league: {
      id: apiMatch.league?.id || '',
      name: apiMatch.league?.name || '',
      logo: apiMatch.league?.logo,
      season: apiMatch.league?.season,
      round: apiMatch.round
    },
    homeTeam: {
      id: apiMatch.homeTeam?.id || '',
      name: apiMatch.homeTeam?.name || '',
      logo: apiMatch.homeTeam?.logo || ''
    },
    awayTeam: {
      id: apiMatch.awayTeam?.id || '',
      name: apiMatch.awayTeam?.name || '',
      logo: apiMatch.awayTeam?.logo || ''
    },
    goals,
    state: apiMatch.state,
    round: apiMatch.round,
    country: apiMatch.country
  };
};

const transformApiHighlightToMatchHighlight = (apiHighlight: any): MatchHighlight => {
  const matchDetails = apiHighlight.match || {};
  const homeTeamDetails = matchDetails.homeTeam || {};
  const awayTeamDetails = matchDetails.awayTeam || {};
  const leagueDetails = matchDetails.league || {};
  
  return {
    id: apiHighlight.id?.toString(),
    title: apiHighlight.title || 'Match Highlight',
    date: matchDetails.date || new Date().toISOString(),
    thumbnailUrl: apiHighlight.imgUrl || '', // Map imgUrl to thumbnailUrl
    videoUrl: apiHighlight.url || '',       // Map url to videoUrl
    duration: 'N/A', // Not provided in this API response
    views: 0,        // Not provided in this API response
    homeTeam: {
      id: homeTeamDetails.id?.toString(),
      name: homeTeamDetails.name || 'Home',
      logo: homeTeamDetails.logo || ''
    },
    awayTeam: {
      id: awayTeamDetails.id?.toString(),
      name: awayTeamDetails.name || 'Away',
      logo: awayTeamDetails.logo || ''
    },
    score: { // Score is not in the highlight item, so we default it
      home: 0,
      away: 0,
    },
    competition: {
      id: leagueDetails.id?.toString(),
      name: leagueDetails.name || 'Competition',
      logo: leagueDetails.logo || ''
    },
    status: {
      long: 'Finished',
      short: 'FT'
    }
  };
};

export const highlightlyService = {
  /**
   * Get recommended highlights - fallback to mock service
   */
  async getRecommendedHighlights(): Promise<MatchHighlight[]> {
    console.log('[Highlightly] Recommended highlights not implemented, falling back to mock service');
    return mockService.getRecommendedHighlights();
  },

  /**
   * Get matches from last 7 days and next 7 days for Featured Leagues
   * Simple and clear implementation respecting the Featured League menu
   */
  async getRecentMatchesForTopLeagues(): Promise<LeagueWithMatches[]> {
    console.log('[Highlightly] 🚀 OPTIMIZED: Getting recent matches with smart batching');
    
    try {
      // OPTIMIZATION 1: Reduce leagues from 14 to 8 top priority leagues
      const TOP_PRIORITY_LEAGUES = [
        '33973', // Premier League - Most popular
        '119924', // La Liga
        '115669', // Serie A  
        '67162', // Bundesliga
        '52695', // Ligue 1
        '2486', // UEFA Champions League
        '8443', // UEFA Europa League
        '1635' // FIFA World Cup
      ];
      
      // OPTIMIZATION 2: Reduce date range from 15 days to 7 days (3 past + 1 today + 3 future)
      const dates: string[] = [];
      for (let i = -3; i <= 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      const totalCalls = dates.length * TOP_PRIORITY_LEAGUES.length;
      console.log(`[Highlightly] 📊 PERFORMANCE: ${totalCalls} API calls (was 210, now ${Math.round((totalCalls/210)*100)}% of original)`);
      console.log(`[Highlightly] 📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
      
      const leaguesWithMatches: LeagueWithMatches[] = [];
      
      // OPTIMIZATION 3: Parallel execution instead of sequential
      const batchedCalls: Promise<{leagueId: string, date: string, matches: any[]}>[] = [];
      
      // Build all API calls upfront for parallel execution
      for (const leagueId of TOP_PRIORITY_LEAGUES) {
        for (const dateString of dates) {
          const apiCall = highlightlyClient.getMatches({
            leagueId: leagueId,
            date: dateString,
            limit: '10' // OPTIMIZATION 6: Further reduced from 12 to 10 per date for speed
          }).then(matchesResponse => ({
            leagueId,
            date: dateString,
            matches: matchesResponse.data && Array.isArray(matchesResponse.data) ? matchesResponse.data : []
          })).catch(err => {
            console.error(`[Highlightly] Error fetching ${leagueId} on ${dateString}:`, err);
            return { leagueId, date: dateString, matches: [] };
          });
          
          batchedCalls.push(apiCall);
        }
      }
      
      console.log(`[Highlightly] ⏱️ Executing ${batchedCalls.length} API calls in parallel (instead of sequential)...`);
      const startTime = Date.now();
      
      // Execute all API calls in parallel
      const results = await Promise.all(batchedCalls);
      
      const executionTime = Date.now() - startTime;
      console.log(`[Highlightly] ✅ Completed ${batchedCalls.length} API calls in ${executionTime}ms`);
      
      // OPTIMIZATION 4: Group results by league efficiently
      const leagueMatches: Record<string, any[]> = {};
      results.forEach(result => {
        if (!leagueMatches[result.leagueId]) {
          leagueMatches[result.leagueId] = [];
        }
        leagueMatches[result.leagueId].push(...result.matches);
      });
      
      // Process each league's matches
      for (const leagueId of TOP_PRIORITY_LEAGUES) {
        const allMatches = leagueMatches[leagueId] || [];
        
        console.log(`[Highlightly] League ${leagueId}: Found ${allMatches.length} total matches`);
        
        if (allMatches.length === 0) {
          console.log(`[Highlightly] No matches found for league ${leagueId}, skipping`);
          continue;
        }
        
        // Get league details for transformation
        let leagueData = { id: leagueId, name: `League ${leagueId}`, logo: '/leagues/default.png' };
        
        // If we have matches, get league info from the first match
        if (allMatches.length > 0 && allMatches[0].league) {
          leagueData = {
            id: allMatches[0].league.id?.toString() || leagueId,
            name: allMatches[0].league.name || `League ${leagueId}`,
            logo: allMatches[0].league.logo || '/leagues/default.png'
          };
        }
        
        // OPTIMIZATION 5: Transform matches (limit to 15 matches per league, down from 20)
        const transformedMatches: Match[] = allMatches.slice(0, 15).map((apiMatch: any) => {
            const homeTeam = apiMatch.homeTeam || {};
            const awayTeam = apiMatch.awayTeam || {};
            
            // Simple score parsing
            let homeScore = 0, awayScore = 0;
            if (apiMatch.state?.score?.current) {
              const scoreMatch = apiMatch.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
              if (scoreMatch) {
                homeScore = parseInt(scoreMatch[1], 10) || 0;
                awayScore = parseInt(scoreMatch[2], 10) || 0;
              }
            }
            
            // Extract proper status from API response - providing both string and object formats
            const getMatchStatusString = (apiMatch: any): string => {
              // Check state.description first (most reliable)
              if (apiMatch.state?.description) {
                const desc = apiMatch.state.description.toLowerCase();
                if (desc.includes('finished') || desc.includes('full-time') || desc.includes('ft')) {
                  return 'finished';
                }
                if (desc.includes('live') || desc.includes('in play') || desc.includes('1st half') || desc.includes('2nd half')) {
                  return 'live';
                }
                if (desc.includes('not started') || desc.includes('upcoming') || desc.includes('timed')) {
                  return 'upcoming';
                }
              }
              
              // Fallback to status field
              if (apiMatch.status) {
                const status = apiMatch.status.toLowerCase();
                if (status.includes('finished') || status === 'ft') return 'finished';
                if (status.includes('live') || status.includes('in play')) return 'live';
                return 'upcoming';
              }
              
              // Default to upcoming if no clear status
              return 'upcoming';
            };
            
            const getMatchStatusObject = (apiMatch: any) => {
              const statusString = getMatchStatusString(apiMatch);
              const desc = apiMatch.state?.description || '';
              
              return {
                short: statusString === 'finished' ? 'FT' : statusString === 'live' ? 'LIVE' : 'KO',
                long: desc || (statusString === 'finished' ? 'Match Finished' : statusString === 'live' ? 'In Play' : 'Not Started'),
                elapsed: apiMatch.state?.clock || undefined
              };
            };
            
            return {
              id: apiMatch.id?.toString() || `match-${Date.now()}`,
              date: apiMatch.date || new Date().toISOString(),
              time: apiMatch.time,
              timestamp: apiMatch.timestamp,
              timezone: apiMatch.timezone,
              status: getMatchStatusString(apiMatch), // String format for most UI components
              fixture: {
                status: getMatchStatusObject(apiMatch), // Object format for components that need it
                date: apiMatch.date || new Date().toISOString(),
              },
              league: {
                id: leagueData.id,
                name: leagueData.name,
                logo: leagueData.logo,
              },
              homeTeam: {
                id: (homeTeam.id || 'home').toString(),
                name: homeTeam.name || 'Home Team',
                logo: homeTeam.logo || '/teams/default.png',
              },
              awayTeam: {
                id: (awayTeam.id || 'away').toString(),
                name: awayTeam.name || 'Away Team',
                logo: awayTeam.logo || '/teams/default.png',
              },
              score: {
                fulltime: `${homeScore}-${awayScore}`,
              },
              goals: {
                home: homeScore,
                away: awayScore,
              },
              events: apiMatch.events || [],
              state: apiMatch.state,
              round: apiMatch.round,
              country: apiMatch.country,
            };
          });
          
        if (transformedMatches.length > 0) {
          leaguesWithMatches.push({
            id: leagueData.id,
            name: leagueData.name,
            logo: leagueData.logo,
            matches: transformedMatches,
          });
          
          console.log(`[Highlightly] ✅ Added ${transformedMatches.length} matches for ${leagueData.name}`);
        }
      }
      
      console.log(`[Highlightly] FINAL RESULT: Found ${leaguesWithMatches.length} leagues with matches`);
      leaguesWithMatches.forEach(league => {
        console.log(`[Highlightly] League: ${league.name} has ${league.matches.length} matches`);
      });
      
      return leaguesWithMatches;
      
    } catch (error) {
      console.error('[Highlightly] Error in getRecentMatchesForTopLeagues:', error);
      return [];
    }
  },

  /**
   * Get match by ID - fetch from Highlightly API
   */
  async getMatchById(id: string): Promise<EnhancedMatchHighlight | null> {
    console.log(`[Highlightly] Fetching match details for ID: ${id}`);
    
    try {
      // First, get the main match data
      const response = await highlightlyClient.getMatchById(id);
      
      let rawMatchData = null;
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        rawMatchData = response.data[0];
      } else if (response?.data && !Array.isArray(response.data)) {
        rawMatchData = response.data;
      } else if (Array.isArray(response) && response.length > 0) {
        rawMatchData = response[0];
      } else if (response && typeof response === 'object' && Object.keys(response).length > 0 && !response.data) {
        rawMatchData = response;
      }

      if (!rawMatchData) {
        console.error(`[Highlightly] No match data found for ID: ${id}`);
        return null;
      }

      console.log(`[Highlightly] Successfully fetched match data for ID: ${id}`);
      
      // Transform the main match data
      const enhancedMatch = apiFixtureToEnhancedMatch(rawMatchData, id);
      
      // Now fetch lineups separately from the dedicated endpoint
      try {
        console.log(`[Highlightly] Fetching lineups for match ID: ${id}`);
        const lineupsResponse = await highlightlyClient.getLineups(id);
        
        // Handle different response formats for lineups
        let lineupsData = null;
        if (lineupsResponse?.data) {
          lineupsData = lineupsResponse.data;
        } else if (lineupsResponse && (lineupsResponse.homeTeam || lineupsResponse.awayTeam)) {
          lineupsData = lineupsResponse;
        }
        
        if (lineupsData && (lineupsData.homeTeam || lineupsData.awayTeam)) {
          console.log(`[Highlightly] Successfully fetched lineups for match ID: ${id}`);
          
          // Process home team lineup if available
          const homeTeamLineup = lineupsData.homeTeam ? 
            transformApiLineupTeam(
              lineupsData.homeTeam, 
              enhancedMatch.homeTeam.id, 
              enhancedMatch.homeTeam.name, 
              enhancedMatch.homeTeam.logo
            ) : null;
          
          // Process away team lineup if available  
          const awayTeamLineup = lineupsData.awayTeam ?
            transformApiLineupTeam(
              lineupsData.awayTeam,
              enhancedMatch.awayTeam.id,
              enhancedMatch.awayTeam.name, 
              enhancedMatch.awayTeam.logo
            ) : null;
          
          // Only set lineups if we have data for both teams
          if (homeTeamLineup && awayTeamLineup) {
            enhancedMatch.lineups = {
              homeTeam: homeTeamLineup,
              awayTeam: awayTeamLineup
            };
            console.log(`[Highlightly] Successfully processed lineups for both teams`);
          } else if (homeTeamLineup || awayTeamLineup) {
            // Set partial lineup data if we have at least one team's data
            enhancedMatch.lineups = {
              homeTeam: homeTeamLineup || { 
                id: enhancedMatch.homeTeam.id, 
                name: enhancedMatch.homeTeam.name, 
                logo: enhancedMatch.homeTeam.logo,
                formation: 'N/A', 
                initialLineup: [], 
                substitutes: [] 
              },
              awayTeam: awayTeamLineup || { 
                id: enhancedMatch.awayTeam.id, 
                name: enhancedMatch.awayTeam.name, 
                logo: enhancedMatch.awayTeam.logo,
                formation: 'N/A', 
                initialLineup: [], 
                substitutes: [] 
              }
            };
            console.log(`[Highlightly] Processed partial lineup data`);
          } else {
            console.log(`[Highlightly] No valid lineup data found for either team`);
          }
        } else {
          console.log(`[Highlightly] No lineup data available for match ID: ${id}`);
        }
      } catch (lineupError) {
        console.error(`[Highlightly] Error fetching lineups for match ID ${id}:`, lineupError);
        // Don't fail the entire request if lineups fail - just continue without them
      }

      // Fetch statistics separately
      try {
        console.log(`[Highlightly] Fetching statistics for match ID: ${id}`);
        const statsResponse = await highlightlyClient.getStatistics(id);
        if (statsResponse && Array.isArray(statsResponse) && statsResponse.length > 0) {
          enhancedMatch.statistics = statsResponse;
          console.log(`[Highlightly] Successfully fetched and attached statistics for match ID: ${id}`);
        } else {
          console.log(`[Highlightly] No statistics data available for match ID: ${id}`);
        }
      } catch (statsError) {
        console.error(`[Highlightly] Error fetching statistics for match ID ${id}:`, statsError);
      }
      
      return enhancedMatch;
      
    } catch (error) {
      console.error(`[Highlightly] Error fetching match with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Get team highlights - simplified version
   */
  async getTeamHighlights(teamId: string): Promise<MatchHighlight[]> {
    console.log(`[Highlightly] getTeamHighlights not implemented for ${teamId}, falling back to mock service`);
    return mockService.getTeamHighlights(teamId);
  },

  /**
   * Get team details - fallback to mock service
   */
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    console.log(`[Highlightly] getTeamDetails not implemented for ${teamId}, falling back to mock service`);
    return mockService.getTeamDetails(teamId);
  },

  /**
   * Search highlights - simplified version
   */
  async searchHighlights(query: string): Promise<MatchHighlight[]> {
    console.log(`[Highlightly] searchHighlights not implemented for "${query}", falling back to mock service`);
    return mockService.searchHighlights(query);
  },

  async getLeagueDetails(leagueId: string): Promise<League | null> {
    try {
      const response = await highlightlyClient.getLeagueById(leagueId);
      // The API returns an array, we take the first element.
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error('Error fetching league details from Highlightly:', error);
      return null;
    }
  },

  async getStandingsForLeague(leagueId: string, season: string): Promise<any> { // Type properly later
    try {
      return await highlightlyClient.getStandings({ leagueId, season });
    } catch (error) {
      console.error('Error fetching standings from Highlightly:', error);
      return { groups: [] }; // Return empty structure on error
    }
  },

  async getMatchesForLeagueByDate(leagueId: string, date: string, season?: string): Promise<Match[]> {
    try {
      const params: { leagueId: string; date: string; season?: string; limit: string } = { leagueId, date, limit: '10' };
      if (season) {
        params.season = season;
      }
      const response = await highlightlyClient.getMatches(params);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching matches by date from Highlightly:', error);
      return [];
    }
  },

  async getAllMatchesForLeagueSeason(leagueId: string, season: string): Promise<Match[]> {
    try {
      // This now uses the paginated version of getMatches
      const response = await highlightlyClient.getMatches({ leagueId, season }); 
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all matches for league season from Highlightly:', error);
      return [];
    }
  },

  async getHighlightsForLeague(leagueId: string, season: string, limit: number = 20, offset: number = 0): Promise<MatchHighlight[]> {
    try {
      const response = await highlightlyClient.getHighlights({ leagueId, season, limit: String(limit), offset: String(offset) });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching highlights from Highlightly:', error);
      return [];
    }
  },
  
  async getHighlightsForMatch(matchId: string, limit: number = 5): Promise<MatchHighlight[]> {
    try {
      const response = await highlightlyClient.getHighlights({ matchId, limit: String(limit) });
      
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(transformApiHighlightToMatchHighlight);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching highlights for match from Highlightly:', error);
      return [];
    }
  },

  async getMatchDetails(matchId: string): Promise<Match | null> {
    try {
      // Use the new getMatchDetails from client or adapt getMatches
      const response = await highlightlyClient.getMatchDetails(matchId);
      // API returns an array for match details by ID as well.
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error('Error fetching match details from Highlightly:', error);
      return null;
    }
  },

  async getLastFiveGames(teamId: string): Promise<Match[]> {
    try {
      const response = await highlightlyClient.getLastFiveGames(teamId);
      console.log(`[Highlightly] Last five games response for team ${teamId}:`, response);
      
      if (!Array.isArray(response)) {
        console.warn('Expected array response from getLastFiveGames API');
        return [];
      }

      // Transform API response to match our Match type
      const transformedMatches = response.map(transformApiMatchToMatch);
      console.log(`[Highlightly] Transformed ${transformedMatches.length} matches for team ${teamId}`);
      return transformedMatches;
    } catch (error) {
      console.error(`Error fetching last 5 games for team ${teamId}:`, error);
      return [];
    }
  },

  async getHeadToHead(teamId1: string, teamId2: string): Promise<Match[]> {
    try {
      const response = await highlightlyClient.getHeadToHead({ teamIdOne: teamId1, teamIdTwo: teamId2 });
      console.log(`[Highlightly] Head-to-head response for teams ${teamId1} vs ${teamId2}:`, response);
      
      if (!Array.isArray(response)) {
        console.warn('Expected array response from getHeadToHead API');
        return [];
      }

      // Transform API response to match our Match type
      const transformedMatches = response.map(transformApiMatchToMatch);
      console.log(`[Highlightly] Transformed ${transformedMatches.length} H2H matches for teams ${teamId1} vs ${teamId2}`);
      return transformedMatches;
    } catch (error) {
      console.error(`Error fetching H2H for teams ${teamId1} and ${teamId2}:`, error);
      return [];
    }
  },
};

