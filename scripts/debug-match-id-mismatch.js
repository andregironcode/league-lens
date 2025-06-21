/**
 * DEBUG MATCH ID MISMATCH
 * 
 * This script investigates why highlights are being skipped due to match ID mismatches
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';

async function makeAPICall(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    throw error;
  }
}

async function debugMatchIdMismatch() {
  console.log('🔍 DEBUG MATCH ID MISMATCH');
  console.log('=' .repeat(50));

  // Get sample matches from database
  console.log('\n📋 Getting sample matches from database...');
  const { data: dbMatches, error } = await supabase
    .from('matches')
    .select('id, league_id, season, status, match_date')
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(5);

  if (error) {
    console.log(`❌ Error fetching matches: ${error.message}`);
    return;
  }

  console.log(`✅ Found ${dbMatches.length} sample matches in database:`);
  dbMatches.forEach((match, i) => {
    console.log(`   ${i + 1}. Match ID: ${match.id} (type: ${typeof match.id})`);
    console.log(`      League: ${match.league_id}, Season: ${match.season}, Date: ${match.match_date}`);
  });

  // Test highlights API for first match
  const testMatch = dbMatches[0];
  console.log(`\n🎥 Testing highlights API for match ${testMatch.id}...`);
  
  try {
    const response = await makeAPICall('/highlights', {
      matchId: parseInt(testMatch.id),
      limit: 5
    });

    if (response && response.data && Array.isArray(response.data)) {
      const highlights = response.data;
      console.log(`✅ Found ${highlights.length} highlights for match ${testMatch.id}`);
      
      if (highlights.length > 0) {
        console.log('\n📊 Sample highlight data:');
        const sample = highlights[0];
        console.log(`   Highlight ID: ${sample.id}`);
        console.log(`   Title: ${sample.title}`);
        console.log(`   Match from API: ${JSON.stringify(sample.match, null, 2)}`);
        console.log(`   Match ID from API: ${sample.match?.id} (type: ${typeof sample.match?.id})`);
        console.log(`   Database Match ID: ${testMatch.id} (type: ${typeof testMatch.id})`);
        
        // Check if IDs match
        const apiMatchId = sample.match?.id;
        const dbMatchId = testMatch.id;
        
        console.log(`\n🔍 ID Comparison:`);
        console.log(`   API Match ID: ${apiMatchId}`);
        console.log(`   DB Match ID: ${dbMatchId}`);
        console.log(`   String comparison: ${String(apiMatchId) === String(dbMatchId)}`);
        console.log(`   Number comparison: ${Number(apiMatchId) === Number(dbMatchId)}`);
        console.log(`   Strict comparison: ${apiMatchId === dbMatchId}`);
      }
    } else {
      console.log('❌ No highlights found for this match');
    }
    
  } catch (error) {
    console.log(`❌ Error fetching highlights: ${error.message}`);
  }

  // Check if we have any existing highlights
  console.log('\n💾 Checking existing highlights in database...');
  const { data: existingHighlights } = await supabase
    .from('highlights')
    .select('id, match_id, title')
    .limit(5);

  if (existingHighlights && existingHighlights.length > 0) {
    console.log(`✅ Found ${existingHighlights.length} existing highlights:`);
    existingHighlights.forEach((highlight, i) => {
      console.log(`   ${i + 1}. Highlight ID: ${highlight.id}`);
      console.log(`      Match ID: ${highlight.match_id} (type: ${typeof highlight.match_id})`);
      console.log(`      Title: ${highlight.title?.substring(0, 50)}...`);
    });
  } else {
    console.log('❌ No existing highlights found in database');
  }

  console.log('\n🎯 CONCLUSION:');
  console.log('   Check the ID comparison results above to understand the mismatch.');
  console.log('   The issue might be:');
  console.log('   1. Different ID formats (string vs number)');
  console.log('   2. Different ID values entirely');
  console.log('   3. API returning different match IDs than stored in DB');
}

debugMatchIdMismatch(); 