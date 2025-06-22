import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function testDirectFetch() {
  console.log('🔄 TESTING DIRECT FETCH WITH UPDATED DATABASE...');
  
  try {
    // Check current matches count
    const { count: beforeCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Matches before fetch: ${beforeCount}`);
    
    // Check leagues with API data
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name, api_data')
      .not('api_data', 'is', null)
      .limit(5);
    
    console.log(`\n🏆 Sample leagues with API data:`);
    leagues?.forEach(league => {
      try {
        const apiData = JSON.parse(league.api_data);
        console.log(`- ${league.name} (ID: ${league.id}) -> API ID: ${apiData.highlightly_id}`);
      } catch (e) {
        console.log(`- ${league.name} (ID: ${league.id}) -> Invalid API data`);
      }
    });
    
    // Test the server endpoint directly
    console.log(`\n🔗 Testing server endpoints...`);
    
    try {
      const healthResponse = await fetch('http://localhost:3001/api/health');
      const healthData = await healthResponse.text();
      console.log('✅ Health endpoint working');
      
      // Try the fetch endpoint
      console.log('\n🎯 Testing manual fetch endpoint...');
      const fetchResponse = await fetch('http://localhost:3001/api/admin/fetch-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseText = await fetchResponse.text();
      console.log('Response status:', fetchResponse.status);
      console.log('Response headers:', Object.fromEntries(fetchResponse.headers.entries()));
      console.log('Response text (first 200 chars):', responseText.substring(0, 200));
      
      if (fetchResponse.ok) {
        try {
          const fetchData = JSON.parse(responseText);
          console.log('✅ Fetch triggered successfully:', fetchData);
        } catch (e) {
          console.log('❌ Response is not valid JSON');
        }
      } else {
        console.log('❌ Fetch endpoint returned error status:', fetchResponse.status);
      }
      
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
    
    // Wait a bit and check if matches increased
    console.log('\n⏳ Waiting 10 seconds for potential fetch...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const { count: afterCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 RESULTS:`);
    console.log(`- Matches before: ${beforeCount}`);
    console.log(`- Matches after: ${afterCount}`);
    console.log(`- New matches: ${(afterCount || 0) - (beforeCount || 0)}`);
    
    if ((afterCount || 0) > (beforeCount || 0)) {
      console.log('🎉 SUCCESS: New matches were fetched!');
    } else {
      console.log('⚠️ No new matches were fetched');
    }
    
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

testDirectFetch().catch(console.error); 