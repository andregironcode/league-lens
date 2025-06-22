import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

const HIGHLIGHTLY_API_URL = 'https://soccer.highlightly.net';
const HIGHLIGHTLY_API_KEY = process.env.HIGHLIGHTLY_API_KEY || 'f1f4e3c0a7msh07b3b9d6e8c2f5a8b3c';

async function callHighlightlyAPI(endpoint) {
  try {
    const response = await axios.get(`${HIGHLIGHTLY_API_URL}/${endpoint}`, {
      headers: {
        'x-api-key': HIGHLIGHTLY_API_KEY,
        'x-rapidapi-key': HIGHLIGHTLY_API_KEY,
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.log(`   ❌ API Error: ${error.response?.status} - ${error.message}`);
    return null;
  }
}

async function fixStatsAndAdd() {
  console.log('🔧 FIXING STATISTICS CONSTRAINT AND ADDING DATA');
  console.log('='.repeat(50));

  const testMatchId = '1126857540';
  
  try {
    // First, try to insert without conflict resolution
    console.log('📊 Fetching statistics from API...');
    const statsData = await callHighlightlyAPI(`statistics/${testMatchId}`);

    if (statsData && Array.isArray(statsData) && statsData.length >= 2) {
      console.log(`   ✅ Got statistics for ${statsData.length} teams`);
      
      // Try direct insert first
      const statsRecord = {
        match_id: testMatchId,
        statistics: {
          home: statsData[0] || null,
          away: statsData[1] || null,
          raw_data: statsData
        }
      };

      console.log('💾 Attempting to insert statistics...');
      const { error: insertError } = await supabase
        .from('match_statistics')
        .insert(statsRecord);

      if (insertError) {
        console.log(`   ❌ Insert failed: ${insertError.message}`);
        
        // Try to check if record already exists
        const { data: existing } = await supabase
          .from('match_statistics')
          .select('*')
          .eq('match_id', testMatchId);

        if (existing && existing.length > 0) {
          console.log('   ℹ️ Record already exists, trying update...');
          
          const { error: updateError } = await supabase
            .from('match_statistics')
            .update(statsRecord)
            .eq('match_id', testMatchId);

          if (updateError) {
            console.log(`   ❌ Update failed: ${updateError.message}`);
          } else {
            console.log('   ✅ Statistics updated successfully!');
          }
        } else {
          console.log('   ❌ No existing record and insert failed');
        }
      } else {
        console.log('   ✅ Statistics inserted successfully!');
      }

      // Verify the data was saved
      console.log('\n🔍 Verifying saved data...');
      const { data: savedStats } = await supabase
        .from('match_statistics')
        .select('*')
        .eq('match_id', testMatchId);

      if (savedStats && savedStats.length > 0) {
        console.log('   ✅ Statistics found in database');
        console.log(`   📊 Home team stats: ${savedStats[0].statistics?.home?.statistics?.length || 0} metrics`);
        console.log(`   📊 Away team stats: ${savedStats[0].statistics?.away?.statistics?.length || 0} metrics`);
      } else {
        console.log('   ❌ No statistics found in database');
      }

    } else {
      console.log('   ❌ No statistics data from API');
    }

    // Now test the complete match data
    console.log('\n🧪 TESTING COMPLETE MATCH DATA:');
    
    const { data: completeMatch } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo, country_name)
      `)
      .eq('id', testMatchId)
      .single();

    if (completeMatch) {
      console.log(`   ✅ Match: ${completeMatch.home_team?.name} vs ${completeMatch.away_team?.name}`);
      console.log(`   🏁 Flags: highlights=${completeMatch.has_highlights}, lineups=${completeMatch.has_lineups}, events=${completeMatch.has_events}`);
    }

    // Check all related data
    const { data: lineups } = await supabase.from('match_lineups').select('*').eq('match_id', testMatchId);
    const { data: events } = await supabase.from('match_events').select('*').eq('match_id', testMatchId);
    const { data: statistics } = await supabase.from('match_statistics').select('*').eq('match_id', testMatchId);
    const { data: highlights } = await supabase.from('highlights').select('*').eq('match_id', testMatchId);

    console.log('\n📊 FINAL DATA SUMMARY:');
    console.log(`   👥 Lineups: ${lineups?.length || 0} records`);
    console.log(`   ⚽ Events: ${events?.length || 0} records`);
    console.log(`   📊 Statistics: ${statistics?.length || 0} records`);
    console.log(`   🎥 Highlights: ${highlights?.length || 0} records`);

    if ((lineups?.length || 0) > 0 && (events?.length || 0) > 0 && (statistics?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS! All match data is now available');
      console.log('🔄 The match page should display:');
      console.log('   • Lineups tab with formations and players');
      console.log('   • Statistics tab with match metrics');  
      console.log('   • Timeline with match events');
      console.log('   • Video highlights');
    } else {
      console.log('\n⚠️ Some data is still missing');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixStatsAndAdd().then(() => {
  console.log('\n🏁 Statistics fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
}); 