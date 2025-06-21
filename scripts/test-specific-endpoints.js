import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSpecificEndpoint(endpoint, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`📡 URL: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    console.log(`📦 Response type: ${typeof result}`);
    console.log(`📝 Response keys: ${Object.keys(result || {}).join(', ')}`);
    
    if (result.data) {
      console.log(`📊 Data keys: ${Object.keys(result.data || {}).join(', ')}`);
      if (result.data.events) {
        console.log(`⚽ Events count: ${result.data.events.length}`);
        console.log(`🥅 First event: ${JSON.stringify(result.data.events[0] || 'none')}`);
      }
      if (result.data.homeTeam && result.data.awayTeam) {
        console.log(`🏠 Home formation: ${result.data.homeTeam.formation || 'N/A'}`);
        console.log(`🏃 Away formation: ${result.data.awayTeam.formation || 'N/A'}`);
      }
    } else {
      console.log(`📄 Raw response preview: ${JSON.stringify(result).substring(0, 200)}...`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testWithRealMatchIds() {
  console.log('🚀 TESTING API ENDPOINTS WITH REAL MATCH IDS');
  console.log('='.repeat(80));
  
  // Get some real match IDs from database
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .limit(3);
  
  if (error) {
    console.log(`❌ Database error: ${error.message}`);
    return;
  }
  
  console.log(`📋 Testing with ${matches.length} real match IDs from database:`);
  
  for (const match of matches) {
    console.log(`\n🏆 MATCH: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
    console.log('='.repeat(60));
    
    // Test all 4 endpoints you provided
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/matches/${match.id}`,
      'Match Details'
    );
    
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/statistics/${match.id}`,
      'Match Statistics'
    );
    
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/lineups/${match.id}`,
      'Match Lineups'
    );
    
    // For H2H we need team IDs - let's get them
    const { data: fullMatch } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', match.id)
      .single();
    
    if (fullMatch) {
      await testSpecificEndpoint(
        `https://soccer.highlightly.net/head-2-head?teamIdOne=${fullMatch.home_team_id}&teamIdTwo=${fullMatch.away_team_id}`,
        'Head-to-Head'
      );
    }
  }
  
  // Also test the exact endpoint you provided as an example
  console.log(`\n🎯 TESTING YOUR SPECIFIC EXAMPLE:`);
  console.log('='.repeat(60));
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/matches/1028338121`,
    'Your Example Match ID'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/statistics/1028338121`,
    'Your Example Statistics'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/lineups/1028338121`,
    'Your Example Lineups'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/head-2-head?teamIdOne=1028338121&teamIdTwo=5700782`,
    'Your Example H2H'
  );
}

testWithRealMatchIds(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSpecificEndpoint(endpoint, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`📡 URL: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    console.log(`📦 Response type: ${typeof result}`);
    console.log(`📝 Response keys: ${Object.keys(result || {}).join(', ')}`);
    
    if (result.data) {
      console.log(`📊 Data keys: ${Object.keys(result.data || {}).join(', ')}`);
      if (result.data.events) {
        console.log(`⚽ Events count: ${result.data.events.length}`);
        console.log(`🥅 First event: ${JSON.stringify(result.data.events[0] || 'none')}`);
      }
      if (result.data.homeTeam && result.data.awayTeam) {
        console.log(`🏠 Home formation: ${result.data.homeTeam.formation || 'N/A'}`);
        console.log(`🏃 Away formation: ${result.data.awayTeam.formation || 'N/A'}`);
      }
    } else {
      console.log(`📄 Raw response preview: ${JSON.stringify(result).substring(0, 200)}...`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testWithRealMatchIds() {
  console.log('🚀 TESTING API ENDPOINTS WITH REAL MATCH IDS');
  console.log('='.repeat(80));
  
  // Get some real match IDs from database
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .limit(3);
  
  if (error) {
    console.log(`❌ Database error: ${error.message}`);
    return;
  }
  
  console.log(`📋 Testing with ${matches.length} real match IDs from database:`);
  
  for (const match of matches) {
    console.log(`\n🏆 MATCH: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
    console.log('='.repeat(60));
    
    // Test all 4 endpoints you provided
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/matches/${match.id}`,
      'Match Details'
    );
    
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/statistics/${match.id}`,
      'Match Statistics'
    );
    
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/lineups/${match.id}`,
      'Match Lineups'
    );
    
    // For H2H we need team IDs - let's get them
    const { data: fullMatch } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', match.id)
      .single();
    
    if (fullMatch) {
      await testSpecificEndpoint(
        `https://soccer.highlightly.net/head-2-head?teamIdOne=${fullMatch.home_team_id}&teamIdTwo=${fullMatch.away_team_id}`,
        'Head-to-Head'
      );
    }
  }
  
  // Also test the exact endpoint you provided as an example
  console.log(`\n🎯 TESTING YOUR SPECIFIC EXAMPLE:`);
  console.log('='.repeat(60));
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/matches/1028338121`,
    'Your Example Match ID'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/statistics/1028338121`,
    'Your Example Statistics'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/lineups/1028338121`,
    'Your Example Lineups'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/head-2-head?teamIdOne=1028338121&teamIdTwo=5700782`,
    'Your Example H2H'
  );
}

