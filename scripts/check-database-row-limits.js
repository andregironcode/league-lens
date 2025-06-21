/**
 * CHECK DATABASE ROW LIMITS
 * 
 * This script checks for any limits that might be affecting our match queries
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseRowLimits() {
  console.log('🔍 CHECKING DATABASE ROW LIMITS');
  console.log('=' .repeat(60));

  try {
    // Test 1: Count only (should show true count)
    console.log('1️⃣ Testing count-only query...');
    const { count: totalCount, error: countError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Count error: ${countError.message}`);
    } else {
      console.log(`✅ Total matches (count): ${totalCount}`);
    }

    // Test 2: Select with explicit high limit
    console.log('\n2️⃣ Testing query with explicit high limit...');
    const { data: highLimitData, error: highLimitError } = await supabase
      .from('matches')
      .select('id')
      .limit(10000);

    if (highLimitError) {
      console.log(`❌ High limit error: ${highLimitError.message}`);
    } else {
      console.log(`✅ Matches with limit 10000: ${highLimitData?.length || 0}`);
    }

    // Test 3: Paginated approach
    console.log('\n3️⃣ Testing paginated approach...');
    let totalFound = 0;
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore && page < 10) { // Safety limit of 10 pages
      const { data: pageData, error: pageError } = await supabase
        .from('matches')
        .select('id')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (pageError) {
        console.log(`❌ Page ${page} error: ${pageError.message}`);
        break;
      }

      const pageCount = pageData?.length || 0;
      totalFound += pageCount;
      console.log(`   Page ${page}: ${pageCount} matches (total so far: ${totalFound})`);

      if (pageCount < pageSize) {
        hasMore = false;
      }
      page++;
    }

    console.log(`✅ Total matches found via pagination: ${totalFound}`);

    // Test 4: Check specific table info
    console.log('\n4️⃣ Checking table schema info...');
    
    // Get some sample data to understand structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('matches')
      .select('id, status, match_date, league_id, created_at')
      .limit(5);

    if (sampleError) {
      console.log(`❌ Sample error: ${sampleError.message}`);
    } else {
      console.log(`✅ Sample matches:`);
      sampleData?.forEach((match, i) => {
        console.log(`   ${i + 1}. ID: ${match.id}, Status: ${match.status}, Date: ${match.match_date}, Created: ${match.created_at}`);
      });
    }

    // Test 5: Check if there are multiple tables or views
    console.log('\n5️⃣ Summary of findings...');
    console.log(`   📊 Count query result: ${totalCount || 'failed'}`);
    console.log(`   📊 High limit query result: ${highLimitData?.length || 'failed'}`);
    console.log(`   📊 Pagination result: ${totalFound}`);
    
    if (totalCount && totalCount > 1000) {
      console.log(`\n🎯 CONCLUSION: There ARE more than 1000 matches (${totalCount} total)!`);
      console.log(`   ⚠️  Default queries are being limited to 1000 rows`);
      console.log(`   🚀 Need to use pagination or higher limits to access all data`);
    } else {
      console.log(`\n🤔 CONCLUSION: Database may only contain 1000 matches`);
      console.log(`   📝 The 4,211 number might be from a different source or time`);
    }

  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

checkDatabaseRowLimits(); 