/**
 * DEBUG HIGHLIGHTS ISSUE
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugHighlights() {
  console.log('🔍 DEBUGGING HIGHLIGHTS ISSUE');
  console.log('=' .repeat(50));

  // Test match that we know has highlights
  const testMatchId = 1028555126; // Villarreal vs Real Betis

  try {
    // 1. Test API call
    console.log('\n1. Testing API call...');
    const response = await fetch(`http://localhost:3001/api/highlightly/highlights?matchId=${testMatchId}`);
    console.log(`Status: ${response.status}`);
    
    if (!response.ok) {
      console.log('❌ API call failed');
      return;
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${data?.data?.length || 0} highlights found`);
    
    if (data?.data?.length === 0) {
      console.log('❌ No highlights in API response');
      return;
    }
    
    const highlight = data.data[0];
    console.log(`\nFirst highlight:`);
    console.log(`  ID: ${highlight.id}`);
    console.log(`  Title: ${highlight.title}`);
    console.log(`  URL: ${highlight.url}`);
    console.log(`  Thumbnail: ${highlight.imgUrl}`);

    // 2. Test database schema
    console.log('\n2. Testing database schema...');
    const { data: schemaTest, error: schemaError } = await supabase
      .from('highlights')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.log('❌ Highlights table error:', schemaError);
      return;
    }
    
    console.log('✅ Highlights table accessible');

    // 3. Test database insert
    console.log('\n3. Testing database insert...');
    const { data: insertResult, error: insertError } = await supabase
      .from('highlights')
      .upsert({
        id: highlight.id,
        match_id: testMatchId,
        title: highlight.title,
        url: highlight.url,
        thumbnail: highlight.imgUrl,
        type: 'video',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (insertError) {
      console.log('❌ Database insert error:', insertError);
      
      // Try without match_id to see if foreign key is the issue
      console.log('\n3b. Testing insert without match_id...');
      const { error: insertError2 } = await supabase
        .from('highlights')
        .upsert({
          id: highlight.id + 999999, // Different ID
          title: highlight.title,
          url: highlight.url,
          thumbnail: highlight.imgUrl,
          type: 'video',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (insertError2) {
        console.log('❌ Insert without match_id also failed:', insertError2);
      } else {
        console.log('✅ Insert without match_id worked - foreign key issue confirmed');
      }
      
    } else {
      console.log('✅ Database insert successful');
    }

    // 4. Check if match exists
    console.log('\n4. Checking if match exists in database...');
    const { data: matchExists, error: matchError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id')
      .eq('id', testMatchId)
      .single();
    
    if (matchError || !matchExists) {
      console.log(`❌ Match ${testMatchId} not found in database`);
      console.log('This explains why highlights can\'t be linked - foreign key constraint');
      
      // Let's find a match that exists
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'finished')
        .limit(5);
        
      if (existingMatches?.length > 0) {
        console.log(`\nFound existing matches: ${existingMatches.map(m => m.id).join(', ')}`);
        console.log('Try testing with one of these match IDs');
      }
    } else {
      console.log(`✅ Match ${testMatchId} exists in database`);
    }

    // 5. Check existing highlights
    console.log('\n5. Current highlights in database:');
    const { data: existingHighlights } = await supabase
      .from('highlights')
      .select('*')
      .limit(5);
    
    if (existingHighlights?.length > 0) {
      console.log(`✅ Found ${existingHighlights.length} existing highlights:`);
      existingHighlights.forEach((h, i) => {
        console.log(`  ${i+1}. ID: ${h.id}, Match: ${h.match_id}, Title: ${h.title?.substring(0, 40)}...`);
      });
    } else {
      console.log('❌ No highlights in database');
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

debugHighlights(); 