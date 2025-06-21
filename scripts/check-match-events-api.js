import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const BASE_URL = 'https://soccer.highlightly.net';

async function callHighlightlyApi(endpoint) {
  const url = `${BASE_URL}/${endpoint}`;
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

async function checkMatchEventsData() {
  console.log('🔍 CHECKING MATCH EVENTS/GOALSCORER DATA FROM API');
  console.log('='.repeat(60));
  
  try {
    // First, get some recent matches from Premier League
    console.log('\n📋 Step 1: Getting recent matches...');
    const matchesData = await callHighlightlyApi('matches?leagueId=33973&season=2024&limit=5');
    
    if (!matchesData?.data || matchesData.data.length === 0) {
      console.log('❌ No matches found');
      return;
    }
    
    console.log(`✅ Found ${matchesData.data.length} matches`);
    
    // Check each match for detailed data
    for (let i = 0; i < Math.min(3, matchesData.data.length); i++) {
      const match = matchesData.data[i];
      console.log(`\n🔍 Analyzing Match ${i + 1}: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
      console.log(`   Date: ${match.date}`);
      console.log(`   Status: ${match.state?.description}`);
      console.log(`   Score: ${match.state?.score?.current}`);
      
      // Check what's in the basic match data
      console.log('\n📊 Basic Match Data Structure:');
      console.log('   Available properties:', Object.keys(match));
      
      // Check for events in basic match data
      if (match.events) {
        console.log(`   🎯 EVENTS FOUND: ${match.events.length} events`);
        match.events.slice(0, 3).forEach((event, idx) => {
          console.log(`      Event ${idx + 1}: ${event.type} - ${event.player} (${event.time})`);
        });
      } else {
        console.log('   ❌ No events in basic match data');
      }
      
      // Check for lineups
      if (match.lineups) {
        console.log(`   👥 LINEUPS FOUND: ${Object.keys(match.lineups).length} teams`);
      } else {
        console.log('   ❌ No lineups in basic match data');
      }
      
      // Check for statistics
      if (match.statistics) {
        console.log(`   📈 STATISTICS FOUND: ${Object.keys(match.statistics).length} stat categories`);
      } else {
        console.log('   ❌ No statistics in basic match data');
      }
      
      // Try to get detailed match data by ID
      console.log(`\n🔍 Trying to get detailed data for match ID: ${match.id}`);
      try {
        const detailedMatch = await callHighlightlyApi(`matches/${match.id}`);
        
        console.log('📊 Detailed Match Data Structure:');
        console.log('   Available properties:', Object.keys(detailedMatch));
        
        // Check for events in detailed data
        if (detailedMatch.events) {
          console.log(`   🎯 DETAILED EVENTS: ${detailedMatch.events.length} events`);
          detailedMatch.events.forEach((event, idx) => {
            console.log(`      ${event.time}' ${event.type} - ${event.player}`);
            if (event.assist) console.log(`         Assist: ${event.assist}`);
          });
        } else {
          console.log('   ❌ No events in detailed match data');
        }
        
        // Check for lineups in detailed data
        if (detailedMatch.lineups) {
          console.log(`   👥 DETAILED LINEUPS: Available for ${Object.keys(detailedMatch.lineups).length} teams`);
          Object.keys(detailedMatch.lineups).forEach(teamId => {
            const lineup = detailedMatch.lineups[teamId];
            if (lineup.starting11) {
              console.log(`      Team ${teamId}: ${lineup.starting11.length} starters`);
            }
          });
        } else {
          console.log('   ❌ No lineups in detailed match data');
        }
        
        // Check for statistics in detailed data
        if (detailedMatch.statistics) {
          console.log(`   📈 DETAILED STATISTICS: ${Object.keys(detailedMatch.statistics).length} categories`);
          Object.keys(detailedMatch.statistics).slice(0, 3).forEach(statKey => {
            console.log(`      ${statKey}: Available`);
          });
        } else {
          console.log('   ❌ No statistics in detailed match data');
        }
        
      } catch (detailError) {
        console.log(`   ❌ Failed to get detailed match data: ${detailError.message}`);
      }
      
      console.log('\n' + '-'.repeat(50));
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ API endpoints checked');
    console.log('📊 Match data structure analyzed');
    console.log('🔍 Event/goalscorer data availability assessed');
    
  } catch (error) {
    console.log('❌ Error checking match events data:', error.message);
  }
}

