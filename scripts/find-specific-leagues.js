/**
 * FIND SPECIFIC LEAGUES
 * 
 * Script to find Spanish, Italian and other major European leagues
 */

async function findSpecificLeagues() {
  console.log('🔍 FINDING SPECIFIC LEAGUES');
  console.log('='.repeat(50));

  try {
    // Get all leagues
    const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=100');
    const data = await response.json();
    
    // Group leagues by country
    const countriesOfInterest = ['Spain', 'Italy', 'Germany', 'France', 'England'];
    
    countriesOfInterest.forEach(country => {
      console.log(`\n🇪🇸 ${country.toUpperCase()} LEAGUES:`);
      console.log('-'.repeat(30));
      
      const countryLeagues = data.data?.filter(league => 
        league.country?.name === country
      ) || [];
      
      if (countryLeagues.length > 0) {
        countryLeagues.forEach(league => {
          console.log(`   • ID: ${league.id} - ${league.name}`);
        });
      } else {
        console.log(`   No leagues found for ${country}`);
      }
    });

    // Also search for common league names
    console.log('\n🔍 SEARCHING BY COMMON NAMES:');
    console.log('-'.repeat(30));
    
    const searchTerms = ['primera', 'liga', 'serie', 'division', 'laliga'];
    
    searchTerms.forEach(term => {
      const matches = data.data?.filter(league => 
        league.name.toLowerCase().includes(term)
      ) || [];
      
      if (matches.length > 0) {
        console.log(`\n"${term}" matches:`);
        matches.slice(0, 10).forEach(league => {  // Limit to first 10
          console.log(`   • ID: ${league.id} - ${league.name} (${league.country?.name})`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findSpecificLeagues(); 