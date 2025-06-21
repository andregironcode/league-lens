import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 2000; // Increased to 2 seconds
const MAX_API_LIMIT = 100;
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
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait longer between retries
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      console.log(`   ⏸️  Waiting ${retryDelay}ms before retry...`);
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixPremierLeagueSpecifically() {
  console.log('🔧 FIXING PREMIER LEAGUE SPECIFICALLY');
  console.log('='.repeat(50));
  
  const premierLeagueId = '33973';
  
  try {
    console.log('📡 Getting Premier League matches with error handling...');
    
    let allMatches = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore && page < 5) { // Limit to 5 pages for now
      try {
        const offset = page * MAX_API_LIMIT;
        console.log(`   📄 Fetching page ${page + 1} (offset: ${offset})...`);
        
        const matches = await callSoccerApiWithRetry(`matches?leagueId=${premierLeagueId}&limit=${MAX_API_LIMIT}&offset=${offset}`);
        
        if (matches.length === 0) {
          hasMore = false;
        } else {
          allMatches = allMatches.concat(matches);
          console.log(`   ✅ Page ${page + 1}: ${matches.length} matches (Total: ${allMatches.length})`);
          page++;
          
          await delay(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        console.log(`   ❌ Error on page ${page + 1}: ${error.message}`);
        hasMore = false;
      }
    }
    
    console.log(`📊 Total Premier League matches found: ${allMatches.length}`);
    
    // Extract teams
    const teams = new Map();
    allMatches.forEach(match => {
      if (match.homeTeam?.id && match.homeTeam?.name) {
        teams.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo || '',
          short_name: match.homeTeam.shortName || match.homeTeam.name,
          league_id: premierLeagueId,
          country: 'England'
        });
      }
      
      if (match.awayTeam?.id && match.awayTeam?.name) {
        teams.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo || '',
          short_name: match.awayTeam.shortName || match.awayTeam.name,
          league_id: premierLeagueId,
          country: 'England'
        });
      }
    });
    
    console.log(`👥 Premier League teams found: ${teams.size}`);
    
    // Sync teams
    let newTeams = 0;
    for (const team of teams.values()) {
      try {
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('id', team.id)
          .single();
        
        if (!existingTeam) {
          const { error: insertError } = await supabase
            .from('teams')
            .insert({
              id: team.id,
              name: team.name,
              logo: team.logo,
              short_name: team.short_name,
              league_id: team.league_id,
              country: team.country,
              api_data: team
            });
          
          if (!insertError) {
            newTeams++;
            console.log(`   ✅ Added: ${team.name}`);
          }
        }
      } catch (teamError) {
        console.log(`   ❌ Error syncing team ${team.name}: ${teamError.message}`);
      }
    }
    
    // Sync matches
    let newMatches = 0;
    let updatedMatches = 0;
    
    for (const match of allMatches) {
      try {
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('id', match.id)
          .single();
        
        if (!existingMatch) {
          const { error: insertError } = await supabase
            .from('matches')
            .insert({
              id: match.id,
              home_team_id: match.homeTeam?.id,
              away_team_id: match.awayTeam?.id,
              league_id: premierLeagueId,
              match_date: match.date,
              match_time: match.time,
              status: match.status || 'scheduled',
              home_score: match.score?.home || null,
              away_score: match.score?.away || null,
              venue: match.venue?.name || null,
              round: match.round || null,
              season: match.season || '2024',
              has_highlights: false,
              api_data: match
            });
          
          if (!insertError) {
            newMatches++;
          }
        } else {
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              api_data: match
            })
            .eq('id', match.id);
          
          if (!updateError) {
            updatedMatches++;
          }
        }
      } catch (matchError) {
        console.log(`   ❌ Error syncing match: ${matchError.message}`);
      }
    }
    
    console.log(`🎯 Premier League Results:`);
    console.log(`   👥 New teams: ${newTeams}`);
    console.log(`   ⚽ New matches: ${newMatches}`);
    console.log(`   🔄 Updated matches: ${updatedMatches}`);
    
  } catch (error) {
    console.log(`❌ Error fixing Premier League: ${error.message}`);
  }
}

