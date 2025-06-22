import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function testTeamIdsFix() {
  console.log('🔍 TESTING TEAM IDS FIX...');
  
  try {
    // 1. Trigger manual fetch
    console.log('\n🚀 Triggering manual fetch...');
    try {
      const fetchResponse = await fetch('http://localhost:3001/api/admin/fetch-matches', {
        method: 'POST'
      });
      
      if (fetchResponse.ok) {
        const result = await fetchResponse.json();
        console.log('✅ Fetch triggered:', result.message);
      } else {
        console.log('❌ Fetch failed:', fetchResponse.status);
      }
    } catch (error) {
      console.log('❌ Fetch error:', error.message);
    }
    
    // 2. Wait a bit for the fetch to complete
    console.log('\n⏳ Waiting 10 seconds for fetch to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 3. Check recent matches for team IDs
    console.log('\n🔍 Checking recent matches for team IDs...');
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5);
    
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, status, league_id')
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0])
      .order('id', { ascending: false })
      .limit(10);
    
    if (recentMatches && recentMatches.length > 0) {
      console.log(`✅ Found ${recentMatches.length} recent matches`);
      
      let withTeamIds = 0;
      let withoutTeamIds = 0;
      
      console.log('\n📊 TEAM ID STATUS:');
      recentMatches.forEach(match => {
        const hasTeamIds = match.home_team_id && match.away_team_id;
        if (hasTeamIds) {
          withTeamIds++;
          console.log(`  ✅ Match ${match.id}: ${match.home_team_id} vs ${match.away_team_id} (${match.status})`);
        } else {
          withoutTeamIds++;
          console.log(`  ❌ Match ${match.id}: ${match.home_team_id || 'NULL'} vs ${match.away_team_id || 'NULL'} (${match.status})`);
        }
      });
      
      console.log(`\n📈 SUMMARY:`);
      console.log(`  ✅ Matches with team IDs: ${withTeamIds}`);
      console.log(`  ❌ Matches without team IDs: ${withoutTeamIds}`);
      
      if (withTeamIds > 0) {
        console.log('\n🎉 SUCCESS: Team IDs are being populated correctly!');
      } else {
        console.log('\n⚠️ ISSUE: Team IDs are still not being populated');
      }
      
    } else {
      console.log('❌ No recent matches found');
    }
    
    // 4. Check specific FIFA Club World Cup matches
    console.log('\n🏆 Checking FIFA Club World Cup matches specifically...');
    const { data: fifaMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, status')
      .eq('league_id', '13549')
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0])
      .limit(5);
    
    if (fifaMatches && fifaMatches.length > 0) {
      console.log(`Found ${fifaMatches.length} FIFA Club World Cup matches:`);
      fifaMatches.forEach(match => {
        const hasTeamIds = match.home_team_id && match.away_team_id;
        console.log(`  ${hasTeamIds ? '✅' : '❌'} Match ${match.id}: ${match.home_team_id || 'NULL'} vs ${match.away_team_id || 'NULL'}`);
      });
    } else {
      console.log('No FIFA Club World Cup matches found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTeamIdsFix().catch(console.error); 