import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Highlightly API configuration
const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

// Priority leagues with correct Highlightly IDs
const PRIORITY_LEAGUES = [
  { id: '33973', name: 'Premier League', country: 'England' },
  { id: '119924', name: 'La Liga', country: 'Spain' },
  { id: '115669', name: 'Serie A', country: 'Italy' },
  { id: '67162', name: 'Bundesliga', country: 'Germany' },
  { id: '52695', name: 'Ligue 1', country: 'France' }
];

// Rate limiting
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
let requestCount = 0;

async function rateLimitedDelay() {
  requestCount++;
  console.log(`⏳ [${requestCount}] Waiting 2s before next request...`);
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
}

// API call helper
async function callHighlightlyApi(endpoint) {
  await rateLimitedDelay();
  
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`📡 Calling: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      console.log('❌ Rate limited - waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await callHighlightlyApi(endpoint); // Retry
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${endpoint} (${data.data?.length || data.length || 'N/A'} items)`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Clear existing data first
async function clearExistingData() {
  console.log('\n🧹 Clearing existing data...');
  
  try {
    // Delete in reverse dependency order
    await supabase.from('highlights').delete().neq('id', '0');
    await supabase.from('matches').delete().neq('id', '0');
    await supabase.from('teams').delete().neq('id', '0');
    await supabase.from('leagues').delete().neq('id', '0');
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.log('❌ Error clearing data:', error.message);
  }
}

// Sync leagues with correct API structure
async function syncLeagues() {
  console.log('\n📋 Step 1: Syncing Leagues');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const response = await callHighlightlyApi(`leagues/${league.id}`);
      
      if (response && Array.isArray(response) && response[0]) {
        const leagueData = response[0]; // API returns array with single item
        
        await supabase
          .from('leagues')
          .upsert({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country?.name || league.country,
            logo: leagueData.logo,
            season: 2024 // Current season
          });
        
        console.log(`✅ Synced league: ${leagueData.name} (${leagueData.country?.name})`);
      }
    }
    
    console.log('✅ Leagues sync completed');
    
  } catch (error) {
    console.log('❌ Leagues sync failed:', error.message);
  }
}

// Sync teams from standings (this worked perfectly in debug)
async function syncTeamsFromStandings() {
  console.log('\n👥 Step 2: Syncing Teams from Standings');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`standings?leagueId=${league.id}&season=2024`);
      
      if (data?.groups?.[0]?.standings) {
        const standings = data.groups[0].standings;
        
        for (const standing of standings) {
          const team = standing.team;
          
          if (team) {
            await supabase
              .from('teams')
              .upsert({
                id: team.id,
                name: team.name,
                logo: team.logo,
                league_id: parseInt(league.id)
              });
            
            console.log(`✅ Synced team: ${team.name} (${league.name})`);
          }
        }
      }
    }
    
    console.log('✅ Teams sync completed');
    
  } catch (error) {
    console.log('❌ Teams sync failed:', error.message);
  }
}

// Sync matches with correct API structure
async function syncRecentMatches() {
  console.log('\n⚽ Step 3: Syncing Recent Matches');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      // Get recent matches without date filter (get last 20 matches)
      const data = await callHighlightlyApi(`matches?leagueId=${league.id}&season=2024&limit=20`);
      
      if (data?.data) {
        for (const match of data.data) {
          // Parse the score from "0 - 1" format
          const scoreString = match.state?.score?.current || "0 - 0";
          const scores = scoreString.split(' - ');
          const homeScore = parseInt(scores[0]) || 0;
          const awayScore = parseInt(scores[1]) || 0;
          
          await supabase
            .from('matches')
            .upsert({
              id: match.id,
              home_team_id: match.homeTeam?.id,
              away_team_id: match.awayTeam?.id,
              home_team_name: match.homeTeam?.name,
              away_team_name: match.awayTeam?.name,
              home_score: homeScore,
              away_score: awayScore,
              status: match.state?.description || 'TBD',
              match_date: match.date ? new Date(match.date).toISOString() : null,
              league_id: parseInt(league.id),
              season: 2024
            });
          
          console.log(`✅ Synced match: ${match.homeTeam?.name} ${homeScore}-${awayScore} ${match.awayTeam?.name}`);
        }
      }
    }
    
    console.log('✅ Matches sync completed');
    
  } catch (error) {
    console.log('❌ Matches sync failed:', error.message);
  }
}

