import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

// Correct API endpoints
const SOCCER_API_BASE = 'https://soccer.highlightly.net';
const SPORTS_API_BASE = 'https://soccer.highlightly.net';

let requestCount = 0;

async function rateLimitedDelay() {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
}

async function callHighlightlyApi(endpoint, useDetailedAPI = false) {
  requestCount++;
  
  const baseUrl = useDetailedAPI ? SPORTS_API_BASE : SOCCER_API_BASE;
  const url = `${baseUrl}/${endpoint}`;
  
  console.log(`📡 API Call ${requestCount}: ${url}`);
  
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
  
  await rateLimitedDelay();
  return await response.json();
}

async function syncDetailedMatchData() {
  console.log('🎯 SYNCING DETAILED MATCH DATA');
  console.log('='.repeat(50));
  console.log('📊 Will collect events, goalscorers, statistics, and lineups');
  console.log('🔧 Using correct API endpoint: sports.highlightly.net');
  
  try {
    // Get all matches from our database that need detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status')
      .eq('status', 'Finished')
      .limit(20); // Start with 20 matches
    
    if (error) {
      console.log('❌ Error fetching matches:', error.message);
      return;
    }
    
    console.log(`📋 Found ${matches.length} finished matches to sync detailed data for`);
    
    for (const match of matches) {
      try {
        console.log(`\n🔍 Syncing detailed data for match ID: ${match.id}`);
        
        // Get detailed match data from correct endpoint
        const detailedData = await callHighlightlyApi(`matches/${match.id}`, true);
        
        if (detailedData && detailedData.length > 0) {
          const matchDetail = detailedData[0];
          
          console.log(`✅ Got detailed data for: ${matchDetail.homeTeam?.name} vs ${matchDetail.awayTeam?.name}`);
          
          // Extract events (goals, cards, substitutions)
          const events = matchDetail.events || [];
          console.log(`   📊 Events: ${events.length}`);
          
          // Extract statistics
          const statistics = matchDetail.statistics || [];
          console.log(`   📈 Statistics: ${statistics.length} teams`);
          
          // Extract venue info
          const venue = matchDetail.venue || null;
          console.log(`   🏟️  Venue: ${venue?.name || 'Unknown'}`);
          
          // Update the match with detailed data
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              // Store venue information
              venue: venue?.name || null,
              
              // Store all detailed data in api_data field
              api_data: {
                ...matchDetail,
                // Make sure we preserve the basic match info
                basicInfo: match
              }
            })
            .eq('id', match.id);
          
          if (updateError) {
            console.log(`❌ Error updating match ${match.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated match ${match.id} with detailed data`);
            
            // Log some sample events
            const goals = events.filter(e => e.type === 'Goal');
            if (goals.length > 0) {
              console.log(`   ⚽ Goals found:`);
              goals.forEach(goal => {
                console.log(`      ${goal.time}' ${goal.player} ${goal.assist ? `(assist: ${goal.assist})` : ''}`);
              });
            }
          }
        } else {
          console.log(`❌ No detailed data found for match ${match.id}`);
        }
        
      } catch (matchError) {
        console.log(`❌ Error syncing match ${match.id}:`, matchError.message);
      }
    }
    
    console.log('\n🎉 DETAILED MATCH DATA SYNC COMPLETED!');
    console.log('='.repeat(40));
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Matches now contain:');
    console.log('   ⚽ Goal events with scorers and assists');
    console.log('   🟨 Cards and substitutions');
    console.log('   📊 Detailed match statistics');
    console.log('   🏟️  Venue information');
    console.log('   👥 Player performance data');
    
  } catch (error) {
    console.log('❌ Sync failed:', error.message);
  }
}

// Run the sync
syncDetailedMatchData(); 
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

// Correct API endpoints
const SOCCER_API_BASE = 'https://soccer.highlightly.net';
const SPORTS_API_BASE = 'https://soccer.highlightly.net';

let requestCount = 0;

async function rateLimitedDelay() {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
}

async function callHighlightlyApi(endpoint, useDetailedAPI = false) {
  requestCount++;
  
  const baseUrl = useDetailedAPI ? SPORTS_API_BASE : SOCCER_API_BASE;
  const url = `${baseUrl}/${endpoint}`;
  
  console.log(`📡 API Call ${requestCount}: ${url}`);
  
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
  
  await rateLimitedDelay();
  return await response.json();
}

