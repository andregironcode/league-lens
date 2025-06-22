import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkTeamIdsNow() {
  console.log('🔍 CHECKING CURRENT TEAM ID STATUS...');
  
  try {
    // Check the most recent matches (highest IDs = newest)
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, status, league_id')
      .order('id', { ascending: false })
      .limit(20);
    
    if (recentMatches && recentMatches.length > 0) {
      console.log(`\n📊 CHECKING ${recentMatches.length} MOST RECENT MATCHES:`);
      
      let withTeamIds = 0;
      let withoutTeamIds = 0;
      
      recentMatches.forEach((match, index) => {
        const hasTeamIds = match.home_team_id && match.away_team_id;
        if (hasTeamIds) {
          withTeamIds++;
          if (index < 5) { // Show first 5 with team IDs
            console.log(`  ✅ Match ${match.id}: Home=${match.home_team_id}, Away=${match.away_team_id} (League: ${match.league_id})`);
          }
        } else {
          withoutTeamIds++;
          if (index < 5) { // Show first 5 without team IDs
            console.log(`  ❌ Match ${match.id}: Home=${match.home_team_id || 'NULL'}, Away=${match.away_team_id || 'NULL'} (League: ${match.league_id})`);
          }
        }
      });
      
      console.log(`\n📈 SUMMARY:`);
      console.log(`  ✅ Recent matches with team IDs: ${withTeamIds}`);
      console.log(`  ❌ Recent matches without team IDs: ${withoutTeamIds}`);
      
      if (withTeamIds > withoutTeamIds) {
        console.log('\n🎉 GOOD: Most recent matches have team IDs!');
      } else if (withTeamIds > 0) {
        console.log('\n⚠️ MIXED: Some recent matches have team IDs, some don\'t');
      } else {
        console.log('\n❌ PROBLEM: No recent matches have team IDs');
      }
      
      // Check specifically for the new matches we added (FIFA Club World Cup)
      console.log('\n🏆 CHECKING FIFA CLUB WORLD CUP MATCHES:');
      const { data: fifaMatches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, match_date')
        .eq('league_id', '13549')
        .order('id', { ascending: false })
        .limit(5);
      
      if (fifaMatches && fifaMatches.length > 0) {
        fifaMatches.forEach(match => {
          const hasTeamIds = match.home_team_id && match.away_team_id;
          console.log(`  ${hasTeamIds ? '✅' : '❌'} Match ${match.id}: Home=${match.home_team_id || 'NULL'}, Away=${match.away_team_id || 'NULL'}`);
        });
      } else {
        console.log('  No FIFA Club World Cup matches found');
      }
      
    } else {
      console.log('❌ No matches found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTeamIdsNow().catch(console.error); 