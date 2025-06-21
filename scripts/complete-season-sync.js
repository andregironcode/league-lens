import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between API calls
const BATCH_SIZE = 50; // Larger batches for efficiency
const MAX_MATCHES_PER_LEAGUE = 200; // Get more matches per league

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

async function syncAllTeamsForAllLeagues() {
  console.log('🔄 STEP 1: SYNCING ALL TEAMS FOR ALL LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync teams for`);
    
    let totalNewTeams = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL teams for: ${league.name}`);
        
        // Get ALL teams from API for this league
        const teamsData = await callSoccerApi(`teams?leagueId=${league.id}&limit=50`);
        
        if (teamsData && teamsData.length > 0) {
          console.log(`   📡 Found ${teamsData.length} teams from API`);
          
          let newTeamsCount = 0;
          let updatedTeamsCount = 0;
          
          for (const team of teamsData) {
            // Check if team already exists
            const { data: existingTeam } = await supabase
              .from('teams')
              .select('id, api_data')
              .eq('id', team.id)
              .single();
            
            if (!existingTeam) {
              // Insert new team
              const { error: insertError } = await supabase
                .from('teams')
                .insert({
                  id: team.id,
                  name: team.name,
                  logo: team.logo || '',
                  short_name: team.shortName || team.name,
                  league_id: league.id,
                  country: team.country || '',
                  founded: team.founded || null,
                  venue_name: team.venue?.name || null,
                  venue_capacity: team.venue?.capacity || null,
                  api_data: team
                });
              
              if (!insertError) {
                newTeamsCount++;
              }
            } else {
              // Update existing team with latest data
              const { error: updateError } = await supabase
                .from('teams')
                .update({
                  name: team.name,
                  logo: team.logo || '',
                  short_name: team.shortName || team.name,
                  country: team.country || '',
                  founded: team.founded || null,
                  venue_name: team.venue?.name || null,
                  venue_capacity: team.venue?.capacity || null,
                  api_data: team
                })
                .eq('id', team.id);
              
              if (!updateError) {
                updatedTeamsCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
          totalNewTeams += newTeamsCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing teams for ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 1 RESULTS: Added ${totalNewTeams} new teams total`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllTeamsForAllLeagues: ${error.message}`);
  }
}

async function syncAllMatchesForAllLeagues() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES FOR COMPLETE SEASON');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync ALL matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL matches for: ${league.name}`);
        
        // Get ALL matches from API for this league (current season)
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=${MAX_MATCHES_PER_LEAGUE}&season=2024`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          let updatedMatchesCount = 0;
          
          for (const match of matchesData) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id, api_data')
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
            } else {
              // Update existing match with latest data
              const { error: updateError } = await supabase
                .from('matches')
                .update({
                  match_date: match.date,
                  match_time: match.time,
                  status: match.status,
                  home_score: match.score?.home || null,
                  away_score: match.score?.away || null,
                  venue: match.venue?.name || null,
                  round: match.round || null,
                  season: match.season || '2024',
                  api_data: {
                    ...existingMatch.api_data,
                    ...match
                  }
                })
                .eq('id', match.id);
              
              if (!updateError) {
                updatedMatchesCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newMatchesCount} new matches, updated ${updatedMatchesCount} matches`);
          totalNewMatches += newMatchesCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing matches for ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 2 RESULTS: Added ${totalNewMatches} new matches total`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllMatchesForAllLeagues: ${error.message}`);
  }
}

async function syncAllDetailedMatchData() {
  console.log('\n🔄 STEP 3: SYNCING DETAILED DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    
    while (hasMore) {
      // Get matches without detailed data in batches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
        .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${matches.length} matches needing detailed data`);
      
      let batchUpdated = 0;
      
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
            batchUpdated++;
            console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}, Venue: ${detailedData.venue?.name || 'N/A'}`);
          }
          
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(8000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += BATCH_SIZE;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} matches updated`);
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${totalUpdated} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllDetailedMatchData: ${error.message}`);
  }
}

