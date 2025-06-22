/**
 * Check current highlights status
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkHighlightsStatus() {
  console.log('🔍 Checking current highlights status...\n');

  try {
    // Get highlights count
    const { count: highlightsCount, error: hError } = await supabase
      .from('highlights')
      .select('*', { count: 'exact', head: true });

    if (hError) {
      console.log('❌ Error fetching highlights:', hError.message);
      return;
    }

    // Get finished matches count
    const { count: finishedMatchesCount, error: mError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finished');

    if (mError) {
      console.log('❌ Error fetching finished matches:', mError.message);
      return;
    }

    // Get total matches count
    const { count: totalMatchesCount, error: tmError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    if (tmError) {
      console.log('❌ Error fetching total matches:', tmError.message);
      return;
    }

    // Get leagues count
    const { count: leaguesCount, error: lError } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true });

    if (lError) {
      console.log('❌ Error fetching leagues:', lError.message);
      return;
    }

    console.log('📊 CURRENT DATABASE STATUS:');
    console.log('==============================');
    console.log(`🏆 Leagues: ${leaguesCount}`);
    console.log(`⚽ Total matches: ${totalMatchesCount}`);
    console.log(`🏁 Finished matches: ${finishedMatchesCount}`);
    console.log(`🎬 Highlights: ${highlightsCount}`);
    console.log(`📈 Coverage: ${finishedMatchesCount > 0 ? ((highlightsCount / finishedMatchesCount) * 100).toFixed(1) : 0}%`);
    
    if (highlightsCount === 0) {
      console.log('\n🚨 NO HIGHLIGHTS FOUND - Sync is needed!');
    } else if (highlightsCount < finishedMatchesCount) {
      console.log(`\n⚠️  PARTIAL SYNC - Missing ${finishedMatchesCount - highlightsCount} highlights`);
    } else {
      console.log('\n✅ SYNC COMPLETE - All finished matches have highlights!');
    }

  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

checkHighlightsStatus().catch(console.error); 