# League Lens Implementation Notes

## Date: July 27, 2025

### Overview
Implemented a comprehensive match feed system with intelligent ranking based on league priorities and match importance scoring.

## Key Features Implemented

### 1. League Priority System
- **Location**: `/src/utils/leaguePriority.ts` & `/server/utils/leaguePriority.js`
- **Purpose**: Ranks leagues by importance (Tier 1-4)
- **Top Leagues**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
- **Logic**: Shows top 8 leagues with upcoming matches, falls back to lower tiers when needed

### 2. Match Weighing Algorithm
- **Location**: `/src/utils/matchWeighing.ts` & `/server/utils/matchWeighing.js`
- **Scoring Factors**:
  - League weight (40 points for Tier 1, 35 for Tier 2, etc.)
  - Competition stage (Finals: 40, Semi-finals: 35, etc.)
  - Team quality (Based on league standings)
  - Team form (Recent match results)
  - Match recency (Today: 10 points, decreasing over time)

### 3. Enhanced Match Feed
- **Endpoint**: `/api/feed/matches`
- **Date Range**: -1 day to +5 days
- **Service**: `DatabaseMatchService` (uses Supabase directly to avoid API rate limits)
- **Fallback**: Shows recent historical matches when no upcoming games

### 4. "For You" Section
- **Endpoint**: `/api/for-you/matches`
- **Shows**: Top 5 weighted matches from last 7 days
- **Component**: `/src/components/ForYouSection.tsx`
- **Features**: Visual weight breakdown on hover, highlights top match

### 5. Automated Scheduling
- **Service**: `EnhancedMatchScheduler`
- **Schedule**:
  - Daily scans: 00:00 and 12:00 (fetch upcoming matches)
  - Pre-match: Every 5 minutes (check for lineups 55 min before kickoff)
  - Live updates: Every minute during matches
  - Post-match: Every 10 minutes (scan for highlights)

### 6. Frontend Components
- **EnhancedMatchFeed**: Main feed display with date grouping
- **ForYouSection**: Personalized match recommendations
- **Updated MatchCard**: Fixed to handle multiple date formats and props

## Technical Decisions

### Database vs API
- Created `DatabaseMatchService` to query Supabase directly
- Avoids Highlightly API rate limits (429 errors)
- Uses cached data when available

### ID Handling
- Converted string IDs to numbers for consistency
- Mapped internal league IDs to database IDs
- Example: UEFA Champions League = 2486

### Error Handling
- Graceful fallbacks for missing data
- Try-catch blocks for date parsing
- Default values for missing team/league info

## League ID Mappings
```javascript
Premier League: 33973
La Liga: 119924
Serie A: 115669 (temporary, using UEFA Conference League ID)
Bundesliga: 67162
Ligue 1: 52695
UEFA Champions League: 2486
UEFA Europa League: 3337
```

## Known Issues & Solutions

### Issue: "The string did not match the expected pattern"
- **Cause**: MatchCard expected different data structure
- **Solution**: Added data transformation in ForYouSection

### Issue: No matches in current date range
- **Cause**: Database only has historical data
- **Solution**: Implemented fallback to show recent matches

### Issue: API Rate Limiting
- **Cause**: Too many API calls
- **Solution**: Created DatabaseMatchService to use Supabase directly

## Future Improvements
1. Add Serie A proper league ID when available
2. Implement user preferences for team/league following
3. Add push notifications for match start times
4. Create admin panel for weight adjustments
5. Add more sophisticated form calculation

## Environment Variables Required
- `HIGHLIGHTLY_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SERVER_PORT`

## Testing
- Production build: ✅ Successful
- For You endpoint: ✅ Working (shows 5 matches)
- Feed endpoint: ✅ Working (shows matches when available)
- Frontend rendering: ✅ No errors

## Deployment Notes
1. Ensure server has sufficient resources for cron jobs
2. Monitor API rate limits
3. Clear cache after deployment
4. Verify database connections