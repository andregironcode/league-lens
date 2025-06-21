/**
 * CHECK DATABASE TABLES
 * 
 * Check what tables exist and their schemas
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://sxuqkknzxpjqgkvhyzvz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dXFra256eHBqcWdrdmh5enZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU2OTEzOSwiZXhwIjoyMDUwMTQ1MTM5fQ.YJQHQSKm0Y2fBJnlCUMJLiNrUDGO_6KPHJFdgzWMfVU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDatabaseTables() {
  console.log('🔍 CHECKING DATABASE TABLES');
  console.log('='.repeat(50));

  try {
    // Get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.log('❌ Error fetching tables:', error.message);
      return;
    }

    console.log(`📊 Found ${tables.length} tables:`);
    
    for (const table of tables) {
      console.log(`\n🗃️  TABLE: ${table.table_name}`);
      
      // Get column information
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position');

      if (colError) {
        console.log(`   ❌ Error fetching columns: ${colError.message}`);
        continue;
      }

      console.log(`   📋 Columns (${columns.length}):`);
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        console.log(`      • ${col.column_name}: ${col.data_type} ${nullable}`);
      });

      // Get row count
      try {
        const { count, error: countError } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`   📊 Rows: ${count}`);
        }
      } catch (e) {
        console.log(`   📊 Rows: Unable to count`);
      }
    }

    // Test specific tables we need
    console.log('\n🎯 TESTING REQUIRED TABLES:');
    const requiredTables = [
      'leagues', 'teams', 'matches', 'highlights', 
      'match_statistics', 'match_events', 'lineups', 'team_statistics'
    ];

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Accessible`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabaseTables(); 