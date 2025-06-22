import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function addApiIdColumn() {
  console.log('🔧 Adding api_id column to leagues table...');
  
  try {
    // Try to add the column using a direct SQL query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS api_id TEXT;'
    });
    
    if (error) {
      console.log('❌ RPC Error:', error);
      
      // Alternative: try to query the table to see current structure
      const { data: sampleData, error: queryError } = await supabase
        .from('leagues')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.log('❌ Query Error:', queryError);
      } else {
        console.log('✅ Current table structure sample:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No data');
      }
    } else {
      console.log('✅ Column added successfully!');
    }
  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

addApiIdColumn().catch(console.error); 