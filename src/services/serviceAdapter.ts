import * as mockService from './highlightService';
import * as supabaseService from './supabaseService';
import * as highlightlyService from './highlightlyService';
import type { MatchHighlight, League, TeamDetails, LeagueWithMatches } from '@/types';

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
   * Get league highlights
   */
  async getLeagueHighlights(): Promise<League[]> {
    switch (activeService) {
      case 'mock':
        return mockService.getLeagueHighlights();
      case 'supabase':
        return supabaseService.getLeagueHighlights();
      case 'highlightly':
        return highlightlyService.getLeagueHighlights();
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
    switch (activeService) {
      case 'highlightly':
        return highlightlyService.getRecentMatchesForTopLeagues();
      case 'mock':
      case 'supabase':
      default:
        // For now, only supported in highlightly service
        // Could implement fallbacks for other services later
        return [];
    }
  }
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
  setActiveService,
  getActiveService
} = {
  getRecommendedHighlights: serviceAdapter.getRecommendedHighlights.bind(serviceAdapter),
  getLeagueHighlights: serviceAdapter.getLeagueHighlights.bind(serviceAdapter),
  getMatchById: (id: string) => serviceAdapter.getMatchById(id),
  getTeamHighlights: (teamId: string) => serviceAdapter.getTeamHighlights(teamId),
  getTeamDetails: (teamId: string) => serviceAdapter.getTeamDetails(teamId),
  searchHighlights: (query: string) => serviceAdapter.searchHighlights(query),
  getRecentMatchesForTopLeagues: () => serviceAdapter.getRecentMatchesForTopLeagues(),
  setActiveService: (serviceType: ServiceType) => serviceAdapter.setActiveService(serviceType),
  getActiveService: () => serviceAdapter.getActiveService()
};
