/**
 * DEBUG WORKING ENDPOINTS
 * 
 * Check the working API endpoints we know work
 */

// Proxy server configuration
const API_BASE = 'http://localhost:3001/api/highlightly';

async function makeApiCall(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    return null;
  }
}

async function debugWorkingEndpoints() {
  console.log('🔍 DEBUGGING WORKING ENDPOINTS');
  console.log('='.repeat(50));

  // Test the endpoints we know work
  console.log('🏆 LEAGUES LIST (we know this works):');
  const leaguesList = await makeApiCall('/leagues?limit=10');
  if (leaguesList && leaguesList.length > 0) {
    const premierLeague = leaguesList.find(l => l.id === '33973');
    if (premierLeague) {
      console.log('   • Premier League found:');
      console.log('     - Name:', premierLeague.name);
      console.log('     - Logo:', premierLeague.logo || 'MISSING');
      console.log('     - Country:', premierLeague.country_name);
      console.log('     - Full keys:', Object.keys(premierLeague));
    }
  }

  // Test standings (we know this works)
  console.log('\n📊 STANDINGS (we know this works):');
  const standings = await makeApiCall('/standings?leagueId=33973&season=2024');
  if (standings && standings.length > 0) {
    console.log('   • First team in standings:');
    console.log('     - Team:', standings[0].team_name);
    console.log('     - Team ID:', standings[0].team_id);
    console.log('     - Position:', standings[0].position);
    console.log('     - Points:', standings[0].points);
    console.log('     - Logo:', standings[0].team_logo || 'MISSING');
    console.log('     - Full keys:', Object.keys(standings[0]));
  }

  // Test matches with a specific date
  console.log('\n⚽ MATCHES (specific date):');
  const matches = await makeApiCall('/matches?leagueId=33973&date=2024-08-17&season=2024&limit=5');
  if (matches && matches.length > 0) {
    console.log('   • First match:');
    console.log('     - ID:', matches[0].id);
    console.log('     - Home team:', matches[0].home_team_name);
    console.log('     - Away team:', matches[0].away_team_name);
    console.log('     - Home team ID:', matches[0].home_team_id);
    console.log('     - Away team ID:', matches[0].away_team_id);
    console.log('     - Date:', matches[0].match_date);
    console.log('     - Status:', matches[0].status);
    console.log('     - Score:', `${matches[0].home_score || 0}-${matches[0].away_score || 0}`);
    console.log('     - Full keys:', Object.keys(matches[0]));
  }

  // Test highlights
  console.log('\n🎬 HIGHLIGHTS:');
  const highlights = await makeApiCall('/highlights?leagueId=33973&season=2024&limit=5');
  if (highlights && highlights.length > 0) {
    console.log('   • First highlight:');
    console.log('     - ID:', highlights[0].id);
    console.log('     - Title:', highlights[0].title);
    console.log('     - URL:', highlights[0].url);
    console.log('     - Match ID:', highlights[0].match_id);
    console.log('     - Full keys:', Object.keys(highlights[0]));
  }

  // Check if we can get team data from standings
  console.log('\n👥 TEAM DATA FROM STANDINGS:');
  if (standings && standings.length > 0) {
    const firstTeam = standings[0];
    console.log('   • Team from standings:');
    console.log('     - Name:', firstTeam.team_name);
    console.log('     - ID:', firstTeam.team_id);
    console.log('     - Logo:', firstTeam.team_logo || 'MISSING');
  }

  console.log('\n✅ Working endpoints debugging complete!');
}

debugWorkingEndpoints(); 