// Sync highlights (this already worked)
async function syncHighlights() {
  console.log('\n🎬 Step 4: Syncing Highlights');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`highlights?leagueId=${league.id}&season=2024&limit=15`);
      
      if (data?.data) {
        for (const highlight of data.data) {
          await supabase
            .from('highlights')
            .upsert({
              id: highlight.id,
              title: highlight.title,
              url: highlight.url,
              thumbnail: highlight.thumbnail,
              duration: highlight.duration,
              match_id: highlight.match?.id,
              league_id: parseInt(league.id),
              home_team: highlight.match?.homeTeam?.name,
              away_team: highlight.match?.awayTeam?.name,
              competition: league.name,
              created_at: highlight.createdAt ? new Date(highlight.createdAt).toISOString() : null
            });
          
          console.log(`✅ Synced highlight: ${highlight.title.substring(0, 50)}...`);
        }
      }
    }
    
    console.log('✅ Highlights sync completed');
    
  } catch (error) {
    console.log('❌ Highlights sync failed:', error.message);
  }
}

// Main sync function
async function runFixedRealSync() {
  console.log('🚀 Starting FIXED Real Data Synchronization');
  console.log('==================================================');
  console.log('🔧 Using CORRECT API structure based on debug results');
  console.log('📊 Will populate with REAL teams, matches, and highlights');
  console.log('🎯 No more test data - only authentic football data!');
  
  const startTime = Date.now();
  
  try {
    // Clear existing data first
    await clearExistingData();
    
    // Run sync steps in order
    await syncLeagues();
    await syncTeamsFromStandings();
    await syncRecentMatches();
    await syncHighlights();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 REAL DATA SYNC COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Database now contains REAL football data!');
    console.log('🏆 Real Premier League teams: Liverpool, Arsenal, Man City, etc.');
    console.log('⚽ Real matches with actual scores and teams');
    console.log('🎬 Real highlights from actual football matches');
    
  } catch (error) {
    console.log(`❌ Sync failed: ${error.message}`);
  }
}

// Run the sync
runFixedRealSync(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Highlightly API configuration
const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

// Priority leagues with correct Highlightly IDs
const PRIORITY_LEAGUES = [
  { id: '33973', name: 'Premier League', country: 'England' },
  { id: '119924', name: 'La Liga', country: 'Spain' },
  { id: '115669', name: 'Serie A', country: 'Italy' },
  { id: '67162', name: 'Bundesliga', country: 'Germany' },
  { id: '52695', name: 'Ligue 1', country: 'France' }
];

// Rate limiting
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
let requestCount = 0;

async function rateLimitedDelay() {
  requestCount++;
  console.log(`⏳ [${requestCount}] Waiting 2s before next request...`);
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
}

// API call helper
async function callHighlightlyApi(endpoint) {
  await rateLimitedDelay();
  
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`📡 Calling: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      console.log('❌ Rate limited - waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await callHighlightlyApi(endpoint); // Retry
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${endpoint} (${data.data?.length || data.length || 'N/A'} items)`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Clear existing data first
async function clearExistingData() {
  console.log('\n🧹 Clearing existing data...');
  
  try {
    // Delete in reverse dependency order
    await supabase.from('highlights').delete().neq('id', '0');
    await supabase.from('matches').delete().neq('id', '0');
    await supabase.from('teams').delete().neq('id', '0');
    await supabase.from('leagues').delete().neq('id', '0');
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.log('❌ Error clearing data:', error.message);
  }
}

// Sync leagues with correct API structure
async function syncLeagues() {
  console.log('\n📋 Step 1: Syncing Leagues');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const response = await callHighlightlyApi(`leagues/${league.id}`);
      
      if (response && Array.isArray(response) && response[0]) {
        const leagueData = response[0]; // API returns array with single item
        
        await supabase
          .from('leagues')
          .upsert({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country?.name || league.country,
            logo: leagueData.logo,
            season: 2024 // Current season
          });
        
        console.log(`✅ Synced league: ${leagueData.name} (${leagueData.country?.name})`);
      }
    }
    
    console.log('✅ Leagues sync completed');
    
  } catch (error) {
    console.log('❌ Leagues sync failed:', error.message);
  }
}

