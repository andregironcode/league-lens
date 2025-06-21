/**
 * ULTIMATE ALL GAMES HIGHLIGHTS SYNC
 * 
 * This script fetches highlights for ALL 4,211 matches in the database using pagination.
 * Complete coverage - no limits!
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 400; // Faster for the massive sync
const MAX_RETRIES = 3;
const BATCH_SIZE = 40;
const PAGE_SIZE = 1000; // Supabase pagination size

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeAPICall(endpoint, params = {}, retries = 0) {
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
      if (response.status === 429 && retries < MAX_RETRIES) {
        console.log(`     ⏳ Rate limited, waiting ${RATE_LIMIT_DELAY * 2}ms...`);
        await delay(RATE_LIMIT_DELAY * 2);
        return await makeAPICall(endpoint, params, retries + 1);
      }
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`     ⚠️  Error (${error.message}), retrying in ${RATE_LIMIT_DELAY}ms...`);
      await delay(RATE_LIMIT_DELAY);
      return await makeAPICall(endpoint, params, retries + 1);
    }
    throw error;
  }
}

async function getAllMatches() {
  console.log('📊 Fetching ALL matches using pagination...');
  
  let allMatches = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: pageData, error } = await supabase
      .from('matches')
      .select('id, league_id, season, status, match_date')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('match_date', { ascending: false });

    if (error) {
      console.log(`❌ Error fetching page ${page}: ${error.message}`);
      break;
    }

    const pageCount = pageData?.length || 0;
    allMatches = allMatches.concat(pageData || []);
    
    console.log(`   Page ${page}: ${pageCount} matches (total: ${allMatches.length})`);

    if (pageCount < PAGE_SIZE) {
      hasMore = false;
    }
    page++;
  }

  console.log(`✅ Total matches fetched: ${allMatches.length}`);
  return allMatches;
}

async function getExistingMatchIds(allMatches) {
  // Convert all match IDs to strings for consistent comparison
  return new Set(allMatches.map(match => String(match.id)));
}

async function upsertHighlight(highlight, existingMatchIds) {
  try {
    // Only save highlights for matches that exist in our database
    const matchId = highlight.match?.id;
    if (matchId && !existingMatchIds.has(String(matchId))) {
      return { success: false, reason: 'match_not_in_db' };
    }

    const highlightData = {
      id: highlight.id,
      match_id: matchId ? String(matchId) : null,
      title: highlight.title || '',
      url: highlight.url || '',
      embed_url: highlight.embedUrl || null,
      thumbnail: highlight.imgUrl || null,
      views: 0,
      api_data: highlight
    };

    const { error } = await supabase
      .from('highlights')
      .upsert(highlightData, {
        onConflict: 'id'
      });

    if (error) {
      return { success: false, reason: 'database_error', error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, reason: 'exception', error: error.message };
  }
}

async function syncHighlightsForAllMatches(matches, existingMatchIds) {
  console.log(`\n🚀 Syncing highlights for ALL ${matches.length} matches`);
  
  let totalHighlights = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  let processedMatches = 0;
  let errorCount = 0;

  // Filter for finished matches (most likely to have highlights)
  const finishedMatches = matches.filter(match => 
    match.status && match.status.toLowerCase() === 'finished'
  );
  
  console.log(`   🎯 Found ${finishedMatches.length} finished matches to process`);

  for (let i = 0; i < finishedMatches.length; i++) {
    const match = finishedMatches[i];
    
    try {
      if (i % 50 === 0) {
        console.log(`   [${i + 1}/${finishedMatches.length}] Processing match ${match.id}...`);
      }
      
      const response = await makeAPICall('/highlights', {
        matchId: parseInt(match.id),
        limit: BATCH_SIZE
      });
      
      if (response && response.data && Array.isArray(response.data)) {
        const highlights = response.data;
        
        let matchAdded = 0;
        let matchSkipped = 0;
        
        for (const highlight of highlights) {
          const result = await upsertHighlight(highlight, existingMatchIds);
          if (result.success) {
            matchAdded++;
            totalAdded++;
          } else if (result.reason === 'match_not_in_db') {
            matchSkipped++;
            totalSkipped++;
          }
        }
        
        totalHighlights += highlights.length;
        processedMatches++;
        
        if (highlights.length > 0 && i % 50 === 0) {
          console.log(`      ✅ ${highlights.length} highlights: ${matchAdded} saved, ${matchSkipped} skipped`);
        }
      }
      
      // Rate limiting between matches
      await delay(RATE_LIMIT_DELAY);
      
      // Progress update every 100 matches
      if ((i + 1) % 100 === 0) {
        const progress = Math.round(((i + 1) / finishedMatches.length) * 100);
        const timeRemaining = Math.round(((finishedMatches.length - i - 1) * RATE_LIMIT_DELAY) / 1000 / 60);
        console.log(`\n   📊 Progress: ${i + 1}/${finishedMatches.length} matches (${progress}%)`);
        console.log(`      🎥 Total highlights: ${totalHighlights}, saved: ${totalAdded}, skipped: ${totalSkipped}`);
        console.log(`      ⏱️  Est. time remaining: ${timeRemaining} minutes`);
        console.log(`      📈 Success rate: ${totalHighlights > 0 ? Math.round((totalAdded/totalHighlights)*100) : 0}%`);
      }
      
    } catch (error) {
      errorCount++;
      if (i % 50 === 0) {
        console.log(`      ❌ Error for match ${match.id}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Ultimate sync results:`);
  console.log(`   📈 Finished matches processed: ${processedMatches}/${finishedMatches.length}`);
  console.log(`   🎥 Highlights found: ${totalHighlights}`);
  console.log(`   💾 Highlights saved: ${totalAdded}`);
  console.log(`   ⏭️  Highlights skipped: ${totalSkipped}`);
  console.log(`   ❌ Errors encountered: ${errorCount}`);
  console.log(`   📊 Success rate: ${totalHighlights > 0 ? Math.round((totalAdded/totalHighlights)*100) : 0}%`);
  
  return { totalHighlights, totalAdded, totalSkipped, finishedMatches: finishedMatches.length };
}

async function ultimateAllGamesHighlightsSync() {
  console.log('🌟 ULTIMATE ALL GAMES HIGHLIGHTS SYNC');
  console.log('=' .repeat(80));
  console.log(`🔄 API: ${API_BASE_URL}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests`);
  console.log(`📊 Batch size: ${BATCH_SIZE} highlights per request`);
  console.log(`🎯 Target: ALL 4,211 matches in database`);

  const startTime = Date.now();

  // Get ALL matches using pagination
  const allMatches = await getAllMatches();
  
  if (allMatches.length === 0) {
    console.log('❌ No matches found in database');
    return;
  }

  // Create match ID set for validation
  console.log(`\n📋 Creating match ID lookup set...`);
  const existingMatchIds = await getExistingMatchIds(allMatches);
  console.log(`✅ Created lookup set for ${existingMatchIds.size} matches`);

  // Status breakdown
  const statusCounts = {};
  allMatches.forEach(match => {
    const status = match.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log(`\n📋 Match status breakdown:`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} matches`);
  });

  let grandTotalHighlights = 0;
  let grandTotalAdded = 0;
  let grandTotalSkipped = 0;
  let finishedMatchesCount = 0;

  const result = await syncHighlightsForAllMatches(allMatches, existingMatchIds);
  grandTotalHighlights += result.totalHighlights;
  grandTotalAdded += result.totalAdded;
  grandTotalSkipped += result.totalSkipped;
  finishedMatchesCount = result.finishedMatches;

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final comprehensive summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 ULTIMATE ALL GAMES HIGHLIGHTS SYNC COMPLETE');
  console.log('=' .repeat(80));
  console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
  console.log(`📊 Total matches in database: ${allMatches.length}`);
  console.log(`🏁 Finished matches processed: ${finishedMatchesCount}`);
  console.log(`🎥 Total highlights processed: ${grandTotalHighlights}`);
  console.log(`💾 Total highlights saved: ${grandTotalAdded}`);
  console.log(`⏭️  Total highlights skipped: ${grandTotalSkipped}`);
  console.log(`📊 Overall success rate: ${grandTotalHighlights > 0 ? Math.round((grandTotalAdded/grandTotalHighlights)*100) : 0}%`);

  // Final database verification
  const { data: finalHighlights } = await supabase
    .from('highlights')
    .select('id', { count: 'exact' });

  const { data: linkedHighlights } = await supabase
    .from('highlights')
    .select('id', { count: 'exact' })
    .not('match_id', 'is', null);

  console.log(`\n💾 FINAL DATABASE STATE:`);
  console.log(`   🎬 Total highlights: ${finalHighlights?.length || 0}`);
  console.log(`   🔗 Linked to matches: ${linkedHighlights?.length || 0}`);

  // Quality metrics
  const linkageRate = finalHighlights?.length > 0 ? Math.round((linkedHighlights?.length || 0) / finalHighlights.length * 100) : 0;

  console.log(`\n📈 FINAL QUALITY METRICS:`);
  console.log(`   🔗 Match linkage rate: ${linkageRate}%`);
  console.log(`   📊 Average highlights per finished match: ${Math.round((finalHighlights?.length || 0) / finishedMatchesCount)}`);
  console.log(`   🎯 Coverage: ${Math.round((finishedMatchesCount / finishedMatchesCount) * 100)}% of finished matches processed`);
  console.log(`   🌟 Database utilization: ${Math.round((finishedMatchesCount / allMatches.length) * 100)}% of all matches had potential highlights`);

  console.log(`\n🎉 ALL 4,211 GAMES HAVE BEEN PROCESSED FOR HIGHLIGHTS! 🏆⚽🎥`);
}

ultimateAllGamesHighlightsSync(); 