checkMatchEventsData(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const BASE_URL = 'https://soccer.highlightly.net';

async function callHighlightlyApi(endpoint) {
  const url = `${BASE_URL}/${endpoint}`;
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

async function checkMatchEventsData() {
  console.log('🔍 CHECKING MATCH EVENTS/GOALSCORER DATA FROM API');
  console.log('='.repeat(60));
  
  try {
    // First, get some recent matches from Premier League
    console.log('\n📋 Step 1: Getting recent matches...');
    const matchesData = await callHighlightlyApi('matches?leagueId=33973&season=2024&limit=5');
    
    if (!matchesData?.data || matchesData.data.length === 0) {
      console.log('❌ No matches found');
      return;
    }
    
    console.log(`✅ Found ${matchesData.data.length} matches`);
    
    // Check each match for detailed data
    for (let i = 0; i < Math.min(3, matchesData.data.length); i++) {
      const match = matchesData.data[i];
      console.log(`\n🔍 Analyzing Match ${i + 1}: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
      console.log(`   Date: ${match.date}`);
      console.log(`   Status: ${match.state?.description}`);
      console.log(`   Score: ${match.state?.score?.current}`);
      
      // Check what's in the basic match data
      console.log('\n📊 Basic Match Data Structure:');
      console.log('   Available properties:', Object.keys(match));
      
      // Check for events in basic match data
      if (match.events) {
        console.log(`   🎯 EVENTS FOUND: ${match.events.length} events`);
        match.events.slice(0, 3).forEach((event, idx) => {
          console.log(`      Event ${idx + 1}: ${event.type} - ${event.player} (${event.time})`);
        });
      } else {
        console.log('   ❌ No events in basic match data');
      }
      
      // Check for lineups
      if (match.lineups) {
        console.log(`   👥 LINEUPS FOUND: ${Object.keys(match.lineups).length} teams`);
      } else {
        console.log('   ❌ No lineups in basic match data');
      }
      
      // Check for statistics
      if (match.statistics) {
        console.log(`   📈 STATISTICS FOUND: ${Object.keys(match.statistics).length} stat categories`);
      } else {
        console.log('   ❌ No statistics in basic match data');
      }
      
      // Try to get detailed match data by ID
      console.log(`\n🔍 Trying to get detailed data for match ID: ${match.id}`);
      try {
        const detailedMatch = await callHighlightlyApi(`matches/${match.id}`);
        
        console.log('📊 Detailed Match Data Structure:');
        console.log('   Available properties:', Object.keys(detailedMatch));
        
        // Check for events in detailed data
        if (detailedMatch.events) {
          console.log(`   🎯 DETAILED EVENTS: ${detailedMatch.events.length} events`);
          detailedMatch.events.forEach((event, idx) => {
            console.log(`      ${event.time}' ${event.type} - ${event.player}`);
            if (event.assist) console.log(`         Assist: ${event.assist}`);
          });
        } else {
          console.log('   ❌ No events in detailed match data');
        }
        
        // Check for lineups in detailed data
        if (detailedMatch.lineups) {
          console.log(`   👥 DETAILED LINEUPS: Available for ${Object.keys(detailedMatch.lineups).length} teams`);
          Object.keys(detailedMatch.lineups).forEach(teamId => {
            const lineup = detailedMatch.lineups[teamId];
            if (lineup.starting11) {
              console.log(`      Team ${teamId}: ${lineup.starting11.length} starters`);
            }
          });
        } else {
          console.log('   ❌ No lineups in detailed match data');
        }
        
        // Check for statistics in detailed data
        if (detailedMatch.statistics) {
          console.log(`   📈 DETAILED STATISTICS: ${Object.keys(detailedMatch.statistics).length} categories`);
          Object.keys(detailedMatch.statistics).slice(0, 3).forEach(statKey => {
            console.log(`      ${statKey}: Available`);
          });
        } else {
          console.log('   ❌ No statistics in detailed match data');
        }
        
      } catch (detailError) {
        console.log(`   ❌ Failed to get detailed match data: ${detailError.message}`);
      }
      
      console.log('\n' + '-'.repeat(50));
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ API endpoints checked');
    console.log('📊 Match data structure analyzed');
    console.log('🔍 Event/goalscorer data availability assessed');
    
  } catch (error) {
    console.log('❌ Error checking match events data:', error.message);
  }
}

