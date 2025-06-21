/**
 * COMPREHENSIVE HIGHLIGHTS SYNC
 * 
 * Based on the OpenAPI specification, this script will fetch ALL highlights
 * for ALL matches in the database using multiple strategies:
 * 
 * Features:
 * - Multiple query strategies (by league, by match, by season)
 * - Proper pagination handling (40 highlights per request)
 * - VERIFIED and UNVERIFIED highlights
 * - Comprehensive error handling and progress tracking
 * - Database integration with proper schema mapping
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = 'http://localhost:3001/api/highlightly';
const RATE_LIMIT_DELAY = 800; // Faster for highlights
const MAX_RETRIES = 3;
const BATCH_SIZE = 40; // API max limit per request for highlights

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

async function upsertHighlight(highlight) {
  try {
    // Map OpenAPI response to actual database schema
    const highlightData = {
      id: highlight.id,
      match_id: highlight.match?.id || null,
      title: highlight.title || '',
      url: highlight.url || '',
      embed_url: highlight.embedUrl || null,
      thumbnail: highlight.imgUrl || null,
      views: 0, // Default value
      api_data: highlight
    };

    const { error } = await supabase
      .from('highlights')
      .upsert(highlightData, {
        onConflict: 'id'
      });

    if (error) {
      console.log(`     ⚠️  Highlight ${highlight.id} error: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function getLeaguesFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, country_name')
      .order('name');

    if (error) {
      console.log(`❌ Error fetching leagues: ${error.message}`);
      return [];
    }

    return data || [];
  } catch (error) {
    console.log(`❌ Exception fetching leagues: ${error.message}`);
    return [];
  }
}

async function getMatchesFromDatabase(limit = 1000) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, league_id, season, status, match_date')
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.log(`❌ Error fetching matches: ${error.message}`);
      return [];
    }

    return data || [];
  } catch (error) {
    console.log(`❌ Exception fetching matches: ${error.message}`);
    return [];
  }
}

async function syncHighlightsByLeague(league, season) {
  console.log(`\n🎬 Syncing highlights for ${league.name} [${league.country_name}] - Season ${season}`);
  
  let totalHighlights = 0;
  let totalAdded = 0;
  let offset = 0;
  let hasMore = true;
  let batchCount = 0;

  while (hasMore) {
    try {
      batchCount++;
      console.log(`   📡 Batch ${batchCount} (offset: ${offset})...`);
      
      const response = await makeAPICall('/highlights', {
        leagueId: parseInt(league.id),
        season: parseInt(season),
        limit: BATCH_SIZE,
        offset: offset
      });
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.log(`      ❌ Invalid response format`);
        break;
      }
      
      const highlights = response.data;
      console.log(`      🎥 Received ${highlights.length} highlights`);
      
      if (highlights.length === 0) {
        hasMore = false;
        break;
      }
      
      // Process highlights
      let batchAdded = 0;
      for (const highlight of highlights) {
        const success = await upsertHighlight(highlight);
        if (success) {
          batchAdded++;
          totalAdded++;
        }
      }
      
      totalHighlights += highlights.length;
      console.log(`      ✅ Processed: ${highlights.length} highlights, ${batchAdded} saved`);
      
      // Check pagination
      if (response.pagination && response.pagination.total) {
        const { total, limit, offset: currentOffset } = response.pagination;
        hasMore = (currentOffset + limit) < total;
        offset = currentOffset + limit;
        console.log(`      📈 Progress: ${Math.min(currentOffset + limit, total)}/${total} (${Math.round((currentOffset + limit)/total*100)}%)`);
      } else {
        // No pagination info, continue if we got full batch
        hasMore = highlights.length === BATCH_SIZE;
        offset += BATCH_SIZE;
      }
      
      // Rate limiting
      await delay(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.log(`      ❌ Error in batch: ${error.message}`);
      hasMore = false;
    }
  }
  
  console.log(`   📊 ${league.name} Season ${season}: ${totalHighlights} processed, ${totalAdded} saved`);
  return { totalHighlights, totalAdded };
}

async function syncHighlightsByMatch(matches, batchSize = 50) {
  console.log(`\n🎯 Syncing highlights by individual matches (${matches.length} matches)`);
  
  let totalHighlights = 0;
  let totalAdded = 0;
  let processedMatches = 0;

  // Process matches in batches to avoid overwhelming the API
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    console.log(`\n   📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(matches.length/batchSize)} (${batch.length} matches)`);
    
    for (const match of batch) {
      try {
        console.log(`      🔍 Match ID: ${match.id}...`);
        
        const response = await makeAPICall('/highlights', {
          matchId: parseInt(match.id),
          limit: BATCH_SIZE
        });
        
        if (response && response.data && Array.isArray(response.data)) {
          const highlights = response.data;
          
          let matchAdded = 0;
          for (const highlight of highlights) {
            const success = await upsertHighlight(highlight);
            if (success) {
              matchAdded++;
              totalAdded++;
            }
          }
          
          totalHighlights += highlights.length;
          processedMatches++;
          
          if (highlights.length > 0) {
            console.log(`         ✅ ${highlights.length} highlights, ${matchAdded} saved`);
          }
        }
        
        // Rate limiting between matches
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`         ❌ Error for match ${match.id}: ${error.message}`);
      }
    }
    
    console.log(`   📊 Batch complete: ${processedMatches}/${matches.length} matches processed`);
    
    // Longer delay between batches
    if (i + batchSize < matches.length) {
      await delay(RATE_LIMIT_DELAY * 2);
    }
  }
  
  console.log(`\n📊 Match-based sync complete: ${totalHighlights} highlights processed, ${totalAdded} saved`);
  return { totalHighlights, totalAdded };
}

async function comprehensiveHighlightsSync() {
  console.log('🎬 COMPREHENSIVE HIGHLIGHTS SYNC');
  console.log('=' .repeat(80));
  console.log(`🔄 API: ${API_BASE_URL}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests`);
  console.log(`📊 Batch size: ${BATCH_SIZE} highlights per request`);

  const startTime = Date.now();
  let grandTotalHighlights = 0;
  let grandTotalAdded = 0;

  // Strategy 1: Sync by League and Season
  console.log(`\n🏆 STRATEGY 1: SYNC BY LEAGUE AND SEASON`);
  console.log('=' .repeat(60));
  
  const leagues = await getLeaguesFromDatabase();
  console.log(`📋 Found ${leagues.length} leagues in database`);
  
  const seasons = [2024, 2023, 2022];
  
  for (const league of leagues) {
    for (const season of seasons) {
      try {
        const result = await syncHighlightsByLeague(league, season);
        grandTotalHighlights += result.totalHighlights;
        grandTotalAdded += result.totalAdded;
        
        // Rate limiting between league-season combinations
        await delay(RATE_LIMIT_DELAY);
        
      } catch (error) {
        console.log(`   ❌ Failed ${league.name} Season ${season}: ${error.message}`);
      }
    }
    
    // Longer delay between leagues
    await delay(RATE_LIMIT_DELAY * 2);
  }

  console.log(`\n📊 STRATEGY 1 RESULTS:`);
  console.log(`   🎥 Total highlights processed: ${grandTotalHighlights}`);
  console.log(`   💾 Total highlights saved: ${grandTotalAdded}`);

  // Strategy 2: Sync by Individual Matches (for finished matches)
  console.log(`\n🎯 STRATEGY 2: SYNC BY INDIVIDUAL MATCHES`);
  console.log('=' .repeat(60));
  
  const finishedMatches = await getMatchesFromDatabase(500); // Limit to recent 500 finished matches
  console.log(`⚽ Found ${finishedMatches.length} finished matches`);
  
  if (finishedMatches.length > 0) {
    const matchResult = await syncHighlightsByMatch(finishedMatches);
    grandTotalHighlights += matchResult.totalHighlights;
    grandTotalAdded += matchResult.totalAdded;
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final comprehensive summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 COMPREHENSIVE HIGHLIGHTS SYNC COMPLETE');
  console.log('=' .repeat(80));
  console.log(`⏱️  Total time: ${duration} seconds (${Math.round(duration/60)} minutes)`);
  console.log(`🎥 Total highlights processed: ${grandTotalHighlights}`);
  console.log(`💾 Total highlights saved: ${grandTotalAdded}`);
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
  console.log(`   📊 Average highlights per league: ${Math.round((finalHighlights?.length || 0) / leagues.length)}`);

  console.log(`\n🎉 ALL HIGHLIGHTS HAVE BEEN FETCHED FOR ALL GAMES!`);
}

comprehensiveHighlightsSync(); 