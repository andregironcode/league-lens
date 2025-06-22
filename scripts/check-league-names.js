/**
 * Check exact league names in database vs API mapping
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkExactNames() {
  console.log('🔍 Checking league name matching...\n');

  try {
    // Get all leagues from database
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name');

    console.log('🏆 EXACT league names in database:');
    leagues.forEach((league, i) => {
      console.log(`${i+1}. "${league.name}"`);
    });

    console.log('\n📋 Current LEAGUE_API_MAPPING keys:');
    const mapping = [
      'Premier League',
      'La Liga', 
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'UEFA Champions League'
    ];
    
    mapping.forEach((name, i) => {
      console.log(`${i+1}. "${name}"`);
    });

    console.log('\n🔍 MATCHING CHECK:');
    const matches = [];
    const mismatches = [];

    mapping.forEach(mapName => {
      const match = leagues.find(l => l.name === mapName);
      if (match) {
        matches.push({ mapName, dbName: match.name, id: match.id });
        console.log(`✅ "${mapName}" → FOUND`);
      } else {
        mismatches.push(mapName);
        console.log(`❌ "${mapName}" → NOT FOUND`);
      }
    });

    console.log(`\n📊 Results: ${matches.length} matches, ${mismatches.length} mismatches`);

    if (mismatches.length > 0) {
      console.log('\n🔧 FIXING MISMATCHES:');
      mismatches.forEach(missedName => {
        // Try to find similar names
        const similar = leagues.filter(l => 
          l.name.toLowerCase().includes(missedName.toLowerCase()) ||
          missedName.toLowerCase().includes(l.name.toLowerCase())
        );
        
        if (similar.length > 0) {
          console.log(`💡 "${missedName}" might be: ${similar.map(s => `"${s.name}"`).join(', ')}`);
        } else {
          console.log(`⚠️  "${missedName}" - no similar names found`);
        }
      });
    }

    // Generate corrected mapping
    console.log('\n🛠️  CORRECTED LEAGUE_API_MAPPING:');
    console.log('const LEAGUE_API_MAPPING = {');
    
    const API_IDS = {
      'Premier League': 2486,
      'La Liga': 119924,
      'Serie A': 115669,
      'Bundesliga': 67162,
      'Ligue 1': 52695,
      'UEFA Champions League': 2486
    };

    matches.forEach(match => {
      const apiId = API_IDS[match.mapName];
      console.log(`  '${match.dbName}': ${apiId},`);
    });

    // Try to find API IDs for mismatches
    mismatches.forEach(missedName => {
      const similar = leagues.find(l => 
        l.name.toLowerCase().includes(missedName.toLowerCase()) ||
        missedName.toLowerCase().includes(l.name.toLowerCase())
      );
      
      if (similar) {
        const apiId = API_IDS[missedName];
        console.log(`  '${similar.name}': ${apiId}, // was "${missedName}"`);
      }
    });

    console.log('};');

    return { matches, mismatches, leagues };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

checkExactNames()
  .then(result => {
    if (result && result.matches.length === 0) {
      console.log('\n🚨 CRITICAL: No leagues match! Fetch will not work!');
    } else if (result) {
      console.log(`\n✅ Ready to fetch for ${result.matches.length} leagues`);
    }
  })
  .catch(console.error); 