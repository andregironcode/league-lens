/**
 * ACCURATE MATCH COUNT
 * 
 * Get the real current match counts by league across all seasons
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAccurateMatchCounts() {
  console.log('📊 ACCURATE MATCH COUNT - ALL SEASONS');
  console.log('=' .repeat(60));

  try {
    // Get ALL matches with league info (no season filter)
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        league_id,
        season,
        leagues:league_id(name, country_name)
      `);

    // Get total count
    const { data: totalCount } = await supabase
      .from('matches')
      .select('id', { count: 'exact' });

    console.log(`\n📈 TOTAL MATCHES: ${totalCount?.length || 0}`);

    const matchesByLeague = {};
    const matchesBySeason = {};
    const matchesByLeagueAndSeason = {};

    matches?.forEach(match => {
      const leagueName = match.leagues?.name || 'Unknown';
      const country = match.leagues?.country_name || 'Unknown';
      const season = match.season || 'unknown';
      const leagueKey = `${leagueName} [${country}]`;

      // Count by league
      if (!matchesByLeague[leagueKey]) {
        matchesByLeague[leagueKey] = {
          count: 0,
          leagueId: match.league_id,
          name: leagueName,
          country: country
        };
      }
      matchesByLeague[leagueKey].count++;

      // Count by season
      if (!matchesBySeason[season]) matchesBySeason[season] = 0;
      matchesBySeason[season]++;

      // Count by league and season
      const leagueSeasonKey = `${leagueName}_${season}`;
      if (!matchesByLeagueAndSeason[leagueSeasonKey]) {
        matchesByLeagueAndSeason[leagueSeasonKey] = {
          league: leagueName,
          season: season,
          count: 0
        };
      }
      matchesByLeagueAndSeason[leagueSeasonKey].count++;
    });

    console.log('\n📅 MATCHES BY SEASON:');
    Object.entries(matchesBySeason)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([season, count]) => {
        console.log(`   ${season}: ${count} matches`);
      });

    console.log('\n📊 MATCHES BY LEAGUE (ALL SEASONS):');
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

    // Show detailed breakdown for major leagues
    if (majorLeagues.length > 0) {
      console.log(`\n📈 DETAILED BREAKDOWN FOR MAJOR LEAGUES:`);
      majorLeagues.forEach(league => {
        console.log(`\n   🏆 ${league.name} (${league.count} total matches):`);
        
        // Show season breakdown for this league
        const leagueSeasons = Object.entries(matchesByLeagueAndSeason)
          .filter(([key, data]) => data.league === league.name)
          .sort(([,a], [,b]) => b.season.localeCompare(a.season));
          
        leagueSeasons.forEach(([key, data]) => {
          console.log(`     📅 ${data.season}: ${data.count} matches`);
        });
      });
    }

    return { 
      totalMatches: totalCount?.length || 0,
      leagueCounts: matchesByLeague,
      seasonCounts: matchesBySeason,
      majorLeagues,
      totalNeed 
    };

  } catch (error) {
    console.log('❌ Error:', error);
    return null;
  }
}

getAccurateMatchCounts(); 