import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkMatchesSchema() {
  console.log('🔍 CHECKING MATCHES TABLE SCHEMA...');
  
  try {
    // Try to get table info
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying matches table:', error);
      return;
    }
    
    console.log('✅ Matches table accessible');
    
    if (data && data.length > 0) {
      console.log('\n📊 Sample match record structure:');
      const sampleMatch = data[0];
      Object.keys(sampleMatch).forEach(key => {
        console.log(`  ${key}: ${typeof sampleMatch[key]} = ${JSON.stringify(sampleMatch[key]).substring(0, 50)}...`);
      });
    }
    
    // Test inserting a sample record to see what fields are expected
    console.log('\n🧪 Testing insert to identify required fields...');
    
    const testMatch = {
      id: 'test-match-' + Date.now(),
      league_id: '2486', // UEFA Champions League
      home_team: 'Test Team A',
      away_team: 'Test Team B',
      home_score: null,
      away_score: null,
      match_date: new Date().toISOString(),
      status: 'Scheduled',
      venue: 'Test Stadium',
      season: '2025',
      api_data: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('matches')
      .insert(testMatch)
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      
      // Try without away_team to see if that's the issue
      console.log('\n🔄 Trying without away_team field...');
      const { away_team, ...testMatchWithoutAwayTeam } = testMatch;
      testMatchWithoutAwayTeam.id = 'test-match-no-away-' + Date.now();
      
      const { data: insertData2, error: insertError2 } = await supabase
        .from('matches')
        .insert(testMatchWithoutAwayTeam)
        .select();
        
      if (insertError2) {
        console.error('❌ Insert without away_team also failed:', insertError2);
      } else {
        console.log('✅ Insert without away_team succeeded!');
        console.log('This suggests away_team column might not exist or have different name');
        
        // Clean up test record
        await supabase.from('matches').delete().eq('id', testMatchWithoutAwayTeam.id);
      }
    } else {
      console.log('✅ Insert test succeeded!');
      console.log('Schema appears to be correct');
      
      // Clean up test record
      await supabase.from('matches').delete().eq('id', testMatch.id);
    }
    
    // Check current matches count
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Current matches in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

checkMatchesSchema().catch(console.error); 