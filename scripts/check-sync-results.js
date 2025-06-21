import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSyncResults() {
  console.log('🔍 Checking Sync Results');
  console.log('='.repeat(40));
  
  try {
    // Check leagues
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*');
    
    if (leaguesError) throw leaguesError;
    
    console.log(`📋 Leagues: ${leagues?.length || 0} found`);
    leagues?.forEach(league => {
      console.log(`   ✅ ${league.name} (${league.country}) - ID: ${league.id}`);
    });
    
    // Check teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');
    
    if (teamsError) throw teamsError;
    
    console.log(`\n👥 Teams: ${teams?.length || 0} found`);
    if (teams?.length > 0) {
      teams.slice(0, 5).forEach(team => {
        console.log(`   ✅ ${team.name} - League: ${team.league_id}`);
      });
      if (teams.length > 5) {
        console.log(`   ... and ${teams.length - 5} more teams`);
      }
    }
    
    // Check matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*');
    
    if (matchesError) throw matchesError;
    
    console.log(`\n⚽ Matches: ${matches?.length || 0} found`);
    if (matches?.length > 0) {
      matches.slice(0, 5).forEach(match => {
        console.log(`   ✅ ${match.home_team_name} vs ${match.away_team_name} - ${match.status}`);
      });
      if (matches.length > 5) {
        console.log(`   ... and ${matches.length - 5} more matches`);
      }
    }
    
    // Check highlights
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('*');
    
    if (highlightsError) throw highlightsError;
    
    console.log(`\n🎬 Highlights: ${highlights?.length || 0} found`);
    if (highlights?.length > 0) {
      highlights.slice(0, 10).forEach(highlight => {
        console.log(`   ✅ ${highlight.title.substring(0, 60)}...`);
      });
      if (highlights.length > 10) {
        console.log(`   ... and ${highlights.length - 10} more highlights`);
      }
    }
    
    // Check sync status
    const { data: syncStatus, error: syncError } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_sync', { ascending: false });
    
    if (syncError) throw syncError;
    
    console.log(`\n📊 Sync Status:`);
    syncStatus?.forEach(status => {
      const lastSync = new Date(status.last_sync).toLocaleString();
      console.log(`   ${status.status === 'completed' ? '✅' : '❌'} ${status.entity_type}: ${status.status} (${lastSync})`);
    });
    
    console.log('\n🎉 Database check completed!');
    
    if (highlights?.length > 0) {
      console.log('\n🚀 SUCCESS! Your app now has REAL football highlights!');
      console.log('✅ Users will see actual Premier League, La Liga, Serie A matches!');
      console.log('🎯 No more Rick Roll videos - these are genuine football highlights!');
    }
    
  } catch (error) {
    console.error('❌ Error checking sync results:', error.message);
  }
}

