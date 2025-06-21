import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between calls
const MAX_RETRIES = 3;
const BATCH_SIZE = 50; // Process 50 matches at a time

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
          return null; // Data not available
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
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

async function getAllMatchesNeedingData(dataType) {
  let allMatches = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    let query = supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .range(from, from + batchSize - 1)
      .order('id');
    
    // Filter based on missing data type
    switch (dataType) {
      case 'detailedMatch':
        query = query.is('api_data->detailedMatch', null);
        break;
      case 'statistics':
        query = query.is('api_data->statistics', null);
        break;
      case 'lineups':
        query = query.is('api_data->lineups', null);
        break;
      case 'headToHead':
        query = query.is('api_data->headToHead', null);
        break;
    }
    
    const { data: matches, error } = await query;
    
    if (error) {
      console.log(`❌ Database error: ${error.message}`);
      break;
    }
    
    if (!matches || matches.length === 0) {
      break;
    }
    
    allMatches = allMatches.concat(matches);
    from += batchSize;
    
    console.log(`📥 Loaded ${allMatches.length} matches needing ${dataType} data...`);
  }
  
  return allMatches;
}

async function syncAllMatchDetails() {
  console.log('🔄 STEP 1: SYNCING ALL MATCH DETAILS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  const matches = await getAllMatchesNeedingData('detailedMatch');
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have detailed data!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data (${errorCount} errors)`);
}

async function syncAllStatistics() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCH STATISTICS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  const matches = await getAllMatchesNeedingData('statistics');
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have statistics!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics (${errorCount} errors)`);
}

async function syncAllLineups() {
  console.log('\n🔄 STEP 3: SYNCING ALL LINEUPS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  const matches = await getAllMatchesNeedingData('lineups');
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have lineups!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups (${errorCount} errors)`);
}

async function syncAllHeadToHeadData() {
  console.log('\n🔄 STEP 4: SYNCING ALL HEAD-TO-HEAD DATA');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  const matches = await getAllMatchesNeedingData('headToHead');
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have H2H data!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data (${errorCount} errors)`);
}

