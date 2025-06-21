/**
 * SYNC ALL HIGHLIGHTS COMPLETE - 2024-2025 SEASON
 * 
 * Comprehensive script to sync highlights for ALL matches in the database
 * This will fetch highlights for all 916+ matches across all leagues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 800; // Slightly faster for highlights
const BATCH_SIZE = 50; // Process matches in batches

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeAPICall(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 404) {
        return []; // No highlights available
      }
      console.log(`❌ ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    return null;
  }
}

async function syncMatchHighlights(match) {
  try {
    const highlights = await makeAPICall('/highlights', {
      matchId: match.id
    });

    if (!highlights || highlights.length === 0) {
      return { success: false, highlightsCount: 0 };
    }

    let savedHighlights = 0;

    for (const highlight of highlights) {
      try {
        const { error } = await supabase
          .from('highlights')
          .upsert({
            id: highlight.id,
            match_id: match.id,
            title: highlight.title || highlight.name || 'Highlight',
            url: highlight.url || highlight.video_url || highlight.link,
            thumbnail: highlight.imgUrl || highlight.thumbnail || highlight.image || null,
            duration: highlight.duration || null,
            type: highlight.type || 'video',
            created_at: highlight.created_at || new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (!error) {
          savedHighlights++;
        }
      } catch (highlightError) {
        // Skip individual highlight errors
        continue;
      }
    }

    return { 
      success: savedHighlights > 0, 
      highlightsCount: savedHighlights,
      totalFound: highlights.length 
    };
  } catch (error) {
    return { success: false, highlightsCount: 0 };
  }
}

async function getMatchInfo(match) {
  const { data: homeTeam } = await supabase
    .from('teams')
    .select('name')
    .eq('id', match.home_team_id)
    .single();
    
  const { data: awayTeam } = await supabase
    .from('teams')
    .select('name')
    .eq('id', match.away_team_id)
    .single();

  const { data: league } = await supabase
    .from('leagues')
    .select('name')
    .eq('id', match.league_id)
    .single();

  return {
    matchName: `${homeTeam?.name || 'Team'} vs ${awayTeam?.name || 'Team'}`,
    leagueName: league?.name || 'League'
  };
}

async function syncAllHighlights() {
  console.log('🎬 SYNCING ALL HIGHLIGHTS - COMPLETE DATABASE');
  console.log('=' .repeat(70));

  const startTime = Date.now();

  try {
    // Get all matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('season', '2024')
      .order('match_date', { ascending: false }); // Recent matches first

    if (matchesError) {
      console.log('❌ Error fetching matches:', matchesError);
      return;
    }

    // Get current highlights count
    const { data: existingHighlights } = await supabase
      .from('highlights')
      .select('match_id', { count: 'exact' });

    const highlightsByMatch = {};
    existingHighlights?.forEach(highlight => {
      const matchId = highlight.match_id;
      if (!highlightsByMatch[matchId]) highlightsByMatch[matchId] = 0;
      highlightsByMatch[matchId]++;
    });

    console.log(`\n📊 Processing ${matches.length} matches:`);
    console.log(`💾 Current highlights: ${existingHighlights?.length || 0}`);
    
    // Categorize matches
    const matchesWithHighlights = matches.filter(m => highlightsByMatch[m.id] > 0);
    const matchesWithoutHighlights = matches.filter(m => !highlightsByMatch[m.id]);
    
    console.log(`✅ Matches with highlights: ${matchesWithHighlights.length}`);
    console.log(`❌ Matches without highlights: ${matchesWithoutHighlights.length}`);
    console.log(`🎯 Target: Process all ${matches.length} matches\n`);

    let totalHighlights = 0;
    let totalNewHighlights = 0;
    let processedMatches = 0;
    let successfulMatches = 0;
    let skippedMatches = 0;

    // Process matches in batches
    for (let i = 0; i < matches.length; i += BATCH_SIZE) {
      const batch = matches.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(matches.length / BATCH_SIZE);
      
      console.log(`\n[BATCH ${batchNum}/${totalBatches}] Processing matches ${i + 1}-${Math.min(i + BATCH_SIZE, matches.length)}`);
      console.log('=' .repeat(60));

      for (const match of batch) {
        processedMatches++;
        const currentHighlights = highlightsByMatch[match.id] || 0;
        
        // Get match info for display
        const { matchName, leagueName } = await getMatchInfo(match);
        
        const progress = `[${processedMatches}/${matches.length}]`;
        
        if (currentHighlights > 0) {
          console.log(`${progress} ✅ ${matchName} - ${currentHighlights} highlights [${leagueName}]`);
          skippedMatches++;
          totalHighlights += currentHighlights;
          continue;
        }

        console.log(`${progress} 🎬 ${matchName} [${leagueName}]`);
        
        const result = await syncMatchHighlights(match);
        
        if (result.success) {
          successfulMatches++;
          totalNewHighlights += result.highlightsCount;
          totalHighlights += result.highlightsCount;
          console.log(`     ✅ Found ${result.totalFound} → Saved ${result.highlightsCount} highlights`);
        } else {
          console.log(`     ❌ No highlights available`);
        }

        // Rate limiting
        if (processedMatches % 10 === 0) {
          await delay(RATE_LIMIT_DELAY);
        }
      }
      
      // Progress update
      const progressPercent = Math.round((processedMatches / matches.length) * 100);
      console.log(`\n📈 Progress: ${progressPercent}% (${processedMatches}/${matches.length}) | New highlights: ${totalNewHighlights}`);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Final summary
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 ALL HIGHLIGHTS SYNC COMPLETE');
    console.log('=' .repeat(70));
    console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
    console.log(`🎬 Total highlights in database: ${totalHighlights}`);
    console.log(`🆕 New highlights added: ${totalNewHighlights}`);
    console.log(`⚽ Processed matches: ${processedMatches}`);
    console.log(`✅ Successful new highlights: ${successfulMatches}`);
    console.log(`⏭️  Skipped (already had highlights): ${skippedMatches}`);
    console.log(`❌ No highlights available: ${processedMatches - successfulMatches - skippedMatches}`);

    // Coverage statistics
    const successRate = Math.round((successfulMatches + skippedMatches) / processedMatches * 100);
    console.log(`\n📊 Highlights coverage: ${successRate}% of matches`);
    
    // Final database verification
    const { data: finalHighlights } = await supabase
      .from('highlights')
      .select('id', { count: 'exact' });

    console.log(`\n💾 FINAL DATABASE COUNT: ${finalHighlights?.length || 0} highlights`);
    console.log(`📈 Total improvement: +${(finalHighlights?.length || 0) - (existingHighlights?.length || 0)} highlights`);

    // Sample highlights
    const { data: sampleHighlights } = await supabase
      .from('highlights')
      .select(`
        title,
        matches:match_id (
          teams:home_team_id (name),
          away_teams:away_team_id (name)
        )
      `)
      .limit(5);

    if (sampleHighlights?.length > 0) {
      console.log(`\n🎬 Sample highlights:`);
      sampleHighlights.forEach(highlight => {
        console.log(`   📹 ${highlight.title}`);
      });
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

syncAllHighlights(); 