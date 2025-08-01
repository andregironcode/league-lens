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
    console.log('[Highlightly] Fetching last 5 matches from database');
    
    try {
      // Calculate date range: today and 14 days in the past
      const today = new Date();
      // Force use 2024 if system shows 2025
      if (today.getFullYear() === 2025) {
        today.setFullYear(2024);
      }
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(today.getDate() - 14);
      
      const todayStr = today.toISOString().split('T')[0];
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
      
      console.log(`[Highlightly] Fetching matches from ${twoWeeksAgoStr} to ${todayStr}`);
      
      // Use our database API endpoint
      const response = await fetch(`/api/database-matches?startDate=${twoWeeksAgoStr}&endDate=${todayStr}&limit=50`);
      
      if (!response.ok) {
        console.error('[Highlightly] Database API error:', response.status);
        throw new Error('Failed to fetch matches from database');
      }
      
      const data = await response.json();
      
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('[Highlightly] Invalid database response format:', data);
        throw new Error('Invalid database response format');
      }
      
      console.log(`[Highlightly] Received ${data.data.length} matches from database`);
      
      // Filter matches that have highlights and are finished
      const finishedMatchesWithHighlights = data.data.filter(match => {
        const hasHighlights = match.highlights === true;
        const isFinished = match.status?.long?.toLowerCase().includes('full') || 
                          match.status?.long?.toLowerCase().includes('finish') ||
                          match.status?.description?.toLowerCase().includes('full') ||
                          match.status?.description?.toLowerCase().includes('finish');
        return hasHighlights && isFinished;
      });
      
      console.log(`[Highlightly] Found ${finishedMatchesWithHighlights.length} finished matches with highlights`);
      
      // Sort by date (most recent first)
      finishedMatchesWithHighlights.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending (newest first)
      });
      
      // Take only the 5 most recent matches with highlights
      const recentMatches = finishedMatchesWithHighlights.slice(0, 5);
      
      console.log('[Highlightly] Selected the 5 most recent matches with highlights:');
      recentMatches.forEach((match, idx) => {
        const date = match.date || 'Unknown date';
        const homeTeam = match.homeTeam?.name || 'Unknown';
        const awayTeam = match.awayTeam?.name || 'Unknown';
        console.log(`[Highlightly] ${idx + 1}. ${date}: ${homeTeam} vs ${awayTeam}`);
      });
      
      return recentMatches;
    } catch (error) {
      console.error('[Highlightly] Error fetching last 5 matches:', error);
      
      // Fall back to empty array if database fails
      return [];
    }
  },

  /**
   * SUPER OPTIMIZED: Gets all matches for a SINGLE date for top leagues.
   * Now uses database instead of external API
   */
  async getMatchesForDate(date: string): Promise<LeagueWithMatches[]> {
    console.log(`[Highlightly] Fetching matches for date: ${date} from database`);
    
    try {
      // Fetch matches for the specific date from database
      const response = await fetch(`/api/database-matches?date=${date}&limit=200`);
      
      if (!response.ok) {
        console.error('[Highlightly] Database API error:', response.status);
        throw new Error('Failed to fetch matches from database');
      }
      
      const data = await response.json();
      
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('[Highlightly] Invalid database response format:', data);
        throw new Error('Invalid database response format');
      }
      
      console.log(`[Highlightly] Received ${data.data.length} matches for ${date}`);
      
      // Group matches by league
      const matchesByLeague: Record<string, any[]> = {};
      
      data.data.forEach(match => {
        const leagueId = match.league?.id || match.competition_id;
        if (leagueId) {
          if (!matchesByLeague[leagueId]) {
            matchesByLeague[leagueId] = [];
          }
          matchesByLeague[leagueId].push(match);
        }
      });
      
      // Create LeagueWithMatches array for top leagues
      const leaguesWithMatches: LeagueWithMatches[] = [];
      
      TOP_LEAGUES.forEach(topLeague => {
        const leagueMatches = matchesByLeague[topLeague.id] || [];
        
        if (leagueMatches.length > 0) {
          const leagueData = LEAGUE_DATA_MAP[topLeague.id];
          if (leagueData) {
            leaguesWithMatches.push({
              ...leagueData,
              matches: leagueMatches.sort((a: any, b: any) => {
                const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                return timeA - timeB;
              }),
            });
            console.log(`[Highlightly] Added league ${leagueData.name} with ${leagueMatches.length} matches`);
          }
        }
      });
      
      console.log(`[Highlightly] Found ${leaguesWithMatches.length} leagues with matches on ${date}`);
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
   * OPTIMIZED: Get match by ID with all related data from database
   */
  async getMatchById(id: string): Promise<EnhancedMatchHighlight | null> {
    console.log(`[Highlightly] Fetching match details for ID: ${id} from database`);
    
    try {
      // First, fetch match data from database
      const response = await fetch(`/api/database-matches?matchId=${id}&limit=1`);
      
      if (!response.ok) {
        console.error('[Highlightly] Database API error:', response.status);
        throw new Error('Failed to fetch match from database');
      }
      
      const data = await response.json();
      
      if (!data || !data.data || data.data.length === 0) {
        console.error('[Highlightly] No match found in database with ID:', id);
        return null;
      }
      
      const matchData = data.data[0];
      console.log(`[Highlightly] Match data from database:`, matchData);
      
      // Extract API data if available
      const apiData = matchData.api_data || matchData;
      
      // Try to fetch additional data from Highlightly API if needed
      let lineups = null;
      let statistics = null;
      let events = apiData.events || [];
      
      try {
        const batchResponse = await highlightlyClient.getCompleteMatchDetails(id);
        lineups = batchResponse.lineups;
        statistics = batchResponse.statistics;
        if (batchResponse.events && batchResponse.events.length > 0) {
          events = batchResponse.events;
        }
      } catch (error) {
        console.warn(`[Highlightly] Could not fetch additional data from API:`, error);
      }
      
      // Extract teams from database response
      const homeTeam = matchData.homeTeam || { id: '', name: 'Unknown', logo: '' };
      const awayTeam = matchData.awayTeam || { id: '', name: 'Unknown', logo: '' };
      const competition = matchData.league || matchData.competition || { id: '', name: 'Unknown League', logo: '' };

      // Use score from database
      const score = matchData.score || { home: 0, away: 0, current: '0 - 0' };
      if (!score.current) {
        score.current = `${score.home} - ${score.away}`;
      }

      // Create enhanced match object from database data
      const enhancedMatch: EnhancedMatchHighlight = {
        id: matchData.id || id,
        title: `${homeTeam.name} vs ${awayTeam.name}`,
        thumbnailUrl: apiData.thumbnail || apiData.thumbnailUrl || '',
        videoUrl: apiData.videoUrl || apiData.video_url || '',
        duration: apiData.duration || '90:00',
        views: apiData.views || 0,
        competition,
        homeTeam,
        awayTeam,
        date: matchData.date || matchData.match_date || new Date().toISOString(),
        status: typeof matchData.status === 'object' 
          ? matchData.status 
          : { description: matchData.status || 'Full Time', long: matchData.status || 'Full Time' },
        score,
        events: events || [],
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
   * @param teamId The team ID
   * @param season Optional season parameter (e.g., '2023', '2022')
   */
  async getTeamDetails(teamId: string, season?: string): Promise<TeamDetails | null> {
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
   * Get live matches with real-time data
   */
  async getLiveMatches(options?: { bypassCache?: boolean }): Promise<Match[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await highlightlyClient.getMatchesByDate(today, {
        live: 'true',
        ...(options?.bypassCache && { bypassCache: true })
      });
      
      // Filter for actually live matches
      return (response || []).filter(match => {
        const status = (match.status || '').toLowerCase();
        return status.includes('live') || 
               status.includes('1h') || 
               status.includes('2h') || 
               status.includes('half');
      });
    } catch (error) {
      console.error('Error fetching live matches from Highlightly:', error);
      return [];
    }
  },

  /**
   * Get match details - trusting API response
   */
  async getMatchDetails(matchId: string, options?: { realTime?: boolean }): Promise<Match | null> {
    try {
      const requestOptions = options?.realTime ? { bypassCache: true, realTime: true } : undefined;
      const response = await highlightlyClient.getMatchById(matchId, requestOptions);
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
