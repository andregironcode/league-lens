import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200;

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
  
  const result = await response.json();
  return result.data || result;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncTeamsFromMatches() {
  console.log('🔄 STEP 1: SYNCING TEAMS FROM MATCHES (CORRECT APPROACH)');
  console.log('='.repeat(70));
  
  // Get our actual league IDs from database
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name');
  
  if (error) throw new Error(`Database error: ${error.message}`);
  
  console.log(`📋 Found ${leagues.length} leagues with correct IDs`);
  
  const allTeams = new Map(); // Use Map to avoid duplicates
  let totalNewTeams = 0;
  
  for (const league of leagues) {
    try {
      console.log(`\n🔍 Getting teams from matches for: ${league.name} (ID: ${league.id})`);
      
      // Get ALL matches for this league to extract teams
      const matches = await callSoccerApi(`matches?leagueId=${league.id}&limit=200`);
      console.log(`   📅 Found ${matches.length} matches`);
      
      // Extract unique teams from matches
      matches.forEach(match => {
        if (match.homeTeam?.id && match.homeTeam?.name) {
          allTeams.set(match.homeTeam.id, {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logo: match.homeTeam.logo || '',
            short_name: match.homeTeam.shortName || match.homeTeam.name,
            league_id: league.id,
            country: league.name.includes('Premier League') ? 'England' : 
                     league.name.includes('La Liga') ? 'Spain' :
                     league.name.includes('Serie A') ? 'Italy' :
                     league.name.includes('Bundesliga') ? 'Germany' :
                     league.name.includes('Ligue 1') ? 'France' : ''
          });
        }
        
        if (match.awayTeam?.id && match.awayTeam?.name) {
          allTeams.set(match.awayTeam.id, {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logo: match.awayTeam.logo || '',
            short_name: match.awayTeam.shortName || match.awayTeam.name,
            league_id: league.id,
            country: league.name.includes('Premier League') ? 'England' : 
                     league.name.includes('La Liga') ? 'Spain' :
                     league.name.includes('Serie A') ? 'Italy' :
                     league.name.includes('Bundesliga') ? 'Germany' :
                     league.name.includes('Ligue 1') ? 'France' : ''
          });
        }
      });
      
      console.log(`   👥 Extracted ${[...allTeams.values()].filter(t => t.league_id === league.id).length} teams`);
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error for ${league.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Total unique teams found: ${allTeams.size}`);
  
  // Now sync only these relevant teams
  let newTeamsCount = 0;
  let updatedTeamsCount = 0;
  
  for (const team of allTeams.values()) {
    try {
      // Check if team already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('id', team.id)
        .single();
      
      if (!existingTeam) {
        // Insert new team
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
          newTeamsCount++;
          if (newTeamsCount <= 10) {
            console.log(`   ✅ Added: ${team.name} (${team.country})`);
          }
        }
      } else {
        // Update existing team
        const { error: updateError } = await supabase
          .from('teams')
          .update({
            name: team.name,
            logo: team.logo,
            short_name: team.short_name,
            league_id: team.league_id,
            country: team.country,
            api_data: team
          })
          .eq('id', team.id);
        
        if (!updateError) {
          updatedTeamsCount++;
        }
      }
    } catch (teamError) {
      console.log(`   ❌ Error processing team ${team.name}: ${teamError.message}`);
    }
  }
  
  console.log(`\n🎯 STEP 1 RESULTS: Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
  totalNewTeams = newTeamsCount;
  
  return totalNewTeams;
}

async function syncAllMatchesWithCorrectIds() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES WITH CORRECT LEAGUE IDS');
  console.log('='.repeat(70));
  
  // Get our leagues with correct IDs
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name');
  
  if (error) throw new Error(`Database error: ${error.message}`);
  
  let totalNewMatches = 0;
  
  for (const league of leagues) {
    try {
      console.log(`\n🔍 Syncing matches for: ${league.name} (ID: ${league.id})`);
      
      // Get ALL matches for this league
      const matches = await callSoccerApi(`matches?leagueId=${league.id}&limit=500`);
      console.log(`   📡 Found ${matches.length} matches from API`);
      
      let newMatchesCount = 0;
      let updatedMatchesCount = 0;
      
      for (const match of matches) {
        try {
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
              newMatchesCount++;
            }
          } else {
            // Update existing match
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                match_date: match.date,
                match_time: match.time,
                status: match.status || 'scheduled',
                home_score: match.score?.home || null,
                away_score: match.score?.away || null,
                venue: match.venue?.name || null,
                round: match.round || null,
                season: match.season || '2024',
                api_data: match
              })
              .eq('id', match.id);
            
            if (!updateError) {
              updatedMatchesCount++;
            }
          }
        } catch (matchError) {
          console.log(`   ❌ Error processing match: ${matchError.message}`);
        }
      }
      
      console.log(`   ✅ Added ${newMatchesCount} new matches, updated ${updatedMatchesCount} matches`);
      totalNewMatches += newMatchesCount;
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error syncing matches for ${league.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 STEP 2 RESULTS: Added ${totalNewMatches} new matches total`);
  return totalNewMatches;
}

async function generateCorrectReport() {
  console.log('\n📊 CORRECT SYNC REPORT');
  console.log('='.repeat(60));
  
  try {
    // Get counts by league
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name');
    
    console.log('🎯 DATABASE TOTALS BY LEAGUE:');
    
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
    
    // Overall totals
    const [
      { count: totalTeams },
      { count: totalMatches },
      { count: totalHighlights }
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('highlights').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`\n🏆 OVERALL TOTALS:`);
    console.log(`   👥 Teams: ${totalTeams}`);
    console.log(`   ⚽ Matches: ${totalMatches}`);
    console.log(`   🎬 Highlights: ${totalHighlights}`);
    
    console.log('\n✅ CORRECT SYNC COMPLETE!');
    console.log('🎯 Database now contains only relevant teams and matches!');
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCorrectSync() {
  console.log('🚀 STARTING CORRECT LEAGUE SYNC');
  console.log('='.repeat(80));
  console.log('🎯 This will sync ONLY relevant teams and matches for our 5 leagues');
  console.log('📊 Using correct league IDs from our database');
  console.log('');
  
  const startTime = Date.now();
  
  // Run correct sync steps
  const newTeams = await syncTeamsFromMatches();
  const newMatches = await syncAllMatchesWithCorrectIds();
  await generateCorrectReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log(`📈 Added ${newTeams} teams and ${newMatches} matches`);
  console.log('🎉 CORRECT SYNC FINISHED!');
}

runCorrectSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200;

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
  
  const result = await response.json();
  return result.data || result;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncTeamsFromMatches() {
  console.log('🔄 STEP 1: SYNCING TEAMS FROM MATCHES (CORRECT APPROACH)');
  console.log('='.repeat(70));
  
  // Get our actual league IDs from database
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name');
  
  if (error) throw new Error(`Database error: ${error.message}`);
  
  console.log(`📋 Found ${leagues.length} leagues with correct IDs`);
  
  const allTeams = new Map(); // Use Map to avoid duplicates
  let totalNewTeams = 0;
  
  for (const league of leagues) {
    try {
      console.log(`\n🔍 Getting teams from matches for: ${league.name} (ID: ${league.id})`);
      
      // Get ALL matches for this league to extract teams
      const matches = await callSoccerApi(`matches?leagueId=${league.id}&limit=200`);
      console.log(`   📅 Found ${matches.length} matches`);
      
      // Extract unique teams from matches
      matches.forEach(match => {
        if (match.homeTeam?.id && match.homeTeam?.name) {
          allTeams.set(match.homeTeam.id, {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logo: match.homeTeam.logo || '',
            short_name: match.homeTeam.shortName || match.homeTeam.name,
            league_id: league.id,
            country: league.name.includes('Premier League') ? 'England' : 
                     league.name.includes('La Liga') ? 'Spain' :
                     league.name.includes('Serie A') ? 'Italy' :
                     league.name.includes('Bundesliga') ? 'Germany' :
                     league.name.includes('Ligue 1') ? 'France' : ''
          });
        }
        
        if (match.awayTeam?.id && match.awayTeam?.name) {
          allTeams.set(match.awayTeam.id, {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logo: match.awayTeam.logo || '',
            short_name: match.awayTeam.shortName || match.awayTeam.name,
            league_id: league.id,
            country: league.name.includes('Premier League') ? 'England' : 
                     league.name.includes('La Liga') ? 'Spain' :
                     league.name.includes('Serie A') ? 'Italy' :
                     league.name.includes('Bundesliga') ? 'Germany' :
                     league.name.includes('Ligue 1') ? 'France' : ''
          });
        }
      });
      
      console.log(`   👥 Extracted ${[...allTeams.values()].filter(t => t.league_id === league.id).length} teams`);
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error for ${league.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Total unique teams found: ${allTeams.size}`);
  
  // Now sync only these relevant teams
  let newTeamsCount = 0;
  let updatedTeamsCount = 0;
  
  for (const team of allTeams.values()) {
    try {
      // Check if team already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('id', team.id)
        .single();
      
      if (!existingTeam) {
        // Insert new team
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
          newTeamsCount++;
          if (newTeamsCount <= 10) {
            console.log(`   ✅ Added: ${team.name} (${team.country})`);
          }
        }
      } else {
        // Update existing team
        const { error: updateError } = await supabase
          .from('teams')
          .update({
            name: team.name,
            logo: team.logo,
            short_name: team.short_name,
            league_id: team.league_id,
            country: team.country,
            api_data: team
          })
          .eq('id', team.id);
        
        if (!updateError) {
          updatedTeamsCount++;
        }
      }
    } catch (teamError) {
      console.log(`   ❌ Error processing team ${team.name}: ${teamError.message}`);
    }
  }
  
  console.log(`\n🎯 STEP 1 RESULTS: Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
  totalNewTeams = newTeamsCount;
  
  return totalNewTeams;
}

async function syncAllMatchesWithCorrectIds() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES WITH CORRECT LEAGUE IDS');
  console.log('='.repeat(70));
  
  // Get our leagues with correct IDs
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name');
  
  if (error) throw new Error(`Database error: ${error.message}`);
  
  let totalNewMatches = 0;
  
  for (const league of leagues) {
    try {
      console.log(`\n🔍 Syncing matches for: ${league.name} (ID: ${league.id})`);
      
      // Get ALL matches for this league
      const matches = await callSoccerApi(`matches?leagueId=${league.id}&limit=500`);
      console.log(`   📡 Found ${matches.length} matches from API`);
      
      let newMatchesCount = 0;
      let updatedMatchesCount = 0;
      
      for (const match of matches) {
        try {
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
              newMatchesCount++;
            }
          } else {
            // Update existing match
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                match_date: match.date,
                match_time: match.time,
                status: match.status || 'scheduled',
                home_score: match.score?.home || null,
                away_score: match.score?.away || null,
                venue: match.venue?.name || null,
                round: match.round || null,
                season: match.season || '2024',
                api_data: match
              })
              .eq('id', match.id);
            
            if (!updateError) {
              updatedMatchesCount++;
            }
          }
        } catch (matchError) {
          console.log(`   ❌ Error processing match: ${matchError.message}`);
        }
      }
      
      console.log(`   ✅ Added ${newMatchesCount} new matches, updated ${updatedMatchesCount} matches`);
      totalNewMatches += newMatchesCount;
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error syncing matches for ${league.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 STEP 2 RESULTS: Added ${totalNewMatches} new matches total`);
  return totalNewMatches;
}

