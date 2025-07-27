import type { MatchHighlight, League, LeagueWithMatches, TeamDetails, StandingsRow, Match } from '@/types';
import { highlightlyService } from './highlightlyService';
import * as mockService from './highlightService';
import * as supabaseService from './supabaseService';

/**
 * Service Type
 * Used to determine which service implementation to use
 */
export type ServiceType = 'mock' | 'supabase' | 'highlightly';

/**
 * Current active service
 * Change this to switch between different service implementations
 */
let activeService: ServiceType = 'highlightly';

/**
 * Service Adapter
 * Exposes a unified API for all service implementations
 */
export const serviceAdapter = {
  /**
   * Set the active service
   */
  setActiveService(serviceType: ServiceType) {
    activeService = serviceType;
    console.log(`Switched to ${serviceType} service`);
  },

  /**
   * Get the current active service
   */
  getActiveService(): ServiceType {
    return activeService;
  },
  
  /**
   * Get live matches with real-time data
   */
  async getLiveMatches(options?: { bypassCache?: boolean }): Promise<Match[]> {
    switch (activeService) {
      case 'highlightly':
        // Fetch live matches with cache bypass for real-time data
        return highlightlyService.getLiveMatches(options);
      case 'supabase':
        // For now, fall back to regular matches
        console.log('[ServiceAdapter] Real-time live matches not yet implemented for supabase');
        return [];
      case 'mock':
      default:
        // Mock service doesn't support live matches
        return [];
    }
  },
  
  /**
   * Get match details with real-time option
   */
  async getMatchDetails(matchId: string, options?: { realTime?: boolean }): Promise<Match | null> {
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.getMatchDetails(matchId, options);
      case 'supabase':
        // Supabase could potentially use real-time subscriptions here
        console.log('[ServiceAdapter] Real-time match details not yet implemented for supabase');
        return supabaseService.getMatchDetails(matchId);
      case 'mock':
      default:
        return null;
    }
  },

  /**
   * Get recommended highlights
   */
  async getRecommendedHighlights(): Promise<MatchHighlight[]> {
    switch (activeService) {
      case 'mock':
        return mockService.getRecommendedHighlights();
      case 'supabase':
        return supabaseService.getRecommendedHighlights();
      case 'highlightly':
        return highlightlyService.getRecommendedHighlights();
      default:
        return mockService.getRecommendedHighlights();
    }
  },

  /**
   * Get last 5 matches from featured leagues with highlights
   */
  async getLast5FeaturedMatches(): Promise<Match[]> {
    switch (activeService) {
      case 'mock':
        return mockService.getRecommendedHighlights()
          .then(highlights => highlights.slice(0, 5)
            .map(h => ({ 
              id: h.id,
              date: h.date || new Date().toISOString(),
              league: h.competition || { id: '0', name: 'Unknown' },
              homeTeam: h.homeTeam || { id: '0', name: 'Unknown', logo: '' },
              awayTeam: h.awayTeam || { id: '0', name: 'Unknown', logo: '' },
              goals: { 
                home: h.score?.home || 0, 
                away: h.score?.away || 0 
              },
              highlights: [h],
              events: []
            })));
      case 'supabase':
        return supabaseService.getRecommendedHighlights()
          .then(highlights => highlights.slice(0, 5)
            .map(h => ({ 
              id: h.id,
              date: h.date || new Date().toISOString(),
              league: h.competition || { id: '0', name: 'Unknown' },
              homeTeam: h.homeTeam || { id: '0', name: 'Unknown', logo: '' },
              awayTeam: h.awayTeam || { id: '0', name: 'Unknown', logo: '' },
              goals: { 
                home: h.score?.home || 0, 
                away: h.score?.away || 0 
              },
              highlights: [h],
              events: []
            })));
      case 'highlightly':
        return highlightlyService.getLast5FeaturedMatches();
      default:
        return mockService.getRecommendedHighlights()
          .then(highlights => highlights.slice(0, 5)
            .map(h => ({ 
              id: h.id,
              date: h.date || new Date().toISOString(),
              league: h.competition || { id: '0', name: 'Unknown' },
              homeTeam: h.homeTeam || { id: '0', name: 'Unknown', logo: '' },
              awayTeam: h.awayTeam || { id: '0', name: 'Unknown', logo: '' },
              goals: { 
                home: h.score?.home || 0, 
                away: h.score?.away || 0 
              },
              highlights: [h],
              events: []
            })));
    }
  },

  /**
   * Get league highlights organized by top leagues
   */
  async getLeagueHighlights(): Promise<League[]> {
    switch (activeService) {
      case 'highlightly':
        // Use the matches-based approach which returns leagues with matches
        const leaguesWithMatches = await highlightlyService.getRecentMatchesForTopLeagues();
        // Transform to League format for compatibility
        return leaguesWithMatches.map(league => ({
          id: league.id,
          name: league.name,
          logo: league.logo,
          highlights: [] // No highlights in this context, just matches
        }));
      case 'mock':
      case 'supabase':
      default:
        return mockService.getLeagueHighlights();
    }
  },

  /**
   * Get match by ID
   */
  async getMatchById(id: string): Promise<MatchHighlight | null> {
    switch (activeService) {
      case 'mock':
        return mockService.getMatchById(id);
      case 'supabase':
        // Note: supabase service returns different format, would need transformation
        console.log('[ServiceAdapter] getMatchById not fully implemented for supabase, using mock service');
        return mockService.getMatchById(id);
      case 'highlightly':
        return highlightlyService.getMatchById(id);
      default:
        return mockService.getMatchById(id);
    }
  },

  /**
   * Get team highlights
   */
  async getTeamHighlights(teamId: string): Promise<MatchHighlight[]> {
    switch (activeService) {
      case 'mock':
        return mockService.getTeamHighlights(teamId);
      case 'supabase':
        // Note: supabase service returns different format, would need transformation
        console.log('[ServiceAdapter] getTeamHighlights not fully implemented for supabase, using mock service');
        return mockService.getTeamHighlights(teamId);
      case 'highlightly':
        return highlightlyService.getTeamHighlights(teamId);
      default:
        return mockService.getTeamHighlights(teamId);
    }
  },

  /**
   * Get team details
   * @param teamId The team ID
   * @param season Optional season parameter (e.g., '2023', '2022')
   */
  async getTeamDetails(teamId: string, season?: string): Promise<TeamDetails | null> {
    switch (activeService) {
      case 'mock':
        return mockService.getTeamDetails(teamId, season);
      case 'supabase':
        return supabaseService.getTeamDetails(teamId, season);
      case 'highlightly':
        return highlightlyService.getTeamDetails(teamId, season);
      default:
        return mockService.getTeamDetails(teamId, season);
    }
  },

  /**
   * Search highlights
   */
  async searchHighlights(query: string): Promise<MatchHighlight[]> {
    switch (activeService) {
      case 'mock':
        return mockService.searchHighlights(query);
      case 'supabase':
        return supabaseService.searchHighlights(query);
      case 'highlightly':
        return highlightlyService.searchHighlights(query);
      default:
        return mockService.searchHighlights(query);
    }
  },

  /**
   * Search entities
   */
  async searchEntities(query: string): Promise<{ teams: any[]; leagues: any[]; matches: any[] }> {
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.searchEntities(query);
      case 'mock':
        return { teams: [], leagues: [], matches: [] }; // fallback
      default:
        return { teams: [], leagues: [], matches: [] };
    }
  },

  /**
   * Get recent matches for top leagues
   */
  async getRecentMatchesForTopLeagues(): Promise<LeagueWithMatches[]> {
    console.log('[ServiceAdapter] 🔍 DEBUGGING: getRecentMatchesForTopLeagues called');
    console.log('[ServiceAdapter] 🔍 DEBUGGING: activeService =', activeService);
    
    switch (activeService) {
      case 'highlightly':
        console.log('[ServiceAdapter] 🔍 DEBUGGING: Calling highlightlyService.getRecentMatchesForTopLeagues()');
        const result = await highlightlyService.getRecentMatchesForTopLeagues();
        console.log('[ServiceAdapter] 🔍 DEBUGGING: Result from highlightlyService:', result.length, 'leagues');
        return result;
      case 'mock':
      case 'supabase':
      default:
        console.log('[ServiceAdapter] 🔍 DEBUGGING: Using fallback (empty array) for service:', activeService);
        // For now, only supported in highlightly service
        // Could implement fallbacks for other services later
        return [];
    }
  },

  /**
   * Get matches for a specific date from top leagues (past, live, upcoming)
   */
  async getMatchesForDate(dateString: string): Promise<LeagueWithMatches[]> {
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.getMatchesForDate(dateString);
      case 'mock':
      case 'supabase':
      default:
        console.log(`[ServiceAdapter] getMatchesForDate not implemented for ${activeService}, returning empty.`);
        return [];
    }
  },

  /**
   * Get matches from the last 7 days from top leagues
   */
  async getMatchesFromLast7Days(): Promise<LeagueWithMatches[]> {
    try {
      console.log('[ServiceAdapter] Fetching matches from last 7 days');
      
      // Generate the last 7 days
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      console.log('[ServiceAdapter] Fetching matches for dates:', dates);
      
      // Fetch matches for all dates in parallel
      const allDateMatches = await Promise.all(
        dates.map(date => this.getMatchesForDate(date))
      );
      
      // Combine all matches into a single map by league
      const leagueMatchesMap = new Map<string, LeagueWithMatches>();
      
      allDateMatches.forEach(dateMatches => {
        dateMatches.forEach(league => {
          const existingLeague = leagueMatchesMap.get(league.id);
          if (existingLeague) {
            // Add matches to existing league
            existingLeague.matches = [...existingLeague.matches, ...league.matches];
          } else {
            // Add new league
            leagueMatchesMap.set(league.id, { ...league });
          }
        });
      });
      
      // Convert back to array and sort matches within each league by date (newest first)
      const result = Array.from(leagueMatchesMap.values()).map(league => ({
        ...league,
        matches: league.matches.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      }));
      
      // Sort leagues by priority (Champions League, Premier League, etc. first)
      const leaguePriority = new Map([
        // Top 3 International Leagues (cross-border club competitions)
        ['104', 1],   // UEFA Champions League (alternative ID)
        ['2486', 1],  // UEFA Champions League (corrected from La Liga)
        ['3', 2],     // UEFA Europa League  
        ['34', 3],    // Copa Libertadores
        
        // Top 5 Domestic Leagues (highest-ranked national leagues)
        ['33973', 4], // Premier League
        ['119924', 5], // La Liga (corrected ID)
        ['115669', 6], // Serie A (Italy)
        ['67162', 7], // Bundesliga
        ['52695', 8], // Ligue 1
        
        // Top International Tournaments (national teams, highest prestige & viewership)
        ['1', 9],     // FIFA World Cup
        ['4', 10],    // UEFA Euro
        ['9', 11],    // Copa América
        ['5', 12],    // AFC Asian Cup
        ['6', 13],    // Africa Cup of Nations (AFCON)
      ]);
      
      result.sort((a, b) => {
        const aPriority = leaguePriority.get(a.id) || 999;
        const bPriority = leaguePriority.get(b.id) || 999;
        return aPriority - bPriority;
      });
      
      console.log(`[ServiceAdapter] Combined ${result.length} leagues with matches from last 7 days`);
      return result;
      
    } catch (error) {
      console.error('[ServiceAdapter] Error fetching matches from last 7 days:', error);
      return [];
    }
  },

  /**
   * Debug function to test API league data
   */
  async debugLeagueApiData(): Promise<void> {
    switch (activeService) {
      case 'highlightly':
        console.log('[ServiceAdapter] debugLeagueApiData not implemented for highlightly service');
        return;
      default:
        console.log('Debug function only available for highlightly service');
    }
  },

  // Add new methods here
  async getStandingsForLeague(leagueId: string, season: string): Promise<any> {
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.getStandingsForLeague(leagueId, season);
      case 'mock':
        return mockService.getStandingsForLeague(leagueId, season);
      case 'supabase':
        // TODO: Implement for Supabase or decide on fallback
        console.warn('[ServiceAdapter] getStandingsForLeague not implemented for supabase, using mock.');
        return mockService.getStandingsForLeague(leagueId, season);
      default:
        console.warn(`[ServiceAdapter] getStandingsForLeague: Unknown service ${activeService}, using mock.`);
        return mockService.getStandingsForLeague(leagueId, season);
    }
  },

  async getAllMatchesForLeagueSeason(leagueId: string, season: string): Promise<import('@/types').Match[]> { // Explicitly type Match
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.getAllMatchesForLeagueSeason(leagueId, season);
      case 'mock':
        return mockService.getAllMatchesForLeagueSeason(leagueId, season);
      case 'supabase':
        // TODO: Implement for Supabase or decide on fallback
        console.warn('[ServiceAdapter] getAllMatchesForLeagueSeason not implemented for supabase, using mock.');
        return mockService.getAllMatchesForLeagueSeason(leagueId, season);
      default:
        console.warn(`[ServiceAdapter] getAllMatchesForLeagueSeason: Unknown service ${activeService}, using mock.`);
        return mockService.getAllMatchesForLeagueSeason(leagueId, season);
    }
  },

  async getMatchesForLeagueByDate(leagueId: string, date: string, season?: string): Promise<LeagueWithMatches[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  },

  async getHighlightsForLeague(leagueId: string, season: string, limit?: number, offset?: number): Promise<MatchHighlight[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  },

  async getHighlightsForMatch(matchId: string): Promise<MatchHighlight[]> {
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.getHighlightsForMatch(matchId);
      case 'mock':
      case 'supabase':
      default:
        console.warn(`[ServiceAdapter] getHighlightsForMatch not implemented for ${activeService}, returning empty array.`);
        return [];
    }
  },

  async getMatchDetails(matchId: string): Promise<MatchHighlight | null> {
    // Implementation needed
    throw new Error('Method not implemented');
  },

  async getLastFiveGames(teamId: string): Promise<Match[]> {
    const serviceName = this.getActiveService();
    switch (serviceName) {
      case 'highlightly':
        try {
          return await highlightlyService.getLastFiveGames(teamId);
        } catch (error) {
          console.warn('[ServiceAdapter] Highlightly failed, falling back to Supabase:', error);
          return supabaseDataService.getLastFiveGames(teamId);
        }
      default:
        return supabaseDataService.getLastFiveGames(teamId);
    }
  },

  async getHeadToHead(teamId1: string, teamId2: string): Promise<Match[]> {
    const serviceName = this.getActiveService();
    switch (serviceName) {
      case 'highlightly':
        try {
          return await highlightlyService.getHeadToHead(teamId1, teamId2);
        } catch (error) {
          console.warn('[ServiceAdapter] Highlightly failed, falling back to Supabase:', error);
          return supabaseDataService.getHeadToHead(teamId1, teamId2);
        }
      default:
        return supabaseDataService.getHeadToHead(teamId1, teamId2);
    }
  },
};