async function addMissingDataTypes() {
  console.log('\n🔄 ADDING MISSING DATA TYPES');
  console.log('='.repeat(50));
  
  // Step 1: Add detailed match data (events, statistics)
  console.log('\n📊 Adding match details and statistics...');
  const { data: matchesNeedingDetails } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .or('api_data->events.is.null,api_data->statistics.is.null')
    .limit(20);
  
  let detailsAdded = 0;
  for (const match of matchesNeedingDetails || []) {
    try {
      console.log(`🔍 Getting details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const detailedData = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            ...detailedData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        detailsAdded++;
        console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Step 2: Add lineup data
  console.log('\n👥 Adding lineup data...');
  const { data: matchesNeedingLineups } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(20);
  
  let lineupsAdded = 0;
  for (const match of matchesNeedingLineups || []) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const lineupsData = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            lineups: lineupsData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        lineupsAdded++;
        console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Step 3: Add H2H data
  console.log('\n🥊 Adding head-to-head data...');
  const { data: matchesNeedingH2H } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(15);
  
  let h2hAdded = 0;
  for (const match of matchesNeedingH2H || []) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const h2hData = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            headToHead: h2hData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        h2hAdded++;
        console.log(`   ✅ H2H records: ${h2hData.matches?.length || 0} historical matches`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 Missing Data Added:`);
  console.log(`   📊 Match details: ${detailsAdded}`);
  console.log(`   👥 Lineups: ${lineupsAdded}`);
  console.log(`   🥊 H2H data: ${h2hAdded}`);
}

async function runComprehensiveFix() {
  console.log('🚀 COMPREHENSIVE FIX FOR PREMIER LEAGUE + MISSING DATA');
  console.log('='.repeat(70));
  console.log('🛡️  With network error handling and retries');
  console.log('📊 Will add: Match Details, Lineups, H2H Data');
  console.log('');
  
  const startTime = Date.now();
  
  // Fix Premier League specifically
  await fixPremierLeagueSpecifically();
  
  // Add all missing data types
  await addMissingDataTypes();
  
  // Generate report
  const { data: leagues } = await supabase.from('leagues').select('id, name');
  
  console.log('\n📊 FINAL STATUS BY LEAGUE:');
  for (const league of leagues) {
    const [
      { count: teamsCount },
      { count: matchesCount }
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('league_id', league.id),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('league_id', league.id)
    ]);
    
    console.log(`   📊 ${league.name}: ${teamsCount} teams, ${matchesCount} matches`);
  }
  
  // Check data completeness
  const [
    { count: totalMatches },
    { count: matchesWithEvents },
    { count: matchesWithLineups },
    { count: matchesWithH2H }
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->events', 'is', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null)
  ]);
  
  console.log(`\n🏆 DATA COMPLETENESS:`);
  console.log(`   ⚽ Total matches: ${totalMatches}`);
  console.log(`   📊 With detailed events: ${matchesWithEvents}`);
  console.log(`   👥 With lineups: ${matchesWithLineups}`);
  console.log(`   🥊 With H2H data: ${matchesWithH2H}`);
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total fix time: ${duration} minutes`);
  console.log('✅ COMPREHENSIVE FIX COMPLETE!');
}

runComprehensiveFix(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 2000; // Increased to 2 seconds
const MAX_API_LIMIT = 100;
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
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait longer between retries
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      console.log(`   ⏸️  Waiting ${retryDelay}ms before retry...`);
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixPremierLeagueSpecifically() {
  console.log('🔧 FIXING PREMIER LEAGUE SPECIFICALLY');
  console.log('='.repeat(50));
  
  const premierLeagueId = '33973';
  
  try {
    console.log('📡 Getting Premier League matches with error handling...');
    
    let allMatches = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore && page < 5) { // Limit to 5 pages for now
      try {
        const offset = page * MAX_API_LIMIT;
        console.log(`   📄 Fetching page ${page + 1} (offset: ${offset})...`);
        
        const matches = await callSoccerApiWithRetry(`matches?leagueId=${premierLeagueId}&limit=${MAX_API_LIMIT}&offset=${offset}`);
        
        if (matches.length === 0) {
          hasMore = false;
        } else {
          allMatches = allMatches.concat(matches);
          console.log(`   ✅ Page ${page + 1}: ${matches.length} matches (Total: ${allMatches.length})`);
          page++;
          
          await delay(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        console.log(`   ❌ Error on page ${page + 1}: ${error.message}`);
        hasMore = false;
      }
    }
    
    console.log(`📊 Total Premier League matches found: ${allMatches.length}`);
    
    // Extract teams
    const teams = new Map();
    allMatches.forEach(match => {
      if (match.homeTeam?.id && match.homeTeam?.name) {
        teams.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo || '',
          short_name: match.homeTeam.shortName || match.homeTeam.name,
          league_id: premierLeagueId,
          country: 'England'
        });
      }
      
      if (match.awayTeam?.id && match.awayTeam?.name) {
        teams.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo || '',
          short_name: match.awayTeam.shortName || match.awayTeam.name,
          league_id: premierLeagueId,
          country: 'England'
        });
      }
    });
    
    console.log(`👥 Premier League teams found: ${teams.size}`);
    
    // Sync teams
    let newTeams = 0;
    for (const team of teams.values()) {
      try {
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('id', team.id)
          .single();
        
        if (!existingTeam) {
          const { error: insertError } = await supabase
            .from('teams')
            .insert({
              id: team.id,
              name: team.name,
              logo: team.logo,
              short_name: team.short_name,
              league_id: team.league_id,
              country: team.country,
              api_data: team
            });
          
          if (!insertError) {
            newTeams++;
            console.log(`   ✅ Added: ${team.name}`);
          }
        }
      } catch (teamError) {
        console.log(`   ❌ Error syncing team ${team.name}: ${teamError.message}`);
      }
    }
    
    // Sync matches
    let newMatches = 0;
    let updatedMatches = 0;
    
    for (const match of allMatches) {
      try {
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('id', match.id)
          .single();
        
        if (!existingMatch) {
          const { error: insertError } = await supabase
            .from('matches')
            .insert({
              id: match.id,
              home_team_id: match.homeTeam?.id,
              away_team_id: match.awayTeam?.id,
              league_id: premierLeagueId,
              match_date: match.date,
              match_time: match.time,
              status: match.status || 'scheduled',
              home_score: match.score?.home || null,
              away_score: match.score?.away || null,
              venue: match.venue?.name || null,
              round: match.round || null,
              season: match.season || '2024',
              has_highlights: false,
              api_data: match
            });
          
          if (!insertError) {
            newMatches++;
          }
        } else {
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              api_data: match
            })
            .eq('id', match.id);
          
          if (!updateError) {
            updatedMatches++;
          }
        }
      } catch (matchError) {
        console.log(`   ❌ Error syncing match: ${matchError.message}`);
      }
    }
    
    console.log(`🎯 Premier League Results:`);
    console.log(`   👥 New teams: ${newTeams}`);
    console.log(`   ⚽ New matches: ${newMatches}`);
    console.log(`   🔄 Updated matches: ${updatedMatches}`);
    
  } catch (error) {
    console.log(`❌ Error fixing Premier League: ${error.message}`);
  }
}

async function addMissingDataTypes() {
  console.log('\n🔄 ADDING MISSING DATA TYPES');
  console.log('='.repeat(50));
  
  // Step 1: Add detailed match data (events, statistics)
  console.log('\n📊 Adding match details and statistics...');
  const { data: matchesNeedingDetails } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .or('api_data->events.is.null,api_data->statistics.is.null')
    .limit(20);
  
  let detailsAdded = 0;
  for (const match of matchesNeedingDetails || []) {
    try {
      console.log(`🔍 Getting details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const detailedData = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            ...detailedData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        detailsAdded++;
        console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Step 2: Add lineup data
  console.log('\n👥 Adding lineup data...');
  const { data: matchesNeedingLineups } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(20);
  
  let lineupsAdded = 0;
  for (const match of matchesNeedingLineups || []) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const lineupsData = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            lineups: lineupsData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        lineupsAdded++;
        console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Step 3: Add H2H data
  console.log('\n🥊 Adding head-to-head data...');
  const { data: matchesNeedingH2H } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(15);
  
  let h2hAdded = 0;
  for (const match of matchesNeedingH2H || []) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const h2hData = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            headToHead: h2hData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        h2hAdded++;
        console.log(`   ✅ H2H records: ${h2hData.matches?.length || 0} historical matches`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 Missing Data Added:`);
  console.log(`   📊 Match details: ${detailsAdded}`);
  console.log(`   👥 Lineups: ${lineupsAdded}`);
  console.log(`   🥊 H2H data: ${h2hAdded}`);
}

async function runComprehensiveFix() {
  console.log('🚀 COMPREHENSIVE FIX FOR PREMIER LEAGUE + MISSING DATA');
  console.log('='.repeat(70));
  console.log('🛡️  With network error handling and retries');
  console.log('📊 Will add: Match Details, Lineups, H2H Data');
  console.log('');
  
  const startTime = Date.now();
  
  // Fix Premier League specifically
  await fixPremierLeagueSpecifically();
  
  // Add all missing data types
  await addMissingDataTypes();
  
  // Generate report
  const { data: leagues } = await supabase.from('leagues').select('id, name');
  
  console.log('\n📊 FINAL STATUS BY LEAGUE:');
  for (const league of leagues) {
    const [
      { count: teamsCount },
      { count: matchesCount }
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('league_id', league.id),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('league_id', league.id)
    ]);
    
    console.log(`   📊 ${league.name}: ${teamsCount} teams, ${matchesCount} matches`);
  }
  
  // Check data completeness
  const [
    { count: totalMatches },
    { count: matchesWithEvents },
    { count: matchesWithLineups },
    { count: matchesWithH2H }
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->events', 'is', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null)
  ]);
  
  console.log(`\n🏆 DATA COMPLETENESS:`);
  console.log(`   ⚽ Total matches: ${totalMatches}`);
  console.log(`   📊 With detailed events: ${matchesWithEvents}`);
  console.log(`   👥 With lineups: ${matchesWithLineups}`);
  console.log(`   🥊 With H2H data: ${matchesWithH2H}`);
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total fix time: ${duration} minutes`);
  console.log('✅ COMPREHENSIVE FIX COMPLETE!');
}

