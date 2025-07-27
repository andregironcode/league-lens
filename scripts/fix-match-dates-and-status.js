import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixMatchDatesAndStatus() {
  console.log('🔧 Starting match dates and status fix...');
  
  try {
    // Get all matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }
    
    console.log(`Found ${matches.length} matches to check`);
    
    const now = new Date();
    let updatedCount = 0;
    
    for (const match of matches) {
      const matchDate = new Date(match.match_date);
      const isPast = matchDate < now;
      let shouldUpdate = false;
      let updates = {};
      
      // Check if the match is in the past but status is "Not Started" or similar
      if (isPast && (
        match.status === 'Not Started' || 
        match.status === 'NS' || 
        match.status === 'TBD' ||
        match.status === 'Scheduled' ||
        !match.status
      )) {
        // Update status to FT (Full Time) for past matches
        updates.status = 'FT';
        shouldUpdate = true;
        console.log(`Match ${match.id}: ${match.home_team_id} vs ${match.away_team_id} on ${match.match_date} - Status needs update from "${match.status}" to "FT"`);
      }
      
      // Check if match has scores but wrong status
      if ((match.home_score !== null || match.away_score !== null) && 
          (match.status === 'Not Started' || match.status === 'NS' || match.status === 'TBD')) {
        updates.status = 'FT';
        shouldUpdate = true;
        console.log(`Match ${match.id}: Has scores (${match.home_score}-${match.away_score}) but status is "${match.status}" - updating to "FT"`);
      }
      
      // Update match if needed
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('matches')
          .update(updates)
          .eq('id', match.id);
          
        if (updateError) {
          console.error(`Error updating match ${match.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    
    console.log(`✅ Updated ${updatedCount} matches`);
    
    // Check a specific match as example
    const { data: exampleMatch, error: exampleError } = await supabase
      .from('matches')
      .select('*')
      .eq('match_date', '2025-07-22')
      .limit(1)
      .single();
      
    if (exampleMatch) {
      console.log('\n📋 Example match (2025-07-22):');
      console.log(`ID: ${exampleMatch.id}`);
      console.log(`Date: ${exampleMatch.match_date}`);
      console.log(`Status: ${exampleMatch.status}`);
      console.log(`Score: ${exampleMatch.home_score}-${exampleMatch.away_score}`);
      console.log(`Is past: ${new Date(exampleMatch.match_date) < now}`);
    }
    
  } catch (error) {
    console.error('Error in fixMatchDatesAndStatus:', error);
  }
}

// Run the fix
fixMatchDatesAndStatus();