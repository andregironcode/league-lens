import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://septerrkdnojsmtmmska.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { date, startDate, endDate, limit = 50, teamId, leagueId, matchId } = req.query;
    
    console.log('[Database API] Fetching matches with params:', { date, startDate, endDate, limit, teamId, leagueId, matchId });
    
    // Build query
    let query = supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues!matches_league_id_fkey(id, name, logo, country_name)
      `)
      .order('match_date', { ascending: false })
      .limit(parseInt(limit));
    
    // Apply filters
    if (matchId) {
      // If matchId is provided, get specific match
      query = query.eq('id', matchId);
    } else if (date) {
      query = query.eq('match_date', date);
    } else if (startDate && endDate) {
      query = query.gte('match_date', startDate).lte('match_date', endDate);
    } else if (startDate) {
      query = query.gte('match_date', startDate);
    } else if (endDate) {
      query = query.lte('match_date', endDate);
    }
    
    if (teamId) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
    }
    
    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }
    
    const { data: matches, error } = await query;
    
    if (error) {
      console.error('[Database API] Error fetching matches:', error);
      throw error;
    }
    
    console.log(`[Database API] Found ${matches?.length || 0} matches`);
    
    // Transform data to match the expected API format
    const transformedMatches = matches?.map(match => {
      // Start with api_data as base
      const baseData = match.api_data || {};
      
      // Override with database values
      return {
        ...baseData,
        id: match.id,
        date: match.match_date,
        time: match.match_time,
        homeTeam: match.home_team || { id: match.home_team_id, name: 'Unknown', logo: '' },
        awayTeam: match.away_team || { id: match.away_team_id, name: 'Unknown', logo: '' },
        league: match.league || { id: match.league_id, name: 'Unknown League', logo: '' },
        competition: match.league || { id: match.league_id, name: 'Unknown League', logo: '' }, // Alias for compatibility
        score: {
          home: match.home_score || 0,
          away: match.away_score || 0
        },
        status: {
          long: match.status || 'Not Started',
          description: match.status || 'Not Started'
        },
        highlights: match.has_highlights || false
      };
    }) || [];
    
    res.status(200).json({
      data: transformedMatches,
      count: transformedMatches.length,
      source: 'database'
    });
    
  } catch (error) {
    console.error('[Database API] Error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch matches from database',
      details: error.message
    });
  }
}