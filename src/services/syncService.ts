/**
 * SYNC SERVICE
 * 
 * Manages background synchronization between Highlightly API and Supabase
 * This keeps your database fresh while respecting rate limits
 */

import { supabase } from '@/integrations/supabase/client';
import { highlightlyClient } from '@/integrations/highlightly/client';

interface SyncStatus {
  type: 'leagues' | 'matches' | 'highlights';
  last_sync: string;
  status: 'success' | 'error';
  message?: string;
  api_calls_used?: number;
}

class SyncService {
  private rateLimitDelay = 2000; // 2 seconds between requests
  private maxApiCallsPerMinute = 30;
  private currentApiCalls = 0;
  private lastMinuteReset = Date.now();

  async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.lastMinuteReset >= 60000) {
      this.currentApiCalls = 0;
      this.lastMinuteReset = now;
    }
    
    // Wait if we've hit the limit
    if (this.currentApiCalls >= this.maxApiCallsPerMinute) {
      const waitTime = 60000 - (now - this.lastMinuteReset);
      console.log(`[SyncService] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.currentApiCalls = 0;
      this.lastMinuteReset = Date.now();
    }
    
    this.currentApiCalls++;
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      await supabase
        .from('sync_status')
        .upsert({
          ...status,
          updated_at: new Date().toISOString()
        }, { onConflict: 'type' });
    } catch (error) {
      console.error('[SyncService] Error updating sync status:', error);
    }
  }

  async syncPriorityLeagues(): Promise<void> {
    console.log('[SyncService] 🔄 Syncing priority leagues...');
    
    const priorityLeagueIds = [
      '39',   // Premier League
      '140',  // La Liga  
      '135',  // Serie A
      '78',   // Bundesliga
      '61',   // Ligue 1
      '2',    // UEFA Champions League
      '3',    // UEFA Europa League
      '1'     // FIFA World Cup
    ];

    let apiCallsUsed = 0;
    
    try {
      for (const leagueId of priorityLeagueIds) {
        try {
          await this.checkRateLimit();
          
          console.log(`[SyncService] Fetching league ${leagueId}...`);
          const response = await highlightlyClient.getLeagueById(leagueId);
          apiCallsUsed++;
          
          if (response?.data || response?.id) {
            const leagueData = response.data || response;
            const league = Array.isArray(leagueData) ? leagueData[0] : leagueData;
            
            if (league?.id) {
              // Upsert league data
              await supabase
                .from('leagues')
                .upsert({
                  id: league.id.toString(),
                  name: league.name,
                  logo: league.logo,
                  country_code: league.country?.code,
                  country_name: league.country?.name,
                  country_logo: league.country?.logo,
                  priority: true,
                  api_data: league,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
              
              console.log(`[SyncService] ✅ Synced league: ${league.name}`);
            }
          }
        } catch (error) {
          console.error(`[SyncService] Error syncing league ${leagueId}:`, error);
        }
      }
      
      await this.updateSyncStatus({
        type: 'leagues',
        status: 'success',
        message: `Synced ${priorityLeagueIds.length} priority leagues`,
        api_calls_used: apiCallsUsed
      });
      
      console.log(`[SyncService] ✅ League sync complete (${apiCallsUsed} API calls)`);
      
    } catch (error) {
      await this.updateSyncStatus({
        type: 'leagues',
        status: 'error',
        message: error.message,
        api_calls_used: apiCallsUsed
      });
      console.error('[SyncService] League sync failed:', error);
    }
  }

  async syncRecentMatches(): Promise<void> {
    console.log('[SyncService] 🔄 Syncing recent matches...');
    
    const priorityLeagueIds = ['39', '140', '135', '78', '61', '2', '3'];
    let apiCallsUsed = 0;
    
    try {
      for (const leagueId of priorityLeagueIds) {
        try {
          await this.checkRateLimit();
          
          console.log(`[SyncService] Fetching matches for league ${leagueId}...`);
          
          // Get recent matches (last 7 days)
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
          
          const response = await highlightlyClient.getMatches({
            leagueId: leagueId,
            date: startDate,
            limit: '20'
          });
          apiCallsUsed++;
          
          if (response?.data && Array.isArray(response.data)) {
            for (const match of response.data) {
              if (match?.id) {
                // Upsert match data
                await supabase
                  .from('matches')
                  .upsert({
                    id: match.id.toString(),
                    home_team_id: match.teams?.home?.id?.toString() || match.homeTeam?.id?.toString() || 'unknown',
                    away_team_id: match.teams?.away?.id?.toString() || match.awayTeam?.id?.toString() || 'unknown',
                    league_id: leagueId,
                    match_date: match.fixture?.date?.split('T')[0] || match.date?.split('T')[0] || endDate,
                    match_time: match.fixture?.date?.split('T')[1]?.substring(0,5) || match.time || '00:00',
                    status: typeof match.fixture?.status?.short === 'string' ? match.fixture.status.short : (match.status || 'TBD'),
                    home_score: match.goals?.home || match.score?.home || 0,
                    away_score: match.goals?.away || match.score?.away || 0,
                    season: '2024',
                    has_highlights: !!(match.highlights?.length || match.highlight),
                    api_data: match,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'id' });
                
                // Also upsert team data if available
                if (match.teams?.home || match.homeTeam) {
                  const homeTeam = match.teams?.home || match.homeTeam;
                  await supabase
                    .from('teams')
                    .upsert({
                      id: homeTeam.id.toString(),
                      name: homeTeam.name,
                      logo: homeTeam.logo,
                      league_id: leagueId,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
                }
                
                if (match.teams?.away || match.awayTeam) {
                  const awayTeam = match.teams?.away || match.awayTeam;
                  await supabase
                    .from('teams')
                    .upsert({
                      id: awayTeam.id.toString(),
                      name: awayTeam.name,
                      logo: awayTeam.logo,
                      league_id: leagueId,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
                }
              }
            }
            
            console.log(`[SyncService] ✅ Synced ${response.data.length} matches for league ${leagueId}`);
          }
        } catch (error) {
          console.error(`[SyncService] Error syncing matches for league ${leagueId}:`, error);
        }
      }
      
      await this.updateSyncStatus({
        type: 'matches',
        status: 'success',
        message: `Synced matches for ${priorityLeagueIds.length} leagues`,
        api_calls_used: apiCallsUsed
      });
      
      console.log(`[SyncService] ✅ Match sync complete (${apiCallsUsed} API calls)`);
      
    } catch (error) {
      await this.updateSyncStatus({
        type: 'matches',
        status: 'error',
        message: error.message,
        api_calls_used: apiCallsUsed
      });
      console.error('[SyncService] Match sync failed:', error);
    }
  }

  async syncHighlights(): Promise<void> {
    console.log('[SyncService] 🔄 Syncing highlights...');
    
    let apiCallsUsed = 0;
    
    try {
      await this.checkRateLimit();
      
      // Get recent highlights
      const response = await highlightlyClient.getHighlights({
        limit: '50'
      });
      apiCallsUsed++;
      
      if (response?.data && Array.isArray(response.data)) {
        for (const highlight of response.data) {
          if (highlight?.id) {
            await supabase
              .from('highlights')
              .upsert({
                id: highlight.id.toString(),
                match_id: highlight.match?.id?.toString() || highlight.matchId?.toString() || 'unknown',
                title: highlight.title,
                url: highlight.url || highlight.videoUrl,
                thumbnail: highlight.thumbnail || highlight.thumbnailUrl || highlight.imgUrl,
                duration: highlight.duration,
                views: highlight.views || 0,
                embed_url: highlight.embedUrl,
                quality: highlight.quality,
                api_data: highlight,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });
          }
        }
        
        console.log(`[SyncService] ✅ Synced ${response.data.length} highlights`);
      }
      
      await this.updateSyncStatus({
        type: 'highlights',
        status: 'success',
        message: `Synced highlights`,
        api_calls_used: apiCallsUsed
      });
      
    } catch (error) {
      await this.updateSyncStatus({
        type: 'highlights',
        status: 'error',
        message: error.message,
        api_calls_used: apiCallsUsed
      });
      console.error('[SyncService] Highlight sync failed:', error);
    }
  }

  async runFullSync(): Promise<void> {
    console.log('[SyncService] 🚀 Starting full sync...');
    
    const startTime = Date.now();
    
    try {
      // Run syncs sequentially to respect rate limits
      await this.syncPriorityLeagues();
      await this.syncRecentMatches();
      await this.syncHighlights();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`[SyncService] 🎉 Full sync complete in ${duration}s`);
      
    } catch (error) {
      console.error('[SyncService] Full sync failed:', error);
    }
  }

  async getSyncStatus(): Promise<SyncStatus[]> {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('[SyncService] Error fetching sync status:', error);
      return [];
    }
    
    return data || [];
  }
}

export const syncService = new SyncService(); 