async function syncDetailedMatchData() {
  console.log('🎯 SYNCING DETAILED MATCH DATA');
  console.log('='.repeat(50));
  console.log('📊 Will collect events, goalscorers, statistics, and lineups');
  console.log('🔧 Using correct API endpoint: sports.highlightly.net');
  
  try {
    // Get all matches from our database that need detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status')
      .eq('status', 'Finished')
      .limit(20); // Start with 20 matches
    
    if (error) {
      console.log('❌ Error fetching matches:', error.message);
      return;
    }
    
    console.log(`📋 Found ${matches.length} finished matches to sync detailed data for`);
    
    for (const match of matches) {
      try {
        console.log(`\n🔍 Syncing detailed data for match ID: ${match.id}`);
        
        // Get detailed match data from correct endpoint
        const detailedData = await callHighlightlyApi(`matches/${match.id}`, true);
        
        if (detailedData && detailedData.length > 0) {
          const matchDetail = detailedData[0];
          
          console.log(`✅ Got detailed data for: ${matchDetail.homeTeam?.name} vs ${matchDetail.awayTeam?.name}`);
          
          // Extract events (goals, cards, substitutions)
          const events = matchDetail.events || [];
          console.log(`   📊 Events: ${events.length}`);
          
          // Extract statistics
          const statistics = matchDetail.statistics || [];
          console.log(`   📈 Statistics: ${statistics.length} teams`);
          
          // Extract venue info
          const venue = matchDetail.venue || null;
          console.log(`   🏟️  Venue: ${venue?.name || 'Unknown'}`);
          
          // Update the match with detailed data
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              // Store venue information
              venue: venue?.name || null,
              
              // Store all detailed data in api_data field
              api_data: {
                ...matchDetail,
                // Make sure we preserve the basic match info
                basicInfo: match
              }
            })
            .eq('id', match.id);
          
          if (updateError) {
            console.log(`❌ Error updating match ${match.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated match ${match.id} with detailed data`);
            
            // Log some sample events
            const goals = events.filter(e => e.type === 'Goal');
            if (goals.length > 0) {
              console.log(`   ⚽ Goals found:`);
              goals.forEach(goal => {
                console.log(`      ${goal.time}' ${goal.player} ${goal.assist ? `(assist: ${goal.assist})` : ''}`);
              });
            }
          }
        } else {
          console.log(`❌ No detailed data found for match ${match.id}`);
        }
        
      } catch (matchError) {
        console.log(`❌ Error syncing match ${match.id}:`, matchError.message);
      }
    }
    
    console.log('\n🎉 DETAILED MATCH DATA SYNC COMPLETED!');
    console.log('='.repeat(40));
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Matches now contain:');
    console.log('   ⚽ Goal events with scorers and assists');
    console.log('   🟨 Cards and substitutions');
    console.log('   📊 Detailed match statistics');
    console.log('   🏟️  Venue information');
    console.log('   👥 Player performance data');
    
  } catch (error) {
    console.log('❌ Sync failed:', error.message);
  }
}

// Run the sync
syncDetailedMatchData(); 
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

// Correct API endpoints
const SOCCER_API_BASE = 'https://soccer.highlightly.net';
const SPORTS_API_BASE = 'https://soccer.highlightly.net';

let requestCount = 0;

async function rateLimitedDelay() {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
}

async function callHighlightlyApi(endpoint, useDetailedAPI = false) {
  requestCount++;
  
  const baseUrl = useDetailedAPI ? SPORTS_API_BASE : SOCCER_API_BASE;
  const url = `${baseUrl}/${endpoint}`;
  
  console.log(`📡 API Call ${requestCount}: ${url}`);
  
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
  
  await rateLimitedDelay();
  return await response.json();
}

async function syncDetailedMatchData() {
  console.log('🎯 SYNCING DETAILED MATCH DATA');
  console.log('='.repeat(50));
  console.log('📊 Will collect events, goalscorers, statistics, and lineups');
  console.log('🔧 Using correct API endpoint: sports.highlightly.net');
  
  try {
    // Get all matches from our database that need detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status')
      .eq('status', 'Finished')
      .limit(20); // Start with 20 matches
    
    if (error) {
      console.log('❌ Error fetching matches:', error.message);
      return;
    }
    
    console.log(`📋 Found ${matches.length} finished matches to sync detailed data for`);
    
    for (const match of matches) {
      try {
        console.log(`\n🔍 Syncing detailed data for match ID: ${match.id}`);
        
        // Get detailed match data from correct endpoint
        const detailedData = await callHighlightlyApi(`matches/${match.id}`, true);
        
        if (detailedData && detailedData.length > 0) {
          const matchDetail = detailedData[0];
          
          console.log(`✅ Got detailed data for: ${matchDetail.homeTeam?.name} vs ${matchDetail.awayTeam?.name}`);
          
          // Extract events (goals, cards, substitutions)
          const events = matchDetail.events || [];
          console.log(`   📊 Events: ${events.length}`);
          
          // Extract statistics
          const statistics = matchDetail.statistics || [];
          console.log(`   📈 Statistics: ${statistics.length} teams`);
          
          // Extract venue info
          const venue = matchDetail.venue || null;
          console.log(`   🏟️  Venue: ${venue?.name || 'Unknown'}`);
          
          // Update the match with detailed data
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              // Store venue information
              venue: venue?.name || null,
              
              // Store all detailed data in api_data field
              api_data: {
                ...matchDetail,
                // Make sure we preserve the basic match info
                basicInfo: match
              }
            })
            .eq('id', match.id);
          
          if (updateError) {
            console.log(`❌ Error updating match ${match.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated match ${match.id} with detailed data`);
            
            // Log some sample events
            const goals = events.filter(e => e.type === 'Goal');
            if (goals.length > 0) {
              console.log(`   ⚽ Goals found:`);
              goals.forEach(goal => {
                console.log(`      ${goal.time}' ${goal.player} ${goal.assist ? `(assist: ${goal.assist})` : ''}`);
              });
            }
          }
        } else {
          console.log(`❌ No detailed data found for match ${match.id}`);
        }
        
      } catch (matchError) {
        console.log(`❌ Error syncing match ${match.id}:`, matchError.message);
      }
    }
    
    console.log('\n🎉 DETAILED MATCH DATA SYNC COMPLETED!');
    console.log('='.repeat(40));
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Matches now contain:');
    console.log('   ⚽ Goal events with scorers and assists');
    console.log('   🟨 Cards and substitutions');
    console.log('   📊 Detailed match statistics');
    console.log('   🏟️  Venue information');
    console.log('   👥 Player performance data');
    
  } catch (error) {
    console.log('❌ Sync failed:', error.message);
  }
}

// Run the sync
syncDetailedMatchData(); 