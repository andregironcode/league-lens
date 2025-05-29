import { highlightlyService } from '../src/services/highlightlyService.ts';

console.log('Testing getMatchesBySeason method to fetch 2025 season matches grouped by leagues');

async function testMatchesBySeason() {
  try {
    console.log('Fetching matches for 2025 season...');
    const leaguesWithMatches = await highlightlyService.getMatchesBySeason();
    
    console.log(`Found ${leaguesWithMatches.length} leagues with matches for 2025 season`);
    
    // Display each league and its matches
    leaguesWithMatches.forEach((league, index) => {
      console.log(`\n${index + 1}. ${league.name} (ID: ${league.id})`);
      console.log(`   Highlights: ${league.highlights.length}`);
      
      // Display sample highlights for this league
      if (league.highlights.length > 0) {
        console.log('\n   Sample highlights:');
        league.highlights.slice(0, 2).forEach((highlight, i) => {
          console.log(`   ${i + 1}. ${highlight.title}`);
          if (highlight.teams) {
            console.log(`      Teams: ${highlight.teams.home.name} vs ${highlight.teams.away.name}`);
          }
          console.log(`      Video URL: ${highlight.videoUrl}`);
        });
      }
    });
  } catch (error) {
    console.error('Error testing matches by season:', error);
  }
}

testMatchesBySeason();