runComprehensiveFix(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 2000; // Increased to 2 seconds
const MAX_API_LIMIT = 100;
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
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait longer between retries
      const retryDelay = RATE_LIMIT_DELAY * attempt;
      console.log(`   ⏸️  Waiting ${retryDelay}ms before retry...`);
      await delay(retryDelay);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixPremierLeagueSpecifically() {
  console.log('🔧 FIXING PREMIER LEAGUE SPECIFICALLY');
  console.log('='.repeat(50));
  
  const premierLeagueId = '33973';
  
  try {
    console.log('📡 Getting Premier League matches with error handling...');
    
    let allMatches = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore && page < 5) { // Limit to 5 pages for now
      try {
        const offset = page * MAX_API_LIMIT;
        console.log(`   📄 Fetching page ${page + 1} (offset: ${offset})...`);
        
        const matches = await callSoccerApiWithRetry(`matches?leagueId=${premierLeagueId}&limit=${MAX_API_LIMIT}&offset=${offset}`);
        
        if (matches.length === 0) {
          hasMore = false;
        } else {
          allMatches = allMatches.concat(matches);
          console.log(`   ✅ Page ${page + 1}: ${matches.length} matches (Total: ${allMatches.length})`);
          page++;
          
          await delay(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        console.log(`   ❌ Error on page ${page + 1}: ${error.message}`);
        hasMore = false;
      }
    }
    
    console.log(`📊 Total Premier League matches found: ${allMatches.length}`);
    
    // Extract teams
    const teams = new Map();
    allMatches.forEach(match => {
      if (match.homeTeam?.id && match.homeTeam?.name) {
        teams.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo || '',
          short_name: match.homeTeam.shortName || match.homeTeam.name,
          league_id: premierLeagueId,
          country: 'England'
        });
      }
      
      if (match.awayTeam?.id && match.awayTeam?.name) {
        teams.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo || '',
          short_name: match.awayTeam.shortName || match.awayTeam.name,
          league_id: premierLeagueId,
          country: 'England'
        });
      }
    });
    
    console.log(`👥 Premier League teams found: ${teams.size}`);
    
    // Sync teams
    let newTeams = 0;
    for (const team of teams.values()) {
      try {
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('id', team.id)
          .single();
        
        if (!existingTeam) {
          const { error: insertError } = await supabase
            .from('teams')
            .insert({
              id: team.id,
              name: team.name,
              logo: team.logo,
              short_name: team.short_name,
              league_id: team.league_id,
              country: team.country,
              api_data: team
            });
          
          if (!insertError) {
            newTeams++;
            console.log(`   ✅ Added: ${team.name}`);
          }
        }
      } catch (teamError) {
        console.log(`   ❌ Error syncing team ${team.name}: ${teamError.message}`);
      }
    }
    
    // Sync matches
    let newMatches = 0;
    let updatedMatches = 0;
    
    for (const match of allMatches) {
      try {
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('id', match.id)
          .single();
        
        if (!existingMatch) {
          const { error: insertError } = await supabase
            .from('matches')
            .insert({
              id: match.id,
              home_team_id: match.homeTeam?.id,
              away_team_id: match.awayTeam?.id,
              league_id: premierLeagueId,
              match_date: match.date,
              match_time: match.time,
              status: match.status || 'scheduled',
              home_score: match.score?.home || null,
              away_score: match.score?.away || null,
              venue: match.venue?.name || null,
              round: match.round || null,
              season: match.season || '2024',
              has_highlights: false,
              api_data: match
            });
          
          if (!insertError) {
            newMatches++;
          }
        } else {
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              api_data: match
            })
            .eq('id', match.id);
          
          if (!updateError) {
            updatedMatches++;
          }
        }
      } catch (matchError) {
        console.log(`   ❌ Error syncing match: ${matchError.message}`);
      }
    }
    
    console.log(`🎯 Premier League Results:`);
    console.log(`   👥 New teams: ${newTeams}`);
    console.log(`   ⚽ New matches: ${newMatches}`);
    console.log(`   🔄 Updated matches: ${updatedMatches}`);
    
  } catch (error) {
    console.log(`❌ Error fixing Premier League: ${error.message}`);
  }
}

