import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING CURRENT DATABASE SCHEMA');
  console.log('==================================================');
  
  // Check sync_status table structure
  console.log('📋 Checking sync_status table...');
  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ sync_status table does not exist');
      } else {
        console.log(`   ⚠️  sync_status table exists but has issues: ${error.message}`);
        console.log('   💡 Current structure might be different from expected');
      }
    } else {
      console.log('   ✅ sync_status table exists and accessible');
      if (data && data.length > 0) {
        console.log('   📊 Sample record:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  // Check matches table structure
  console.log('\\n📋 Checking matches table structure...');
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, match_date, home_team_name, away_team_name, lineups_fetched, post_game_synced')
      .limit(1);
    
    if (error) {
      console.log(`   ⚠️  matches table issue: ${error.message}`);
      if (error.message.includes('lineups_fetched') || error.message.includes('post_game_synced')) {
        console.log('   💡 Missing required columns: lineups_fetched, post_game_synced');
      }
    } else {
      console.log('   ✅ matches table has all required columns');
      if (data && data.length > 0) {
        console.log('   📊 Sample record columns:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  // Check what tables actually exist
  console.log('\\n📋 Checking all available tables...');
  try {
    // Try to get table info by attempting to select from common tables
    const tables = ['leagues', 'teams', 'matches', 'standings', 'highlights', 'sync_status', 'match_statistics', 'match_lineups', 'match_events'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error && error.code === '42P01') {
          console.log(`   ❌ ${tableName} - does not exist`);
        } else if (error) {
          console.log(`   ⚠️  ${tableName} - exists but has issues: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName} - exists and accessible`);
        }
      } catch (e) {
        console.log(`   ❌ ${tableName} - error: ${e.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\\n==================================================');
  console.log('🛠️  RECOMMENDATIONS:');
  console.log('');
  console.log('1. The sync_status table might have wrong column names');
  console.log('2. Try this simpler approach in Supabase SQL Editor:');
  console.log('');
  console.log('   -- Drop and recreate sync_status table');
  console.log('   DROP TABLE IF EXISTS sync_status CASCADE;');
  console.log('   ');
  console.log('   CREATE TABLE sync_status (');
  console.log('     id SERIAL PRIMARY KEY,');
  console.log('     table_name VARCHAR(50) UNIQUE NOT NULL,');
  console.log('     status VARCHAR(20) DEFAULT \'pending\',');
  console.log('     last_sync TIMESTAMP WITH TIME ZONE,');
  console.log('     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log('   );');
  console.log('   ');
  console.log('   -- Add missing columns to matches');
  console.log('   ALTER TABLE matches ');
  console.log('   ADD COLUMN IF NOT EXISTS lineups_fetched BOOLEAN DEFAULT FALSE,');
  console.log('   ADD COLUMN IF NOT EXISTS post_game_synced BOOLEAN DEFAULT FALSE;');
  console.log('');
  console.log('3. After running the SQL, we can sync current matches');
  console.log('==================================================');
}

checkDatabaseSchema().catch(console.error); 