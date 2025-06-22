const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testQuery() {
  console.log('Testing upcoming matches query...');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      status,
      venue,
      league_id,
      api_data,
      leagues!inner (
        id,
        name,
        country_name,
        logo
      ),
      home_team:teams!home_team_id (
        id,
        name,
        logo
      ),
      away_team:teams!away_team_id (
        id,
        name,
        logo
      )
    `)
    .gte('match_date', '2025-06-21')
    .lte('match_date', '2025-06-27')
    .order('match_date', { ascending: true })
    .limit(5);
    
  if (error) {
    console.error('Query error:', error);
    return;
  }
  
  console.log(`Found ${matches.length} matches`);
  
  if (matches.length > 0) {
    const match = matches[0];
    console.log('Sample match:');
    console.log('- ID:', match.id);
    console.log('- Date:', match.match_date);
    console.log('- Home team from join:', match.home_team?.name || 'NULL');
    console.log('- Away team from join:', match.away_team?.name || 'NULL');
    console.log('- Home team from API:', match.api_data?.homeTeam?.name || 'NULL');
    console.log('- Away team from API:', match.api_data?.awayTeam?.name || 'NULL');
    console.log('- League:', match.leagues?.name);
  }
}

testQuery().catch(console.error); 