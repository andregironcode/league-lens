import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking Actual Database Table Structure');
  console.log('='.repeat(50));
  
  const tables = ['leagues', 'teams', 'matches', 'highlights'];
  
  for (const tableName of tables) {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('-'.repeat(30));
    
    try {
      // Get table info by trying to insert with missing required fields
      // This will show us what columns are expected
      const { data, error } = await supabase
        .from(tableName)
        .insert({})
        .select();
      
      if (error) {
        console.log(`Error details for ${tableName}:`, error.message);
        
        // If it's a missing column error, it will tell us what columns exist
        if (error.message.includes('null value in column')) {
          console.log(`Required columns indicated by error: ${error.message}`);
        }
      }
      
      // Try to get the first row to see the structure
      const { data: sampleData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log(`Select error: ${selectError.message}`);
      } else if (sampleData && sampleData.length > 0) {
        console.log(`Sample data structure:`, Object.keys(sampleData[0]));
      } else {
        console.log(`Table exists but is empty`);
      }
      
    } catch (err) {
      console.log(`Failed to check ${tableName}:`, err.message);
    }
  }
}

checkTableStructure(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking Actual Database Table Structure');
  console.log('='.repeat(50));
  
  const tables = ['leagues', 'teams', 'matches', 'highlights'];
  
  for (const tableName of tables) {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('-'.repeat(30));
    
    try {
      // Get table info by trying to insert with missing required fields
      // This will show us what columns are expected
      const { data, error } = await supabase
        .from(tableName)
        .insert({})
        .select();
      
      if (error) {
        console.log(`Error details for ${tableName}:`, error.message);
        
        // If it's a missing column error, it will tell us what columns exist
        if (error.message.includes('null value in column')) {
          console.log(`Required columns indicated by error: ${error.message}`);
        }
      }
      
      // Try to get the first row to see the structure
      const { data: sampleData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log(`Select error: ${selectError.message}`);
      } else if (sampleData && sampleData.length > 0) {
        console.log(`Sample data structure:`, Object.keys(sampleData[0]));
      } else {
        console.log(`Table exists but is empty`);
      }
      
    } catch (err) {
      console.log(`Failed to check ${tableName}:`, err.message);
    }
  }
}

checkTableStructure(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking Actual Database Table Structure');
  console.log('='.repeat(50));
  
  const tables = ['leagues', 'teams', 'matches', 'highlights'];
  
  for (const tableName of tables) {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('-'.repeat(30));
    
    try {
      // Get table info by trying to insert with missing required fields
      // This will show us what columns are expected
      const { data, error } = await supabase
        .from(tableName)
        .insert({})
        .select();
      
      if (error) {
        console.log(`Error details for ${tableName}:`, error.message);
        
        // If it's a missing column error, it will tell us what columns exist
        if (error.message.includes('null value in column')) {
          console.log(`Required columns indicated by error: ${error.message}`);
        }
      }
      
      // Try to get the first row to see the structure
      const { data: sampleData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log(`Select error: ${selectError.message}`);
      } else if (sampleData && sampleData.length > 0) {
        console.log(`Sample data structure:`, Object.keys(sampleData[0]));
      } else {
        console.log(`Table exists but is empty`);
      }
      
    } catch (err) {
      console.log(`Failed to check ${tableName}:`, err.message);
    }
  }
}

checkTableStructure(); 