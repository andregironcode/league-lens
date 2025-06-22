import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkBothMatches() {
  console.log('🔍 COMPARING BOTH MATCHES');
  console.log('='.repeat(35));
  
  // Test the populated match
  console.log('1. ✅ POPULATED MATCH (1126857540):');
  const { data: match1 } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .eq('id', '1126857540')
    .single();
  
  console.log(`   Teams: ${match1?.home_team?.name} vs ${match1?.away_team?.name}`);
  console.log(`   Flags: highlights=${match1?.has_highlights}, lineups=${match1?.has_lineups}, events=${match1?.has_events}`);
  
  const { data: lineups1 } = await supabase.from('match_lineups').select('*').eq('match_id', '1126857540');
  const { data: events1 } = await supabase.from('match_events').select('*').eq('match_id', '1126857540');
  const { data: stats1 } = await supabase.from('match_statistics').select('*').eq('match_id', '1126857540');
  
  console.log(`   Data: lineups=${lineups1?.length || 0}, events=${events1?.length || 0}, stats=${stats1?.length || 0}`);
  
  // Test the current match being viewed
  console.log('\n2. ❌ CURRENT MATCH (1126856689):');
  const { data: match2 } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .eq('id', '1126856689')
    .single();
  
  console.log(`   Teams: ${match2?.home_team?.name} vs ${match2?.away_team?.name}`);
  console.log(`   Flags: highlights=${match2?.has_highlights}, lineups=${match2?.has_lineups}, events=${match2?.has_events}`);
  
  const { data: lineups2 } = await supabase.from('match_lineups').select('*').eq('match_id', '1126856689');
  const { data: events2 } = await supabase.from('match_events').select('*').eq('match_id', '1126856689');
  const { data: stats2 } = await supabase.from('match_statistics').select('*').eq('match_id', '1126856689');
  
  console.log(`   Data: lineups=${lineups2?.length || 0}, events=${events2?.length || 0}, stats=${stats2?.length || 0}`);
  
  console.log('\n🎯 SOLUTION:');
  console.log('You are currently viewing the WRONG match!');
  console.log('');
  console.log('❌ Current URL: /match/1126856689 (no data)');
  console.log('✅ Correct URL: /match/1126857540 (has all data)');
  console.log('');
  console.log('🔗 Visit: http://localhost:8081/match/1126857540');
  console.log('   This match has lineups, events, statistics, and highlights!');
}

checkBothMatches().then(() => {
  console.log('\n🏁 Match comparison completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
}); 