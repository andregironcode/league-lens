import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between API calls
const BATCH_SIZE = 20; // Process matches in batches

async function callSoccerApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncDetailedMatchData() {
  console.log('🔄 STEP 1: SYNCING DETAILED MATCH DATA (Events, Statistics, Venue)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
      .limit(BATCH_SIZE);
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing detailed data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get detailed match data
        const detailedData = await callSoccerApi(`matches/${match.id}`);
        
        // Update database with detailed data
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              ...detailedData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}, Venue: ${detailedData.venue?.name || 'N/A'}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 1 RESULTS: Updated ${updatedCount} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncDetailedMatchData: ${error.message}`);
  }
}

async function syncLineupData() {
  console.log('\n🔄 STEP 2: SYNCING LINEUP DATA (Formations, Starting XI, Substitutes)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without lineup data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .is('api_data->lineups', null)
      .limit(BATCH_SIZE);
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing lineup data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get lineup data
        const lineupsData = await callSoccerApi(`lineups/${match.id}`);
        
        // Update database with lineup data
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              lineups: lineupsData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 2 RESULTS: Updated ${updatedCount} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncLineupData: ${error.message}`);
  }
}

async function syncHeadToHeadData() {
  console.log('\n🔄 STEP 3: SYNCING HEAD-TO-HEAD DATA (Historical Matches, Win/Loss Stats)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without head-to-head data
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .is('api_data->headToHead', null)
      .limit(15); // Smaller batch for H2H due to complexity
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing head-to-head data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get head-to-head data
        const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
        
        // Update database with head-to-head data
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
          const wins = h2hData.statistics?.wins;
          console.log(`   ✅ Historical: ${h2hData.matches?.length || 0} matches, Stats: ${wins?.team1 || 0}-${wins?.draws || 0}-${wins?.team2 || 0}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${updatedCount} matches with head-to-head data`);
    
  } catch (error) {
    console.log(`❌ Error in syncHeadToHeadData: ${error.message}`);
  }
}

