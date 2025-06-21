import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('📊 CHECKING HIGHLIGHTS TABLE SCHEMA');
  console.log('=' .repeat(40));

  try {
    // Get one highlight and see what columns exist
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.log('❌ Error fetching highlights:', error);
      return;
    }

    if (data) {
      console.log('✅ Highlights table columns:');
      Object.keys(data).forEach(column => {
        console.log(`   - ${column}: ${typeof data[column]} = ${data[column]}`);
      });
    } else {
      console.log('❌ No highlights found');
    }

    // Test a simple insert with minimal data
    console.log('\n🧪 Testing minimal insert...');
    const testHighlight = {
      id: 999999,
      title: 'Test Highlight',
      url: 'https://example.com/test'
    };

    const { error: insertError } = await supabase
      .from('highlights')
      .upsert(testHighlight, { onConflict: 'id' });

    if (insertError) {
      console.log('❌ Minimal insert failed:', insertError);
    } else {
      console.log('✅ Minimal insert successful');
      
      // Clean up test record
      await supabase.from('highlights').delete().eq('id', 999999);
    }

  } catch (error) {
    console.log('❌ Fatal error:', error);
  }
}

checkSchema(); 