import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Highlightly API configuration (CORRECT ENDPOINT)
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

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  batchSize: 5,
  delayBetweenBatches: 2000, // 2 seconds
  delayBetweenRequests: 2000 // 2 seconds between individual requests
};

let requestCount = 0;
let requestStartTime = Date.now();

// Rate limiting helper
async function rateLimitedDelay() {
  requestCount++;
  
  // Reset counter every minute
  const now = Date.now();
  if (now - requestStartTime > 60000) {
    requestCount = 1;
    requestStartTime = now;
  }
  
  // If we've hit the rate limit, wait until next minute
  if (requestCount > RATE_LIMIT.requestsPerMinute) {
    const waitTime = 60000 - (now - requestStartTime) + 1000; // Add 1 second buffer
    console.log(`⏳ Rate limit reached. Waiting ${Math.round(waitTime/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 1;
    requestStartTime = Date.now();
  } else {
    // Regular delay between requests
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
  }
}

// API call helper with error handling
async function callHighlightlyApi(endpoint) {
  await rateLimitedDelay();
  
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`📡 [${requestCount}/30] Calling: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      console.log('❌ Rate limited by API - waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await callHighlightlyApi(endpoint); // Retry
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${endpoint} (${data.data?.length || 'N/A'} items)`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Database helpers
async function updateSyncStatus(entity, status, details = null) {
  await supabase
    .from('sync_status')
    .upsert({
      entity_type: entity,
      last_sync: new Date().toISOString(),
      status: status,
      details: details
    });
}

async function syncLeagues() {
  console.log('\n📋 Step 1: Syncing Leagues');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`leagues/${league.id}`);
      
      if (data?.data) {
        const leagueData = data.data;
        
        await supabase
          .from('leagues')
          .upsert({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country?.name || league.country,
            logo: leagueData.logo,
            season: leagueData.seasons?.[0]?.season || new Date().getFullYear(),
            is_priority: true
          });
        
        console.log(`✅ Synced league: ${leagueData.name}`);
      }
    }
    
    await updateSyncStatus('leagues', 'completed');
    console.log('✅ Leagues sync completed');
    
  } catch (error) {
    console.log('❌ Leagues sync failed:', error.message);
    await updateSyncStatus('leagues', 'failed', error.message);
  }
}

async function syncTeamsForLeagues() {
  console.log('\n👥 Step 2: Syncing Teams');
  console.log('='.repeat(40));
  
  try {
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`standings?leagueId=${league.id}&season=${currentSeason}`);
      
      if (data?.data) {
        for (const standing of data.data) {
          const team = standing.team;
          
          if (team) {
            await supabase
              .from('teams')
              .upsert({
                id: team.id,
                name: team.name,
                logo: team.logo,
                league_id: league.id
              });
            
            console.log(`✅ Synced team: ${team.name} (${league.name})`);
          }
        }
      }
    }
    
    await updateSyncStatus('teams', 'completed');
    console.log('✅ Teams sync completed');
    
  } catch (error) {
    console.log('❌ Teams sync failed:', error.message);
    await updateSyncStatus('teams', 'failed', error.message);
  }
}

async function syncRecentMatches() {
  console.log('\n⚽ Step 3: Syncing Recent Matches');
  console.log('='.repeat(40));
  
  try {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      // Get matches from the last 3 days
      for (let i = 0; i < 3; i++) {
        const date = new Date(threeDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const data = await callHighlightlyApi(`matches?leagueId=${league.id}&date=${dateStr}&season=${currentSeason}`);
        
        if (data?.data) {
          for (const match of data.data) {
            await supabase
              .from('matches')
              .upsert({
                id: match.id,
                home_team_id: match.homeTeam?.id,
                away_team_id: match.awayTeam?.id,
                home_team_name: match.homeTeam?.name,
                away_team_name: match.awayTeam?.name,
                home_score: match.homeScore?.current || 0,
                away_score: match.awayScore?.current || 0,
                status: match.status?.short || 'TBD',
                match_date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : null,
                league_id: league.id,
                season: currentSeason
              });
            
            console.log(`✅ Synced match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
          }
        }
      }
    }
    
    await updateSyncStatus('matches', 'completed');
    console.log('✅ Matches sync completed');
    
  } catch (error) {
    console.log('❌ Matches sync failed:', error.message);
    await updateSyncStatus('matches', 'failed', error.message);
  }
}

