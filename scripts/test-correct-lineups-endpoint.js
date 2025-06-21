import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callHighlightlyApi(endpoint) {
  const url = `https://sports.highlightly.net/football/${endpoint}`;
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

async function testCorrectLineupsEndpoint() {
  console.log('🔍 TESTING CORRECT LINEUPS ENDPOINT FORMAT');
  console.log('='.repeat(50));
  
  // Test with the match ID you provided
  const testMatchId = '1028343227';
  
  try {
    console.log(`\n📋 Testing lineups for match ID: ${testMatchId}`);
    const lineupsData = await callHighlightlyApi(`lineups/${testMatchId}`);
    
    console.log('✅ SUCCESS! Lineups endpoint works!');
    console.log('Response type:', typeof lineupsData);
    console.log('Response properties:', Object.keys(lineupsData));
    
    // Analyze the structure
    if (lineupsData.homeTeam) {
      console.log('\n🏠 HOME TEAM:');
      console.log(`   Name: ${lineupsData.homeTeam.name || 'Unknown'}`);
      console.log(`   Formation: ${lineupsData.homeTeam.formation || 'Unknown'}`);
      console.log(`   Coach: ${lineupsData.homeTeam.coach || 'Unknown'}`);
      
      if (lineupsData.homeTeam.initialLineup) {
        const totalPlayers = lineupsData.homeTeam.initialLineup.flat().length;
        console.log(`   Starting XI: ${totalPlayers} players`);
        
        // Show formation structure
        console.log('   Formation structure:');
        lineupsData.homeTeam.initialLineup.forEach((line, index) => {
          console.log(`     Line ${index + 1}: ${line.length} players`);
        });
        
        // Show sample players
        console.log('   Sample players:');
        const samplePlayers = lineupsData.homeTeam.initialLineup.flat().slice(0, 3);
        samplePlayers.forEach(player => {
          console.log(`     ${player.number}. ${player.name} (${player.position})`);
        });
      }
      
      if (lineupsData.homeTeam.substitutes) {
        console.log(`   Substitutes: ${lineupsData.homeTeam.substitutes.length} players`);
        const sampleSubs = lineupsData.homeTeam.substitutes.slice(0, 2);
        sampleSubs.forEach(player => {
          console.log(`     ${player.number}. ${player.name} (${player.position})`);
        });
      }
    }
    
    if (lineupsData.awayTeam) {
      console.log('\n🏃 AWAY TEAM:');
      console.log(`   Name: ${lineupsData.awayTeam.name || 'Unknown'}`);
      console.log(`   Formation: ${lineupsData.awayTeam.formation || 'Unknown'}`);
      console.log(`   Coach: ${lineupsData.awayTeam.coach || 'Unknown'}`);
      
      if (lineupsData.awayTeam.initialLineup) {
        const totalPlayers = lineupsData.awayTeam.initialLineup.flat().length;
        console.log(`   Starting XI: ${totalPlayers} players`);
      }
      
      if (lineupsData.awayTeam.substitutes) {
        console.log(`   Substitutes: ${lineupsData.awayTeam.substitutes.length} players`);
      }
    }
    
    // Test with another match from our database
    console.log('\n📋 Testing with a match from our database...');
    const ourMatchId = '1028346631'; // Man United vs Aston Villa
    
    try {
      const ourLineupsData = await callHighlightlyApi(`lineups/${ourMatchId}`);
      console.log(`✅ Our match lineups also work!`);
      console.log(`   ${ourLineupsData.homeTeam?.name} vs ${ourLineupsData.awayTeam?.name}`);
      console.log(`   Formations: ${ourLineupsData.homeTeam?.formation} vs ${ourLineupsData.awayTeam?.formation}`);
      
    } catch (error) {
      console.log(`❌ Our match lineups failed: ${error.message}`);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Correct endpoint format: https://sports.highlightly.net/football/lineups/{matchId}');
    console.log('📋 Lineups data includes:');
    console.log('   • Team formations (e.g., "4-2-3-1")');
    console.log('   • Starting XI organized by formation lines');
    console.log('   • Substitute players');
    console.log('   • Player details (name, number, position)');
    console.log('   • Coach information');
    console.log('🔄 Ready to integrate into sync process!');
    
  } catch (error) {
    console.log(`❌ Error testing lineups endpoint: ${error.message}`);
  }
}

testCorrectLineupsEndpoint(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callHighlightlyApi(endpoint) {
  const url = `https://sports.highlightly.net/football/${endpoint}`;
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

async function testCorrectLineupsEndpoint() {
  console.log('🔍 TESTING CORRECT LINEUPS ENDPOINT FORMAT');
  console.log('='.repeat(50));
  
  // Test with the match ID you provided
  const testMatchId = '1028343227';
  
  try {
    console.log(`\n📋 Testing lineups for match ID: ${testMatchId}`);
    const lineupsData = await callHighlightlyApi(`lineups/${testMatchId}`);
    
    console.log('✅ SUCCESS! Lineups endpoint works!');
    console.log('Response type:', typeof lineupsData);
    console.log('Response properties:', Object.keys(lineupsData));
    
    // Analyze the structure
    if (lineupsData.homeTeam) {
      console.log('\n🏠 HOME TEAM:');
      console.log(`   Name: ${lineupsData.homeTeam.name || 'Unknown'}`);
      console.log(`   Formation: ${lineupsData.homeTeam.formation || 'Unknown'}`);
      console.log(`   Coach: ${lineupsData.homeTeam.coach || 'Unknown'}`);
      
      if (lineupsData.homeTeam.initialLineup) {
        const totalPlayers = lineupsData.homeTeam.initialLineup.flat().length;
        console.log(`   Starting XI: ${totalPlayers} players`);
        
        // Show formation structure
        console.log('   Formation structure:');
        lineupsData.homeTeam.initialLineup.forEach((line, index) => {
          console.log(`     Line ${index + 1}: ${line.length} players`);
        });
        
        // Show sample players
        console.log('   Sample players:');
        const samplePlayers = lineupsData.homeTeam.initialLineup.flat().slice(0, 3);
        samplePlayers.forEach(player => {
          console.log(`     ${player.number}. ${player.name} (${player.position})`);
        });
      }
      
      if (lineupsData.homeTeam.substitutes) {
        console.log(`   Substitutes: ${lineupsData.homeTeam.substitutes.length} players`);
        const sampleSubs = lineupsData.homeTeam.substitutes.slice(0, 2);
        sampleSubs.forEach(player => {
          console.log(`     ${player.number}. ${player.name} (${player.position})`);
        });
      }
    }
    
    if (lineupsData.awayTeam) {
      console.log('\n🏃 AWAY TEAM:');
      console.log(`   Name: ${lineupsData.awayTeam.name || 'Unknown'}`);
      console.log(`   Formation: ${lineupsData.awayTeam.formation || 'Unknown'}`);
      console.log(`   Coach: ${lineupsData.awayTeam.coach || 'Unknown'}`);
      
      if (lineupsData.awayTeam.initialLineup) {
        const totalPlayers = lineupsData.awayTeam.initialLineup.flat().length;
        console.log(`   Starting XI: ${totalPlayers} players`);
      }
      
      if (lineupsData.awayTeam.substitutes) {
        console.log(`   Substitutes: ${lineupsData.awayTeam.substitutes.length} players`);
      }
    }
    
    // Test with another match from our database
    console.log('\n📋 Testing with a match from our database...');
    const ourMatchId = '1028346631'; // Man United vs Aston Villa
    
    try {
      const ourLineupsData = await callHighlightlyApi(`lineups/${ourMatchId}`);
      console.log(`✅ Our match lineups also work!`);
      console.log(`   ${ourLineupsData.homeTeam?.name} vs ${ourLineupsData.awayTeam?.name}`);
      console.log(`   Formations: ${ourLineupsData.homeTeam?.formation} vs ${ourLineupsData.awayTeam?.formation}`);
      
    } catch (error) {
      console.log(`❌ Our match lineups failed: ${error.message}`);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Correct endpoint format: https://sports.highlightly.net/football/lineups/{matchId}');
    console.log('📋 Lineups data includes:');
    console.log('   • Team formations (e.g., "4-2-3-1")');
    console.log('   • Starting XI organized by formation lines');
    console.log('   • Substitute players');
    console.log('   • Player details (name, number, position)');
    console.log('   • Coach information');
    console.log('🔄 Ready to integrate into sync process!');
    
  } catch (error) {
    console.log(`❌ Error testing lineups endpoint: ${error.message}`);
  }
}

testCorrectLineupsEndpoint(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callHighlightlyApi(endpoint) {
  const url = `https://sports.highlightly.net/football/${endpoint}`;
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

async function testCorrectLineupsEndpoint() {
  console.log('🔍 TESTING CORRECT LINEUPS ENDPOINT FORMAT');
  console.log('='.repeat(50));
  
  // Test with the match ID you provided
  const testMatchId = '1028343227';
  
  try {
    console.log(`\n📋 Testing lineups for match ID: ${testMatchId}`);
    const lineupsData = await callHighlightlyApi(`lineups/${testMatchId}`);
    
    console.log('✅ SUCCESS! Lineups endpoint works!');
    console.log('Response type:', typeof lineupsData);
    console.log('Response properties:', Object.keys(lineupsData));
    
    // Analyze the structure
    if (lineupsData.homeTeam) {
      console.log('\n🏠 HOME TEAM:');
      console.log(`   Name: ${lineupsData.homeTeam.name || 'Unknown'}`);
      console.log(`   Formation: ${lineupsData.homeTeam.formation || 'Unknown'}`);
      console.log(`   Coach: ${lineupsData.homeTeam.coach || 'Unknown'}`);
      
      if (lineupsData.homeTeam.initialLineup) {
        const totalPlayers = lineupsData.homeTeam.initialLineup.flat().length;
        console.log(`   Starting XI: ${totalPlayers} players`);
        
        // Show formation structure
        console.log('   Formation structure:');
        lineupsData.homeTeam.initialLineup.forEach((line, index) => {
          console.log(`     Line ${index + 1}: ${line.length} players`);
        });
        
        // Show sample players
        console.log('   Sample players:');
        const samplePlayers = lineupsData.homeTeam.initialLineup.flat().slice(0, 3);
        samplePlayers.forEach(player => {
          console.log(`     ${player.number}. ${player.name} (${player.position})`);
        });
      }
      
      if (lineupsData.homeTeam.substitutes) {
        console.log(`   Substitutes: ${lineupsData.homeTeam.substitutes.length} players`);
        const sampleSubs = lineupsData.homeTeam.substitutes.slice(0, 2);
        sampleSubs.forEach(player => {
          console.log(`     ${player.number}. ${player.name} (${player.position})`);
        });
      }
    }
    
    if (lineupsData.awayTeam) {
      console.log('\n🏃 AWAY TEAM:');
      console.log(`   Name: ${lineupsData.awayTeam.name || 'Unknown'}`);
      console.log(`   Formation: ${lineupsData.awayTeam.formation || 'Unknown'}`);
      console.log(`   Coach: ${lineupsData.awayTeam.coach || 'Unknown'}`);
      
      if (lineupsData.awayTeam.initialLineup) {
        const totalPlayers = lineupsData.awayTeam.initialLineup.flat().length;
        console.log(`   Starting XI: ${totalPlayers} players`);
      }
      
      if (lineupsData.awayTeam.substitutes) {
        console.log(`   Substitutes: ${lineupsData.awayTeam.substitutes.length} players`);
      }
    }
    
    // Test with another match from our database
    console.log('\n📋 Testing with a match from our database...');
    const ourMatchId = '1028346631'; // Man United vs Aston Villa
    
    try {
      const ourLineupsData = await callHighlightlyApi(`lineups/${ourMatchId}`);
      console.log(`✅ Our match lineups also work!`);
      console.log(`   ${ourLineupsData.homeTeam?.name} vs ${ourLineupsData.awayTeam?.name}`);
      console.log(`   Formations: ${ourLineupsData.homeTeam?.formation} vs ${ourLineupsData.awayTeam?.formation}`);
      
    } catch (error) {
      console.log(`❌ Our match lineups failed: ${error.message}`);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Correct endpoint format: https://sports.highlightly.net/football/lineups/{matchId}');
    console.log('📋 Lineups data includes:');
    console.log('   • Team formations (e.g., "4-2-3-1")');
    console.log('   • Starting XI organized by formation lines');
    console.log('   • Substitute players');
    console.log('   • Player details (name, number, position)');
    console.log('   • Coach information');
    console.log('🔄 Ready to integrate into sync process!');
    
  } catch (error) {
    console.log(`❌ Error testing lineups endpoint: ${error.message}`);
  }
}

testCorrectLineupsEndpoint(); 