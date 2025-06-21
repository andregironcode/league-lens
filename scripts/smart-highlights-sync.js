/**
 * SMART HIGHLIGHTS SYNC
 * 
 * This script intelligently fetches highlights for matches that exist in our database.
 * It avoids foreign key constraint violations by checking match existence first.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 600;
const MAX_RETRIES = 3;
const BATCH_SIZE = 40;

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

async function getExistingMatchIds() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id');

    if (error) {
      console.log(`❌ Error fetching match IDs: ${error.message}`);
      return new Set();
    }

    // Convert all match IDs to strings for consistent comparison
    return new Set(data.map(match => String(match.id)));
  } catch (error) {
    console.log(`❌ Exception fetching match IDs: ${error.message}`);
    return new Set();
  }
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
      match_id: matchId ? String(matchId) : null, // Convert to string to match database format
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

async function getFinishedMatches(limit = 1000) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, league_id, season, status, match_date')
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.log(`❌ Error fetching finished matches: ${error.message}`);
      return [];
    }

    return data || [];
  } catch (error) {
    console.log(`❌ Exception fetching finished matches: ${error.message}`);
    return [];
  }
}

async function syncHighlightsByMatches(matches, existingMatchIds) {
  console.log(`\n🎯 Syncing highlights for ${matches.length} finished matches`);
  
  let totalHighlights = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  let processedMatches = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    try {
      console.log(`   [${i + 1}/${matches.length}] Match ${match.id}...`);
      
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
        
        if (highlights.length > 0) {
          console.log(`      ✅ ${highlights.length} highlights: ${matchAdded} saved, ${matchSkipped} skipped`);
        } else {
          console.log(`      📭 No highlights found`);
        }
      } else {
        console.log(`      📭 No highlights found`);
      }
      
      // Rate limiting between matches
      await delay(RATE_LIMIT_DELAY);
      
      // Progress update every 50 matches
      if ((i + 1) % 50 === 0) {
        console.log(`\n   📊 Progress: ${i + 1}/${matches.length} matches processed`);
        console.log(`      🎥 Total highlights: ${totalHighlights}, saved: ${totalAdded}, skipped: ${totalSkipped}`);
      }
      
    } catch (error) {
      console.log(`      ❌ Error for match ${match.id}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Match-based sync complete:`);
  console.log(`   📈 Matches processed: ${processedMatches}/${matches.length}`);
  console.log(`   🎥 Highlights found: ${totalHighlights}`);
  console.log(`   💾 Highlights saved: ${totalAdded}`);
  console.log(`   ⏭️  Highlights skipped: ${totalSkipped}`);
  console.log(`   📊 Success rate: ${totalHighlights > 0 ? Math.round((totalAdded/totalHighlights)*100) : 0}%`);
  
  return { totalHighlights, totalAdded, totalSkipped };
}

async function smartHighlightsSync() {
  console.log('🧠 SMART HIGHLIGHTS SYNC');
  console.log('=' .repeat(80));
  console.log(`🔄 API: ${API_BASE_URL}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests`);
  console.log(`📊 Batch size: ${BATCH_SIZE} highlights per request`);

  const startTime = Date.now();

  // Get existing match IDs to avoid foreign key violations
  console.log(`\n📋 Getting existing match IDs from database...`);
  const existingMatchIds = await getExistingMatchIds();
  console.log(`✅ Found ${existingMatchIds.size} matches in database`);

  // Get finished matches to sync highlights for
  console.log(`\n⚽ Getting finished matches...`);
  const finishedMatches = await getFinishedMatches(500); // Limit to 500 recent finished matches
  console.log(`✅ Found ${finishedMatches.length} finished matches`);

  let grandTotalHighlights = 0;
  let grandTotalAdded = 0;
  let grandTotalSkipped = 0;

  if (finishedMatches.length > 0) {
    const result = await syncHighlightsByMatches(finishedMatches, existingMatchIds);
    grandTotalHighlights += result.totalHighlights;
    grandTotalAdded += result.totalAdded;
    grandTotalSkipped += result.totalSkipped;
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final comprehensive summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 SMART HIGHLIGHTS SYNC COMPLETE');
  console.log('=' .repeat(80));
  console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
  console.log(`🎥 Total highlights processed: ${grandTotalHighlights}`);
  console.log(`💾 Total highlights saved: ${grandTotalAdded}`);
  console.log(`⏭️  Total highlights skipped: ${grandTotalSkipped}`);
  console.log(`📊 Success rate: ${grandTotalHighlights > 0 ? Math.round((grandTotalAdded/grandTotalHighlights)*100) : 0}%`);

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

  console.log(`\n📈 QUALITY METRICS:`);
  console.log(`   🔗 Match linkage rate: ${linkageRate}%`);
  console.log(`   📊 Average highlights per finished match: ${Math.round((finalHighlights?.length || 0) / finishedMatches.length)}`);

  console.log(`\n🎉 SMART HIGHLIGHTS SYNC COMPLETED SUCCESSFULLY!`);
}

smartHighlightsSync(); 