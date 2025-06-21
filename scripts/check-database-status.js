/**
 * CHECK DATABASE STATUS
 * 
 * Quick script to see what's currently in the database
 * Run with: node scripts/check-database-status.js
 */

import { createClient } from '@supabase/supabase-js';

// Use the same credentials as in src/integrations/supabase/client.ts
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('🔍 CHECKING DATABASE STATUS');
  console.log('='.repeat(50));

  try {
    // Check leagues
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .eq('priority', true);

    if (leaguesError) {
      console.error('❌ Error fetching leagues:', leaguesError);
    } else {
      console.log(`🏆 LEAGUES: ${leagues?.length || 0} priority leagues`);
      leagues?.forEach(league => {
        console.log(`   • ${league.name} (${league.country_name})`);
      });
    }

    // Check teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, league_id')
      .limit(5);

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
    } else {
      const { count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });
      
      console.log(`\n👥 TEAMS: ${teamsCount || 0} total teams`);
      teams?.forEach(team => {
        console.log(`   • ${team.name}`);
      });
      if (teamsCount > 5) {
        console.log(`   ... and ${teamsCount - 5} more`);
      }
    }

    // Check matches
    const { count: matchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id, match_date, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .order('match_date', { ascending: false })
      .limit(3);

    console.log(`\n⚽ MATCHES: ${matchesCount || 0} total matches`);
    recentMatches?.forEach(match => {
      console.log(`   • ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'} (${match.match_date})`);
    });

    // Check standings
    const { count: standingsCount } = await supabase
      .from('standings')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 STANDINGS: ${standingsCount || 0} total standings records`);

    // Check team form
    const { count: teamFormCount } = await supabase
      .from('team_form')
      .select('*', { count: 'exact', head: true });

    console.log(`📈 TEAM FORM: ${teamFormCount || 0} total form records`);

    // Check highlights
    const { count: highlightsCount } = await supabase
      .from('highlights')
      .select('*', { count: 'exact', head: true });

    console.log(`🎬 HIGHLIGHTS: ${highlightsCount || 0} total highlights`);

    // Check sync status
    const { data: syncStatus } = await supabase
      .from('sync_status')
      .select('*')
      .order('updated_at', { ascending: false });

    console.log('\n🔄 SYNC STATUS:');
    syncStatus?.forEach(status => {
      const lastSync = status.last_sync ? new Date(status.last_sync).toLocaleString() : 'Never';
      console.log(`   • ${status.table_name}: ${status.status} (Last: ${lastSync})`);
    });

    console.log('\n' + '='.repeat(50));
    
    if (matchesCount === 0) {
      console.log('📋 RECOMMENDATION: Database is empty - run comprehensive sync');
      console.log('   Command: node scripts/comprehensive-full-data-sync.js');
    } else if (standingsCount === 0) {
      console.log('📋 RECOMMENDATION: Missing standings - run comprehensive sync');
      console.log('   Command: node scripts/comprehensive-full-data-sync.js');
    } else {
      console.log('✅ Database looks populated! You can still run sync to update data.');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Always run the function when this script is executed
checkDatabase();

export { checkDatabase }; 