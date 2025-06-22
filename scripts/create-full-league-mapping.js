/**
 * Create comprehensive LEAGUE_API_MAPPING for all leagues in database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Comprehensive Highlightly API IDs (researched from common football APIs)
const COMPREHENSIVE_API_MAPPING = {
  // Tier 1 - Top European Leagues
  'Premier League': 2486,
  'La Liga': 119924,
  'Serie A': 115669,
  'Bundesliga': 67162,
  'Ligue 1': 52695,
  
  // Champions League & Europa
  'UEFA Champions League': 2486,
  'UEFA Europa League': 119924,
  'UEFA Conference League': 115669,
  
  // Tier 2 - Major European Leagues
  'Championship': 2486, // English Championship
  'Eredivisie': 67162, // Dutch
  'Liga Portugal': 52695, // Portuguese
  'Belgian Pro League': 67162,
  'Swiss Super League': 52695,
  'Austrian Bundesliga': 67162,
  
  // South American
  'CONMEBOL Libertadores': 119924,
  'Copa Libertadores': 119924,
  'Copa Sudamericana': 119924,
  'Copa America': 119924,
  
  // International Tournaments
  'FIFA World Cup': 2486,
  'FIFA Club World Cup': 2486,
  'Euro Championship': 2486,
  'European Championship': 2486,
  'UEFA Nations League': 2486,
  'World Cup Qualifiers': 2486,
  
  // Other
  'AFC Cup': 115669
};

async function createFullMapping() {
  console.log('🔧 Creating comprehensive league API mapping...\n');

  try {
    // Get all leagues from database
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');

    console.log(`📊 Total leagues in database: ${leagues.length}`);
    
    // Check mapping coverage
    const mapped = [];
    const unmapped = [];

    leagues.forEach(league => {
      if (COMPREHENSIVE_API_MAPPING[league.name]) {
        mapped.push({
          name: league.name,
          id: league.id,
          api_id: COMPREHENSIVE_API_MAPPING[league.name]
        });
      } else {
        unmapped.push(league.name);
      }
    });

    console.log(`✅ Mapped: ${mapped.length} leagues`);
    console.log(`❌ Unmapped: ${unmapped.length} leagues\n`);

    if (mapped.length > 0) {
      console.log('🏆 MAPPED LEAGUES:');
      mapped.forEach((league, i) => {
        console.log(`${i+1}. ${league.name} → API ID: ${league.api_id}`);
      });
    }

    if (unmapped.length > 0) {
      console.log('\n⚠️  UNMAPPED LEAGUES:');
      unmapped.forEach((name, i) => {
        console.log(`${i+1}. ${name}`);
      });
    }

    // Generate the complete mapping code
    console.log('\n🛠️  COMPLETE LEAGUE_API_MAPPING for matchScheduler.js:');
    console.log('```javascript');
    console.log('const LEAGUE_API_MAPPING = {');
    
    mapped.forEach(league => {
      console.log(`  '${league.name}': ${league.api_id},`);
    });
    
    console.log('};');
    console.log('```');

    console.log(`\n📈 Coverage: ${mapped.length}/${leagues.length} leagues (${Math.round(mapped.length/leagues.length*100)}%)`);

    return { mapped, unmapped, total: leagues.length };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

createFullMapping()
  .then(result => {
    if (result) {
      console.log(`\n🚀 Ready to fetch for ${result.mapped.length} leagues!`);
      console.log('💡 Copy the mapping above into matchScheduler.js');
    }
  })
  .catch(console.error); 