import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function addApiDataColumn() {
  console.log('🔧 ADDING API_DATA COLUMN TO MATCH_STATISTICS');
  console.log('='.repeat(50));

  try {
    // Use direct SQL query instead of RPC
    const { data, error } = await supabase
      .from('match_statistics')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error accessing table:', error.message);
      return;
    }

    console.log('✅ Table exists, checking structure...');

    // Try to insert a test record with api_data to see if column exists
    const testData = {
      match_id: 'test_match_123',
      statistics: { test: true },
      api_data: { test: 'api_data_column_test' }
    };

    const { error: insertError } = await supabase
      .from('match_statistics')
      .insert(testData);

    if (insertError) {
      if (insertError.message.includes('api_data')) {
        console.log('❌ api_data column missing, but cannot add via client');
        console.log('');
        console.log('🔧 MANUAL FIX REQUIRED:');
        console.log('Go to Supabase SQL Editor and run:');
        console.log('');
        console.log('ALTER TABLE match_statistics ADD COLUMN api_data JSONB;');
        console.log('');
        console.log('Then update the MatchScheduler to use the correct structure:');
        console.log('- home_stats: statsData[0]');
        console.log('- away_stats: statsData[1] '); 
        console.log('- api_data: statsData');
        console.log('');
      } else {
        console.log('❌ Insert error:', insertError.message);
      }
    } else {
      console.log('✅ api_data column already exists!');
      
      // Clean up test record
      await supabase
        .from('match_statistics')
        .delete()
        .eq('match_id', 'test_match_123');
    }

    // Also check if we need to modify the structure for home_stats/away_stats
    console.log('\n📊 Checking current match_statistics structure...');
    const { data: existingStats } = await supabase
      .from('match_statistics')
      .select('*')
      .limit(5);

    if (existingStats && existingStats.length > 0) {
      console.log('Current structure:', Object.keys(existingStats[0]));
    } else {
      console.log('No existing statistics records found');
    }

    console.log('\n🎯 SOLUTION:');
    console.log('The automation is trying to save:');
    console.log('- home_stats: object');
    console.log('- away_stats: object');
    console.log('- api_data: array');
    console.log('');
    console.log('But the table has:');
    console.log('- statistics: jsonb (single field)');
    console.log('');
    console.log('We need to either:');
    console.log('1. Add home_stats, away_stats, api_data columns, OR');
    console.log('2. Modify automation to use statistics field');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the column check
addApiDataColumn().then(() => {
  console.log('\n🏁 Column check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
}); 