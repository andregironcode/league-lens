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

async function testHeadToHeadEndpoint() {
  console.log('🔍 TESTING HEAD-TO-HEAD ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    // Test with the team IDs you provided
    const teamIdOne = '314803';
    const teamIdTwo = '5700782';
    
    console.log(`\n📋 Testing head-to-head: Team ${teamIdOne} vs Team ${teamIdTwo}`);
    const h2hData = await callHighlightlyApi(`head-2-head?teamIdOne=${teamIdOne}&teamIdTwo=${teamIdTwo}`);
    
    console.log('✅ SUCCESS! Head-to-head endpoint works!');
    console.log('Response type:', typeof h2hData);
    console.log('Response properties:', Object.keys(h2hData));
    
    // Analyze the structure
    if (h2hData.matches) {
      console.log(`\n📊 HEAD-TO-HEAD MATCHES: ${h2hData.matches.length} total`);
      
      // Show recent matches
      const recentMatches = h2hData.matches.slice(0, 5);
      console.log('\nRecent matches:');
      recentMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam?.name} ${match.score?.home || 0} - ${match.score?.away || 0} ${match.awayTeam?.name}`);
        console.log(`      Date: ${match.date}, Status: ${match.status}`);
      });
    }
    
    if (h2hData.statistics) {
      console.log(`\n📈 HEAD-TO-HEAD STATISTICS:`);
      console.log('Statistics properties:', Object.keys(h2hData.statistics));
      
      if (h2hData.statistics.wins) {
        console.log(`   Team 1 wins: ${h2hData.statistics.wins.team1 || 0}`);
        console.log(`   Team 2 wins: ${h2hData.statistics.wins.team2 || 0}`);
        console.log(`   Draws: ${h2hData.statistics.wins.draws || 0}`);
      }
      
      if (h2hData.statistics.goals) {
        console.log(`   Team 1 goals: ${h2hData.statistics.goals.team1 || 0}`);
        console.log(`   Team 2 goals: ${h2hData.statistics.goals.team2 || 0}`);
      }
    }
    
    if (h2hData.teams) {
      console.log(`\n👥 TEAMS:`);
      console.log(`   Team 1: ${h2hData.teams.team1?.name} (ID: ${h2hData.teams.team1?.id})`);
      console.log(`   Team 2: ${h2hData.teams.team2?.name} (ID: ${h2hData.teams.team2?.id})`);
    }
    
    // Test with teams from our database
    console.log('\n📋 Testing with teams from our database...');
    
    // Let's try with some Premier League teams (we'll need to get their IDs)
    // For now, let's test with some common team IDs
    const testCases = [
      { team1: '33', team2: '34' }, // Manchester United vs Liverpool (common IDs)
      { team1: '40', team2: '49' }  // Arsenal vs Chelsea (common IDs)
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`\n   Testing: Team ${testCase.team1} vs Team ${testCase.team2}`);
        const testH2H = await callHighlightlyApi(`head-2-head?teamIdOne=${testCase.team1}&teamIdTwo=${testCase.team2}`);
        
        if (testH2H.teams) {
          console.log(`   ✅ ${testH2H.teams.team1?.name} vs ${testH2H.teams.team2?.name}`);
          console.log(`   📊 ${testH2H.matches?.length || 0} historical matches`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Head-to-head endpoint format: https://sports.highlightly.net/football/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
    console.log('📋 Head-to-head data includes:');
    console.log('   • Historical match results');
    console.log('   • Win/draw/loss statistics');
    console.log('   • Goal statistics');
    console.log('   • Team information');
    console.log('🔄 Ready to integrate into match details!');
    
  } catch (error) {
    console.log(`❌ Error testing head-to-head endpoint: ${error.message}`);
  }
}

testHeadToHeadEndpoint(); 
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

async function testHeadToHeadEndpoint() {
  console.log('🔍 TESTING HEAD-TO-HEAD ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    // Test with the team IDs you provided
    const teamIdOne = '314803';
    const teamIdTwo = '5700782';
    
    console.log(`\n📋 Testing head-to-head: Team ${teamIdOne} vs Team ${teamIdTwo}`);
    const h2hData = await callHighlightlyApi(`head-2-head?teamIdOne=${teamIdOne}&teamIdTwo=${teamIdTwo}`);
    
    console.log('✅ SUCCESS! Head-to-head endpoint works!');
    console.log('Response type:', typeof h2hData);
    console.log('Response properties:', Object.keys(h2hData));
    
    // Analyze the structure
    if (h2hData.matches) {
      console.log(`\n📊 HEAD-TO-HEAD MATCHES: ${h2hData.matches.length} total`);
      
      // Show recent matches
      const recentMatches = h2hData.matches.slice(0, 5);
      console.log('\nRecent matches:');
      recentMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam?.name} ${match.score?.home || 0} - ${match.score?.away || 0} ${match.awayTeam?.name}`);
        console.log(`      Date: ${match.date}, Status: ${match.status}`);
      });
    }
    
    if (h2hData.statistics) {
      console.log(`\n📈 HEAD-TO-HEAD STATISTICS:`);
      console.log('Statistics properties:', Object.keys(h2hData.statistics));
      
      if (h2hData.statistics.wins) {
        console.log(`   Team 1 wins: ${h2hData.statistics.wins.team1 || 0}`);
        console.log(`   Team 2 wins: ${h2hData.statistics.wins.team2 || 0}`);
        console.log(`   Draws: ${h2hData.statistics.wins.draws || 0}`);
      }
      
      if (h2hData.statistics.goals) {
        console.log(`   Team 1 goals: ${h2hData.statistics.goals.team1 || 0}`);
        console.log(`   Team 2 goals: ${h2hData.statistics.goals.team2 || 0}`);
      }
    }
    
    if (h2hData.teams) {
      console.log(`\n👥 TEAMS:`);
      console.log(`   Team 1: ${h2hData.teams.team1?.name} (ID: ${h2hData.teams.team1?.id})`);
      console.log(`   Team 2: ${h2hData.teams.team2?.name} (ID: ${h2hData.teams.team2?.id})`);
    }
    
    // Test with teams from our database
    console.log('\n📋 Testing with teams from our database...');
    
    // Let's try with some Premier League teams (we'll need to get their IDs)
    // For now, let's test with some common team IDs
    const testCases = [
      { team1: '33', team2: '34' }, // Manchester United vs Liverpool (common IDs)
      { team1: '40', team2: '49' }  // Arsenal vs Chelsea (common IDs)
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`\n   Testing: Team ${testCase.team1} vs Team ${testCase.team2}`);
        const testH2H = await callHighlightlyApi(`head-2-head?teamIdOne=${testCase.team1}&teamIdTwo=${testCase.team2}`);
        
        if (testH2H.teams) {
          console.log(`   ✅ ${testH2H.teams.team1?.name} vs ${testH2H.teams.team2?.name}`);
          console.log(`   📊 ${testH2H.matches?.length || 0} historical matches`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Head-to-head endpoint format: https://sports.highlightly.net/football/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
    console.log('📋 Head-to-head data includes:');
    console.log('   • Historical match results');
    console.log('   • Win/draw/loss statistics');
    console.log('   • Goal statistics');
    console.log('   • Team information');
    console.log('🔄 Ready to integrate into match details!');
    
  } catch (error) {
    console.log(`❌ Error testing head-to-head endpoint: ${error.message}`);
  }
}

