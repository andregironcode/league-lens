/**
 * TEST SINGLE DATABASE CALL
 * 
 * Test one simple database call to isolate connection issues
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://sxuqkknzxpjqgkvhyzvz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dXFra256eHBqcWdrdmh5enZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU2OTEzOSwiZXhwIjoyMDUwMTQ1MTM5fQ.YJQHQSKm0Y2fBJnlCUMJLiNrUDGO_6KPHJFdgzWMfVU';

console.log('🔍 TESTING SINGLE DATABASE CALL');
console.log('='.repeat(50));

async function testSingleCall() {
  try {
    console.log('📡 Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('📡 Testing leagues table...');
    const { data, error, count } = await supabase
      .from('leagues')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('❌ Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log(`✅ Success! Found ${count} leagues`);
      if (data && data.length > 0) {
        console.log('📊 First league:', data[0].name);
      }
    }

  } catch (error) {
    console.log('❌ Catch error:', error.message);
    console.log('❌ Error type:', error.constructor.name);
    console.log('❌ Full error:', JSON.stringify(error, null, 2));
  }
}

testSingleCall(); 