/**
 * DEBUG EXPANSION ISSUE
 * 
 * Debug why matches aren't being saved despite the expansion script claiming success
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';

async function debugExpansion() {
  console.log('🔍 DEBUGGING EXPANSION ISSUE');
  console.log('=' .repeat(50));

  try {
    // 1. Check total matches in database
    const { data: allMatches } = await supabase
      .from('matches')
      .select('id, season, league_id', { count: 'exact' });

    console.log(`\n📊 Current database state:`);
    console.log(`   Total matches: ${allMatches?.length || 0}`);

    // Group by season
    const matchesBySeason = {};
    allMatches?.forEach(match => {
      const season = match.season || 'unknown';
      if (!matchesBySeason[season]) matchesBySeason[season] = 0;
      matchesBySeason[season]++;
    });

    console.log(`\n📅 Matches by season:`);
    Object.entries(matchesBySeason)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([season, count]) => {
        console.log(`   ${season}: ${count} matches`);
      });

    // 2. Test API call for Premier League
    console.log(`\n🧪 Testing API call for Premier League...`);
    
    const response = await fetch(`${API_BASE_URL}/matches?leagueId=33973&season=2023`);
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const matches = data?.data || data;
    
    if (!matches || !Array.isArray(matches)) {
      console.log(`❌ Invalid API response format`);
      return;
    }

    console.log(`✅ API returned ${matches.length} matches for Premier League 2023`);

    // 3. Test a sample match insert
    if (matches.length > 0) {
      const sampleMatch = matches[0];
      console.log(`\n🧪 Testing sample match insert:`);
      console.log(`   Match ID: ${sampleMatch.id}`);
      console.log(`   Home: ${sampleMatch.homeTeam?.name || 'Unknown'} (ID: ${sampleMatch.homeTeam?.id})`);
      console.log(`   Away: ${sampleMatch.awayTeam?.name || 'Unknown'} (ID: ${sampleMatch.awayTeam?.id})`);

      // Check if teams exist
      const homeTeamExists = await supabase
        .from('teams')
        .select('id')
        .eq('id', sampleMatch.homeTeam?.id)
        .single();

      const awayTeamExists = await supabase
        .from('teams')
        .select('id')
        .eq('id', sampleMatch.awayTeam?.id)
        .single();

      console.log(`   Home team exists: ${homeTeamExists.data ? '✅' : '❌'}`);
      console.log(`   Away team exists: ${awayTeamExists.data ? '✅' : '❌'}`);

      if (!homeTeamExists.data || !awayTeamExists.data) {
        console.log(`\n❌ ISSUE FOUND: Missing teams in database!`);
        console.log(`   This explains why matches aren't being saved.`);
        console.log(`   Foreign key constraints prevent saving matches with non-existent teams.`);
        
        // Check total teams in database
        const { data: totalTeams } = await supabase
          .from('teams')
          .select('id', { count: 'exact' });
          
        console.log(`\n📊 Teams in database: ${totalTeams?.length || 0}`);
        
        // Check teams by league
        const { data: teamsWithLeagues } = await supabase
          .from('teams')
          .select('league_id, leagues:league_id(name)')
          .limit(10);
          
        console.log(`\n📋 Sample teams:`);
        teamsWithLeagues?.forEach((team, i) => {
          console.log(`   ${i+1}. League: ${team.leagues?.name || 'Unknown'}`);
        });
        
      } else {
        console.log(`\n✅ Teams exist, testing actual insert...`);
        
        const { error } = await supabase
          .from('matches')
          .upsert({
            id: sampleMatch.id,
            league_id: 33973,
            season: '2023',
            home_team_id: sampleMatch.homeTeam.id,
            away_team_id: sampleMatch.awayTeam.id,
            match_date: sampleMatch.date ? new Date(sampleMatch.date).toISOString() : null,
            status: 'finished'
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.log(`❌ Insert error: ${error.message}`);
        } else {
          console.log(`✅ Insert successful!`);
        }
      }
    }

    // 4. Check what teams we have for Premier League
    console.log(`\n🔍 Checking Premier League teams in database...`);
    const { data: plTeams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('league_id', 33973);

    console.log(`📊 Premier League teams in database: ${plTeams?.length || 0}`);
    if (plTeams && plTeams.length > 0) {
      console.log(`📋 Sample Premier League teams:`);
      plTeams.slice(0, 5).forEach((team, i) => {
        console.log(`   ${i+1}. ${team.name} (ID: ${team.id})`);
      });
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

debugExpansion(); 