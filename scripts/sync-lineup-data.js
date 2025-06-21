import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function callHighlightlyApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function syncLineupData() {
  console.log('🔄 SYNCING LINEUP DATA');
  console.log('='.repeat(50));
  
  try {
    // Get all matches from database with team names
    console.log('📋 Fetching matches from database...');
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id, 
        api_data,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .order('id');
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`✅ Found ${matches.length} matches in database`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`\n🔍 Processing match: ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
        
        // Check if we already have lineup data
        const existingApiData = match.api_data || {};
        if (existingApiData.lineups) {
          console.log('   ⏭️  Already has lineup data, skipping...');
          skippedCount++;
          continue;
        }
        
        // Fetch lineup data from API
        console.log(`   📡 Fetching lineup data for match ID: ${match.id}`);
        const lineupsData = await callHighlightlyApi(`lineups/${match.id}`);
        
        // Merge lineup data with existing API data
        const updatedApiData = {
          ...existingApiData,
          lineups: lineupsData
        };
        
        // Update database
        const { error: updateError } = await supabase
          .from('matches')
          .update({ api_data: updatedApiData })
          .eq('id', match.id);
        
        if (updateError) {
          throw new Error(`Database update error: ${updateError.message}`);
        }
        
        console.log('   ✅ Lineup data synced successfully');
        console.log(`   🏠 Home: ${lineupsData.homeTeam?.name} (${lineupsData.homeTeam?.formation})`);
        console.log(`   🏃 Away: ${lineupsData.awayTeam?.name} (${lineupsData.awayTeam?.formation})`);
        
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Error processing match: ${error.message}`);
        errorCount++;
        
        // Continue with next match
        continue;
      }
    }
    
    console.log('\n🎯 SYNC RESULTS:');
    console.log('='.repeat(30));
    console.log(`✅ Updated: ${updatedCount} matches`);
    console.log(`⏭️  Skipped: ${skippedCount} matches (already had lineup data)`);
    console.log(`❌ Errors: ${errorCount} matches`);
    console.log(`📊 Total processed: ${matches.length} matches`);
    
    if (updatedCount > 0) {
      console.log('\n🔍 Verifying lineup data...');
      
      // Get a sample of updated matches to verify
      const { data: sampleMatches, error: sampleError } = await supabase
        .from('matches')
        .select(`
          id, 
          api_data,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .not('api_data->lineups', 'is', null)
        .limit(3);
      
      if (sampleError) {
        console.log('❌ Error verifying data:', sampleError.message);
      } else {
        console.log(`✅ Verified ${sampleMatches.length} matches with lineup data:`);
        
        sampleMatches.forEach(match => {
          const lineups = match.api_data?.lineups;
          if (lineups) {
            console.log(`   • ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
            console.log(`     Formations: ${lineups.homeTeam?.formation} vs ${lineups.awayTeam?.formation}`);
            console.log(`     Starting XI: ${lineups.homeTeam?.initialLineup?.flat().length || 0} vs ${lineups.awayTeam?.initialLineup?.flat().length || 0}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error syncing lineup data: ${error.message}`);
  }
}

syncLineupData(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function callHighlightlyApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function syncLineupData() {
  console.log('🔄 SYNCING LINEUP DATA');
  console.log('='.repeat(50));
  
  try {
    // Get all matches from database with team names
    console.log('📋 Fetching matches from database...');
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id, 
        api_data,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .order('id');
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`✅ Found ${matches.length} matches in database`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`\n🔍 Processing match: ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
        
        // Check if we already have lineup data
        const existingApiData = match.api_data || {};
        if (existingApiData.lineups) {
          console.log('   ⏭️  Already has lineup data, skipping...');
          skippedCount++;
          continue;
        }
        
        // Fetch lineup data from API
        console.log(`   📡 Fetching lineup data for match ID: ${match.id}`);
        const lineupsData = await callHighlightlyApi(`lineups/${match.id}`);
        
        // Merge lineup data with existing API data
        const updatedApiData = {
          ...existingApiData,
          lineups: lineupsData
        };
        
        // Update database
        const { error: updateError } = await supabase
          .from('matches')
          .update({ api_data: updatedApiData })
          .eq('id', match.id);
        
        if (updateError) {
          throw new Error(`Database update error: ${updateError.message}`);
        }
        
        console.log('   ✅ Lineup data synced successfully');
        console.log(`   🏠 Home: ${lineupsData.homeTeam?.name} (${lineupsData.homeTeam?.formation})`);
        console.log(`   🏃 Away: ${lineupsData.awayTeam?.name} (${lineupsData.awayTeam?.formation})`);
        
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Error processing match: ${error.message}`);
        errorCount++;
        
        // Continue with next match
        continue;
      }
    }
    
    console.log('\n🎯 SYNC RESULTS:');
    console.log('='.repeat(30));
    console.log(`✅ Updated: ${updatedCount} matches`);
    console.log(`⏭️  Skipped: ${skippedCount} matches (already had lineup data)`);
    console.log(`❌ Errors: ${errorCount} matches`);
    console.log(`📊 Total processed: ${matches.length} matches`);
    
    if (updatedCount > 0) {
      console.log('\n🔍 Verifying lineup data...');
      
      // Get a sample of updated matches to verify
      const { data: sampleMatches, error: sampleError } = await supabase
        .from('matches')
        .select(`
          id, 
          api_data,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .not('api_data->lineups', 'is', null)
        .limit(3);
      
      if (sampleError) {
        console.log('❌ Error verifying data:', sampleError.message);
      } else {
        console.log(`✅ Verified ${sampleMatches.length} matches with lineup data:`);
        
        sampleMatches.forEach(match => {
          const lineups = match.api_data?.lineups;
          if (lineups) {
            console.log(`   • ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
            console.log(`     Formations: ${lineups.homeTeam?.formation} vs ${lineups.awayTeam?.formation}`);
            console.log(`     Starting XI: ${lineups.homeTeam?.initialLineup?.flat().length || 0} vs ${lineups.awayTeam?.initialLineup?.flat().length || 0}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error syncing lineup data: ${error.message}`);
  }
}

