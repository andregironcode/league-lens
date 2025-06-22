import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function fixMissingTeamIds() {
  console.log('🔧 FIXING MATCHES WITH MISSING TEAM IDS...');
  
  try {
    // Find matches with NULL team IDs in the recent date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5);
    
    const { data: matchesWithMissingTeamIds } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, league_id, match_date, api_data')
      .gte('match_date', startDate.toISOString().split('T')[0])
      .lte('match_date', endDate.toISOString().split('T')[0])
      .or('home_team_id.is.null,away_team_id.is.null');
    
    if (!matchesWithMissingTeamIds || matchesWithMissingTeamIds.length === 0) {
      console.log('✅ No matches found with missing team IDs');
      return;
    }
    
    console.log(`\n🔍 Found ${matchesWithMissingTeamIds.length} matches with missing team IDs:`);
    
    let fixed = 0;
    let failed = 0;
    
    for (const match of matchesWithMissingTeamIds) {
      console.log(`\n🔧 Fixing match ${match.id}...`);
      
      try {
        // If we have api_data, try to extract team IDs from it
        if (match.api_data) {
          const apiData = match.api_data;
          
          const homeTeamId = apiData.homeTeam?.id?.toString() || null;
          const awayTeamId = apiData.awayTeam?.id?.toString() || null;
          
          if (homeTeamId && awayTeamId) {
            console.log(`  📊 Extracting from API data: Home=${homeTeamId}, Away=${awayTeamId}`);
            
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                home_team_id: homeTeamId,
                away_team_id: awayTeamId
              })
              .eq('id', match.id);
            
            if (!updateError) {
              console.log(`  ✅ Fixed match ${match.id}`);
              fixed++;
            } else {
              console.log(`  ❌ Failed to update match ${match.id}: ${updateError.message}`);
              failed++;
            }
          } else {
            console.log(`  ⚠️ API data exists but missing team IDs: Home=${homeTeamId || 'NULL'}, Away=${awayTeamId || 'NULL'}`);
            
            // If API data doesn't have team info, the match might need to be re-fetched
            console.log(`  🔄 This match may need to be re-fetched from the API`);
            failed++;
          }
        } else {
          console.log(`  ❌ No API data available for match ${match.id}`);
          failed++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error processing match ${match.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`  ✅ Fixed: ${fixed} matches`);
    console.log(`  ❌ Failed: ${failed} matches`);
    
    if (fixed > 0) {
      console.log('\n🎉 SUCCESS: Some matches were fixed!');
      
      // Verify the fixes
      console.log('\n🔍 Verifying fixes...');
      const { data: verifyMatches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id')
        .gte('match_date', startDate.toISOString().split('T')[0])
        .lte('match_date', endDate.toISOString().split('T')[0])
        .or('home_team_id.is.null,away_team_id.is.null');
      
      console.log(`Remaining matches with missing team IDs: ${verifyMatches?.length || 0}`);
    }
    
    if (failed > 0) {
      console.log('\n⚠️ Some matches still need attention. You may need to trigger a fresh fetch for those leagues.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

fixMissingTeamIds().catch(console.error); 