async function syncHighlights() {
  console.log('\n🎬 Step 4: Syncing Highlights');
  console.log('='.repeat(40));
  
  try {
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`highlights?leagueId=${league.id}&season=${currentSeason}&limit=10`);
      
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
              league_id: league.id,
              home_team: highlight.match?.homeTeam?.name,
              away_team: highlight.match?.awayTeam?.name,
              competition: league.name,
              created_at: highlight.createdAt ? new Date(highlight.createdAt).toISOString() : null
            });
          
          console.log(`✅ Synced highlight: ${highlight.title}`);
        }
      }
    }
    
    await updateSyncStatus('highlights', 'completed');
    console.log('✅ Highlights sync completed');
    
  } catch (error) {
    console.log('❌ Highlights sync failed:', error.message);
    await updateSyncStatus('highlights', 'failed', error.message);
  }
}

// Main sync function
async function runDirectApiSync() {
  console.log('🚀 Starting Direct API Data Synchronization');
  console.log('==================================================');
  console.log('📋 Using FRESH API KEY for real football data');
  console.log('⚡ Organized by dependency: Leagues → Teams → Matches → Highlights');
  console.log('🔒 With careful rate limiting to preserve API quota');
  
  const startTime = Date.now();
  
  try {
    // Test API access first
    console.log(`🔄 [${new Date().toISOString()}] Testing direct API access...`);
    const testData = await callHighlightlyApi('leagues?limit=1');
    
    if (!testData) {
      throw new Error('API not accessible');
    }
    
    console.log(`✅ [${new Date().toISOString()}] API access confirmed!`);
    console.log(`📊 API Plan: ${testData.plan?.tier || 'Unknown'}`);
    
    // Run sync steps in order
    await syncLeagues();
    await syncTeamsForLeagues();
    await syncRecentMatches();
    await syncHighlights();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 SYNC COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Your app now has REAL football data!');
    
  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ${error.message}`);
    console.log('💥 Sync failed:', error.message);
  }
}

// Run the sync
runDirectApiSync(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Highlightly API configuration (CORRECT ENDPOINT)
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

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  batchSize: 5,
  delayBetweenBatches: 2000, // 2 seconds
  delayBetweenRequests: 2000 // 2 seconds between individual requests
};

let requestCount = 0;
let requestStartTime = Date.now();

// Rate limiting helper
async function rateLimitedDelay() {
  requestCount++;
  
  // Reset counter every minute
  const now = Date.now();
  if (now - requestStartTime > 60000) {
    requestCount = 1;
    requestStartTime = now;
  }
  
  // If we've hit the rate limit, wait until next minute
  if (requestCount > RATE_LIMIT.requestsPerMinute) {
    const waitTime = 60000 - (now - requestStartTime) + 1000; // Add 1 second buffer
    console.log(`⏳ Rate limit reached. Waiting ${Math.round(waitTime/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 1;
    requestStartTime = Date.now();
  } else {
    // Regular delay between requests
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
  }
}

// API call helper with error handling
async function callHighlightlyApi(endpoint) {
  await rateLimitedDelay();
  
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`📡 [${requestCount}/30] Calling: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      console.log('❌ Rate limited by API - waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await callHighlightlyApi(endpoint); // Retry
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${endpoint} (${data.data?.length || 'N/A'} items)`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Database helpers
async function updateSyncStatus(entity, status, details = null) {
  await supabase
    .from('sync_status')
    .upsert({
      entity_type: entity,
      last_sync: new Date().toISOString(),
      status: status,
      details: details
    });
}

async function syncLeagues() {
  console.log('\n📋 Step 1: Syncing Leagues');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`leagues/${league.id}`);
      
      if (data?.data) {
        const leagueData = data.data;
        
        await supabase
          .from('leagues')
          .upsert({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country?.name || league.country,
            logo: leagueData.logo,
            season: leagueData.seasons?.[0]?.season || new Date().getFullYear(),
            is_priority: true
          });
        
        console.log(`✅ Synced league: ${leagueData.name}`);
      }
    }
    
    await updateSyncStatus('leagues', 'completed');
    console.log('✅ Leagues sync completed');
    
  } catch (error) {
    console.log('❌ Leagues sync failed:', error.message);
    await updateSyncStatus('leagues', 'failed', error.message);
  }
}