async function generateCorrectReport() {
  console.log('\n📊 CORRECT SYNC REPORT');
  console.log('='.repeat(60));
  
  try {
    // Get counts by league
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name');
    
    console.log('🎯 DATABASE TOTALS BY LEAGUE:');
    
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
    
    // Overall totals
    const [
      { count: totalTeams },
      { count: totalMatches },
      { count: totalHighlights }
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('highlights').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`\n🏆 OVERALL TOTALS:`);
    console.log(`   👥 Teams: ${totalTeams}`);
    console.log(`   ⚽ Matches: ${totalMatches}`);
    console.log(`   🎬 Highlights: ${totalHighlights}`);
    
    console.log('\n✅ CORRECT SYNC COMPLETE!');
    console.log('🎯 Database now contains only relevant teams and matches!');
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCorrectSync() {
  console.log('🚀 STARTING CORRECT LEAGUE SYNC');
  console.log('='.repeat(80));
  console.log('🎯 This will sync ONLY relevant teams and matches for our 5 leagues');
  console.log('📊 Using correct league IDs from our database');
  console.log('');
  
  const startTime = Date.now();
  
  // Run correct sync steps
  const newTeams = await syncTeamsFromMatches();
  const newMatches = await syncAllMatchesWithCorrectIds();
  await generateCorrectReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log(`📈 Added ${newTeams} teams and ${newMatches} matches`);
  console.log('🎉 CORRECT SYNC FINISHED!');
}

runCorrectSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RATE_LIMIT_DELAY = 1200;

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
  
  const result = await response.json();
  return result.data || result;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncTeamsFromMatches() {
  console.log('🔄 STEP 1: SYNCING TEAMS FROM MATCHES (CORRECT APPROACH)');
  console.log('='.repeat(70));
  
  // Get our actual league IDs from database
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name');
  
  if (error) throw new Error(`Database error: ${error.message}`);
  
  console.log(`📋 Found ${leagues.length} leagues with correct IDs`);
  
  const allTeams = new Map(); // Use Map to avoid duplicates
  let totalNewTeams = 0;
  
  for (const league of leagues) {
    try {
      console.log(`\n🔍 Getting teams from matches for: ${league.name} (ID: ${league.id})`);
      
      // Get ALL matches for this league to extract teams
      const matches = await callSoccerApi(`matches?leagueId=${league.id}&limit=200`);
      console.log(`   📅 Found ${matches.length} matches`);
      
      // Extract unique teams from matches
      matches.forEach(match => {
        if (match.homeTeam?.id && match.homeTeam?.name) {
          allTeams.set(match.homeTeam.id, {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logo: match.homeTeam.logo || '',
            short_name: match.homeTeam.shortName || match.homeTeam.name,
            league_id: league.id,
            country: league.name.includes('Premier League') ? 'England' : 
                     league.name.includes('La Liga') ? 'Spain' :
                     league.name.includes('Serie A') ? 'Italy' :
                     league.name.includes('Bundesliga') ? 'Germany' :
                     league.name.includes('Ligue 1') ? 'France' : ''
          });
        }
        
        if (match.awayTeam?.id && match.awayTeam?.name) {
          allTeams.set(match.awayTeam.id, {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logo: match.awayTeam.logo || '',
            short_name: match.awayTeam.shortName || match.awayTeam.name,
            league_id: league.id,
            country: league.name.includes('Premier League') ? 'England' : 
                     league.name.includes('La Liga') ? 'Spain' :
                     league.name.includes('Serie A') ? 'Italy' :
                     league.name.includes('Bundesliga') ? 'Germany' :
                     league.name.includes('Ligue 1') ? 'France' : ''
          });
        }
      });
      
      console.log(`   👥 Extracted ${[...allTeams.values()].filter(t => t.league_id === league.id).length} teams`);
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error for ${league.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Total unique teams found: ${allTeams.size}`);
  
  // Now sync only these relevant teams
  let newTeamsCount = 0;
  let updatedTeamsCount = 0;
  
  for (const team of allTeams.values()) {
    try {
      // Check if team already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('id', team.id)
        .single();
      
      if (!existingTeam) {
        // Insert new team
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
          newTeamsCount++;
          if (newTeamsCount <= 10) {
            console.log(`   ✅ Added: ${team.name} (${team.country})`);
          }
        }
      } else {
        // Update existing team
        const { error: updateError } = await supabase
          .from('teams')
          .update({
            name: team.name,
            logo: team.logo,
            short_name: team.short_name,
            league_id: team.league_id,
            country: team.country,
            api_data: team
          })
          .eq('id', team.id);
        
        if (!updateError) {
          updatedTeamsCount++;
        }
      }
    } catch (teamError) {
      console.log(`   ❌ Error processing team ${team.name}: ${teamError.message}`);
    }
  }
  
  console.log(`\n🎯 STEP 1 RESULTS: Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
  totalNewTeams = newTeamsCount;
  
  return totalNewTeams;
}

async function syncAllMatchesWithCorrectIds() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES WITH CORRECT LEAGUE IDS');
  console.log('='.repeat(70));
  
  // Get our leagues with correct IDs
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name')
    .order('name');
  
  if (error) throw new Error(`Database error: ${error.message}`);
  
  let totalNewMatches = 0;
  
  for (const league of leagues) {
    try {
      console.log(`\n🔍 Syncing matches for: ${league.name} (ID: ${league.id})`);
      
      // Get ALL matches for this league
      const matches = await callSoccerApi(`matches?leagueId=${league.id}&limit=500`);
      console.log(`   📡 Found ${matches.length} matches from API`);
      
      let newMatchesCount = 0;
      let updatedMatchesCount = 0;
      
      for (const match of matches) {
        try {
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
              newMatchesCount++;
            }
          } else {
            // Update existing match
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                match_date: match.date,
                match_time: match.time,
                status: match.status || 'scheduled',
                home_score: match.score?.home || null,
                away_score: match.score?.away || null,
                venue: match.venue?.name || null,
                round: match.round || null,
                season: match.season || '2024',
                api_data: match
              })
              .eq('id', match.id);
            
            if (!updateError) {
              updatedMatchesCount++;
            }
          }
        } catch (matchError) {
          console.log(`   ❌ Error processing match: ${matchError.message}`);
        }
      }
      
      console.log(`   ✅ Added ${newMatchesCount} new matches, updated ${updatedMatchesCount} matches`);
      totalNewMatches += newMatchesCount;
      
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`   ❌ Error syncing matches for ${league.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 STEP 2 RESULTS: Added ${totalNewMatches} new matches total`);
  return totalNewMatches;
}

async function generateCorrectReport() {
  console.log('\n📊 CORRECT SYNC REPORT');
  console.log('='.repeat(60));
  
  try {
    // Get counts by league
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name');
    
    console.log('🎯 DATABASE TOTALS BY LEAGUE:');
    
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
    
    // Overall totals
    const [
      { count: totalTeams },
      { count: totalMatches },
      { count: totalHighlights }
    ] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('highlights').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`\n🏆 OVERALL TOTALS:`);
    console.log(`   👥 Teams: ${totalTeams}`);
    console.log(`   ⚽ Matches: ${totalMatches}`);
    console.log(`   🎬 Highlights: ${totalHighlights}`);
    
    console.log('\n✅ CORRECT SYNC COMPLETE!');
    console.log('🎯 Database now contains only relevant teams and matches!');
    
  } catch (error) {
    console.log(`❌ Error generating report: ${error.message}`);
  }
}

async function runCorrectSync() {
  console.log('🚀 STARTING CORRECT LEAGUE SYNC');
  console.log('='.repeat(80));
  console.log('🎯 This will sync ONLY relevant teams and matches for our 5 leagues');
  console.log('📊 Using correct league IDs from our database');
  console.log('');
  
  const startTime = Date.now();
  
  // Run correct sync steps
  const newTeams = await syncTeamsFromMatches();
  const newMatches = await syncAllMatchesWithCorrectIds();
  await generateCorrectReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log(`📈 Added ${newTeams} teams and ${newMatches} matches`);
  console.log('🎉 CORRECT SYNC FINISHED!');
}

runCorrectSync(); 