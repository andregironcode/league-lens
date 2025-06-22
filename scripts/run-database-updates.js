import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDatabaseUpdates() {
  console.log('🔧 RUNNING DATABASE SCHEMA UPDATES');
  console.log('==================================================');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Check if sync_status table exists
  console.log('📝 Checking sync_status table...');
  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('   ❌ sync_status table does not exist');
      console.log('   ⚠️  This table needs to be created via Supabase dashboard SQL editor');
    } else if (error) {
      console.log(`   ❌ Error checking table: ${error.message}`);
    } else {
      console.log('   ✅ sync_status table exists');
      successCount++;
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    errorCount++;
  }
  
  // Check if matches table has required columns
  console.log('📝 Checking matches table columns...');
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('lineups_fetched, post_game_synced')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('   ❌ Required columns missing from matches table');
      console.log('   ⚠️  Need to add: lineups_fetched, post_game_synced columns');
    } else if (error) {
      console.log(`   ❌ Error checking columns: ${error.message}`);
    } else {
      console.log('   ✅ matches table has required columns');
      successCount++;
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    errorCount++;
  }
  
  // Check if match_statistics table exists
  console.log('📝 Checking match_statistics table...');
  try {
    const { data, error } = await supabase
      .from('match_statistics')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('   ❌ match_statistics table does not exist');
      console.log('   ⚠️  This table needs to be created via Supabase dashboard SQL editor');
    } else if (error) {
      console.log(`   ❌ Error checking table: ${error.message}`);
    } else {
      console.log('   ✅ match_statistics table exists');
      successCount++;
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    errorCount++;
  }
  
  console.log('');
  console.log('==================================================');
  console.log(`📊 DATABASE CHECK COMPLETE:`);
  console.log(`   • Working: ${successCount}`);
  console.log(`   • Issues: ${errorCount}`);
  console.log('==================================================');
  
  if (errorCount > 0) {
    console.log('');
    console.log('🛠️  MANUAL FIXES NEEDED:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the SQL from database-sync-status.sql');
    console.log('   3. Or run these commands manually:');
    console.log('');
    console.log('   CREATE TABLE IF NOT EXISTS sync_status (');
    console.log('     id SERIAL PRIMARY KEY,');
    console.log('     sync_type VARCHAR(50) UNIQUE NOT NULL,');
    console.log('     status JSONB,');
    console.log('     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log('   );');
    console.log('');
    console.log('   ALTER TABLE matches');
    console.log('   ADD COLUMN IF NOT EXISTS lineups_fetched BOOLEAN DEFAULT FALSE,');
    console.log('   ADD COLUMN IF NOT EXISTS post_game_synced BOOLEAN DEFAULT FALSE;');
    console.log('');
    console.log('   CREATE TABLE IF NOT EXISTS match_statistics (');
    console.log('     id SERIAL PRIMARY KEY,');
    console.log('     match_id BIGINT NOT NULL,');
    console.log('     statistics JSONB,');
    console.log('     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log('   );');
  } else {
    console.log('');
    console.log('✅ All database schema checks passed!');
    console.log('   Ready to sync upcoming matches...');
  }
}

runDatabaseUpdates().catch(console.error); 