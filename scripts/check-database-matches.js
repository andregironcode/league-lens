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

async function checkDatabase() {
  try {
    // Count total matches
    const { count: totalCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    
    console.log(`[Database] Total matches in database: ${totalCount}`);
    
    // Get matches for today (2024-12-15)
    const today = '2024-12-15';
    const { data: todayMatches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name),
        league:leagues!matches_league_id_fkey(id, name),
        status,
        home_score,
        away_score
      `)
      .eq('match_date', today)
      .limit(5);
    
    if (error) {
      console.error('[Database] Error:', error);
      return;
    }
    
    console.log(`\n[Database] Sample matches for ${today}:`);
    todayMatches?.forEach((match, index) => {
      console.log(`${index + 1}. ${match.home_team?.name || 'Unknown'} vs ${match.away_team?.name || 'Unknown'}`);
      console.log(`   League: ${match.league?.name || 'Unknown'}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Score: ${match.home_score || 0} - ${match.away_score || 0}`);
    });
    
    // Check date range
    const { data: dateRange } = await supabase
      .from('matches')
      .select('match_date')
      .order('match_date', { ascending: true })
      .limit(1);
    
    const { data: latestDate } = await supabase
      .from('matches')
      .select('match_date')
      .order('match_date', { ascending: false })
      .limit(1);
    
    if (dateRange && latestDate) {
      console.log(`\n[Database] Date range: ${dateRange[0].match_date} to ${latestDate[0].match_date}`);
    }
    
  } catch (error) {
    console.error('[Database] Error:', error);
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('[Database] Fatal error:', error);
    process.exit(1);
  });