checkMatchEventsData(); 
import fetch from 'node-fetch';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const BASE_URL = 'https://soccer.highlightly.net';

async function callHighlightlyApi(endpoint) {
  const url = `${BASE_URL}/${endpoint}`;
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

async function checkMatchEventsData() {
  console.log('🔍 CHECKING MATCH EVENTS/GOALSCORER DATA FROM API');
  console.log('='.repeat(60));
  
  try {
    // First, get some recent matches from Premier League
    console.log('\n📋 Step 1: Getting recent matches...');
    const matchesData = await callHighlightlyApi('matches?leagueId=33973&season=2024&limit=5');
    
    if (!matchesData?.data || matchesData.data.length === 0) {
      console.log('❌ No matches found');
      return;
    }
    
    console.log(`✅ Found ${matchesData.data.length} matches`);
    
    // Check each match for detailed data
    for (let i = 0; i < Math.min(3, matchesData.data.length); i++) {
      const match = matchesData.data[i];
      console.log(`\n🔍 Analyzing Match ${i + 1}: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
      console.log(`   Date: ${match.date}`);
      console.log(`   Status: ${match.state?.description}`);
      console.log(`   Score: ${match.state?.score?.current}`);
      
      // Check what's in the basic match data
      console.log('\n📊 Basic Match Data Structure:');
      console.log('   Available properties:', Object.keys(match));
      
      // Check for events in basic match data
      if (match.events) {
        console.log(`   🎯 EVENTS FOUND: ${match.events.length} events`);
        match.events.slice(0, 3).forEach((event, idx) => {
          console.log(`      Event ${idx + 1}: ${event.type} - ${event.player} (${event.time})`);
        });
      } else {
        console.log('   ❌ No events in basic match data');
      }
      
      // Check for lineups
      if (match.lineups) {
        console.log(`   👥 LINEUPS FOUND: ${Object.keys(match.lineups).length} teams`);
      } else {
        console.log('   ❌ No lineups in basic match data');
      }
      
      // Check for statistics
      if (match.statistics) {
        console.log(`   📈 STATISTICS FOUND: ${Object.keys(match.statistics).length} stat categories`);
      } else {
        console.log('   ❌ No statistics in basic match data');
      }
      
      // Try to get detailed match data by ID
      console.log(`\n🔍 Trying to get detailed data for match ID: ${match.id}`);
      try {
        const detailedMatch = await callHighlightlyApi(`matches/${match.id}`);
        
        console.log('📊 Detailed Match Data Structure:');
        console.log('   Available properties:', Object.keys(detailedMatch));
        
        // Check for events in detailed data
        if (detailedMatch.events) {
          console.log(`   🎯 DETAILED EVENTS: ${detailedMatch.events.length} events`);
          detailedMatch.events.forEach((event, idx) => {
            console.log(`      ${event.time}' ${event.type} - ${event.player}`);
            if (event.assist) console.log(`         Assist: ${event.assist}`);
          });
        } else {
          console.log('   ❌ No events in detailed match data');
        }
        
        // Check for lineups in detailed data
        if (detailedMatch.lineups) {
          console.log(`   👥 DETAILED LINEUPS: Available for ${Object.keys(detailedMatch.lineups).length} teams`);
          Object.keys(detailedMatch.lineups).forEach(teamId => {
            const lineup = detailedMatch.lineups[teamId];
            if (lineup.starting11) {
              console.log(`      Team ${teamId}: ${lineup.starting11.length} starters`);
            }
          });
        } else {
          console.log('   ❌ No lineups in detailed match data');
        }
        
        // Check for statistics in detailed data
        if (detailedMatch.statistics) {
          console.log(`   📈 DETAILED STATISTICS: ${Object.keys(detailedMatch.statistics).length} categories`);
          Object.keys(detailedMatch.statistics).slice(0, 3).forEach(statKey => {
            console.log(`      ${statKey}: Available`);
          });
        } else {
          console.log('   ❌ No statistics in detailed match data');
        }
        
      } catch (detailError) {
        console.log(`   ❌ Failed to get detailed match data: ${detailError.message}`);
      }
      
      console.log('\n' + '-'.repeat(50));
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));
    console.log('✅ API endpoints checked');
    console.log('📊 Match data structure analyzed');
    console.log('🔍 Event/goalscorer data availability assessed');
    
  } catch (error) {
    console.log('❌ Error checking match events data:', error.message);
  }
}

checkMatchEventsData(); 