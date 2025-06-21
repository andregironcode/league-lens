/**
 * TEST MATCHES SCHEMA
 * 
 * Test what columns exist in the matches table
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 TESTING MATCHES TABLE SCHEMA');

async function testMatchesSchema() {
  // Try inserting with minimal data first
  console.log('\n📝 Testing minimal match data...');
  
  const minimalMatch = {
    id: 999999,
    league_id: 33973
  };

  const { error: minError } = await supabase
    .from('matches')
    .upsert(minimalMatch, { onConflict: 'id' });

  if (minError) {
    console.log(`❌ Minimal insert failed: ${minError.message}`);
  } else {
    console.log(`✅ Minimal insert worked!`);
    
    // Clean up
    await supabase.from('matches').delete().eq('id', 999999);
  }

  // Test with different column names
  const testColumns = [
    { home_team: 'Test Home', away_team: 'Test Away' },
    { home_team_name: 'Test Home', away_team_name: 'Test Away' },
    { home_team_id: 1, away_team_id: 2 },
    { match_date: '2024-12-15' },
    { date: '2024-12-15' },
    { status: 'scheduled' }
  ];

  for (const [index, testData] of testColumns.entries()) {
    console.log(`\n📝 Testing columns: ${Object.keys(testData).join(', ')}`);
    
    const testMatch = {
      id: 999990 + index,
      league_id: 33973,
      ...testData
    };

    const { error } = await supabase
      .from('matches')
      .upsert(testMatch, { onConflict: 'id' });

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log(`✅ Success! These columns work: ${Object.keys(testData).join(', ')}`);
      
      // Clean up
      await supabase.from('matches').delete().eq('id', 999990 + index);
    }
  }
}

testMatchesSchema(); 