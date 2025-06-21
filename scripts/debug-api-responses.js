/**
 * DEBUG API RESPONSES
 * 
 * Check what the API actually returns for different endpoints
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

async function debugApiResponses() {
  console.log('🔍 DEBUGGING API RESPONSES');
  console.log('='.repeat(50));

  // Check league details endpoint
  console.log('🏆 LEAGUE DETAILS:');
  const leagueDetails = await makeApiCall('/leagues/33973');
  if (leagueDetails) {
    console.log('   • Premier League response:');
    console.log('     - Name:', leagueDetails.name);
    console.log('     - Logo:', leagueDetails.logo || 'MISSING');
    console.log('     - Country:', leagueDetails.country_name);
    console.log('     - Full response keys:', Object.keys(leagueDetails));
  }

  // Check teams endpoint
  console.log('\n👥 TEAMS ENDPOINT:');
  const teamsData = await makeApiCall('/teams?leagueId=33973&limit=2');
  if (teamsData && teamsData.length > 0) {
    console.log('   • First team:');
    console.log('     - Name:', teamsData[0].name);
    console.log('     - ID:', teamsData[0].id);
    console.log('     - Logo:', teamsData[0].logo || 'MISSING');
    console.log('     - Full response keys:', Object.keys(teamsData[0]));
  }

  // Check matches endpoint
  console.log('\n⚽ MATCHES ENDPOINT:');
  const matchesData = await makeApiCall('/matches?leagueId=33973&date=2024-08-17&season=2024&limit=2');
  if (matchesData && matchesData.length > 0) {
    console.log('   • First match:');
    console.log('     - ID:', matchesData[0].id);
    console.log('     - Home team:', matchesData[0].home_team_name);
    console.log('     - Away team:', matchesData[0].away_team_name);
    console.log('     - Date:', matchesData[0].match_date);
    console.log('     - Status:', matchesData[0].status);
    console.log('     - Full response keys:', Object.keys(matchesData[0]));
  }

  // Check highlights endpoint
  console.log('\n🎬 HIGHLIGHTS ENDPOINT:');
  const highlightsData = await makeApiCall('/highlights?leagueId=33973&season=2024&limit=2');
  if (highlightsData && highlightsData.length > 0) {
    console.log('   • First highlight:');
    console.log('     - ID:', highlightsData[0].id);
    console.log('     - Title:', highlightsData[0].title);
    console.log('     - URL:', highlightsData[0].url);
    console.log('     - Full response keys:', Object.keys(highlightsData[0]));
  }

  // Check standings endpoint
  console.log('\n📊 STANDINGS ENDPOINT:');
  const standingsData = await makeApiCall('/standings?leagueId=33973&season=2024');
  if (standingsData && standingsData.length > 0) {
    console.log('   • First team in standings:');
    console.log('     - Team:', standingsData[0].team_name);
    console.log('     - Position:', standingsData[0].position);
    console.log('     - Points:', standingsData[0].points);
    console.log('     - Full response keys:', Object.keys(standingsData[0]));
  }

  // Check if lineups endpoint exists
  console.log('\n👥 LINEUPS ENDPOINT:');
  const lineupsData = await makeApiCall('/lineups?matchId=1028048781');
  if (lineupsData) {
    console.log('   • Lineups response:', lineupsData);
  }

  // Check if events endpoint exists
  console.log('\n⚡ EVENTS ENDPOINT:');
  const eventsData = await makeApiCall('/events?matchId=1028048781');
  if (eventsData) {
    console.log('   • Events response:', eventsData);
  }

  console.log('\n✅ API debugging complete!');
}

debugApiResponses(); 