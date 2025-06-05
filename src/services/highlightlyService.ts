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
   * Get recent matches for top priority leagues
   * Recent matches include: matches from last 7 days + today's matches
   */
  async getRecentMatchesForTopLeagues(): Promise<LeagueWithMatches[]> {
    console.log('[Highlightly] Starting getRecentMatchesForTopLeagues');
    
    try {
      const PRIORITY_LEAGUE_IDS = [
        '2486',   // UEFA Champions League
        '3337',   // UEFA Europa League  
        '4188',   // Euro Championship
        '5890',   // Africa Cup of Nations
        '11847',  // CONMEBOL Libertadores
        '13549',  // FIFA Club World Cup (excluded in filtering)
        '8443',   // Copa America
        '33973',  // Premier League
        '52695',  // Ligue 1
        '67162',  // Bundesliga
        '119924', // La Liga (Spain)
        '16102',  // AFC Cup
        '115669', // Serie A (Italy)
        '1635'    // FIFA World Cup
      ];
      
      // First, get all priority leagues by pagination
      let priorityLeaguesData: any[] = [];
      const limit = 100;
      let offset = 0;
      
      while (offset < 1000) {
        try {
          const response = await highlightlyClient.getLeagues({
            limit: limit.toString(),
            offset: offset.toString()
          });
          
          if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            break;
          }
          
          // Find priority leagues in this batch
          const priorityLeaguesInBatch = response.data.filter((league: any) => 
            PRIORITY_LEAGUE_IDS.includes(league.id?.toString())
          );
          
          priorityLeaguesData.push(...priorityLeaguesInBatch);
          
          if (response.data.length < limit) break;
          offset += limit;
          
          // Early exit if we've found all priority leagues
          const foundIds = new Set(priorityLeaguesData.map(l => l.id.toString()));
          const missingIds = PRIORITY_LEAGUE_IDS.filter(id => !foundIds.has(id));
          if (missingIds.length === 0) {
            break;
          }
        } catch (error) {
          console.error(`[Highlightly] Error fetching leagues at offset ${offset}:`, error);
          break;
        }
      }
      
      // Exclude FIFA Club World Cup
      priorityLeaguesData = priorityLeaguesData.filter((league: any) => {
        const name = league.name?.toLowerCase() || '';
        if (name.includes('fifa club world cup') || name.includes('club world cup')) {
          return false;
        }
        return true;
      });
      
      console.log(`[Highlightly] Found ${priorityLeaguesData.length} priority leagues`);
      
      if (priorityLeaguesData.length === 0) {
        console.error('[Highlightly] No priority leagues found, returning empty array');
        return [];
      }
      
      // Calculate date range: last 7 days + today
      const today = new Date();
      const endDate = today; // Today
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // 7 days ago
      
      console.log(`[Highlightly] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      // Get recent matches for each priority league
      const leaguesWithMatches: LeagueWithMatches[] = [];
      
      for (const league of priorityLeaguesData.slice(0, 8)) {
        try {
          let allRecentRawMatches: any[] = [];
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            try {
              const matchesResponse = await highlightlyClient.getMatches({
                leagueId: league.id.toString(),
                date: dateStr,
                limit: '25' 
              });
              if (matchesResponse.data && Array.isArray(matchesResponse.data)) {
                allRecentRawMatches.push(...matchesResponse.data);
              }
            } catch (err) {
              console.error(`[Highlightly] Error fetching matches for ${league.name} on ${dateStr}:`, err);
            }
          }

          // Transform raw API matches to our Domain Match[] type
          const transformedDomainMatches: Match[] = allRecentRawMatches.map((apiMatch: any) => {
            let homeScore = 0;
            let awayScore = 0;
            if (apiMatch.state?.score?.current) {
              const scoreMatch = apiMatch.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
              if (scoreMatch) {
                homeScore = parseInt(scoreMatch[1], 10);
                awayScore = parseInt(scoreMatch[2], 10);
              }
            } else if (apiMatch.score) {
              homeScore = apiMatch.score.home || 0;
              awayScore = apiMatch.score.away || 0;
            } else if (apiMatch.goals) {
              homeScore = apiMatch.goals.home || 0;
              awayScore = apiMatch.goals.away || 0;
            }

            const homeTeamDetails = apiMatch.homeTeam || apiMatch.teams?.home || {};
            const awayTeamDetails = apiMatch.awayTeam || apiMatch.teams?.away || {};
            
            // Prepare the 'league' field for the Match object
            // It uses the 'league' from the outer loop of getRecentMatchesForTopLeagues
            const matchLeagueObject = {
              id: league.id?.toString() || 'unknown-league',
              name: league.name || 'Unknown League',
              logo: league.logo || '/leagues/default.png',
              season: apiMatch.league?.season || league.season || undefined, // Use API season if available, else outer league's season
              round: apiMatch.round || apiMatch.league?.round || undefined, // Use API round if available
            };

            return {
              id: apiMatch.id?.toString() || `match-${Date.now()}-${Math.random()}`,
              date: apiMatch.date || new Date().toISOString(),
              time: apiMatch.time,
              timestamp: apiMatch.timestamp,
              timezone: apiMatch.timezone,
              status: apiMatch.status || apiMatch.state,
              league: matchLeagueObject, // Assign the composed league object
              homeTeam: {
                id: (homeTeamDetails.id || 'home').toString(),
                name: homeTeamDetails.name || 'Home Team',
                logo: homeTeamDetails.logo || '/teams/default.png',
              },
              awayTeam: {
                id: (awayTeamDetails.id || 'away').toString(),
                name: awayTeamDetails.name || 'Away Team',
                logo: awayTeamDetails.logo || '/teams/default.png',
              },
              score: {
                halftime: apiMatch.score?.halftime,
                fulltime: apiMatch.score?.fulltime || (typeof homeScore === 'number' && typeof awayScore === 'number' ? `${homeScore}-${awayScore}` : undefined),
                extratime: apiMatch.score?.extratime,
                penalty: apiMatch.score?.penalty,
              },
              goals: {
                  home: homeScore,
                  away: awayScore,
              },
              events: apiMatch.events || [],
              // highlights: apiMatch.highlights ? [transformToMatchHighlight(apiMatch.highlights)] : [], // If needed
              state: apiMatch.state, 
              round: apiMatch.round || matchLeagueObject.round, // Ensure round is consistent
              country: apiMatch.country, 
            };
          });
          
          if (transformedDomainMatches.length > 0) {
            leaguesWithMatches.push({
              id: league.id.toString(),
              name: league.name,
              logo: league.logo || `/leagues/${league.name.toLowerCase().replace(/\s+/g, '-')}.png`,
              matches: transformedDomainMatches, // This is now Match[]
            });
            
            console.log(`[Highlightly] ✅ Added ${transformedDomainMatches.length} matches for ${league.name}`);
          }
          
        } catch (error) {
          console.error(`[Highlightly] Error processing league ${league.name}:`, error);
          continue;
        }
      }
      
      console.log(`[Highlightly] Final result: ${leaguesWithMatches.length} leagues with matches`);
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
