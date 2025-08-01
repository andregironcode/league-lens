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

async function testMatchDetailsData() {
  try {
    // Test match: Panathinaikos vs Botev Plovdiv (1064603486)
    const matchId = '1064603486';
    console.log(`[Test] Testing data for match ${matchId}...\n`);
    
    // 1. Get match details
    const { data: match } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo)
      `)
      .eq('id', matchId)
      .single();
    
    if (match) {
      console.log(`✅ Match: ${match.home_team.name} vs ${match.away_team.name}`);
      console.log(`   League: ${match.league.name} (ID: ${match.league_id})`);
      console.log(`   Date: ${match.match_date}`);
      console.log(`   Score: ${match.home_score} - ${match.away_score}`);
    }
    
    // 2. Check lineups
    const { data: lineups } = await supabase
      .from('match_lineups')
      .select('*')
      .eq('match_id', matchId);
    
    console.log(`\n✅ Lineups: ${lineups?.length || 0} teams`);
    
    // 3. Check events
    const { data: events } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId);
    
    console.log(`✅ Events: ${events?.length || 0} events`);
    
    // 4. Check statistics
    const { data: stats } = await supabase
      .from('match_statistics')
      .select('*')
      .eq('match_id', matchId);
    
    console.log(`✅ Statistics: ${stats?.length || 0} records`);
    
    // 5. Check standings for the league
    if (match?.league_id) {
      const { data: standings } = await supabase
        .from('standings')
        .select('*')
        .eq('league_id', match.league_id)
        .eq('season', '2024')
        .limit(5);
      
      console.log(`\n✅ Standings for ${match.league.name}: ${standings?.length || 0} teams`);
    }
    
    // 6. Check team form
    if (match?.home_team_id) {
      const { data: form } = await supabase
        .from('team_form')
        .select('*')
        .eq('team_id', match.home_team_id)
        .single();
      
      console.log(`\n✅ Team form for ${match.home_team.name}: ${form ? 'Available' : 'Not available'}`);
    }
    
    // 7. Check H2H
    if (match?.home_team_id && match?.away_team_id) {
      const { data: h2h } = await supabase
        .from('matches')
        .select('*')
        .or(`and(home_team_id.eq.${match.home_team_id},away_team_id.eq.${match.away_team_id}),and(home_team_id.eq.${match.away_team_id},away_team_id.eq.${match.home_team_id})`)
        .limit(5);
      
      console.log(`✅ Head-to-head matches: ${h2h?.length || 0} matches found`);
    }
    
    // 8. Check highlights
    const { data: highlights } = await supabase
      .from('highlights')
      .select('*')
      .eq('match_id', matchId);
    
    console.log(`✅ Highlights: ${highlights?.length || 0} videos`);
    
  } catch (error) {
    console.error('[Test] Error:', error);
  }
}

testMatchDetailsData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('[Test] Fatal error:', error);
    process.exit(1);
  });