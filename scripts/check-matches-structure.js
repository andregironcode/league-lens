import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMatchesStructure() {
  console.log('🔍 CHECKING MATCHES TABLE STRUCTURE');
  console.log('==================================================');
  
  // Get a sample match to see the actual structure
  console.log('📋 Getting sample match record...');
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('   ✅ Sample match record:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('');
      console.log('   📊 Available columns:', Object.keys(data[0]).join(', '));
    } else {
      console.log('   ⚠️  No matches found in database');
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  // Check if we can get matches with team names via joins
  console.log('\\n📋 Trying to get matches with team names via joins...');
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Join error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('   ✅ Successfully joined with team names:');
      const match = data[0];
      console.log(`   📊 ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'} (${match.match_date})`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  // Check what date range we have
  console.log('\\n📋 Checking match date range...');
  try {
    const { data: dateRange, error } = await supabase
      .from('matches')
      .select('match_date')
      .order('match_date', { ascending: true });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (dateRange && dateRange.length > 0) {
      const dates = dateRange.map(m => m.match_date).filter(Boolean);
      const uniqueDates = [...new Set(dates)].sort();
      
      console.log(`   📅 Date range: ${uniqueDates[0]} to ${uniqueDates[uniqueDates.length - 1]}`);
      console.log(`   📊 Total matches: ${dateRange.length}`);
      console.log(`   📊 Unique dates: ${uniqueDates.length}`);
      
      // Check for current/upcoming matches
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nextWeek = new Date(now.getTime() + 7*24*60*60*1000).toISOString().split('T')[0];
      
      const upcomingDates = uniqueDates.filter(date => date >= today && date <= nextWeek);
      console.log(`   🔮 Upcoming dates (${today} to ${nextWeek}): ${upcomingDates.length}`);
      if (upcomingDates.length > 0) {
        console.log(`   📅 Upcoming: ${upcomingDates.join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\\n==================================================');
  console.log('💡 ANALYSIS:');
  console.log('');
  console.log('The issue is likely that:');
  console.log('1. Your matches table uses home_team_id/away_team_id (not home_team_name/away_team_name)');
  console.log('2. All your matches are from 2023-2024 season (no current matches)');
  console.log('3. UpcomingMatches component expects current/future dates');
  console.log('');
  console.log('SOLUTION:');
  console.log('1. Update UpcomingMatches component to use proper joins');
  console.log('2. Sync current 2024-2025 season matches');
  console.log('==================================================');
}

checkMatchesStructure().catch(console.error); 