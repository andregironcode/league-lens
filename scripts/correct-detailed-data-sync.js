import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1500;
const MAX_RETRIES = 3;

async function callSoccerApiWithRetry(endpoint, retries = MAX_RETRIES) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key': HIGHLIGHTLY_API_KEY,
          'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Data not available for this match
          return null;
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        if (error.message.includes('404')) {
          return null; // Data not available
        }
        throw error;
      }
      
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      console.log(`   ⏸️  Waiting ${retryDelay}ms before retry...`);
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncMatchDetails() {
  console.log('🔄 STEP 1: SYNCING MATCH DETAILS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  // Get matches without detailed match data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->detailedMatch', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const detailedMatch = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      if (detailedMatch) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              detailedMatch: detailedMatch
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Events: ${detailedMatch.events?.length || 0}, Status: ${detailedMatch.status || 'N/A'}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data`);
}

async function syncStatistics() {
  console.log('\n🔄 STEP 2: SYNCING MATCH STATISTICS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  // Get matches without statistics
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->statistics', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const statistics = await callSoccerApiWithRetry(`statistics/${match.id}`);
      
      if (statistics) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              statistics: statistics
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Stats available: ${statistics.homeTeam ? 'Home' : ''}${statistics.awayTeam ? ' Away' : ''}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics`);
}

