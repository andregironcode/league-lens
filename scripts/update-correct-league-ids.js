/**
 * UPDATE CORRECT LEAGUE IDS
 * 
 * Update our database with the actual Highlightly API league IDs
 * from the official API documentation
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateCorrectLeagueIds() {
  console.log('🔄 UPDATING LEAGUE IDS WITH CORRECT HIGHLIGHTLY API IDS');
  console.log('='.repeat(60));

  // Mapping of our current names to correct Highlightly API data
  const correctLeagues = [
    // Big 5 European Leagues - KEEP EXISTING CORRECT IDS
    {
      currentName: 'Premier League',
      id: 33973,
      name: 'Premier League',
      logo: 'https://highlightly.net/soccer/images/leagues/33973.png',
      country_code: 'GB-ENG',
      country_name: 'England',
      country_logo: 'https://highlightly.net/soccer/images/countries/GB-ENG.svg',
      priority: true
    },
    {
      currentName: 'La Liga',
      id: 119924,
      name: 'La Liga',
      logo: 'https://highlightly.net/soccer/images/leagues/119924.png',
      country_code: 'ES',
      country_name: 'Spain',
      country_logo: 'https://highlightly.net/soccer/images/countries/ES.svg',
      priority: true
    },
    {
      currentName: 'Serie A',
      id: 115669,
      name: 'Serie A',
      logo: 'https://highlightly.net/soccer/images/leagues/115669.png',
      country_code: 'IT',
      country_name: 'Italy',
      country_logo: 'https://highlightly.net/soccer/images/countries/IT.svg',
      priority: true
    },
    {
      currentName: 'Bundesliga',
      id: 67162,
      name: 'Bundesliga',
      logo: 'https://highlightly.net/soccer/images/leagues/67162.png',
      country_code: 'DE',
      country_name: 'Germany',
      country_logo: 'https://highlightly.net/soccer/images/countries/DE.svg',
      priority: true
    },
    {
      currentName: 'Ligue 1',
      id: 52695,
      name: 'Ligue 1',
      logo: 'https://highlightly.net/soccer/images/leagues/52695.png',
      country_code: 'FR',
      country_name: 'France',
      country_logo: 'https://highlightly.net/soccer/images/countries/FR.svg',
      priority: true
    },

    // Major International Club Competitions - UPDATE WITH CORRECT IDS
    {
      currentName: 'UEFA Champions League',
      id: 2486,
      name: 'UEFA Champions League',
      logo: 'https://highlightly.net/soccer/images/leagues/2486.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },
    {
      currentName: 'UEFA Europa League',
      id: 3337,
      name: 'UEFA Europa League',
      logo: 'https://highlightly.net/soccer/images/leagues/3337.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },

    // International Tournaments - UPDATE WITH CORRECT IDS
    {
      currentName: 'UEFA Euro Championship',
      id: 4188,
      name: 'Euro Championship',
      logo: 'https://highlightly.net/soccer/images/leagues/4188.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },
    {
      currentName: 'Copa America',
      id: 8443,
      name: 'Copa America',
      logo: 'https://highlightly.net/soccer/images/leagues/8443.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },
    {
      currentName: 'FIFA Club World Cup',
      id: 13549,
      name: 'FIFA Club World Cup',
      logo: 'https://highlightly.net/soccer/images/leagues/13549.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },
    {
      currentName: 'CONMEBOL Libertadores',
      id: 11847,
      name: 'CONMEBOL Libertadores',
      logo: 'https://highlightly.net/soccer/images/leagues/11847.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    },

    // Additional Popular Leagues - UPDATE WITH CORRECT IDS
    {
      currentName: 'EFL Championship',
      id: 34824,
      name: 'Championship',
      logo: 'https://highlightly.net/soccer/images/leagues/34824.png',
      country_code: 'GB-ENG',
      country_name: 'England',
      country_logo: 'https://highlightly.net/soccer/images/countries/GB-ENG.svg',
      priority: false
    },
    {
      currentName: 'AFC Cup',
      id: 16102,
      name: 'AFC Cup',
      logo: 'https://highlightly.net/soccer/images/leagues/16102.png',
      country_code: 'World',
      country_name: 'World',
      country_logo: 'https://highlightly.net/soccer/images/countries/World.png',
      priority: false
    }
  ];

  let updatedCount = 0;
  let addedCount = 0;

  for (const league of correctLeagues) {
    console.log(`\n🔄 Processing ${league.name}...`);

    // First, try to find existing league by name
    const { data: existing } = await supabase
      .from('leagues')
      .select('*')
      .eq('name', league.currentName)
      .single();

    if (existing) {
      // Update existing league with correct ID and data
      console.log(`   📝 Updating existing league: ${existing.name} (${existing.id} → ${league.id})`);
      
      const { error } = await supabase
        .from('leagues')
        .update({
          id: league.id,
          name: league.name,
          logo: league.logo,
          country_code: league.country_code,
          country_name: league.country_name,
          country_logo: league.country_logo,
          priority: league.priority,
          current_season: 2024
        })
        .eq('name', league.currentName);

      if (error) {
        console.log(`   ❌ Error updating ${league.name}: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${league.name} with correct ID ${league.id}`);
        updatedCount++;
      }
    } else {
      // Add new league
      console.log(`   ➕ Adding new league: ${league.name}`);
      
      const { error } = await supabase
        .from('leagues')
        .insert({
          id: league.id,
          name: league.name,
          logo: league.logo,
          country_code: league.country_code,
          country_name: league.country_name,
          country_logo: league.country_logo,
          priority: league.priority,
          current_season: 2024
        });

      if (error) {
        console.log(`   ❌ Error adding ${league.name}: ${error.message}`);
      } else {
        console.log(`   ✅ Added ${league.name} with ID ${league.id}`);
        addedCount++;
      }
    }
  }

  // Clean up old leagues with 999xxx IDs that don't exist in the API
  console.log('\n🧹 Cleaning up invalid league IDs...');
  
  const invalidIds = [999001, 999002, 999003, 999004, 999005, 999006, 999007, 999008, 999009, 999010];
  
  for (const invalidId of invalidIds) {
    const { data: invalidLeague } = await supabase
      .from('leagues')
      .select('name')
      .eq('id', invalidId)
      .single();

    if (invalidLeague) {
      console.log(`   🗑️  Removing invalid league ID ${invalidId}: ${invalidLeague.name}`);
      
      const { error } = await supabase
        .from('leagues')
        .delete()
        .eq('id', invalidId);

      if (error) {
        console.log(`   ❌ Error removing ${invalidId}: ${error.message}`);
      } else {
        console.log(`   ✅ Removed invalid league ${invalidId}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 LEAGUE IDS UPDATE COMPLETE!');
  console.log('='.repeat(60));
  console.log(`✅ Updated leagues: ${updatedCount}`);
  console.log(`➕ Added leagues: ${addedCount}`);
  console.log('🏆 All leagues now have correct Highlightly API IDs!');
  console.log('🚀 Ready to sync standings and teams data!');
}

// Run the update
updateCorrectLeagueIds().catch(console.error); 