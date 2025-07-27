# Claude Code Memory - League Lens Project

## Project Context
League Lens is a football data platform showing live matches, highlights, and statistics.

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

## Notes for Future Sessions
- The system uses Supabase as primary data source
- Highlightly API is rate-limited, use sparingly
- Always check for existing data before API calls
- Frontend expects numeric IDs, not strings
- MatchCard needs `date`, `homeTeam`, `awayTeam` properties