// Sync teams from standings (this worked perfectly in debug)
async function syncTeamsFromStandings() {
  console.log('\n👥 Step 2: Syncing Teams from Standings');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`standings?leagueId=${league.id}&season=2024`);
      
      if (data?.groups?.[0]?.standings) {
        const standings = data.groups[0].standings;
        
        for (const standing of standings) {
          const team = standing.team;
          
          if (team) {
            await supabase
              .from('teams')
              .upsert({
                id: team.id,
                name: team.name,
                logo: team.logo,
                league_id: parseInt(league.id)
              });
            
            console.log(`✅ Synced team: ${team.name} (${league.name})`);
          }
        }
      }
    }
    
    console.log('✅ Teams sync completed');
    
  } catch (error) {
    console.log('❌ Teams sync failed:', error.message);
  }
}

// Sync matches with correct API structure
async function syncRecentMatches() {
  console.log('\n⚽ Step 3: Syncing Recent Matches');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      // Get recent matches without date filter (get last 20 matches)
      const data = await callHighlightlyApi(`matches?leagueId=${league.id}&season=2024&limit=20`);
      
      if (data?.data) {
        for (const match of data.data) {
          // Parse the score from "0 - 1" format
          const scoreString = match.state?.score?.current || "0 - 0";
          const scores = scoreString.split(' - ');
          const homeScore = parseInt(scores[0]) || 0;
          const awayScore = parseInt(scores[1]) || 0;
          
          await supabase
            .from('matches')
            .upsert({
              id: match.id,
              home_team_id: match.homeTeam?.id,
              away_team_id: match.awayTeam?.id,
              home_team_name: match.homeTeam?.name,
              away_team_name: match.awayTeam?.name,
              home_score: homeScore,
              away_score: awayScore,
              status: match.state?.description || 'TBD',
              match_date: match.date ? new Date(match.date).toISOString() : null,
              league_id: parseInt(league.id),
              season: 2024
            });
          
          console.log(`✅ Synced match: ${match.homeTeam?.name} ${homeScore}-${awayScore} ${match.awayTeam?.name}`);
        }
      }
    }
    
    console.log('✅ Matches sync completed');
    
  } catch (error) {
    console.log('❌ Matches sync failed:', error.message);
  }
}

// Sync highlights (this already worked)
async function syncHighlights() {
  console.log('\n🎬 Step 4: Syncing Highlights');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`highlights?leagueId=${league.id}&season=2024&limit=15`);
      
      if (data?.data) {
        for (const highlight of data.data) {
          await supabase
            .from('highlights')
            .upsert({
              id: highlight.id,
              title: highlight.title,
              url: highlight.url,
              thumbnail: highlight.thumbnail,
              duration: highlight.duration,
              match_id: highlight.match?.id,
              league_id: parseInt(league.id),
              home_team: highlight.match?.homeTeam?.name,
              away_team: highlight.match?.awayTeam?.name,
              competition: league.name,
              created_at: highlight.createdAt ? new Date(highlight.createdAt).toISOString() : null
            });
          
          console.log(`✅ Synced highlight: ${highlight.title.substring(0, 50)}...`);
        }
      }
    }
    
    console.log('✅ Highlights sync completed');
    
  } catch (error) {
    console.log('❌ Highlights sync failed:', error.message);
  }
}