testWithRealMatchIds(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSpecificEndpoint(endpoint, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`📡 URL: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ Failed: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    console.log(`📦 Response type: ${typeof result}`);
    console.log(`📝 Response keys: ${Object.keys(result || {}).join(', ')}`);
    
    if (result.data) {
      console.log(`📊 Data keys: ${Object.keys(result.data || {}).join(', ')}`);
      if (result.data.events) {
        console.log(`⚽ Events count: ${result.data.events.length}`);
        console.log(`🥅 First event: ${JSON.stringify(result.data.events[0] || 'none')}`);
      }
      if (result.data.homeTeam && result.data.awayTeam) {
        console.log(`🏠 Home formation: ${result.data.homeTeam.formation || 'N/A'}`);
        console.log(`🏃 Away formation: ${result.data.awayTeam.formation || 'N/A'}`);
      }
    } else {
      console.log(`📄 Raw response preview: ${JSON.stringify(result).substring(0, 200)}...`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testWithRealMatchIds() {
  console.log('🚀 TESTING API ENDPOINTS WITH REAL MATCH IDS');
  console.log('='.repeat(80));
  
  // Get some real match IDs from database
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .limit(3);
  
  if (error) {
    console.log(`❌ Database error: ${error.message}`);
    return;
  }
  
  console.log(`📋 Testing with ${matches.length} real match IDs from database:`);
  
  for (const match of matches) {
    console.log(`\n🏆 MATCH: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
    console.log('='.repeat(60));
    
    // Test all 4 endpoints you provided
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/matches/${match.id}`,
      'Match Details'
    );
    
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/statistics/${match.id}`,
      'Match Statistics'
    );
    
    await testSpecificEndpoint(
      `https://soccer.highlightly.net/lineups/${match.id}`,
      'Match Lineups'
    );
    
    // For H2H we need team IDs - let's get them
    const { data: fullMatch } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', match.id)
      .single();
    
    if (fullMatch) {
      await testSpecificEndpoint(
        `https://soccer.highlightly.net/head-2-head?teamIdOne=${fullMatch.home_team_id}&teamIdTwo=${fullMatch.away_team_id}`,
        'Head-to-Head'
      );
    }
  }
  
  // Also test the exact endpoint you provided as an example
  console.log(`\n🎯 TESTING YOUR SPECIFIC EXAMPLE:`);
  console.log('='.repeat(60));
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/matches/1028338121`,
    'Your Example Match ID'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/statistics/1028338121`,
    'Your Example Statistics'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/lineups/1028338121`,
    'Your Example Lineups'
  );
  
  await testSpecificEndpoint(
    `https://soccer.highlightly.net/head-2-head?teamIdOne=1028338121&teamIdTwo=5700782`,
    'Your Example H2H'
  );
}

testWithRealMatchIds(); 