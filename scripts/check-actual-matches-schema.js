import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function checkActualSchema() {
  console.log('🔍 CHECKING ACTUAL MATCHES SCHEMA...');
  
  try {
    // Get a sample record to see actual column structure
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const match = data[0];
      console.log('\n✅ ACTUAL COLUMNS IN MATCHES TABLE:');
      Object.keys(match).forEach(key => {
        const value = match[key];
        const type = typeof value;
        const preview = JSON.stringify(value).substring(0, 100);
        console.log(`  ${key}: ${type} = ${preview}${preview.length >= 100 ? '...' : ''}`);
      });
      
      console.log('\n🔍 Looking for team-related fields...');
      Object.keys(match).forEach(key => {
        if (key.toLowerCase().includes('team') || key.toLowerCase().includes('home') || key.toLowerCase().includes('away')) {
          console.log(`  🎯 TEAM FIELD: ${key} = ${JSON.stringify(match[key])}`);
        }
      });
    } else {
      console.log('❌ No matches found in database');
    }
    
    // Check if we can find the correct field names by looking at multiple records
    console.log('\n🔍 Checking multiple records for team field patterns...');
    const { data: multipleMatches } = await supabase
      .from('matches')
      .select('*')
      .limit(5);
    
    if (multipleMatches && multipleMatches.length > 0) {
      console.log(`Found ${multipleMatches.length} sample matches:`);
      multipleMatches.forEach((match, index) => {
        console.log(`\n  Match ${index + 1}:`);
        Object.keys(match).forEach(key => {
          const value = match[key];
          if (typeof value === 'string' && (
            value.includes('vs') || 
            value.includes(' - ') || 
            key.toLowerCase().includes('team') ||
            key.toLowerCase().includes('home') ||
            key.toLowerCase().includes('away')
          )) {
            console.log(`    ${key}: ${JSON.stringify(value)}`);
          }
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

checkActualSchema().catch(console.error); 