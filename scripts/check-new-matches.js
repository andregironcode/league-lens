import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkNewMatches() {
  console.log('🔍 CHECKING FOR NEW MATCHES...');
  
  try {
    // Check total matches count
    const { count: totalCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total matches in database: ${totalCount}`);
    
    // Check recent matches in our date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5);
    
    const { data: recentMatches, count: recentCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0])
      .order('match_date', { ascending: true });
    
    console.log(`\n📅 Matches in date range (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}): ${recentCount}`);
    
    if (recentMatches && recentMatches.length > 0) {
      console.log('\n🎯 Recent matches found:');
      
      // Group by league
      const matchesByLeague = {};
      recentMatches.forEach(match => {
        if (!matchesByLeague[match.league_id]) {
          matchesByLeague[match.league_id] = [];
        }
        matchesByLeague[match.league_id].push(match);
      });
      
      // Get league names
      const leagueIds = Object.keys(matchesByLeague);
      const { data: leagues } = await supabase
        .from('leagues')
        .select('id, name')
        .in('id', leagueIds);
      
      const leagueMap = {};
      leagues?.forEach(league => {
        leagueMap[league.id] = league.name;
      });
      
      Object.entries(matchesByLeague).forEach(([leagueId, matches]) => {
        const leagueName = leagueMap[leagueId] || `League ${leagueId}`;
        console.log(`\n  🏆 ${leagueName}: ${matches.length} matches`);
        
        matches.slice(0, 3).forEach(match => {
          console.log(`    📅 ${match.match_date} - Match ${match.id} (${match.status})`);
        });
        
        if (matches.length > 3) {
          console.log(`    ... and ${matches.length - 3} more matches`);
        }
      });
    } else {
      console.log('❌ No matches found in the recent date range');
    }
    
    // Check for FIFA Club World Cup specifically (we saw it in the logs)
    console.log('\n🏆 Checking FIFA Club World Cup matches...');
    const { data: fifaMatches, count: fifaCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('league_id', '13549') // FIFA Club World Cup
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0]);
    
    if (fifaCount > 0) {
      console.log(`✅ Found ${fifaCount} FIFA Club World Cup matches!`);
      fifaMatches.slice(0, 3).forEach(match => {
        console.log(`  📅 ${match.match_date} - Match ${match.id} (${match.status})`);
      });
    } else {
      console.log('❌ No FIFA Club World Cup matches found');
    }
    
    // Check for J1 League matches
    console.log('\n🏆 Checking J1 League matches...');
    const { data: j1Matches, count: j1Count } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('league_id', '84182') // J1 League
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0]);
    
    if (j1Count > 0) {
      console.log(`✅ Found ${j1Count} J1 League matches!`);
      j1Matches.slice(0, 3).forEach(match => {
        console.log(`  📅 ${match.match_date} - Match ${match.id} (${match.status})`);
      });
    } else {
      console.log('❌ No J1 League matches found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkNewMatches().catch(console.error); 