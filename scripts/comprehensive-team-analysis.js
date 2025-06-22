import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function comprehensiveTeamAnalysis() {
  console.log('🔍 COMPREHENSIVE TEAM ANALYSIS ACROSS ENTIRE DATABASE...');
  
  try {
    // 1. Get total matches count
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total matches in database: ${totalMatches}`);
    
    // 2. Check matches with NULL team IDs
    const { data: matchesWithNullTeamIds, count: nullTeamCount } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, league_id, match_date, status, api_data', { count: 'exact' })
      .or('home_team_id.is.null,away_team_id.is.null');
    
    console.log(`❌ Matches with NULL team IDs: ${nullTeamCount}`);
    
    if (nullTeamCount > 0) {
      console.log('\n📋 Sample matches with NULL team IDs:');
      matchesWithNullTeamIds?.slice(0, 10).forEach(match => {
        console.log(`  Match ${match.id}: Home=${match.home_team_id || 'NULL'}, Away=${match.away_team_id || 'NULL'} (League: ${match.league_id})`);
      });
      
      // Check if these matches have API data
      const matchesWithApiData = matchesWithNullTeamIds?.filter(m => m.api_data) || [];
      const matchesWithoutApiData = matchesWithNullTeamIds?.filter(m => !m.api_data) || [];
      
      console.log(`\n📊 NULL team ID breakdown:`);
      console.log(`  ✅ Have API data (can be fixed): ${matchesWithApiData.length}`);
      console.log(`  ❌ No API data (need fresh fetch): ${matchesWithoutApiData.length}`);
      
      if (matchesWithApiData.length > 0) {
        console.log('\n🔧 FIXING MATCHES WITH API DATA...');
        
        let fixed = 0;
        let failed = 0;
        
        for (const match of matchesWithApiData) {
          try {
            const apiData = match.api_data;
            const homeTeamId = apiData.homeTeam?.id?.toString() || null;
            const awayTeamId = apiData.awayTeam?.id?.toString() || null;
            
            if (homeTeamId && awayTeamId) {
              const { error: updateError } = await supabase
                .from('matches')
                .update({
                  home_team_id: homeTeamId,
                  away_team_id: awayTeamId
                })
                .eq('id', match.id);
              
              if (!updateError) {
                fixed++;
                if (fixed <= 5) {
                  console.log(`  ✅ Fixed match ${match.id}: ${homeTeamId} vs ${awayTeamId}`);
                }
              } else {
                failed++;
                if (failed <= 3) {
                  console.log(`  ❌ Failed match ${match.id}: ${updateError.message}`);
                }
              }
            } else {
              failed++;
            }
            
            // Rate limiting
            if ((fixed + failed) % 100 === 0) {
              console.log(`    Progress: ${fixed} fixed, ${failed} failed...`);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
          } catch (error) {
            failed++;
            console.error(`  ❌ Error processing match ${match.id}:`, error.message);
          }
        }
        
        console.log(`\n📊 FIXING RESULTS:`);
        console.log(`  ✅ Fixed: ${fixed} matches`);
        console.log(`  ❌ Failed: ${failed} matches`);
      }
      
      if (matchesWithoutApiData.length > 0) {
        console.log(`\n⚠️ ${matchesWithoutApiData.length} matches have no API data and need fresh fetch from API`);
        
        // Group by league to see which leagues need fresh fetches
        const leagueGroups = {};
        matchesWithoutApiData.forEach(match => {
          const league = match.league_id || 'Unknown';
          if (!leagueGroups[league]) leagueGroups[league] = [];
          leagueGroups[league].push(match);
        });
        
        console.log('\n📊 Matches without API data by league:');
        Object.keys(leagueGroups).slice(0, 10).forEach(leagueId => {
          const matches = leagueGroups[leagueId];
          console.log(`  🏆 League ${leagueId}: ${matches.length} matches need fresh fetch`);
        });
      }
    }
    
    // 3. Check matches with team IDs
    const { count: matchesWithTeamIds } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .not('home_team_id', 'is', null)
      .not('away_team_id', 'is', null);
    
    console.log(`\n✅ Matches with proper team IDs: ${matchesWithTeamIds}`);
    
    // 4. Check teams table
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total teams in database: ${totalTeams}`);
    
    // 5. Final summary
    console.log(`\n📈 FINAL SUMMARY:`);
    console.log(`  📊 Total matches: ${totalMatches}`);
    console.log(`  ✅ Matches with team IDs: ${matchesWithTeamIds} (${((matchesWithTeamIds/totalMatches)*100).toFixed(1)}%)`);
    console.log(`  ❌ Matches missing team IDs: ${nullTeamCount} (${((nullTeamCount/totalMatches)*100).toFixed(1)}%)`);
    console.log(`  🏢 Total teams: ${totalTeams}`);
    
    if (nullTeamCount === 0) {
      console.log('\n🎉 PERFECT: All matches have proper team IDs!');
    } else {
      console.log(`\n⚠️ ACTION NEEDED: ${nullTeamCount} matches still need team ID mapping`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

comprehensiveTeamAnalysis().catch(console.error); 