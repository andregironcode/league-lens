import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const highlightlyApiKey = process.env.VITE_HIGHLIGHTLY_API_KEY;

if (!supabaseUrl || !supabaseKey || !highlightlyApiKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function callHighlightlyApi(endpoint) {
  const baseUrl = 'https://football-highlights-api.p.rapidapi.com';
  const url = `${baseUrl}/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com',
      'x-rapidapi-key': highlightlyApiKey,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data || data;
}

async function getAllMatches() {
  console.log('📊 Fetching all matches from database...');
  
  let allMatches = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, status, league_id, has_lineups')
      .range(offset, offset + limit - 1)
      .order('match_date', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!matches || matches.length === 0) {
      break;
    }
    
    allMatches = allMatches.concat(matches);
    console.log(`   📥 Fetched ${allMatches.length} matches so far...`);
    
    if (matches.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  console.log(`✅ Total matches found: ${allMatches.length}`);
  return allMatches;
}

async function syncLineupForMatch(match) {
  try {
    console.log(`   📡 Fetching lineups for match ${match.id}...`);
    
    // Call the lineups API endpoint
    const lineupsData = await callHighlightlyApi(`lineups/${match.id}`);
    
    if (!lineupsData || (!lineupsData.homeTeam && !lineupsData.awayTeam)) {
      console.log(`   ⚠️  No lineup data available for match ${match.id}`);
      return { success: false, reason: 'no_data' };
    }
    
    let lineupsSaved = 0;
    
    // Save home team lineup
    if (lineupsData.homeTeam && lineupsData.homeTeam.initialLineup) {
      const homeLineupData = {
        match_id: match.id,
        team_id: match.home_team_id,
        formation: lineupsData.homeTeam.formation || null,
        players: JSON.stringify(lineupsData.homeTeam.initialLineup || []),
        substitutes: JSON.stringify(lineupsData.homeTeam.substitutes || []),
        coach: lineupsData.homeTeam.coach || null,
        api_data: JSON.stringify(lineupsData.homeTeam)
      };
      
      const { error: homeError } = await supabase
        .from('match_lineups')
        .upsert(homeLineupData, { 
          onConflict: 'match_id,team_id',
          ignoreDuplicates: false 
        });
      
      if (!homeError) {
        lineupsSaved++;
      } else {
        console.log(`   ❌ Error saving home lineup: ${homeError.message}`);
      }
    }
    
    // Save away team lineup
    if (lineupsData.awayTeam && lineupsData.awayTeam.initialLineup) {
      const awayLineupData = {
        match_id: match.id,
        team_id: match.away_team_id,
        formation: lineupsData.awayTeam.formation || null,
        players: JSON.stringify(lineupsData.awayTeam.initialLineup || []),
        substitutes: JSON.stringify(lineupsData.awayTeam.substitutes || []),
        coach: lineupsData.awayTeam.coach || null,
        api_data: JSON.stringify(lineupsData.awayTeam)
      };
      
      const { error: awayError } = await supabase
        .from('match_lineups')
        .upsert(awayLineupData, { 
          onConflict: 'match_id,team_id',
          ignoreDuplicates: false 
        });
      
      if (!awayError) {
        lineupsSaved++;
      } else {
        console.log(`   ❌ Error saving away lineup: ${awayError.message}`);
      }
    }
    
    // Update match has_lineups flag
    if (lineupsSaved > 0) {
      await supabase
        .from('matches')
        .update({ has_lineups: true })
        .eq('id', match.id);
    }
    
    console.log(`   ✅ Saved ${lineupsSaved} lineups for match ${match.id}`);
    return { success: true, lineupsSaved };
    
  } catch (error) {
    console.log(`   ❌ Error processing match ${match.id}: ${error.message}`);
    return { success: false, reason: 'error', error: error.message };
  }
}

async function comprehensiveLineupsSync() {
  console.log('🚀 STARTING COMPREHENSIVE LINEUPS SYNC');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Get all matches
    const allMatches = await getAllMatches();
    
    if (allMatches.length === 0) {
      console.log('❌ No matches found in database');
      return;
    }
    
    // Filter matches that don't already have lineups (optional optimization)
    const matchesWithoutLineups = allMatches.filter(match => !match.has_lineups);
    console.log(`📊 Matches without lineups: ${matchesWithoutLineups.length}/${allMatches.length}`);
    
    // Process all matches (or just those without lineups)
    const matchesToProcess = matchesWithoutLineups.length > 0 ? matchesWithoutLineups : allMatches;
    
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalLineupsSaved = 0;
    let totalErrors = 0;
    let totalNoData = 0;
    
    console.log(`\n🔄 Processing ${matchesToProcess.length} matches...`);
    console.log('='.repeat(50));
    
    for (let i = 0; i < matchesToProcess.length; i++) {
      const match = matchesToProcess[i];
      totalProcessed++;
      
      // Progress update every 50 matches
      if (totalProcessed % 50 === 0) {
        const progress = ((totalProcessed / matchesToProcess.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`\n📊 Progress: ${totalProcessed}/${matchesToProcess.length} (${progress}%) - ${elapsed}min elapsed`);
        console.log(`   ✅ Successful: ${totalSuccessful} | ❌ Errors: ${totalErrors} | ⚠️ No data: ${totalNoData}`);
        console.log(`   👥 Total lineups saved: ${totalLineupsSaved}`);
      }
      
      const result = await syncLineupForMatch(match);
      
      if (result.success) {
        totalSuccessful++;
        totalLineupsSaved += result.lineupsSaved || 0;
      } else if (result.reason === 'no_data') {
        totalNoData++;
      } else {
        totalErrors++;
      }
      
      // Rate limiting - 400ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    // Final results
    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n🎯 COMPREHENSIVE LINEUPS SYNC COMPLETED!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total duration: ${totalDuration} minutes`);
    console.log(`📊 Total matches processed: ${totalProcessed}`);
    console.log(`✅ Successful: ${totalSuccessful} (${((totalSuccessful/totalProcessed)*100).toFixed(1)}%)`);
    console.log(`❌ Errors: ${totalErrors} (${((totalErrors/totalProcessed)*100).toFixed(1)}%)`);
    console.log(`⚠️  No data: ${totalNoData} (${((totalNoData/totalProcessed)*100).toFixed(1)}%)`);
    console.log(`👥 Total lineups saved: ${totalLineupsSaved}`);
    
    // Calculate estimated remaining time if not all processed
    if (totalProcessed < allMatches.length) {
      const remaining = allMatches.length - totalProcessed;
      const avgTimePerMatch = (endTime - startTime) / totalProcessed;
      const estimatedRemainingTime = (remaining * avgTimePerMatch / 1000 / 60).toFixed(1);
      console.log(`⏳ Estimated time for remaining ${remaining} matches: ${estimatedRemainingTime} minutes`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
  }
}

// Run the sync
comprehensiveLineupsSync().catch(console.error); 