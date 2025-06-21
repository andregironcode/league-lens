import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testLineupData() {
  console.log('🔍 Testing lineup data extraction...');
  
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id, 
      home_team:teams!matches_home_team_id_fkey(name), 
      away_team:teams!matches_away_team_id_fkey(name), 
      api_data
    `)
    .not('api_data->lineups', 'is', null)
    .limit(1)
    .single();
    
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Sample match with lineup data:');
  console.log(`Match: ${match.home_team.name} vs ${match.away_team.name}`);
  console.log(`Match ID: ${match.id}`);
  console.log(`Home formation: ${match.api_data?.lineups?.homeTeam?.formation}`);
  console.log(`Away formation: ${match.api_data?.lineups?.awayTeam?.formation}`);
  console.log(`Home starting XI: ${match.api_data?.lineups?.homeTeam?.initialLineup?.flat().length || 0}`);
  console.log(`Away starting XI: ${match.api_data?.lineups?.awayTeam?.initialLineup?.flat().length || 0}`);
  console.log(`Home substitutes: ${match.api_data?.lineups?.homeTeam?.substitutes?.length || 0}`);
  console.log(`Away substitutes: ${match.api_data?.lineups?.awayTeam?.substitutes?.length || 0}`);
  
  // Show sample players
  if (match.api_data?.lineups?.homeTeam?.initialLineup) {
    console.log('\nSample home players:');
    const players = match.api_data.lineups.homeTeam.initialLineup.flat().slice(0, 3);
    players.forEach(p => console.log(`   ${p.number}. ${p.name} (${p.position})`));
  }
  
  if (match.api_data?.lineups?.awayTeam?.substitutes) {
    console.log('\nSample away substitutes:');
    const subs = match.api_data.lineups.awayTeam.substitutes.slice(0, 2);
    subs.forEach(p => console.log(`   ${p.number}. ${p.name} (${p.position})`));
  }
}

testLineupData(); 
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testLineupData() {
  console.log('🔍 Testing lineup data extraction...');
  
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id, 
      home_team:teams!matches_home_team_id_fkey(name), 
      away_team:teams!matches_away_team_id_fkey(name), 
      api_data
    `)
    .not('api_data->lineups', 'is', null)
    .limit(1)
    .single();
    
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Sample match with lineup data:');
  console.log(`Match: ${match.home_team.name} vs ${match.away_team.name}`);
  console.log(`Match ID: ${match.id}`);
  console.log(`Home formation: ${match.api_data?.lineups?.homeTeam?.formation}`);
  console.log(`Away formation: ${match.api_data?.lineups?.awayTeam?.formation}`);
  console.log(`Home starting XI: ${match.api_data?.lineups?.homeTeam?.initialLineup?.flat().length || 0}`);
  console.log(`Away starting XI: ${match.api_data?.lineups?.awayTeam?.initialLineup?.flat().length || 0}`);
  console.log(`Home substitutes: ${match.api_data?.lineups?.homeTeam?.substitutes?.length || 0}`);
  console.log(`Away substitutes: ${match.api_data?.lineups?.awayTeam?.substitutes?.length || 0}`);
  
  // Show sample players
  if (match.api_data?.lineups?.homeTeam?.initialLineup) {
    console.log('\nSample home players:');
    const players = match.api_data.lineups.homeTeam.initialLineup.flat().slice(0, 3);
    players.forEach(p => console.log(`   ${p.number}. ${p.name} (${p.position})`));
  }
  
  if (match.api_data?.lineups?.awayTeam?.substitutes) {
    console.log('\nSample away substitutes:');
    const subs = match.api_data.lineups.awayTeam.substitutes.slice(0, 2);
    subs.forEach(p => console.log(`   ${p.number}. ${p.name} (${p.position})`));
  }
}

testLineupData(); 
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testLineupData() {
  console.log('🔍 Testing lineup data extraction...');
  
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id, 
      home_team:teams!matches_home_team_id_fkey(name), 
      away_team:teams!matches_away_team_id_fkey(name), 
      api_data
    `)
    .not('api_data->lineups', 'is', null)
    .limit(1)
    .single();
    
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Sample match with lineup data:');
  console.log(`Match: ${match.home_team.name} vs ${match.away_team.name}`);
  console.log(`Match ID: ${match.id}`);
  console.log(`Home formation: ${match.api_data?.lineups?.homeTeam?.formation}`);
  console.log(`Away formation: ${match.api_data?.lineups?.awayTeam?.formation}`);
  console.log(`Home starting XI: ${match.api_data?.lineups?.homeTeam?.initialLineup?.flat().length || 0}`);
  console.log(`Away starting XI: ${match.api_data?.lineups?.awayTeam?.initialLineup?.flat().length || 0}`);
  console.log(`Home substitutes: ${match.api_data?.lineups?.homeTeam?.substitutes?.length || 0}`);
  console.log(`Away substitutes: ${match.api_data?.lineups?.awayTeam?.substitutes?.length || 0}`);
  
  // Show sample players
  if (match.api_data?.lineups?.homeTeam?.initialLineup) {
    console.log('\nSample home players:');
    const players = match.api_data.lineups.homeTeam.initialLineup.flat().slice(0, 3);
    players.forEach(p => console.log(`   ${p.number}. ${p.name} (${p.position})`));
  }
  
  if (match.api_data?.lineups?.awayTeam?.substitutes) {
    console.log('\nSample away substitutes:');
    const subs = match.api_data.lineups.awayTeam.substitutes.slice(0, 2);
    subs.forEach(p => console.log(`   ${p.number}. ${p.name} (${p.position})`));
  }
}

testLineupData(); 