import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('[Cron] Missing VITE_SUPABASE_SERVICE_KEY environment variable');
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAndStoreMatches() {
  const apiKey = process.env.HIGHLIGHTLY_API_KEY22 || process.env.HIGHLIGHTLY_API_KEY;
  
  try {
    console.log('[Cron] Starting match update job...');
    
    // Calculate date range: 14 days ago to 7 days in the future
    // Force use 2024 dates instead of system date
    const today = new Date();
    // Override year to 2024 if system shows 2025
    if (today.getFullYear() === 2025) {
      today.setFullYear(2024);
    }
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 14);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    
    // Format dates for API
    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = futureDate.toISOString().split('T')[0];
    
    console.log(`[Cron] Fetching matches from ${startDate} to ${endDate}`);
    
    let allMatches = [];
    let currentDate = new Date(pastDate);
    
    // Fetch matches for each day in the range
    while (currentDate <= futureDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`[Cron] Fetching matches for ${dateStr}...`);
      
      try {
        const matchesResponse = await fetch(
          `https://soccer.highlightly.net/matches?date=${dateStr}&limit=100`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
            }
          }
        );
        
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          if (matchesData.data && Array.isArray(matchesData.data)) {
            allMatches = allMatches.concat(matchesData.data);
            console.log(`[Cron] Found ${matchesData.data.length} matches for ${dateStr}`);
          }
        } else {
          console.error(`[Cron] Failed to fetch matches for ${dateStr}: ${matchesResponse.status}`);
        }
      } catch (error) {
        console.error(`[Cron] Error fetching matches for ${dateStr}:`, error);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`[Cron] Total matches fetched: ${allMatches.length}`);
    
    // Process and store matches
    for (const match of allMatches) {
      try {
        // Extract team data - handle different API response formats
        const homeTeamData = match.homeTeam || match.teams?.home || {};
        const awayTeamData = match.awayTeam || match.teams?.away || {};
        const leagueData = match.league || match.competition || {};
        
        // Skip if no team data
        if (!homeTeamData.id || !awayTeamData.id) {
          console.warn(`[Cron] Skipping match ${match.id} - missing team data`);
          continue;
        }
        
        // Get match date for historical data fetching
        const matchDate = match.date || new Date().toISOString().split('T')[0];
        
        // Check if teams exist, create if not
        const { data: homeTeam, error: homeError } = await supabase
          .from('teams')
          .upsert({
            id: homeTeamData.id,
            name: homeTeamData.name || 'Unknown',
            logo: homeTeamData.logo || ''
          }, {
            onConflict: 'id'
          })
          .select()
          .single();
        
        if (homeError) {
          console.error(`[Cron] Error upserting home team:`, homeError);
        }
        
        const { data: awayTeam, error: awayError } = await supabase
          .from('teams')
          .upsert({
            id: awayTeamData.id,
            name: awayTeamData.name || 'Unknown',
            logo: awayTeamData.logo || ''
          }, {
            onConflict: 'id'
          })
          .select()
          .single();
        
        if (awayError) {
          console.error(`[Cron] Error upserting away team:`, awayError);
        }
        
        // Upsert league if we have league data
        if (leagueData.id) {
          const { error: leagueError } = await supabase
            .from('leagues')
            .upsert({
              id: leagueData.id,
              name: leagueData.name || 'Unknown League',
              country_name: leagueData.country || '',
              logo: leagueData.logo || ''
            }, {
              onConflict: 'id'
            });
          
          if (leagueError) {
            console.error(`[Cron] Error upserting league:`, leagueError);
          }
        }
        
        // Extract score data - handle different formats
        let homeScore = 0;
        let awayScore = 0;
        
        if (match.score) {
          homeScore = match.score.home || match.score.fulltime?.home || 0;
          awayScore = match.score.away || match.score.fulltime?.away || 0;
        } else if (match.goals) {
          homeScore = match.goals.home || 0;
          awayScore = match.goals.away || 0;
        }
        
        // Extract status - handle different formats
        const status = match.status?.long || match.status?.description || match.state?.description || 'Not Started';
        
        // Upsert match with all available data
        const { error: matchError } = await supabase
          .from('matches')
          .upsert({
            id: match.id,
            league_id: leagueData.id || null,
            home_team_id: homeTeamData.id,
            away_team_id: awayTeamData.id,
            match_date: match.date,
            match_time: match.time || null,
            status: status,
            home_score: homeScore,
            away_score: awayScore,
            has_highlights: match.highlights || false,
            api_data: match,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (matchError) {
          console.error(`[Cron] Error upserting match ${match.id}:`, matchError);
        } else {
          console.log(`[Cron] Successfully stored match ${match.id}: ${homeTeamData.name} vs ${awayTeamData.name}`);
        }
        
        // If match has highlights, fetch and store them
        if (match.highlights && match.id) {
          try {
            const highlightsResponse = await fetch(
              `https://soccer.highlightly.net/highlights?matchId=${match.id}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'x-rapidapi-key': apiKey,
                  'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
                }
              }
            );
            
            if (highlightsResponse.ok) {
              const highlightsData = await highlightsResponse.json();
              
              for (const highlight of highlightsData.data || []) {
                const { error: highlightError } = await supabase
                  .from('highlights')
                  .upsert({
                    id: highlight.id,
                    match_id: match.id,
                    title: highlight.title || '',
                    url: highlight.videoUrl || highlight.video_url || '',
                    thumbnail: highlight.thumbnailUrl || highlight.thumbnail_url || '',
                    duration: highlight.duration || 0,
                    views: highlight.views || 0,
                    api_data: highlight
                  }, {
                    onConflict: 'id'
                  });
                
                if (highlightError) {
                  console.error(`[Cron] Error upserting highlight:`, highlightError);
                }
              }
              
              console.log(`[Cron] Stored ${highlightsData.data?.length || 0} highlights for match ${match.id}`);
            }
          } catch (highlightError) {
            console.error(`[Cron] Error fetching highlights for match ${match.id}:`, highlightError);
          }
        }
      } catch (error) {
        console.error(`[Cron] Error processing match ${match.id}:`, error);
      }
    }
    
    console.log(`[Cron] Successfully updated ${allMatches.length} matches`);
    return { success: true, matchesUpdated: allMatches.length };
    
  } catch (error) {
    console.error('Error updating database:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // Verify this is a valid cron request from Vercel
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  
  // Only check if CRON_SECRET is set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const result = await fetchAndStoreMatches();
  
  if (result.success) {
    res.status(200).json({ 
      message: 'Database updated successfully',
      matchesUpdated: result.matchesUpdated 
    });
  } else {
    res.status(500).json({ 
      error: 'Failed to update database',
      details: result.error 
    });
  }
}