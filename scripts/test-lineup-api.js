import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SPORTS_API_BASE = 'https://sports.highlightly.net/football';

async function callHighlightlyApi(endpoint) {
  const url = `${SPORTS_API_BASE}/${endpoint}`;
  console.log(`📡 Calling: ${url}`);
  
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

async function testLineupAPI() {
  console.log('🔍 TESTING LINEUP API ENDPOINTS');
  console.log('='.repeat(50));
  
  try {
    // Test with a known match ID that should have lineups
    const matchId = '1028346631'; // Man United vs Aston Villa
    
    console.log(`\n🎯 Testing match ID: ${matchId}`);
    
    // Test 1: Get match details
    console.log('\n📋 Test 1: Getting match details...');
    const matchData = await callHighlightlyApi(`matches/${matchId}`);
    
    if (matchData && matchData.length > 0) {
      const match = matchData[0];
      console.log(`✅ Match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
      
      // Check for lineup data in the response
      console.log('\n🔍 Checking for lineup data in match response...');
      console.log('Available properties:', Object.keys(match));
      
      // Check homeTeam structure
      if (match.homeTeam) {
        console.log('\n🏠 Home Team structure:');
        console.log('Properties:', Object.keys(match.homeTeam));
        
        if (match.homeTeam.formation) {
          console.log(`✅ Formation: ${match.homeTeam.formation}`);
        }
        if (match.homeTeam.initialLineup) {
          console.log(`✅ Initial Lineup: ${match.homeTeam.initialLineup.flat().length} players`);
          // Show first few players
          const firstPlayers = match.homeTeam.initialLineup.flat().slice(0, 3);
          firstPlayers.forEach(player => {
            console.log(`   ${player.number}. ${player.name} (${player.position})`);
          });
        }
        if (match.homeTeam.substitutes) {
          console.log(`✅ Substitutes: ${match.homeTeam.substitutes.length} players`);
        }
      }
      
      // Check awayTeam structure
      if (match.awayTeam) {
        console.log('\n🏃 Away Team structure:');
        console.log('Properties:', Object.keys(match.awayTeam));
        
        if (match.awayTeam.formation) {
          console.log(`✅ Formation: ${match.awayTeam.formation}`);
        }
        if (match.awayTeam.initialLineup) {
          console.log(`✅ Initial Lineup: ${match.awayTeam.initialLineup.flat().length} players`);
        }
        if (match.awayTeam.substitutes) {
          console.log(`✅ Substitutes: ${match.awayTeam.substitutes.length} players`);
        }
      }
      
      // Check for separate lineups object
      if (match.lineups) {
        console.log('\n📋 Separate lineups object found:');
        console.log('Teams with lineups:', Object.keys(match.lineups));
      } else {
        console.log('\n❌ No separate lineups object');
      }
      
    } else {
      console.log('❌ No match data returned');
    }
    
    // Test 2: Try a lineups-specific endpoint (if it exists)
    console.log('\n📋 Test 2: Trying lineups-specific endpoint...');
    try {
      const lineupsData = await callHighlightlyApi(`matches/${matchId}/lineups`);
      console.log('✅ Lineups endpoint exists!');
      console.log('Lineups data:', lineupsData);
    } catch (lineupError) {
      console.log('❌ No lineups-specific endpoint:', lineupError.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ API endpoint tested');
    console.log('📋 Lineup data availability checked');
    
  } catch (error) {
    console.log('❌ Error testing lineup API:', error.message);
  }
}

testLineupAPI(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SPORTS_API_BASE = 'https://sports.highlightly.net/football';

async function callHighlightlyApi(endpoint) {
  const url = `${SPORTS_API_BASE}/${endpoint}`;
  console.log(`📡 Calling: ${url}`);
  
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

async function testLineupAPI() {
  console.log('🔍 TESTING LINEUP API ENDPOINTS');
  console.log('='.repeat(50));
  
  try {
    // Test with a known match ID that should have lineups
    const matchId = '1028346631'; // Man United vs Aston Villa
    
    console.log(`\n🎯 Testing match ID: ${matchId}`);
    
    // Test 1: Get match details
    console.log('\n📋 Test 1: Getting match details...');
    const matchData = await callHighlightlyApi(`matches/${matchId}`);
    
    if (matchData && matchData.length > 0) {
      const match = matchData[0];
      console.log(`✅ Match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
      
      // Check for lineup data in the response
      console.log('\n🔍 Checking for lineup data in match response...');
      console.log('Available properties:', Object.keys(match));
      
      // Check homeTeam structure
      if (match.homeTeam) {
        console.log('\n🏠 Home Team structure:');
        console.log('Properties:', Object.keys(match.homeTeam));
        
        if (match.homeTeam.formation) {
          console.log(`✅ Formation: ${match.homeTeam.formation}`);
        }
        if (match.homeTeam.initialLineup) {
          console.log(`✅ Initial Lineup: ${match.homeTeam.initialLineup.flat().length} players`);
          // Show first few players
          const firstPlayers = match.homeTeam.initialLineup.flat().slice(0, 3);
          firstPlayers.forEach(player => {
            console.log(`   ${player.number}. ${player.name} (${player.position})`);
          });
        }
        if (match.homeTeam.substitutes) {
          console.log(`✅ Substitutes: ${match.homeTeam.substitutes.length} players`);
        }
      }
      
      // Check awayTeam structure
      if (match.awayTeam) {
        console.log('\n🏃 Away Team structure:');
        console.log('Properties:', Object.keys(match.awayTeam));
        
        if (match.awayTeam.formation) {
          console.log(`✅ Formation: ${match.awayTeam.formation}`);
        }
        if (match.awayTeam.initialLineup) {
          console.log(`✅ Initial Lineup: ${match.awayTeam.initialLineup.flat().length} players`);
        }
        if (match.awayTeam.substitutes) {
          console.log(`✅ Substitutes: ${match.awayTeam.substitutes.length} players`);
        }
      }
      
      // Check for separate lineups object
      if (match.lineups) {
        console.log('\n📋 Separate lineups object found:');
        console.log('Teams with lineups:', Object.keys(match.lineups));
      } else {
        console.log('\n❌ No separate lineups object');
      }
      
    } else {
      console.log('❌ No match data returned');
    }
    
    // Test 2: Try a lineups-specific endpoint (if it exists)
    console.log('\n📋 Test 2: Trying lineups-specific endpoint...');
    try {
      const lineupsData = await callHighlightlyApi(`matches/${matchId}/lineups`);
      console.log('✅ Lineups endpoint exists!');
      console.log('Lineups data:', lineupsData);
    } catch (lineupError) {
      console.log('❌ No lineups-specific endpoint:', lineupError.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ API endpoint tested');
    console.log('📋 Lineup data availability checked');
    
  } catch (error) {
    console.log('❌ Error testing lineup API:', error.message);
  }
}

testLineupAPI(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SPORTS_API_BASE = 'https://sports.highlightly.net/football';

async function callHighlightlyApi(endpoint) {
  const url = `${SPORTS_API_BASE}/${endpoint}`;
  console.log(`📡 Calling: ${url}`);
  
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

async function testLineupAPI() {
  console.log('🔍 TESTING LINEUP API ENDPOINTS');
  console.log('='.repeat(50));
  
  try {
    // Test with a known match ID that should have lineups
    const matchId = '1028346631'; // Man United vs Aston Villa
    
    console.log(`\n🎯 Testing match ID: ${matchId}`);
    
    // Test 1: Get match details
    console.log('\n📋 Test 1: Getting match details...');
    const matchData = await callHighlightlyApi(`matches/${matchId}`);
    
    if (matchData && matchData.length > 0) {
      const match = matchData[0];
      console.log(`✅ Match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
      
      // Check for lineup data in the response
      console.log('\n🔍 Checking for lineup data in match response...');
      console.log('Available properties:', Object.keys(match));
      
      // Check homeTeam structure
      if (match.homeTeam) {
        console.log('\n🏠 Home Team structure:');
        console.log('Properties:', Object.keys(match.homeTeam));
        
        if (match.homeTeam.formation) {
          console.log(`✅ Formation: ${match.homeTeam.formation}`);
        }
        if (match.homeTeam.initialLineup) {
          console.log(`✅ Initial Lineup: ${match.homeTeam.initialLineup.flat().length} players`);
          // Show first few players
          const firstPlayers = match.homeTeam.initialLineup.flat().slice(0, 3);
          firstPlayers.forEach(player => {
            console.log(`   ${player.number}. ${player.name} (${player.position})`);
          });
        }
        if (match.homeTeam.substitutes) {
          console.log(`✅ Substitutes: ${match.homeTeam.substitutes.length} players`);
        }
      }
      
      // Check awayTeam structure
      if (match.awayTeam) {
        console.log('\n🏃 Away Team structure:');
        console.log('Properties:', Object.keys(match.awayTeam));
        
        if (match.awayTeam.formation) {
          console.log(`✅ Formation: ${match.awayTeam.formation}`);
        }
        if (match.awayTeam.initialLineup) {
          console.log(`✅ Initial Lineup: ${match.awayTeam.initialLineup.flat().length} players`);
        }
        if (match.awayTeam.substitutes) {
          console.log(`✅ Substitutes: ${match.awayTeam.substitutes.length} players`);
        }
      }
      
      // Check for separate lineups object
      if (match.lineups) {
        console.log('\n📋 Separate lineups object found:');
        console.log('Teams with lineups:', Object.keys(match.lineups));
      } else {
        console.log('\n❌ No separate lineups object');
      }
      
    } else {
      console.log('❌ No match data returned');
    }
    
    // Test 2: Try a lineups-specific endpoint (if it exists)
    console.log('\n📋 Test 2: Trying lineups-specific endpoint...');
    try {
      const lineupsData = await callHighlightlyApi(`matches/${matchId}/lineups`);
      console.log('✅ Lineups endpoint exists!');
      console.log('Lineups data:', lineupsData);
    } catch (lineupError) {
      console.log('❌ No lineups-specific endpoint:', lineupError.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ API endpoint tested');
    console.log('📋 Lineup data availability checked');
    
  } catch (error) {
    console.log('❌ Error testing lineup API:', error.message);
  }
}

testLineupAPI(); 