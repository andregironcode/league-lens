import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import DatabaseMatchServiceNew from './databaseMatchServiceNew.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class EnhancedMatchScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.matchService = new DatabaseMatchServiceNew();
    this.completedMatches = new Set(); // Track matches that have all data
    
    this.status = {
      dailySync: { lastRun: null, status: 'idle', errors: 0 },
      lineupSync: { lastRun: null, status: 'idle', errors: 0 },
      liveSync: { lastRun: null, status: 'idle', errors: 0 },
      highlightSync: { lastRun: null, status: 'idle', errors: 0 }
    };
  }

  start() {
    if (this.isRunning) {
      console.log('[EnhancedMatchScheduler] Already running');
      return;
    }

    console.log('[EnhancedMatchScheduler] Starting enhanced match scheduler...');
    this.isRunning = true;

    // 1. Daily scan for new upcoming matches (at 00:00 and 12:00)
    this.jobs.set('dailySync', cron.schedule('0 0,12 * * *', () => {
      this.dailyScanForMatches();
    }, { scheduled: true, timezone: "Europe/Paris" }));

    // 2. Every 5 minutes: Check for matches starting in ~55 minutes for lineup data
    this.jobs.set('lineupSync', cron.schedule('*/5 * * * *', () => {
      this.scanForPreMatchLineups();
    }, { scheduled: true, timezone: "Europe/Paris" }));

    // 3. Every minute: Real-time updates for live matches
    this.jobs.set('liveSync', cron.schedule('* * * * *', () => {
      this.updateLiveMatches();
    }, { scheduled: true, timezone: "Europe/Paris" }));

    // 4. Every 10 minutes: Scan for highlights after matches finish
    this.jobs.set('highlightSync', cron.schedule('*/10 * * * *', () => {
      this.scanForPostMatchHighlights();
    }, { scheduled: true, timezone: "Europe/Paris" }));

    // Initial sync on startup
    setTimeout(() => {
      this.dailyScanForMatches();
    }, 1000);

    console.log('[EnhancedMatchScheduler] All cron jobs scheduled');
  }

  stop() {
    if (!this.isRunning) return;

    console.log('[EnhancedMatchScheduler] Stopping enhanced match scheduler...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`[EnhancedMatchScheduler] Stopped ${name} job`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
  }

  async dailyScanForMatches() {
    this.status.dailySync.status = 'running';
    this.status.dailySync.lastRun = new Date();

    try {
      console.log('[EnhancedMatchScheduler] Starting daily scan from database...');
      
      // Get matches from database via new service
      const matchData = await this.matchService.getTopLeaguesMatches();
      
      console.log(`[EnhancedMatchScheduler] Daily sync complete: ${matchData.matches.length} matches retrieved from database`);
      console.log(`[EnhancedMatchScheduler] Active leagues: ${matchData.leagues.map(l => l.name).join(', ')}`);
      
      this.status.dailySync.status = 'success';
      this.status.dailySync.errors = 0;
      
      // Update cache for frontend
      await this.updateFrontendCache();
      
    } catch (error) {
      console.error('[EnhancedMatchScheduler] Daily sync failed:', error.message);
      this.status.dailySync.status = 'error';
      this.status.dailySync.errors++;
    }
  }

  async scanForPreMatchLineups() {
    this.status.lineupSync.status = 'running';
    this.status.lineupSync.lastRun = new Date();

    try {
      await this.matchService.scanPreMatchLineups();
      
      this.status.lineupSync.status = 'success';
      this.status.lineupSync.errors = 0;
      
    } catch (error) {
      console.error('[EnhancedMatchScheduler] Lineup sync failed:', error.message);
      this.status.lineupSync.status = 'error';
      this.status.lineupSync.errors++;
    }
  }

  async updateLiveMatches() {
    this.status.liveSync.status = 'running';
    this.status.liveSync.lastRun = new Date();

    try {
      await this.matchService.updateLiveMatches();
      
      this.status.liveSync.status = 'success';
      this.status.liveSync.errors = 0;
      
      // Update frontend cache with live data
      await this.updateFrontendCache();
      
    } catch (error) {
      console.error('[EnhancedMatchScheduler] Live sync failed:', error.message);
      this.status.liveSync.status = 'error';
      this.status.liveSync.errors++;
    }
  }

  async scanForPostMatchHighlights() {
    this.status.highlightSync.status = 'running';
    this.status.highlightSync.lastRun = new Date();

    try {
      await this.matchService.scanForHighlights();
      
      // Check which matches now have complete data
      await this.checkCompletedMatches();
      
      this.status.highlightSync.status = 'success';
      this.status.highlightSync.errors = 0;
      
    } catch (error) {
      console.error('[EnhancedMatchScheduler] Highlight sync failed:', error.message);
      this.status.highlightSync.status = 'error';
      this.status.highlightSync.errors++;
    }
  }

  async checkCompletedMatches() {
    // Find matches that have all data and mark them as complete
    const { data: matches } = await supabase
      .from('matches')
      .select('id, has_highlights, has_lineups, has_events, status')
      .in('status', ['Finished', 'FT', 'Full Time'])
      .eq('has_highlights', true)
      .eq('has_lineups', true)
      .eq('has_events', true);
    
    if (matches) {
      for (const match of matches) {
        if (!this.completedMatches.has(match.id)) {
          this.completedMatches.add(match.id);
          console.log(`[EnhancedMatchScheduler] Match ${match.id} is now complete with all data`);
        }
      }
    }
  }

  async updateFrontendCache() {
    try {
      // Update the main feed cache
      const feedData = await this.matchService.getTopLeaguesMatches();
      
      // Update the "For You" section cache
      const forYouData = await this.matchService.getForYouMatches();
      
      console.log('[EnhancedMatchScheduler] Frontend cache updated');
      
    } catch (error) {
      console.error('[EnhancedMatchScheduler] Error updating frontend cache:', error.message);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      status: this.status,
      completedMatches: this.completedMatches.size
    };
  }
}

export default EnhancedMatchScheduler;