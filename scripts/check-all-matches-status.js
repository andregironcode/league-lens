/**
 * CHECK ALL MATCHES STATUS
 * 
 * This script checks ALL matches in the database to understand the full scope
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllMatchesStatus() {
  console.log('🔍 CHECKING ALL MATCHES STATUS');
  console.log('=' .repeat(60));

  try {
    // Get ALL matches without any filters
    console.log('📊 Fetching ALL matches from database...');
    const { data: allMatches, error: allError } = await supabase
      .from('matches')
      .select('id, status, match_date, league_id')
      .order('match_date', { ascending: false });

    if (allError) {
      console.log(`❌ Error fetching all matches: ${allError.message}`);
      return;
    }

    console.log(`✅ Found ${allMatches.length} total matches in database`);

    // Count by status
    const statusCounts = {};
    const statusSamples = {};
    
    allMatches.forEach(match => {
      const status = match.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Keep sample for each status
      if (!statusSamples[status]) {
        statusSamples[status] = [];
      }
      if (statusSamples[status].length < 3) {
        statusSamples[status].push(match);
      }
    });

    console.log(`\n📋 STATUS BREAKDOWN:`);
    Object.keys(statusCounts).sort().forEach(status => {
      const count = statusCounts[status];
      const percentage = Math.round((count / allMatches.length) * 100);
      console.log(`   ${status}: ${count} matches (${percentage}%)`);
      
      // Show samples
      if (statusSamples[status]) {
        statusSamples[status].forEach((sample, i) => {
          console.log(`      ${i + 1}. Match ${sample.id} - League ${sample.league_id} - ${sample.match_date}`);
        });
      }
    });

    // Check which statuses might have highlights
    const potentialHighlightStatuses = ['finished', 'completed', 'ended', 'final'];
    let potentialMatches = 0;
    
    Object.keys(statusCounts).forEach(status => {
      if (potentialHighlightStatuses.some(s => status.toLowerCase().includes(s.toLowerCase()))) {
        potentialMatches += statusCounts[status];
      }
    });

    console.log(`\n🎬 HIGHLIGHTS POTENTIAL:`);
    console.log(`   🎯 Matches that might have highlights: ${potentialMatches}`);
    console.log(`   📈 Percentage of total: ${Math.round((potentialMatches / allMatches.length) * 100)}%`);

    // Get current highlights status
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('id, match_id')
      .not('match_id', 'is', null);

    if (!highlightsError && highlights) {
      const uniqueMatchesWithHighlights = new Set(highlights.map(h => h.match_id)).size;
      console.log(`   💾 Matches currently with highlights: ${uniqueMatchesWithHighlights}`);
      console.log(`   📊 Coverage: ${Math.round((uniqueMatchesWithHighlights / potentialMatches) * 100)}%`);
      console.log(`   ⚠️  Matches missing highlights: ${potentialMatches - uniqueMatchesWithHighlights}`);
    }

    // League breakdown
    const leagueCounts = {};
    allMatches.forEach(match => {
      const leagueId = match.league_id || 'unknown';
      leagueCounts[leagueId] = (leagueCounts[leagueId] || 0) + 1;
    });

    console.log(`\n🏆 TOP LEAGUES BY MATCH COUNT:`);
    Object.entries(leagueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([leagueId, count]) => {
        console.log(`   League ${leagueId}: ${count} matches`);
      });

    console.log(`\n🎯 RECOMMENDATION:`);
    if (allMatches.length > 4000) {
      console.log(`   🚀 Process ALL ${allMatches.length} matches for highlights!`);
      console.log(`   ⏱️  Estimated time: ${Math.round(allMatches.length * 0.5 / 60)} minutes`);
    }

  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

checkAllMatchesStatus(); 