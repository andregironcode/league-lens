import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // List all tables we're interested in
    const tables = [
      'matches',
      'teams', 
      'leagues',
      'standings',
      'match_statistics',
      'match_events',
      'match_lineups',
      'highlights',
      'team_form',
      'head_to_head'
    ];
    
    console.log('[Schema] Checking database tables...\n');
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: Table does not exist or error accessing`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Error - ${err.message}`);
      }
    }
    
    // Check sample data from key tables
    console.log('\n[Schema] Sample data from key tables:');
    
    // Check if we have any statistics
    const { data: stats } = await supabase
      .from('match_statistics')
      .select('*')
      .limit(1);
    console.log('\nMatch Statistics sample:', stats?.[0] ? 'Has data' : 'No data');
    
    // Check if we have any lineups
    const { data: lineups } = await supabase
      .from('match_lineups')
      .select('*')
      .limit(1);
    console.log('Match Lineups sample:', lineups?.[0] ? 'Has data' : 'No data');
    
    // Check if we have any standings
    const { data: standings } = await supabase
      .from('standings')
      .select('*')
      .limit(1);
    console.log('Standings sample:', standings?.[0] ? 'Has data' : 'No data');
    
  } catch (error) {
    console.error('[Schema] Error:', error);
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('[Schema] Fatal error:', error);
    process.exit(1);
  });