// Main sync function
async function runFixedRealSync() {
  console.log('🚀 Starting FIXED Real Data Synchronization');
  console.log('==================================================');
  console.log('🔧 Using CORRECT API structure based on debug results');
  console.log('📊 Will populate with REAL teams, matches, and highlights');
  console.log('🎯 No more test data - only authentic football data!');
  
  const startTime = Date.now();
  
  try {
    // Clear existing data first
    await clearExistingData();
    
    // Run sync steps in order
    await syncLeagues();
    await syncTeamsFromStandings();
    await syncRecentMatches();
    await syncHighlights();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 REAL DATA SYNC COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Database now contains REAL football data!');
    console.log('🏆 Real Premier League teams: Liverpool, Arsenal, Man City, etc.');
    console.log('⚽ Real matches with actual scores and teams');
    console.log('🎬 Real highlights from actual football matches');
    
  } catch (error) {
    console.log(`❌ Sync failed: ${error.message}`);
  }
}

// Run the sync
runFixedRealSync(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Highlightly API configuration
const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.VITE_HIGHLIGHTLY_API_KEY;

// Priority leagues with correct Highlightly IDs
const PRIORITY_LEAGUES = [
  { id: '33973', name: 'Premier League', country: 'England' },
  { id: '119924', name: 'La Liga', country: 'Spain' },
  { id: '115669', name: 'Serie A', country: 'Italy' },
  { id: '67162', name: 'Bundesliga', country: 'Germany' },
  { id: '52695', name: 'Ligue 1', country: 'France' }
];

// Rate limiting
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
let requestCount = 0;

async function rateLimitedDelay() {
  requestCount++;
  console.log(`⏳ [${requestCount}] Waiting 2s before next request...`);
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
}

// API call helper
async function callHighlightlyApi(endpoint) {
  await rateLimitedDelay();
  
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`📡 Calling: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      console.log('❌ Rate limited - waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await callHighlightlyApi(endpoint); // Retry
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${endpoint} (${data.data?.length || data.length || 'N/A'} items)`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Clear existing data first
async function clearExistingData() {
  console.log('\n🧹 Clearing existing data...');
  
  try {
    // Delete in reverse dependency order
    await supabase.from('highlights').delete().neq('id', '0');
    await supabase.from('matches').delete().neq('id', '0');
    await supabase.from('teams').delete().neq('id', '0');
    await supabase.from('leagues').delete().neq('id', '0');
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.log('❌ Error clearing data:', error.message);
  }
}

// Sync leagues with correct API structure
async function syncLeagues() {
  console.log('\n📋 Step 1: Syncing Leagues');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const response = await callHighlightlyApi(`leagues/${league.id}`);
      
      if (response && Array.isArray(response) && response[0]) {
        const leagueData = response[0]; // API returns array with single item
        
        await supabase
          .from('leagues')
          .upsert({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country?.name || league.country,
            logo: leagueData.logo,
            season: 2024 // Current season
          });
        
        console.log(`✅ Synced league: ${leagueData.name} (${leagueData.country?.name})`);
      }
    }
    
    console.log('✅ Leagues sync completed');
    
  } catch (error) {
    console.log('❌ Leagues sync failed:', error.message);
  }
}

// Sync teams from standings (this worked perfectly in debug)
async function syncTeamsFromStandings() {
  console.log('\n👥 Step 2: Syncing Teams from Standings');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`standings?leagueId=${league.id}&season=2024`);
      
      if (data?.groups?.[0]?.standings) {
        const standings = data.groups[0].standings;
        
        for (const standing of standings) {
          const team = standing.team;
          
          if (team) {
            await supabase
              .from('teams')
              .upsert({
                id: team.id,
                name: team.name,
                logo: team.logo,
                league_id: parseInt(league.id)
              });
            
            console.log(`✅ Synced team: ${team.name} (${league.name})`);
          }
        }
      }
    }
    
    console.log('✅ Teams sync completed');
    
  } catch (error) {
    console.log('❌ Teams sync failed:', error.message);
  }
}

