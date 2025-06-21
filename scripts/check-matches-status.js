import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://septerrkdnojsmtmmska.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4');

async function checkMatchesStatus() {
  console.log('⚽ CHECKING MATCHES STATUS');
  console.log('=' .repeat(50));

  const { data: matches, error } = await supabase
    .from('matches')
    .select('league_id, leagues:league_id(name)')
    .eq('season', '2024');

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  console.log(`🎉 Total matches in database: ${matches.length}`);
  
  // Group by league
  const matchesByLeague = {};
  matches.forEach(match => {
    const leagueName = match.leagues?.name || 'Unknown';
    if (!matchesByLeague[leagueName]) matchesByLeague[leagueName] = 0;
    matchesByLeague[leagueName]++;
  });
  
  console.log('\n📊 Matches by league:');
  Object.entries(matchesByLeague)
    .sort((a, b) => b[1] - a[1])
    .forEach(([league, count]) => {
      console.log(`   ⚽ ${league}: ${count} matches`);
    });

  // Check some sample matches
  const { data: sampleMatches } = await supabase
    .from('matches')
    .select(`
      id,
      home_score,
      away_score,
      status,
      match_date,
      home_team:home_team_id(name),
      away_team:away_team_id(name),
      leagues:league_id(name)
    `)
    .eq('season', '2024')
    .limit(5);

  console.log('\n🔍 Sample matches:');
  sampleMatches?.forEach(match => {
    const homeTeam = match.home_team?.name || 'Unknown';
    const awayTeam = match.away_team?.name || 'Unknown';
    const score = match.home_score !== null && match.away_score !== null 
      ? `${match.home_score}-${match.away_score}` 
      : 'vs';
    const date = match.match_date ? new Date(match.match_date).toDateString() : 'TBD';
    console.log(`   ${homeTeam} ${score} ${awayTeam} (${match.status}) - ${date}`);
  });
}

checkMatchesStatus(); 