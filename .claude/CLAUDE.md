# Claude Code Memory - League Lens Project

## Project Context
League Lens is a football data platform showing live matches, highlights, and statistics.

## Critical Fixes - July 29, 2025

### React Hooks Order Error (RESOLVED)
**Issue**: Application showing blank grey screen with "Rendered more hooks than during the previous render" error.

**Root Cause**: In `EnhancedMatchFeed.tsx`, `useMemo` hooks were called AFTER conditional returns, violating React's rules.

**Solution**:
1. Moved ALL hooks before conditional returns (lines 182-187 in EnhancedMatchFeed.tsx)
2. Removed duplicate `useMemo` calls that appeared after conditional returns
3. Key learning: React hooks MUST be called in the same order on every render - no hooks after `if (loading) return` or `if (error) return`

### WebSocket Connection Fix (RESOLVED)
**Issue**: WebSocket couldn't connect to ws://localhost:3001

**Solutions**:
1. Added missing `VITE_API_URL=http://localhost:3001` to `.env` file
2. Updated CORS in `server/server.js` to allow port 8080:
   ```javascript
   const allowedOrigins = [
     'http://localhost:8080',  // Vite dev server
     'http://localhost:5173',
     'http://localhost:3000',
     process.env.VITE_APP_URL
   ]
   ```
3. Fixed WebSocket useEffect to avoid conditional early returns

### Error Boundary Added
- Created `ErrorBoundary.tsx` component to catch React errors gracefully
- Wrapped entire App in ErrorBoundary to prevent blank screen crashes
- Shows user-friendly error page with refresh option

### Missing Imports Fixed
- Added `useMemo` import to `ForYouSection.tsx` React imports

## Recent Implementation (July 27, 2025)

### League Priority System
- Implemented tiered league ranking (Tier 1-4)
- Shows top 8 leagues with upcoming matches
- Falls back to lower-tier leagues when top leagues have no matches

### Match Weighing Algorithm
- Created scoring system for "For You" section
- Factors: league importance, competition stage, team quality, form, recency
- Weights range from 10-40 points per factor

### Key API Endpoints
- `/api/feed/matches` - Main feed (-1 to +5 days)
- `/api/for-you/matches` - Top 5 weighted matches (last 7 days)

### Database Service Pattern
- Use `DatabaseMatchService` instead of direct API calls
- Helps avoid rate limiting (429 errors)
- Fallback to historical matches when no future games

### Frontend Components
- `ForYouSection` - Shows personalized match recommendations
- `EnhancedMatchFeed` - Main match feed with date grouping
- `MatchCard` - Updated to handle various data formats

### Common Issues & Fixes
1. **String IDs**: Convert to numbers using `parseInt()`
2. **Missing dates**: Use `match.utc_date || match.match_date`
3. **Rate limits**: Use database service instead of API
4. **Match properties**: Transform data structure for MatchCard compatibility

### Important League IDs
- Premier League: 33973
- La Liga: 119924
- Bundesliga: 67162
- Ligue 1: 52695
- UEFA Champions League: 2486

### Scheduling Pattern
- Daily: 00:00, 12:00
- Pre-match lineups: 55 min before (check every 5 min)
- Live: Every minute
- Post-match: Every 10 minutes

## Architecture & Best Practices

### Component Structure Rules
1. **Hook Order is CRITICAL**: 
   - ALL React hooks must be at the top of the component
   - NO hooks after conditional returns (`if (loading) return`, `if (error) return`)
   - Order: useState → useRef → useCallback → useEffect → useMemo → conditional returns → render

2. **WebSocket Integration**:
   - Uses `useWebSocket` hook from `/hooks/useWebSocket.ts`
   - Connects to same port as API server (3001)
   - Handles reconnection automatically (5 attempts)
   - Subscribe to live matches with `subscribe(undefined, undefined, 'live')`

3. **API Request Management**:
   - Use `managedFetch` from `apiRequestManager.ts` for deduplication
   - Frontend endpoints: `/api/for-you/matches`, `/api/feed/matches`
   - All API calls go through Vite proxy to backend on port 3001

### Development Environment
- **Vite Dev Server**: Port 8080 (configured in vite.config.ts)
- **API/WebSocket Server**: Port 3001
- **Required .env variables**:
  - `VITE_API_URL=http://localhost:3001`
  - `VITE_PROXY_URL=http://localhost:3001/api/highlightly`
  - `HIGHLIGHTLY_API_KEY` (backend)

### Common Pitfalls to Avoid
1. **React Hooks**: Never call hooks conditionally or after returns
2. **WebSocket URL**: Must match API server URL from env vars
3. **CORS**: Backend must allow frontend port (8080 in dev)
4. **Rate Limiting**: Use DatabaseMatchService to avoid 429 errors
5. **Type Conversions**: League/team IDs must be numbers, not strings

## Notes for Future Sessions
- The system uses Supabase as primary data source
- Highlightly API is rate-limited, use sparingly
- Always check for existing data before API calls
- Frontend expects numeric IDs, not strings
- MatchCard needs `date`, `homeTeam`, `awayTeam` properties
- Error boundaries prevent complete app crashes
- WebSocket provides real-time match updates