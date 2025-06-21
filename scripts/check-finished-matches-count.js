/**
 * CHECK FINISHED MATCHES COUNT
 * 
 * This script checks how many finished matches we have in total
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFinishedMatchesCount() {
  console.log('📊 CHECKING FINISHED MATCHES COUNT');
  console.log('=' .repeat(50));

  try {
    // Get total matches count
    const { data: allMatches, error: allError } = await supabase
      .from('matches')
      .select('id', { count: 'exact' });

    if (allError) {
      console.log(`❌ Error fetching total matches: ${allError.message}`);
      return;
    }

    // Get finished matches count
    const { data: finishedMatches, error: finishedError } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .eq('status', 'finished');

    if (finishedError) {
      console.log(`❌ Error fetching finished matches: ${finishedError.message}`);
      return;
    }

    // Get matches by status
    const { data: statusBreakdown, error: statusError } = await supabase
      .from('matches')
      .select('status')
      .order('status');

    if (statusError) {
      console.log(`❌ Error fetching status breakdown: ${statusError.message}`);
      return;
    }

    // Count by status
    const statusCounts = {};
    statusBreakdown.forEach(match => {
      statusCounts[match.status] = (statusCounts[match.status] || 0) + 1;
    });

    // Get current highlights count
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('id', { count: 'exact' });

    if (highlightsError) {
      console.log(`❌ Error fetching highlights: ${highlightsError.message}`);
      return;
    }

    // Get linked highlights count
    const { data: linkedHighlights, error: linkedError } = await supabase
      .from('highlights')
      .select('id', { count: 'exact' })
      .not('match_id', 'is', null);

    if (linkedError) {
      console.log(`❌ Error fetching linked highlights: ${linkedError.message}`);
      return;
    }

    console.log(`\n📊 MATCH COUNTS:`);
    console.log(`   🎯 Total matches: ${allMatches.length}`);
    console.log(`   ✅ Finished matches: ${finishedMatches.length}`);
    console.log(`   📈 Percentage finished: ${Math.round((finishedMatches.length / allMatches.length) * 100)}%`);

    console.log(`\n📋 STATUS BREAKDOWN:`);
    Object.keys(statusCounts).sort().forEach(status => {
      const count = statusCounts[status];
      const percentage = Math.round((count / allMatches.length) * 100);
      console.log(`   ${status}: ${count} matches (${percentage}%)`);
    });

    console.log(`\n🎬 HIGHLIGHTS STATUS:`);
    console.log(`   📺 Total highlights: ${highlights.length}`);
    console.log(`   🔗 Linked highlights: ${linkedHighlights.length}`);
    console.log(`   📊 Linkage rate: ${Math.round((linkedHighlights.length / highlights.length) * 100)}%`);

    const estimatedMissingHighlights = finishedMatches.length - Math.floor(linkedHighlights.length / 2); // Assuming ~2 highlights per match
    console.log(`   ⚠️  Estimated missing highlights: ${Math.max(0, estimatedMissingHighlights)} matches need highlights`);

    console.log(`\n🎯 RECOMMENDATION:`);
    if (finishedMatches.length > 500) {
      console.log(`   🚀 Run comprehensive sync for ALL ${finishedMatches.length} finished matches!`);
      console.log(`   ⏱️  Estimated time: ${Math.round(finishedMatches.length * 0.6 / 60)} minutes`);
    } else {
      console.log(`   ✅ Current 500 match limit is sufficient`);
    }

  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

checkFinishedMatchesCount(); 