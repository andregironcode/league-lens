import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function finalTeamCoverageSummary() {
  console.log('📊 FINAL TEAM COVERAGE SUMMARY...');
  
  try {
    // 1. Overall statistics
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalLeagues } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 DATABASE OVERVIEW:`);
    console.log(`  🏆 Total leagues: ${totalLeagues}`);
    console.log(`  ⚽ Total matches: ${totalMatches}`);
    console.log(`  🏢 Total teams: ${totalTeams}`);
    
    // 2. Match coverage
    const { count: matchesWithTeamIds } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .not('home_team_id', 'is', null)
      .not('away_team_id', 'is', null);
    
    const { count: matchesWithoutTeamIds } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or('home_team_id.is.null,away_team_id.is.null');
    
    console.log(`\n⚽ MATCH TEAM COVERAGE:`);
    console.log(`  ✅ Matches with team IDs: ${matchesWithTeamIds} (${((matchesWithTeamIds/totalMatches)*100).toFixed(1)}%)`);
    console.log(`  ❌ Matches without team IDs: ${matchesWithoutTeamIds} (${((matchesWithoutTeamIds/totalMatches)*100).toFixed(1)}%)`);
    
    // 3. Teams by league
    console.log(`\n🏆 TEAMS BY LEAGUE:`);
    const { data: teamsByLeague } = await supabase
      .from('teams')
      .select('league_id')
      .not('league_id', 'is', null);
    
    const leagueTeamCounts = {};
    teamsByLeague?.forEach(team => {
      const league = team.league_id || 'Unknown';
      leagueTeamCounts[league] = (leagueTeamCounts[league] || 0) + 1;
    });
    
    // Get league names
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name');
    
    const leagueNames = {};
    leagues?.forEach(league => {
      leagueNames[league.id] = league.name;
    });
    
    // Show top leagues by team count
    const sortedLeagues = Object.entries(leagueTeamCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15);
    
    sortedLeagues.forEach(([leagueId, count]) => {
      const name = leagueNames[leagueId] || `League ${leagueId}`;
      console.log(`  🏆 ${name}: ${count} teams`);
    });
    
    // 4. Leagues without teams
    const leaguesWithTeams = new Set(Object.keys(leagueTeamCounts));
    const { data: allLeagues } = await supabase
      .from('leagues')
      .select('id, name');
    
    const leaguesWithoutTeams = allLeagues?.filter(league => !leaguesWithTeams.has(league.id)) || [];
    
    console.log(`\n⚠️ LEAGUES WITHOUT TEAMS (${leaguesWithoutTeams.length}):`);
    leaguesWithoutTeams.slice(0, 10).forEach(league => {
      console.log(`  📋 ${league.name} (${league.id})`);
    });
    
    if (leaguesWithoutTeams.length > 10) {
      console.log(`  ... and ${leaguesWithoutTeams.length - 10} more leagues`);
    }
    
    // 5. Recent team additions
    console.log(`\n🆕 RECENT TEAM ANALYSIS:`);
    
    // Check for teams with api_data (recently added)
    const { count: teamsWithApiData } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .not('api_data', 'is', null);
    
    const { count: teamsWithoutApiData } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .is('api_data', null);
    
    console.log(`  ✅ Teams with API data: ${teamsWithApiData}`);
    console.log(`  📋 Teams without API data: ${teamsWithoutApiData}`);
    
    // 6. Sample of different team types
    console.log(`\n📋 SAMPLE TEAMS BY TYPE:`);
    
    // National teams
    const { data: nationalTeams } = await supabase
      .from('teams')
      .select('id, name')
      .like('id', 'nt_%')
      .limit(5);
    
    if (nationalTeams && nationalTeams.length > 0) {
      console.log(`  🌍 National teams (${nationalTeams.length} shown):`);
      nationalTeams.forEach(team => {
        console.log(`    - ${team.name} (${team.id})`);
      });
    }
    
    // Club teams with numeric IDs
    const { data: clubTeams } = await supabase
      .from('teams')
      .select('id, name')
      .not('id', 'like', 'nt_%')
      .limit(5);
    
    if (clubTeams && clubTeams.length > 0) {
      console.log(`  🏟️ Club teams (sample):`);
      clubTeams.forEach(team => {
        console.log(`    - ${team.name} (${team.id})`);
      });
    }
    
    // 7. Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (matchesWithoutTeamIds === 0) {
      console.log(`  ✅ EXCELLENT: All matches have proper team IDs`);
    } else {
      console.log(`  ⚠️ ${matchesWithoutTeamIds} matches still need team ID mapping`);
    }
    
    if (leaguesWithoutTeams.length > 0) {
      console.log(`  📋 ${leaguesWithoutTeams.length} leagues have no teams yet`);
      console.log(`     These leagues may need team population from API or may be inactive`);
    }
    
    console.log(`  🎯 Current team coverage: ${totalTeams} teams across ${leaguesWithTeams.size}/${totalLeagues} leagues`);
    
    // 8. Success metrics
    const teamCoveragePercentage = ((leaguesWithTeams.size / totalLeagues) * 100).toFixed(1);
    const matchCoveragePercentage = ((matchesWithTeamIds / totalMatches) * 100).toFixed(1);
    
    console.log(`\n🎉 SUCCESS METRICS:`);
    console.log(`  📊 League coverage: ${teamCoveragePercentage}% (${leaguesWithTeams.size}/${totalLeagues})`);
    console.log(`  ⚽ Match coverage: ${matchCoveragePercentage}% (${matchesWithTeamIds}/${totalMatches})`);
    console.log(`  🏢 Total teams: ${totalTeams}`);
    
    if (matchCoveragePercentage === '100.0') {
      console.log(`\n🎉 PERFECT: All matches have complete team mapping!`);
      console.log(`✅ The upcoming matches system should work perfectly now!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

finalTeamCoverageSummary().catch(console.error); 