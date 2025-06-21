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
  
  // The API returns { data: [], plan: {}, pagination: {} }
  // We want the data array
  return result.data || result;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncAllTeams() {
  console.log('🔄 STEP 1: SYNCING ALL TEAMS');
  console.log('='.repeat(70));
  
  try {
    console.log('📡 Getting ALL teams from API...');
    
    // Get ALL teams (the teams endpoint gives us all teams across leagues)
    const teamsData = await callSoccerApi('teams?limit=500');
    
    if (teamsData && teamsData.length > 0) {
      console.log(`   📋 Found ${teamsData.length} teams from API`);
      
      let newTeamsCount = 0;
      let updatedTeamsCount = 0;
      
      for (const team of teamsData) {
        try {
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
                league_id: team.leagueId || null, // Use the leagueId from team data
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
                league_id: team.leagueId || null,
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
        } catch (teamError) {
          console.log(`   ❌ Error processing team ${team.name}: ${teamError.message}`);
        }
      }
      
      console.log(`✅ Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
    }
    
  } catch (error) {
    console.log(`❌ Error in syncAllTeams: ${error.message}`);
  }
}

async function syncAllMatchesForAllLeagues() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES FOR ALL LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues from our database
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL matches for: ${league.name}`);
        
        // Get ALL matches from API for this league
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=500`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          let updatedMatchesCount = 0;
          
          for (const match of matchesData) {
            try {
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
            } catch (matchError) {
              console.log(`   ❌ Error processing match: ${matchError.message}`);
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

async function syncDetailedDataBatch() {
  console.log('\n🔄 STEP 3: SYNCING DETAILED DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    // Get matches without detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
      .limit(50)
      .order('id');
    
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
          await delay(8000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${updatedCount} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncDetailedDataBatch: ${error.message}`);
  }
}

