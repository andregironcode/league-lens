/**
 * CHECK EMPTY TABLE SCHEMAS
 * 
 * Check the actual column structure of empty tables
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkEmptyTableSchema(tableName) {
  console.log(`\n🔍 Checking ${tableName} schema...`);
  
  // Try various common column combinations to discover the schema
  const possibleColumns = [
    // Basic columns
    ['id', 'created_at'],
    ['id', 'match_id', 'created_at'],
    ['id', 'team_id', 'created_at'],
    ['id', 'league_id', 'created_at'],
    
    // Match events columns
    ['id', 'match_id', 'team_id', 'player', 'time', 'type'],
    ['id', 'match_id', 'team_name', 'player', 'time', 'type'],
    ['id', 'match_id', 'team_id', 'player', 'time', 'type', 'details'],
    ['id', 'match_id', 'team_id', 'player', 'time', 'type', 'extra'],
    
    // Team form columns
    ['id', 'team_id', 'league_id', 'form', 'last_5_matches'],
    ['id', 'team_id', 'league_id', 'form_string'],
    ['id', 'team_id', 'form', 'wins', 'draws', 'losses'],
    
    // Lineups columns (if table exists)
    ['id', 'match_id', 'team_id', 'formation'],
    ['id', 'match_id', 'team_id', 'formation', 'lineup'],
  ];

  for (const columns of possibleColumns) {
    try {
      const selectQuery = columns.join(', ');
      const { data, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .limit(1);

      if (!error) {
        console.log(`✅ ${tableName} has columns: ${columns.join(', ')}`);
        return columns;
      }
    } catch (e) {
      // Continue trying
    }
  }

  // Try to get error info by attempting an insert
  try {
    const { error } = await supabase
      .from(tableName)
      .insert({ id: 999999999 }); // This will fail and give us schema info

    if (error) {
      console.log(`🔍 Schema clue from insert: ${error.message}`);
      
      // Parse error message to extract column info
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`📋 Required column found: ${match[1]}`);
        }
      }
    }
  } catch (e) {
    console.log(`🔍 Insert test error: ${e.message}`);
  }

  return null;
}

async function checkEmptyTables() {
  console.log('🔍 CHECKING EMPTY TABLE SCHEMAS');
  console.log('='.repeat(50));
  
  const emptyTables = ['match_events', 'team_form'];
  
  for (const table of emptyTables) {
    await checkEmptyTableSchema(table);
  }
}

checkEmptyTables(); 