import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';

async function callHighlightlyAPI(endpoint, params = {}) {
  try {
    const url = new URL(`${HIGHLIGHTLY_API_URL}/${endpoint}`);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`🌐 Calling API: ${url.toString()}`);

    const response = await axios.get(url.toString(), {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

async function debugDetailedFetch() {
  console.log('🔍 DETAILED FETCH DEBUG...');
  
  try {
    // 1. Check database leagues
    console.log('\n📊 STEP 1: Checking database leagues...');
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('id, name, api_data')
      .not('api_data', 'is', null)
      .limit(10);

    if (leaguesError) {
      console.error('❌ Error fetching leagues:', leaguesError);
      return;
    }

    console.log(`✅ Found ${leagues.length} leagues with API data`);

    // 2. Create API mapping
    console.log('\n🔗 STEP 2: Creating API mapping...');
    const LEAGUE_API_MAPPING = {};
    let validLeagues = 0;

    leagues.forEach(league => {
      try {
        const apiData = JSON.parse(league.api_data);
        if (apiData.highlightly_id) {
          LEAGUE_API_MAPPING[league.name] = parseInt(apiData.highlightly_id);
          validLeagues++;
          console.log(`  ✓ ${league.name} -> API ID: ${apiData.highlightly_id}`);
        }
      } catch (e) {
        console.log(`  ❌ Invalid API data for: ${league.name}`);
      }
    });

    console.log(`✅ Created mapping for ${validLeagues} leagues`);

    // 3. Test a few specific leagues
    console.log('\n🎯 STEP 3: Testing specific leagues...');
    
    const testLeagues = [
      { name: 'Premier League', apiId: 33973 },
      { name: 'La Liga', apiId: 119924 },
      { name: 'Serie A', apiId: 115669 },
      { name: 'UEFA Champions League', apiId: 2486 }
    ];

    // 4. Test date range
    console.log('\n📅 STEP 4: Testing date range...');
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5);

    console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // 5. Test API calls for each league and date
    let totalApiCalls = 0;
    let totalMatches = 0;

    for (const testLeague of testLeagues) {
      console.log(`\n🏆 Testing: ${testLeague.name} (API ID: ${testLeague.apiId})`);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        
        try {
          totalApiCalls++;
          const matchData = await callHighlightlyAPI('matches', {
            leagueId: testLeague.apiId,
            date: dateString,
            season: new Date().getFullYear().toString()
          });

          if (matchData?.data && Array.isArray(matchData.data)) {
            console.log(`  📅 ${dateString}: ${matchData.data.length} matches`);
            totalMatches += matchData.data.length;
            
            // Show first match details
            if (matchData.data.length > 0) {
              const match = matchData.data[0];
              console.log(`    🏅 Sample: ${match.teams?.home?.name || 'TBD'} vs ${match.teams?.away?.name || 'TBD'}`);
              console.log(`    📍 Status: ${match.status?.long || 'Unknown'}`);
              console.log(`    🕐 Date: ${match.date}`);
            }
          } else {
            console.log(`  📅 ${dateString}: No matches`);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.error(`  ❌ Error for ${dateString}:`, error.message);
        }
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`- Total API calls: ${totalApiCalls}`);
    console.log(`- Total matches found: ${totalMatches}`);
    console.log(`- Current database matches: ${await getMatchCount()}`);

    // 6. Check current database state
    console.log('\n💾 STEP 6: Current database state...');
    const recentMatches = await getRecentMatches();
    console.log(`Recent matches in database: ${recentMatches.length}`);
    
    if (recentMatches.length > 0) {
      console.log('Sample recent matches:');
      recentMatches.slice(0, 3).forEach(match => {
        console.log(`  🏅 ${match.home_team} vs ${match.away_team} (${match.match_date}) - ${match.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

async function getMatchCount() {
  const { count } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

async function getRecentMatches() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 1);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 5);

  const { data } = await supabase
    .from('matches')
    .select('home_team, away_team, match_date, status')
    .gte('match_date', startDate.toISOString().split('T')[0])
    .lte('match_date', endDate.toISOString().split('T')[0])
    .order('match_date', { ascending: true })
    .limit(10);

  return data || [];
}

debugDetailedFetch().catch(console.error); 