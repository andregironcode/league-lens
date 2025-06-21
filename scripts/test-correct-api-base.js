import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callSoccerApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
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

async function testCorrectApiBase() {
  console.log('🔍 TESTING CORRECT SOCCER API BASE URL');
  console.log('='.repeat(50));
  
  const matchId = '1028339823';
  
  try {
    // Test 1: Match details
    console.log('\n📋 Test 1: Match details');
    const matchData = await callSoccerApi(`matches/${matchId}`);
    console.log('✅ Match details work!');
    console.log(`   Match: ${matchData.homeTeam?.name} vs ${matchData.awayTeam?.name}`);
    console.log(`   Events: ${matchData.events?.length || 0}`);
    console.log(`   Statistics: ${matchData.statistics?.length || 0}`);
    
    // Test 2: Lineups
    console.log('\n📋 Test 2: Lineups');
    const lineupsData = await callSoccerApi(`lineups/${matchId}`);
    console.log('✅ Lineups work!');
    console.log(`   Home formation: ${lineupsData.homeTeam?.formation}`);
    console.log(`   Away formation: ${lineupsData.awayTeam?.formation}`);
    
    // Test 3: Head-to-head (need team IDs from match)
    if (matchData.homeTeam?.id && matchData.awayTeam?.id) {
      console.log('\n📋 Test 3: Head-to-head');
      const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${matchData.homeTeam.id}&teamIdTwo=${matchData.awayTeam.id}`);
      console.log('✅ Head-to-head works!');
      console.log(`   Historical matches: ${h2hData.matches?.length || 0}`);
      
      if (h2hData.statistics?.wins) {
        console.log(`   ${h2hData.teams?.team1?.name}: ${h2hData.statistics.wins.team1} wins`);
        console.log(`   ${h2hData.teams?.team2?.name}: ${h2hData.statistics.wins.team2} wins`);
        console.log(`   Draws: ${h2hData.statistics.wins.draws}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Correct API base: https://soccer.highlightly.net/');
    console.log('📋 All endpoints work with soccer API:');
    console.log('   • matches/{id}');
    console.log('   • lineups/{id}');
    console.log('   • head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
    console.log('🔄 Ready to update all scripts!');
    
  } catch (error) {
    console.log(`❌ Error testing soccer API: ${error.message}`);
  }
}

testCorrectApiBase(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callSoccerApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
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

async function testCorrectApiBase() {
  console.log('🔍 TESTING CORRECT SOCCER API BASE URL');
  console.log('='.repeat(50));
  
  const matchId = '1028339823';
  
  try {
    // Test 1: Match details
    console.log('\n📋 Test 1: Match details');
    const matchData = await callSoccerApi(`matches/${matchId}`);
    console.log('✅ Match details work!');
    console.log(`   Match: ${matchData.homeTeam?.name} vs ${matchData.awayTeam?.name}`);
    console.log(`   Events: ${matchData.events?.length || 0}`);
    console.log(`   Statistics: ${matchData.statistics?.length || 0}`);
    
    // Test 2: Lineups
    console.log('\n📋 Test 2: Lineups');
    const lineupsData = await callSoccerApi(`lineups/${matchId}`);
    console.log('✅ Lineups work!');
    console.log(`   Home formation: ${lineupsData.homeTeam?.formation}`);
    console.log(`   Away formation: ${lineupsData.awayTeam?.formation}`);
    
    // Test 3: Head-to-head (need team IDs from match)
    if (matchData.homeTeam?.id && matchData.awayTeam?.id) {
      console.log('\n📋 Test 3: Head-to-head');
      const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${matchData.homeTeam.id}&teamIdTwo=${matchData.awayTeam.id}`);
      console.log('✅ Head-to-head works!');
      console.log(`   Historical matches: ${h2hData.matches?.length || 0}`);
      
      if (h2hData.statistics?.wins) {
        console.log(`   ${h2hData.teams?.team1?.name}: ${h2hData.statistics.wins.team1} wins`);
        console.log(`   ${h2hData.teams?.team2?.name}: ${h2hData.statistics.wins.team2} wins`);
        console.log(`   Draws: ${h2hData.statistics.wins.draws}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Correct API base: https://soccer.highlightly.net/');
    console.log('📋 All endpoints work with soccer API:');
    console.log('   • matches/{id}');
    console.log('   • lineups/{id}');
    console.log('   • head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
    console.log('🔄 Ready to update all scripts!');
    
  } catch (error) {
    console.log(`❌ Error testing soccer API: ${error.message}`);
  }
}

testCorrectApiBase(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callSoccerApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
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

async function testCorrectApiBase() {
  console.log('🔍 TESTING CORRECT SOCCER API BASE URL');
  console.log('='.repeat(50));
  
  const matchId = '1028339823';
  
  try {
    // Test 1: Match details
    console.log('\n📋 Test 1: Match details');
    const matchData = await callSoccerApi(`matches/${matchId}`);
    console.log('✅ Match details work!');
    console.log(`   Match: ${matchData.homeTeam?.name} vs ${matchData.awayTeam?.name}`);
    console.log(`   Events: ${matchData.events?.length || 0}`);
    console.log(`   Statistics: ${matchData.statistics?.length || 0}`);
    
    // Test 2: Lineups
    console.log('\n📋 Test 2: Lineups');
    const lineupsData = await callSoccerApi(`lineups/${matchId}`);
    console.log('✅ Lineups work!');
    console.log(`   Home formation: ${lineupsData.homeTeam?.formation}`);
    console.log(`   Away formation: ${lineupsData.awayTeam?.formation}`);
    
    // Test 3: Head-to-head (need team IDs from match)
    if (matchData.homeTeam?.id && matchData.awayTeam?.id) {
      console.log('\n📋 Test 3: Head-to-head');
      const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${matchData.homeTeam.id}&teamIdTwo=${matchData.awayTeam.id}`);
      console.log('✅ Head-to-head works!');
      console.log(`   Historical matches: ${h2hData.matches?.length || 0}`);
      
      if (h2hData.statistics?.wins) {
        console.log(`   ${h2hData.teams?.team1?.name}: ${h2hData.statistics.wins.team1} wins`);
        console.log(`   ${h2hData.teams?.team2?.name}: ${h2hData.statistics.wins.team2} wins`);
        console.log(`   Draws: ${h2hData.statistics.wins.draws}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Correct API base: https://soccer.highlightly.net/');
    console.log('📋 All endpoints work with soccer API:');
    console.log('   • matches/{id}');
    console.log('   • lineups/{id}');
    console.log('   • head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
    console.log('🔄 Ready to update all scripts!');
    
  } catch (error) {
    console.log(`❌ Error testing soccer API: ${error.message}`);
  }
}

testCorrectApiBase(); 