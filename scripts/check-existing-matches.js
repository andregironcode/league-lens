import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkExistingMatches() {
  console.log('🔍 CHECKING EXISTING MATCHES FOR HOMEPAGE');
  console.log('=========================================');
  
  // Check matches in current date range (yesterday to +5 days)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24*60*60*1000);
  const nextWeek = new Date(now.getTime() + 5*24*60*60*1000);
  
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  console.log(`📅 Checking date range: ${yesterdayStr} to ${nextWeekStr}`);
  
  const { data: currentMatches, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      match_time,
      status,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name),
      league:leagues(name)
    `)
    .gte('match_date', yesterdayStr)
    .lte('match_date', nextWeekStr)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true });
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`⚽ MATCHES IN CURRENT RANGE: ${currentMatches?.length || 0}`);
  
  if (currentMatches && currentMatches.length > 0) {
    console.log('\n📋 MATCHES FOUND:');
    currentMatches.forEach(match => {
      const homeTeam = match.home_team?.name || 'Unknown';
      const awayTeam = match.away_team?.name || 'Unknown';
      const league = match.league?.name || 'Unknown League';
      const score = match.home_score !== null && match.away_score !== null 
        ? `${match.home_score}-${match.away_score}` 
        : match.match_time || 'TBD';
      
      console.log(`   • ${match.match_date} | ${homeTeam} vs ${awayTeam} (${score}) - ${league}`);
    });
  } else {
    console.log('\n❌ NO MATCHES FOUND IN CURRENT DATE RANGE');
    
    // Check what matches we have in the database at all
    const { data: allMatches } = await supabase
      .from('matches')
      .select('match_date, count(*)')
      .order('match_date', { ascending: false })
      .limit(10);
      
    console.log('\n📊 RECENT MATCHES IN DATABASE:');
    if (allMatches && allMatches.length > 0) {
      allMatches.forEach(row => {
        console.log(`   • ${row.match_date}: ${row.count} matches`);
      });
    } else {
      console.log('   • No matches found in database');
    }
  }
  
  // Check total database stats
  const { data: leagues } = await supabase.from('leagues').select('*', { count: 'exact', head: true });
  const { data: teams } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  const { data: matches } = await supabase.from('matches').select('*', { count: 'exact', head: true });
  
  console.log('\n📈 DATABASE STATS:');
  console.log(`   • Leagues: ${leagues.count || 0}`);
  console.log(`   • Teams: ${teams.count || 0}`);
  console.log(`   • Total Matches: ${matches.count || 0}`);
  
  console.log('\n💡 HOMEPAGE SOLUTION:');
  if (currentMatches && currentMatches.length > 0) {
    console.log('   ✅ Homepage should show matches!');
    console.log('   🔄 If homepage is blank, check the React component');
  } else {
    console.log('   ❌ No matches in current date range');
    console.log('   🔄 Need to sync matches for June 2025 or adjust date range');
    console.log('   📅 This is normal during off-season - homepage will show off-season message');
  }
}

checkExistingMatches().catch(console.error); 