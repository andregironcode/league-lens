import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUpcomingMatches() {
  console.log('🔍 CHECKING UPCOMING MATCHES');
  console.log('==================================================');
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24*60*60*1000);
  const nextWeek = new Date(now.getTime() + 5*24*60*60*1000);
  
  console.log(`📅 Today: ${now.toISOString().split('T')[0]}`);
  console.log(`📅 Searching from: ${yesterday.toISOString().split('T')[0]}`);
  console.log(`📅 Searching to: ${nextWeek.toISOString().split('T')[0]}`);
  console.log('');
  
  // Check what matches exist in this date range
  const { data: upcomingMatches, error: upcomingError } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', yesterday.toISOString().split('T')[0])
    .lte('match_date', nextWeek.toISOString().split('T')[0])
    .order('match_date', { ascending: true });
    
  if (upcomingError) {
    console.error('❌ Error fetching upcoming matches:', upcomingError);
    return;
  }
  
  console.log(`⚽ UPCOMING MATCHES: ${upcomingMatches?.length || 0}`);
  
  if (upcomingMatches && upcomingMatches.length > 0) {
    upcomingMatches.slice(0, 10).forEach(match => {
      console.log(`   • ${match.home_team_name} vs ${match.away_team_name} (${match.match_date})`);
    });
    if (upcomingMatches.length > 10) {
      console.log(`   ... and ${upcomingMatches.length - 10} more`);
    }
  } else {
    console.log('   No matches found in upcoming date range');
  }
  
  console.log('');
  
  // Check what date ranges we DO have matches for
  const { data: allMatches, error: allError } = await supabase
    .from('matches')
    .select('match_date')
    .order('match_date', { ascending: true });
    
  if (allError) {
    console.error('❌ Error fetching all matches:', allError);
    return;
  }
  
  if (allMatches && allMatches.length > 0) {
    const dates = allMatches.map(m => m.match_date).filter(Boolean);
    const uniqueDates = [...new Set(dates)].sort();
    
    console.log(`📊 MATCH DATE RANGE IN DATABASE:`);
    console.log(`   • Earliest: ${uniqueDates[0]}`);
    console.log(`   • Latest: ${uniqueDates[uniqueDates.length - 1]}`);
    console.log(`   • Total unique dates: ${uniqueDates.length}`);
    
    // Show some recent dates
    console.log('');
    console.log(`📅 RECENT MATCH DATES (last 10):`);
    uniqueDates.slice(-10).forEach(date => {
      const matchCount = dates.filter(d => d === date).length;
      console.log(`   • ${date} (${matchCount} matches)`);
    });
  }
  
  console.log('');
  console.log('==================================================');
}

checkUpcomingMatches().catch(console.error); 