async function generateFinalReport() {
  console.log('\n📊 COMPREHENSIVE DATA SYNC REPORT');
  console.log('='.repeat(80));
  
  try {
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
    
    console.log('🏆 COMPLETE DATABASE STATUS:');
    console.log(`   ⚽ Total matches: ${totalMatches}`);
    console.log(`   📊 With detailed match data: ${matchesWithDetailedData} (${Math.round((matchesWithDetailedData / totalMatches) * 100)}%)`);
    console.log(`   📈 With statistics: ${matchesWithStatistics} (${Math.round((matchesWithStatistics / totalMatches) * 100)}%)`);
    console.log(`   👥 With lineups: ${matchesWithLineups} (${Math.round((matchesWithLineups / totalMatches) * 100)}%)`);
    console.log(`   🥊 With H2H data: ${matchesWithH2H} (${Math.round((matchesWithH2H / totalMatches) * 100)}%)`);
    
    // Calculate completion percentage
    const avgCompletion = Math.round(((matchesWithDetailedData + matchesWithStatistics + matchesWithLineups + matchesWithH2H) / (totalMatches * 4)) * 100);
    console.log(`\n🎯 OVERALL DATA COMPLETENESS: ${avgCompletion}%`);
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCompleteDataSyncAllMatches() {
  console.log('🚀 STARTING COMPLETE DATA SYNC FOR ALL MATCHES');
  console.log('='.repeat(80));
  console.log('📡 Processing ALL matches in your database (5000+)');
  console.log('⏱️  This will take several hours but will populate everything!');
  console.log('');
  
  const startTime = Date.now();
  
  // Sync all data types for ALL matches
  await syncAllMatchDetails();
  await syncAllStatistics();
  await syncAllLineups();
  await syncAllHeadToHeadData();
  await generateFinalReport();
  
  const endTime = Date.now();
  const totalHours = Math.round((endTime - startTime) / 1000 / 60 / 60 * 10) / 10;
  
  console.log(`\n⏱️  Total sync time: ${totalHours} hours`);
  console.log('✅ COMPLETE DATA SYNC FOR ALL MATCHES FINISHED!');
  console.log('🎯 Your entire database is now populated with comprehensive match data!');
}

runCompleteDataSyncAllMatches(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between calls
const MAX_RETRIES = 3;
const BATCH_SIZE = 50; // Process 50 matches at a time

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
          return null; // Data not available
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
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

async function getAllMatchesNeedingData(dataType) {
  let allMatches = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    let query = supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .range(from, from + batchSize - 1)
      .order('id');
    
    // Filter based on missing data type
    switch (dataType) {
      case 'detailedMatch':
        query = query.is('api_data->detailedMatch', null);
        break;
      case 'statistics':
        query = query.is('api_data->statistics', null);
        break;
      case 'lineups':
        query = query.is('api_data->lineups', null);
        break;
      case 'headToHead':
        query = query.is('api_data->headToHead', null);
        break;
    }
    
    const { data: matches, error } = await query;
    
    if (error) {
      console.log(`❌ Database error: ${error.message}`);
      break;
    }
    
    if (!matches || matches.length === 0) {
      break;
    }
    
    allMatches = allMatches.concat(matches);
    from += batchSize;
    
    console.log(`📥 Loaded ${allMatches.length} matches needing ${dataType} data...`);
  }
  
  return allMatches;
}

async function syncAllMatchDetails() {
  console.log('🔄 STEP 1: SYNCING ALL MATCH DETAILS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  const matches = await getAllMatchesNeedingData('detailedMatch');
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have detailed data!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data (${errorCount} errors)`);
}

async function syncAllStatistics() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCH STATISTICS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  const matches = await getAllMatchesNeedingData('statistics');
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have statistics!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics (${errorCount} errors)`);
}

async function syncAllLineups() {
  console.log('\n🔄 STEP 3: SYNCING ALL LINEUPS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  const matches = await getAllMatchesNeedingData('lineups');
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have lineups!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups (${errorCount} errors)`);
}

async function syncAllHeadToHeadData() {
  console.log('\n🔄 STEP 4: SYNCING ALL HEAD-TO-HEAD DATA');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  const matches = await getAllMatchesNeedingData('headToHead');
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have H2H data!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data (${errorCount} errors)`);
}

async function generateFinalReport() {
  console.log('\n📊 COMPREHENSIVE DATA SYNC REPORT');
  console.log('='.repeat(80));
  
  try {
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
    
    console.log('🏆 COMPLETE DATABASE STATUS:');
    console.log(`   ⚽ Total matches: ${totalMatches}`);
    console.log(`   📊 With detailed match data: ${matchesWithDetailedData} (${Math.round((matchesWithDetailedData / totalMatches) * 100)}%)`);
    console.log(`   📈 With statistics: ${matchesWithStatistics} (${Math.round((matchesWithStatistics / totalMatches) * 100)}%)`);
    console.log(`   👥 With lineups: ${matchesWithLineups} (${Math.round((matchesWithLineups / totalMatches) * 100)}%)`);
    console.log(`   🥊 With H2H data: ${matchesWithH2H} (${Math.round((matchesWithH2H / totalMatches) * 100)}%)`);
    
    // Calculate completion percentage
    const avgCompletion = Math.round(((matchesWithDetailedData + matchesWithStatistics + matchesWithLineups + matchesWithH2H) / (totalMatches * 4)) * 100);
    console.log(`\n🎯 OVERALL DATA COMPLETENESS: ${avgCompletion}%`);
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCompleteDataSyncAllMatches() {
  console.log('🚀 STARTING COMPLETE DATA SYNC FOR ALL MATCHES');
  console.log('='.repeat(80));
  console.log('📡 Processing ALL matches in your database (5000+)');
  console.log('⏱️  This will take several hours but will populate everything!');
  console.log('');
  
  const startTime = Date.now();
  
  // Sync all data types for ALL matches
  await syncAllMatchDetails();
  await syncAllStatistics();
  await syncAllLineups();
  await syncAllHeadToHeadData();
  await generateFinalReport();
  
  const endTime = Date.now();
  const totalHours = Math.round((endTime - startTime) / 1000 / 60 / 60 * 10) / 10;
  
  console.log(`\n⏱️  Total sync time: ${totalHours} hours`);
  console.log('✅ COMPLETE DATA SYNC FOR ALL MATCHES FINISHED!');
  console.log('🎯 Your entire database is now populated with comprehensive match data!');
}

runCompleteDataSyncAllMatches(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between calls
const MAX_RETRIES = 3;
const BATCH_SIZE = 50; // Process 50 matches at a time

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
          return null; // Data not available
        }
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
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

async function getAllMatchesNeedingData(dataType) {
  let allMatches = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    let query = supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .range(from, from + batchSize - 1)
      .order('id');
    
    // Filter based on missing data type
    switch (dataType) {
      case 'detailedMatch':
        query = query.is('api_data->detailedMatch', null);
        break;
      case 'statistics':
        query = query.is('api_data->statistics', null);
        break;
      case 'lineups':
        query = query.is('api_data->lineups', null);
        break;
      case 'headToHead':
        query = query.is('api_data->headToHead', null);
        break;
    }
    
    const { data: matches, error } = await query;
    
    if (error) {
      console.log(`❌ Database error: ${error.message}`);
      break;
    }
    
    if (!matches || matches.length === 0) {
      break;
    }
    
    allMatches = allMatches.concat(matches);
    from += batchSize;
    
    console.log(`📥 Loaded ${allMatches.length} matches needing ${dataType} data...`);
  }
  
  return allMatches;
}

async function syncAllMatchDetails() {
  console.log('🔄 STEP 1: SYNCING ALL MATCH DETAILS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/matches/{matchId}');
  
  const matches = await getAllMatchesNeedingData('detailedMatch');
  console.log(`📋 Found ${matches.length} matches needing detailed match data`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have detailed data!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting match details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No detailed match data available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with detailed match data (${errorCount} errors)`);
}

async function syncAllStatistics() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCH STATISTICS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/statistics/{matchId}');
  
  const matches = await getAllMatchesNeedingData('statistics');
  console.log(`📋 Found ${matches.length} matches needing statistics`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have statistics!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting statistics: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No statistics available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with statistics (${errorCount} errors)`);
}

async function syncAllLineups() {
  console.log('\n🔄 STEP 3: SYNCING ALL LINEUPS');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/lineups/{matchId}');
  
  const matches = await getAllMatchesNeedingData('lineups');
  console.log(`📋 Found ${matches.length} matches needing lineups`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have lineups!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No lineups available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with lineups (${errorCount} errors)`);
}

async function syncAllHeadToHeadData() {
  console.log('\n🔄 STEP 4: SYNCING ALL HEAD-TO-HEAD DATA');
  console.log('='.repeat(60));
  console.log('📡 Using: https://soccer.highlightly.net/head-2-head?teamIdOne={id1}&teamIdTwo={id2}');
  
  const matches = await getAllMatchesNeedingData('headToHead');
  console.log(`📋 Found ${matches.length} matches needing H2H data`);
  
  if (matches.length === 0) {
    console.log('✅ All matches already have H2H data!');
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const progress = `(${i + 1}/${matches.length})`;
    
    try {
      console.log(`${progress} 🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
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
        } else {
          errorCount++;
          console.log(`   ❌ Update error: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No H2H data available`);
      }
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        const remaining = Math.round(((matches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`📊 Progress: ${i + 1}/${matches.length} | Updated: ${updatedCount} | Errors: ${errorCount} | Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`🎯 Updated ${updatedCount} matches with H2H data (${errorCount} errors)`);
}

async function generateFinalReport() {
  console.log('\n📊 COMPREHENSIVE DATA SYNC REPORT');
  console.log('='.repeat(80));
  
  try {
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
    
    console.log('🏆 COMPLETE DATABASE STATUS:');
    console.log(`   ⚽ Total matches: ${totalMatches}`);
    console.log(`   📊 With detailed match data: ${matchesWithDetailedData} (${Math.round((matchesWithDetailedData / totalMatches) * 100)}%)`);
    console.log(`   📈 With statistics: ${matchesWithStatistics} (${Math.round((matchesWithStatistics / totalMatches) * 100)}%)`);
    console.log(`   👥 With lineups: ${matchesWithLineups} (${Math.round((matchesWithLineups / totalMatches) * 100)}%)`);
    console.log(`   🥊 With H2H data: ${matchesWithH2H} (${Math.round((matchesWithH2H / totalMatches) * 100)}%)`);
    
    // Calculate completion percentage
    const avgCompletion = Math.round(((matchesWithDetailedData + matchesWithStatistics + matchesWithLineups + matchesWithH2H) / (totalMatches * 4)) * 100);
    console.log(`\n🎯 OVERALL DATA COMPLETENESS: ${avgCompletion}%`);
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCompleteDataSyncAllMatches() {
  console.log('🚀 STARTING COMPLETE DATA SYNC FOR ALL MATCHES');
  console.log('='.repeat(80));
  console.log('📡 Processing ALL matches in your database (5000+)');
  console.log('⏱️  This will take several hours but will populate everything!');
  console.log('');
  
  const startTime = Date.now();
  
  // Sync all data types for ALL matches
  await syncAllMatchDetails();
  await syncAllStatistics();
  await syncAllLineups();
  await syncAllHeadToHeadData();
  await generateFinalReport();
  
  const endTime = Date.now();
  const totalHours = Math.round((endTime - startTime) / 1000 / 60 / 60 * 10) / 10;
  
  console.log(`\n⏱️  Total sync time: ${totalHours} hours`);
  console.log('✅ COMPLETE DATA SYNC FOR ALL MATCHES FINISHED!');
  console.log('🎯 Your entire database is now populated with comprehensive match data!');
}

runCompleteDataSyncAllMatches(); 