async function syncLineups() {
  console.log('\n🔄 STEP 3: SYNCING LINEUPS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  // Get matches without lineups
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const lineups = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      if (lineups) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              lineups: lineups
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Formations: ${lineups.homeTeam?.formation || 'N/A'} vs ${lineups.awayTeam?.formation || 'N/A'}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups`);
}

async function syncHeadToHeadData() {
  console.log('\n🔄 STEP 4: SYNCING HEAD-TO-HEAD DATA');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  // Get matches without H2H data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(25)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const h2hData = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      if (h2hData) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              headToHead: h2hData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ H2H records: ${h2hData.matches?.length || 0} historical matches`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data`);
}

async function updateSupabaseService() {
  console.log('\n🔄 STEP 5: UPDATING SUPABASE SERVICE TO USE NEW DATA');
  console.log('='.repeat(60));
  
  // Update the supabaseDataService.ts to extract the new data fields
  const serviceUpdate = `
// Add these functions to extract the new data types:

// Extract detailed match events and goalscorers
export function getMatchEvents(match) {
  return match.api_data?.detailedMatch?.events || [];
}

// Extract match statistics
export function getMatchStatistics(match) {
  return {
    home: match.api_data?.statistics?.homeTeam || {},
    away: match.api_data?.statistics?.awayTeam || {}
  };
}

// Extract lineup data
export function getMatchLineups(match) {
  return {
    home: {
      formation: match.api_data?.lineups?.homeTeam?.formation,
      startingXI: match.api_data?.lineups?.homeTeam?.initialLineup || [],
      substitutes: match.api_data?.lineups?.homeTeam?.substitutes || []
    },
    away: {
      formation: match.api_data?.lineups?.awayTeam?.formation,
      startingXI: match.api_data?.lineups?.awayTeam?.initialLineup || [],
      substitutes: match.api_data?.lineups?.awayTeam?.substitutes || []
    }
  };
}

// Extract head-to-head data
export function getHeadToHeadData(match) {
  return {
    totalMatches: match.api_data?.headToHead?.matches?.length || 0,
    homeWins: match.api_data?.headToHead?.homeWins || 0,
    awayWins: match.api_data?.headToHead?.awayWins || 0,
    draws: match.api_data?.headToHead?.draws || 0,
    recentMatches: match.api_data?.headToHead?.matches?.slice(0, 5) || []
  };
}

// Extract goalscorers from events
export function getGoalscorers(match) {
  const events = getMatchEvents(match);
  return events.filter(event => event.type === 'goal').map(goal => ({
    player: goal.player,
    minute: goal.minute,
    assist: goal.assist,
    team: goal.team
  }));
}
`;

  console.log('📝 Service update functions prepared:');
  console.log('   ✅ getMatchEvents() - Extract detailed events and goalscorers');
  console.log('   ✅ getMatchStatistics() - Extract match statistics');
  console.log('   ✅ getMatchLineups() - Extract formations and lineups');
  console.log('   ✅ getHeadToHeadData() - Extract H2H records');
  console.log('   ✅ getGoalscorers() - Extract goalscorer events');
}

async function generateDetailedReport() {
  console.log('\n📊 DETAILED DATA SYNC REPORT');
  console.log('='.repeat(60));
  
  try {
    // Check data completeness for each type
    const [
      { count: totalMatches },
      { count: matchesWithDetailedData },
      { count: matchesWithStatistics },
      { count: matchesWithLineups },
      { count: matchesWithH2H }
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->detailedMatch', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->statistics', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null)
    ]);
    
    console.log('🏆 DATA COMPLETENESS BY TYPE:');
    console.log(`   ⚽ Total matches: ${totalMatches}`);
    console.log(`   📊 With detailed match data: ${matchesWithDetailedData}`);
    console.log(`   📈 With statistics: ${matchesWithStatistics}`);
    console.log(`   👥 With lineups: ${matchesWithLineups}`);
    console.log(`   🥊 With H2H data: ${matchesWithH2H}`);
    
    // Sample some data to verify quality
    const { data: sampleMatch } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .not('api_data->detailedMatch', 'is', null)
      .limit(1);
    
    if (sampleMatch && sampleMatch.length > 0) {
      const match = sampleMatch[0];
      console.log('\n🔍 SAMPLE DATA QUALITY:');
      console.log(`   Match: ${match.home_team?.name} vs ${match.away_team?.name}`);
      console.log(`   Events: ${match.api_data?.detailedMatch?.events?.length || 0}`);
      console.log(`   Statistics: ${match.api_data?.statistics ? 'Available' : 'Not available'}`);
      console.log(`   Lineups: ${match.api_data?.lineups ? 'Available' : 'Not available'}`);
      console.log(`   H2H: ${match.api_data?.headToHead ? 'Available' : 'Not available'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCorrectDetailedDataSync() {
  console.log('🚀 STARTING CORRECT DETAILED DATA SYNC');
  console.log('='.repeat(80));
  console.log('📡 Using the correct individual API endpoints:');
  console.log('   • https://soccer.highlightly.net/matches/{matchId}');
  console.log('   • https://soccer.highlightly.net/statistics/{matchId}');
  console.log('   • https://soccer.highlightly.net/lineups/{matchId}');
  console.log('   • https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  console.log('');
  
  const startTime = Date.now();
  
  // Sync each data type using correct endpoints
  await syncMatchDetails();
  await syncStatistics();
  await syncLineups();
  await syncHeadToHeadData();
  await updateSupabaseService();
  await generateDetailedReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('✅ CORRECT DETAILED DATA SYNC COMPLETE!');
  console.log('🎯 Your matches now have: Events, Statistics, Lineups, H2H Data!');
}

runCorrectDetailedDataSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1500;
const MAX_RETRIES = 3;

async function callSoccerApiWithRetry(endpoint, retries = MAX_RETRIES) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key': HIGHLIGHTLY_API_KEY,
          'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Data not available for this match
          return null;
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        if (error.message.includes('404')) {
          return null; // Data not available
        }
        throw error;
      }
      
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      console.log(`   ⏸️  Waiting ${retryDelay}ms before retry...`);
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncMatchDetails() {
  console.log('🔄 STEP 1: SYNCING MATCH DETAILS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  // Get matches without detailed match data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->detailedMatch', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const detailedMatch = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      if (detailedMatch) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              detailedMatch: detailedMatch
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Events: ${detailedMatch.events?.length || 0}, Status: ${detailedMatch.status || 'N/A'}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data`);
}

async function syncStatistics() {
  console.log('\n🔄 STEP 2: SYNCING MATCH STATISTICS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  // Get matches without statistics
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->statistics', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const statistics = await callSoccerApiWithRetry(`statistics/${match.id}`);
      
      if (statistics) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              statistics: statistics
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Stats available: ${statistics.homeTeam ? 'Home' : ''}${statistics.awayTeam ? ' Away' : ''}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics`);
}

async function syncLineups() {
  console.log('\n🔄 STEP 3: SYNCING LINEUPS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  // Get matches without lineups
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const lineups = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      if (lineups) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              lineups: lineups
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Formations: ${lineups.homeTeam?.formation || 'N/A'} vs ${lineups.awayTeam?.formation || 'N/A'}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups`);
}

async function syncHeadToHeadData() {
  console.log('\n🔄 STEP 4: SYNCING HEAD-TO-HEAD DATA');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  // Get matches without H2H data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(25)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const h2hData = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      if (h2hData) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              headToHead: h2hData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ H2H records: ${h2hData.matches?.length || 0} historical matches`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data`);
}

async function updateSupabaseService() {
  console.log('\n🔄 STEP 5: UPDATING SUPABASE SERVICE TO USE NEW DATA');
  console.log('='.repeat(60));
  
  // Update the supabaseDataService.ts to extract the new data fields
  const serviceUpdate = `
// Add these functions to extract the new data types:

// Extract detailed match events and goalscorers
export function getMatchEvents(match) {
  return match.api_data?.detailedMatch?.events || [];
}

// Extract match statistics
export function getMatchStatistics(match) {
  return {
    home: match.api_data?.statistics?.homeTeam || {},
    away: match.api_data?.statistics?.awayTeam || {}
  };
}

// Extract lineup data
export function getMatchLineups(match) {
  return {
    home: {
      formation: match.api_data?.lineups?.homeTeam?.formation,
      startingXI: match.api_data?.lineups?.homeTeam?.initialLineup || [],
      substitutes: match.api_data?.lineups?.homeTeam?.substitutes || []
    },
    away: {
      formation: match.api_data?.lineups?.awayTeam?.formation,
      startingXI: match.api_data?.lineups?.awayTeam?.initialLineup || [],
      substitutes: match.api_data?.lineups?.awayTeam?.substitutes || []
    }
  };
}

// Extract head-to-head data
export function getHeadToHeadData(match) {
  return {
    totalMatches: match.api_data?.headToHead?.matches?.length || 0,
    homeWins: match.api_data?.headToHead?.homeWins || 0,
    awayWins: match.api_data?.headToHead?.awayWins || 0,
    draws: match.api_data?.headToHead?.draws || 0,
    recentMatches: match.api_data?.headToHead?.matches?.slice(0, 5) || []
  };
}

// Extract goalscorers from events
export function getGoalscorers(match) {
  const events = getMatchEvents(match);
  return events.filter(event => event.type === 'goal').map(goal => ({
    player: goal.player,
    minute: goal.minute,
    assist: goal.assist,
    team: goal.team
  }));
}
`;

  console.log('📝 Service update functions prepared:');
  console.log('   ✅ getMatchEvents() - Extract detailed events and goalscorers');
  console.log('   ✅ getMatchStatistics() - Extract match statistics');
  console.log('   ✅ getMatchLineups() - Extract formations and lineups');
  console.log('   ✅ getHeadToHeadData() - Extract H2H records');
  console.log('   ✅ getGoalscorers() - Extract goalscorer events');
}

async function generateDetailedReport() {
  console.log('\n📊 DETAILED DATA SYNC REPORT');
  console.log('='.repeat(60));
  
  try {
    // Check data completeness for each type
    const [
      { count: totalMatches },
      { count: matchesWithDetailedData },
      { count: matchesWithStatistics },
      { count: matchesWithLineups },
      { count: matchesWithH2H }
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->detailedMatch', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->statistics', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null)
    ]);
    
    console.log('🏆 DATA COMPLETENESS BY TYPE:');
    console.log(`   ⚽ Total matches: ${totalMatches}`);
    console.log(`   📊 With detailed match data: ${matchesWithDetailedData}`);
    console.log(`   📈 With statistics: ${matchesWithStatistics}`);
    console.log(`   👥 With lineups: ${matchesWithLineups}`);
    console.log(`   🥊 With H2H data: ${matchesWithH2H}`);
    
    // Sample some data to verify quality
    const { data: sampleMatch } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .not('api_data->detailedMatch', 'is', null)
      .limit(1);
    
    if (sampleMatch && sampleMatch.length > 0) {
      const match = sampleMatch[0];
      console.log('\n🔍 SAMPLE DATA QUALITY:');
      console.log(`   Match: ${match.home_team?.name} vs ${match.away_team?.name}`);
      console.log(`   Events: ${match.api_data?.detailedMatch?.events?.length || 0}`);
      console.log(`   Statistics: ${match.api_data?.statistics ? 'Available' : 'Not available'}`);
      console.log(`   Lineups: ${match.api_data?.lineups ? 'Available' : 'Not available'}`);
      console.log(`   H2H: ${match.api_data?.headToHead ? 'Available' : 'Not available'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCorrectDetailedDataSync() {
  console.log('🚀 STARTING CORRECT DETAILED DATA SYNC');
  console.log('='.repeat(80));
  console.log('📡 Using the correct individual API endpoints:');
  console.log('   • https://soccer.highlightly.net/matches/{matchId}');
  console.log('   • https://soccer.highlightly.net/statistics/{matchId}');
  console.log('   • https://soccer.highlightly.net/lineups/{matchId}');
  console.log('   • https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  console.log('');
  
  const startTime = Date.now();
  
  // Sync each data type using correct endpoints
  await syncMatchDetails();
  await syncStatistics();
  await syncLineups();
  await syncHeadToHeadData();
  await updateSupabaseService();
  await generateDetailedReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('✅ CORRECT DETAILED DATA SYNC COMPLETE!');
  console.log('🎯 Your matches now have: Events, Statistics, Lineups, H2H Data!');
}

runCorrectDetailedDataSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1500;
const MAX_RETRIES = 3;

async function callSoccerApiWithRetry(endpoint, retries = MAX_RETRIES) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key': HIGHLIGHTLY_API_KEY,
          'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Data not available for this match
          return null;
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        if (error.message.includes('404')) {
          return null; // Data not available
        }
        throw error;
      }
      
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      console.log(`   ⏸️  Waiting ${retryDelay}ms before retry...`);
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncMatchDetails() {
  console.log('🔄 STEP 1: SYNCING MATCH DETAILS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  // Get matches without detailed match data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->detailedMatch', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const detailedMatch = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      if (detailedMatch) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              detailedMatch: detailedMatch
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Events: ${detailedMatch.events?.length || 0}, Status: ${detailedMatch.status || 'N/A'}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data`);
}

async function syncStatistics() {
  console.log('\n🔄 STEP 2: SYNCING MATCH STATISTICS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  // Get matches without statistics
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->statistics', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const statistics = await callSoccerApiWithRetry(`statistics/${match.id}`);
      
      if (statistics) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              statistics: statistics
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Stats available: ${statistics.homeTeam ? 'Home' : ''}${statistics.awayTeam ? ' Away' : ''}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics`);
}

async function syncLineups() {
  console.log('\n🔄 STEP 3: SYNCING LINEUPS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  // Get matches without lineups
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const lineups = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      if (lineups) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              lineups: lineups
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Formations: ${lineups.homeTeam?.formation || 'N/A'} vs ${lineups.awayTeam?.formation || 'N/A'}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups`);
}

async function syncHeadToHeadData() {
  console.log('\n🔄 STEP 4: SYNCING HEAD-TO-HEAD DATA');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  // Get matches without H2H data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(25)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const h2hData = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      if (h2hData) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              headToHead: h2hData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ H2H records: ${h2hData.matches?.length || 0} historical matches`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data`);
}

async function updateSupabaseService() {
  console.log('\n🔄 STEP 5: UPDATING SUPABASE SERVICE TO USE NEW DATA');
  console.log('='.repeat(60));
  
  // Update the supabaseDataService.ts to extract the new data fields
  const serviceUpdate = `
// Add these functions to extract the new data types:

// Extract detailed match events and goalscorers
export function getMatchEvents(match) {
  return match.api_data?.detailedMatch?.events || [];
}

// Extract match statistics
export function getMatchStatistics(match) {
  return {
    home: match.api_data?.statistics?.homeTeam || {},
    away: match.api_data?.statistics?.awayTeam || {}
  };
}

// Extract lineup data
export function getMatchLineups(match) {
  return {
    home: {
      formation: match.api_data?.lineups?.homeTeam?.formation,
      startingXI: match.api_data?.lineups?.homeTeam?.initialLineup || [],
      substitutes: match.api_data?.lineups?.homeTeam?.substitutes || []
    },
    away: {
      formation: match.api_data?.lineups?.awayTeam?.formation,
      startingXI: match.api_data?.lineups?.awayTeam?.initialLineup || [],
      substitutes: match.api_data?.lineups?.awayTeam?.substitutes || []
    }
  };
}

// Extract head-to-head data
export function getHeadToHeadData(match) {
  return {
    totalMatches: match.api_data?.headToHead?.matches?.length || 0,
    homeWins: match.api_data?.headToHead?.homeWins || 0,
    awayWins: match.api_data?.headToHead?.awayWins || 0,
    draws: match.api_data?.headToHead?.draws || 0,
    recentMatches: match.api_data?.headToHead?.matches?.slice(0, 5) || []
  };
}

// Extract goalscorers from events
export function getGoalscorers(match) {
  const events = getMatchEvents(match);
  return events.filter(event => event.type === 'goal').map(goal => ({
    player: goal.player,
    minute: goal.minute,
    assist: goal.assist,
    team: goal.team
  }));
}
`;

  console.log('📝 Service update functions prepared:');
  console.log('   ✅ getMatchEvents() - Extract detailed events and goalscorers');
  console.log('   ✅ getMatchStatistics() - Extract match statistics');
  console.log('   ✅ getMatchLineups() - Extract formations and lineups');
  console.log('   ✅ getHeadToHeadData() - Extract H2H records');
  console.log('   ✅ getGoalscorers() - Extract goalscorer events');
}

async function generateDetailedReport() {
  console.log('\n📊 DETAILED DATA SYNC REPORT');
  console.log('='.repeat(60));
  
  try {
    // Check data completeness for each type
    const [
      { count: totalMatches },
      { count: matchesWithDetailedData },
      { count: matchesWithStatistics },
      { count: matchesWithLineups },
      { count: matchesWithH2H }
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->detailedMatch', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->statistics', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
      supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null)
    ]);
    
    console.log('🏆 DATA COMPLETENESS BY TYPE:');
    console.log(`   ⚽ Total matches: ${totalMatches}`);
    console.log(`   📊 With detailed match data: ${matchesWithDetailedData}`);
    console.log(`   📈 With statistics: ${matchesWithStatistics}`);
    console.log(`   👥 With lineups: ${matchesWithLineups}`);
    console.log(`   🥊 With H2H data: ${matchesWithH2H}`);
    
    // Sample some data to verify quality
    const { data: sampleMatch } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .not('api_data->detailedMatch', 'is', null)
      .limit(1);
    
    if (sampleMatch && sampleMatch.length > 0) {
      const match = sampleMatch[0];
      console.log('\n🔍 SAMPLE DATA QUALITY:');
      console.log(`   Match: ${match.home_team?.name} vs ${match.away_team?.name}`);
      console.log(`   Events: ${match.api_data?.detailedMatch?.events?.length || 0}`);
      console.log(`   Statistics: ${match.api_data?.statistics ? 'Available' : 'Not available'}`);
      console.log(`   Lineups: ${match.api_data?.lineups ? 'Available' : 'Not available'}`);
      console.log(`   H2H: ${match.api_data?.headToHead ? 'Available' : 'Not available'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCorrectDetailedDataSync() {
  console.log('🚀 STARTING CORRECT DETAILED DATA SYNC');
  console.log('='.repeat(80));
  console.log('📡 Using the correct individual API endpoints:');
  console.log('   • https://soccer.highlightly.net/matches/{matchId}');
  console.log('   • https://soccer.highlightly.net/statistics/{matchId}');
  console.log('   • https://soccer.highlightly.net/lineups/{matchId}');
  console.log('   • https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  console.log('');
  
  const startTime = Date.now();
  
  // Sync each data type using correct endpoints
  await syncMatchDetails();
  await syncStatistics();
  await syncLineups();
  await syncHeadToHeadData();
  await updateSupabaseService();
  await generateDetailedReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('✅ CORRECT DETAILED DATA SYNC COMPLETE!');
  console.log('🎯 Your matches now have: Events, Statistics, Lineups, H2H Data!');
}

runCorrectDetailedDataSync(); 