syncLineupData(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function callHighlightlyApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': HIGHLIGHTLY_API_KEY,
      'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function syncLineupData() {
  console.log('🔄 SYNCING LINEUP DATA');
  console.log('='.repeat(50));
  
  try {
    // Get all matches from database with team names
    console.log('📋 Fetching matches from database...');
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id, 
        api_data,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .order('id');
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`✅ Found ${matches.length} matches in database`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`\n🔍 Processing match: ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
        
        // Check if we already have lineup data
        const existingApiData = match.api_data || {};
        if (existingApiData.lineups) {
          console.log('   ⏭️  Already has lineup data, skipping...');
          skippedCount++;
          continue;
        }
        
        // Fetch lineup data from API
        console.log(`   📡 Fetching lineup data for match ID: ${match.id}`);
        const lineupsData = await callHighlightlyApi(`lineups/${match.id}`);
        
        // Merge lineup data with existing API data
        const updatedApiData = {
          ...existingApiData,
          lineups: lineupsData
        };
        
        // Update database
        const { error: updateError } = await supabase
          .from('matches')
          .update({ api_data: updatedApiData })
          .eq('id', match.id);
        
        if (updateError) {
          throw new Error(`Database update error: ${updateError.message}`);
        }
        
        console.log('   ✅ Lineup data synced successfully');
        console.log(`   🏠 Home: ${lineupsData.homeTeam?.name} (${lineupsData.homeTeam?.formation})`);
        console.log(`   🏃 Away: ${lineupsData.awayTeam?.name} (${lineupsData.awayTeam?.formation})`);
        
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Error processing match: ${error.message}`);
        errorCount++;
        
        // Continue with next match
        continue;
      }
    }
    
    console.log('\n🎯 SYNC RESULTS:');
    console.log('='.repeat(30));
    console.log(`✅ Updated: ${updatedCount} matches`);
    console.log(`⏭️  Skipped: ${skippedCount} matches (already had lineup data)`);
    console.log(`❌ Errors: ${errorCount} matches`);
    console.log(`📊 Total processed: ${matches.length} matches`);
    
    if (updatedCount > 0) {
      console.log('\n🔍 Verifying lineup data...');
      
      // Get a sample of updated matches to verify
      const { data: sampleMatches, error: sampleError } = await supabase
        .from('matches')
        .select(`
          id, 
          api_data,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .not('api_data->lineups', 'is', null)
        .limit(3);
      
      if (sampleError) {
        console.log('❌ Error verifying data:', sampleError.message);
      } else {
        console.log(`✅ Verified ${sampleMatches.length} matches with lineup data:`);
        
        sampleMatches.forEach(match => {
          const lineups = match.api_data?.lineups;
          if (lineups) {
            console.log(`   • ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
            console.log(`     Formations: ${lineups.homeTeam?.formation} vs ${lineups.awayTeam?.formation}`);
            console.log(`     Starting XI: ${lineups.homeTeam?.initialLineup?.flat().length || 0} vs ${lineups.awayTeam?.initialLineup?.flat().length || 0}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error syncing lineup data: ${error.message}`);
  }
}

syncLineupData(); 