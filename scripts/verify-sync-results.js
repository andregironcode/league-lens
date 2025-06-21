import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifySync() {
  console.log('🔍 VERIFYING SYNC RESULTS');
  console.log('='.repeat(50));
  
  try {
    // Check matches with lineup data
    const { data: matchesWithLineups, error: lineupsError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(5);
    
    if (lineupsError) {
      console.log('❌ Error checking lineups:', lineupsError.message);
    } else {
      console.log(`✅ Found ${matchesWithLineups.length} matches with lineup data:`);
      matchesWithLineups.forEach(match => {
        const lineups = match.api_data?.lineups;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
      });
    }
    
    // Check matches with head-to-head data
    const { data: matchesWithH2H, error: h2hError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->headToHead', 'is', null)
      .limit(3);
    
    if (h2hError) {
      console.log('❌ Error checking H2H:', h2hError.message);
    } else {
      console.log(`\n✅ Found ${matchesWithH2H.length} matches with head-to-head data:`);
      matchesWithH2H.forEach(match => {
        const h2h = match.api_data?.headToHead;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Historical matches: ${h2h?.matches?.length || 0}`);
        if (h2h?.statistics?.wins) {
          console.log(`     Win record: ${h2h.statistics.wins.team1}-${h2h.statistics.wins.draws}-${h2h.statistics.wins.team2}`);
        }
      });
    }
    
    // Check matches with events data
    const { data: matchesWithEvents, error: eventsError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->events', 'is', null)
      .limit(3);
    
    if (eventsError) {
      console.log('❌ Error checking events:', eventsError.message);
    } else {
      console.log(`\n✅ Found ${matchesWithEvents.length} matches with events data:`);
      matchesWithEvents.forEach(match => {
        const events = match.api_data?.events;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Events: ${events?.length || 0}`);
      });
    }
    
    // Get total counts for verification
    const [
      { count: totalMatches },
      { data: lineupsMatches },
      { data: h2hMatches },
      { data: eventsMatches }
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->events', 'is', null)
    ]);
    
    console.log('\n📊 ACTUAL DATA COMPLETENESS:');
    console.log(`   Total matches: ${totalMatches}`);
    console.log(`   Matches with lineups: ${lineupsMatches?.length || 0}`);
    console.log(`   Matches with head-to-head: ${h2hMatches?.length || 0}`);
    console.log(`   Matches with events: ${eventsMatches?.length || 0}`);
    
  } catch (error) {
    console.log('❌ Error verifying sync:', error.message);
  }
}

verifySync(); 
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifySync() {
  console.log('🔍 VERIFYING SYNC RESULTS');
  console.log('='.repeat(50));
  
  try {
    // Check matches with lineup data
    const { data: matchesWithLineups, error: lineupsError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(5);
    
    if (lineupsError) {
      console.log('❌ Error checking lineups:', lineupsError.message);
    } else {
      console.log(`✅ Found ${matchesWithLineups.length} matches with lineup data:`);
      matchesWithLineups.forEach(match => {
        const lineups = match.api_data?.lineups;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
      });
    }
    
    // Check matches with head-to-head data
    const { data: matchesWithH2H, error: h2hError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->headToHead', 'is', null)
      .limit(3);
    
    if (h2hError) {
      console.log('❌ Error checking H2H:', h2hError.message);
    } else {
      console.log(`\n✅ Found ${matchesWithH2H.length} matches with head-to-head data:`);
      matchesWithH2H.forEach(match => {
        const h2h = match.api_data?.headToHead;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Historical matches: ${h2h?.matches?.length || 0}`);
        if (h2h?.statistics?.wins) {
          console.log(`     Win record: ${h2h.statistics.wins.team1}-${h2h.statistics.wins.draws}-${h2h.statistics.wins.team2}`);
        }
      });
    }
    
    // Check matches with events data
    const { data: matchesWithEvents, error: eventsError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->events', 'is', null)
      .limit(3);
    
    if (eventsError) {
      console.log('❌ Error checking events:', eventsError.message);
    } else {
      console.log(`\n✅ Found ${matchesWithEvents.length} matches with events data:`);
      matchesWithEvents.forEach(match => {
        const events = match.api_data?.events;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Events: ${events?.length || 0}`);
      });
    }
    
    // Get total counts for verification
    const [
      { count: totalMatches },
      { data: lineupsMatches },
      { data: h2hMatches },
      { data: eventsMatches }
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->events', 'is', null)
    ]);
    
    console.log('\n📊 ACTUAL DATA COMPLETENESS:');
    console.log(`   Total matches: ${totalMatches}`);
    console.log(`   Matches with lineups: ${lineupsMatches?.length || 0}`);
    console.log(`   Matches with head-to-head: ${h2hMatches?.length || 0}`);
    console.log(`   Matches with events: ${eventsMatches?.length || 0}`);
    
  } catch (error) {
    console.log('❌ Error verifying sync:', error.message);
  }
}

verifySync(); 
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifySync() {
  console.log('🔍 VERIFYING SYNC RESULTS');
  console.log('='.repeat(50));
  
  try {
    // Check matches with lineup data
    const { data: matchesWithLineups, error: lineupsError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(5);
    
    if (lineupsError) {
      console.log('❌ Error checking lineups:', lineupsError.message);
    } else {
      console.log(`✅ Found ${matchesWithLineups.length} matches with lineup data:`);
      matchesWithLineups.forEach(match => {
        const lineups = match.api_data?.lineups;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
      });
    }
    
    // Check matches with head-to-head data
    const { data: matchesWithH2H, error: h2hError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->headToHead', 'is', null)
      .limit(3);
    
    if (h2hError) {
      console.log('❌ Error checking H2H:', h2hError.message);
    } else {
      console.log(`\n✅ Found ${matchesWithH2H.length} matches with head-to-head data:`);
      matchesWithH2H.forEach(match => {
        const h2h = match.api_data?.headToHead;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Historical matches: ${h2h?.matches?.length || 0}`);
        if (h2h?.statistics?.wins) {
          console.log(`     Win record: ${h2h.statistics.wins.team1}-${h2h.statistics.wins.draws}-${h2h.statistics.wins.team2}`);
        }
      });
    }
    
    // Check matches with events data
    const { data: matchesWithEvents, error: eventsError } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .not('api_data->events', 'is', null)
      .limit(3);
    
    if (eventsError) {
      console.log('❌ Error checking events:', eventsError.message);
    } else {
      console.log(`\n✅ Found ${matchesWithEvents.length} matches with events data:`);
      matchesWithEvents.forEach(match => {
        const events = match.api_data?.events;
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Events: ${events?.length || 0}`);
      });
    }
    
    // Get total counts for verification
    const [
      { count: totalMatches },
      { data: lineupsMatches },
      { data: h2hMatches },
      { data: eventsMatches }
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null),
      supabase.from('matches').select('id', { count: 'exact', head: true }).not('api_data->events', 'is', null)
    ]);
    
    console.log('\n📊 ACTUAL DATA COMPLETENESS:');
    console.log(`   Total matches: ${totalMatches}`);
    console.log(`   Matches with lineups: ${lineupsMatches?.length || 0}`);
    console.log(`   Matches with head-to-head: ${h2hMatches?.length || 0}`);
    console.log(`   Matches with events: ${eventsMatches?.length || 0}`);
    
  } catch (error) {
    console.log('❌ Error verifying sync:', error.message);
  }
}

verifySync(); 