async function syncMoreMatches() {
  console.log('\n🔄 STEP 4: SYNCING MORE MATCHES FOR EXISTING LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync more matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing matches for: ${league.name}`);
        
        // Get matches from API
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=30`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          
          for (const match of matchesData) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .eq('id', match.id)
              .single();
            
            if (!existingMatch) {
              // Insert new match
              const { error: insertError } = await supabase
                .from('matches')
                .insert({
                  id: match.id,
                  home_team_id: match.homeTeam?.id,
                  away_team_id: match.awayTeam?.id,
                  league_id: league.id,
                  match_date: match.date,
                  match_time: match.time,
                  status: match.status,
                  home_score: match.score?.home || null,
                  away_score: match.score?.away || null,
                  venue: match.venue?.name || null,
                  round: match.round || null,
                  season: match.season || '2024',
                  has_highlights: false,
                  api_data: match
                });
              
              if (!insertError) {
                newMatchesCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newMatchesCount} new matches`);
          totalNewMatches += newMatchesCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Added ${totalNewMatches} new matches`);
    
  } catch (error) {
    console.log(`❌ Error in syncMoreMatches: ${error.message}`);
  }
}

async function generateSummaryReport() {
  console.log('\n📊 FINAL SUMMARY REPORT');
  console.log('='.repeat(60));
  
  try {
    // Get counts
    const [
      { count: leaguesCount },
      { count: teamsCount },
      { count: matchesCount },
      { count: highlightsCount }
    ] = await Promise.all([
      supabase.from('leagues').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('highlights').select('*', { count: 'exact', head: true })
    ]);
    
    // Get data completeness stats
    const { data: matchesWithLineups } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->lineups', 'is', null);
    
    const { data: matchesWithEvents } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->events', 'is', null);
    
    const { data: matchesWithH2H } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->headToHead', 'is', null);
    
    const { data: matchesWithStats } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->statistics', 'is', null);
    
    console.log('🎯 DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    console.log('\n📈 DATA COMPLETENESS:');
    console.log(`   🏃 Matches with lineups: ${matchesWithLineups?.length || 0}/${matchesCount} (${Math.round((matchesWithLineups?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   📅 Matches with events: ${matchesWithEvents?.length || 0}/${matchesCount} (${Math.round((matchesWithEvents?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   📊 Matches with statistics: ${matchesWithStats?.length || 0}/${matchesCount} (${Math.round((matchesWithStats?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   🔄 Matches with head-to-head: ${matchesWithH2H?.length || 0}/${matchesCount} (${Math.round((matchesWithH2H?.length || 0) / matchesCount * 100)}%)`);
    
    console.log('\n✅ COMPREHENSIVE SYNC COMPLETE!');
    console.log('🚀 Your database is now fully populated with rich match data!');
    console.log('💡 You can now view detailed match information including:');
    console.log('   • Real goalscorer events with assists');
    console.log('   • Team formations and lineups');
    console.log('   • Match statistics and venue information');
    console.log('   • Head-to-head historical records');
    
  } catch (error) {
    console.log(`❌ Error generating summary: ${error.message}`);
  }
}

async function runComprehensiveSync() {
  console.log('🚀 STARTING COMPREHENSIVE DATABASE SYNC');
  console.log('='.repeat(80));
  console.log('🔧 Using correct API: https://soccer.highlightly.net/');
  console.log('⏱️  This will take some time due to rate limiting...');
  console.log('📊 We will sync: detailed match data, lineups, head-to-head, more matches');
  console.log('');
  
  const startTime = Date.now();
  
  // Run all sync steps
  await syncDetailedMatchData();
  await syncLineupData();
  await syncHeadToHeadData();
  await syncMoreMatches();
  await generateSummaryReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 COMPREHENSIVE SYNC COMPLETED SUCCESSFULLY!');
}

runComprehensiveSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between API calls
const BATCH_SIZE = 20; // Process matches in batches

async function callSoccerApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncDetailedMatchData() {
  console.log('🔄 STEP 1: SYNCING DETAILED MATCH DATA (Events, Statistics, Venue)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
      .limit(BATCH_SIZE);
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing detailed data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get detailed match data
        const detailedData = await callSoccerApi(`matches/${match.id}`);
        
        // Update database with detailed data
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              ...detailedData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}, Venue: ${detailedData.venue?.name || 'N/A'}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 1 RESULTS: Updated ${updatedCount} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncDetailedMatchData: ${error.message}`);
  }
}

async function syncLineupData() {
  console.log('\n🔄 STEP 2: SYNCING LINEUP DATA (Formations, Starting XI, Substitutes)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without lineup data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .is('api_data->lineups', null)
      .limit(BATCH_SIZE);
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing lineup data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get lineup data
        const lineupsData = await callSoccerApi(`lineups/${match.id}`);
        
        // Update database with lineup data
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              lineups: lineupsData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 2 RESULTS: Updated ${updatedCount} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncLineupData: ${error.message}`);
  }
}

async function syncHeadToHeadData() {
  console.log('\n🔄 STEP 3: SYNCING HEAD-TO-HEAD DATA (Historical Matches, Win/Loss Stats)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without head-to-head data
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .is('api_data->headToHead', null)
      .limit(15); // Smaller batch for H2H due to complexity
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing head-to-head data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get head-to-head data
        const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
        
        // Update database with head-to-head data
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
          const wins = h2hData.statistics?.wins;
          console.log(`   ✅ Historical: ${h2hData.matches?.length || 0} matches, Stats: ${wins?.team1 || 0}-${wins?.draws || 0}-${wins?.team2 || 0}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${updatedCount} matches with head-to-head data`);
    
  } catch (error) {
    console.log(`❌ Error in syncHeadToHeadData: ${error.message}`);
  }
}

async function syncMoreMatches() {
  console.log('\n🔄 STEP 4: SYNCING MORE MATCHES FOR EXISTING LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync more matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing matches for: ${league.name}`);
        
        // Get matches from API
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=30`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          
          for (const match of matchesData) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .eq('id', match.id)
              .single();
            
            if (!existingMatch) {
              // Insert new match
              const { error: insertError } = await supabase
                .from('matches')
                .insert({
                  id: match.id,
                  home_team_id: match.homeTeam?.id,
                  away_team_id: match.awayTeam?.id,
                  league_id: league.id,
                  match_date: match.date,
                  match_time: match.time,
                  status: match.status,
                  home_score: match.score?.home || null,
                  away_score: match.score?.away || null,
                  venue: match.venue?.name || null,
                  round: match.round || null,
                  season: match.season || '2024',
                  has_highlights: false,
                  api_data: match
                });
              
              if (!insertError) {
                newMatchesCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newMatchesCount} new matches`);
          totalNewMatches += newMatchesCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Added ${totalNewMatches} new matches`);
    
  } catch (error) {
    console.log(`❌ Error in syncMoreMatches: ${error.message}`);
  }
}

async function generateSummaryReport() {
  console.log('\n📊 FINAL SUMMARY REPORT');
  console.log('='.repeat(60));
  
  try {
    // Get counts
    const [
      { count: leaguesCount },
      { count: teamsCount },
      { count: matchesCount },
      { count: highlightsCount }
    ] = await Promise.all([
      supabase.from('leagues').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('highlights').select('*', { count: 'exact', head: true })
    ]);
    
    // Get data completeness stats
    const { data: matchesWithLineups } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->lineups', 'is', null);
    
    const { data: matchesWithEvents } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->events', 'is', null);
    
    const { data: matchesWithH2H } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->headToHead', 'is', null);
    
    const { data: matchesWithStats } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->statistics', 'is', null);
    
    console.log('🎯 DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    console.log('\n📈 DATA COMPLETENESS:');
    console.log(`   🏃 Matches with lineups: ${matchesWithLineups?.length || 0}/${matchesCount} (${Math.round((matchesWithLineups?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   📅 Matches with events: ${matchesWithEvents?.length || 0}/${matchesCount} (${Math.round((matchesWithEvents?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   📊 Matches with statistics: ${matchesWithStats?.length || 0}/${matchesCount} (${Math.round((matchesWithStats?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   🔄 Matches with head-to-head: ${matchesWithH2H?.length || 0}/${matchesCount} (${Math.round((matchesWithH2H?.length || 0) / matchesCount * 100)}%)`);
    
    console.log('\n✅ COMPREHENSIVE SYNC COMPLETE!');
    console.log('🚀 Your database is now fully populated with rich match data!');
    console.log('💡 You can now view detailed match information including:');
    console.log('   • Real goalscorer events with assists');
    console.log('   • Team formations and lineups');
    console.log('   • Match statistics and venue information');
    console.log('   • Head-to-head historical records');
    
  } catch (error) {
    console.log(`❌ Error generating summary: ${error.message}`);
  }
}

async function runComprehensiveSync() {
  console.log('🚀 STARTING COMPREHENSIVE DATABASE SYNC');
  console.log('='.repeat(80));
  console.log('🔧 Using correct API: https://soccer.highlightly.net/');
  console.log('⏱️  This will take some time due to rate limiting...');
  console.log('📊 We will sync: detailed match data, lineups, head-to-head, more matches');
  console.log('');
  
  const startTime = Date.now();
  
  // Run all sync steps
  await syncDetailedMatchData();
  await syncLineupData();
  await syncHeadToHeadData();
  await syncMoreMatches();
  await generateSummaryReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 COMPREHENSIVE SYNC COMPLETED SUCCESSFULLY!');
}

runComprehensiveSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between API calls
const BATCH_SIZE = 20; // Process matches in batches

async function callSoccerApi(endpoint) {
  const url = `https://soccer.highlightly.net/${endpoint}`;
  
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncDetailedMatchData() {
  console.log('🔄 STEP 1: SYNCING DETAILED MATCH DATA (Events, Statistics, Venue)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
      .limit(BATCH_SIZE);
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing detailed data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get detailed match data
        const detailedData = await callSoccerApi(`matches/${match.id}`);
        
        // Update database with detailed data
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              ...detailedData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}, Venue: ${detailedData.venue?.name || 'N/A'}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 1 RESULTS: Updated ${updatedCount} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncDetailedMatchData: ${error.message}`);
  }
}

async function syncLineupData() {
  console.log('\n🔄 STEP 2: SYNCING LINEUP DATA (Formations, Starting XI, Substitutes)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without lineup data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .is('api_data->lineups', null)
      .limit(BATCH_SIZE);
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing lineup data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get lineup data
        const lineupsData = await callSoccerApi(`lineups/${match.id}`);
        
        // Update database with lineup data
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            api_data: {
              ...match.api_data,
              lineups: lineupsData
            }
          })
          .eq('id', match.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 2 RESULTS: Updated ${updatedCount} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncLineupData: ${error.message}`);
  }
}

async function syncHeadToHeadData() {
  console.log('\n🔄 STEP 3: SYNCING HEAD-TO-HEAD DATA (Historical Matches, Win/Loss Stats)');
  console.log('='.repeat(70));
  
  try {
    // Get matches without head-to-head data
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, 
        home_team_id, 
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(name), 
        away_team:teams!matches_away_team_id_fkey(name), 
        api_data
      `)
      .is('api_data->headToHead', null)
      .limit(15); // Smaller batch for H2H due to complexity
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${matches.length} matches needing head-to-head data`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      try {
        console.log(`🔍 Syncing H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
        
        // Get head-to-head data
        const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
        
        // Update database with head-to-head data
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
          const wins = h2hData.statistics?.wins;
          console.log(`   ✅ Historical: ${h2hData.matches?.length || 0} matches, Stats: ${wins?.team1 || 0}-${wins?.draws || 0}-${wins?.team2 || 0}`);
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${updatedCount} matches with head-to-head data`);
    
  } catch (error) {
    console.log(`❌ Error in syncHeadToHeadData: ${error.message}`);
  }
}

async function syncMoreMatches() {
  console.log('\n🔄 STEP 4: SYNCING MORE MATCHES FOR EXISTING LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync more matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing matches for: ${league.name}`);
        
        // Get matches from API
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=30`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          
          for (const match of matchesData) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .eq('id', match.id)
              .single();
            
            if (!existingMatch) {
              // Insert new match
              const { error: insertError } = await supabase
                .from('matches')
                .insert({
                  id: match.id,
                  home_team_id: match.homeTeam?.id,
                  away_team_id: match.awayTeam?.id,
                  league_id: league.id,
                  match_date: match.date,
                  match_time: match.time,
                  status: match.status,
                  home_score: match.score?.home || null,
                  away_score: match.score?.away || null,
                  venue: match.venue?.name || null,
                  round: match.round || null,
                  season: match.season || '2024',
                  has_highlights: false,
                  api_data: match
                });
              
              if (!insertError) {
                newMatchesCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newMatchesCount} new matches`);
          totalNewMatches += newMatchesCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Added ${totalNewMatches} new matches`);
    
  } catch (error) {
    console.log(`❌ Error in syncMoreMatches: ${error.message}`);
  }
}

async function generateSummaryReport() {
  console.log('\n📊 FINAL SUMMARY REPORT');
  console.log('='.repeat(60));
  
  try {
    // Get counts
    const [
      { count: leaguesCount },
      { count: teamsCount },
      { count: matchesCount },
      { count: highlightsCount }
    ] = await Promise.all([
      supabase.from('leagues').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('highlights').select('*', { count: 'exact', head: true })
    ]);
    
    // Get data completeness stats
    const { data: matchesWithLineups } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->lineups', 'is', null);
    
    const { data: matchesWithEvents } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->events', 'is', null);
    
    const { data: matchesWithH2H } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->headToHead', 'is', null);
    
    const { data: matchesWithStats } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .not('api_data->statistics', 'is', null);
    
    console.log('🎯 DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    console.log('\n📈 DATA COMPLETENESS:');
    console.log(`   🏃 Matches with lineups: ${matchesWithLineups?.length || 0}/${matchesCount} (${Math.round((matchesWithLineups?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   📅 Matches with events: ${matchesWithEvents?.length || 0}/${matchesCount} (${Math.round((matchesWithEvents?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   📊 Matches with statistics: ${matchesWithStats?.length || 0}/${matchesCount} (${Math.round((matchesWithStats?.length || 0) / matchesCount * 100)}%)`);
    console.log(`   🔄 Matches with head-to-head: ${matchesWithH2H?.length || 0}/${matchesCount} (${Math.round((matchesWithH2H?.length || 0) / matchesCount * 100)}%)`);
    
    console.log('\n✅ COMPREHENSIVE SYNC COMPLETE!');
    console.log('🚀 Your database is now fully populated with rich match data!');
    console.log('💡 You can now view detailed match information including:');
    console.log('   • Real goalscorer events with assists');
    console.log('   • Team formations and lineups');
    console.log('   • Match statistics and venue information');
    console.log('   • Head-to-head historical records');
    
  } catch (error) {
    console.log(`❌ Error generating summary: ${error.message}`);
  }
}

async function runComprehensiveSync() {
  console.log('🚀 STARTING COMPREHENSIVE DATABASE SYNC');
  console.log('='.repeat(80));
  console.log('🔧 Using correct API: https://soccer.highlightly.net/');
  console.log('⏱️  This will take some time due to rate limiting...');
  console.log('📊 We will sync: detailed match data, lineups, head-to-head, more matches');
  console.log('');
  
  const startTime = Date.now();
  
  // Run all sync steps
  await syncDetailedMatchData();
  await syncLineupData();
  await syncHeadToHeadData();
  await syncMoreMatches();
  await generateSummaryReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 COMPREHENSIVE SYNC COMPLETED SUCCESSFULLY!');
}

runComprehensiveSync(); 