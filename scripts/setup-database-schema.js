import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDatabaseSchema() {
  console.log('🔧 SETTING UP DATABASE SCHEMA');
  console.log('==============================');
  
  try {
    // Create sync_status table
    console.log('📝 Creating sync_status table...');
    const { error: syncTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sync_status (
          id SERIAL PRIMARY KEY,
          sync_type VARCHAR(50) UNIQUE NOT NULL,
          status JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (syncTableError) {
      console.log('⚠️ Could not create sync_status table via RPC, trying direct approach...');
      
      // Try inserting a test record to see if table exists
      const { error: testError } = await supabase
        .from('sync_status')
        .select('*')
        .limit(1);
        
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ sync_status table does not exist and cannot be created via client');
        console.log('💡 You need to run the SQL manually in Supabase dashboard');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/septerrkdnojsmtmmska/sql');
        console.log('📋 Copy and paste the SQL from database-sync-status.sql');
        return false;
      }
    }
    
    // Add missing columns to matches table
    console.log('📝 Adding missing columns to matches table...');
    const alterCommands = [
      'ALTER TABLE matches ADD COLUMN IF NOT EXISTS lineups_fetched BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE matches ADD COLUMN IF NOT EXISTS post_game_synced BOOLEAN DEFAULT FALSE;'
    ];
    
    for (const command of alterCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.log(`⚠️ Could not execute: ${command}`);
      }
    }
    
    // Create match_statistics table
    console.log('📝 Creating match_statistics table...');
    const { error: statsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS match_statistics (
          id SERIAL PRIMARY KEY,
          match_id BIGINT NOT NULL,
          statistics JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
        );
      `
    });
    
    // Try to insert initial sync status records
    console.log('📝 Setting up initial sync status records...');
    const syncRecords = [
      { sync_type: 'upcoming_matches', status: { lastSync: null, totalMatches: 0, newMatches: 0 } },
      { sync_type: 'live_monitoring', status: { lastCheck: null, activeMatches: 0 } },
      { sync_type: 'post_game_sync', status: { lastSync: null, processedMatches: 0 } },
      { sync_type: 'league_availability', status: { lastCheck: null, availableLeagues: 0 } }
    ];
    
    for (const record of syncRecords) {
      const { error } = await supabase
        .from('sync_status')
        .upsert(record, { onConflict: 'sync_type' });
        
      if (error) {
        console.log(`⚠️ Could not insert sync record: ${record.sync_type}`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ Set up sync record: ${record.sync_type}`);
      }
    }
    
    console.log('✅ Database schema setup complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Error setting up database schema:', error);
    return false;
  }
}

async function checkCurrentSchema() {
  console.log('🔍 CHECKING CURRENT DATABASE SCHEMA');
  console.log('====================================');
  
  // Check if sync_status table exists
  const { data: syncData, error: syncError } = await supabase
    .from('sync_status')
    .select('*')
    .limit(1);
    
  if (syncError) {
    console.log('❌ sync_status table: NOT FOUND');
    console.log(`   Error: ${syncError.message}`);
  } else {
    console.log('✅ sync_status table: EXISTS');
    console.log(`   Records: ${syncData?.length || 0}`);
  }
  
  // Check matches table structure
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .limit(1);
    
  if (matchError) {
    console.log('❌ matches table: ERROR');
    console.log(`   Error: ${matchError.message}`);
  } else {
    console.log('✅ matches table: EXISTS');
    console.log(`   Sample record:`, matchData?.[0] ? Object.keys(matchData[0]) : 'No records');
  }
  
  // Check match_statistics table
  const { data: statsData, error: statsError } = await supabase
    .from('match_statistics')
    .select('*')
    .limit(1);
    
  if (statsError) {
    console.log('❌ match_statistics table: NOT FOUND');
    console.log(`   Error: ${statsError.message}`);
  } else {
    console.log('✅ match_statistics table: EXISTS');
    console.log(`   Records: ${statsData?.length || 0}`);
  }
}

async function main() {
  console.log('🚀 DATABASE SCHEMA SETUP TOOL');
  console.log('==============================\n');
  
  // First check current schema
  await checkCurrentSchema();
  
  console.log('\n');
  
  // Try to set up missing schema
  const success = await setupDatabaseSchema();
  
  if (!success) {
    console.log('\n❌ MANUAL ACTION REQUIRED');
    console.log('=========================');
    console.log('1. Go to Supabase dashboard: https://supabase.com/dashboard/project/septerrkdnojsmtmmska/sql');
    console.log('2. Copy the SQL from database-sync-status.sql');
    console.log('3. Paste and run it in the SQL editor');
    console.log('4. Then run this script again');
  } else {
    console.log('\n✅ SCHEMA SETUP COMPLETE');
    console.log('=========================');
    console.log('Database is ready for match scheduling!');
  }
}

main().catch(console.error); 