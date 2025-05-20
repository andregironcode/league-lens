
/**
 * This file re-exports all functionality from the refactored API modules
 * to maintain backward compatibility with the application.
 * 
 * The code has been refactored into smaller, more focused modules:
 * - api/highlightlyClient.ts - Core API client
 * - api/highlightService.ts - Highlights functionality
 * - api/matchService.ts - Matches functionality
 * - api/leagueService.ts - Leagues functionality
 * - api/teamService.ts - Teams functionality
 */

// Re-export everything for backward compatibility
export {
  // Client
  fetchFromAPI,
  testApiConnection,
  
  // Highlights
  getRecentHighlights,
  getHighlightsByLeague,
  getHighlightById,
  checkHighlightGeoRestrictions,
  getMockHighlights,
  getMockLeagues,
  
  // Matches
  getMatches,
  getMatchById,
  getMatchLineups,
  getMatchStats,
  getMatchEvents,
  getHeadToHead,
  
  // Leagues
  getLeagues,
  getLeagueById,
  getStandings,
  
  // Teams
  getTeams,
  getTeamById,
  getTeamStatistics,
  getLastFiveGames
} from './api';