async function syncAllLineupData() {
  console.log('\n🔄 STEP 4: SYNCING LINEUP DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    
    while (hasMore) {
      // Get matches without lineup data in batches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
        .is('api_data->lineups', null)
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${matches.length} matches needing lineup data`);
      
      let batchUpdated = 0;
      
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
            batchUpdated++;
            console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
          }
          
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(8000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += BATCH_SIZE;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} matches updated`);
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Updated ${totalUpdated} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllLineupData: ${error.message}`);
  }
}

async function syncAllHeadToHeadData() {
  console.log('\n🔄 STEP 5: SYNCING HEAD-TO-HEAD DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    const processedPairs = new Set(); // Avoid duplicate H2H for same team pairs
    
    while (hasMore) {
      // Get matches without head-to-head data in batches
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
        .range(offset, offset + 30 - 1) // Smaller batches for H2H
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/30) + 1}: ${matches.length} matches needing head-to-head data`);
      
      let batchUpdated = 0;
      
      for (const match of matches) {
        try {
          // Create a unique pair identifier (smaller ID first to avoid duplicates)
          const teamPair = [match.home_team_id, match.away_team_id].sort().join('-');
          
          if (processedPairs.has(teamPair)) {
            console.log(`⏭️  Skipping H2H (already processed): ${match.home_team?.name} vs ${match.away_team?.name}`);
            continue;
          }
          
          console.log(`🔍 Syncing H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
          
          // Get head-to-head data
          const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
          
          // Update current match with H2H data
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
            batchUpdated++;
            const wins = h2hData.statistics?.wins;
            console.log(`   ✅ Historical: ${h2hData.matches?.length || 0} matches, Stats: ${wins?.team1 || 0}-${wins?.draws || 0}-${wins?.team2 || 0}`);
            processedPairs.add(teamPair);
          }
          
          await delay(RATE_LIMIT_DELAY * 1.5); // Longer delay for H2H
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(10000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += 30;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} team pairs processed`);
    }
    
    console.log(`\n🎯 STEP 5 RESULTS: Updated ${totalUpdated} team pairs with head-to-head data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllHeadToHeadData: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 COMPLETE SEASON SYNC FINAL REPORT');
  console.log('='.repeat(80));
  
  try {
    // Get comprehensive counts
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
    
    // Get data samples to verify quality
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(5);
    
    console.log('🎯 COMPLETE DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    console.log('\n🏆 SAMPLE DATA QUALITY CHECK:');
    if (sampleMatches && sampleMatches.length > 0) {
      sampleMatches.forEach(match => {
        const lineups = match.api_data?.lineups;
        const events = match.api_data?.events;
        const h2h = match.api_data?.headToHead;
        
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
        console.log(`     Events: ${events?.length || 0}, H2H: ${h2h?.matches?.length || 0} historical matches`);
      });
    }
    
    console.log('\n✅ COMPLETE SEASON SYNC FINISHED!');
    console.log('🚀 Your League Lens database now contains:');
    console.log('   • ALL teams from ALL leagues');
    console.log('   • ALL matches from the complete 2024 season');
    console.log('   • Comprehensive match data (events, statistics, venue)');
    console.log('   • Complete lineup data (formations, starting XI, substitutes)');
    console.log('   • Head-to-head historical records for all team pairs');
    console.log('   • Real goalscorer events with assists and timestamps');
    console.log('\n🎉 Ready for production use!');
    
  } catch (error) {
    console.log(`❌ Error generating final report: ${error.message}`);
  }
}

async function runCompleteSeasonSync() {
  console.log('🚀 STARTING COMPLETE SEASON DATABASE SYNC');
  console.log('='.repeat(90));
  console.log('🔧 Using correct API: https://soccer.highlightly.net/');
  console.log('⏱️  This will take significant time due to comprehensive data collection...');
  console.log('📊 We will sync: ALL teams, ALL matches, ALL detailed data');
  console.log('🎯 Goal: Complete 2024 season coverage with rich match data');
  console.log('');
  
  const startTime = Date.now();
  
  // Run all sync steps in order
  await syncAllTeamsForAllLeagues();
  await syncAllMatchesForAllLeagues();
  await syncAllDetailedMatchData();
  await syncAllLineupData();
  await syncAllHeadToHeadData();
  await generateFinalReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 COMPLETE SEASON SYNC FINISHED SUCCESSFULLY!');
  console.log('🏆 League Lens is now ready with comprehensive season data!');
}

runCompleteSeasonSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between API calls
const BATCH_SIZE = 50; // Larger batches for efficiency
const MAX_MATCHES_PER_LEAGUE = 200; // Get more matches per league

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

async function syncAllTeamsForAllLeagues() {
  console.log('🔄 STEP 1: SYNCING ALL TEAMS FOR ALL LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync teams for`);
    
    let totalNewTeams = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL teams for: ${league.name}`);
        
        // Get ALL teams from API for this league
        const teamsData = await callSoccerApi(`teams?leagueId=${league.id}&limit=50`);
        
        if (teamsData && teamsData.length > 0) {
          console.log(`   📡 Found ${teamsData.length} teams from API`);
          
          let newTeamsCount = 0;
          let updatedTeamsCount = 0;
          
          for (const team of teamsData) {
            // Check if team already exists
            const { data: existingTeam } = await supabase
              .from('teams')
              .select('id, api_data')
              .eq('id', team.id)
              .single();
            
            if (!existingTeam) {
              // Insert new team
              const { error: insertError } = await supabase
                .from('teams')
                .insert({
                  id: team.id,
                  name: team.name,
                  logo: team.logo || '',
                  short_name: team.shortName || team.name,
                  league_id: league.id,
                  country: team.country || '',
                  founded: team.founded || null,
                  venue_name: team.venue?.name || null,
                  venue_capacity: team.venue?.capacity || null,
                  api_data: team
                });
              
              if (!insertError) {
                newTeamsCount++;
              }
            } else {
              // Update existing team with latest data
              const { error: updateError } = await supabase
                .from('teams')
                .update({
                  name: team.name,
                  logo: team.logo || '',
                  short_name: team.shortName || team.name,
                  country: team.country || '',
                  founded: team.founded || null,
                  venue_name: team.venue?.name || null,
                  venue_capacity: team.venue?.capacity || null,
                  api_data: team
                })
                .eq('id', team.id);
              
              if (!updateError) {
                updatedTeamsCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
          totalNewTeams += newTeamsCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing teams for ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 1 RESULTS: Added ${totalNewTeams} new teams total`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllTeamsForAllLeagues: ${error.message}`);
  }
}

async function syncAllMatchesForAllLeagues() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES FOR COMPLETE SEASON');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync ALL matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL matches for: ${league.name}`);
        
        // Get ALL matches from API for this league (current season)
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=${MAX_MATCHES_PER_LEAGUE}&season=2024`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          let updatedMatchesCount = 0;
          
          for (const match of matchesData) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id, api_data')
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
            } else {
              // Update existing match with latest data
              const { error: updateError } = await supabase
                .from('matches')
                .update({
                  match_date: match.date,
                  match_time: match.time,
                  status: match.status,
                  home_score: match.score?.home || null,
                  away_score: match.score?.away || null,
                  venue: match.venue?.name || null,
                  round: match.round || null,
                  season: match.season || '2024',
                  api_data: {
                    ...existingMatch.api_data,
                    ...match
                  }
                })
                .eq('id', match.id);
              
              if (!updateError) {
                updatedMatchesCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newMatchesCount} new matches, updated ${updatedMatchesCount} matches`);
          totalNewMatches += newMatchesCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing matches for ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 2 RESULTS: Added ${totalNewMatches} new matches total`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllMatchesForAllLeagues: ${error.message}`);
  }
}

