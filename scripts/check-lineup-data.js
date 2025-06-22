import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Use hardcoded values like in other working scripts
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkLineupData() {
  console.log('🔍 CHECKING LINEUP DATA IN DATABASE');
  console.log('='.repeat(50));
  
  try {
    // Check recent matches for lineup data in api_data
    const { data: recentMatches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, api_data, has_lineups, status')
      .order('match_date', { ascending: false })
      .limit(10);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`📊 Checking ${recentMatches.length} recent matches...`);
    
    let matchesWithLineups = 0;
    let totalMatches = recentMatches.length;
    
    for (const match of recentMatches) {
      const apiData = match.api_data || {};
      
      // Check multiple possible locations for lineup data
      const hasLineups = apiData.lineups || 
                        apiData.detailedMatch?.lineups ||
                        (apiData.detailedMatch && apiData.detailedMatch['0']?.lineups);
      
      if (hasLineups) {
        matchesWithLineups++;
        console.log(`✅ Match ${match.id} (${match.status}): Has lineup data`);
        
        const lineups = hasLineups;
        if (lineups.homeTeam) {
          console.log(`   🏠 Home formation: ${lineups.homeTeam.formation || 'N/A'}`);
          console.log(`   🏠 Home players: ${lineups.homeTeam.initialLineup?.flat().length || 0}`);
        }
        if (lineups.awayTeam) {
          console.log(`   🏃 Away formation: ${lineups.awayTeam.formation || 'N/A'}`);
          console.log(`   🏃 Away players: ${lineups.awayTeam.initialLineup?.flat().length || 0}`);
        }
      } else {
        console.log(`❌ Match ${match.id} (${match.status}): No lineup data found`);
      }
    }
    
    // Check match_lineups table
    const { count: lineupsTableCount } = await supabase
      .from('match_lineups')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(30));
    console.log(`📥 Recent matches with lineups in api_data: ${matchesWithLineups}/${totalMatches}`);
    console.log(`📋 Total entries in match_lineups table: ${lineupsTableCount || 0}`);
    
    if (matchesWithLineups > 0) {
      console.log('\n✅ Found lineup data in api_data! We can extract it.');
    } else {
      console.log('\n⚠️  No lineup data found. Need to fetch from API.');
    }
    
  } catch (error) {
    console.error('❌ Error checking lineup data:', error.message);
  }
}

checkLineupData().catch(console.error); 