/**
 * BACKGROUND SYNC SERVICE
 * 
 * This service runs independently (e.g., as a cron job, Vercel function, or separate server)
 * to sync data from the Highlightly API to Supabase with controlled rate limiting.
 * 
 * Run this service every 30 minutes to keep data fresh without overwhelming the API.
 */

import { createClient } from '@supabase/supabase-js';
import { highlightlyClient } from './src/integrations/highlightly/client';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for background jobs

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SyncConfig {
  maxApiCallsPerMinute: number;
  batchSize: number;
  delayBetweenBatches: number;
}

const SYNC_CONFIG: SyncConfig = {
  maxApiCallsPerMinute: 30, // Conservative limit
  batchSize: 5, // Process 5 items at a time
  delayBetweenBatches: 2000, // 2 seconds between batches
};

class FootballDataSyncService {
  private apiCallCount = 0;
  private lastResetTime = Date.now();

  /**
   * Rate limiting wrapper for API calls
   */
  private async rateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    // Reset counter every minute
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }

    // Wait if we've hit the rate limit
    if (this.apiCallCount >= SYNC_CONFIG.maxApiCallsPerMinute) {
      const waitTime = 60000 - (now - this.lastResetTime);
      console.log(`[Sync] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.apiCallCount = 0;
      this.lastResetTime = Date.now();
    }

    this.apiCallCount++;
    return apiCall();
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    tableName: string, 
    status: 'running' | 'completed' | 'failed',
    recordsSynced = 0,
    totalRecords = 0,
    errorMessage?: string
  ) {
    await supabase
      .from('sync_status')
      .upsert({
        table_name: tableName,
        status,
        records_synced: recordsSynced,
        total_records: totalRecords,
        error_message: errorMessage,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * 1. SYNC LEAGUES
   * Only needs to run occasionally as league data is mostly static
   */
  async syncLeagues(): Promise<void> {
    console.log('[Sync] Starting league sync...');
    
    try {
      await this.updateSyncStatus('leagues', 'running');

      // Get priority leagues from database
      const { data: priorityLeagues } = await supabase
        .from('leagues')
        .select('id')
        .eq('priority', true);

      if (!priorityLeagues?.length) {
        console.log('[Sync] No priority leagues found in database');
        return;
      }

      let syncedCount = 0;
      const total = priorityLeagues.length;

      // Sync leagues in batches
      for (let i = 0; i < priorityLeagues.length; i += SYNC_CONFIG.batchSize) {
        const batch = priorityLeagues.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (league) => {
          try {
            const apiData = await this.rateLimitedApiCall(() => 
              highlightlyClient.getLeagueById(league.id)
            );

            if (apiData?.data || apiData?.id) {
              const leagueInfo = apiData.data || apiData;
              
              await supabase
                .from('leagues')
                .upsert({
                  id: leagueInfo.id,
                  name: leagueInfo.name,
                  logo: leagueInfo.logo,
                  country_code: leagueInfo.country?.code,
                  country_name: leagueInfo.country?.name,
                  country_logo: leagueInfo.country?.logo,
                  api_data: leagueInfo,
                  updated_at: new Date().toISOString(),
                });

              syncedCount++;
              console.log(`[Sync] Updated league: ${leagueInfo.name}`);
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync league ${league.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < priorityLeagues.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('leagues', 'completed', syncedCount, total);
      console.log(`[Sync] League sync completed: ${syncedCount}/${total} updated`);

    } catch (error) {
      console.error('[Sync] League sync failed:', error);
      await this.updateSyncStatus('leagues', 'failed', 0, 0, error.message);
    }
  }

  /**
   * 2. SYNC RECENT MATCHES
   * This should run frequently (every 30 minutes) to keep match data current
   */
  async syncRecentMatches(): Promise<void> {
    console.log('[Sync] Starting recent matches sync...');
    
    try {
      await this.updateSyncStatus('matches', 'running');

      // Get date range (today ± 7 days)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get priority leagues
      const { data: priorityLeagues } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('priority', true);

      if (!priorityLeagues?.length) return;

      let totalSynced = 0;

      // Sync matches for each league
      for (let i = 0; i < priorityLeagues.length; i += SYNC_CONFIG.batchSize) {
        const batch = priorityLeagues.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (league) => {
          try {
            const matchesData = await this.rateLimitedApiCall(() =>
              highlightlyClient.getMatches({
                leagueId: league.id,
                date: `${startDateStr},${endDateStr}`,
                limit: '50',
              })
            );

            if (matchesData?.data) {
              const matches = Array.isArray(matchesData.data) ? matchesData.data : [matchesData.data];
              
              for (const match of matches) {
                // First, ensure teams exist
                await this.syncTeamsFromMatch(match);
                
                // Then sync the match
                await supabase
                  .from('matches')
                  .upsert({
                    id: match.id,
                    home_team_id: match.homeTeam?.id || match.teams?.home?.id,
                    away_team_id: match.awayTeam?.id || match.teams?.away?.id,
                    league_id: league.id,
                    match_date: match.date?.split('T')[0] || match.fixture?.date?.split('T')[0],
                    match_time: match.date?.split('T')[1]?.split('+')[0] || match.fixture?.date?.split('T')[1]?.split('+')[0],
                    status: this.normalizeMatchStatus(match.status || match.fixture?.status?.short),
                    home_score: match.score?.home || match.goals?.home || 0,
                    away_score: match.score?.away || match.goals?.away || 0,
                    venue: match.venue || match.fixture?.venue?.name,
                    round: match.round,
                    season: match.season || new Date().getFullYear().toString(),
                    api_data: match,
                    updated_at: new Date().toISOString(),
                  });

                totalSynced++;
              }

              console.log(`[Sync] Synced ${matches.length} matches for ${league.name}`);
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync matches for league ${league.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < priorityLeagues.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('matches', 'completed', totalSynced);
      console.log(`[Sync] Matches sync completed: ${totalSynced} matches updated`);

    } catch (error) {
      console.error('[Sync] Matches sync failed:', error);
      await this.updateSyncStatus('matches', 'failed', 0, 0, error.message);
    }
  }

  /**
   * 3. SYNC HIGHLIGHTS
   * Run this after match sync to get highlights for recent matches
   */
  async syncHighlights(): Promise<void> {
    console.log('[Sync] Starting highlights sync...');
    
    try {
      await this.updateSyncStatus('highlights', 'running');

      // Get recent finished matches that might have highlights
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, league_id')
        .eq('status', 'finished')
        .gte('match_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .limit(100);

      if (!recentMatches?.length) return;

      let syncedCount = 0;

      // Process matches in batches
      for (let i = 0; i < recentMatches.length; i += SYNC_CONFIG.batchSize) {
        const batch = recentMatches.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (match) => {
          try {
            const highlightsData = await this.rateLimitedApiCall(() =>
              highlightlyClient.getHighlights({
                matchId: match.id,
                limit: '10',
              })
            );

            if (highlightsData?.data) {
              const highlights = Array.isArray(highlightsData.data) ? highlightsData.data : [highlightsData.data];
              
              for (const highlight of highlights) {
                await supabase
                  .from('highlights')
                  .upsert({
                    id: highlight.id,
                    match_id: match.id,
                    title: highlight.title,
                    url: highlight.url,
                    thumbnail: highlight.thumbnail,
                    duration: highlight.duration,
                    embed_url: highlight.embed_url,
                    api_data: highlight,
                    updated_at: new Date().toISOString(),
                  });

                syncedCount++;
              }

              if (highlights.length > 0) {
                console.log(`[Sync] Synced ${highlights.length} highlights for match ${match.id}`);
              }
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync highlights for match ${match.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < recentMatches.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('highlights', 'completed', syncedCount);
      console.log(`[Sync] Highlights sync completed: ${syncedCount} highlights updated`);

    } catch (error) {
      console.error('[Sync] Highlights sync failed:', error);
      await this.updateSyncStatus('highlights', 'failed', 0, 0, error.message);
    }
  }

  /**
   * Helper: Sync teams from match data
   */
  private async syncTeamsFromMatch(match: any): Promise<void> {
    const homeTeam = match.homeTeam || match.teams?.home;
    const awayTeam = match.awayTeam || match.teams?.away;

    if (homeTeam) {
      await supabase
        .from('teams')
        .upsert({
          id: homeTeam.id,
          name: homeTeam.name,
          logo: homeTeam.logo,
          short_name: homeTeam.short_name,
          league_id: match.league?.id,
          api_data: homeTeam,
          updated_at: new Date().toISOString(),
        });
    }

    if (awayTeam) {
      await supabase
        .from('teams')
        .upsert({
          id: awayTeam.id,
          name: awayTeam.name,
          logo: awayTeam.logo,
          short_name: awayTeam.short_name,
          league_id: match.league?.id,
          api_data: awayTeam,
          updated_at: new Date().toISOString(),
        });
    }
  }

  /**
   * Helper: Normalize match status
   */
  private normalizeMatchStatus(status: string): string {
    if (!status) return 'scheduled';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('1h') || statusLower.includes('2h')) return 'live';
    if (statusLower.includes('finished') || statusLower.includes('ft') || statusLower.includes('aet')) return 'finished';
    if (statusLower.includes('postponed') || statusLower.includes('susp')) return 'postponed';
    if (statusLower.includes('cancelled') || statusLower.includes('canc')) return 'cancelled';
    
    return 'scheduled';
  }

  /**
   * MAIN SYNC FUNCTION
   * Run this on a schedule (e.g., every 30 minutes)
   */
  async runFullSync(): Promise<void> {
    console.log('[Sync] Starting full sync process...');
    const startTime = Date.now();

    try {
      // 1. Sync leagues (less frequent - only if needed)
      const { data: leagueStatus } = await supabase
        .from('sync_status')
        .select('last_sync')
        .eq('table_name', 'leagues')
        .single();

      const leagueLastSync = leagueStatus?.last_sync ? new Date(leagueStatus.last_sync) : new Date(0);
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

      if (leagueLastSync < fourHoursAgo) {
        await this.syncLeagues();
      } else {
        console.log('[Sync] Skipping league sync (recently updated)');
      }

      // 2. Sync recent matches (always run)
      await this.syncRecentMatches();

      // 3. Sync highlights (always run)
      await this.syncHighlights();

      const duration = Date.now() - startTime;
      console.log(`[Sync] Full sync completed in ${duration}ms`);

    } catch (error) {
      console.error('[Sync] Full sync failed:', error);
    }
  }
}

// USAGE EXAMPLES:

// 1. For Vercel Cron Job (api/sync-football-data.ts)
export async function syncFootballData() {
  const syncService = new FootballDataSyncService();
  await syncService.runFullSync();
}

// 2. For standalone Node.js script
async function main() {
  const syncService = new FootballDataSyncService();
  await syncService.runFullSync();
  process.exit(0);
}

// Uncomment to run as standalone script
// main();

export { FootballDataSyncService }; 
 * BACKGROUND SYNC SERVICE
 * 
 * This service runs independently (e.g., as a cron job, Vercel function, or separate server)
 * to sync data from the Highlightly API to Supabase with controlled rate limiting.
 * 
 * Run this service every 30 minutes to keep data fresh without overwhelming the API.
 */

import { createClient } from '@supabase/supabase-js';
import { highlightlyClient } from './src/integrations/highlightly/client';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for background jobs

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SyncConfig {
  maxApiCallsPerMinute: number;
  batchSize: number;
  delayBetweenBatches: number;
}

const SYNC_CONFIG: SyncConfig = {
  maxApiCallsPerMinute: 30, // Conservative limit
  batchSize: 5, // Process 5 items at a time
  delayBetweenBatches: 2000, // 2 seconds between batches
};

class FootballDataSyncService {
  private apiCallCount = 0;
  private lastResetTime = Date.now();

  /**
   * Rate limiting wrapper for API calls
   */
  private async rateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    // Reset counter every minute
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }

    // Wait if we've hit the rate limit
    if (this.apiCallCount >= SYNC_CONFIG.maxApiCallsPerMinute) {
      const waitTime = 60000 - (now - this.lastResetTime);
      console.log(`[Sync] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.apiCallCount = 0;
      this.lastResetTime = Date.now();
    }

    this.apiCallCount++;
    return apiCall();
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    tableName: string, 
    status: 'running' | 'completed' | 'failed',
    recordsSynced = 0,
    totalRecords = 0,
    errorMessage?: string
  ) {
    await supabase
      .from('sync_status')
      .upsert({
        table_name: tableName,
        status,
        records_synced: recordsSynced,
        total_records: totalRecords,
        error_message: errorMessage,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * 1. SYNC LEAGUES
   * Only needs to run occasionally as league data is mostly static
   */
  async syncLeagues(): Promise<void> {
    console.log('[Sync] Starting league sync...');
    
    try {
      await this.updateSyncStatus('leagues', 'running');

      // Get priority leagues from database
      const { data: priorityLeagues } = await supabase
        .from('leagues')
        .select('id')
        .eq('priority', true);

      if (!priorityLeagues?.length) {
        console.log('[Sync] No priority leagues found in database');
        return;
      }

      let syncedCount = 0;
      const total = priorityLeagues.length;

      // Sync leagues in batches
      for (let i = 0; i < priorityLeagues.length; i += SYNC_CONFIG.batchSize) {
        const batch = priorityLeagues.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (league) => {
          try {
            const apiData = await this.rateLimitedApiCall(() => 
              highlightlyClient.getLeagueById(league.id)
            );

            if (apiData?.data || apiData?.id) {
              const leagueInfo = apiData.data || apiData;
              
              await supabase
                .from('leagues')
                .upsert({
                  id: leagueInfo.id,
                  name: leagueInfo.name,
                  logo: leagueInfo.logo,
                  country_code: leagueInfo.country?.code,
                  country_name: leagueInfo.country?.name,
                  country_logo: leagueInfo.country?.logo,
                  api_data: leagueInfo,
                  updated_at: new Date().toISOString(),
                });

              syncedCount++;
              console.log(`[Sync] Updated league: ${leagueInfo.name}`);
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync league ${league.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < priorityLeagues.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('leagues', 'completed', syncedCount, total);
      console.log(`[Sync] League sync completed: ${syncedCount}/${total} updated`);

    } catch (error) {
      console.error('[Sync] League sync failed:', error);
      await this.updateSyncStatus('leagues', 'failed', 0, 0, error.message);
    }
  }

  /**
   * 2. SYNC RECENT MATCHES
   * This should run frequently (every 30 minutes) to keep match data current
   */
  async syncRecentMatches(): Promise<void> {
    console.log('[Sync] Starting recent matches sync...');
    
    try {
      await this.updateSyncStatus('matches', 'running');

      // Get date range (today ± 7 days)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get priority leagues
      const { data: priorityLeagues } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('priority', true);

      if (!priorityLeagues?.length) return;

      let totalSynced = 0;

      // Sync matches for each league
      for (let i = 0; i < priorityLeagues.length; i += SYNC_CONFIG.batchSize) {
        const batch = priorityLeagues.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (league) => {
          try {
            const matchesData = await this.rateLimitedApiCall(() =>
              highlightlyClient.getMatches({
                leagueId: league.id,
                date: `${startDateStr},${endDateStr}`,
                limit: '50',
              })
            );

            if (matchesData?.data) {
              const matches = Array.isArray(matchesData.data) ? matchesData.data : [matchesData.data];
              
              for (const match of matches) {
                // First, ensure teams exist
                await this.syncTeamsFromMatch(match);
                
                // Then sync the match
                await supabase
                  .from('matches')
                  .upsert({
                    id: match.id,
                    home_team_id: match.homeTeam?.id || match.teams?.home?.id,
                    away_team_id: match.awayTeam?.id || match.teams?.away?.id,
                    league_id: league.id,
                    match_date: match.date?.split('T')[0] || match.fixture?.date?.split('T')[0],
                    match_time: match.date?.split('T')[1]?.split('+')[0] || match.fixture?.date?.split('T')[1]?.split('+')[0],
                    status: this.normalizeMatchStatus(match.status || match.fixture?.status?.short),
                    home_score: match.score?.home || match.goals?.home || 0,
                    away_score: match.score?.away || match.goals?.away || 0,
                    venue: match.venue || match.fixture?.venue?.name,
                    round: match.round,
                    season: match.season || new Date().getFullYear().toString(),
                    api_data: match,
                    updated_at: new Date().toISOString(),
                  });

                totalSynced++;
              }

              console.log(`[Sync] Synced ${matches.length} matches for ${league.name}`);
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync matches for league ${league.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < priorityLeagues.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('matches', 'completed', totalSynced);
      console.log(`[Sync] Matches sync completed: ${totalSynced} matches updated`);

    } catch (error) {
      console.error('[Sync] Matches sync failed:', error);
      await this.updateSyncStatus('matches', 'failed', 0, 0, error.message);
    }
  }

  /**
   * 3. SYNC HIGHLIGHTS
   * Run this after match sync to get highlights for recent matches
   */
  async syncHighlights(): Promise<void> {
    console.log('[Sync] Starting highlights sync...');
    
    try {
      await this.updateSyncStatus('highlights', 'running');

      // Get recent finished matches that might have highlights
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, league_id')
        .eq('status', 'finished')
        .gte('match_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .limit(100);

      if (!recentMatches?.length) return;

      let syncedCount = 0;

      // Process matches in batches
      for (let i = 0; i < recentMatches.length; i += SYNC_CONFIG.batchSize) {
        const batch = recentMatches.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (match) => {
          try {
            const highlightsData = await this.rateLimitedApiCall(() =>
              highlightlyClient.getHighlights({
                matchId: match.id,
                limit: '10',
              })
            );

            if (highlightsData?.data) {
              const highlights = Array.isArray(highlightsData.data) ? highlightsData.data : [highlightsData.data];
              
              for (const highlight of highlights) {
                await supabase
                  .from('highlights')
                  .upsert({
                    id: highlight.id,
                    match_id: match.id,
                    title: highlight.title,
                    url: highlight.url,
                    thumbnail: highlight.thumbnail,
                    duration: highlight.duration,
                    embed_url: highlight.embed_url,
                    api_data: highlight,
                    updated_at: new Date().toISOString(),
                  });

                syncedCount++;
              }

              if (highlights.length > 0) {
                console.log(`[Sync] Synced ${highlights.length} highlights for match ${match.id}`);
              }
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync highlights for match ${match.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < recentMatches.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('highlights', 'completed', syncedCount);
      console.log(`[Sync] Highlights sync completed: ${syncedCount} highlights updated`);

    } catch (error) {
      console.error('[Sync] Highlights sync failed:', error);
      await this.updateSyncStatus('highlights', 'failed', 0, 0, error.message);
    }
  }

  /**
   * Helper: Sync teams from match data
   */
  private async syncTeamsFromMatch(match: any): Promise<void> {
    const homeTeam = match.homeTeam || match.teams?.home;
    const awayTeam = match.awayTeam || match.teams?.away;

    if (homeTeam) {
      await supabase
        .from('teams')
        .upsert({
          id: homeTeam.id,
          name: homeTeam.name,
          logo: homeTeam.logo,
          short_name: homeTeam.short_name,
          league_id: match.league?.id,
          api_data: homeTeam,
          updated_at: new Date().toISOString(),
        });
    }

    if (awayTeam) {
      await supabase
        .from('teams')
        .upsert({
          id: awayTeam.id,
          name: awayTeam.name,
          logo: awayTeam.logo,
          short_name: awayTeam.short_name,
          league_id: match.league?.id,
          api_data: awayTeam,
          updated_at: new Date().toISOString(),
        });
    }
  }

  /**
   * Helper: Normalize match status
   */
  private normalizeMatchStatus(status: string): string {
    if (!status) return 'scheduled';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('1h') || statusLower.includes('2h')) return 'live';
    if (statusLower.includes('finished') || statusLower.includes('ft') || statusLower.includes('aet')) return 'finished';
    if (statusLower.includes('postponed') || statusLower.includes('susp')) return 'postponed';
    if (statusLower.includes('cancelled') || statusLower.includes('canc')) return 'cancelled';
    
    return 'scheduled';
  }

  /**
   * MAIN SYNC FUNCTION
   * Run this on a schedule (e.g., every 30 minutes)
   */
  async runFullSync(): Promise<void> {
    console.log('[Sync] Starting full sync process...');
    const startTime = Date.now();

    try {
      // 1. Sync leagues (less frequent - only if needed)
      const { data: leagueStatus } = await supabase
        .from('sync_status')
        .select('last_sync')
        .eq('table_name', 'leagues')
        .single();

      const leagueLastSync = leagueStatus?.last_sync ? new Date(leagueStatus.last_sync) : new Date(0);
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

      if (leagueLastSync < fourHoursAgo) {
        await this.syncLeagues();
      } else {
        console.log('[Sync] Skipping league sync (recently updated)');
      }

      // 2. Sync recent matches (always run)
      await this.syncRecentMatches();

      // 3. Sync highlights (always run)
      await this.syncHighlights();

      const duration = Date.now() - startTime;
      console.log(`[Sync] Full sync completed in ${duration}ms`);

    } catch (error) {
      console.error('[Sync] Full sync failed:', error);
    }
  }
}

// USAGE EXAMPLES:

// 1. For Vercel Cron Job (api/sync-football-data.ts)
export async function syncFootballData() {
  const syncService = new FootballDataSyncService();
  await syncService.runFullSync();
}

// 2. For standalone Node.js script
async function main() {
  const syncService = new FootballDataSyncService();
  await syncService.runFullSync();
  process.exit(0);
}

// Uncomment to run as standalone script
// main();

export { FootballDataSyncService }; 
 * BACKGROUND SYNC SERVICE
 * 
 * This service runs independently (e.g., as a cron job, Vercel function, or separate server)
 * to sync data from the Highlightly API to Supabase with controlled rate limiting.
 * 
 * Run this service every 30 minutes to keep data fresh without overwhelming the API.
 */

import { createClient } from '@supabase/supabase-js';
import { highlightlyClient } from './src/integrations/highlightly/client';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for background jobs

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SyncConfig {
  maxApiCallsPerMinute: number;
  batchSize: number;
  delayBetweenBatches: number;
}

const SYNC_CONFIG: SyncConfig = {
  maxApiCallsPerMinute: 30, // Conservative limit
  batchSize: 5, // Process 5 items at a time
  delayBetweenBatches: 2000, // 2 seconds between batches
};

class FootballDataSyncService {
  private apiCallCount = 0;
  private lastResetTime = Date.now();

  /**
   * Rate limiting wrapper for API calls
   */
  private async rateLimitedApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    // Reset counter every minute
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }

    // Wait if we've hit the rate limit
    if (this.apiCallCount >= SYNC_CONFIG.maxApiCallsPerMinute) {
      const waitTime = 60000 - (now - this.lastResetTime);
      console.log(`[Sync] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.apiCallCount = 0;
      this.lastResetTime = Date.now();
    }

    this.apiCallCount++;
    return apiCall();
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    tableName: string, 
    status: 'running' | 'completed' | 'failed',
    recordsSynced = 0,
    totalRecords = 0,
    errorMessage?: string
  ) {
    await supabase
      .from('sync_status')
      .upsert({
        table_name: tableName,
        status,
        records_synced: recordsSynced,
        total_records: totalRecords,
        error_message: errorMessage,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * 1. SYNC LEAGUES
   * Only needs to run occasionally as league data is mostly static
   */
  async syncLeagues(): Promise<void> {
    console.log('[Sync] Starting league sync...');
    
    try {
      await this.updateSyncStatus('leagues', 'running');

      // Get priority leagues from database
      const { data: priorityLeagues } = await supabase
        .from('leagues')
        .select('id')
        .eq('priority', true);

      if (!priorityLeagues?.length) {
        console.log('[Sync] No priority leagues found in database');
        return;
      }

      let syncedCount = 0;
      const total = priorityLeagues.length;

      // Sync leagues in batches
      for (let i = 0; i < priorityLeagues.length; i += SYNC_CONFIG.batchSize) {
        const batch = priorityLeagues.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (league) => {
          try {
            const apiData = await this.rateLimitedApiCall(() => 
              highlightlyClient.getLeagueById(league.id)
            );

            if (apiData?.data || apiData?.id) {
              const leagueInfo = apiData.data || apiData;
              
              await supabase
                .from('leagues')
                .upsert({
                  id: leagueInfo.id,
                  name: leagueInfo.name,
                  logo: leagueInfo.logo,
                  country_code: leagueInfo.country?.code,
                  country_name: leagueInfo.country?.name,
                  country_logo: leagueInfo.country?.logo,
                  api_data: leagueInfo,
                  updated_at: new Date().toISOString(),
                });

              syncedCount++;
              console.log(`[Sync] Updated league: ${leagueInfo.name}`);
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync league ${league.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < priorityLeagues.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('leagues', 'completed', syncedCount, total);
      console.log(`[Sync] League sync completed: ${syncedCount}/${total} updated`);

    } catch (error) {
      console.error('[Sync] League sync failed:', error);
      await this.updateSyncStatus('leagues', 'failed', 0, 0, error.message);
    }
  }

  /**
   * 2. SYNC RECENT MATCHES
   * This should run frequently (every 30 minutes) to keep match data current
   */
  async syncRecentMatches(): Promise<void> {
    console.log('[Sync] Starting recent matches sync...');
    
    try {
      await this.updateSyncStatus('matches', 'running');

      // Get date range (today ± 7 days)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get priority leagues
      const { data: priorityLeagues } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('priority', true);

      if (!priorityLeagues?.length) return;

      let totalSynced = 0;

      // Sync matches for each league
      for (let i = 0; i < priorityLeagues.length; i += SYNC_CONFIG.batchSize) {
        const batch = priorityLeagues.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (league) => {
          try {
            const matchesData = await this.rateLimitedApiCall(() =>
              highlightlyClient.getMatches({
                leagueId: league.id,
                date: `${startDateStr},${endDateStr}`,
                limit: '50',
              })
            );

            if (matchesData?.data) {
              const matches = Array.isArray(matchesData.data) ? matchesData.data : [matchesData.data];
              
              for (const match of matches) {
                // First, ensure teams exist
                await this.syncTeamsFromMatch(match);
                
                // Then sync the match
                await supabase
                  .from('matches')
                  .upsert({
                    id: match.id,
                    home_team_id: match.homeTeam?.id || match.teams?.home?.id,
                    away_team_id: match.awayTeam?.id || match.teams?.away?.id,
                    league_id: league.id,
                    match_date: match.date?.split('T')[0] || match.fixture?.date?.split('T')[0],
                    match_time: match.date?.split('T')[1]?.split('+')[0] || match.fixture?.date?.split('T')[1]?.split('+')[0],
                    status: this.normalizeMatchStatus(match.status || match.fixture?.status?.short),
                    home_score: match.score?.home || match.goals?.home || 0,
                    away_score: match.score?.away || match.goals?.away || 0,
                    venue: match.venue || match.fixture?.venue?.name,
                    round: match.round,
                    season: match.season || new Date().getFullYear().toString(),
                    api_data: match,
                    updated_at: new Date().toISOString(),
                  });

                totalSynced++;
              }

              console.log(`[Sync] Synced ${matches.length} matches for ${league.name}`);
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync matches for league ${league.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < priorityLeagues.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('matches', 'completed', totalSynced);
      console.log(`[Sync] Matches sync completed: ${totalSynced} matches updated`);

    } catch (error) {
      console.error('[Sync] Matches sync failed:', error);
      await this.updateSyncStatus('matches', 'failed', 0, 0, error.message);
    }
  }

  /**
   * 3. SYNC HIGHLIGHTS
   * Run this after match sync to get highlights for recent matches
   */
  async syncHighlights(): Promise<void> {
    console.log('[Sync] Starting highlights sync...');
    
    try {
      await this.updateSyncStatus('highlights', 'running');

      // Get recent finished matches that might have highlights
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, league_id')
        .eq('status', 'finished')
        .gte('match_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .limit(100);

      if (!recentMatches?.length) return;

      let syncedCount = 0;

      // Process matches in batches
      for (let i = 0; i < recentMatches.length; i += SYNC_CONFIG.batchSize) {
        const batch = recentMatches.slice(i, i + SYNC_CONFIG.batchSize);
        
        const batchPromises = batch.map(async (match) => {
          try {
            const highlightsData = await this.rateLimitedApiCall(() =>
              highlightlyClient.getHighlights({
                matchId: match.id,
                limit: '10',
              })
            );

            if (highlightsData?.data) {
              const highlights = Array.isArray(highlightsData.data) ? highlightsData.data : [highlightsData.data];
              
              for (const highlight of highlights) {
                await supabase
                  .from('highlights')
                  .upsert({
                    id: highlight.id,
                    match_id: match.id,
                    title: highlight.title,
                    url: highlight.url,
                    thumbnail: highlight.thumbnail,
                    duration: highlight.duration,
                    embed_url: highlight.embed_url,
                    api_data: highlight,
                    updated_at: new Date().toISOString(),
                  });

                syncedCount++;
              }

              if (highlights.length > 0) {
                console.log(`[Sync] Synced ${highlights.length} highlights for match ${match.id}`);
              }
            }
          } catch (error) {
            console.error(`[Sync] Failed to sync highlights for match ${match.id}:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (i + SYNC_CONFIG.batchSize < recentMatches.length) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayBetweenBatches));
        }
      }

      await this.updateSyncStatus('highlights', 'completed', syncedCount);
      console.log(`[Sync] Highlights sync completed: ${syncedCount} highlights updated`);

    } catch (error) {
      console.error('[Sync] Highlights sync failed:', error);
      await this.updateSyncStatus('highlights', 'failed', 0, 0, error.message);
    }
  }

  /**
   * Helper: Sync teams from match data
   */
  private async syncTeamsFromMatch(match: any): Promise<void> {
    const homeTeam = match.homeTeam || match.teams?.home;
    const awayTeam = match.awayTeam || match.teams?.away;

    if (homeTeam) {
      await supabase
        .from('teams')
        .upsert({
          id: homeTeam.id,
          name: homeTeam.name,
          logo: homeTeam.logo,
          short_name: homeTeam.short_name,
          league_id: match.league?.id,
          api_data: homeTeam,
          updated_at: new Date().toISOString(),
        });
    }

    if (awayTeam) {
      await supabase
        .from('teams')
        .upsert({
          id: awayTeam.id,
          name: awayTeam.name,
          logo: awayTeam.logo,
          short_name: awayTeam.short_name,
          league_id: match.league?.id,
          api_data: awayTeam,
          updated_at: new Date().toISOString(),
        });
    }
  }

  /**
   * Helper: Normalize match status
   */
  private normalizeMatchStatus(status: string): string {
    if (!status) return 'scheduled';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('1h') || statusLower.includes('2h')) return 'live';
    if (statusLower.includes('finished') || statusLower.includes('ft') || statusLower.includes('aet')) return 'finished';
    if (statusLower.includes('postponed') || statusLower.includes('susp')) return 'postponed';
    if (statusLower.includes('cancelled') || statusLower.includes('canc')) return 'cancelled';
    
    return 'scheduled';
  }

  /**
   * MAIN SYNC FUNCTION
   * Run this on a schedule (e.g., every 30 minutes)
   */
  async runFullSync(): Promise<void> {
    console.log('[Sync] Starting full sync process...');
    const startTime = Date.now();

    try {
      // 1. Sync leagues (less frequent - only if needed)
      const { data: leagueStatus } = await supabase
        .from('sync_status')
        .select('last_sync')
        .eq('table_name', 'leagues')
        .single();

      const leagueLastSync = leagueStatus?.last_sync ? new Date(leagueStatus.last_sync) : new Date(0);
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

      if (leagueLastSync < fourHoursAgo) {
        await this.syncLeagues();
      } else {
        console.log('[Sync] Skipping league sync (recently updated)');
      }

      // 2. Sync recent matches (always run)
      await this.syncRecentMatches();

      // 3. Sync highlights (always run)
      await this.syncHighlights();

      const duration = Date.now() - startTime;
      console.log(`[Sync] Full sync completed in ${duration}ms`);

    } catch (error) {
      console.error('[Sync] Full sync failed:', error);
    }
  }
}

// USAGE EXAMPLES:

// 1. For Vercel Cron Job (api/sync-football-data.ts)
export async function syncFootballData() {
  const syncService = new FootballDataSyncService();
  await syncService.runFullSync();
}

// 2. For standalone Node.js script
async function main() {
  const syncService = new FootballDataSyncService();
  await syncService.runFullSync();
  process.exit(0);
}

// Uncomment to run as standalone script
// main();

export { FootballDataSyncService }; 