/**
 * CHECK ACTUAL DATABASE SCHEMA
 * 
 * This script checks what columns actually exist in each table
 * so we can sync data properly without schema errors
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableSchema(tableName) {
  console.log(`\n🔍 Checking ${tableName} table schema...`);
  
  try {
    // Try to get one record to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Error accessing ${tableName}: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`✅ ${tableName} columns:`, columns);
      return columns;
    } else {
      console.log(`📊 ${tableName} table exists but is empty`);
      
      // Try to insert a test record to see what columns are required
      const testData = { test: 'test' };
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(testData);
      
      if (insertError) {
        console.log(`🔍 Schema info from insert error: ${insertError.message}`);
      }
      
      return [];
    }
  } catch (e) {
    console.log(`❌ ${tableName} table might not exist: ${e.message}`);
    return null;
  }
}

async function checkAllSchemas() {
  console.log('🔍 CHECKING ACTUAL DATABASE SCHEMAS');
  console.log('='.repeat(50));
  
  const tables = [
    'leagues',
    'teams', 
    'matches',
    'highlights',
    'standings',
    'match_statistics',
    'match_events',
    'lineups',
    'team_statistics',
    'team_form'
  ];

  const schemas = {};

  for (const table of tables) {
    const columns = await checkTableSchema(table);
    schemas[table] = columns;
  }

  console.log('\n📋 SCHEMA SUMMARY');
  console.log('='.repeat(50));
  
  for (const [table, columns] of Object.entries(schemas)) {
    if (columns === null) {
      console.log(`❌ ${table}: Table doesn't exist`);
    } else if (columns.length === 0) {
      console.log(`📊 ${table}: Table exists but empty`);
    } else {
      console.log(`✅ ${table}: ${columns.length} columns - ${columns.join(', ')}`);
    }
  }

  return schemas;
}

// Run the schema check
checkAllSchemas(); 