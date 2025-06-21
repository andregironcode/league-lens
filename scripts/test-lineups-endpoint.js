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

async function testLineupsEndpoint() {
  console.log('🔍 TESTING LINEUPS ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Get lineups without parameters
    console.log('\n📋 Test 1: Getting lineups (no parameters)...');
    try {
      const lineupsData = await callHighlightlyApi('lineups');
      console.log('✅ Lineups endpoint works!');
      console.log('Response type:', typeof lineupsData);
      console.log('Response length:', Array.isArray(lineupsData) ? lineupsData.length : 'Not an array');
      
      if (Array.isArray(lineupsData) && lineupsData.length > 0) {
        console.log('\n📋 First lineup structure:');
        const firstLineup = lineupsData[0];
        console.log('Properties:', Object.keys(firstLineup));
        
        if (firstLineup.matchId) {
          console.log(`Match ID: ${firstLineup.matchId}`);
        }
        if (firstLineup.homeTeam) {
          console.log('Home team formation:', firstLineup.homeTeam.formation);
          console.log('Home team starting XI:', firstLineup.homeTeam.initialLineup?.flat().length || 0);
        }
        if (firstLineup.awayTeam) {
          console.log('Away team formation:', firstLineup.awayTeam.formation);
          console.log('Away team starting XI:', firstLineup.awayTeam.initialLineup?.flat().length || 0);
        }
      }
      
    } catch (error) {
      console.log('❌ Lineups endpoint failed:', error.message);
    }
    
    // Test 2: Try with match ID parameter
    console.log('\n📋 Test 2: Getting lineups for specific match...');
    const matchId = '1028346631'; // Man United vs Aston Villa
    
    try {
      const matchLineupsData = await callHighlightlyApi(`lineups?matchId=${matchId}`);
      console.log('✅ Match-specific lineups work!');
      console.log('Response:', matchLineupsData);
      
      if (matchLineupsData && matchLineupsData.homeTeam) {
        console.log('\n🏠 Home Team Lineup:');
        console.log(`Formation: ${matchLineupsData.homeTeam.formation}`);
        console.log(`Starting XI: ${matchLineupsData.homeTeam.initialLineup?.flat().length || 0} players`);
        console.log(`Substitutes: ${matchLineupsData.homeTeam.substitutes?.length || 0} players`);
        
        // Show first few players
        if (matchLineupsData.homeTeam.initialLineup) {
          console.log('Sample players:');
          const firstPlayers = matchLineupsData.homeTeam.initialLineup.flat().slice(0, 3);
          firstPlayers.forEach(player => {
            console.log(`   ${player.number}. ${player.name} (${player.position})`);
          });
        }
      }
      
      if (matchLineupsData && matchLineupsData.awayTeam) {
        console.log('\n🏃 Away Team Lineup:');
        console.log(`Formation: ${matchLineupsData.awayTeam.formation}`);
        console.log(`Starting XI: ${matchLineupsData.awayTeam.initialLineup?.flat().length || 0} players`);
        console.log(`Substitutes: ${matchLineupsData.awayTeam.substitutes?.length || 0} players`);
      }
      
    } catch (matchError) {
      console.log('❌ Match-specific lineups failed:', matchError.message);
    }
    
    // Test 3: Try with league parameter
    console.log('\n📋 Test 3: Getting lineups for Premier League...');
    try {
      const leagueLineupsData = await callHighlightlyApi('lineups?leagueId=33973&limit=5');
      console.log('✅ League-specific lineups work!');
      console.log('Number of lineups:', Array.isArray(leagueLineupsData) ? leagueLineupsData.length : 1);
      
      if (Array.isArray(leagueLineupsData) && leagueLineupsData.length > 0) {
        console.log('\nSample lineups:');
        leagueLineupsData.slice(0, 2).forEach((lineup, index) => {
          console.log(`   ${index + 1}. Match ID: ${lineup.matchId || 'Unknown'}`);
          if (lineup.homeTeam && lineup.awayTeam) {
            console.log(`      ${lineup.homeTeam.name} vs ${lineup.awayTeam.name}`);
          }
        });
      }
      
    } catch (leagueError) {
      console.log('❌ League-specific lineups failed:', leagueError.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Lineups endpoint tested');
    console.log('📋 Now we know how to get lineup data!');
    
  } catch (error) {
    console.log('❌ Error testing lineups endpoint:', error.message);
  }
}

testLineupsEndpoint(); 
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

async function testLineupsEndpoint() {
  console.log('🔍 TESTING LINEUPS ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Get lineups without parameters
    console.log('\n📋 Test 1: Getting lineups (no parameters)...');
    try {
      const lineupsData = await callHighlightlyApi('lineups');
      console.log('✅ Lineups endpoint works!');
      console.log('Response type:', typeof lineupsData);
      console.log('Response length:', Array.isArray(lineupsData) ? lineupsData.length : 'Not an array');
      
      if (Array.isArray(lineupsData) && lineupsData.length > 0) {
        console.log('\n📋 First lineup structure:');
        const firstLineup = lineupsData[0];
        console.log('Properties:', Object.keys(firstLineup));
        
        if (firstLineup.matchId) {
          console.log(`Match ID: ${firstLineup.matchId}`);
        }
        if (firstLineup.homeTeam) {
          console.log('Home team formation:', firstLineup.homeTeam.formation);
          console.log('Home team starting XI:', firstLineup.homeTeam.initialLineup?.flat().length || 0);
        }
        if (firstLineup.awayTeam) {
          console.log('Away team formation:', firstLineup.awayTeam.formation);
          console.log('Away team starting XI:', firstLineup.awayTeam.initialLineup?.flat().length || 0);
        }
      }
      
    } catch (error) {
      console.log('❌ Lineups endpoint failed:', error.message);
    }
    
    // Test 2: Try with match ID parameter
    console.log('\n📋 Test 2: Getting lineups for specific match...');
    const matchId = '1028346631'; // Man United vs Aston Villa
    
    try {
      const matchLineupsData = await callHighlightlyApi(`lineups?matchId=${matchId}`);
      console.log('✅ Match-specific lineups work!');
      console.log('Response:', matchLineupsData);
      
      if (matchLineupsData && matchLineupsData.homeTeam) {
        console.log('\n🏠 Home Team Lineup:');
        console.log(`Formation: ${matchLineupsData.homeTeam.formation}`);
        console.log(`Starting XI: ${matchLineupsData.homeTeam.initialLineup?.flat().length || 0} players`);
        console.log(`Substitutes: ${matchLineupsData.homeTeam.substitutes?.length || 0} players`);
        
        // Show first few players
        if (matchLineupsData.homeTeam.initialLineup) {
          console.log('Sample players:');
          const firstPlayers = matchLineupsData.homeTeam.initialLineup.flat().slice(0, 3);
          firstPlayers.forEach(player => {
            console.log(`   ${player.number}. ${player.name} (${player.position})`);
          });
        }
      }
      
      if (matchLineupsData && matchLineupsData.awayTeam) {
        console.log('\n🏃 Away Team Lineup:');
        console.log(`Formation: ${matchLineupsData.awayTeam.formation}`);
        console.log(`Starting XI: ${matchLineupsData.awayTeam.initialLineup?.flat().length || 0} players`);
        console.log(`Substitutes: ${matchLineupsData.awayTeam.substitutes?.length || 0} players`);
      }
      
    } catch (matchError) {
      console.log('❌ Match-specific lineups failed:', matchError.message);
    }
    
    // Test 3: Try with league parameter
    console.log('\n📋 Test 3: Getting lineups for Premier League...');
    try {
      const leagueLineupsData = await callHighlightlyApi('lineups?leagueId=33973&limit=5');
      console.log('✅ League-specific lineups work!');
      console.log('Number of lineups:', Array.isArray(leagueLineupsData) ? leagueLineupsData.length : 1);
      
      if (Array.isArray(leagueLineupsData) && leagueLineupsData.length > 0) {
        console.log('\nSample lineups:');
        leagueLineupsData.slice(0, 2).forEach((lineup, index) => {
          console.log(`   ${index + 1}. Match ID: ${lineup.matchId || 'Unknown'}`);
          if (lineup.homeTeam && lineup.awayTeam) {
            console.log(`      ${lineup.homeTeam.name} vs ${lineup.awayTeam.name}`);
          }
        });
      }
      
    } catch (leagueError) {
      console.log('❌ League-specific lineups failed:', leagueError.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Lineups endpoint tested');
    console.log('📋 Now we know how to get lineup data!');
    
  } catch (error) {
    console.log('❌ Error testing lineups endpoint:', error.message);
  }
}

testLineupsEndpoint(); 
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

async function testLineupsEndpoint() {
  console.log('🔍 TESTING LINEUPS ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Get lineups without parameters
    console.log('\n📋 Test 1: Getting lineups (no parameters)...');
    try {
      const lineupsData = await callHighlightlyApi('lineups');
      console.log('✅ Lineups endpoint works!');
      console.log('Response type:', typeof lineupsData);
      console.log('Response length:', Array.isArray(lineupsData) ? lineupsData.length : 'Not an array');
      
      if (Array.isArray(lineupsData) && lineupsData.length > 0) {
        console.log('\n📋 First lineup structure:');
        const firstLineup = lineupsData[0];
        console.log('Properties:', Object.keys(firstLineup));
        
        if (firstLineup.matchId) {
          console.log(`Match ID: ${firstLineup.matchId}`);
        }
        if (firstLineup.homeTeam) {
          console.log('Home team formation:', firstLineup.homeTeam.formation);
          console.log('Home team starting XI:', firstLineup.homeTeam.initialLineup?.flat().length || 0);
        }
        if (firstLineup.awayTeam) {
          console.log('Away team formation:', firstLineup.awayTeam.formation);
          console.log('Away team starting XI:', firstLineup.awayTeam.initialLineup?.flat().length || 0);
        }
      }
      
    } catch (error) {
      console.log('❌ Lineups endpoint failed:', error.message);
    }
    
    // Test 2: Try with match ID parameter
    console.log('\n📋 Test 2: Getting lineups for specific match...');
    const matchId = '1028346631'; // Man United vs Aston Villa
    
    try {
      const matchLineupsData = await callHighlightlyApi(`lineups?matchId=${matchId}`);
      console.log('✅ Match-specific lineups work!');
      console.log('Response:', matchLineupsData);
      
      if (matchLineupsData && matchLineupsData.homeTeam) {
        console.log('\n🏠 Home Team Lineup:');
        console.log(`Formation: ${matchLineupsData.homeTeam.formation}`);
        console.log(`Starting XI: ${matchLineupsData.homeTeam.initialLineup?.flat().length || 0} players`);
        console.log(`Substitutes: ${matchLineupsData.homeTeam.substitutes?.length || 0} players`);
        
        // Show first few players
        if (matchLineupsData.homeTeam.initialLineup) {
          console.log('Sample players:');
          const firstPlayers = matchLineupsData.homeTeam.initialLineup.flat().slice(0, 3);
          firstPlayers.forEach(player => {
            console.log(`   ${player.number}. ${player.name} (${player.position})`);
          });
        }
      }
      
      if (matchLineupsData && matchLineupsData.awayTeam) {
        console.log('\n🏃 Away Team Lineup:');
        console.log(`Formation: ${matchLineupsData.awayTeam.formation}`);
        console.log(`Starting XI: ${matchLineupsData.awayTeam.initialLineup?.flat().length || 0} players`);
        console.log(`Substitutes: ${matchLineupsData.awayTeam.substitutes?.length || 0} players`);
      }
      
    } catch (matchError) {
      console.log('❌ Match-specific lineups failed:', matchError.message);
    }
    
    // Test 3: Try with league parameter
    console.log('\n📋 Test 3: Getting lineups for Premier League...');
    try {
      const leagueLineupsData = await callHighlightlyApi('lineups?leagueId=33973&limit=5');
      console.log('✅ League-specific lineups work!');
      console.log('Number of lineups:', Array.isArray(leagueLineupsData) ? leagueLineupsData.length : 1);
      
      if (Array.isArray(leagueLineupsData) && leagueLineupsData.length > 0) {
        console.log('\nSample lineups:');
        leagueLineupsData.slice(0, 2).forEach((lineup, index) => {
          console.log(`   ${index + 1}. Match ID: ${lineup.matchId || 'Unknown'}`);
          if (lineup.homeTeam && lineup.awayTeam) {
            console.log(`      ${lineup.homeTeam.name} vs ${lineup.awayTeam.name}`);
          }
        });
      }
      
    } catch (leagueError) {
      console.log('❌ League-specific lineups failed:', leagueError.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Lineups endpoint tested');
    console.log('📋 Now we know how to get lineup data!');
    
  } catch (error) {
    console.log('❌ Error testing lineups endpoint:', error.message);
  }
}

testLineupsEndpoint(); 