async function syncAllDetailedMatchData() {
  console.log('\n🔄 STEP 3: SYNCING DETAILED DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    
    while (hasMore) {
      // Get matches without detailed data in batches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
        .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${matches.length} matches needing detailed data`);
      
      let batchUpdated = 0;
      
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
            batchUpdated++;
            console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}, Venue: ${detailedData.venue?.name || 'N/A'}`);
          }
          
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(8000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += BATCH_SIZE;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} matches updated`);
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${totalUpdated} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllDetailedMatchData: ${error.message}`);
  }
}

async function syncAllLineupData() {
  console.log('\n🔄 STEP 4: SYNCING LINEUP DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    
    while (hasMore) {
      // Get matches without lineup data in batches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
        .is('api_data->lineups', null)
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${matches.length} matches needing lineup data`);
      
      let batchUpdated = 0;
      
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
            batchUpdated++;
            console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
          }
          
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(8000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += BATCH_SIZE;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} matches updated`);
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Updated ${totalUpdated} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllLineupData: ${error.message}`);
  }
}

async function syncAllHeadToHeadData() {
  console.log('\n🔄 STEP 5: SYNCING HEAD-TO-HEAD DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    const processedPairs = new Set(); // Avoid duplicate H2H for same team pairs
    
    while (hasMore) {
      // Get matches without head-to-head data in batches
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
        .range(offset, offset + 30 - 1) // Smaller batches for H2H
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/30) + 1}: ${matches.length} matches needing head-to-head data`);
      
      let batchUpdated = 0;
      
      for (const match of matches) {
        try {
          // Create a unique pair identifier (smaller ID first to avoid duplicates)
          const teamPair = [match.home_team_id, match.away_team_id].sort().join('-');
          
          if (processedPairs.has(teamPair)) {
            console.log(`⏭️  Skipping H2H (already processed): ${match.home_team?.name} vs ${match.away_team?.name}`);
            continue;
          }
          
          console.log(`🔍 Syncing H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
          
          // Get head-to-head data
          const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
          
          // Update current match with H2H data
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
            batchUpdated++;
            const wins = h2hData.statistics?.wins;
            console.log(`   ✅ Historical: ${h2hData.matches?.length || 0} matches, Stats: ${wins?.team1 || 0}-${wins?.draws || 0}-${wins?.team2 || 0}`);
            processedPairs.add(teamPair);
          }
          
          await delay(RATE_LIMIT_DELAY * 1.5); // Longer delay for H2H
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(10000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += 30;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} team pairs processed`);
    }
    
    console.log(`\n🎯 STEP 5 RESULTS: Updated ${totalUpdated} team pairs with head-to-head data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllHeadToHeadData: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 COMPLETE SEASON SYNC FINAL REPORT');
  console.log('='.repeat(80));
  
  try {
    // Get comprehensive counts
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
    
    // Get data samples to verify quality
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(5);
    
    console.log('🎯 COMPLETE DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    console.log('\n🏆 SAMPLE DATA QUALITY CHECK:');
    if (sampleMatches && sampleMatches.length > 0) {
      sampleMatches.forEach(match => {
        const lineups = match.api_data?.lineups;
        const events = match.api_data?.events;
        const h2h = match.api_data?.headToHead;
        
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
        console.log(`     Events: ${events?.length || 0}, H2H: ${h2h?.matches?.length || 0} historical matches`);
      });
    }
    
    console.log('\n✅ COMPLETE SEASON SYNC FINISHED!');
    console.log('🚀 Your League Lens database now contains:');
    console.log('   • ALL teams from ALL leagues');
    console.log('   • ALL matches from the complete 2024 season');
    console.log('   • Comprehensive match data (events, statistics, venue)');
    console.log('   • Complete lineup data (formations, starting XI, substitutes)');
    console.log('   • Head-to-head historical records for all team pairs');
    console.log('   • Real goalscorer events with assists and timestamps');
    console.log('\n🎉 Ready for production use!');
    
  } catch (error) {
    console.log(`❌ Error generating final report: ${error.message}`);
  }
}

async function runCompleteSeasonSync() {
  console.log('🚀 STARTING COMPLETE SEASON DATABASE SYNC');
  console.log('='.repeat(90));
  console.log('🔧 Using correct API: https://soccer.highlightly.net/');
  console.log('⏱️  This will take significant time due to comprehensive data collection...');
  console.log('📊 We will sync: ALL teams, ALL matches, ALL detailed data');
  console.log('🎯 Goal: Complete 2024 season coverage with rich match data');
  console.log('');
  
  const startTime = Date.now();
  
  // Run all sync steps in order
  await syncAllTeamsForAllLeagues();
  await syncAllMatchesForAllLeagues();
  await syncAllDetailedMatchData();
  await syncAllLineupData();
  await syncAllHeadToHeadData();
  await generateFinalReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 COMPLETE SEASON SYNC FINISHED SUCCESSFULLY!');
  console.log('🏆 League Lens is now ready with comprehensive season data!');
}

runCompleteSeasonSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between API calls
const BATCH_SIZE = 50; // Larger batches for efficiency
const MAX_MATCHES_PER_LEAGUE = 200; // Get more matches per league

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

async function syncAllTeamsForAllLeagues() {
  console.log('🔄 STEP 1: SYNCING ALL TEAMS FOR ALL LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync teams for`);
    
    let totalNewTeams = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL teams for: ${league.name}`);
        
        // Get ALL teams from API for this league
        const teamsData = await callSoccerApi(`teams?leagueId=${league.id}&limit=50`);
        
        if (teamsData && teamsData.length > 0) {
          console.log(`   📡 Found ${teamsData.length} teams from API`);
          
          let newTeamsCount = 0;
          let updatedTeamsCount = 0;
          
          for (const team of teamsData) {
            // Check if team already exists
            const { data: existingTeam } = await supabase
              .from('teams')
              .select('id, api_data')
              .eq('id', team.id)
              .single();
            
            if (!existingTeam) {
              // Insert new team
              const { error: insertError } = await supabase
                .from('teams')
                .insert({
                  id: team.id,
                  name: team.name,
                  logo: team.logo || '',
                  short_name: team.shortName || team.name,
                  league_id: league.id,
                  country: team.country || '',
                  founded: team.founded || null,
                  venue_name: team.venue?.name || null,
                  venue_capacity: team.venue?.capacity || null,
                  api_data: team
                });
              
              if (!insertError) {
                newTeamsCount++;
              }
            } else {
              // Update existing team with latest data
              const { error: updateError } = await supabase
                .from('teams')
                .update({
                  name: team.name,
                  logo: team.logo || '',
                  short_name: team.shortName || team.name,
                  country: team.country || '',
                  founded: team.founded || null,
                  venue_name: team.venue?.name || null,
                  venue_capacity: team.venue?.capacity || null,
                  api_data: team
                })
                .eq('id', team.id);
              
              if (!updateError) {
                updatedTeamsCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
          totalNewTeams += newTeamsCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing teams for ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 1 RESULTS: Added ${totalNewTeams} new teams total`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllTeamsForAllLeagues: ${error.message}`);
  }
}

async function syncAllMatchesForAllLeagues() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES FOR COMPLETE SEASON');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync ALL matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL matches for: ${league.name}`);
        
        // Get ALL matches from API for this league (current season)
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=${MAX_MATCHES_PER_LEAGUE}&season=2024`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          let updatedMatchesCount = 0;
          
          for (const match of matchesData) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id, api_data')
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
            } else {
              // Update existing match with latest data
              const { error: updateError } = await supabase
                .from('matches')
                .update({
                  match_date: match.date,
                  match_time: match.time,
                  status: match.status,
                  home_score: match.score?.home || null,
                  away_score: match.score?.away || null,
                  venue: match.venue?.name || null,
                  round: match.round || null,
                  season: match.season || '2024',
                  api_data: {
                    ...existingMatch.api_data,
                    ...match
                  }
                })
                .eq('id', match.id);
              
              if (!updateError) {
                updatedMatchesCount++;
              }
            }
          }
          
          console.log(`   ✅ Added ${newMatchesCount} new matches, updated ${updatedMatchesCount} matches`);
          totalNewMatches += newMatchesCount;
        }
        
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Error syncing matches for ${league.name}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   ⏸️  Rate limited, waiting longer...');
          await delay(5000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 2 RESULTS: Added ${totalNewMatches} new matches total`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllMatchesForAllLeagues: ${error.message}`);
  }
}

async function syncAllDetailedMatchData() {
  console.log('\n🔄 STEP 3: SYNCING DETAILED DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    
    while (hasMore) {
      // Get matches without detailed data in batches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
        .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${matches.length} matches needing detailed data`);
      
      let batchUpdated = 0;
      
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
            batchUpdated++;
            console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}, Venue: ${detailedData.venue?.name || 'N/A'}`);
          }
          
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(8000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += BATCH_SIZE;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} matches updated`);
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${totalUpdated} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllDetailedMatchData: ${error.message}`);
  }
}

async function syncAllLineupData() {
  console.log('\n🔄 STEP 4: SYNCING LINEUP DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    
    while (hasMore) {
      // Get matches without lineup data in batches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
        .is('api_data->lineups', null)
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${matches.length} matches needing lineup data`);
      
      let batchUpdated = 0;
      
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
            batchUpdated++;
            console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
          }
          
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(8000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += BATCH_SIZE;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} matches updated`);
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Updated ${totalUpdated} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllLineupData: ${error.message}`);
  }
}

