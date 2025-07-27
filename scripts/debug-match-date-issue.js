import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMatchDateIssue() {
  console.log('🔍 Debugging match date issue...');
  console.log('Current date:', new Date().toISOString());
  console.log('Today is:', new Date().toISOString().split('T')[0]);
  
  try {
    // Look for matches on July 22, 2025
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        status,
        home_score,
        away_score,
        home_team_id,
        away_team_id,
        api_data,
        created_at,
        updated_at
      `)
      .eq('match_date', '2025-07-22')
      .limit(5);
      
    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }
    
    console.log(`\nFound ${matches?.length || 0} matches on 2025-07-22:`);
    
    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        console.log(`\n--- Match ${index + 1} ---`);
        console.log(`ID: ${match.id}`);
        console.log(`Match Date: ${match.match_date}`);
        console.log(`Status: ${match.status}`);
        console.log(`Score: ${match.home_score}-${match.away_score}`);
        console.log(`Created: ${match.created_at}`);
        console.log(`Updated: ${match.updated_at}`);
        
        // Check if this is actually a future date
        const matchDate = new Date(match.match_date);
        const now = new Date();
        console.log(`Is future? ${matchDate > now}`);
        console.log(`Days difference: ${Math.round((matchDate - now) / (1000 * 60 * 60 * 24))}`);
        
        // Check API data for original date
        if (match.api_data) {
          console.log(`API Date: ${match.api_data.date}`);
          console.log(`API Time: ${match.api_data.time}`);
          console.log(`API Status: ${match.api_data.status}`);
        }
      });
    }
    
    // Also check for matches that should be in the past but have wrong dates
    console.log('\n\n🔍 Checking for matches with future dates that have scores...');
    
    const { data: futureMatchesWithScores, error: futureError } = await supabase
      .from('matches')
      .select('id, match_date, status, home_score, away_score')
      .gt('match_date', new Date().toISOString().split('T')[0])
      .not('home_score', 'is', null)
      .limit(10);
      
    if (futureMatchesWithScores && futureMatchesWithScores.length > 0) {
      console.log(`\nFound ${futureMatchesWithScores.length} future matches with scores (likely date errors):`);
      futureMatchesWithScores.forEach(match => {
        console.log(`- Match ${match.id}: ${match.match_date}, Status: ${match.status}, Score: ${match.home_score}-${match.away_score}`);
      });
    } else {
      console.log('No future matches with scores found.');
    }
    
    // Check date format in database
    console.log('\n\n🔍 Checking date formats in database...');
    const { data: sampleMatches, error: sampleError } = await supabase
      .from('matches')
      .select('id, match_date, api_data')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (sampleMatches) {
      console.log('\nSample of recent match dates:');
      sampleMatches.forEach(match => {
        console.log(`- Match ${match.id}: ${match.match_date} (API: ${match.api_data?.date || 'N/A'})`);
      });
    }
    
  } catch (error) {
    console.error('Error in debugMatchDateIssue:', error);
  }
}

// Run the debug
debugMatchDateIssue();