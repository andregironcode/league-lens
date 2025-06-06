import { MatchHighlight, LeagueWithMatches, TeamDetails, League, Match, EnhancedMatchHighlight, Player, Lineups } from '@/types';
import { highlightlyClient } from '@/integrations/highlightly/client';
import * as mockService from './highlightService';
import { get14DayDateRange, getCurrentDateCET, formatDateForAPI, logCurrentTimeInfo } from '@/utils/dateUtils';

/**
 * Simplified Highlightly Service
 * This service trusts the Highlightly API 100% and removes complex mapping logic
 */
export const highlightlyService = {
  /**
   * Get recommended highlights - fallback to mock for now
   */
  async getRecommendedHighlights(): Promise<MatchHighlight[]> {
    console.log('[Highlightly] Recommended highlights not implemented, falling back to mock service');
    return mockService.getRecommendedHighlights();
  },

  /**
   * SUPER OPTIMIZED: Gets all matches for a SINGLE date for top leagues.
   * This is the new, efficient on-demand method.
   * API Calls: 4-8 (one per league)
   */
  async getMatchesForDate(date: string): Promise<LeagueWithMatches[]> {
    console.log(`[Highlightly] OPTIMIZED: Fetching matches for single date: ${date}`);
    
    const topLeaguesConfig = [
      { id: '33973', name: 'Premier League' },
      { id: '2486', name: 'UEFA Champions League' },
      { id: '119924', name: 'La Liga' },
      { id: '115669', name: 'Serie A' },
      { id: '67162', name: 'Bundesliga' },
      { id: '52695', name: 'Ligue 1' },
    ];

    const leagueDataMap: Record<string, { id: string; name: string; logo: string }> = {
      '33973': { id: '33973', name: 'Premier League', logo: 'https://highlightly.net/soccer/images/leagues/33973.png' },
      '2486': { id: '2486', name: 'UEFA Champions League', logo: 'https://highlightly.net/soccer/images/leagues/2486.png' },
      '119924': { id: '119924', name: 'La Liga', logo: 'https://highlightly.net/soccer/images/leagues/119924.png' },
      '115669': { id: '115669', name: 'Serie A', logo: 'https://highlightly.net/soccer/images/leagues/115669.png' },
      '67162': { id: '67162', name: 'Bundesliga', logo: 'https://highlightly.net/soccer/images/leagues/67162.png' },
      '52695': { id: '52695', name: 'Ligue 1', logo: 'https://highlightly.net/soccer/images/leagues/52695.png' },
    };

    try {
      const promises = topLeaguesConfig.map(async (league) => {
        const matchesResponse = await highlightlyClient.getMatches({
          leagueId: league.id,
          date,
          limit: '20',
        });

        const matches = matchesResponse?.data || [];
        if (matches.length > 0) {
          return {
            ...(leagueDataMap[league.id]),
            matches: matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
          };
        }
        return null;
      });

      const results = await Promise.allSettled(promises);
      const leaguesWithMatches = results
        .filter((result): result is PromiseFulfilledResult<LeagueWithMatches> => result.status === 'fulfilled' && result.value !== null)
        .map((result) => result.value);
      
      console.log(`[Highlightly] Found ${leaguesWithMatches.length} leagues with matches on ${date}`);
      return leaguesWithMatches;

    } catch (error) {
      console.error(`[Highlightly] Error in getMatchesForDate for ${date}:`, error);
      return [];
    }
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
   * Get match by ID - simplified version trusting API response
   */
  async getMatchById(id: string): Promise<EnhancedMatchHighlight | null> {
    console.log(`[Highlightly] Fetching match details for ID: ${id}`);
    
    try {
      // Get main match data
      const response = await highlightlyClient.getMatchById(id);
      const matchData = Array.isArray(response) ? response[0] : response;
      
      if (!matchData) {
        console.error(`[Highlightly] No match data found for ID: ${id}`);
        return null;
      }

             // Create enhanced match object directly from API response
       const enhancedMatch: EnhancedMatchHighlight = {
         id: matchData.id || id,
         title: matchData.title || `${matchData.homeTeam?.name || 'Home'} vs ${matchData.awayTeam?.name || 'Away'}`,
         thumbnailUrl: matchData.thumbnail || matchData.thumbnailUrl || '',
         videoUrl: matchData.videoUrl || '',
         duration: matchData.duration || '00:00',
         views: matchData.views || 0,
         competition: matchData.competition || matchData.league || { id: '', name: '', logo: '' },
         homeTeam: matchData.homeTeam || { id: '', name: 'Home', logo: '' },
         awayTeam: matchData.awayTeam || { id: '', name: 'Away', logo: '' },
         date: matchData.date || new Date().toISOString(),
         status: matchData.status || { long: 'Scheduled', short: 'SCH' },
         score: matchData.score || { home: null, away: null },
         events: matchData.events || [],
         statistics: matchData.statistics || [],
         lineups: undefined
       };

      // Try to fetch lineups if available
      try {
        const lineupsResponse = await highlightlyClient.getLineups(id);
        if (lineupsResponse) {
          enhancedMatch.lineups = lineupsResponse;
        }
      } catch (lineupError) {
        console.log(`[Highlightly] Lineups not available for match ${id}`);
      }

      // Try to fetch statistics if available
      try {
        const statsResponse = await highlightlyClient.getStatistics(id);
        if (statsResponse) {
          enhancedMatch.statistics = statsResponse;
        }
      } catch (statsError) {
        console.log(`[Highlightly] Statistics not available for match ${id}`);
      }

      return enhancedMatch;
    } catch (error) {
      console.error(`[Highlightly] Error fetching match with ID ${id}:`, error);
      return null;
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
   * Get team details - fallback to mock for now
   */
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    console.log(`[Highlightly] getTeamDetails not implemented for ${teamId}, falling back to mock service`);
    return mockService.getTeamDetails(teamId);
  },

  /**
   * Search highlights - fallback to mock for now
   */
  async searchHighlights(query: string): Promise<MatchHighlight[]> {
    console.log(`[Highlightly] searchHighlights not implemented for "${query}", falling back to mock service`);
    return mockService.searchHighlights(query);
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
   async getHighlightsForMatch(matchId: string, limit: number = 5): Promise<MatchHighlight[]> {
     try {
       const response = await highlightlyClient.getHighlights({ 
         match: matchId, 
         limit: String(limit) 
       });
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
   * Get last five games - trusting API response
   */
  async getLastFiveGames(teamId: string): Promise<Match[]> {
    try {
      const response = await highlightlyClient.getLastFiveGames(teamId);
      console.log(`[Highlightly] Last five games for team ${teamId}:`, response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Error fetching last 5 games for team ${teamId}:`, error);
      return [];
    }
  },

     /**
    * Get head-to-head matches - trusting API response
    */
   async getHeadToHead(teamId1: string, teamId2: string): Promise<Match[]> {
     try {
       const response = await highlightlyClient.getHeadToHead({ 
         h2h: `${teamId1}-${teamId2}`
       });
       console.log(`[Highlightly] Head-to-head for teams ${teamId1} vs ${teamId2}:`, response);
       return Array.isArray(response) ? response : [];
     } catch (error) {
       console.error(`Error fetching H2H for teams ${teamId1} and ${teamId2}:`, error);
       return [];
     }
   },
};

