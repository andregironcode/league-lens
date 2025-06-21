import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200;
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
          return null;
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      // ✅ FIXED: Return the direct result, not result.data
      return result;
      
    } catch (error) {
      if (attempt === retries) {
        if (error.message.includes('404')) {
          return null;
        }
        throw error;
      }
      
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncBatchMatchDetails() {
  console.log('🔄 SYNCING MATCH DETAILS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  // Get matches without detailed match data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->detailedMatch', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const detailedMatchArray = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      if (detailedMatchArray && Array.isArray(detailedMatchArray) && detailedMatchArray.length > 0) {
        const detailedMatch = detailedMatchArray[0]; // Get first match object from array
        
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
          console.log(`   ✅ Events: ${detailedMatch.events?.length || 0}, Venue: ${detailedMatch.venue?.name || 'N/A'}, Status: ${detailedMatch.state?.status || 'N/A'}`);
          
          // Log a sample event if available
          if (detailedMatch.events && detailedMatch.events.length > 0) {
            const firstEvent = detailedMatch.events[0];
            console.log(`   🥅 Sample event: ${firstEvent.type || 'unknown'} - ${firstEvent.player?.name || 'N/A'} (${firstEvent.minute || 'N/A'}')`);
          }
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available or empty response`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data (${errorCount} errors)`);
}

async function syncBatchStatistics() {
  console.log('\n🔄 SYNCING MATCH STATISTICS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->statistics', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const statisticsArray = await callSoccerApiWithRetry(`statistics/${match.id}`);
      
      if (statisticsArray && Array.isArray(statisticsArray) && statisticsArray.length > 0) {
        // Parse the statistics array into home/away format
        const statistics = {
          homeTeam: statisticsArray[0] || {},
          awayTeam: statisticsArray[1] || {}
        };
        
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
          console.log(`   ✅ Stats: ${statistics.homeTeam.team?.name || 'Home'} vs ${statistics.awayTeam.team?.name || 'Away'}`);
          
          // Log some sample stats
          const homeStats = statistics.homeTeam.statistics || [];
          const awayStats = statistics.awayTeam.statistics || [];
          console.log(`   📊 Home stats: ${homeStats.length} metrics, Away stats: ${awayStats.length} metrics`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics (${errorCount} errors)`);
}

async function syncBatchLineups() {
  console.log('\n🔄 SYNCING LINEUPS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const lineups = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      if (lineups && lineups.homeTeam && lineups.awayTeam) {
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
          console.log(`   ✅ Formations: ${lineups.homeTeam.formation || 'N/A'} vs ${lineups.awayTeam.formation || 'N/A'}`);
          console.log(`   👥 Starting XI: ${lineups.homeTeam.initialLineup?.length || 0} + ${lineups.awayTeam.initialLineup?.length || 0} players`);
          console.log(`   🔄 Substitutes: ${lineups.homeTeam.substitutes?.length || 0} + ${lineups.awayTeam.substitutes?.length || 0} players`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups (${errorCount} errors)`);
}

async function syncBatchHeadToHead() {
  console.log('\n🔄 SYNCING HEAD-TO-HEAD (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const h2hArray = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      if (h2hArray && Array.isArray(h2hArray)) {
        const h2hData = {
          matches: h2hArray,
          totalMatches: h2hArray.length,
          // Calculate wins/draws from the array
          homeWins: h2hArray.filter(m => m.state?.winnerId === match.home_team_id).length,
          awayWins: h2hArray.filter(m => m.state?.winnerId === match.away_team_id).length,
          draws: h2hArray.filter(m => !m.state?.winnerId && m.state?.status === 'finished').length
        };
        
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
          console.log(`   ✅ H2H: ${h2hData.totalMatches} historical matches (H:${h2hData.homeWins} D:${h2hData.draws} A:${h2hData.awayWins})`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data (${errorCount} errors)`);
}

async function runFixedResponseParsingSync() {
  console.log('🚀 RUNNING CORRECTED API RESPONSE PARSING SYNC');
  console.log('='.repeat(80));
  console.log('🔧 FIXED: Now correctly parsing array responses instead of looking for result.data');
  console.log('📊 Processing batches to verify the fix works correctly');
  console.log('');
  
  const startTime = Date.now();
  
  await syncBatchMatchDetails();
  await syncBatchStatistics();
  await syncBatchLineups();
  await syncBatchHeadToHead();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Batch sync time: ${duration} minutes`);
  console.log('✅ CORRECTED PARSING SYNC COMPLETE!');
  console.log('🎯 Now showing real events, formations, and statistics!');
}

runFixedResponseParsingSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200;
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
          return null;
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      // ✅ FIXED: Return the direct result, not result.data
      return result;
      
    } catch (error) {
      if (attempt === retries) {
        if (error.message.includes('404')) {
          return null;
        }
        throw error;
      }
      
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncBatchMatchDetails() {
  console.log('🔄 SYNCING MATCH DETAILS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  // Get matches without detailed match data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->detailedMatch', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const detailedMatchArray = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      if (detailedMatchArray && Array.isArray(detailedMatchArray) && detailedMatchArray.length > 0) {
        const detailedMatch = detailedMatchArray[0]; // Get first match object from array
        
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
          console.log(`   ✅ Events: ${detailedMatch.events?.length || 0}, Venue: ${detailedMatch.venue?.name || 'N/A'}, Status: ${detailedMatch.state?.status || 'N/A'}`);
          
          // Log a sample event if available
          if (detailedMatch.events && detailedMatch.events.length > 0) {
            const firstEvent = detailedMatch.events[0];
            console.log(`   🥅 Sample event: ${firstEvent.type || 'unknown'} - ${firstEvent.player?.name || 'N/A'} (${firstEvent.minute || 'N/A'}')`);
          }
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available or empty response`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data (${errorCount} errors)`);
}

async function syncBatchStatistics() {
  console.log('\n🔄 SYNCING MATCH STATISTICS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->statistics', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const statisticsArray = await callSoccerApiWithRetry(`statistics/${match.id}`);
      
      if (statisticsArray && Array.isArray(statisticsArray) && statisticsArray.length > 0) {
        // Parse the statistics array into home/away format
        const statistics = {
          homeTeam: statisticsArray[0] || {},
          awayTeam: statisticsArray[1] || {}
        };
        
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
          console.log(`   ✅ Stats: ${statistics.homeTeam.team?.name || 'Home'} vs ${statistics.awayTeam.team?.name || 'Away'}`);
          
          // Log some sample stats
          const homeStats = statistics.homeTeam.statistics || [];
          const awayStats = statistics.awayTeam.statistics || [];
          console.log(`   📊 Home stats: ${homeStats.length} metrics, Away stats: ${awayStats.length} metrics`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics (${errorCount} errors)`);
}

async function syncBatchLineups() {
  console.log('\n🔄 SYNCING LINEUPS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const lineups = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      if (lineups && lineups.homeTeam && lineups.awayTeam) {
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
          console.log(`   ✅ Formations: ${lineups.homeTeam.formation || 'N/A'} vs ${lineups.awayTeam.formation || 'N/A'}`);
          console.log(`   👥 Starting XI: ${lineups.homeTeam.initialLineup?.length || 0} + ${lineups.awayTeam.initialLineup?.length || 0} players`);
          console.log(`   🔄 Substitutes: ${lineups.homeTeam.substitutes?.length || 0} + ${lineups.awayTeam.substitutes?.length || 0} players`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups (${errorCount} errors)`);
}

async function syncBatchHeadToHead() {
  console.log('\n🔄 SYNCING HEAD-TO-HEAD (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const h2hArray = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      if (h2hArray && Array.isArray(h2hArray)) {
        const h2hData = {
          matches: h2hArray,
          totalMatches: h2hArray.length,
          // Calculate wins/draws from the array
          homeWins: h2hArray.filter(m => m.state?.winnerId === match.home_team_id).length,
          awayWins: h2hArray.filter(m => m.state?.winnerId === match.away_team_id).length,
          draws: h2hArray.filter(m => !m.state?.winnerId && m.state?.status === 'finished').length
        };
        
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
          console.log(`   ✅ H2H: ${h2hData.totalMatches} historical matches (H:${h2hData.homeWins} D:${h2hData.draws} A:${h2hData.awayWins})`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data (${errorCount} errors)`);
}

async function runFixedResponseParsingSync() {
  console.log('🚀 RUNNING CORRECTED API RESPONSE PARSING SYNC');
  console.log('='.repeat(80));
  console.log('🔧 FIXED: Now correctly parsing array responses instead of looking for result.data');
  console.log('📊 Processing batches to verify the fix works correctly');
  console.log('');
  
  const startTime = Date.now();
  
  await syncBatchMatchDetails();
  await syncBatchStatistics();
  await syncBatchLineups();
  await syncBatchHeadToHead();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Batch sync time: ${duration} minutes`);
  console.log('✅ CORRECTED PARSING SYNC COMPLETE!');
  console.log('🎯 Now showing real events, formations, and statistics!');
}

runFixedResponseParsingSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200;
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
          return null;
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      // ✅ FIXED: Return the direct result, not result.data
      return result;
      
    } catch (error) {
      if (attempt === retries) {
        if (error.message.includes('404')) {
          return null;
        }
        throw error;
      }
      
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncBatchMatchDetails() {
  console.log('🔄 SYNCING MATCH DETAILS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  // Get matches without detailed match data
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->detailedMatch', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const detailedMatchArray = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      if (detailedMatchArray && Array.isArray(detailedMatchArray) && detailedMatchArray.length > 0) {
        const detailedMatch = detailedMatchArray[0]; // Get first match object from array
        
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
          console.log(`   ✅ Events: ${detailedMatch.events?.length || 0}, Venue: ${detailedMatch.venue?.name || 'N/A'}, Status: ${detailedMatch.state?.status || 'N/A'}`);
          
          // Log a sample event if available
          if (detailedMatch.events && detailedMatch.events.length > 0) {
            const firstEvent = detailedMatch.events[0];
            console.log(`   🥅 Sample event: ${firstEvent.type || 'unknown'} - ${firstEvent.player?.name || 'N/A'} (${firstEvent.minute || 'N/A'}')`);
          }
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available or empty response`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data (${errorCount} errors)`);
}

async function syncBatchStatistics() {
  console.log('\n🔄 SYNCING MATCH STATISTICS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->statistics', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const statisticsArray = await callSoccerApiWithRetry(`statistics/${match.id}`);
      
      if (statisticsArray && Array.isArray(statisticsArray) && statisticsArray.length > 0) {
        // Parse the statistics array into home/away format
        const statistics = {
          homeTeam: statisticsArray[0] || {},
          awayTeam: statisticsArray[1] || {}
        };
        
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
          console.log(`   ✅ Stats: ${statistics.homeTeam.team?.name || 'Home'} vs ${statistics.awayTeam.team?.name || 'Away'}`);
          
          // Log some sample stats
          const homeStats = statistics.homeTeam.statistics || [];
          const awayStats = statistics.awayTeam.statistics || [];
          console.log(`   📊 Home stats: ${homeStats.length} metrics, Away stats: ${awayStats.length} metrics`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics (${errorCount} errors)`);
}

async function syncBatchLineups() {
  console.log('\n🔄 SYNCING LINEUPS (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(50)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const lineups = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      if (lineups && lineups.homeTeam && lineups.awayTeam) {
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
          console.log(`   ✅ Formations: ${lineups.homeTeam.formation || 'N/A'} vs ${lineups.awayTeam.formation || 'N/A'}`);
          console.log(`   👥 Starting XI: ${lineups.homeTeam.initialLineup?.length || 0} + ${lineups.awayTeam.initialLineup?.length || 0} players`);
          console.log(`   🔄 Substitutes: ${lineups.homeTeam.substitutes?.length || 0} + ${lineups.awayTeam.substitutes?.length || 0} players`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups (${errorCount} errors)`);
}

async function syncBatchHeadToHead() {
  console.log('\n🔄 SYNCING HEAD-TO-HEAD (CORRECTED PARSING)');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(30)
    .order('id');
  
  if (error) {
    console.log('❌ Database error:', error.message);
    return;
  }
  
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const match of matches) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id})`);
      
      const h2hArray = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      if (h2hArray && Array.isArray(h2hArray)) {
        const h2hData = {
          matches: h2hArray,
          totalMatches: h2hArray.length,
          // Calculate wins/draws from the array
          homeWins: h2hArray.filter(m => m.state?.winnerId === match.home_team_id).length,
          awayWins: h2hArray.filter(m => m.state?.winnerId === match.away_team_id).length,
          draws: h2hArray.filter(m => !m.state?.winnerId && m.state?.status === 'finished').length
        };
        
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
          console.log(`   ✅ H2H: ${h2hData.totalMatches} historical matches (H:${h2hData.homeWins} D:${h2hData.draws} A:${h2hData.awayWins})`);
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data (${errorCount} errors)`);
}

async function runFixedResponseParsingSync() {
  console.log('🚀 RUNNING CORRECTED API RESPONSE PARSING SYNC');
  console.log('='.repeat(80));
  console.log('🔧 FIXED: Now correctly parsing array responses instead of looking for result.data');
  console.log('📊 Processing batches to verify the fix works correctly');
  console.log('');
  
  const startTime = Date.now();
  
  await syncBatchMatchDetails();
  await syncBatchStatistics();
  await syncBatchLineups();
  await syncBatchHeadToHead();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Batch sync time: ${duration} minutes`);
  console.log('✅ CORRECTED PARSING SYNC COMPLETE!');
  console.log('🎯 Now showing real events, formations, and statistics!');
}

runFixedResponseParsingSync(); 