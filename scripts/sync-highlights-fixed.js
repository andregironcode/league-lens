/**
 * SYNC HIGHLIGHTS - FIXED VERSION
 * 
 * Working highlights sync script that matches the actual database schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 1200;
const BATCH_SIZE = 20;

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
        return [];
      }
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
        // Match the actual database schema
        const highlightData = {
          id: highlight.id,
          match_id: match.id,
          title: highlight.title || 'Highlight',
          url: highlight.url,
          thumbnail: highlight.imgUrl || null,
          duration: highlight.duration || null,
          embed_url: highlight.embedUrl || null,
          views: 0,
          quality: null,
          api_data: highlight, // Store the full API response
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('highlights')
          .upsert(highlightData, {
            onConflict: 'id'
          });

        if (!error) {
          savedHighlights++;
        } else {
          console.log(`     ⚠️  Highlight ${highlight.id} error:`, error.message);
        }
      } catch (highlightError) {
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
  try {
    const [homeTeam, awayTeam, league] = await Promise.all([
      supabase.from('teams').select('name').eq('id', match.home_team_id).single(),
      supabase.from('teams').select('name').eq('id', match.away_team_id).single(),
      supabase.from('leagues').select('name').eq('id', match.league_id).single()
    ]);

    return {
      matchName: `${homeTeam.data?.name || 'Team'} vs ${awayTeam.data?.name || 'Team'}`,
      leagueName: league.data?.name || 'League'
    };
  } catch (error) {
    return {
      matchName: 'Unknown vs Unknown',
      leagueName: 'Unknown League'
    };
  }
}

async function syncHighlightsFixed() {
  console.log('🎬 SYNCING HIGHLIGHTS - FIXED VERSION');
  console.log('=' .repeat(70));

  const startTime = Date.now();

  try {
    // Get finished matches (most likely to have highlights)
    const { data: finishedMatches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('season', '2024')
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(100); // Start with recent 100 finished matches

    if (matchesError) {
      console.log('❌ Error fetching matches:', matchesError);
      return;
    }

    // Get current highlights
    const { data: existingHighlights } = await supabase
      .from('highlights')
      .select('match_id')
      .not('match_id', 'is', null);

    const highlightsByMatch = {};
    existingHighlights?.forEach(highlight => {
      highlightsByMatch[highlight.match_id] = true;
    });

    const matchesWithoutHighlights = finishedMatches.filter(m => !highlightsByMatch[m.id]);

    console.log(`\n📊 Analysis:`);
    console.log(`   🏁 Finished matches: ${finishedMatches.length}`);
    console.log(`   💾 Existing highlights: ${existingHighlights?.length || 0}`);
    console.log(`   🎯 Matches needing highlights: ${matchesWithoutHighlights.length}`);

    if (matchesWithoutHighlights.length === 0) {
      console.log('\n🎉 All finished matches already have highlights!');
      return;
    }

    let totalNewHighlights = 0;
    let processedMatches = 0;
    let successfulMatches = 0;

    // Process in batches
    for (let i = 0; i < matchesWithoutHighlights.length; i += BATCH_SIZE) {
      const batch = matchesWithoutHighlights.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(matchesWithoutHighlights.length / BATCH_SIZE);
      
      console.log(`\n[BATCH ${batchNum}/${totalBatches}] Processing ${batch.length} matches`);
      console.log('=' .repeat(60));

      for (const match of batch) {
        processedMatches++;
        
        const { matchName, leagueName } = await getMatchInfo(match);
        const progress = `[${processedMatches}/${matchesWithoutHighlights.length}]`;
        
        console.log(`${progress} 🎬 ${matchName} [${leagueName}]`);
        
        const result = await syncMatchHighlights(match);
        
        if (result.success) {
          successfulMatches++;
          totalNewHighlights += result.highlightsCount;
          console.log(`     ✅ Found ${result.totalFound} → Saved ${result.highlightsCount} highlights`);
        } else {
          console.log(`     ❌ No highlights available`);
        }

        // Rate limiting
        await delay(RATE_LIMIT_DELAY);
      }
      
      // Progress update
      const progressPercent = Math.round((processedMatches / matchesWithoutHighlights.length) * 100);
      console.log(`\n📈 Batch Progress: ${progressPercent}% | New highlights: ${totalNewHighlights}`);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Final summary
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 HIGHLIGHTS SYNC COMPLETE');
    console.log('=' .repeat(70));
    console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
    console.log(`🎬 New highlights added: ${totalNewHighlights}`);
    console.log(`⚽ Matches processed: ${processedMatches}`);
    console.log(`✅ Successful: ${successfulMatches}`);
    console.log(`❌ No highlights: ${processedMatches - successfulMatches}`);

    const successRate = Math.round((successfulMatches / processedMatches) * 100);
    console.log(`\n📊 Success rate: ${successRate}% of finished matches`);
    
    // Final verification
    const { data: finalHighlights } = await supabase
      .from('highlights')
      .select('id', { count: 'exact' })
      .not('match_id', 'is', null);

    console.log(`\n💾 FINAL LINKED HIGHLIGHTS: ${finalHighlights?.length || 0}`);
    console.log(`📈 New linked highlights: +${totalNewHighlights}`);

    // Sample new highlights
    if (totalNewHighlights > 0) {
      const { data: sampleHighlights } = await supabase
        .from('highlights')
        .select(`
          title,
          url,
          matches:match_id (
            teams:home_team_id (name),
            away_teams:away_team_id (name)
          )
        `)
        .not('match_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sampleHighlights?.length > 0) {
        console.log(`\n🎬 Sample new highlights:`);
        sampleHighlights.forEach((highlight, i) => {
          const match = highlight.matches;
          const matchStr = match ? `${match.teams?.name} vs ${match.away_teams?.name}` : 'Unknown Match';
          console.log(`   ${i+1}. ${highlight.title?.substring(0, 50)}... [${matchStr}]`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

syncHighlightsFixed(); 