testHeadToHeadEndpoint(); 
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

async function testHeadToHeadEndpoint() {
  console.log('🔍 TESTING HEAD-TO-HEAD ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    // Test with the team IDs you provided
    const teamIdOne = '314803';
    const teamIdTwo = '5700782';
    
    console.log(`\n📋 Testing head-to-head: Team ${teamIdOne} vs Team ${teamIdTwo}`);
    const h2hData = await callHighlightlyApi(`head-2-head?teamIdOne=${teamIdOne}&teamIdTwo=${teamIdTwo}`);
    
    console.log('✅ SUCCESS! Head-to-head endpoint works!');
    console.log('Response type:', typeof h2hData);
    console.log('Response properties:', Object.keys(h2hData));
    
    // Analyze the structure
    if (h2hData.matches) {
      console.log(`\n📊 HEAD-TO-HEAD MATCHES: ${h2hData.matches.length} total`);
      
      // Show recent matches
      const recentMatches = h2hData.matches.slice(0, 5);
      console.log('\nRecent matches:');
      recentMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam?.name} ${match.score?.home || 0} - ${match.score?.away || 0} ${match.awayTeam?.name}`);
        console.log(`      Date: ${match.date}, Status: ${match.status}`);
      });
    }
    
    if (h2hData.statistics) {
      console.log(`\n📈 HEAD-TO-HEAD STATISTICS:`);
      console.log('Statistics properties:', Object.keys(h2hData.statistics));
      
      if (h2hData.statistics.wins) {
        console.log(`   Team 1 wins: ${h2hData.statistics.wins.team1 || 0}`);
        console.log(`   Team 2 wins: ${h2hData.statistics.wins.team2 || 0}`);
        console.log(`   Draws: ${h2hData.statistics.wins.draws || 0}`);
      }
      
      if (h2hData.statistics.goals) {
        console.log(`   Team 1 goals: ${h2hData.statistics.goals.team1 || 0}`);
        console.log(`   Team 2 goals: ${h2hData.statistics.goals.team2 || 0}`);
      }
    }
    
    if (h2hData.teams) {
      console.log(`\n👥 TEAMS:`);
      console.log(`   Team 1: ${h2hData.teams.team1?.name} (ID: ${h2hData.teams.team1?.id})`);
      console.log(`   Team 2: ${h2hData.teams.team2?.name} (ID: ${h2hData.teams.team2?.id})`);
    }
    
    // Test with teams from our database
    console.log('\n📋 Testing with teams from our database...');
    
    // Let's try with some Premier League teams (we'll need to get their IDs)
    // For now, let's test with some common team IDs
    const testCases = [
      { team1: '33', team2: '34' }, // Manchester United vs Liverpool (common IDs)
      { team1: '40', team2: '49' }  // Arsenal vs Chelsea (common IDs)
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`\n   Testing: Team ${testCase.team1} vs Team ${testCase.team2}`);
        const testH2H = await callHighlightlyApi(`head-2-head?teamIdOne=${testCase.team1}&teamIdTwo=${testCase.team2}`);
        
        if (testH2H.teams) {
          console.log(`   ✅ ${testH2H.teams.team1?.name} vs ${testH2H.teams.team2?.name}`);
          console.log(`   📊 ${testH2H.matches?.length || 0} historical matches`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ Head-to-head endpoint format: https://sports.highlightly.net/football/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
    console.log('📋 Head-to-head data includes:');
    console.log('   • Historical match results');
    console.log('   • Win/draw/loss statistics');
    console.log('   • Goal statistics');
    console.log('   • Team information');
    console.log('🔄 Ready to integrate into match details!');
    
  } catch (error) {
    console.log(`❌ Error testing head-to-head endpoint: ${error.message}`);
  }
}

testHeadToHeadEndpoint(); 