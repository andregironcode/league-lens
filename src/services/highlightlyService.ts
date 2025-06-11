import { MatchHighlight, LeagueWithMatches, TeamDetails, League, Match, Team, EnhancedMatchHighlight, Player, Lineups, TableRow } from '@/types';
import { highlightlyClient } from '@/integrations/highlightly/client';
import * as mockService from './highlightService';
import { get14DayDateRange, getCurrentDateCET, formatDateForAPI, logCurrentTimeInfo } from '@/utils/dateUtils';

/**
 * Optimized Highlightly Service
 * This service minimizes API calls through smart batching and caching
 */

// Top leagues configuration - centralized
const TOP_LEAGUES = [
  { id: '33973', name: 'Premier League' },
  { id: '2486', name: 'UEFA Champions League' },
  { id: '119924', name: 'La Liga' },
  { id: '115669', name: 'Serie A' },
  { id: '67162', name: 'Bundesliga' },
  { id: '52695', name: 'Ligue 1' },
  { id: '13549', name: 'FIFA Club World Cup' },
];

const LEAGUE_DATA_MAP: Record<string, { id: string; name: string; logo: string }> = {
  '33973': { id: '33973', name: 'Premier League', logo: 'https://highlightly.net/soccer/images/leagues/33973.png' },
  '2486': { id: '2486', name: 'UEFA Champions League', logo: 'https://highlightly.net/soccer/images/leagues/2486.png' },
  '119924': { id: '119924', name: 'La Liga', logo: 'https://highlightly.net/soccer/images/leagues/119924.png' },
  '115669': { id: '115669', name: 'Serie A', logo: 'https://highlightly.net/soccer/images/leagues/115669.png' },
  '67162': { id: '67162', name: 'Bundesliga', logo: 'https://highlightly.net/soccer/images/leagues/67162.png' },
  '52695': { id: '52695', name: 'Ligue 1', logo: 'https://highlightly.net/soccer/images/leagues/52695.png' },
  '13549': { id: '13549', name: 'FIFA Club World Cup', logo: 'https://highlightly.net/soccer/images/leagues/13549.png' },
};

