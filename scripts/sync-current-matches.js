import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PROXY_BASE_URL = 'http://localhost:3001/api/highlightly';

// Current working league IDs
const LEAGUES = [
  { id: 2486, name: 'Premier League' },
  { id: 119924, name: 'La Liga' },
  { id: 115669, name: 'Serie A' },
  { id: 67162, name: 'Bundesliga' },
  { id: 52695, name: 'Ligue 1' }
];

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function syncCurrentMatches() {
  console.log('🔄 SYNCING CURRENT SEASON MATCHES (2024-2025)');
  console.log('==================================================');
  
  const now = new Date();
  const currentSeason = '2024';
  
  // Generate date range: last 30 days to next 30 days
  const startDate = new Date(now.getTime() - 30*24*60*60*1000);
  const endDate = new Date(now.getTime() + 30*24*60*60*1000);
  
  console.log(`📅 Syncing from: ${formatDate(startDate)}`);
  console.log(`📅 Syncing to: ${formatDate(endDate)}`);
  console.log(`🏆 Season: ${currentSeason}`);
  console.log('');
  
  let totalMatches = 0;
  let newMatches = 0;
  let errors = 0;
  
  for (const league of LEAGUES) {
    console.log(`🏆 Processing ${league.name}...`);
    
    // Generate dates for this period
    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)));
    }
    
    for (const date of dates) {
      try {
        const url = `${PROXY_BASE_URL}/matches?leagueId=${league.id}&date=${date}&season=${currentSeason}`;
        console.log(`   📡 Fetching: ${date}...`);
        
        const response = await fetch(url);
        if (!response.ok) {
          console.log(`   ❌ API error for ${date}: ${response.status}`);
          errors++;
          continue;
        }
        
        const data = await response.json();
        const matches = data.matches || [];
        
        if (matches.length === 0) {
          console.log(`   ℹ️  No matches on ${date}`);
          continue;
        }
        
        console.log(`   ⚽ Found ${matches.length} matches on ${date}`);
        
        for (const match of matches) {
          totalMatches++;
          
          // Check if match already exists
          const { data: existing } = await supabase
            .from('matches')
            .select('id')
            .eq('highlightly_match_id', match.id)
            .single();
            
          if (existing) {
            console.log(`   ⏭️  Match already exists: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
            continue;
          }
          
          // Get team IDs
          const { data: homeTeam } = await supabase
            .from('teams')
            .select('id')
            .eq('name', match.homeTeam?.name)
            .single();
            
          const { data: awayTeam } = await supabase
            .from('teams')
            .select('id')
            .eq('name', match.awayTeam?.name)
            .single();
            
          if (!homeTeam || !awayTeam) {
            console.log(`   ⚠️  Teams not found: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
            continue;
          }
          
          // Insert match
          const matchData = {
            highlightly_match_id: match.id,
            league_id: league.id,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            home_team_name: match.homeTeam?.name,
            away_team_name: match.awayTeam?.name,
            match_date: date,
            match_time: match.time || '00:00',
            status: match.status || 'scheduled',
            home_score: match.homeTeam?.score || null,
            away_score: match.awayTeam?.score || null,
            season: currentSeason,
            has_lineups: false,
            has_events: false,
            has_highlights: false
          };
          
          const { error: insertError } = await supabase
            .from('matches')
            .insert(matchData);
            
          if (insertError) {
            console.log(`   ❌ Insert error: ${insertError.message}`);
            errors++;
          } else {
            console.log(`   ✅ Added: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
            newMatches++;
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error on ${date}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`   📊 ${league.name} completed\\n`);
  }
  
  console.log('==================================================');
  console.log(`📊 SYNC COMPLETE:`);
  console.log(`   • Total matches processed: ${totalMatches}`);
  console.log(`   • New matches added: ${newMatches}`);
  console.log(`   • Errors: ${errors}`);
  console.log('==================================================');
  
  // Check upcoming matches now
  console.log('\\n🔍 CHECKING UPCOMING MATCHES AFTER SYNC...');
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  const nextWeek = new Date(now.getTime() + 7*24*60*60*1000);
  
  const { data: upcoming } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', formatDate(now))
    .lte('match_date', formatDate(nextWeek))
    .order('match_date', { ascending: true });
    
  console.log(`⚽ UPCOMING MATCHES: ${upcoming?.length || 0}`);
  if (upcoming && upcoming.length > 0) {
    upcoming.slice(0, 5).forEach(match => {
      console.log(`   • ${match.home_team_name} vs ${match.away_team_name} (${match.match_date})`);
    });
    if (upcoming.length > 5) {
      console.log(`   ... and ${upcoming.length - 5} more`);
    }
  }
}

syncCurrentMatches().catch(console.error); 