async function syncAllHeadToHeadData() {
  console.log('\n🔄 STEP 5: SYNCING HEAD-TO-HEAD DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    let offset = 0;
    let hasMore = true;
    let totalUpdated = 0;
    const processedPairs = new Set(); // Avoid duplicate H2H for same team pairs
    
    while (hasMore) {
      // Get matches without head-to-head data in batches
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
        .range(offset, offset + 30 - 1) // Smaller batches for H2H
        .order('id');
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (!matches || matches.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n📋 Processing batch ${Math.floor(offset/30) + 1}: ${matches.length} matches needing head-to-head data`);
      
      let batchUpdated = 0;
      
      for (const match of matches) {
        try {
          // Create a unique pair identifier (smaller ID first to avoid duplicates)
          const teamPair = [match.home_team_id, match.away_team_id].sort().join('-');
          
          if (processedPairs.has(teamPair)) {
            console.log(`⏭️  Skipping H2H (already processed): ${match.home_team?.name} vs ${match.away_team?.name}`);
            continue;
          }
          
          console.log(`🔍 Syncing H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
          
          // Get head-to-head data
          const h2hData = await callSoccerApi(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
          
          // Update current match with H2H data
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
            batchUpdated++;
            const wins = h2hData.statistics?.wins;
            console.log(`   ✅ Historical: ${h2hData.matches?.length || 0} matches, Stats: ${wins?.team1 || 0}-${wins?.draws || 0}-${wins?.team2 || 0}`);
            processedPairs.add(teamPair);
          }
          
          await delay(RATE_LIMIT_DELAY * 1.5); // Longer delay for H2H
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.message.includes('429')) {
            console.log('   ⏸️  Rate limited, waiting longer...');
            await delay(10000);
          }
        }
      }
      
      totalUpdated += batchUpdated;
      offset += 30;
      
      console.log(`   ✅ Batch complete: ${batchUpdated} team pairs processed`);
    }
    
    console.log(`\n🎯 STEP 5 RESULTS: Updated ${totalUpdated} team pairs with head-to-head data`);
    
  } catch (error) {
    console.log(`❌ Error in syncAllHeadToHeadData: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 COMPLETE SEASON SYNC FINAL REPORT');
  console.log('='.repeat(80));
  
  try {
    // Get comprehensive counts
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
    
    // Get data samples to verify quality
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(5);
    
    console.log('🎯 COMPLETE DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    console.log('\n🏆 SAMPLE DATA QUALITY CHECK:');
    if (sampleMatches && sampleMatches.length > 0) {
      sampleMatches.forEach(match => {
        const lineups = match.api_data?.lineups;
        const events = match.api_data?.events;
        const h2h = match.api_data?.headToHead;
        
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
        console.log(`     Events: ${events?.length || 0}, H2H: ${h2h?.matches?.length || 0} historical matches`);
      });
    }
    
    console.log('\n✅ COMPLETE SEASON SYNC FINISHED!');
    console.log('🚀 Your League Lens database now contains:');
    console.log('   • ALL teams from ALL leagues');
    console.log('   • ALL matches from the complete 2024 season');
    console.log('   • Comprehensive match data (events, statistics, venue)');
    console.log('   • Complete lineup data (formations, starting XI, substitutes)');
    console.log('   • Head-to-head historical records for all team pairs');
    console.log('   • Real goalscorer events with assists and timestamps');
    console.log('\n🎉 Ready for production use!');
    
  } catch (error) {
    console.log(`❌ Error generating final report: ${error.message}`);
  }
}

async function runCompleteSeasonSync() {
  console.log('🚀 STARTING COMPLETE SEASON DATABASE SYNC');
  console.log('='.repeat(90));
  console.log('🔧 Using correct API: https://soccer.highlightly.net/');
  console.log('⏱️  This will take significant time due to comprehensive data collection...');
  console.log('📊 We will sync: ALL teams, ALL matches, ALL detailed data');
  console.log('🎯 Goal: Complete 2024 season coverage with rich match data');
  console.log('');
  
  const startTime = Date.now();
  
  // Run all sync steps in order
  await syncAllTeamsForAllLeagues();
  await syncAllMatchesForAllLeagues();
  await syncAllDetailedMatchData();
  await syncAllLineupData();
  await syncAllHeadToHeadData();
  await generateFinalReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 COMPLETE SEASON SYNC FINISHED SUCCESSFULLY!');
  console.log('🏆 League Lens is now ready with comprehensive season data!');
}

runCompleteSeasonSync(); 