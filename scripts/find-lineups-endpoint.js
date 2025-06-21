import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function testEndpoint(url) {
  console.log(`📡 Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      
      if (Array.isArray(data)) {
        console.log(`   📋 Array with ${data.length} items`);
        if (data.length > 0) {
          console.log(`   📋 First item properties:`, Object.keys(data[0]));
          
          // Check if it looks like lineup data
          const firstItem = data[0];
          if (firstItem.homeTeam && firstItem.awayTeam) {
            console.log(`   ⚽ Looks like lineup data!`);
            if (firstItem.homeTeam.formation) {
              console.log(`   🏠 Home formation: ${firstItem.homeTeam.formation}`);
            }
            if (firstItem.homeTeam.initialLineup) {
              console.log(`   👥 Home players: ${firstItem.homeTeam.initialLineup.flat().length}`);
            }
          }
        }
      } else if (typeof data === 'object') {
        console.log(`   📋 Object with properties:`, Object.keys(data));
        
        // Check if it's a single lineup
        if (data.homeTeam && data.awayTeam) {
          console.log(`   ⚽ Single lineup data!`);
          if (data.homeTeam.formation) {
            console.log(`   🏠 Home formation: ${data.homeTeam.formation}`);
          }
          if (data.homeTeam.initialLineup) {
            console.log(`   👥 Home players: ${data.homeTeam.initialLineup.flat().length}`);
          }
        }
      }
      
      return true;
    } else {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function findLineupsEndpoint() {
  console.log('🔍 FINDING THE CORRECT LINEUPS ENDPOINT');
  console.log('='.repeat(60));
  
  const matchId = '1028346631'; // Man United vs Aston Villa
  const leagueId = '33973'; // Premier League
  
  // Test different endpoint variations
  const endpoints = [
    // Different base URLs
    `https://sports.highlightly.net/football/lineups`,
    `https://sports.highlightly.net/lineups`,
    `https://highlightly.net/football/lineups`,
    `https://api.highlightly.net/football/lineups`,
    
    // With parameters
    `https://sports.highlightly.net/football/lineups?matchId=${matchId}`,
    `https://sports.highlightly.net/football/lineups?leagueId=${leagueId}`,
    `https://sports.highlightly.net/football/lineups?leagueId=${leagueId}&limit=5`,
    
    // Different path structures
    `https://sports.highlightly.net/football/matches/${matchId}/lineups`,
    `https://sports.highlightly.net/football/match/${matchId}/lineups`,
    `https://sports.highlightly.net/football/lineup/${matchId}`,
    
    // Soccer API base (in case it's there)
    `https://soccer.highlightly.net/lineups`,
    `https://soccer.highlightly.net/lineups?matchId=${matchId}`,
    `https://soccer.highlightly.net/matches/${matchId}/lineups`,
  ];
  
  console.log(`\n🎯 Testing ${endpoints.length} different endpoint variations...\n`);
  
  let foundEndpoints = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      foundEndpoints.push(endpoint);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 RESULTS:');
  console.log('='.repeat(30));
  
  if (foundEndpoints.length > 0) {
    console.log(`✅ Found ${foundEndpoints.length} working endpoint(s):`);
    foundEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint}`);
    });
  } else {
    console.log('❌ No working lineups endpoints found');
    console.log('💡 The lineups might be:');
    console.log('   • In a different API structure');
    console.log('   • Require different authentication');
    console.log('   • Only available for certain matches');
    console.log('   • Behind a different endpoint pattern');
  }
}

findLineupsEndpoint(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function testEndpoint(url) {
  console.log(`📡 Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      
      if (Array.isArray(data)) {
        console.log(`   📋 Array with ${data.length} items`);
        if (data.length > 0) {
          console.log(`   📋 First item properties:`, Object.keys(data[0]));
          
          // Check if it looks like lineup data
          const firstItem = data[0];
          if (firstItem.homeTeam && firstItem.awayTeam) {
            console.log(`   ⚽ Looks like lineup data!`);
            if (firstItem.homeTeam.formation) {
              console.log(`   🏠 Home formation: ${firstItem.homeTeam.formation}`);
            }
            if (firstItem.homeTeam.initialLineup) {
              console.log(`   👥 Home players: ${firstItem.homeTeam.initialLineup.flat().length}`);
            }
          }
        }
      } else if (typeof data === 'object') {
        console.log(`   📋 Object with properties:`, Object.keys(data));
        
        // Check if it's a single lineup
        if (data.homeTeam && data.awayTeam) {
          console.log(`   ⚽ Single lineup data!`);
          if (data.homeTeam.formation) {
            console.log(`   🏠 Home formation: ${data.homeTeam.formation}`);
          }
          if (data.homeTeam.initialLineup) {
            console.log(`   👥 Home players: ${data.homeTeam.initialLineup.flat().length}`);
          }
        }
      }
      
      return true;
    } else {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function findLineupsEndpoint() {
  console.log('🔍 FINDING THE CORRECT LINEUPS ENDPOINT');
  console.log('='.repeat(60));
  
  const matchId = '1028346631'; // Man United vs Aston Villa
  const leagueId = '33973'; // Premier League
  
  // Test different endpoint variations
  const endpoints = [
    // Different base URLs
    `https://sports.highlightly.net/football/lineups`,
    `https://sports.highlightly.net/lineups`,
    `https://highlightly.net/football/lineups`,
    `https://api.highlightly.net/football/lineups`,
    
    // With parameters
    `https://sports.highlightly.net/football/lineups?matchId=${matchId}`,
    `https://sports.highlightly.net/football/lineups?leagueId=${leagueId}`,
    `https://sports.highlightly.net/football/lineups?leagueId=${leagueId}&limit=5`,
    
    // Different path structures
    `https://sports.highlightly.net/football/matches/${matchId}/lineups`,
    `https://sports.highlightly.net/football/match/${matchId}/lineups`,
    `https://sports.highlightly.net/football/lineup/${matchId}`,
    
    // Soccer API base (in case it's there)
    `https://soccer.highlightly.net/lineups`,
    `https://soccer.highlightly.net/lineups?matchId=${matchId}`,
    `https://soccer.highlightly.net/matches/${matchId}/lineups`,
  ];
  
  console.log(`\n🎯 Testing ${endpoints.length} different endpoint variations...\n`);
  
  let foundEndpoints = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      foundEndpoints.push(endpoint);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 RESULTS:');
  console.log('='.repeat(30));
  
  if (foundEndpoints.length > 0) {
    console.log(`✅ Found ${foundEndpoints.length} working endpoint(s):`);
    foundEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint}`);
    });
  } else {
    console.log('❌ No working lineups endpoints found');
    console.log('💡 The lineups might be:');
    console.log('   • In a different API structure');
    console.log('   • Require different authentication');
    console.log('   • Only available for certain matches');
    console.log('   • Behind a different endpoint pattern');
  }
}

findLineupsEndpoint(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function testEndpoint(url) {
  console.log(`📡 Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      
      if (Array.isArray(data)) {
        console.log(`   📋 Array with ${data.length} items`);
        if (data.length > 0) {
          console.log(`   📋 First item properties:`, Object.keys(data[0]));
          
          // Check if it looks like lineup data
          const firstItem = data[0];
          if (firstItem.homeTeam && firstItem.awayTeam) {
            console.log(`   ⚽ Looks like lineup data!`);
            if (firstItem.homeTeam.formation) {
              console.log(`   🏠 Home formation: ${firstItem.homeTeam.formation}`);
            }
            if (firstItem.homeTeam.initialLineup) {
              console.log(`   👥 Home players: ${firstItem.homeTeam.initialLineup.flat().length}`);
            }
          }
        }
      } else if (typeof data === 'object') {
        console.log(`   📋 Object with properties:`, Object.keys(data));
        
        // Check if it's a single lineup
        if (data.homeTeam && data.awayTeam) {
          console.log(`   ⚽ Single lineup data!`);
          if (data.homeTeam.formation) {
            console.log(`   🏠 Home formation: ${data.homeTeam.formation}`);
          }
          if (data.homeTeam.initialLineup) {
            console.log(`   👥 Home players: ${data.homeTeam.initialLineup.flat().length}`);
          }
        }
      }
      
      return true;
    } else {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function findLineupsEndpoint() {
  console.log('🔍 FINDING THE CORRECT LINEUPS ENDPOINT');
  console.log('='.repeat(60));
  
  const matchId = '1028346631'; // Man United vs Aston Villa
  const leagueId = '33973'; // Premier League
  
  // Test different endpoint variations
  const endpoints = [
    // Different base URLs
    `https://sports.highlightly.net/football/lineups`,
    `https://sports.highlightly.net/lineups`,
    `https://highlightly.net/football/lineups`,
    `https://api.highlightly.net/football/lineups`,
    
    // With parameters
    `https://sports.highlightly.net/football/lineups?matchId=${matchId}`,
    `https://sports.highlightly.net/football/lineups?leagueId=${leagueId}`,
    `https://sports.highlightly.net/football/lineups?leagueId=${leagueId}&limit=5`,
    
    // Different path structures
    `https://sports.highlightly.net/football/matches/${matchId}/lineups`,
    `https://sports.highlightly.net/football/match/${matchId}/lineups`,
    `https://sports.highlightly.net/football/lineup/${matchId}`,
    
    // Soccer API base (in case it's there)
    `https://soccer.highlightly.net/lineups`,
    `https://soccer.highlightly.net/lineups?matchId=${matchId}`,
    `https://soccer.highlightly.net/matches/${matchId}/lineups`,
  ];
  
  console.log(`\n🎯 Testing ${endpoints.length} different endpoint variations...\n`);
  
  let foundEndpoints = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      foundEndpoints.push(endpoint);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 RESULTS:');
  console.log('='.repeat(30));
  
  if (foundEndpoints.length > 0) {
    console.log(`✅ Found ${foundEndpoints.length} working endpoint(s):`);
    foundEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint}`);
    });
  } else {
    console.log('❌ No working lineups endpoints found');
    console.log('💡 The lineups might be:');
    console.log('   • In a different API structure');
    console.log('   • Require different authentication');
    console.log('   • Only available for certain matches');
    console.log('   • Behind a different endpoint pattern');
  }
}

findLineupsEndpoint(); 