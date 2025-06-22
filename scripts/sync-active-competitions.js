import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

console.log('🚀 Active Competitions Sync Script Starting...');

const supabaseUrl = 'https://xsslvajrqlpxzqwgvzjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2x2YWpycWxweHpxd2d2empoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1MTkzMzQsImV4cCI6MjA0OTA5NTMzNH0.yzNkJF8LCiLdKzqhzGfJUE1YJHKgbOhFnCDpCvtKJGU';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📡 Supabase client initialized');

// Top 50 ranked competitions based on global importance and popularity
const TOP_COMPETITIONS_RANKING = [
  // Tier 1: Global Tournaments & Major Continental Competitions (1-10)
  { id: 1635, name: "World Cup", tier: 1, priority: 1 },
  { id: 2486, name: "UEFA Champions League", tier: 1, priority: 2 },
  { id: 4188, name: "Euro Championship", tier: 1, priority: 3 },
  { id: 8443, name: "Copa America", tier: 1, priority: 4 },
  { id: 3337, name: "UEFA Europa League", tier: 1, priority: 5 },
  { id: 11847, name: "CONMEBOL Libertadores", tier: 1, priority: 6 },
  { id: 5890, name: "Africa Cup of Nations", tier: 1, priority: 7 },
  { id: 6741, name: "Asian Cup", tier: 1, priority: 8 },
  { id: 5039, name: "UEFA Nations League", tier: 1, priority: 9 },
  { id: 15251, name: "AFC Champions League", tier: 1, priority: 10 },

  // Tier 2: Top European Leagues (11-20)
  { id: 33973, name: "Premier League", tier: 2, priority: 11 },
  { id: 119924, name: "La Liga", tier: 2, priority: 12 },
  { id: 115669, name: "Serie A", tier: 2, priority: 13 },
  { id: 67162, name: "Bundesliga", tier: 2, priority: 14 },
  { id: 52695, name: "Ligue 1", tier: 2, priority: 15 },
  { id: 75672, name: "Eredivisie", tier: 2, priority: 16 },
  { id: 80778, name: "Primeira Liga", tier: 2, priority: 17 },
  { id: 34824, name: "Championship", tier: 2, priority: 18 },
  { id: 68013, name: "2. Bundesliga", tier: 2, priority: 19 },
  { id: 53546, name: "Ligue 2", tier: 2, priority: 20 },

  // Tier 3: Major Domestic Cups & Other Top Leagues (21-35)
  { id: 39079, name: "FA Cup", tier: 3, priority: 21 },
  { id: 69715, name: "DFB Pokal", tier: 3, priority: 22 },
  { id: 56950, name: "Coupe de France", tier: 3, priority: 23 },
  { id: 82480, name: "Taça de Portugal", tier: 3, priority: 24 },
  { id: 41632, name: "League Cup", tier: 3, priority: 25 },
  { id: 109712, name: "Liga Profesional Argentina", tier: 3, priority: 26 },
  { id: 61205, name: "Serie A Brazil", tier: 3, priority: 27 },
  { id: 84182, name: "J1 League", tier: 3, priority: 28 },
  { id: 102053, name: "Superliga Denmark", tier: 3, priority: 29 },
  { id: 88437, name: "Eliteserien", tier: 3, priority: 30 },
  { id: 96947, name: "Allsvenskan", tier: 3, priority: 31 },
  { id: 90990, name: "Ekstraklasa", tier: 3, priority: 32 },
  { id: 99500, name: "Premier League Belarus", tier: 3, priority: 33 },
  { id: 94394, name: "Premier League Wales", tier: 3, priority: 34 },
  { id: 35675, name: "League One", tier: 3, priority: 35 },

  // Tier 4: Secondary Leagues & Continental Cups (36-50)
  { id: 76523, name: "Eerste Divisie", tier: 4, priority: 36 },
  { id: 81629, name: "Segunda Liga", tier: 4, priority: 37 },
  { id: 68864, name: "3. Liga", tier: 4, priority: 38 },
  { id: 36526, name: "League Two", tier: 4, priority: 39 },
  { id: 62056, name: "Serie B Brazil", tier: 4, priority: 40 },
  { id: 85033, name: "J2 League", tier: 4, priority: 41 },
  { id: 110563, name: "Primera Nacional", tier: 4, priority: 42 },
  { id: 10145, name: "CONMEBOL Sudamericana", tier: 4, priority: 43 },
  { id: 10996, name: "CAF Champions League", tier: 4, priority: 44 },
  { id: 14400, name: "CONCACAF Champions League", tier: 4, priority: 45 },
  { id: 19506, name: "CONCACAF Gold Cup", tier: 4, priority: 46 },
  { id: 16102, name: "AFC Cup", tier: 4, priority: 47 },
  { id: 17804, name: "CAF Confederation Cup", tier: 4, priority: 48 },
  { id: 13549, name: "FIFA Club World Cup", tier: 4, priority: 49 },
  { id: 9294, name: "Friendlies", tier: 4, priority: 50 }
];

