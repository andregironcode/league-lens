/**
 * CHECK DETAILED DATA
 * 
 * Check what data is actually stored and what's missing
 */

import { createClient } from '@supabase/supabase-js';

// Use the same credentials as in other scripts
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDetailedData() {
  console.log('🔍 CHECKING DETAILED DATA STRUCTURE');
  console.log('='.repeat(50));

  try {
    // Check leagues data structure
    console.log('🏆 LEAGUES DATA:');
    const { data: leagues } = await supabase
      .from('leagues')
      .select('*')
      .eq('priority', true)
      .limit(2);

    leagues?.forEach(league => {
      console.log(`   • ${league.name}:`);
      console.log(`     - ID: ${league.id}`);
      console.log(`     - Logo: ${league.logo || 'MISSING'}`);
      console.log(`     - Country: ${league.country_name}`);
      console.log(`     - Priority: ${league.priority}`);
    });

    // Check teams data structure
    console.log('\n👥 TEAMS DATA:');
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .limit(3);

    teams?.forEach(team => {
      console.log(`   • ${team.name}:`);
      console.log(`     - ID: ${team.id}`);
      console.log(`     - Logo: ${team.logo || 'MISSING'}`);
      console.log(`     - League: ${team.league_id}`);
    });

    // Check matches data structure
    console.log('\n⚽ MATCHES DATA:');
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .limit(2);

    matches?.forEach(match => {
      console.log(`   • Match ID: ${match.id}`);
      console.log(`     - Teams: ${match.home_team_name} vs ${match.away_team_name}`);
      console.log(`     - Date: ${match.match_date}`);
      console.log(`     - Status: ${match.status}`);
      console.log(`     - Score: ${match.home_score || 0}-${match.away_score || 0}`);
    });

    // Check what's missing
    console.log('\n❌ MISSING DATA:');
    
    const { data: highlights } = await supabase
      .from('highlights')
      .select('count');
    console.log(`   • Highlights: ${highlights?.length || 0} records`);

    const { data: teamForm } = await supabase
      .from('team_form')
      .select('count');
    console.log(`   • Team Form: ${teamForm?.length || 0} records`);

    const { data: matchEvents } = await supabase
      .from('match_events')
      .select('count');
    console.log(`   • Match Events: ${matchEvents?.length || 0} records`);

    const { data: matchLineups } = await supabase
      .from('match_lineups')
      .select('count');
    console.log(`   • Match Lineups: ${matchLineups?.length || 0} records`);

    // Check match count by league
    console.log('\n📊 MATCHES BY LEAGUE:');
    const { data: matchCounts } = await supabase
      .from('matches')
      .select('league_id')
      .then(result => {
        const counts = {};
        result.data?.forEach(match => {
          counts[match.league_id] = (counts[match.league_id] || 0) + 1;
        });
        return { data: counts };
      });

    Object.entries(matchCounts.data || {}).forEach(([leagueId, count]) => {
      console.log(`   • League ${leagueId}: ${count} matches`);
    });

  } catch (error) {
    console.error('❌ Error checking detailed data:', error);
  }
}

checkDetailedData(); 