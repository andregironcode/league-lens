
// This file provides backward compatibility with the original API
// It re-exports everything from the new modular services

import { MatchHighlight, League } from '@/types';

// Re-export everything from the new services
export * from './api/highlightlyClient';
export * from './api/highlightService';
export * from './api/matchService';
export * from './api/leagueService';
export * from './api/teamService';

// The original service is now just a facade that delegates to the new modular services
// This ensures backward compatibility with existing code
