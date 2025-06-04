const fetch = require('node-fetch');

// API configuration (same as the app)
const PROXY_URL = 'http://localhost:3001/api/highlightly';

// Priority league IDs (same as in the app)
const PRIORITY_LEAGUE_IDS = [
  '2486',   // UEFA Champions League
  '3337',   // UEFA Europa League  
  '4188',   // Euro Championship
  '5890',   // Africa Cup of Nations
  '11847',  // CONMEBOL Libertadores
  '13549',  // FIFA Club World Cup (excluded in filtering)
  '8443',   // Copa America
  '33973',  // Premier League
  '52695',  // Ligue 1
  '67162',  // Bundesliga
  '119924', // La Liga (Spain)
  '16102',  // AFC Cup
  '115669', // Serie A (Italy)
  '1635'    // FIFA World Cup
];

// Simulate the exact API request function from the app
async function apiRequest(endpoint, params = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  
  const url = `${PROXY_URL}${endpoint}?${queryParams.toString()}`;
  console.log(`[Test] Fetching ${url}`);
  
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Simulate the exact getRecentMatchesForTopLeagues function
async function testGetRecentMatchesForTopLeagues() {
  console.log('🔍 Testing getRecentMatchesForTopLeagues() function...\n');
  
  try {
    console.log('[Test] Fetching recent match results using OPTIMIZED priority-league approach');
    
    let priorityLeaguesData = [];
    
    // Try direct fetching first (most efficient)
    console.log('[Test] Attempting direct fetch of priority leagues...');
    
    const leaguePromises = PRIORITY_LEAGUE_IDS.map(async (leagueId) => {
      try {
        const response = await apiRequest(`/leagues/${leagueId}`);
        
        if (response && response.data) {
          let leagueData = Array.isArray(response.data) ? response.data[0] : response.data;
          if (leagueData && leagueData.id) {
            console.log(`[Test] ✅ Direct fetch: ${leagueData.name} (ID: ${leagueData.id})`);
            return { ...leagueData, id: leagueData.id.toString() };
          }
        } else if (response && response.id) {
          console.log(`[Test] ✅ Direct fetch: ${response.name} (ID: ${response.id})`);
          return { ...response, id: response.id.toString() };
        }
        
        return null;
      } catch (error) {
        console.log(`[Test] Direct fetch failed for ${leagueId}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.allSettled(leaguePromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        priorityLeaguesData.push(result.value);
      }
    });
    
    console.log(`[Test] Direct fetch success: ${priorityLeaguesData.length}/${PRIORITY_LEAGUE_IDS.length} leagues`);
    
    // Fallback: Targeted pagination (only if direct fetch fails)
    if (priorityLeaguesData.length < PRIORITY_LEAGUE_IDS.length / 2) {
      console.log('[Test] Direct fetch insufficient, using targeted pagination...');
      
      let allLeaguesData = [];
      let offset = 0;
      const limit = 100;
      
      while (offset < 600) {
        try {
          const response = await apiRequest('/leagues', {
            limit: limit.toString(),
            offset: offset.toString()
          });
          
          if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            break;
          }
          
          const priorityLeaguesInBatch = response.data.filter((league) => 
            PRIORITY_LEAGUE_IDS.includes(league.id?.toString())
          );
          
          allLeaguesData.push(...priorityLeaguesInBatch);
          console.log(`[Test] Found ${priorityLeaguesInBatch.length} priority leagues in batch (offset: ${offset})`);
          
          if (response.data.length < limit) break;
          offset += limit;
          
          const foundIds = new Set(allLeaguesData.map(l => l.id.toString()));
          const missingIds = PRIORITY_LEAGUE_IDS.filter(id => !foundIds.has(id));
          if (missingIds.length === 0) {
            console.log('[Test] ✅ All priority leagues found, stopping pagination early');
            break;
          }
        } catch (error) {
          console.error(`[Test] Error fetching leagues at offset ${offset}:`, error);
          break;
        }
      }
      
      const existingIds = new Set(priorityLeaguesData.map(l => l.id));
      const newLeagues = allLeaguesData.filter(l => !existingIds.has(l.id.toString()));
      priorityLeaguesData.push(...newLeagues);
    }
    
    // EXPLICITLY EXCLUDE unwanted leagues (FIFA Club World Cup)
    priorityLeaguesData = priorityLeaguesData.filter((league) => {
      const name = league.name?.toLowerCase() || '';
      
      if (name.includes('fifa club world cup') || 
          name.includes('club world cup') ||
          (name.includes('club') && name.includes('world cup'))) {
        console.log(`[Test] EXCLUDING Club World Cup: ${league.name} (ID: ${league.id})`);
        return false;
      }
      
      return true;
    });
    
    if (priorityLeaguesData.length === 0) {
      console.error('[Test] No priority leagues found');
      return [];
    }
    
    console.log(`[Test] Total priority leagues fetched: ${priorityLeaguesData.length}`);
    
    // Log which priority leagues we found
    priorityLeaguesData.forEach(league => {
      console.log(`[Test] ✅ Priority league: ${league.name} (ID: ${league.id})`);
    });
    
    // Get recent matches for each priority league
    const leaguesWithMatches = [];
    
    for (const league of priorityLeaguesData.slice(0, 8)) { // Limit to top 8
      try {
        console.log(`[Test] Fetching matches for ${league.name} (ID: ${league.id})`);
        
        const matchesResponse = await apiRequest('/matches', {
          leagueId: league.id.toString(),
          date: new Date().toISOString().split('T')[0],
          limit: '15'
        });
        
        if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
          console.log(`[Test] No matches found for ${league.name}`);
          continue;
        }
        
        console.log(`[Test] Found ${matchesResponse.data.length} matches for ${league.name}`);
        
        // Filter for finished matches with scores
        const finishedMatches = matchesResponse.data.filter((match) => {
          const isFinished = 
            match.state?.description === 'Finished' ||
            match.state?.description === 'Finished after penalties' ||
            match.state?.description === 'Finished after extra time' ||
            match.fixture?.status?.long === 'Match Finished' ||
            match.fixture?.status?.short === 'FT';
          
          const hasScore = 
            (match.state?.score?.current && match.state.score.current.includes(' - ')) ||
            (match.score?.fulltime?.home !== undefined && match.score?.fulltime?.away !== undefined) ||
            (match.goals?.home !== undefined && match.goals?.away !== undefined) ||
            (match.fixture?.score?.fulltime?.home !== undefined && match.fixture?.score?.fulltime?.away !== undefined);
          
          return isFinished && hasScore;
        });
        
        if (finishedMatches.length === 0) {
          console.log(`[Test] No finished matches with scores for ${league.name}`);
          continue;
        }
        
        console.log(`[Test] ✅ ${finishedMatches.length} finished matches found for ${league.name}`);
        
        // Transform matches to our format (simplified)
        const transformedMatches = finishedMatches
          .slice(0, 5) // Limit to 5 most recent per league
          .map((match) => {
            let homeScore = 0;
            let awayScore = 0;
            
            if (match.state?.score?.current) {
              const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
              if (scoreMatch) {
                homeScore = parseInt(scoreMatch[1], 10);
                awayScore = parseInt(scoreMatch[2], 10);
              }
            }
            
            const homeTeam = match.homeTeam?.name || 'Home Team';
            const awayTeam = match.awayTeam?.name || 'Away Team';
            
            console.log(`[Test]   🏆 ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`);
            
            return {
              id: match.id?.toString() || `match-${Date.now()}`,
              homeTeam: { name: homeTeam },
              awayTeam: { name: awayTeam },
              score: { home: homeScore, away: awayScore },
              status: 'finished'
            };
          });
        
        if (transformedMatches.length > 0) {
          leaguesWithMatches.push({
            id: league.id.toString(),
            name: league.name,
            logo: league.logo || `/leagues/${league.name.toLowerCase().replace(/\s+/g, '-')}.png`,
            matches: transformedMatches
          });
          
          console.log(`[Test] ✅ Added ${transformedMatches.length} matches for ${league.name}`);
        }
        
      } catch (error) {
        console.error(`[Test] Error fetching matches for ${league.name}:`, error);
        continue;
      }
    }
    
    console.log(`\n📊 FINAL RESULT:`);
    console.log(`[Test] ✅ Successfully fetched match results for ${leaguesWithMatches.length} priority leagues:`);
    leaguesWithMatches.forEach(l => {
      console.log(`   🏟️  ${l.name}: ${l.matches.length} matches`);
    });
    
    return leaguesWithMatches;
    
  } catch (error) {
    console.error('[Test] Error in getRecentMatchesForTopLeagues:', error);
    return [];
  }
}

// Run the test
testGetRecentMatchesForTopLeagues()
  .then(result => {
    if (result.length > 0) {
      console.log(`\n✅ SUCCESS: Recent Matches function is working! Found ${result.length} leagues with matches.`);
    } else {
      console.log(`\n❌ FAILURE: No recent matches found.`);
    }
  })
  .catch(error => {
    console.error('\n❌ FAILURE: Test failed with error:', error);
  }); 