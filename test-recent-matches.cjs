const fetch = require('node-fetch');

// API configuration
const API_BASE_URL = 'http://localhost:3001';

// Helper to make API calls through the proxy
async function callAPI(endpoint, params = {}) {
  const url = new URL(endpoint, API_BASE_URL);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const response = await fetch(url.toString());
  return await response.json();
}

// Priority league IDs (same as in the app)
const PRIORITY_LEAGUE_IDS = [
  '2486',   // UEFA Champions League
  '3337',   // UEFA Europa League  
  '4188',   // Euro Championship
  '5890',   // Africa Cup of Nations
  '11847',  // CONMEBOL Libertadores
  '8443',   // Copa America
  '33973',  // Premier League
  '52695',  // Ligue 1
  '67162',  // Bundesliga
  '119924', // La Liga (Spain)
  '16102',  // AFC Cup
  '115669', // Serie A (Italy)
  '1635'    // FIFA World Cup
];

async function testRecentMatches() {
  console.log('🔍 Testing Recent Matches API Flow...\n');
  
  try {
    console.log('Step 1: Finding priority leagues via pagination...');
    
    let foundLeagues = [];
    let offset = 0;
    const limit = 100;
    
    while (offset < 300 && foundLeagues.length < PRIORITY_LEAGUE_IDS.length) {
      console.log(`   📡 Fetching leagues (offset: ${offset})`);
      
      const response = await callAPI('/leagues', {
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        break;
      }
      
      // Find priority leagues in this batch
      const priorityLeaguesInBatch = response.data.filter(league => 
        PRIORITY_LEAGUE_IDS.includes(league.id?.toString())
      );
      
      foundLeagues.push(...priorityLeaguesInBatch);
      console.log(`   ✅ Found ${priorityLeaguesInBatch.length} priority leagues in batch`);
      
      if (response.data.length < limit) break;
      offset += limit;
      
      // Early exit if we've found all priority leagues  
      const foundIds = new Set(foundLeagues.map(l => l.id.toString()));
      const missingIds = PRIORITY_LEAGUE_IDS.filter(id => !foundIds.has(id));
      if (missingIds.length === 0) {
        console.log('   🎯 All priority leagues found, stopping early');
        break;
      }
    }
    
    console.log(`\nStep 2: Found ${foundLeagues.length}/${PRIORITY_LEAGUE_IDS.length} priority leagues:`);
    foundLeagues.forEach(league => {
      console.log(`   ✅ ${league.name} (ID: ${league.id})`);
    });
    
    console.log('\nStep 3: Testing matches for top leagues...');
    
    let leaguesWithRecentMatches = 0;
    let totalRecentMatches = 0;
    
    for (const league of foundLeagues.slice(0, 5)) { // Test top 5
      try {
        console.log(`\n   🔍 Testing matches for ${league.name} (ID: ${league.id})`);
        
        const matchesResponse = await callAPI('/matches', {
          leagueId: league.id.toString(),
          date: new Date().toISOString().split('T')[0],
          limit: '15'
        });
        
        if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
          console.log(`     ❌ No matches data for ${league.name}`);
          continue;
        }
        
        console.log(`     📊 Found ${matchesResponse.data.length} total matches`);
        
        // Filter for finished matches with scores
        const finishedMatches = matchesResponse.data.filter(match => {
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
        
        if (finishedMatches.length > 0) {
          leaguesWithRecentMatches++;
          totalRecentMatches += finishedMatches.length;
          
          console.log(`     ✅ ${finishedMatches.length} recent finished matches found:`);
          finishedMatches.slice(0, 3).forEach(match => {
            let homeScore = 0, awayScore = 0;
            
            if (match.state?.score?.current) {
              const scoreMatch = match.state.score.current.match(/(\d+)\s*-\s*(\d+)/);
              if (scoreMatch) {
                homeScore = parseInt(scoreMatch[1], 10);
                awayScore = parseInt(scoreMatch[2], 10);
              }
            } else if (match.score?.fulltime) {
              homeScore = match.score.fulltime.home || 0;
              awayScore = match.score.fulltime.away || 0;
            } else if (match.goals) {
              homeScore = match.goals.home || 0;
              awayScore = match.goals.away || 0;
            } else if (match.fixture?.score?.fulltime) {
              homeScore = match.fixture.score.fulltime.home || 0;
              awayScore = match.fixture.score.fulltime.away || 0;
            }
            
            const homeTeam = match.homeTeam?.name || match.teams?.home?.name || match.fixture?.teams?.home?.name || 'Home';
            const awayTeam = match.awayTeam?.name || match.teams?.away?.name || match.fixture?.teams?.away?.name || 'Away';
            
            console.log(`       🏆 ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`);
          });
        } else {
          console.log(`     ⚪ No recent finished matches for ${league.name}`);
        }
        
      } catch (error) {
        console.log(`     ❌ Error fetching matches for ${league.name}:`, error.message);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   🏟️  Priority leagues found: ${foundLeagues.length}/${PRIORITY_LEAGUE_IDS.length}`);
    console.log(`   ⚽ Leagues with recent matches: ${leaguesWithRecentMatches}`);
    console.log(`   🎯 Total recent matches: ${totalRecentMatches}`);
    
    if (leaguesWithRecentMatches > 0) {
      console.log(`\n✅ SUCCESS: Recent Matches API is working! ${totalRecentMatches} matches found across ${leaguesWithRecentMatches} leagues.`);
    } else {
      console.log(`\n⚠️  WARNING: No recent finished matches found. This might be because:`);
      console.log(`   - Today's matches haven't finished yet`);
      console.log(`   - API date filtering is too restrictive`);
      console.log(`   - League schedules don't have recent matches`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Recent Matches:', error);
  }
}

// Run the test
testRecentMatches(); 