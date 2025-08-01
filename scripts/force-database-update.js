import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAndStoreMatches() {
  const apiKey = process.env.HIGHLIGHTLY_API_KEY22 || process.env.HIGHLIGHTLY_API_KEY;
  
  try {
    console.log('[Force Update] Starting match update job...');
    
    // Calculate date range: 14 days ago to 7 days in the future
    const today = new Date('2024-12-15'); // Use December 2024 as reference
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 14);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    
    // Format dates for API
    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = futureDate.toISOString().split('T')[0];
    
    console.log(`[Force Update] Fetching matches from ${startDate} to ${endDate}`);
    
    let allMatches = [];
    let currentDate = new Date(pastDate);
    
    // Fetch matches for each day in the range
    while (currentDate <= futureDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`[Force Update] Fetching matches for ${dateStr}...`);
      
      try {
        const matchesResponse = await fetch(
          `https://soccer.highlightly.net/matches?date=${dateStr}&limit=100`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
            }
          }
        );
        
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          if (matchesData.data && Array.isArray(matchesData.data)) {
            allMatches = allMatches.concat(matchesData.data);
            console.log(`[Force Update] Found ${matchesData.data.length} matches for ${dateStr}`);
          }
        } else {
          console.error(`[Force Update] Failed to fetch matches for ${dateStr}: ${matchesResponse.status}`);
        }
      } catch (error) {
        console.error(`[Force Update] Error fetching matches for ${dateStr}:`, error);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`[Force Update] Total matches fetched: ${allMatches.length}`);
    
    // Process and store matches
    let successCount = 0;
    let errorCount = 0;
    
    for (const match of allMatches) {
      try {
        // Extract team data - handle different API response formats
        const homeTeamData = match.homeTeam || match.teams?.home || {};
        const awayTeamData = match.awayTeam || match.teams?.away || {};
        const leagueData = match.league || match.competition || {};
        
        // Skip if no team data
        if (!homeTeamData.id || !awayTeamData.id) {
          console.warn(`[Force Update] Skipping match ${match.id} - missing team data`);
          continue;
        }
        
        // Upsert teams
        await supabase
          .from('teams')
          .upsert({
            id: homeTeamData.id,
            name: homeTeamData.name || 'Unknown',
            logo: homeTeamData.logo || ''
          }, {
            onConflict: 'id'
          });
        
        await supabase
          .from('teams')
          .upsert({
            id: awayTeamData.id,
            name: awayTeamData.name || 'Unknown',
            logo: awayTeamData.logo || ''
          }, {
            onConflict: 'id'
          });
        
        // Upsert league if we have league data
        if (leagueData.id) {
          await supabase
            .from('leagues')
            .upsert({
              id: leagueData.id,
              name: leagueData.name || 'Unknown League',
              country_name: leagueData.country || '',
              logo: leagueData.logo || ''
            }, {
              onConflict: 'id'
            });
        }
        
        // Extract score data
        let homeScore = 0;
        let awayScore = 0;
        
        if (match.score) {
          homeScore = match.score.home || match.score.fulltime?.home || 0;
          awayScore = match.score.away || match.score.fulltime?.away || 0;
        } else if (match.goals) {
          homeScore = match.goals.home || 0;
          awayScore = match.goals.away || 0;
        }
        
        // Extract status
        const status = match.status?.long || match.status?.description || match.state?.description || 'Not Started';
        
        // Upsert match
        const { error: matchError } = await supabase
          .from('matches')
          .upsert({
            id: match.id,
            league_id: leagueData.id || null,
            home_team_id: homeTeamData.id,
            away_team_id: awayTeamData.id,
            match_date: match.date,
            match_time: match.time || null,
            status: status,
            home_score: homeScore,
            away_score: awayScore,
            has_highlights: match.highlights || false,
            api_data: match,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (matchError) {
          console.error(`[Force Update] Error upserting match ${match.id}:`, matchError);
          errorCount++;
        } else {
          successCount++;
        }
        
      } catch (error) {
        console.error(`[Force Update] Error processing match ${match.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`[Force Update] Successfully updated ${successCount} matches, ${errorCount} errors`);
    return { success: true, matchesUpdated: successCount, errors: errorCount };
    
  } catch (error) {
    console.error('[Force Update] Error:', error);
    return { success: false, error: error.message };
  }
}

// Run the update
fetchAndStoreMatches()
  .then(result => {
    console.log('[Force Update] Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('[Force Update] Fatal error:', error);
    process.exit(1);
  });