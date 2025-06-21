import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkInternationalLeagues() {
  console.log('🌍 CHECKING INTERNATIONAL LEAGUES IN DATABASE');
  console.log('=' .repeat(60));

  try {
    // Check all leagues
    const { data: allLeagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .order('name');

    if (leaguesError) {
      console.log('❌ Error fetching leagues:', leaguesError);
      return;
    }

    console.log(`\n📊 Total leagues in database: ${allLeagues.length}`);
    
    // Filter international leagues
    const internationalLeagues = allLeagues.filter(league => 
      league.name.toLowerCase().includes('uefa') ||
      league.name.toLowerCase().includes('champions') ||
      league.name.toLowerCase().includes('europa') ||
      league.name.toLowerCase().includes('conference') ||
      league.name.toLowerCase().includes('world cup') ||
      league.name.toLowerCase().includes('euro') ||
      league.name.toLowerCase().includes('copa') ||
      league.name.toLowerCase().includes('libertadores') ||
      league.country_code === 'World' ||
      league.country_name === 'World'
    );

    console.log(`\n🌍 International leagues found: ${internationalLeagues.length}`);
    console.log('-'.repeat(50));

    for (const league of internationalLeagues) {
      console.log(`\n🏆 ${league.name} (ID: ${league.id})`);
      console.log(`   Country: ${league.country_name || 'N/A'} (${league.country_code || 'N/A'})`);
      console.log(`   Priority: ${league.priority ? 'Yes' : 'No'}`);
      
      // Check teams for this league
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('league_id', league.id);

      if (teamsError) {
        console.log(`   ❌ Error fetching teams: ${teamsError.message}`);
      } else {
        console.log(`   👥 Teams: ${teams.length}`);
        if (teams.length > 0) {
          teams.slice(0, 5).forEach(team => {
            console.log(`      - ${team.name}`);
          });
          if (teams.length > 5) {
            console.log(`      ... and ${teams.length - 5} more`);
          }
        }
      }

      // Check standings for this league
      const { data: standings, error: standingsError } = await supabase
        .from('standings')
        .select('*')
        .eq('league_id', league.id)
        .eq('season', '2024');

      if (standingsError) {
        console.log(`   ❌ Error fetching standings: ${standingsError.message}`);
      } else {
        console.log(`   📊 2024 Standings: ${standings.length}`);
      }

      // Check matches for this league
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('league_id', league.id);

      if (matchesError) {
        console.log(`   ❌ Error fetching matches: ${matchesError.message}`);
      } else {
        console.log(`   ⚽ Matches: ${matches.length}`);
      }
    }

    // Show national teams specifically
    console.log('\n🏴 LOOKING FOR NATIONAL TEAMS (International tournaments)');
    console.log('-'.repeat(50));

    // Check for teams that might be national teams
    const { data: allTeams, error: allTeamsError } = await supabase
      .from('teams')
      .select('*, leagues:league_id(name)')
      .order('name');

    if (allTeamsError) {
      console.log('❌ Error fetching all teams:', allTeamsError);
      return;
    }

    const nationalTeams = allTeams.filter(team => {
      const teamName = team.name.toLowerCase();
      return teamName === 'france' ||
             teamName === 'spain' ||
             teamName === 'germany' ||
             teamName === 'england' ||
             teamName === 'italy' ||
             teamName === 'portugal' ||
             teamName === 'netherlands' ||
             teamName === 'brazil' ||
             teamName === 'argentina' ||
             teamName === 'belgium' ||
             teamName === 'croatia' ||
             teamName === 'denmark' ||
             teamName === 'switzerland' ||
             teamName === 'austria' ||
             teamName === 'poland' ||
             teamName === 'sweden' ||
             teamName === 'norway' ||
             teamName === 'uruguay' ||
             teamName === 'colombia' ||
             teamName === 'mexico' ||
             teamName === 'japan' ||
             teamName === 'south korea' ||
             teamName === 'australia' ||
             teamName === 'canada' ||
             teamName === 'united states' ||
             teamName === 'usa';
    });

    console.log(`\n🏴 Potential national teams found: ${nationalTeams.length}`);
    nationalTeams.forEach(team => {
      console.log(`   - ${team.name} (League: ${team.leagues?.name || 'Unknown'})`);
    });

  } catch (error) {
    console.log('❌ Error:', error);
  }
}

checkInternationalLeagues(); 