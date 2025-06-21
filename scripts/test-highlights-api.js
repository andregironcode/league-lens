/**
 * TEST HIGHLIGHTS API - Debug highlights endpoints
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';

async function testAPI(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`\n📡 Testing: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString());
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    console.log(`📄 Response structure:`, typeof data);
    
    if (Array.isArray(data)) {
      console.log(`📋 Array length: ${data.length}`);
      if (data.length > 0) {
        console.log(`📝 First item keys:`, Object.keys(data[0]));
        console.log(`📖 First item:`, JSON.stringify(data[0], null, 2));
      }
    } else if (data && typeof data === 'object') {
      console.log(`📝 Object keys:`, Object.keys(data));
      if (data.data && Array.isArray(data.data)) {
        console.log(`📋 data.data length: ${data.data.length}`);
        if (data.data.length > 0) {
          console.log(`📖 First data item:`, JSON.stringify(data.data[0], null, 2));
        }
      }
    }
    
    return data;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testHighlightsAPI() {
  console.log('🎬 TESTING HIGHLIGHTS API ENDPOINTS');
  console.log('=' .repeat(60));

  // Get some finished matches to test with
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      home_score,
      away_score,
      teams:home_team_id(name),
      away_teams:away_team_id(name),
      leagues:league_id(name)
    `)
    .eq('status', 'finished')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
    .limit(5);

  console.log(`\n📊 Found ${finishedMatches?.length || 0} finished matches to test:`);
  finishedMatches?.forEach((match, i) => {
    console.log(`   ${i+1}. ${match.teams?.name} ${match.home_score}-${match.away_score} ${match.away_teams?.name} [${match.leagues?.name}] (ID: ${match.id})`);
  });

  if (!finishedMatches || finishedMatches.length === 0) {
    console.log('❌ No finished matches found to test highlights');
    return;
  }

  // Test different potential endpoints
  const testMatch = finishedMatches[0];
  console.log(`\n🎯 Testing with match: ${testMatch.teams?.name} vs ${testMatch.away_teams?.name} (ID: ${testMatch.id})`);

  // Test 1: /highlights with matchId
  await testAPI('/highlights', { matchId: testMatch.id });
  
  // Test 2: /highlights with match_id
  await testAPI('/highlights', { match_id: testMatch.id });
  
  // Test 3: /match-highlights
  await testAPI('/match-highlights', { matchId: testMatch.id });
  
  // Test 4: /highlights/{matchId}
  await testAPI(`/highlights/${testMatch.id}`);
  
  // Test 5: Just /highlights
  await testAPI('/highlights');
  
  // Test 6: /highlights with different param names
  await testAPI('/highlights', { id: testMatch.id });
  
  // Test with multiple matches
  console.log(`\n🔍 Testing multiple finished matches:`);
  for (let i = 0; i < Math.min(3, finishedMatches.length); i++) {
    const match = finishedMatches[i];
    console.log(`\n--- Match ${i+1}: ${match.teams?.name} vs ${match.away_teams?.name} ---`);
    await testAPI('/highlights', { matchId: match.id });
  }

  // Check if highlights exist in database
  console.log(`\n💾 Checking existing highlights in database:`);
  const { data: existingHighlights } = await supabase
    .from('highlights')
    .select('*')
    .limit(5);

  if (existingHighlights && existingHighlights.length > 0) {
    console.log(`✅ Found ${existingHighlights.length} existing highlights:`);
    existingHighlights.forEach((highlight, i) => {
      console.log(`   ${i+1}. ${highlight.title} (Match: ${highlight.match_id})`);
    });
  } else {
    console.log(`❌ No existing highlights in database`);
  }
}

testHighlightsAPI(); 