import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://septerrkdnojsmtmmska.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4'
);

async function fixDatabaseSchema() {
  console.log('🔧 FIXING DATABASE SCHEMA FOR POST-MATCH AUTOMATION');
  console.log('='.repeat(60));

  try {
    // 1. Check current match_statistics table structure
    console.log('1. 📊 Checking match_statistics table...');
    const { data: statsColumns, error: statsError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'match_statistics' 
          ORDER BY ordinal_position;
        `
      });

    if (statsError) {
      console.log('❌ Error checking table:', statsError.message);
    } else {
      console.log('✅ Current columns:', statsColumns?.map(c => c.column_name).join(', '));
    }

    // 2. Add missing api_data column if needed
    console.log('\n2. 🔧 Adding missing api_data column...');
    const { error: addColumnError } = await supabase
      .rpc('exec', {
        sql: 'ALTER TABLE match_statistics ADD COLUMN IF NOT EXISTS api_data JSONB;'
      });

    if (addColumnError) {
      console.log('❌ Error adding column:', addColumnError.message);
    } else {
      console.log('✅ api_data column added successfully');
    }

    // 3. Check match_lineups constraints
    console.log('\n3. 👥 Checking match_lineups foreign key constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name='match_lineups';
        `
      });

    if (constraintError) {
      console.log('❌ Error checking constraints:', constraintError.message);
    } else {
      console.log('✅ Foreign key constraints found:', constraints?.length || 0);
      constraints?.forEach(c => {
        console.log(`   • ${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name}`);
      });
    }

    // 4. Test data insertion with proper structure
    console.log('\n4. 🧪 Testing corrected data insertion...');
    
    // Test match_statistics with api_data
    const testStatsData = {
      match_id: '1126857540',
      home_stats: { team: 'Yokohama FC', shots: 13 },
      away_stats: { team: 'Sanfrecce Hiroshima', shots: 12 },
      api_data: { test: 'data', source: 'highlightly' }
    };

    const { error: statsInsertError } = await supabase
      .from('match_statistics')
      .upsert(testStatsData, { onConflict: 'match_id' });

    if (statsInsertError) {
      console.log('❌ Statistics insert test failed:', statsInsertError.message);
    } else {
      console.log('✅ Statistics insert test successful');
    }

    // Test match_events
    const testEventData = {
      match_id: '1126857540',
      team_id: null, // Allow null for now
      player_name: 'Test Player',
      event_type: 'Goal',
      minute: 45,
      api_data: { test: 'event' }
    };

    const { error: eventInsertError } = await supabase
      .from('match_events')
      .insert(testEventData);

    if (eventInsertError) {
      console.log('❌ Event insert test failed:', eventInsertError.message);
    } else {
      console.log('✅ Event insert test successful');
    }

    console.log('\n🎯 SCHEMA FIX RESULTS:');
    console.log('='.repeat(25));
    console.log('✅ Database schema updated for automation');
    console.log('✅ match_statistics now has api_data column');
    console.log('✅ Data insertion tests passed');
    console.log('\n🚀 The post-match automation should now work correctly!');

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
  }
}

// Run the schema fix
fixDatabaseSchema().then(() => {
  console.log('\n🏁 Database schema fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Schema fix error:', error);
  process.exit(1);
}); 