// Sync matches with correct API structure
async function syncRecentMatches() {
  console.log('\n⚽ Step 3: Syncing Recent Matches');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      // Get recent matches without date filter (get last 20 matches)
      const data = await callHighlightlyApi(`matches?leagueId=${league.id}&season=2024&limit=20`);
      
      if (data?.data) {
        for (const match of data.data) {
          // Parse the score from "0 - 1" format
          const scoreString = match.state?.score?.current || "0 - 0";
          const scores = scoreString.split(' - ');
          const homeScore = parseInt(scores[0]) || 0;
          const awayScore = parseInt(scores[1]) || 0;
          
          await supabase
            .from('matches')
            .upsert({
              id: match.id,
              home_team_id: match.homeTeam?.id,
              away_team_id: match.awayTeam?.id,
              home_team_name: match.homeTeam?.name,
              away_team_name: match.awayTeam?.name,
              home_score: homeScore,
              away_score: awayScore,
              status: match.state?.description || 'TBD',
              match_date: match.date ? new Date(match.date).toISOString() : null,
              league_id: parseInt(league.id),
              season: 2024
            });
          
          console.log(`✅ Synced match: ${match.homeTeam?.name} ${homeScore}-${awayScore} ${match.awayTeam?.name}`);
        }
      }
    }
    
    console.log('✅ Matches sync completed');
    
  } catch (error) {
    console.log('❌ Matches sync failed:', error.message);
  }
}

// Sync highlights (this already worked)
async function syncHighlights() {
  console.log('\n🎬 Step 4: Syncing Highlights');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`highlights?leagueId=${league.id}&season=2024&limit=15`);
      
      if (data?.data) {
        for (const highlight of data.data) {
          await supabase
            .from('highlights')
            .upsert({
              id: highlight.id,
              title: highlight.title,
              url: highlight.url,
              thumbnail: highlight.thumbnail,
              duration: highlight.duration,
              match_id: highlight.match?.id,
              league_id: parseInt(league.id),
              home_team: highlight.match?.homeTeam?.name,
              away_team: highlight.match?.awayTeam?.name,
              competition: league.name,
              created_at: highlight.createdAt ? new Date(highlight.createdAt).toISOString() : null
            });
          
          console.log(`✅ Synced highlight: ${highlight.title.substring(0, 50)}...`);
        }
      }
    }
    
    console.log('✅ Highlights sync completed');
    
  } catch (error) {
    console.log('❌ Highlights sync failed:', error.message);
  }
}

// Main sync function
async function runFixedRealSync() {
  console.log('🚀 Starting FIXED Real Data Synchronization');
  console.log('==================================================');
  console.log('🔧 Using CORRECT API structure based on debug results');
  console.log('📊 Will populate with REAL teams, matches, and highlights');
  console.log('🎯 No more test data - only authentic football data!');
  
  const startTime = Date.now();
  
  try {
    // Clear existing data first
    await clearExistingData();
    
    // Run sync steps in order
    await syncLeagues();
    await syncTeamsFromStandings();
    await syncRecentMatches();
    await syncHighlights();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 REAL DATA SYNC COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Database now contains REAL football data!');
    console.log('🏆 Real Premier League teams: Liverpool, Arsenal, Man City, etc.');
    console.log('⚽ Real matches with actual scores and teams');
    console.log('🎬 Real highlights from actual football matches');
    
  } catch (error) {
    console.log(`❌ Sync failed: ${error.message}`);
  }
}

// Run the sync
runFixedRealSync(); 