export const highlightlyService = {
  /**
   * Get recommended highlights - fallback to mock for now
   */
  async getRecommendedHighlights(): Promise<MatchHighlight[]> {
    console.log('[Highlightly] Recommended highlights not implemented, falling back to mock service');
    return mockService.getRecommendedHighlights();
  },

  /**
   * Get last 5 played matches across ALL leagues with highlights
   */
  async getLast5FeaturedMatches(): Promise<Match[]> {
    console.log('[Highlightly] Fetching last 5 matches across all leagues');
    
    try {
      // First try to get recent matches with explicit date range
      // Calculate date range: today and 14 days in the past
      const today = new Date();
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);
      
      const todayStr = today.toISOString().split('T')[0];
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
      
      console.log(`[Highlightly] Fetching matches from ${twoWeeksAgoStr} to ${todayStr}`);
      
      // First attempt: Get recent matches from the last 14 days
      // More specific filtering to ensure we get recent matches
      const response = await highlightlyClient.getMatches({
        limit: '50', // Increased limit to ensure we find enough matches with highlights
        date: `${twoWeeksAgoStr},${todayStr}` // Date range format for the API
      });
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.error('[Highlightly] Invalid API response format:', response);
        throw new Error('Invalid API response format');
      }
      
      console.log(`[Highlightly] Received ${response.data.length} matches from API`);
      
      // Debug: Log the first match to see its structure
      if (response.data.length > 0) {
        console.log('[Highlightly] First match example:', JSON.stringify(response.data[0], null, 2));
      }
      
      // Filter matches that have highlights
      const matchesWithHighlights = response.data.filter(match => {
        const hasHighlights = !!match.highlights && Array.isArray(match.highlights) && match.highlights.length > 0;
        return hasHighlights;
      });
      
      console.log(`[Highlightly] Found ${matchesWithHighlights.length} matches with highlights`);
      
      // Sort by date (most recent first)
      // Use the raw date from API - handle multiple date formats
      matchesWithHighlights.sort((a, b) => {
        // Try to extract dates from various possible properties
        const getDateValue = (match: any): number => {
          // Try different date properties based on the API structure
          if (match.date) return new Date(match.date).getTime();
          if (match.fixture?.date) return new Date(match.fixture.date).getTime();
          if (match.fixture?.timestamp) return match.fixture.timestamp * 1000;
          return 0; // Default to 0 if no valid date found
        };
        
        return getDateValue(b) - getDateValue(a); // Descending (newest first)
      });
      
      // Take only the 5 most recent matches with highlights
      const recentMatches = matchesWithHighlights.slice(0, 5);
      
      console.log('[Highlightly] Selected the 5 most recent matches with highlights:');
      recentMatches.forEach((match, idx) => {
        const date = match.date || match.fixture?.date || 'Unknown date';
        const homeTeam = match.homeTeam?.name || match.teams?.home?.name || 'Unknown';
        const awayTeam = match.awayTeam?.name || match.teams?.away?.name || 'Unknown';
        console.log(`[Highlightly] ${idx + 1}. ${date}: ${homeTeam} vs ${awayTeam}`);
      });
      
      // Return the raw match data directly from the API
      return recentMatches;
    } catch (error) {
      console.error('[Highlightly] Error fetching last 5 matches:', error);
      
      // No mapping allowed - if API fails, return an empty array
      return [];
    }
  },

  /**
   * SUPER OPTIMIZED: Gets all matches for a SINGLE date for top leagues.
   * Uses batch processing to minimize API calls.
   * API Calls: 1 batch request (instead of 6+ individual calls)
   */
  async getMatchesForDate(date: string): Promise<LeagueWithMatches[]> {
    console.log(`[Highlightly] OPTIMIZED: Fetching matches for single date: ${date} (batched)`);
    
    try {
      // Use the new batch method to get all leagues' matches in one go
      const leagueIds = TOP_LEAGUES.map(league => league.id);
      const matchesResponses = await highlightlyClient.getMatchesForLeagues(
        leagueIds, 
        date
      );

      const leaguesWithMatches: LeagueWithMatches[] = [];

      matchesResponses.forEach((response, index) => {
        const leagueId = leagueIds[index];
        const matches = (response as any)?.data || [];
        
        console.log(`[Highlightly] League ${leagueId} (${TOP_LEAGUES[index]?.name}) returned ${matches.length} matches for ${date}`);
        
        if (matches.length > 0) {
          const leagueData = LEAGUE_DATA_MAP[leagueId];
          if (leagueData) {
            leaguesWithMatches.push({
              ...leagueData,
              matches: matches.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            });
            console.log(`[Highlightly] Added league ${leagueData.name} with ${matches.length} matches`);
          }
        } else {
          console.log(`[Highlightly] No matches found for league ${leagueId} (${TOP_LEAGUES[index]?.name}) on ${date}`);
        }
      });
      
      console.log(`[Highlightly] Found ${leaguesWithMatches.length} leagues with matches on ${date} (${matchesResponses.length} API calls)`);
      return leaguesWithMatches;

    } catch (error) {
      console.error(`[Highlightly] Error in getMatchesForDate for ${date}:`, error);
      return [];
    }
  },

  /**
   * OPTIMIZED: Get matches for multiple dates efficiently
   * This reduces API calls when loading week/month views
   */
  async getMatchesForDateRange(startDate: string, endDate: string): Promise<Record<string, LeagueWithMatches[]>> {
    console.log(`[Highlightly] OPTIMIZED: Fetching matches for date range: ${startDate} to ${endDate}`);
    
    const dates = this.generateDateRange(startDate, endDate);
    const results: Record<string, LeagueWithMatches[]> = {};
    
    // Process dates in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < dates.length; i += batchSize) {
      const dateBatch = dates.slice(i, i + batchSize);
      
      const batchPromises = dateBatch.map(date => 
        this.getMatchesForDate(date).then(leagues => ({ date, leagues }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results[result.value.date] = result.value.leagues;
        }
      });
      
      // Small delay between date batches
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  },

  /**
   * Helper: Generate date range array
   */
  generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  },

  /**
   * DEPRECATED: This function is inefficient and makes too many API calls.
   * Use getMatchesForDate for on-demand loading.
   */
  async getRecentMatchesForTopLeagues(): Promise<LeagueWithMatches[]> {
    console.warn('[Highlightly] DEPRECATED: getRecentMatchesForTopLeagues is inefficient and should not be used. Use getMatchesForDate instead.');
    return [];
  },

  /**
   * OPTIMIZED: Get match by ID with all related data in one batch
   * API Calls: 1 batch request (instead of 3+ individual calls)
   */
  async getMatchById(id: string): Promise<EnhancedMatchHighlight | null> {
    console.log(`[Highlightly] OPTIMIZED: Fetching complete match details for ID: ${id}`);
    
    try {
      // Use the new batch method to get all match data at once
      console.log(`[Highlightly] Fetching complete match details for match ID: ${id}`);
      const batchResponse = await highlightlyClient.getCompleteMatchDetails(id);
      const { match: matchDataResponse, lineups, statistics, events } = batchResponse;
      
      console.log(`[Highlightly] Match batch response structure:`, {
        hasMatchData: Boolean(matchDataResponse),
        hasLineups: Boolean(lineups),
        hasStatistics: Boolean(statistics),
        hasEvents: Boolean(events),
        eventsCount: events ? (Array.isArray(events) ? events.length : 'not an array') : 'null'
      });
      
      if (!matchDataResponse) {
        console.error(`[Highlightly] No match data found for ID: ${id}`);
        return null;
      }

      // The API returns an array, get the first item
      const matchData = Array.isArray(matchDataResponse) ? matchDataResponse[0] : matchDataResponse;
      
      if (!matchData) {
        console.error(`[Highlightly] No match data in response for ID: ${id}`);
        return null;
      }

      console.log(`[Highlightly] Raw match data from API:`, JSON.stringify(matchData, null, 2));

      // Extract teams from events since they're not in the root object
      const extractTeamsFromEvents = (events: any[]) => {
        if (!events || !Array.isArray(events)) {
          console.warn(`[Highlightly] No events found to extract teams from`);
          return { homeTeam: null, awayTeam: null };
        }

        const teams = new Map();
        events.forEach(event => {
          if (event.team && event.team.id) {
            teams.set(event.team.id, {
              id: event.team.id.toString(),
              name: event.team.name || 'Unknown',
              logo: event.team.logo || ''
            });
          }
        });

        const teamArray = Array.from(teams.values());
        console.log(`[Highlightly] Extracted ${teamArray.length} teams from events:`, teamArray);

        return {
          homeTeam: teamArray[0] || { id: '', name: 'Home', logo: '' },
          awayTeam: teamArray[1] || { id: '', name: 'Away', logo: '' }
        };
      };

      // Calculate score from goal events
      const calculateScoreFromEvents = (events: any[], homeTeamId: string, awayTeamId: string) => {
        if (!events || !Array.isArray(events)) {
          console.warn(`[Highlightly] No events found to calculate score from`);
          return { current: '0 - 0', home: 0, away: 0 };
        }

        let homeGoals = 0;
        let awayGoals = 0;

        events.forEach(event => {
          if (event.type && event.type.toLowerCase().includes('goal') && !event.type.toLowerCase().includes('own')) {
            if (event.team && event.team.id) {
              const teamId = event.team.id.toString();
              if (teamId === homeTeamId) {
                homeGoals++;
              } else if (teamId === awayTeamId) {
                awayGoals++;
              }
            }
          }
        });

        console.log(`[Highlightly] Calculated score - Home: ${homeGoals}, Away: ${awayGoals}`);
        return {
          current: `${homeGoals} - ${awayGoals}`,
          home: homeGoals,
          away: awayGoals
        };
      };

      // Prioritize separately fetched events data over any events in the match data
      const eventsData = events || matchData.events || [];
      console.log(`[Highlightly] Events data:`, { 
        fromSeparateCall: Boolean(events), 
        fromMatchData: Boolean(matchData.events),
        eventCount: eventsData.length
      });
      
      // Extract teams from events
      const { homeTeam, awayTeam } = extractTeamsFromEvents(eventsData);

      // Extract competition / league data directly from the API response.
      // The Highlightly API may return this information in different locations depending on the
      // endpoint version. We trust the API structure entirely and do **not** map or transform any
      // field names – only pick the existing league/competition object as-is.

      let competition: any = null;

      if (matchData.league && (matchData.league.id || matchData.league.name)) {
        competition = matchData.league;
      } else if (matchData.competition && (matchData.competition.id || matchData.competition.name)) {
        competition = matchData.competition;
      } else if (matchData.match && matchData.match.league) {
        competition = matchData.match.league;
      }

      if (!competition) {
        console.warn('[Highlightly] No league/competition information found in match response.');
      } else {
        console.log('[Highlightly] League information extracted from API:', competition);
      }

      // Calculate score from events
      const score = calculateScoreFromEvents(eventsData, homeTeam?.id || '', awayTeam?.id || '');

      // Create enhanced match object from processed data
      const enhancedMatch: EnhancedMatchHighlight = {
        id: matchData.id || id,
        title: `${homeTeam?.name || 'Home'} vs ${awayTeam?.name || 'Away'}`,
        thumbnailUrl: matchData.thumbnail || matchData.thumbnailUrl || '',
        videoUrl: matchData.videoUrl || matchData.video_url || '',
        duration: matchData.duration || '90:00',
        views: matchData.views || 0,
        competition,
        homeTeam: homeTeam || { id: '', name: 'Home', logo: '' },
        awayTeam: awayTeam || { id: '', name: 'Away', logo: '' },
        date: matchData.date || new Date().toISOString(),
        status: matchData.status || { description: 'Full Time' },
        score,
        events: eventsData,
        statistics: Array.isArray(statistics) ? statistics : [],
        lineups: lineups || undefined
      };

      console.log(`[Highlightly] Enhanced match created:`, {
        id: enhancedMatch.id,
        homeTeam: enhancedMatch.homeTeam,
        awayTeam: enhancedMatch.awayTeam,
        competition: enhancedMatch.competition,
        score: enhancedMatch.score
      });

      return enhancedMatch;
    } catch (error) {
      console.error(`[Highlightly] Error fetching match with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * OPTIMIZED: Get league details for multiple leagues in batch
   */
  async getMultipleLeagueDetails(leagueIds: string[]): Promise<(League | null)[]> {
    console.log(`[Highlightly] OPTIMIZED: Fetching ${leagueIds.length} league details in batch`);
    
    try {
      const responses = await highlightlyClient.getLeaguesByIds(leagueIds);
      return responses.map(response => 
        Array.isArray(response) && response.length > 0 ? response[0] : response
      );
    } catch (error) {
      console.error('Error fetching multiple league details from Highlightly:', error);
      return leagueIds.map(() => null);
    }
  },

  /**
   * OPTIMIZED: Get standings for multiple leagues in batch
   */
  async getMultipleLeagueStandings(leagueIds: string[], season?: string): Promise<any[]> {
    console.log(`[Highlightly] OPTIMIZED: Fetching ${leagueIds.length} league standings in batch`);
    
    try {
      return await highlightlyClient.getStandingsForLeagues(leagueIds, season);
    } catch (error) {
      console.error('Error fetching multiple league standings from Highlightly:', error);
      return leagueIds.map(() => ({ groups: [] }));
    }
  },

  /**
   * Get team highlights - fallback to mock for now
   */
  async getTeamHighlights(teamId: string): Promise<MatchHighlight[]> {
    console.log(`[Highlightly] getTeamHighlights not implemented for ${teamId}, falling back to mock service`);
    return mockService.getTeamHighlights(teamId);
  },

  /**
   * Get team details with enhanced data directly from API
   * Including complete match data with scorelines and league standings
   */
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    console.log(`[Highlightly] Fetching team details for ${teamId} from API`);
    
    try {
      // Step 1: Fetch basic team info and statistics
      const [teamInfo, teamStats, lastFiveGames] = await Promise.all([
        highlightlyClient.getTeamById(teamId),
        highlightlyClient.getTeamStats(teamId),
        highlightlyClient.getLastFiveGames(teamId)
      ]);

      console.log('[Highlightly] Team API response:', teamInfo);
      console.log('[Highlightly] Team stats response:', teamStats);
      console.log('[Highlightly] Last five games response:', lastFiveGames);

      // If team info is not available, return null
      if (!teamInfo || (Array.isArray(teamInfo) && teamInfo.length === 0)) {
        console.error(`[Highlightly] Team with ID ${teamId} not found`);
        return null;
      }

      // Extract team data - supporting both array and object formats from API
      const team = Array.isArray(teamInfo) ? teamInfo[0] : teamInfo;

      // Step 2: Identify team's primary league from team stats
      let primaryLeague = {
        id: '',
        name: 'League',
        logo: '',
        season: ''
      };

      if (Array.isArray(teamStats) && teamStats.length > 0) {
        const firstLeagueStat = teamStats[0];
        primaryLeague = {
          id: firstLeagueStat.leagueId || '',
          name: firstLeagueStat.leagueName || 'League',
          logo: firstLeagueStat.leagueLogo || '',
          season: firstLeagueStat.season?.toString() || ''
        };
      }

      // Step 3: Process match data - split into fixtures (future) and recentMatches (past)
      const today = new Date();
      const allMatches = Array.isArray(lastFiveGames) ? lastFiveGames : [];
      
      // Fixtures are upcoming matches
      const fixtures = allMatches
        .filter(match => {
          const matchDate = match.date ? new Date(match.date) : today;
          return matchDate > today;
        })
        .map(match => ({
          id: String(match.id || ''),
          homeTeam: match.homeTeam || match.teams?.home || { id: '', name: 'Unknown', logo: '' },
          awayTeam: match.awayTeam || match.teams?.away || { id: '', name: 'Unknown', logo: '' },
          date: match.date || '',
          competition: match.league?.name || match.competition?.name || ''
        }));
      
      // Recent matches are past matches with full match details including scorelines
      const recentMatches = allMatches
        .filter(match => {
          const matchDate = match.date ? new Date(match.date) : today;
          return matchDate <= today;
        })
        .map(match => {
          // Transform to Match type with full score details
          return {
            id: String(match.id || ''),
            date: match.date || '',
            homeTeam: match.homeTeam || match.teams?.home || { id: '', name: 'Unknown', logo: '' },
            awayTeam: match.awayTeam || match.teams?.away || { id: '', name: 'Unknown', logo: '' },
            league: match.league || match.competition || { id: '', name: 'Unknown', logo: '' },
            score: match.score || match.goals || { home: 0, away: 0 },
            state: match.state || { status: '', description: '' },
            events: match.events || []  
          } as Match;
        });

      // Step 4: Fetch league standings if we have a league ID
      let standings: TableRow[] = [];
      if (primaryLeague.id) {
        try {
          console.log(`[Highlightly] Fetching standings for league ${primaryLeague.id} and season ${primaryLeague.season}`);
          const standingsResponse = await highlightlyClient.getStandings({
            leagueId: primaryLeague.id,
            ...( primaryLeague.season && { season: primaryLeague.season })
          });
          
          console.log('[Highlightly] Standings API response:', standingsResponse);
          
          // Extract standings data from response
          if (standingsResponse?.data && Array.isArray(standingsResponse.data)) {
            standings = standingsResponse.data.map((row: any) => ({
              position: row.position || 0,
              team: {
                id: String(row.team?.id || ''),
                name: row.team?.name || 'Unknown',
                logo: row.team?.logo || ''
              },
              played: row.played || 0,
              won: row.won || row.win || 0,
              drawn: row.drawn || row.draw || 0,
              lost: row.lost || row.lose || 0,
              goalsFor: row.goalsFor || row.goals?.for || 0,
              goalsAgainst: row.goalsAgainst || row.goals?.against || 0,
              goalDifference: row.goalDifference || row.goalsDiff || 0,
              points: row.points || 0
            }));
          }
        } catch (error) {
          console.error('[Highlightly] Error fetching league standings:', error);
          // Continue execution even if standings fetch fails
        }
      }
      
      // Step 5: Prepare league table from standings or from team stats as fallback
      const leagueTable: TableRow[] = standings.length > 0 ? standings : [];
      
      // Fallback to create a minimal standing from team stats if no standings data
      if (leagueTable.length === 0 && Array.isArray(teamStats) && teamStats.length > 0) {
        const leagueStat = teamStats[0];
        if (leagueStat.total?.games?.played) {
          // Create a minimal standing row for this team in this league
          leagueTable.push({
            position: 1, // Position is not directly available from team stats
            team: {
              id: teamId,
              name: team.name || 'Unknown',
              logo: team.logo || ''
            },
            played: leagueStat.total.games.played || 0,
            won: leagueStat.total.games.wins || 0,
            drawn: leagueStat.total.games.draws || 0,
            lost: leagueStat.total.games.loses || 0,
            goalsFor: leagueStat.total.goals.scored || 0,
            goalsAgainst: leagueStat.total.goals.received || 0,
            goalDifference: (leagueStat.total.goals.scored || 0) - (leagueStat.total.goals.received || 0),
            points: (leagueStat.total.games.wins || 0) * 3 + (leagueStat.total.games.draws || 0)
          });
        }
      }

      // Step 6: Build complete team details from raw API data
      const teamDetails: TeamDetails = {
        team: {
          id: teamId,
          name: team.name || 'Unknown',
          logo: team.logo || ''
        },
        league: primaryLeague,
        leagueStanding: Array.isArray(teamStats) && teamStats.length > 0 ? 
          `${teamStats[0].leagueName || 'League'}: Position data not available` : 'No league data',
        europeanCompetition: null, // Determine from teamStats if available
        europeanStanding: null,
        leagueTable,
        europeanTable: [], // Not directly available from API
        fixtures,
        recentMatches,
        // Store raw API data for full transparency
        apiData: {
          teamInfo: team,
          teamStats,
          lastFiveGames, 
          standings: standings.length > 0 ? standings : undefined
        }
      };

      return teamDetails;
    } catch (error) {
      console.error('[Highlightly] Error fetching team details:', error);
      return null;
    }
  },

  /**
   * Search highlights - now implemented to query Highlightly API directly, fully trusting API data
   */
  async searchHighlights(query: string): Promise<MatchHighlight[]> {
    if (!query.trim()) {
      return [];
    }
    try {
      // Directly query the Highlightly API for highlights matching the query.
      // According to the documentation, the /highlights endpoint supports filtering by `match`,
      // `homeTeamName`, or `awayTeamName`. We pass the query as the generic `match` filter and
      // request a reasonable limit. No transformation is done – raw API is returned.
      const response = await highlightlyClient.getHighlights({ match: query, limit: '50' });

      // Ensure the response is an array (the API typically returns an array of highlights)
      return Array.isArray(response) ? response as MatchHighlight[] : [];
    } catch (error) {
      console.error('[Highlightly] Error searching highlights:', error);
      return [];
    }
  },

  /**
   * Get league details - trusting API response
   */
  async getLeagueDetails(leagueId: string): Promise<League | null> {
    try {
      const response = await highlightlyClient.getLeagueById(leagueId);
      return Array.isArray(response) && response.length > 0 ? response[0] : response;
    } catch (error) {
      console.error('Error fetching league details from Highlightly:', error);
      return null;
    }
  },

  /**
   * Get standings for league - trusting API response
   */
  async getStandingsForLeague(leagueId: string, season: string): Promise<any> {
    try {
      return await highlightlyClient.getStandings({ leagueId, season });
    } catch (error) {
      console.error('Error fetching standings from Highlightly:', error);
      return { groups: [] };
    }
  },

  /**
   * Get matches for league by date - trusting API response
   */
  async getMatchesForLeagueByDate(leagueId: string, date: string, season?: string): Promise<Match[]> {
    try {
      const params: any = { leagueId, date, limit: '10' };
      if (season) params.season = season;
      
      const response = await highlightlyClient.getMatches(params);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching matches by date from Highlightly:', error);
      return [];
    }
  },

  /**
   * Get all matches for league season - trusting API response
   */
  async getAllMatchesForLeagueSeason(leagueId: string, season: string): Promise<Match[]> {
    try {
      const response = await highlightlyClient.getMatches({ leagueId, season });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all matches for league season from Highlightly:', error);
      return [];
    }
  },

  /**
   * Get highlights for league - trusting API response
   */
  async getHighlightsForLeague(leagueId: string, season: string, limit: number = 20, offset: number = 0): Promise<MatchHighlight[]> {
    try {
      const response = await highlightlyClient.getHighlights({ 
        leagueId, 
        season, 
        limit: String(limit), 
        offset: String(offset) 
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching highlights from Highlightly:', error);
      return [];
    }
  },
  
  /**
   * Get highlights for match - trusting API response
   */
  async getHighlightsForMatch(matchId: string, limit: number = 20): Promise<MatchHighlight[]> {
    try {
      console.log(`[Highlightly] Fetching highlights for match: ${matchId}`);
      const response = await highlightlyClient.getHighlights({ 
        matchId: matchId, 
        limit: String(limit) 
      });
      console.log(`[Highlightly] Highlights response:`, response);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching highlights for match from Highlightly:', error);
      return [];
    }
  },

  /**
   * Get match details - trusting API response
   */
  async getMatchDetails(matchId: string): Promise<Match | null> {
    try {
      const response = await highlightlyClient.getMatchById(matchId);
      return Array.isArray(response) && response.length > 0 ? response[0] : response;
    } catch (error) {
      console.error('Error fetching match details from Highlightly:', error);
      return null;
    }
  },

  /**
   * Get last five games for a team - trusting API response
   */
  async getLastFiveGames(teamId: string): Promise<Match[]> {
    try {
      console.log(`[Highlightly] Fetching last 5 games for team: ${teamId}`);
      const response = await highlightlyClient.getLastFiveGames(teamId);
      console.log(`[Highlightly] Last 5 games response:`, response);
      // API returns Match[] directly (not wrapped in data property)
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`[Highlightly] Error fetching last 5 games for team ${teamId}:`, error);
      return [];
    }
  },

  /**
   * Get head-to-head matches between two teams - trusting API response
   */
  async getHeadToHead(teamId1: string, teamId2: string): Promise<Match[]> {
    try {
      console.log(`[Highlightly] Fetching H2H for teams: ${teamId1} vs ${teamId2}`);
      const response = await highlightlyClient.getHeadToHead(teamId1, teamId2);
      console.log(`[Highlightly] H2H response:`, response);
      // API returns Match[] directly (not wrapped in data property)
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`[Highlightly] Error fetching H2H for teams ${teamId1} vs ${teamId2}:`, error);
      return [];
    }
  },

  /**
   * Utility: Get client cache stats for debugging
   */
  getCacheStats() {
    return highlightlyClient.getCacheStats();
  },

  /**
   * Utility: Clear client cache
   */
  clearCache() {
    return highlightlyClient.clearCache();
  },

  /**
   * Search entities (teams, leagues, matches) - trusts API data
   */
  async searchEntities(query: string): Promise<{ teams: Team[]; leagues: League[]; matches: Match[] }> {
    if (!query.trim()) {
      return { teams: [], leagues: [], matches: [] };
    }
    try {
      const normalizedQuery = query.trim();

      // Perform parallel API requests
      const [teamsRes, leaguesRes, matchesHomeRes, matchesAwayRes] = await Promise.all([
        highlightlyClient.getTeams({ name: normalizedQuery, limit: '10' } as any),
        highlightlyClient.getLeagues({ leagueName: normalizedQuery, limit: '10' }),
        highlightlyClient.getMatches({ homeTeamName: normalizedQuery, limit: '10' }),
        highlightlyClient.getMatches({ awayTeamName: normalizedQuery, limit: '10' }),
      ]);

      // The API sometimes wraps results in { data: [] }
      const extract = (resp: any) => (Array.isArray(resp) ? resp : resp?.data ?? []);

      const matchesCombined: Match[] = [
        ...extract(matchesHomeRes),
        ...extract(matchesAwayRes),
      ];
      // De-duplicate matches by id
      const uniqueMatches: Record<string, Match> = {};
      matchesCombined.forEach((m) => {
        if (m && !uniqueMatches[m.id]) uniqueMatches[m.id] = m;
      });

      return {
        teams: extract(teamsRes) as Team[],
        leagues: extract(leaguesRes) as League[],
        matches: Object.values(uniqueMatches),
      };
    } catch (error) {
      console.error('[Highlightly] Error searching entities:', error);
      return { teams: [], leagues: [], matches: [] };
    }
  },
};
