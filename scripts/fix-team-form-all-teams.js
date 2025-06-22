/**
 * Fix Team Form Calculation for ALL real teams
 * Filter out country names that aren't real teams
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Country names that are NOT real football teams
const COUNTRY_NAMES = [
  'Scotland', 'France', 'Spain', 'Germany', 'Italy', 'England', 'Portugal',
  'Netherlands', 'Belgium', 'Brazil', 'Argentina', 'Croatia', 'Poland', 
  'Morocco', 'Japan', 'Korea Republic', 'Australia', 'Mexico', 'Canada',
  'United States', 'Uruguay', 'Colombia', 'Denmark', 'Sweden', 'Switzerland',
  'Austria', 'Czech Republic', 'Ukraine', 'Hungary', 'Turkey', 'Romania',
  'Serbia', 'Slovenia', 'Slovakia', 'Georgia', 'Albania', 'Wales', 'Norway',
  'Finland', 'Ireland', 'Israel', 'Bosnia and Herzegovina', 'North Macedonia',
  'Montenegro', 'Moldova', 'Luxembourg', 'Latvia', 'Lithuania', 'Estonia',
  'Iceland', 'Faroe Islands', 'Malta', 'Andorra', 'San Marino', 'Gibraltar',
  'Liechtenstein', 'Kazakhstan', 'Azerbaijan', 'Armenia', 'Cyprus'
];

async function fixTeamFormAllTeams() {
  console.log('📈 FIXING TEAM FORM FOR ALL REAL TEAMS');
  console.log('='.repeat(60));
  
  try {
    // Clear existing team form first
    console.log('🔄 Clearing existing team form data...');
    await supabase.from('team_form').delete().gte('id', '0');

    // Get all teams that are NOT country names
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, league_id')
      .not('name', 'in', `(${COUNTRY_NAMES.map(name => `"${name}"`).join(',')})`);

    console.log(`👥 Processing ${teams.length} real teams (filtered out country names)...`);
    let totalFormRecords = 0;
    let teamsWithMatches = 0;

    for (const team of teams) {
      try {
        // Get last 10 finished matches for this team
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .eq('status', 'finished')
          .not('home_score', 'is', null)
          .not('away_score', 'is', null)
          .order('match_date', { ascending: false })
          .limit(10);

        if (matches && matches.length > 0) {
          teamsWithMatches++;
          
          // Calculate form statistics
          let stats = {
            played: matches.length,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            cleanSheets: 0,
            failedToScore: 0,
          };

          let formString = '';
          const recentMatches = [];

          for (const match of matches.reverse()) { // Reverse to get chronological order
            const isHome = match.home_team_id === team.id;
            const teamScore = isHome ? match.home_score : match.away_score;
            const opponentScore = isHome ? match.away_score : match.home_score;

            // Update stats
            stats.goalsFor += teamScore || 0;
            stats.goalsAgainst += opponentScore || 0;

            if (teamScore > opponentScore) {
              stats.won++;
              formString = 'W' + formString;
            } else if (teamScore < opponentScore) {
              stats.lost++;
              formString = 'L' + formString;
            } else {
              stats.drawn++;
              formString = 'D' + formString;
            }

            if (opponentScore === 0) stats.cleanSheets++;
            if (teamScore === 0) stats.failedToScore++;

            recentMatches.push({
              id: match.id,
              date: match.match_date,
              isHome: isHome,
              teamScore: teamScore,
              opponentScore: opponentScore,
              result: teamScore > opponentScore ? 'W' : (teamScore < opponentScore ? 'L' : 'D')
            });
          }

          // Keep only last 10 characters of form string
          formString = formString.slice(-10);

          const formRecord = {
            team_id: team.id,
            season: '2024',
            league_id: team.league_id,
            last_10_played: stats.played,
            last_10_won: stats.won,
            last_10_drawn: stats.drawn,
            last_10_lost: stats.lost,
            last_10_goals_for: stats.goalsFor,
            last_10_goals_against: stats.goalsAgainst,
            last_10_clean_sheets: stats.cleanSheets,
            last_10_failed_to_score: stats.failedToScore,
            form_string: formString,
            recent_matches: recentMatches,
            computed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('team_form')
            .insert(formRecord);

          if (error) {
            console.error(`    ❌ Error inserting form for ${team.name}:`, error.message);
          } else {
            totalFormRecords++;
            console.log(`✅ ${team.name}: ${formString} (${stats.won}W-${stats.drawn}D-${stats.lost}L)`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to calculate form for ${team.name}:`, error.message);
      }
    }

    // Update sync status
    await supabase
      .from('sync_status')
      .upsert({
        table_name: 'team_form',
        status: 'completed',
        records_synced: totalFormRecords,
        total_records: teams.length,
        error_message: null,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    console.log('\n📊 RESULTS:');
    console.log('='.repeat(40));
    console.log(`👥 Total teams processed: ${teams.length}`);
    console.log(`⚽ Teams with matches: ${teamsWithMatches}`);
    console.log(`📈 Team form records created: ${totalFormRecords}`);

    // Verify the results
    const { count: finalCount } = await supabase
      .from('team_form')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Final team form count in database: ${finalCount || 0}`);

  } catch (error) {
    console.error('❌ Team form calculation failed:', error);
  }
}

fixTeamFormAllTeams().catch(console.error); 