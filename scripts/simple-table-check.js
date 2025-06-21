/**
 * SIMPLE TABLE CHECK
 * 
 * Test individual table access
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://sxuqkknzxpjqgkvhyzvz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dXFra256eHBqcWdrdmh5enZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU2OTEzOSwiZXhwIjoyMDUwMTQ1MTM5fQ.YJQHQSKm0Y2fBJnlCUMJLiNrUDGO_6KPHJFdgzWMfVU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testTables() {
  console.log('🔍 TESTING INDIVIDUAL TABLES');
  console.log('='.repeat(50));

  const tables = [
    'leagues', 'teams', 'matches', 'highlights', 
    'match_statistics', 'match_events', 'lineups', 'team_statistics'
  ];

  for (const table of tables) {
    console.log(`\n🗃️  Testing ${table}...`);
    
    try {
      // Test basic select
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        
        // If table doesn't exist, try to create it
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`💡 ${table}: Table doesn't exist - need to create it`);
        }
      } else {
        console.log(`✅ ${table}: Accessible (${count} rows)`);
        if (data && data.length > 0) {
          console.log(`   📋 Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // Test a simple insert to matches table
  console.log('\n🧪 TESTING SIMPLE INSERT TO MATCHES...');
  try {
    const testMatch = {
      id: 999999,
      league_id: 33973,
      home_team_name: 'Test Home',
      away_team_name: 'Test Away',
      match_date: '2024-12-15',
      status: 'test'
    };

    const { data, error } = await supabase
      .from('matches')
      .upsert(testMatch, { onConflict: 'id' });

    if (error) {
      console.log(`❌ Insert failed: ${error.message}`);
    } else {
      console.log(`✅ Insert successful!`);
      
      // Clean up test data
      await supabase.from('matches').delete().eq('id', 999999);
    }
  } catch (e) {
    console.log(`❌ Insert error: ${e.message}`);
  }
}

testTables(); 