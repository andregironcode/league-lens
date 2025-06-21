# 🏆 Comprehensive Football Database Setup Guide

This guide will help you set up a complete football database with standings, team form, and all match data.

## 📋 Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **Environment Variables**: Ensure these are configured:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  
   VITE_HIGHLIGHTLY_API_KEY=your_highlightly_api_key
   ```

## 🚀 Setup Steps

### Step 1: Enhanced Database Schema

Run the enhanced SQL setup in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database-setup.sql
```

This creates:
- ✅ **leagues** - Enhanced with current_season
- ✅ **teams** - All team information  
- ✅ **matches** - Complete match data with status flags
- ✅ **highlights** - Video highlights
- ✅ **standings** - League tables with home/away breakdowns
- ✅ **team_form** - Last 10 matches analysis for each team
- ✅ **match_events** - Goals, cards, substitutions
- ✅ **match_lineups** - Team formations and player lists
- ✅ **sync_status** - Background sync monitoring

### Step 2: Check Current Database State

```bash
node scripts/check-database-status.js
```

This will show you:
- How many leagues, teams, matches you currently have
- Sync status of each table
- Recommendations for next steps

### Step 3: Run Comprehensive Data Sync

```bash
node scripts/comprehensive-full-data-sync.js
```

This comprehensive sync will:

1. **🏆 LEAGUES** - Enhance league data from API
2. **👥 TEAMS** - Sync all teams from league standings  
3. **📊 STANDINGS** - Complete league tables with position, points, goals
4. **⚽ MATCHES** - ALL matches for full 2024 season (Aug 2024 - Jun 2025)
5. **📈 TEAM FORM** - Calculate last 10 matches statistics for each team
6. **🎬 HIGHLIGHTS** - Recent match highlights

**Expected Duration**: 15-30 minutes (due to API rate limiting)

**Data Volume**:
- ~100 teams across 5 leagues
- ~2,000+ matches for full season
- ~100 standings records
- ~100 team form analyses
- ~200+ highlight videos

## 📊 What You'll Get

### League Standings
- Current league positions
- Points, wins, draws, losses
- Goals for/against, goal difference
- Home and away record breakdowns
- Team form strings (e.g., "WDLWW")

### Team Form Analysis
- Last 10 matches performance
- Clean sheets, failed to score stats
- Over/under 2.5 goals analysis
- Goals conceded statistics
- Recent match history as JSON

### Complete Match Data
- Full season schedules
- Live score updates
- Match status (scheduled/live/finished)
- Venue information
- Flags for highlights/lineups/events availability

## 🔄 Ongoing Sync

For production, set up automated syncing:

1. **Vercel Cron** (Recommended):
   ```json
   {
     "crons": [
       {
         "path": "/api/sync",
         "schedule": "0 */30 * * * *"
       }
     ]
   }
   ```

2. **Manual Updates**:
   - Run sync script every 30 minutes for live scores
   - Run standings sync daily
   - Run team form calculation weekly

## 🎯 Frontend Integration

The enhanced Supabase service now provides:

```typescript
// Get league standings
const standings = await supabaseDataService.getStandingsForLeague(leagueId, '2024');

// Get team form data
const teamForm = await supabaseDataService.getTeamForm(teamId, '2024');

// Get multiple team forms (for comparisons)
const forms = await supabaseDataService.getMultipleTeamForms([homeTeamId, awayTeamId]);

// All existing methods still work
const matches = await supabaseDataService.getMatchesForDate('2024-01-15');
const highlights = await supabaseDataService.getRecentHighlights(10);
```

## 🚨 Rate Limiting

The sync script is designed to respect API limits:
- **25 calls per minute** maximum
- **200ms delay** between calls  
- **Automatic retry** with exponential backoff
- **Progress tracking** in sync_status table

## 🛠️ Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Check your `.env` file has all required variables
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is the service role, not anon key

2. **"Rate limit exceeded"**
   - The script handles this automatically
   - Wait for rate limiting to reset (up to 1 minute)

3. **"No teams found"**
   - Check if leagues table has priority leagues
   - Verify API key has access to standings endpoint

4. **Slow sync performance**
   - This is normal due to rate limiting
   - Full sync takes 15-30 minutes for safety
   - Monitor progress in console output

### Verify Data

After sync completion, check:

```bash
# Quick database check
node scripts/check-database-status.js

# Manual verification in Supabase dashboard
# - Check standings table has ~100 records
# - Check team_form table has ~100 records  
# - Check matches table has 1000+ records
```

## 🎉 Success!

After successful setup, your app will have:

✅ **Instant data loading** - No more API rate limits for users  
✅ **Complete standings** - League tables with full statistics  
✅ **Team form analysis** - Last 10 matches breakdown  
✅ **Full season coverage** - All matches from August to June  
✅ **Live score updates** - Via background sync jobs  
✅ **Rich match details** - Highlights, events, lineups  

Your football app is now a comprehensive football data platform! 🚀 