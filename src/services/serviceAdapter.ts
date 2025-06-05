import type { MatchHighlight, League, LeagueWithMatches, TeamDetails } from '@/types';
import * as mockService from './highlightService';
import * as supabaseService from './supabaseService';
import { highlightlyService } from './highlightlyService'; // Force TypeScript to recognize the export

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
   */
  async getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    switch (activeService) {
      case 'mock':
        return mockService.getTeamDetails(teamId);
      case 'supabase':
        return supabaseService.getTeamDetails(teamId);
      case 'highlightly':
        return highlightlyService.getTeamDetails(teamId);
      default:
        return mockService.getTeamDetails(teamId);
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
        // This function doesn't exist in highlightlyService, so return empty array
        console.log('[ServiceAdapter] getMatchesForDate not implemented for highlightly service');
        return [];
      case 'mock':
      case 'supabase':
      default:
        // For now, only supported in highlightly service
        // Could implement fallbacks for other services later
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
};

// Export individual functions for easier importing
export const {
  getRecommendedHighlights,
  getLeagueHighlights,
  getMatchById,
  getTeamHighlights,
  getTeamDetails,
  searchHighlights,
  getRecentMatchesForTopLeagues,
  getMatchesForDate,
  getMatchesFromLast7Days,
  setActiveService,
  getActiveService,
  debugLeagueApiData,
  getStandingsForLeague,
  getAllMatchesForLeagueSeason
} = {
  getRecommendedHighlights: serviceAdapter.getRecommendedHighlights.bind(serviceAdapter),
  getLeagueHighlights: serviceAdapter.getLeagueHighlights.bind(serviceAdapter),
  getMatchById: (id: string) => serviceAdapter.getMatchById(id),
  getTeamHighlights: (teamId: string) => serviceAdapter.getTeamHighlights(teamId),
  getTeamDetails: (teamId: string) => serviceAdapter.getTeamDetails(teamId),
  searchHighlights: (query: string) => serviceAdapter.searchHighlights(query),
  getRecentMatchesForTopLeagues: () => serviceAdapter.getRecentMatchesForTopLeagues(),
  getMatchesForDate: (dateString: string) => serviceAdapter.getMatchesForDate(dateString),
  getMatchesFromLast7Days: () => serviceAdapter.getMatchesFromLast7Days(),
  setActiveService: (serviceType: ServiceType) => serviceAdapter.setActiveService(serviceType),
  getActiveService: () => serviceAdapter.getActiveService(),
  debugLeagueApiData: () => serviceAdapter.debugLeagueApiData(),
  getStandingsForLeague: (leagueId: string, season: string) => serviceAdapter.getStandingsForLeague(leagueId, season),
  getAllMatchesForLeagueSeason: (leagueId: string, season: string) => serviceAdapter.getAllMatchesForLeagueSeason(leagueId, season)
};
