import { MatchHighlight, LeagueWithMatches, TeamDetails, League, Match, EnhancedMatchHighlight, Player, Lineups } from '@/types';
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
];

const LEAGUE_DATA_MAP: Record<string, { id: string; name: string; logo: string }> = {
  '33973': { id: '33973', name: 'Premier League', logo: 'https://highlightly.net/soccer/images/leagues/33973.png' },
  '2486': { id: '2486', name: 'UEFA Champions League', logo: 'https://highlightly.net/soccer/images/leagues/2486.png' },
  '119924': { id: '119924', name: 'La Liga', logo: 'https://highlightly.net/soccer/images/leagues/119924.png' },
  '115669': { id: '115669', name: 'Serie A', logo: 'https://highlightly.net/soccer/images/leagues/115669.png' },
  '67162': { id: '67162', name: 'Bundesliga', logo: 'https://highlightly.net/soccer/images/leagues/67162.png' },
  '52695': { id: '52695', name: 'Ligue 1', logo: 'https://highlightly.net/soccer/images/leagues/52695.png' },
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
        date, 
        new Date().getFullYear().toString()
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
      const { match: matchDataResponse, lineups, statistics } = await highlightlyClient.getCompleteMatchDetails(id);
      
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

      // Extract teams from events
      const { homeTeam, awayTeam } = extractTeamsFromEvents(matchData.events || []);

      // Calculate score from events
      const score = calculateScoreFromEvents(matchData.events || [], homeTeam?.id || '', awayTeam?.id || '');

      // Try to determine competition from match ID or use default
      // For now, we'll determine this from the events or use a default
      const competition = {
        id: '2486', // Default to Champions League for now since we can't extract it
        name: 'UEFA Champions League',
        logo: 'https://highlightly.net/soccer/images/leagues/2486.png'
      };

      console.log(`[Highlightly] Extracted data:`, {
        homeTeam,
        awayTeam,
        competition,
        score
      });

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
        events: matchData.events || [],
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
  }
};

