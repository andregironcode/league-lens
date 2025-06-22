/**
 * Test manual fetch functionality
 */

async function testManualFetch() {
  console.log('🔄 Testing manual fetch functionality...\n');

  try {
    // Check server health first
    console.log('1. Checking server health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    
    if (!healthResponse.ok) {
      throw new Error('Server not running or unhealthy');
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Server is healthy');
    console.log('📊 Scheduler status:', healthData.scheduler?.isRunning ? 'Running' : 'Stopped');
    
    // Check current matches count in database
    console.log('\n2. Checking current matches in database...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://septerrkdnojsmtmmska.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
    );
    
    const { count: beforeCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Matches before fetch:', beforeCount);
    
    // Trigger manual fetch
    console.log('\n3. Triggering manual fetch...');
    const fetchResponse = await fetch('http://localhost:3001/api/admin/fetch-matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      throw new Error(`Fetch failed: ${errorData.error || 'Unknown error'}`);
    }
    
    const fetchResult = await fetchResponse.json();
    console.log('✅ Manual fetch completed');
    console.log('📄 Result:', fetchResult);
    
    // Wait a moment for processing
    console.log('\n4. Waiting 5 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check matches count after fetch
    console.log('\n5. Checking matches after fetch...');
    const { count: afterCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Matches after fetch:', afterCount);
    console.log('📈 New matches added:', afterCount - beforeCount);
    
    // Check upcoming matches in our date range
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = fiveDaysFromNow.toISOString().split('T')[0];
    
    const { data: upcomingMatches, count: upcomingCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .gte('match_date', startDate)
      .lte('match_date', endDate);
    
    console.log(`\n6. Upcoming matches (${startDate} to ${endDate}):`, upcomingCount);
    
    if (upcomingMatches && upcomingMatches.length > 0) {
      console.log('\n📅 Sample upcoming matches:');
      upcomingMatches.slice(0, 5).forEach(match => {
        console.log(`   ⚽ ${match.match_date}: ${match.home_team} vs ${match.away_team} (${match.status})`);
      });
    } else {
      console.log('⚠️  No upcoming matches found in the date range.');
      console.log('💡 This is normal during off-season periods.');
    }
    
    // Check leagues that have API IDs
    const { data: apiLeagues } = await supabase
      .from('leagues')
      .select('id, name, api_id')
      .not('api_id', 'is', null);
    
    console.log(`\n7. Leagues with API IDs: ${apiLeagues?.length || 0}`);
    if (apiLeagues && apiLeagues.length > 0) {
      console.log('📋 Available leagues for fetching:');
      apiLeagues.slice(0, 5).forEach(league => {
        console.log(`   🏆 ${league.name} (API ID: ${league.api_id})`);
      });
    }
    
    console.log('\n✅ Manual fetch test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Manual fetch test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure server is running: node server/server.js');
    console.log('2. Check if HIGHLIGHTLY_API_KEY is set in environment');
    console.log('3. Verify leagues have api_id values in database');
  }
}

testManualFetch().catch(console.error); 