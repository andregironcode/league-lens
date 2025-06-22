import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseIssues() {
  console.log('🔍 COMPREHENSIVE ISSUE DIAGNOSIS');
  console.log('='.repeat(60));
  
  try {
    // 1. Check why team form calculation is failing
    console.log('\n📈 1. TEAM FORM CALCULATION ISSUE:');
    console.log('-'.repeat(40));
    
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select('id, status, home_score, away_score, match_date, season')
      .eq('status', 'finished')
      .limit(10);
    
    console.log(`📊 Found ${sampleMatches?.length || 0} finished matches`);
    if (sampleMatches && sampleMatches.length > 0) {
      sampleMatches.forEach(match => {
        console.log(`   ${match.status} - ${match.home_score}:${match.away_score} - ${match.match_date?.slice(0,10)} (Season: ${match.season})`);
      });
    } else {
      console.log('❌ NO FINISHED MATCHES FOUND - This is why team form fails!');
    }
    
    // 2. Check league logos issue
    console.log('\n🏆 2. LEAGUE LOGOS ISSUE:');
    console.log('-'.repeat(40));
    
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name, logo, country_logo')
      .eq('priority', true);
    
    leagues?.forEach(league => {
      console.log(`   ${league.name}: Logo=${league.logo ? '✅' : '❌'}, Country=${league.country_logo ? '✅' : '❌'}`);
    });
    
    // 3. Check team logos issue
    console.log('\n👥 3. TEAM LOGOS ISSUE:');
    console.log('-'.repeat(40));
    
    const { data: teamsSample } = await supabase
      .from('teams')
      .select('id, name, logo')
      .limit(10);
    
    const teamsWithLogos = teamsSample?.filter(t => t.logo).length || 0;
    console.log(`   Teams with logos: ${teamsWithLogos}/${teamsSample?.length || 0}`);
    
    // 4. Check match lineups and events
    console.log('\n👥 4. MATCH LINEUPS & EVENTS:');
    console.log('-'.repeat(40));
    
    const { count: lineupsCount } = await supabase
      .from('match_lineups')
      .select('*', { count: 'exact', head: true });
    
    const { count: eventsCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Match lineups: ${lineupsCount || 0}`);
    console.log(`   Match events: ${eventsCount || 0}`);
    
    // 5. Check recent matches status distribution
    console.log('\n⚽ 5. MATCH STATUS DISTRIBUTION:');
    console.log('-'.repeat(40));
    
    const { data: statusCounts } = await supabase
      .from('matches')
      .select('status')
      .limit(1000);
    
    const statusDistribution = {};
    statusCounts?.forEach(match => {
      statusDistribution[match.status] = (statusDistribution[match.status] || 0) + 1;
    });
    
    Object.entries(statusDistribution).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} matches`);
    });
    
    // 6. Check API data structure in matches
    console.log('\n📊 6. API DATA STRUCTURE:');
    console.log('-'.repeat(40));
    
    const { data: matchWithData } = await supabase
      .from('matches')
      .select('id, api_data')
      .not('api_data', 'is', null)
      .limit(1);
    
    if (matchWithData && matchWithData[0]) {
      const apiData = matchWithData[0].api_data;
      console.log(`   Sample match API data keys: ${Object.keys(apiData).join(', ')}`);
      if (apiData.lineups) {
        console.log(`   ✅ Has lineups data`);
      }
      if (apiData.events) {
        console.log(`   ✅ Has events data`);
      }
    }
    
    console.log('\n🎯 SUMMARY OF ISSUES TO FIX:');
    console.log('='.repeat(60));
    console.log('1. ❌ Team form failing: Need finished matches with proper scores');
    console.log('2. ❌ Missing league logos: Need to sync logo URLs');
    console.log('3. ❌ Missing team logos: Need to sync team logo URLs');
    console.log('4. ❌ No lineups: Need to sync lineups into match_lineups table');
    console.log('5. ❌ No events: Need to sync events into match_events table');
    console.log('6. ❌ UI crashes: Need to handle missing logo/data gracefully');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

async function checkCounts() {
  console.log('📊 CHECKING EXACT DATABASE COUNTS...\n');
  
  try {
    // Get exact counts
    const { count: matchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    const { count: lineupsCount } = await supabase
      .from('match_lineups')
      .select('*', { count: 'exact', head: true });
    
    const { count: eventsCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true });

    console.log('🎯 EXACT COUNTS:');
    console.log(`   Matches: ${matchesCount || 0}`);
    console.log(`   Lineups: ${lineupsCount || 0}`);
    console.log(`   Events: ${eventsCount || 0}`);
    
    // Calculate coverage
    const lineupCoverage = matchesCount > 0 ? ((lineupsCount || 0) / matchesCount * 100).toFixed(1) : 0;
    const eventCoverage = matchesCount > 0 ? ((eventsCount || 0) / matchesCount * 100).toFixed(1) : 0;
    
    console.log('\n📈 COVERAGE:');
    console.log(`   Lineup coverage: ${lineupCoverage}% of matches`);
    console.log(`   Event coverage: ${eventCoverage}% of matches`);
    
    // Check recent lineups
    const { data: recentLineups } = await supabase
      .from('match_lineups')
      .select('match_id, formation')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('\n🔄 RECENT LINEUPS:');
    if (recentLineups && recentLineups.length > 0) {
      recentLineups.forEach(lineup => {
        console.log(`   Match ${lineup.match_id}: ${lineup.formation}`);
      });
    } else {
      console.log('   No recent lineups found');
    }
    
  } catch (error) {
    console.error('❌ Error checking counts:', error);
  }
}

diagnoseIssues().catch(console.error);
checkCounts(); 