async function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

async function getDateRange() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 5);

  return {
    startDate: yesterday.toISOString().split('T')[0],
    endDate: futureDate.toISOString().split('T')[0],
    today: today.toISOString().split('T')[0]
  };
}

async function fetchActiveMatches(leagueId, dateRange) {
  const proxyUrl = 'http://localhost:3001/api/highlightly';
  const results = [];
  
  try {
    // Check matches for date range
    const dates = [];
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    for (const date of dates) {
      for (const season of [2024, 2025]) {
        try {
          const url = `${proxyUrl}/matches?leagueId=${leagueId}&date=${date}&season=${season}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              results.push(...data.data);
            }
          }
        } catch (error) {
          // Continue with other dates/seasons
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching matches for league ${leagueId}:`, error.message);
  }

  return results;
}

async function ensureLeagueExists(league) {
  try {
    // Check if league exists
    const { data: existingLeague, error: checkError } = await supabase
      .from('leagues')
      .select('id')
      .eq('highlightly_league_id', league.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking league ${league.name}:`, checkError);
      return false;
    }

    if (!existingLeague) {
      // Create new league
      const { error: insertError } = await supabase
        .from('leagues')
        .insert({
          id: league.id.toString(),
          name: league.name,
          highlightly_league_id: league.id,
          priority_ranking: league.priority,
          tier: league.tier,
          is_active: false,
          current_season: '2024'
        });

      if (insertError) {
        console.error(`Error creating league ${league.name}:`, insertError);
        return false;
      }
      
      console.log(`✨ Created new league: ${league.name}`);
    }

    return true;
  } catch (error) {
    console.error(`Error ensuring league exists ${league.name}:`, error);
    return false;
  }
}

async function updateLeagueActivity(league, hasActiveMatches, matchCount, upcomingMatches, recentMatches) {
  try {
    const { error } = await supabase
      .from('leagues')
      .update({
        is_active: hasActiveMatches,
        last_activity_check: new Date().toISOString(),
        active_match_count: matchCount,
        upcoming_matches: upcomingMatches,
        recent_matches: recentMatches,
        priority_ranking: league.priority,
        tier: league.tier
      })
      .eq('highlightly_league_id', league.id);

    if (error) {
      console.error(`Error updating league ${league.name}:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error updating league ${league.name}:`, error);
    return false;
  }
}

async function syncActiveCompetitions() {
  console.log('🏆 Starting Active Competitions Sync...');
  console.log(`📊 Processing top ${TOP_COMPETITIONS_RANKING.length} ranked competitions`);
  
  const dateRange = await getDateRange();
  console.log(`📅 Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
  
  let activeCount = 0;
  let processedCount = 0;
  let createdCount = 0;
  const results = [];

  for (const league of TOP_COMPETITIONS_RANKING) {
    processedCount++;
    console.log(`\n[${processedCount}/${TOP_COMPETITIONS_RANKING.length}] Processing: ${league.name} (ID: ${league.id}, Tier: ${league.tier})`);
    
    try {
      // Ensure league exists in database
      const leagueExists = await ensureLeagueExists(league);
      if (!leagueExists) {
        console.log(`❌ Could not ensure league exists: ${league.name}`);
        continue;
      }

      // Fetch active matches
      const matches = await fetchActiveMatches(league.id, dateRange);
      
      const today = dateRange.today;
      const upcomingMatches = matches.filter(match => match.date > today).length;
      const recentMatches = matches.filter(match => match.date >= dateRange.startDate && match.date <= today).length;
      const totalMatches = matches.length;
      
      const hasActiveMatches = totalMatches > 0;
      
      if (hasActiveMatches) {
        activeCount++;
        console.log(`✅ ACTIVE - ${totalMatches} matches (${upcomingMatches} upcoming, ${recentMatches} recent)`);
      } else {
        console.log(`❌ INACTIVE - No matches found`);
      }

      // Update league activity status
      const updated = await updateLeagueActivity(league, hasActiveMatches, totalMatches, upcomingMatches, recentMatches);
      
      results.push({
        league: league.name,
        id: league.id,
        tier: league.tier,
        priority: league.priority,
        active: hasActiveMatches,
        totalMatches,
        upcomingMatches,
        recentMatches,
        updated
      });

      // Brief delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing ${league.name}:`, error.message);
      results.push({
        league: league.name,
        id: league.id,
        tier: league.tier,
        priority: league.priority,
        active: false,
        error: error.message,
        updated: false
      });
    }
  }

  // Summary
  console.log('\n🏆 ACTIVE COMPETITIONS SYNC COMPLETE');
  console.log('='.repeat(50));
  console.log(`📊 Total Competitions Processed: ${processedCount}`);
  console.log(`✅ Active Competitions Found: ${activeCount}`);
  console.log(`❌ Inactive Competitions: ${processedCount - activeCount}`);
  console.log(`✨ New Leagues Created: ${createdCount}`);
  
  // Show active competitions by tier
  const activeTier1 = results.filter(r => r.active && r.tier === 1);
  const activeTier2 = results.filter(r => r.active && r.tier === 2);
  const activeTier3 = results.filter(r => r.active && r.tier === 3);
  const activeTier4 = results.filter(r => r.active && r.tier === 4);
  
  console.log(`\n🥇 Tier 1 Active (Global): ${activeTier1.length}`);
  activeTier1.forEach(comp => console.log(`   • ${comp.league} (${comp.totalMatches} matches)`));
  
  console.log(`\n🥈 Tier 2 Active (Top Leagues): ${activeTier2.length}`);
  activeTier2.forEach(comp => console.log(`   • ${comp.league} (${comp.totalMatches} matches)`));
  
  console.log(`\n🥉 Tier 3 Active (Major Domestic): ${activeTier3.length}`);
  activeTier3.forEach(comp => console.log(`   • ${comp.league} (${comp.totalMatches} matches)`));
  
  console.log(`\n🏅 Tier 4 Active (Secondary): ${activeTier4.length}`);
  activeTier4.forEach(comp => console.log(`   • ${comp.league} (${comp.totalMatches} matches)`));

  return {
    totalProcessed: processedCount,
    totalActive: activeCount,
    totalCreated: createdCount,
    results,
    summary: {
      tier1: activeTier1.length,
      tier2: activeTier2.length,
      tier3: activeTier3.length,
      tier4: activeTier4.length
    }
  };
}

// Run the sync
if (import.meta.url === `file://${process.argv[1]}`) {
  syncActiveCompetitions()
    .then(result => {
      console.log('\n✅ Sync completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    });
}

export { syncActiveCompetitions, TOP_COMPETITIONS_RANKING }; 