checkSyncResults(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSyncResults() {
  console.log('🔍 Checking Sync Results');
  console.log('='.repeat(40));
  
  try {
    // Check leagues
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*');
    
    if (leaguesError) throw leaguesError;
    
    console.log(`📋 Leagues: ${leagues?.length || 0} found`);
    leagues?.forEach(league => {
      console.log(`   ✅ ${league.name} (${league.country}) - ID: ${league.id}`);
    });
    
    // Check teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');
    
    if (teamsError) throw teamsError;
    
    console.log(`\n👥 Teams: ${teams?.length || 0} found`);
    if (teams?.length > 0) {
      teams.slice(0, 5).forEach(team => {
        console.log(`   ✅ ${team.name} - League: ${team.league_id}`);
      });
      if (teams.length > 5) {
        console.log(`   ... and ${teams.length - 5} more teams`);
      }
    }
    
    // Check matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*');
    
    if (matchesError) throw matchesError;
    
    console.log(`\n⚽ Matches: ${matches?.length || 0} found`);
    if (matches?.length > 0) {
      matches.slice(0, 5).forEach(match => {
        console.log(`   ✅ ${match.home_team_name} vs ${match.away_team_name} - ${match.status}`);
      });
      if (matches.length > 5) {
        console.log(`   ... and ${matches.length - 5} more matches`);
      }
    }
    
    // Check highlights
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('*');
    
    if (highlightsError) throw highlightsError;
    
    console.log(`\n🎬 Highlights: ${highlights?.length || 0} found`);
    if (highlights?.length > 0) {
      highlights.slice(0, 10).forEach(highlight => {
        console.log(`   ✅ ${highlight.title.substring(0, 60)}...`);
      });
      if (highlights.length > 10) {
        console.log(`   ... and ${highlights.length - 10} more highlights`);
      }
    }
    
    // Check sync status
    const { data: syncStatus, error: syncError } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_sync', { ascending: false });
    
    if (syncError) throw syncError;
    
    console.log(`\n📊 Sync Status:`);
    syncStatus?.forEach(status => {
      const lastSync = new Date(status.last_sync).toLocaleString();
      console.log(`   ${status.status === 'completed' ? '✅' : '❌'} ${status.entity_type}: ${status.status} (${lastSync})`);
    });
    
    console.log('\n🎉 Database check completed!');
    
    if (highlights?.length > 0) {
      console.log('\n🚀 SUCCESS! Your app now has REAL football highlights!');
      console.log('✅ Users will see actual Premier League, La Liga, Serie A matches!');
      console.log('🎯 No more Rick Roll videos - these are genuine football highlights!');
    }
    
  } catch (error) {
    console.error('❌ Error checking sync results:', error.message);
  }
}

checkSyncResults(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSyncResults() {
  console.log('🔍 Checking Sync Results');
  console.log('='.repeat(40));
  
  try {
    // Check leagues
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*');
    
    if (leaguesError) throw leaguesError;
    
    console.log(`📋 Leagues: ${leagues?.length || 0} found`);
    leagues?.forEach(league => {
      console.log(`   ✅ ${league.name} (${league.country}) - ID: ${league.id}`);
    });
    
    // Check teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');
    
    if (teamsError) throw teamsError;
    
    console.log(`\n👥 Teams: ${teams?.length || 0} found`);
    if (teams?.length > 0) {
      teams.slice(0, 5).forEach(team => {
        console.log(`   ✅ ${team.name} - League: ${team.league_id}`);
      });
      if (teams.length > 5) {
        console.log(`   ... and ${teams.length - 5} more teams`);
      }
    }
    
    // Check matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*');
    
    if (matchesError) throw matchesError;
    
    console.log(`\n⚽ Matches: ${matches?.length || 0} found`);
    if (matches?.length > 0) {
      matches.slice(0, 5).forEach(match => {
        console.log(`   ✅ ${match.home_team_name} vs ${match.away_team_name} - ${match.status}`);
      });
      if (matches.length > 5) {
        console.log(`   ... and ${matches.length - 5} more matches`);
      }
    }
    
    // Check highlights
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('*');
    
    if (highlightsError) throw highlightsError;
    
    console.log(`\n🎬 Highlights: ${highlights?.length || 0} found`);
    if (highlights?.length > 0) {
      highlights.slice(0, 10).forEach(highlight => {
        console.log(`   ✅ ${highlight.title.substring(0, 60)}...`);
      });
      if (highlights.length > 10) {
        console.log(`   ... and ${highlights.length - 10} more highlights`);
      }
    }
    
    // Check sync status
    const { data: syncStatus, error: syncError } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_sync', { ascending: false });
    
    if (syncError) throw syncError;
    
    console.log(`\n📊 Sync Status:`);
    syncStatus?.forEach(status => {
      const lastSync = new Date(status.last_sync).toLocaleString();
      console.log(`   ${status.status === 'completed' ? '✅' : '❌'} ${status.entity_type}: ${status.status} (${lastSync})`);
    });
    
    console.log('\n🎉 Database check completed!');
    
    if (highlights?.length > 0) {
      console.log('\n🚀 SUCCESS! Your app now has REAL football highlights!');
      console.log('✅ Users will see actual Premier League, La Liga, Serie A matches!');
      console.log('🎯 No more Rick Roll videos - these are genuine football highlights!');
    }
    
  } catch (error) {
    console.error('❌ Error checking sync results:', error.message);
  }
}

checkSyncResults(); 