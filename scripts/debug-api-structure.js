import dotenv from 'dotenv';

dotenv.config();

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callApi(endpoint) {
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`🔍 Testing: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ${response.status}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Sample response:`);
    console.log(JSON.stringify(data, null, 2));
    return data;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function debugApiStructure() {
  console.log('🔍 Debugging API Response Structure');
  console.log('='.repeat(50));
  
  // Test league details
  console.log('\n📋 TESTING LEAGUE DETAILS:');
  await callApi('leagues/33973'); // Premier League
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test standings
  console.log('\n👥 TESTING STANDINGS:');
  await callApi('standings?leagueId=33973&season=2024');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test matches with recent dates (during football season)
  console.log('\n⚽ TESTING MATCHES (May 2024 - end of season):');
  await callApi('matches?leagueId=33973&date=2024-05-19&season=2024'); // Last day of Premier League
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test matches with different parameters
  console.log('\n⚽ TESTING MATCHES (Different approach):');
  await callApi('matches?leagueId=33973&season=2024&limit=5');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test teams endpoint
  console.log('\n👥 TESTING TEAMS ENDPOINT:');
  await callApi('teams?leagueId=33973&season=2024');
  
  console.log('\n🎯 Debug completed!');
}

debugApiStructure(); 

dotenv.config();

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callApi(endpoint) {
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`🔍 Testing: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ${response.status}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Sample response:`);
    console.log(JSON.stringify(data, null, 2));
    return data;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function debugApiStructure() {
  console.log('🔍 Debugging API Response Structure');
  console.log('='.repeat(50));
  
  // Test league details
  console.log('\n📋 TESTING LEAGUE DETAILS:');
  await callApi('leagues/33973'); // Premier League
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test standings
  console.log('\n👥 TESTING STANDINGS:');
  await callApi('standings?leagueId=33973&season=2024');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test matches with recent dates (during football season)
  console.log('\n⚽ TESTING MATCHES (May 2024 - end of season):');
  await callApi('matches?leagueId=33973&date=2024-05-19&season=2024'); // Last day of Premier League
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test matches with different parameters
  console.log('\n⚽ TESTING MATCHES (Different approach):');
  await callApi('matches?leagueId=33973&season=2024&limit=5');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test teams endpoint
  console.log('\n👥 TESTING TEAMS ENDPOINT:');
  await callApi('teams?leagueId=33973&season=2024');
  
  console.log('\n🎯 Debug completed!');
}

debugApiStructure(); 

dotenv.config();

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

async function callApi(endpoint) {
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`🔍 Testing: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ${response.status}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Sample response:`);
    console.log(JSON.stringify(data, null, 2));
    return data;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function debugApiStructure() {
  console.log('🔍 Debugging API Response Structure');
  console.log('='.repeat(50));
  
  // Test league details
  console.log('\n📋 TESTING LEAGUE DETAILS:');
  await callApi('leagues/33973'); // Premier League
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test standings
  console.log('\n👥 TESTING STANDINGS:');
  await callApi('standings?leagueId=33973&season=2024');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test matches with recent dates (during football season)
  console.log('\n⚽ TESTING MATCHES (May 2024 - end of season):');
  await callApi('matches?leagueId=33973&date=2024-05-19&season=2024'); // Last day of Premier League
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test matches with different parameters
  console.log('\n⚽ TESTING MATCHES (Different approach):');
  await callApi('matches?leagueId=33973&season=2024&limit=5');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test teams endpoint
  console.log('\n👥 TESTING TEAMS ENDPOINT:');
  await callApi('teams?leagueId=33973&season=2024');
  
  console.log('\n🎯 Debug completed!');
}

debugApiStructure(); 