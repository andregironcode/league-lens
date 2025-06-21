import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMatchCounts() {
  console.log('📊 CHECKING LEAGUE MATCH COUNTS');
  console.log('=' .repeat(60));

  try {
    // Get matches with league info
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        league_id,
        leagues:league_id(name, country_name)
      `)
      .eq('season', '2024');

    // Get total count
    const { data: totalCount } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .eq('season', '2024');

    const matchesByLeague = {};
    matches?.forEach(match => {
      const leagueName = match.leagues?.name || 'Unknown';
      const country = match.leagues?.country_name || 'Unknown';
      const key = `${leagueName} [${country}]`;
      if (!matchesByLeague[key]) {
        matchesByLeague[key] = {
          count: 0,
          leagueId: match.league_id,
          name: leagueName,
          country: country
        };
      }
      matchesByLeague[key].count++;
    });

    console.log('\n📈 CURRENT MATCH COUNTS BY LEAGUE:');
    console.log('Target: 300+ matches per major league\n');

    const sortedLeagues = Object.entries(matchesByLeague)
      .sort(([,a], [,b]) => b.count - a.count);

    let totalNeed = 0;
    const majorLeagues = [];

    sortedLeagues.forEach(([leagueKey, data]) => {
      const { count, name, country } = data;
      let status, target;
      
      if (count >= 300) {
        status = '✅';
        target = 'GOAL MET';
      } else if (count >= 200) {
        status = '⚠️';
        const need = 300 - count;
        target = `Need ${need} more`;
        totalNeed += need;
        majorLeagues.push({ ...data, need });
      } else if (count >= 100) {
        status = '❌';
        const need = 300 - count;
        target = `Need ${need} more`;
        totalNeed += need;
        majorLeagues.push({ ...data, need });
      } else {
        status = '🔸';
        target = 'Minor league';
      }
      
      console.log(`${status} ${name}: ${count} matches (${target}) [${country}]`);
    });

    console.log(`\n🎯 SUMMARY:`);
    console.log(`   Total matches: ${totalCount?.length || 0}`);
    console.log(`   Total needed: ${totalNeed} more matches`);
    console.log(`   Major leagues needing expansion: ${majorLeagues.length}`);

    if (majorLeagues.length > 0) {
      console.log(`\n🚀 LEAGUES TO EXPAND:`);
      majorLeagues.forEach(league => {
        console.log(`   📈 ${league.name}: ${league.count} → 300+ (+${league.need} needed)`);
      });
    }

    return { majorLeagues, totalNeed };

  } catch (error) {
    console.log('❌ Error:', error);
    return { majorLeagues: [], totalNeed: 0 };
  }
}

checkMatchCounts(); 