async function syncTeamsForLeagues() {
  console.log('\n👥 Step 2: Syncing Teams');
  console.log('='.repeat(40));
  
  try {
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`standings?leagueId=${league.id}&season=${currentSeason}`);
      
      if (data?.data) {
        for (const standing of data.data) {
          const team = standing.team;
          
          if (team) {
            await supabase
              .from('teams')
              .upsert({
                id: team.id,
                name: team.name,
                logo: team.logo,
                league_id: league.id
              });
            
            console.log(`✅ Synced team: ${team.name} (${league.name})`);
          }
        }
      }
    }
    
    await updateSyncStatus('teams', 'completed');
    console.log('✅ Teams sync completed');
    
  } catch (error) {
    console.log('❌ Teams sync failed:', error.message);
    await updateSyncStatus('teams', 'failed', error.message);
  }
}

async function syncRecentMatches() {
  console.log('\n⚽ Step 3: Syncing Recent Matches');
  console.log('='.repeat(40));
  
  try {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      // Get matches from the last 3 days
      for (let i = 0; i < 3; i++) {
        const date = new Date(threeDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const data = await callHighlightlyApi(`matches?leagueId=${league.id}&date=${dateStr}&season=${currentSeason}`);
        
        if (data?.data) {
          for (const match of data.data) {
            await supabase
              .from('matches')
              .upsert({
                id: match.id,
                home_team_id: match.homeTeam?.id,
                away_team_id: match.awayTeam?.id,
                home_team_name: match.homeTeam?.name,
                away_team_name: match.awayTeam?.name,
                home_score: match.homeScore?.current || 0,
                away_score: match.awayScore?.current || 0,
                status: match.status?.short || 'TBD',
                match_date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : null,
                league_id: league.id,
                season: currentSeason
              });
            
            console.log(`✅ Synced match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
          }
        }
      }
    }
    
    await updateSyncStatus('matches', 'completed');
    console.log('✅ Matches sync completed');
    
  } catch (error) {
    console.log('❌ Matches sync failed:', error.message);
    await updateSyncStatus('matches', 'failed', error.message);
  }
}

async function syncHighlights() {
  console.log('\n🎬 Step 4: Syncing Highlights');
  console.log('='.repeat(40));
  
  try {
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`highlights?leagueId=${league.id}&season=${currentSeason}&limit=10`);
      
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
              league_id: league.id,
              home_team: highlight.match?.homeTeam?.name,
              away_team: highlight.match?.awayTeam?.name,
              competition: league.name,
              created_at: highlight.createdAt ? new Date(highlight.createdAt).toISOString() : null
            });
          
          console.log(`✅ Synced highlight: ${highlight.title}`);
        }
      }
    }
    
    await updateSyncStatus('highlights', 'completed');
    console.log('✅ Highlights sync completed');
    
  } catch (error) {
    console.log('❌ Highlights sync failed:', error.message);
    await updateSyncStatus('highlights', 'failed', error.message);
  }
}

// Main sync function
async function runDirectApiSync() {
  console.log('🚀 Starting Direct API Data Synchronization');
  console.log('==================================================');
  console.log('📋 Using FRESH API KEY for real football data');
  console.log('⚡ Organized by dependency: Leagues → Teams → Matches → Highlights');
  console.log('🔒 With careful rate limiting to preserve API quota');
  
  const startTime = Date.now();
  
  try {
    // Test API access first
    console.log(`🔄 [${new Date().toISOString()}] Testing direct API access...`);
    const testData = await callHighlightlyApi('leagues?limit=1');
    
    if (!testData) {
      throw new Error('API not accessible');
    }
    
    console.log(`✅ [${new Date().toISOString()}] API access confirmed!`);
    console.log(`📊 API Plan: ${testData.plan?.tier || 'Unknown'}`);
    
    // Run sync steps in order
    await syncLeagues();
    await syncTeamsForLeagues();
    await syncRecentMatches();
    await syncHighlights();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 SYNC COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Your app now has REAL football data!');
    
  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ${error.message}`);
    console.log('💥 Sync failed:', error.message);
  }
}

// Run the sync
runDirectApiSync(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Highlightly API configuration (CORRECT ENDPOINT)
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

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  batchSize: 5,
  delayBetweenBatches: 2000, // 2 seconds
  delayBetweenRequests: 2000 // 2 seconds between individual requests
};

let requestCount = 0;
let requestStartTime = Date.now();

// Rate limiting helper
async function rateLimitedDelay() {
  requestCount++;
  
  // Reset counter every minute
  const now = Date.now();
  if (now - requestStartTime > 60000) {
    requestCount = 1;
    requestStartTime = now;
  }
  
  // If we've hit the rate limit, wait until next minute
  if (requestCount > RATE_LIMIT.requestsPerMinute) {
    const waitTime = 60000 - (now - requestStartTime) + 1000; // Add 1 second buffer
    console.log(`⏳ Rate limit reached. Waiting ${Math.round(waitTime/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 1;
    requestStartTime = Date.now();
  } else {
    // Regular delay between requests
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
  }
}

// API call helper with error handling
async function callHighlightlyApi(endpoint) {
  await rateLimitedDelay();
  
  const url = `${HIGHLIGHTLY_API_URL}/${endpoint}`;
  
  try {
    console.log(`📡 [${requestCount}/30] Calling: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      console.log('❌ Rate limited by API - waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await callHighlightlyApi(endpoint); // Retry
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${endpoint} (${data.data?.length || 'N/A'} items)`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Database helpers
async function updateSyncStatus(entity, status, details = null) {
  await supabase
    .from('sync_status')
    .upsert({
      entity_type: entity,
      last_sync: new Date().toISOString(),
      status: status,
      details: details
    });
}

async function syncLeagues() {
  console.log('\n📋 Step 1: Syncing Leagues');
  console.log('='.repeat(40));
  
  try {
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`leagues/${league.id}`);
      
      if (data?.data) {
        const leagueData = data.data;
        
        await supabase
          .from('leagues')
          .upsert({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country?.name || league.country,
            logo: leagueData.logo,
            season: leagueData.seasons?.[0]?.season || new Date().getFullYear(),
            is_priority: true
          });
        
        console.log(`✅ Synced league: ${leagueData.name}`);
      }
    }
    
    await updateSyncStatus('leagues', 'completed');
    console.log('✅ Leagues sync completed');
    
  } catch (error) {
    console.log('❌ Leagues sync failed:', error.message);
    await updateSyncStatus('leagues', 'failed', error.message);
  }
}

async function syncTeamsForLeagues() {
  console.log('\n👥 Step 2: Syncing Teams');
  console.log('='.repeat(40));
  
  try {
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`standings?leagueId=${league.id}&season=${currentSeason}`);
      
      if (data?.data) {
        for (const standing of data.data) {
          const team = standing.team;
          
          if (team) {
            await supabase
              .from('teams')
              .upsert({
                id: team.id,
                name: team.name,
                logo: team.logo,
                league_id: league.id
              });
            
            console.log(`✅ Synced team: ${team.name} (${league.name})`);
          }
        }
      }
    }
    
    await updateSyncStatus('teams', 'completed');
    console.log('✅ Teams sync completed');
    
  } catch (error) {
    console.log('❌ Teams sync failed:', error.message);
    await updateSyncStatus('teams', 'failed', error.message);
  }
}

async function syncRecentMatches() {
  console.log('\n⚽ Step 3: Syncing Recent Matches');
  console.log('='.repeat(40));
  
  try {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      // Get matches from the last 3 days
      for (let i = 0; i < 3; i++) {
        const date = new Date(threeDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const data = await callHighlightlyApi(`matches?leagueId=${league.id}&date=${dateStr}&season=${currentSeason}`);
        
        if (data?.data) {
          for (const match of data.data) {
            await supabase
              .from('matches')
              .upsert({
                id: match.id,
                home_team_id: match.homeTeam?.id,
                away_team_id: match.awayTeam?.id,
                home_team_name: match.homeTeam?.name,
                away_team_name: match.awayTeam?.name,
                home_score: match.homeScore?.current || 0,
                away_score: match.awayScore?.current || 0,
                status: match.status?.short || 'TBD',
                match_date: match.startTimestamp ? new Date(match.startTimestamp * 1000).toISOString() : null,
                league_id: league.id,
                season: currentSeason
              });
            
            console.log(`✅ Synced match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
          }
        }
      }
    }
    
    await updateSyncStatus('matches', 'completed');
    console.log('✅ Matches sync completed');
    
  } catch (error) {
    console.log('❌ Matches sync failed:', error.message);
    await updateSyncStatus('matches', 'failed', error.message);
  }
}

async function syncHighlights() {
  console.log('\n🎬 Step 4: Syncing Highlights');
  console.log('='.repeat(40));
  
  try {
    // Use 2024 season (current football season is 2024-2025)
    const currentSeason = 2024;
    
    for (const league of PRIORITY_LEAGUES) {
      const data = await callHighlightlyApi(`highlights?leagueId=${league.id}&season=${currentSeason}&limit=10`);
      
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
              league_id: league.id,
              home_team: highlight.match?.homeTeam?.name,
              away_team: highlight.match?.awayTeam?.name,
              competition: league.name,
              created_at: highlight.createdAt ? new Date(highlight.createdAt).toISOString() : null
            });
          
          console.log(`✅ Synced highlight: ${highlight.title}`);
        }
      }
    }
    
    await updateSyncStatus('highlights', 'completed');
    console.log('✅ Highlights sync completed');
    
  } catch (error) {
    console.log('❌ Highlights sync failed:', error.message);
    await updateSyncStatus('highlights', 'failed', error.message);
  }
}

// Main sync function
async function runDirectApiSync() {
  console.log('🚀 Starting Direct API Data Synchronization');
  console.log('==================================================');
  console.log('📋 Using FRESH API KEY for real football data');
  console.log('⚡ Organized by dependency: Leagues → Teams → Matches → Highlights');
  console.log('🔒 With careful rate limiting to preserve API quota');
  
  const startTime = Date.now();
  
  try {
    // Test API access first
    console.log(`🔄 [${new Date().toISOString()}] Testing direct API access...`);
    const testData = await callHighlightlyApi('leagues?limit=1');
    
    if (!testData) {
      throw new Error('API not accessible');
    }
    
    console.log(`✅ [${new Date().toISOString()}] API access confirmed!`);
    console.log(`📊 API Plan: ${testData.plan?.tier || 'Unknown'}`);
    
    // Run sync steps in order
    await syncLeagues();
    await syncTeamsForLeagues();
    await syncRecentMatches();
    await syncHighlights();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 SYNC COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📡 API calls made: ${requestCount}`);
    console.log('✅ Your app now has REAL football data!');
    
  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ${error.message}`);
    console.log('💥 Sync failed:', error.message);
  }
}

// Run the sync
runDirectApiSync(); 