async function syncLineupDataBatch() {
  console.log('\n🔄 STEP 4: SYNCING LINEUP DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    // Get matches without lineup data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .is('api_data->lineups', null)
      .limit(50)
      .order('id');
    
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
          await delay(8000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Updated ${updatedCount} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncLineupDataBatch: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 FINAL SYNC REPORT');
  console.log('='.repeat(60));
  
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
    
    console.log('🎯 DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    // Get sample data to verify quality
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(3);
    
    if (sampleMatches && sampleMatches.length > 0) {
      console.log('\n🏆 SAMPLE DATA QUALITY:');
      sampleMatches.forEach(match => {
        const lineups = match.api_data?.lineups;
        const events = match.api_data?.events;
        
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
        console.log(`     Events: ${events?.length || 0}`);
      });
    }
    
    console.log('\n✅ SYNC COMPLETE!');
    console.log('🚀 Database now contains comprehensive football data!');
    
  } catch (error) {
    console.log(`❌ Error generating final report: ${error.message}`);
  }
}

async function runFixedCompleteSync() {
  console.log('🚀 STARTING FIXED COMPLETE SEASON SYNC');
  console.log('='.repeat(80));
  console.log('🔧 Using correct soccer API structure');
  console.log('📊 This will sync: ALL teams, ALL matches, detailed data, lineups');
  console.log('');
  
  const startTime = Date.now();
  
  // Run sync steps
  await syncAllTeams();
  await syncAllMatchesForAllLeagues();
  await syncDetailedDataBatch();
  await syncLineupDataBatch();
  await generateFinalReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 FIXED COMPLETE SYNC FINISHED!');
}

runFixedCompleteSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between API calls

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
  
  // The API returns { data: [], plan: {}, pagination: {} }
  // We want the data array
  return result.data || result;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncAllTeams() {
  console.log('🔄 STEP 1: SYNCING ALL TEAMS');
  console.log('='.repeat(70));
  
  try {
    console.log('📡 Getting ALL teams from API...');
    
    // Get ALL teams (the teams endpoint gives us all teams across leagues)
    const teamsData = await callSoccerApi('teams?limit=500');
    
    if (teamsData && teamsData.length > 0) {
      console.log(`   📋 Found ${teamsData.length} teams from API`);
      
      let newTeamsCount = 0;
      let updatedTeamsCount = 0;
      
      for (const team of teamsData) {
        try {
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
                league_id: team.leagueId || null, // Use the leagueId from team data
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
                league_id: team.leagueId || null,
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
        } catch (teamError) {
          console.log(`   ❌ Error processing team ${team.name}: ${teamError.message}`);
        }
      }
      
      console.log(`✅ Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
    }
    
  } catch (error) {
    console.log(`❌ Error in syncAllTeams: ${error.message}`);
  }
}

async function syncAllMatchesForAllLeagues() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES FOR ALL LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues from our database
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL matches for: ${league.name}`);
        
        // Get ALL matches from API for this league
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=500`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          let updatedMatchesCount = 0;
          
          for (const match of matchesData) {
            try {
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
            } catch (matchError) {
              console.log(`   ❌ Error processing match: ${matchError.message}`);
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

async function syncDetailedDataBatch() {
  console.log('\n🔄 STEP 3: SYNCING DETAILED DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    // Get matches without detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
      .limit(50)
      .order('id');
    
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
          await delay(8000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${updatedCount} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncDetailedDataBatch: ${error.message}`);
  }
}

async function syncLineupDataBatch() {
  console.log('\n🔄 STEP 4: SYNCING LINEUP DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    // Get matches without lineup data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .is('api_data->lineups', null)
      .limit(50)
      .order('id');
    
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
          await delay(8000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Updated ${updatedCount} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncLineupDataBatch: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 FINAL SYNC REPORT');
  console.log('='.repeat(60));
  
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
    
    console.log('🎯 DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    // Get sample data to verify quality
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(3);
    
    if (sampleMatches && sampleMatches.length > 0) {
      console.log('\n🏆 SAMPLE DATA QUALITY:');
      sampleMatches.forEach(match => {
        const lineups = match.api_data?.lineups;
        const events = match.api_data?.events;
        
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
        console.log(`     Events: ${events?.length || 0}`);
      });
    }
    
    console.log('\n✅ SYNC COMPLETE!');
    console.log('🚀 Database now contains comprehensive football data!');
    
  } catch (error) {
    console.log(`❌ Error generating final report: ${error.message}`);
  }
}

async function runFixedCompleteSync() {
  console.log('🚀 STARTING FIXED COMPLETE SEASON SYNC');
  console.log('='.repeat(80));
  console.log('🔧 Using correct soccer API structure');
  console.log('📊 This will sync: ALL teams, ALL matches, detailed data, lineups');
  console.log('');
  
  const startTime = Date.now();
  
  // Run sync steps
  await syncAllTeams();
  await syncAllMatchesForAllLeagues();
  await syncDetailedDataBatch();
  await syncLineupDataBatch();
  await generateFinalReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 FIXED COMPLETE SYNC FINISHED!');
}

runFixedCompleteSync(); 
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between API calls

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
  
  // The API returns { data: [], plan: {}, pagination: {} }
  // We want the data array
  return result.data || result;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncAllTeams() {
  console.log('🔄 STEP 1: SYNCING ALL TEAMS');
  console.log('='.repeat(70));
  
  try {
    console.log('📡 Getting ALL teams from API...');
    
    // Get ALL teams (the teams endpoint gives us all teams across leagues)
    const teamsData = await callSoccerApi('teams?limit=500');
    
    if (teamsData && teamsData.length > 0) {
      console.log(`   📋 Found ${teamsData.length} teams from API`);
      
      let newTeamsCount = 0;
      let updatedTeamsCount = 0;
      
      for (const team of teamsData) {
        try {
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
                league_id: team.leagueId || null, // Use the leagueId from team data
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
                league_id: team.leagueId || null,
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
        } catch (teamError) {
          console.log(`   ❌ Error processing team ${team.name}: ${teamError.message}`);
        }
      }
      
      console.log(`✅ Added ${newTeamsCount} new teams, updated ${updatedTeamsCount} teams`);
    }
    
  } catch (error) {
    console.log(`❌ Error in syncAllTeams: ${error.message}`);
  }
}

async function syncAllMatchesForAllLeagues() {
  console.log('\n🔄 STEP 2: SYNCING ALL MATCHES FOR ALL LEAGUES');
  console.log('='.repeat(70));
  
  try {
    // Get all leagues from our database
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');
    
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`📋 Found ${leagues.length} leagues to sync matches for`);
    
    let totalNewMatches = 0;
    
    for (const league of leagues) {
      try {
        console.log(`\n🔍 Syncing ALL matches for: ${league.name}`);
        
        // Get ALL matches from API for this league
        const matchesData = await callSoccerApi(`matches?leagueId=${league.id}&limit=500`);
        
        if (matchesData && matchesData.length > 0) {
          console.log(`   📡 Found ${matchesData.length} matches from API`);
          
          let newMatchesCount = 0;
          let updatedMatchesCount = 0;
          
          for (const match of matchesData) {
            try {
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
            } catch (matchError) {
              console.log(`   ❌ Error processing match: ${matchError.message}`);
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

async function syncDetailedDataBatch() {
  console.log('\n🔄 STEP 3: SYNCING DETAILED DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    // Get matches without detailed data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .or('api_data->events.is.null,api_data->statistics.is.null,api_data->venue.is.null')
      .limit(50)
      .order('id');
    
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
          await delay(8000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 3 RESULTS: Updated ${updatedCount} matches with detailed data`);
    
  } catch (error) {
    console.log(`❌ Error in syncDetailedDataBatch: ${error.message}`);
  }
}

async function syncLineupDataBatch() {
  console.log('\n🔄 STEP 4: SYNCING LINEUP DATA FOR ALL MATCHES');
  console.log('='.repeat(70));
  
  try {
    // Get matches without lineup data
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), api_data')
      .is('api_data->lineups', null)
      .limit(50)
      .order('id');
    
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
          await delay(8000);
        }
      }
    }
    
    console.log(`\n🎯 STEP 4 RESULTS: Updated ${updatedCount} matches with lineup data`);
    
  } catch (error) {
    console.log(`❌ Error in syncLineupDataBatch: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 FINAL SYNC REPORT');
  console.log('='.repeat(60));
  
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
    
    console.log('🎯 DATABASE TOTALS:');
    console.log(`   📊 Leagues: ${leaguesCount}`);
    console.log(`   👥 Teams: ${teamsCount}`);
    console.log(`   ⚽ Matches: ${matchesCount}`);
    console.log(`   🎬 Highlights: ${highlightsCount}`);
    
    // Get sample data to verify quality
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        api_data
      `)
      .not('api_data->lineups', 'is', null)
      .limit(3);
    
    if (sampleMatches && sampleMatches.length > 0) {
      console.log('\n🏆 SAMPLE DATA QUALITY:');
      sampleMatches.forEach(match => {
        const lineups = match.api_data?.lineups;
        const events = match.api_data?.events;
        
        console.log(`   • ${match.home_team?.name} vs ${match.away_team?.name}`);
        console.log(`     Formations: ${lineups?.homeTeam?.formation} vs ${lineups?.awayTeam?.formation}`);
        console.log(`     Events: ${events?.length || 0}`);
      });
    }
    
    console.log('\n✅ SYNC COMPLETE!');
    console.log('🚀 Database now contains comprehensive football data!');
    
  } catch (error) {
    console.log(`❌ Error generating final report: ${error.message}`);
  }
}

async function runFixedCompleteSync() {
  console.log('🚀 STARTING FIXED COMPLETE SEASON SYNC');
  console.log('='.repeat(80));
  console.log('🔧 Using correct soccer API structure');
  console.log('📊 This will sync: ALL teams, ALL matches, detailed data, lineups');
  console.log('');
  
  const startTime = Date.now();
  
  // Run sync steps
  await syncAllTeams();
  await syncAllMatchesForAllLeagues();
  await syncDetailedDataBatch();
  await syncLineupDataBatch();
  await generateFinalReport();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
  
  console.log(`\n⏱️  Total sync time: ${duration} minutes`);
  console.log('🎉 FIXED COMPLETE SYNC FINISHED!');
}

runFixedCompleteSync(); 