/**
 * Check and fix league api_id values for fetching
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Known Highlightly API IDs for major leagues
const LEAGUE_API_IDS = {
  'Premier League': 2486,
  'English Premier League': 2486,
  'La Liga': 119924,
  'Spanish La Liga': 119924,
  'Serie A': 115669,
  'Italian Serie A': 115669,
  'Bundesliga': 67162,
  'German Bundesliga': 67162,
  'Ligue 1': 52695,
  'French Ligue 1': 52695,
  'UEFA Champions League': 33973,
  'Champions League': 33973,
  'UEFA Europa League': 119924,
  'Europa League': 119924
};

async function checkAndFixLeagues() {
  console.log('🔍 Checking league api_id values...\n');

  try {
    // Get all leagues
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name, api_id');

    if (error) {
      throw new Error(`Failed to fetch leagues: ${error.message}`);
    }

    console.log(`📊 Total leagues: ${leagues.length}`);
    
    // Check current api_id status
    const withApiId = leagues.filter(l => l.api_id !== null);
    const withoutApiId = leagues.filter(l => l.api_id === null);
    
    console.log(`✅ Leagues with API ID: ${withApiId.length}`);
    console.log(`❌ Leagues without API ID: ${withoutApiId.length}\n`);

    if (withApiId.length > 0) {
      console.log('🏆 Leagues ready for fetching:');
      withApiId.forEach(league => {
        console.log(`   ${league.name} (ID: ${league.api_id})`);
      });
      console.log('');
    }

    // Try to fix missing api_ids
    console.log('🔧 Attempting to fix missing API IDs...\n');
    
    let fixed = 0;
    for (const league of withoutApiId) {
      // Try to find matching API ID
      const apiId = LEAGUE_API_IDS[league.name] || 
                   Object.entries(LEAGUE_API_IDS).find(([name]) => 
                     league.name.toLowerCase().includes(name.toLowerCase()) ||
                     name.toLowerCase().includes(league.name.toLowerCase())
                   )?.[1];

      if (apiId) {
        console.log(`🔄 Setting ${league.name} → API ID: ${apiId}`);
        
        const { error: updateError } = await supabase
          .from('leagues')
          .update({ api_id: apiId })
          .eq('id', league.id);

        if (!updateError) {
          fixed++;
        } else {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} league API IDs`);

    // Final status
    const { data: updatedLeagues } = await supabase
      .from('leagues')
      .select('id, name, api_id')
      .not('api_id', 'is', null);

    console.log(`\n📈 Final status: ${updatedLeagues.length} leagues ready for fetching`);
    
    if (updatedLeagues.length > 0) {
      console.log('\n🎯 Ready to fetch matches for:');
      updatedLeagues.forEach(league => {
        console.log(`   ✅ ${league.name} (API ID: ${league.api_id})`);
      });
    } else {
      console.log('\n⚠️  No leagues have API IDs. Manual fetch will not work.');
      console.log('💡 You may need to research and add correct Highlightly API IDs for your leagues.');
    }

    return updatedLeagues.length;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return 0;
  }
}

checkAndFixLeagues()
  .then(readyLeagues => {
    if (readyLeagues > 0) {
      console.log(`\n🚀 Ready to test fetch! Run:`);
      console.log(`   POST http://localhost:3001/api/admin/fetch-matches`);
    }
  })
  .catch(console.error); 