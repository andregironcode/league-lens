import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugH2HFormat() {
  const matchId = '1028070056'; // Arsenal vs Leicester - has H2H data
  
  console.log(`🔍 DEBUGGING H2H DATA FORMAT FOR ID: ${matchId}`);
  console.log('='.repeat(60));
  
  try {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select('id, api_data, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      console.log('❌ Match not found:', error);
      return;
    }

    console.log('📋 MATCH INFO:');
    console.log(`   Teams: ${matchData.home_team?.name} vs ${matchData.away_team?.name}`);
    
    const apiData = matchData.api_data || {};
    const headToHead = apiData.headToHead;
    
    console.log('\n📦 H2H DATA STRUCTURE:');
    if (headToHead) {
      console.log('   headToHead keys:', Object.keys(headToHead));
      console.log('   totalMatches:', headToHead.totalMatches);
      console.log('   homeWins:', headToHead.homeWins);
      console.log('   awayWins:', headToHead.awayWins);
      console.log('   draws:', headToHead.draws);
      console.log('   matches array length:', headToHead.matches?.length || 0);
      
      if (headToHead.matches && headToHead.matches.length > 0) {
        console.log('\n⚽ SAMPLE H2H MATCH:');
        const match = headToHead.matches[0];
        console.log('   Match keys:', Object.keys(match));
        console.log('   Match structure:');
        console.log('   ', JSON.stringify({
          id: match.id,
          date: match.date,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          state: match.state,
          league: match.league
        }, null, 2));
        
        // Check if match has score information
        console.log('\n📊 SCORE INFORMATION:');
        console.log('   state.score:', match.state?.score);
        console.log('   goals:', match.goals);
        console.log('   homeScore:', match.homeScore);
        console.log('   awayScore:', match.awayScore);
      }
    } else {
      console.log('   ❌ No H2H data found');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugH2HFormat(); 