// Export individual functions for easier importing
export const {
  getRecommendedHighlights,
  getLeagueHighlights,
  getMatchById,
  getTeamHighlights,
  getTeamDetails,
  searchHighlights,
  searchEntities,
  getRecentMatchesForTopLeagues,
  getMatchesForDate,
  getMatchesFromLast7Days,
  setActiveService,
  getActiveService,
  debugLeagueApiData,
  getStandingsForLeague,
  getAllMatchesForLeagueSeason,
  getMatchesForLeagueByDate,
  getHighlightsForLeague,
  getHighlightsForMatch,
  getMatchDetails,
  getLastFiveGames,
  getHeadToHead
} = {
  getRecommendedHighlights: serviceAdapter.getRecommendedHighlights.bind(serviceAdapter),
  getLeagueHighlights: serviceAdapter.getLeagueHighlights.bind(serviceAdapter),
  getMatchById: (id: string) => serviceAdapter.getMatchById(id),
  getTeamHighlights: (teamId: string) => serviceAdapter.getTeamHighlights(teamId),
  getTeamDetails: (teamId: string, season?: string) => serviceAdapter.getTeamDetails(teamId, season),
  searchHighlights: (query: string) => serviceAdapter.searchHighlights(query),
  searchEntities: serviceAdapter.searchEntities.bind(serviceAdapter),
  getRecentMatchesForTopLeagues: () => serviceAdapter.getRecentMatchesForTopLeagues(),
  getMatchesForDate: (dateString: string) => serviceAdapter.getMatchesForDate(dateString),
  getMatchesFromLast7Days: () => serviceAdapter.getMatchesFromLast7Days(),
  setActiveService: (serviceType: ServiceType) => serviceAdapter.setActiveService(serviceType),
  getActiveService: () => serviceAdapter.getActiveService(),
  debugLeagueApiData: () => serviceAdapter.debugLeagueApiData(),
  getStandingsForLeague: (leagueId: string, season: string) => serviceAdapter.getStandingsForLeague(leagueId, season),
  getAllMatchesForLeagueSeason: (leagueId: string, season: string) => serviceAdapter.getAllMatchesForLeagueSeason(leagueId, season),
  getMatchesForLeagueByDate: (leagueId: string, date: string, season?: string) => serviceAdapter.getMatchesForLeagueByDate(leagueId, date, season),
  getHighlightsForLeague: (leagueId: string, season: string, limit?: number, offset?: number) => serviceAdapter.getHighlightsForLeague(leagueId, season, limit, offset),
  getHighlightsForMatch: (matchId: string) => serviceAdapter.getHighlightsForMatch(matchId),
  getMatchDetails: (matchId: string) => serviceAdapter.getMatchDetails(matchId),
  getLastFiveGames: (teamId: string) => serviceAdapter.getLastFiveGames(teamId),
  getHeadToHead: (teamId1: string, teamId2: string) => serviceAdapter.getHeadToHead(teamId1, teamId2),
};
