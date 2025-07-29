import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAndStoreMatches() {
  const apiKey = process.env.HIGHLIGHTLY_API_KEY;
  
  try {
    // Fetch today's matches
    const today = new Date().toISOString().split('T')[0];
    const matchesResponse = await fetch(
      `https://highlightly.net/api/feed/football/matches?date=${today}`,
      {
        headers: {
          'X-AUTH-TOKEN': apiKey
        }
      }
    );
    
    if (!matchesResponse.ok) {
      throw new Error(`Failed to fetch matches: ${matchesResponse.status}`);
    }
    
    const matchesData = await matchesResponse.json();
    
    // Process and store matches
    for (const match of matchesData.data || []) {
      // Check if teams exist, create if not
      const { data: homeTeam } = await supabase
        .from('teams')
        .upsert({
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      const { data: awayTeam } = await supabase
        .from('teams')
        .upsert({
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      // Upsert competition
      const { data: competition } = await supabase
        .from('competitions')
        .upsert({
          id: match.league.id,
          name: match.league.name,
          country: match.league.country,
          logo: match.league.logo
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      // Upsert match
      await supabase
        .from('matches')
        .upsert({
          id: match.id,
          competition_id: match.league.id,
          home_team_id: match.homeTeam.id,
          away_team_id: match.awayTeam.id,
          match_date: match.date,
          match_time: match.time,
          status: match.status?.long || 'Not Started',
          home_score: match.score?.home || 0,
          away_score: match.score?.away || 0,
          has_highlights: match.highlights || false,
          api_data: match
        }, {
          onConflict: 'id'
        });
      
      // If match has highlights, fetch and store them
      if (match.highlights) {
        const highlightsResponse = await fetch(
          `https://highlightly.net/api/feed/football/match/${match.id}/highlights`,
          {
            headers: {
              'X-AUTH-TOKEN': apiKey
            }
          }
        );
        
        if (highlightsResponse.ok) {
          const highlightsData = await highlightsResponse.json();
          
          for (const highlight of highlightsData.data || []) {
            await supabase
              .from('match_highlights')
              .upsert({
                id: highlight.id,
                match_id: match.id,
                competition_id: match.league.id,
                home_team_id: match.homeTeam.id,
                away_team_id: match.awayTeam.id,
                title: highlight.title,
                thumbnail_url: highlight.thumbnailUrl,
                video_url: highlight.videoUrl,
                date: highlight.date,
                duration: highlight.duration,
                views: highlight.views || 0,
                home_score: match.score?.home || 0,
                away_score: match.score?.away || 0
              }, {
                onConflict: 'id'
              });
          }
        }
      }
    }
    
    console.log(`Successfully updated ${matchesData.data?.length || 0} matches`);
    return { success: true, matchesUpdated: matchesData.data?.length || 0 };
    
  } catch (error) {
    console.error('Error updating database:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // Verify this is a valid cron request from Vercel
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
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