async function addMissingDataTypes() {
  console.log('\n🔄 ADDING MISSING DATA TYPES');
  console.log('='.repeat(50));
  
  // Step 1: Add detailed match data (events, statistics)
  console.log('\n📊 Adding match details and statistics...');
  const { data: matchesNeedingDetails } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .or('api_data->events.is.null,api_data->statistics.is.null')
    .limit(20);
  
  let detailsAdded = 0;
  for (const match of matchesNeedingDetails || []) {
    try {
      console.log(`🔍 Getting details: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const detailedData = await callSoccerApiWithRetry(`matches/${match.id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            ...detailedData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        detailsAdded++;
        console.log(`   ✅ Events: ${detailedData.events?.length || 0}, Stats: ${detailedData.statistics?.length || 0}`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Step 2: Add lineup data
  console.log('\n👥 Adding lineup data...');
  const { data: matchesNeedingLineups } = await supabase
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->lineups', null)
    .limit(20);
  
  let lineupsAdded = 0;
  for (const match of matchesNeedingLineups || []) {
    try {
      console.log(`🔍 Getting lineups: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const lineupsData = await callSoccerApiWithRetry(`lineups/${match.id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            lineups: lineupsData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        lineupsAdded++;
        console.log(`   ✅ Formations: ${lineupsData.homeTeam?.formation} vs ${lineupsData.awayTeam?.formation}`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Step 3: Add H2H data
  console.log('\n🥊 Adding head-to-head data...');
  const { data: matchesNeedingH2H } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
    .is('api_data->headToHead', null)
    .limit(15);
  
  let h2hAdded = 0;
  for (const match of matchesNeedingH2H || []) {
    try {
      console.log(`🔍 Getting H2H: ${match.home_team?.name} vs ${match.away_team?.name}`);
      
      const h2hData = await callSoccerApiWithRetry(`head-2-head?teamIdOne=${match.home_team_id}&teamIdTwo=${match.away_team_id}`);
      
      const { error } = await supabase
        .from('matches')
        .update({ 
          api_data: {
            ...match.api_data,
            headToHead: h2hData
          }
        })
        .eq('id', match.id);
      
      if (!error) {
        h2hAdded++;
        console.log(`   ✅ H2H records: ${h2hData.matches?.length || 0} historical matches`);
      }
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 Missing Data Added:`);
  console.log(`   📊 Match details: ${detailsAdded}`);
  console.log(`   👥 Lineups: ${lineupsAdded}`);
  console.log(`   🥊 H2H data: ${h2hAdded}`);
}

async function runComprehensiveFix() {
  console.log('🚀 COMPREHENSIVE FIX FOR PREMIER LEAGUE + MISSING DATA');
  console.log('='.repeat(70));
  console.log('🛡️  With network error handling and retries');
  console.log('📊 Will add: Match Details, Lineups, H2H Data');
  console.log('');
  
  const startTime = Date.now();
  
  // Fix Premier League specifically
  await fixPremierLeagueSpecifically();
  
  // Add all missing data types
  await addMissingDataTypes();
  
  // Generate report
  const { data: leagues } = await supabase.from('leagues').select('id, name');
  
  console.log('\n📊 FINAL STATUS BY LEAGUE:');
  for (const league of leagues) {
    const [
      { count: teamsCount },
      { count: matchesCount }
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('league_id', league.id),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('league_id', league.id)
    ]);
    
    console.log(`   📊 ${league.name}: ${teamsCount} teams, ${matchesCount} matches`);
  }
  
  // Check data completeness
  const [
    { count: totalMatches },
    { count: matchesWithEvents },
    { count: matchesWithLineups },
    { count: matchesWithH2H }
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->events', 'is', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->lineups', 'is', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).not('api_data->headToHead', 'is', null)
  ]);
  
  console.log(`\n🏆 DATA COMPLETENESS:`);
  console.log(`   ⚽ Total matches: ${totalMatches}`);
  console.log(`   📊 With detailed events: ${matchesWithEvents}`);
  console.log(`   👥 With lineups: ${matchesWithLineups}`);
  console.log(`   🥊 With H2H data: ${matchesWithH2H}`);
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total fix time: ${duration} minutes`);
  console.log('✅ COMPREHENSIVE FIX COMPLETE!');
}

runComprehensiveFix(); 