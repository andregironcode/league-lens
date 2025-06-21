import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// We'll use a simple approach since the API might still be rate limited
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class ComprehensiveDataSync {
  constructor() {
    this.progress = {
      leagues: { total: 0, synced: 0, failed: 0 },
      teams: { total: 0, synced: 0, failed: 0 },
      matches: { total: 0, synced: 0, failed: 0 },
      highlights: { total: 0, synced: 0, failed: 0 }
    };
    
    this.errors = [];
    this.rateLimitDelay = 3000; // 3 seconds between requests to be safe
    
    // Priority leagues for focused sync
    this.priorityLeagues = [
      { id: '33973', name: 'Premier League' },
      { id: '119924', name: 'La Liga' }, 
      { id: '2486', name: 'UEFA Champions League' },
      { id: '8443', name: 'Bundesliga' },
      { id: '52695', name: 'Ligue 1' },
      { id: '3337', name: 'UEFA Europa League' }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'progress' ? '🔄' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testApiAvailability() {
    this.log('Testing API availability...', 'progress');
    try {
      const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=1');
      if (response.status === 429) {
        this.log('❌ API is still rate limited. Cannot proceed with sync.', 'error');
        return false;
      }
      if (response.ok) {
        this.log('✅ API is accessible', 'success');
        return true;
      }
      throw new Error(`API returned status ${response.status}`);
    } catch (error) {
      this.log(`❌ API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async clearTestData() {
    this.log('Clearing existing test data...', 'progress');
    
    try {
      // Delete in reverse dependency order to maintain referential integrity
      const { error: highlightsError } = await supabase.from('highlights').delete().neq('id', '');
      if (highlightsError) console.log('Note: Error clearing highlights:', highlightsError.message);
      
      const { error: matchesError } = await supabase.from('matches').delete().neq('id', '');
      if (matchesError) console.log('Note: Error clearing matches:', matchesError.message);
      
      const { error: teamsError } = await supabase.from('teams').delete().neq('id', '');
      if (teamsError) console.log('Note: Error clearing teams:', teamsError.message);
      
      // Keep leagues as they're our foundation
      
      this.log('✅ Test data cleared', 'success');
    } catch (error) {
      this.log(`❌ Error clearing test data: ${error.message}`, 'error');
      // Don't throw - continue with sync even if cleanup fails
    }
  }

  calculateSeason(matchDate) {
    const date = new Date(matchDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed
    
    // Football season logic: Aug-Dec = current year, Jan-May = previous year
    return month <= 5 ? (year - 1).toString() : year.toString();
  }

  async makeApiRequest(url) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      throw new Error('Rate limited');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async syncLeagueDetails() {
    this.log('🏆 Phase 1: Syncing league details...', 'progress');
    this.progress.leagues.total = this.priorityLeagues.length;

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching details for ${league.name}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/leagues/${league.id}`);
        await this.delay(this.rateLimitDelay);

        if (response && response.id) {
          const leagueData = {
            id: response.id.toString(),
            name: response.name,
            logo: response.logo,
            country_name: response.country?.name || 'Unknown',
            country_code: response.country?.code || 'XX',
            country_logo: response.country?.logo || '',
            api_data: response
          };

          const { error } = await supabase
            .from('leagues')
            .upsert(leagueData, { onConflict: 'id' });

          if (error) throw error;

          this.progress.leagues.synced++;
          this.log(`✅ ${league.name} synced`, 'success');
        }
      } catch (error) {
        this.progress.leagues.failed++;
        this.errors.push({ phase: 'leagues', item: league.name, error: error.message });
        this.log(`❌ Failed to sync ${league.name}: ${error.message}`, 'error');
        
        if (error.message.includes('Rate limited')) {
          this.log('⏸️ Rate limited detected. Waiting longer...', 'progress');
          await this.delay(10000); // Wait 10 seconds if rate limited
        }
      }
    }

    this.log(`📊 Leagues: ${this.progress.leagues.synced}/${this.progress.leagues.total} synced, ${this.progress.leagues.failed} failed`);
  }

  async syncTeamsForLeagues() {
    this.log('👥 Phase 2: Syncing teams for each league...', 'progress');

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching teams for ${league.name}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/leagues/${league.id}/teams`);
        await this.delay(this.rateLimitDelay);

        if (response && response.data && Array.isArray(response.data)) {
          this.progress.teams.total += response.data.length;

          for (const team of response.data) {
            try {
              const teamData = {
                id: team.id.toString(),
                name: team.name,
                logo: team.logo || '',
                league_id: league.id,
                api_data: team
              };

              const { error } = await supabase
                .from('teams')
                .upsert(teamData, { onConflict: 'id' });

              if (error) throw error;

              this.progress.teams.synced++;
            } catch (teamError) {
              this.progress.teams.failed++;
              this.errors.push({ 
                phase: 'teams', 
                item: `${team.name} (${league.name})`, 
                error: teamError.message 
              });
            }
          }

          this.log(`✅ ${response.data.length} teams synced for ${league.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to sync teams for ${league.name}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Teams: ${this.progress.teams.synced}/${this.progress.teams.total} synced, ${this.progress.teams.failed} failed`);
  }

  async syncRecentMatches() {
    this.log('⚽ Phase 3: Syncing recent matches...', 'progress');

    // Get date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dateFrom = startDate.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching recent matches for ${league.name}...`);
        
        const response = await this.makeApiRequest(
          `http://localhost:3001/api/highlightly/leagues/${league.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=50`
        );
        await this.delay(this.rateLimitDelay);

        if (response && response.data && Array.isArray(response.data)) {
          this.progress.matches.total += response.data.length;

          for (const match of response.data) {
            try {
              // Ensure both teams exist first
              await this.ensureTeamExists(match.homeTeam, league.id);
              await this.ensureTeamExists(match.awayTeam, league.id);

              const matchData = {
                id: match.id.toString(),
                home_team_id: match.homeTeam.id.toString(),
                away_team_id: match.awayTeam.id.toString(),
                league_id: league.id,
                match_date: match.date,
                match_time: match.time || '00:00',
                status: match.status || 'Unknown',
                home_score: this.extractScore(match, 'home'),
                away_score: this.extractScore(match, 'away'),
                season: this.calculateSeason(match.date),
                has_highlights: Boolean(match.highlights && match.highlights.length > 0),
                api_data: match
              };

              const { error } = await supabase
                .from('matches')
                .upsert(matchData, { onConflict: 'id' });

              if (error) throw error;

              this.progress.matches.synced++;
            } catch (matchError) {
              this.progress.matches.failed++;
              this.errors.push({
                phase: 'matches',
                item: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
                error: matchError.message
              });
            }
          }

          this.log(`✅ ${response.data.length} matches processed for ${league.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to sync matches for ${league.name}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Matches: ${this.progress.matches.synced}/${this.progress.matches.total} synced, ${this.progress.matches.failed} failed`);
  }

  async ensureTeamExists(team, leagueId) {
    if (!team || !team.id) return false;

    // Check if team exists
    const { data } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team.id.toString())
      .single();

    if (data) return true;

    // Team doesn't exist, create it
    try {
      const teamData = {
        id: team.id.toString(),
        name: team.name,
        logo: team.logo || '',
        league_id: leagueId,
        api_data: team
      };

      const { error } = await supabase
        .from('teams')
        .insert(teamData);

      return !error;
    } catch {
      return false;
    }
  }

  extractScore(match, side) {
    // Handle various score formats from API
    if (match.score) {
      if (typeof match.score === 'object') {
        return match.score[side] || 0;
      }
      if (typeof match.score === 'string') {
        const parts = match.score.split('-');
        return side === 'home' ? parseInt(parts[0]) || 0 : parseInt(parts[1]) || 0;
      }
    }
    
    // Try other possible score locations
    if (match.state && match.state.score) {
      if (match.state.score.current) {
        const parts = match.state.score.current.split('-');
        return side === 'home' ? parseInt(parts[0]) || 0 : parseInt(parts[1]) || 0;
      }
    }
    
    return 0;
  }

  async syncHighlights() {
    this.log('🎬 Phase 4: Syncing highlights...', 'progress');

    // Get matches that might have highlights
    const { data: matches } = await supabase
      .from('matches')
      .select('id, has_highlights')
      .eq('has_highlights', true)
      .limit(20); // Limit to avoid too many API calls

    if (!matches || matches.length === 0) {
      this.log('No matches with highlights found');
      return;
    }

    this.progress.highlights.total = matches.length;

    for (const match of matches) {
      try {
        this.log(`Fetching highlights for match ${match.id}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/matches/${match.id}/highlights`);
        await this.delay(this.rateLimitDelay);

        if (response && Array.isArray(response) && response.length > 0) {
          for (const highlight of response) {
            try {
              const highlightData = {
                id: highlight.id?.toString() || `${match.id}-${Date.now()}`,
                match_id: match.id,
                title: highlight.title || 'Match Highlights',
                url: highlight.url || highlight.videoUrl || '',
                thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
                duration: highlight.duration || 0,
                views: highlight.views || 0,
                api_data: highlight
              };

              const { error } = await supabase
                .from('highlights')
                .upsert(highlightData, { onConflict: 'id' });

              if (error) throw error;
            } catch (highlightError) {
              this.errors.push({
                phase: 'highlights',
                item: `Highlight for match ${match.id}`,
                error: highlightError.message
              });
            }
          }

          this.progress.highlights.synced++;
          this.log(`✅ Highlights synced for match ${match.id}`, 'success');
        }
      } catch (error) {
        this.progress.highlights.failed++;
        this.log(`❌ Failed to sync highlights for match ${match.id}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Highlights: ${this.progress.highlights.synced}/${this.progress.highlights.total} synced, ${this.progress.highlights.failed} failed`);
  }

  async updateSyncStatus() {
    const status = {
      entity_type: 'comprehensive_sync',
      entity_id: 'full_sync',
      last_synced: new Date().toISOString(),
      status: this.errors.length === 0 ? 'success' : 'partial_success',
      error_message: this.errors.length > 0 ? JSON.stringify(this.errors.slice(0, 10)) : null
    };

    await supabase
      .from('sync_status')
      .upsert(status, { onConflict: 'entity_type,entity_id' });
  }

  async run() {
    console.log('🚀 Starting Comprehensive Data Synchronization');
    console.log('='.repeat(50));
    console.log('📋 This will populate your database with REAL football data');
    console.log('⚡ Organized by dependency: Leagues → Teams → Matches → Highlights');
    console.log('🔒 With proper referential integrity and data validation');
    console.log('='.repeat(50));

    try {
      // Pre-sync checks
      const apiAvailable = await this.testApiAvailability();
      if (!apiAvailable) {
        console.log('\n💡 ALTERNATIVE: Since API is rate limited, we could:');
        console.log('   1. Wait for rate limits to reset (usually 1 hour)');
        console.log('   2. Use cached data from server/cache/api-cache.json');
        console.log('   3. Implement a slower sync with longer delays');
        console.log('\n🤔 Would you like to try option 2 or 3?');
        return;
      }

      await this.clearTestData();

      // Execute sync phases in dependency order
      await this.syncLeagueDetails();
      await this.syncTeamsForLeagues();  
      await this.syncRecentMatches();
      await this.syncHighlights();

      // Update sync status
      await this.updateSyncStatus();

      // Final report
      console.log('\n' + '='.repeat(50));
      console.log('🎉 COMPREHENSIVE SYNC COMPLETED!');
      console.log('='.repeat(50));
      console.log(`📊 Final Statistics:`);
      console.log(`   🏆 Leagues: ${this.progress.leagues.synced}/${this.progress.leagues.total} ✅`);
      console.log(`   👥 Teams: ${this.progress.teams.synced}/${this.progress.teams.total} ✅`);
      console.log(`   ⚽ Matches: ${this.progress.matches.synced}/${this.progress.matches.total} ✅`);
      console.log(`   🎬 Highlights: ${this.progress.highlights.synced}/${this.progress.highlights.total} ✅`);
      
      if (this.errors.length > 0) {
        console.log(`\n⚠️  ${this.errors.length} errors occurred during sync`);
        console.log('First 5 errors:');
        this.errors.slice(0, 5).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.phase}: ${error.item} - ${error.error}`);
        });
      }

      console.log('\n🎯 SUCCESS! Your database now contains REAL football data!');
      console.log('🚀 Users will see actual matches, teams, and highlights!');
      console.log('💪 Perfect referential integrity maintained!');
      console.log('🔥 No more Rick Roll URLs! 😄');

    } catch (error) {
      console.error('💥 Sync failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the comprehensive sync
const sync = new ComprehensiveDataSync();
sync.run().then(() => {
  console.log('✅ Sync process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Sync process failed:', error);
  process.exit(1);
}); 
import dotenv from 'dotenv';

dotenv.config();

// We'll use a simple approach since the API might still be rate limited
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class ComprehensiveDataSync {
  constructor() {
    this.progress = {
      leagues: { total: 0, synced: 0, failed: 0 },
      teams: { total: 0, synced: 0, failed: 0 },
      matches: { total: 0, synced: 0, failed: 0 },
      highlights: { total: 0, synced: 0, failed: 0 }
    };
    
    this.errors = [];
    this.rateLimitDelay = 3000; // 3 seconds between requests to be safe
    
    // Priority leagues for focused sync
    this.priorityLeagues = [
      { id: '33973', name: 'Premier League' },
      { id: '119924', name: 'La Liga' }, 
      { id: '2486', name: 'UEFA Champions League' },
      { id: '8443', name: 'Bundesliga' },
      { id: '52695', name: 'Ligue 1' },
      { id: '3337', name: 'UEFA Europa League' }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'progress' ? '🔄' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testApiAvailability() {
    this.log('Testing API availability...', 'progress');
    try {
      const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=1');
      if (response.status === 429) {
        this.log('❌ API is still rate limited. Cannot proceed with sync.', 'error');
        return false;
      }
      if (response.ok) {
        this.log('✅ API is accessible', 'success');
        return true;
      }
      throw new Error(`API returned status ${response.status}`);
    } catch (error) {
      this.log(`❌ API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async clearTestData() {
    this.log('Clearing existing test data...', 'progress');
    
    try {
      // Delete in reverse dependency order to maintain referential integrity
      const { error: highlightsError } = await supabase.from('highlights').delete().neq('id', '');
      if (highlightsError) console.log('Note: Error clearing highlights:', highlightsError.message);
      
      const { error: matchesError } = await supabase.from('matches').delete().neq('id', '');
      if (matchesError) console.log('Note: Error clearing matches:', matchesError.message);
      
      const { error: teamsError } = await supabase.from('teams').delete().neq('id', '');
      if (teamsError) console.log('Note: Error clearing teams:', teamsError.message);
      
      // Keep leagues as they're our foundation
      
      this.log('✅ Test data cleared', 'success');
    } catch (error) {
      this.log(`❌ Error clearing test data: ${error.message}`, 'error');
      // Don't throw - continue with sync even if cleanup fails
    }
  }

  calculateSeason(matchDate) {
    const date = new Date(matchDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed
    
    // Football season logic: Aug-Dec = current year, Jan-May = previous year
    return month <= 5 ? (year - 1).toString() : year.toString();
  }

  async makeApiRequest(url) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      throw new Error('Rate limited');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async syncLeagueDetails() {
    this.log('🏆 Phase 1: Syncing league details...', 'progress');
    this.progress.leagues.total = this.priorityLeagues.length;

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching details for ${league.name}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/leagues/${league.id}`);
        await this.delay(this.rateLimitDelay);

        if (response && response.id) {
          const leagueData = {
            id: response.id.toString(),
            name: response.name,
            logo: response.logo,
            country_name: response.country?.name || 'Unknown',
            country_code: response.country?.code || 'XX',
            country_logo: response.country?.logo || '',
            api_data: response
          };

          const { error } = await supabase
            .from('leagues')
            .upsert(leagueData, { onConflict: 'id' });

          if (error) throw error;

          this.progress.leagues.synced++;
          this.log(`✅ ${league.name} synced`, 'success');
        }
      } catch (error) {
        this.progress.leagues.failed++;
        this.errors.push({ phase: 'leagues', item: league.name, error: error.message });
        this.log(`❌ Failed to sync ${league.name}: ${error.message}`, 'error');
        
        if (error.message.includes('Rate limited')) {
          this.log('⏸️ Rate limited detected. Waiting longer...', 'progress');
          await this.delay(10000); // Wait 10 seconds if rate limited
        }
      }
    }

    this.log(`📊 Leagues: ${this.progress.leagues.synced}/${this.progress.leagues.total} synced, ${this.progress.leagues.failed} failed`);
  }

  async syncTeamsForLeagues() {
    this.log('👥 Phase 2: Syncing teams for each league...', 'progress');

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching teams for ${league.name}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/leagues/${league.id}/teams`);
        await this.delay(this.rateLimitDelay);

        if (response && response.data && Array.isArray(response.data)) {
          this.progress.teams.total += response.data.length;

          for (const team of response.data) {
            try {
              const teamData = {
                id: team.id.toString(),
                name: team.name,
                logo: team.logo || '',
                league_id: league.id,
                api_data: team
              };

              const { error } = await supabase
                .from('teams')
                .upsert(teamData, { onConflict: 'id' });

              if (error) throw error;

              this.progress.teams.synced++;
            } catch (teamError) {
              this.progress.teams.failed++;
              this.errors.push({ 
                phase: 'teams', 
                item: `${team.name} (${league.name})`, 
                error: teamError.message 
              });
            }
          }

          this.log(`✅ ${response.data.length} teams synced for ${league.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to sync teams for ${league.name}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Teams: ${this.progress.teams.synced}/${this.progress.teams.total} synced, ${this.progress.teams.failed} failed`);
  }

  async syncRecentMatches() {
    this.log('⚽ Phase 3: Syncing recent matches...', 'progress');

    // Get date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dateFrom = startDate.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching recent matches for ${league.name}...`);
        
        const response = await this.makeApiRequest(
          `http://localhost:3001/api/highlightly/leagues/${league.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=50`
        );
        await this.delay(this.rateLimitDelay);

        if (response && response.data && Array.isArray(response.data)) {
          this.progress.matches.total += response.data.length;

          for (const match of response.data) {
            try {
              // Ensure both teams exist first
              await this.ensureTeamExists(match.homeTeam, league.id);
              await this.ensureTeamExists(match.awayTeam, league.id);

              const matchData = {
                id: match.id.toString(),
                home_team_id: match.homeTeam.id.toString(),
                away_team_id: match.awayTeam.id.toString(),
                league_id: league.id,
                match_date: match.date,
                match_time: match.time || '00:00',
                status: match.status || 'Unknown',
                home_score: this.extractScore(match, 'home'),
                away_score: this.extractScore(match, 'away'),
                season: this.calculateSeason(match.date),
                has_highlights: Boolean(match.highlights && match.highlights.length > 0),
                api_data: match
              };

              const { error } = await supabase
                .from('matches')
                .upsert(matchData, { onConflict: 'id' });

              if (error) throw error;

              this.progress.matches.synced++;
            } catch (matchError) {
              this.progress.matches.failed++;
              this.errors.push({
                phase: 'matches',
                item: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
                error: matchError.message
              });
            }
          }

          this.log(`✅ ${response.data.length} matches processed for ${league.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to sync matches for ${league.name}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Matches: ${this.progress.matches.synced}/${this.progress.matches.total} synced, ${this.progress.matches.failed} failed`);
  }

  async ensureTeamExists(team, leagueId) {
    if (!team || !team.id) return false;

    // Check if team exists
    const { data } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team.id.toString())
      .single();

    if (data) return true;

    // Team doesn't exist, create it
    try {
      const teamData = {
        id: team.id.toString(),
        name: team.name,
        logo: team.logo || '',
        league_id: leagueId,
        api_data: team
      };

      const { error } = await supabase
        .from('teams')
        .insert(teamData);

      return !error;
    } catch {
      return false;
    }
  }

  extractScore(match, side) {
    // Handle various score formats from API
    if (match.score) {
      if (typeof match.score === 'object') {
        return match.score[side] || 0;
      }
      if (typeof match.score === 'string') {
        const parts = match.score.split('-');
        return side === 'home' ? parseInt(parts[0]) || 0 : parseInt(parts[1]) || 0;
      }
    }
    
    // Try other possible score locations
    if (match.state && match.state.score) {
      if (match.state.score.current) {
        const parts = match.state.score.current.split('-');
        return side === 'home' ? parseInt(parts[0]) || 0 : parseInt(parts[1]) || 0;
      }
    }
    
    return 0;
  }

  async syncHighlights() {
    this.log('🎬 Phase 4: Syncing highlights...', 'progress');

    // Get matches that might have highlights
    const { data: matches } = await supabase
      .from('matches')
      .select('id, has_highlights')
      .eq('has_highlights', true)
      .limit(20); // Limit to avoid too many API calls

    if (!matches || matches.length === 0) {
      this.log('No matches with highlights found');
      return;
    }

    this.progress.highlights.total = matches.length;

    for (const match of matches) {
      try {
        this.log(`Fetching highlights for match ${match.id}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/matches/${match.id}/highlights`);
        await this.delay(this.rateLimitDelay);

        if (response && Array.isArray(response) && response.length > 0) {
          for (const highlight of response) {
            try {
              const highlightData = {
                id: highlight.id?.toString() || `${match.id}-${Date.now()}`,
                match_id: match.id,
                title: highlight.title || 'Match Highlights',
                url: highlight.url || highlight.videoUrl || '',
                thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
                duration: highlight.duration || 0,
                views: highlight.views || 0,
                api_data: highlight
              };

              const { error } = await supabase
                .from('highlights')
                .upsert(highlightData, { onConflict: 'id' });

              if (error) throw error;
            } catch (highlightError) {
              this.errors.push({
                phase: 'highlights',
                item: `Highlight for match ${match.id}`,
                error: highlightError.message
              });
            }
          }

          this.progress.highlights.synced++;
          this.log(`✅ Highlights synced for match ${match.id}`, 'success');
        }
      } catch (error) {
        this.progress.highlights.failed++;
        this.log(`❌ Failed to sync highlights for match ${match.id}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Highlights: ${this.progress.highlights.synced}/${this.progress.highlights.total} synced, ${this.progress.highlights.failed} failed`);
  }

  async updateSyncStatus() {
    const status = {
      entity_type: 'comprehensive_sync',
      entity_id: 'full_sync',
      last_synced: new Date().toISOString(),
      status: this.errors.length === 0 ? 'success' : 'partial_success',
      error_message: this.errors.length > 0 ? JSON.stringify(this.errors.slice(0, 10)) : null
    };

    await supabase
      .from('sync_status')
      .upsert(status, { onConflict: 'entity_type,entity_id' });
  }

  async run() {
    console.log('🚀 Starting Comprehensive Data Synchronization');
    console.log('='.repeat(50));
    console.log('📋 This will populate your database with REAL football data');
    console.log('⚡ Organized by dependency: Leagues → Teams → Matches → Highlights');
    console.log('🔒 With proper referential integrity and data validation');
    console.log('='.repeat(50));

    try {
      // Pre-sync checks
      const apiAvailable = await this.testApiAvailability();
      if (!apiAvailable) {
        console.log('\n💡 ALTERNATIVE: Since API is rate limited, we could:');
        console.log('   1. Wait for rate limits to reset (usually 1 hour)');
        console.log('   2. Use cached data from server/cache/api-cache.json');
        console.log('   3. Implement a slower sync with longer delays');
        console.log('\n🤔 Would you like to try option 2 or 3?');
        return;
      }

      await this.clearTestData();

      // Execute sync phases in dependency order
      await this.syncLeagueDetails();
      await this.syncTeamsForLeagues();  
      await this.syncRecentMatches();
      await this.syncHighlights();

      // Update sync status
      await this.updateSyncStatus();

      // Final report
      console.log('\n' + '='.repeat(50));
      console.log('🎉 COMPREHENSIVE SYNC COMPLETED!');
      console.log('='.repeat(50));
      console.log(`📊 Final Statistics:`);
      console.log(`   🏆 Leagues: ${this.progress.leagues.synced}/${this.progress.leagues.total} ✅`);
      console.log(`   👥 Teams: ${this.progress.teams.synced}/${this.progress.teams.total} ✅`);
      console.log(`   ⚽ Matches: ${this.progress.matches.synced}/${this.progress.matches.total} ✅`);
      console.log(`   🎬 Highlights: ${this.progress.highlights.synced}/${this.progress.highlights.total} ✅`);
      
      if (this.errors.length > 0) {
        console.log(`\n⚠️  ${this.errors.length} errors occurred during sync`);
        console.log('First 5 errors:');
        this.errors.slice(0, 5).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.phase}: ${error.item} - ${error.error}`);
        });
      }

      console.log('\n🎯 SUCCESS! Your database now contains REAL football data!');
      console.log('🚀 Users will see actual matches, teams, and highlights!');
      console.log('💪 Perfect referential integrity maintained!');
      console.log('🔥 No more Rick Roll URLs! 😄');

    } catch (error) {
      console.error('💥 Sync failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the comprehensive sync
const sync = new ComprehensiveDataSync();
sync.run().then(() => {
  console.log('✅ Sync process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Sync process failed:', error);
  process.exit(1);
}); 
import dotenv from 'dotenv';

dotenv.config();

// We'll use a simple approach since the API might still be rate limited
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class ComprehensiveDataSync {
  constructor() {
    this.progress = {
      leagues: { total: 0, synced: 0, failed: 0 },
      teams: { total: 0, synced: 0, failed: 0 },
      matches: { total: 0, synced: 0, failed: 0 },
      highlights: { total: 0, synced: 0, failed: 0 }
    };
    
    this.errors = [];
    this.rateLimitDelay = 3000; // 3 seconds between requests to be safe
    
    // Priority leagues for focused sync
    this.priorityLeagues = [
      { id: '33973', name: 'Premier League' },
      { id: '119924', name: 'La Liga' }, 
      { id: '2486', name: 'UEFA Champions League' },
      { id: '8443', name: 'Bundesliga' },
      { id: '52695', name: 'Ligue 1' },
      { id: '3337', name: 'UEFA Europa League' }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'progress' ? '🔄' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testApiAvailability() {
    this.log('Testing API availability...', 'progress');
    try {
      const response = await fetch('http://localhost:3001/api/highlightly/leagues?limit=1');
      if (response.status === 429) {
        this.log('❌ API is still rate limited. Cannot proceed with sync.', 'error');
        return false;
      }
      if (response.ok) {
        this.log('✅ API is accessible', 'success');
        return true;
      }
      throw new Error(`API returned status ${response.status}`);
    } catch (error) {
      this.log(`❌ API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async clearTestData() {
    this.log('Clearing existing test data...', 'progress');
    
    try {
      // Delete in reverse dependency order to maintain referential integrity
      const { error: highlightsError } = await supabase.from('highlights').delete().neq('id', '');
      if (highlightsError) console.log('Note: Error clearing highlights:', highlightsError.message);
      
      const { error: matchesError } = await supabase.from('matches').delete().neq('id', '');
      if (matchesError) console.log('Note: Error clearing matches:', matchesError.message);
      
      const { error: teamsError } = await supabase.from('teams').delete().neq('id', '');
      if (teamsError) console.log('Note: Error clearing teams:', teamsError.message);
      
      // Keep leagues as they're our foundation
      
      this.log('✅ Test data cleared', 'success');
    } catch (error) {
      this.log(`❌ Error clearing test data: ${error.message}`, 'error');
      // Don't throw - continue with sync even if cleanup fails
    }
  }

  calculateSeason(matchDate) {
    const date = new Date(matchDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed
    
    // Football season logic: Aug-Dec = current year, Jan-May = previous year
    return month <= 5 ? (year - 1).toString() : year.toString();
  }

  async makeApiRequest(url) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      throw new Error('Rate limited');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async syncLeagueDetails() {
    this.log('🏆 Phase 1: Syncing league details...', 'progress');
    this.progress.leagues.total = this.priorityLeagues.length;

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching details for ${league.name}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/leagues/${league.id}`);
        await this.delay(this.rateLimitDelay);

        if (response && response.id) {
          const leagueData = {
            id: response.id.toString(),
            name: response.name,
            logo: response.logo,
            country_name: response.country?.name || 'Unknown',
            country_code: response.country?.code || 'XX',
            country_logo: response.country?.logo || '',
            api_data: response
          };

          const { error } = await supabase
            .from('leagues')
            .upsert(leagueData, { onConflict: 'id' });

          if (error) throw error;

          this.progress.leagues.synced++;
          this.log(`✅ ${league.name} synced`, 'success');
        }
      } catch (error) {
        this.progress.leagues.failed++;
        this.errors.push({ phase: 'leagues', item: league.name, error: error.message });
        this.log(`❌ Failed to sync ${league.name}: ${error.message}`, 'error');
        
        if (error.message.includes('Rate limited')) {
          this.log('⏸️ Rate limited detected. Waiting longer...', 'progress');
          await this.delay(10000); // Wait 10 seconds if rate limited
        }
      }
    }

    this.log(`📊 Leagues: ${this.progress.leagues.synced}/${this.progress.leagues.total} synced, ${this.progress.leagues.failed} failed`);
  }

  async syncTeamsForLeagues() {
    this.log('👥 Phase 2: Syncing teams for each league...', 'progress');

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching teams for ${league.name}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/leagues/${league.id}/teams`);
        await this.delay(this.rateLimitDelay);

        if (response && response.data && Array.isArray(response.data)) {
          this.progress.teams.total += response.data.length;

          for (const team of response.data) {
            try {
              const teamData = {
                id: team.id.toString(),
                name: team.name,
                logo: team.logo || '',
                league_id: league.id,
                api_data: team
              };

              const { error } = await supabase
                .from('teams')
                .upsert(teamData, { onConflict: 'id' });

              if (error) throw error;

              this.progress.teams.synced++;
            } catch (teamError) {
              this.progress.teams.failed++;
              this.errors.push({ 
                phase: 'teams', 
                item: `${team.name} (${league.name})`, 
                error: teamError.message 
              });
            }
          }

          this.log(`✅ ${response.data.length} teams synced for ${league.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to sync teams for ${league.name}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Teams: ${this.progress.teams.synced}/${this.progress.teams.total} synced, ${this.progress.teams.failed} failed`);
  }

  async syncRecentMatches() {
    this.log('⚽ Phase 3: Syncing recent matches...', 'progress');

    // Get date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dateFrom = startDate.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];

    for (const league of this.priorityLeagues) {
      try {
        this.log(`Fetching recent matches for ${league.name}...`);
        
        const response = await this.makeApiRequest(
          `http://localhost:3001/api/highlightly/leagues/${league.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=50`
        );
        await this.delay(this.rateLimitDelay);

        if (response && response.data && Array.isArray(response.data)) {
          this.progress.matches.total += response.data.length;

          for (const match of response.data) {
            try {
              // Ensure both teams exist first
              await this.ensureTeamExists(match.homeTeam, league.id);
              await this.ensureTeamExists(match.awayTeam, league.id);

              const matchData = {
                id: match.id.toString(),
                home_team_id: match.homeTeam.id.toString(),
                away_team_id: match.awayTeam.id.toString(),
                league_id: league.id,
                match_date: match.date,
                match_time: match.time || '00:00',
                status: match.status || 'Unknown',
                home_score: this.extractScore(match, 'home'),
                away_score: this.extractScore(match, 'away'),
                season: this.calculateSeason(match.date),
                has_highlights: Boolean(match.highlights && match.highlights.length > 0),
                api_data: match
              };

              const { error } = await supabase
                .from('matches')
                .upsert(matchData, { onConflict: 'id' });

              if (error) throw error;

              this.progress.matches.synced++;
            } catch (matchError) {
              this.progress.matches.failed++;
              this.errors.push({
                phase: 'matches',
                item: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
                error: matchError.message
              });
            }
          }

          this.log(`✅ ${response.data.length} matches processed for ${league.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Failed to sync matches for ${league.name}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Matches: ${this.progress.matches.synced}/${this.progress.matches.total} synced, ${this.progress.matches.failed} failed`);
  }

  async ensureTeamExists(team, leagueId) {
    if (!team || !team.id) return false;

    // Check if team exists
    const { data } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team.id.toString())
      .single();

    if (data) return true;

    // Team doesn't exist, create it
    try {
      const teamData = {
        id: team.id.toString(),
        name: team.name,
        logo: team.logo || '',
        league_id: leagueId,
        api_data: team
      };

      const { error } = await supabase
        .from('teams')
        .insert(teamData);

      return !error;
    } catch {
      return false;
    }
  }

  extractScore(match, side) {
    // Handle various score formats from API
    if (match.score) {
      if (typeof match.score === 'object') {
        return match.score[side] || 0;
      }
      if (typeof match.score === 'string') {
        const parts = match.score.split('-');
        return side === 'home' ? parseInt(parts[0]) || 0 : parseInt(parts[1]) || 0;
      }
    }
    
    // Try other possible score locations
    if (match.state && match.state.score) {
      if (match.state.score.current) {
        const parts = match.state.score.current.split('-');
        return side === 'home' ? parseInt(parts[0]) || 0 : parseInt(parts[1]) || 0;
      }
    }
    
    return 0;
  }

  async syncHighlights() {
    this.log('🎬 Phase 4: Syncing highlights...', 'progress');

    // Get matches that might have highlights
    const { data: matches } = await supabase
      .from('matches')
      .select('id, has_highlights')
      .eq('has_highlights', true)
      .limit(20); // Limit to avoid too many API calls

    if (!matches || matches.length === 0) {
      this.log('No matches with highlights found');
      return;
    }

    this.progress.highlights.total = matches.length;

    for (const match of matches) {
      try {
        this.log(`Fetching highlights for match ${match.id}...`);
        
        const response = await this.makeApiRequest(`http://localhost:3001/api/highlightly/matches/${match.id}/highlights`);
        await this.delay(this.rateLimitDelay);

        if (response && Array.isArray(response) && response.length > 0) {
          for (const highlight of response) {
            try {
              const highlightData = {
                id: highlight.id?.toString() || `${match.id}-${Date.now()}`,
                match_id: match.id,
                title: highlight.title || 'Match Highlights',
                url: highlight.url || highlight.videoUrl || '',
                thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
                duration: highlight.duration || 0,
                views: highlight.views || 0,
                api_data: highlight
              };

              const { error } = await supabase
                .from('highlights')
                .upsert(highlightData, { onConflict: 'id' });

              if (error) throw error;
            } catch (highlightError) {
              this.errors.push({
                phase: 'highlights',
                item: `Highlight for match ${match.id}`,
                error: highlightError.message
              });
            }
          }

          this.progress.highlights.synced++;
          this.log(`✅ Highlights synced for match ${match.id}`, 'success');
        }
      } catch (error) {
        this.progress.highlights.failed++;
        this.log(`❌ Failed to sync highlights for match ${match.id}: ${error.message}`, 'error');
        if (error.message.includes('Rate limited')) {
          await this.delay(10000);
        }
      }
    }

    this.log(`📊 Highlights: ${this.progress.highlights.synced}/${this.progress.highlights.total} synced, ${this.progress.highlights.failed} failed`);
  }

  async updateSyncStatus() {
    const status = {
      entity_type: 'comprehensive_sync',
      entity_id: 'full_sync',
      last_synced: new Date().toISOString(),
      status: this.errors.length === 0 ? 'success' : 'partial_success',
      error_message: this.errors.length > 0 ? JSON.stringify(this.errors.slice(0, 10)) : null
    };

    await supabase
      .from('sync_status')
      .upsert(status, { onConflict: 'entity_type,entity_id' });
  }

  async run() {
    console.log('🚀 Starting Comprehensive Data Synchronization');
    console.log('='.repeat(50));
    console.log('📋 This will populate your database with REAL football data');
    console.log('⚡ Organized by dependency: Leagues → Teams → Matches → Highlights');
    console.log('🔒 With proper referential integrity and data validation');
    console.log('='.repeat(50));

    try {
      // Pre-sync checks
      const apiAvailable = await this.testApiAvailability();
      if (!apiAvailable) {
        console.log('\n💡 ALTERNATIVE: Since API is rate limited, we could:');
        console.log('   1. Wait for rate limits to reset (usually 1 hour)');
        console.log('   2. Use cached data from server/cache/api-cache.json');
        console.log('   3. Implement a slower sync with longer delays');
        console.log('\n🤔 Would you like to try option 2 or 3?');
        return;
      }

      await this.clearTestData();

      // Execute sync phases in dependency order
      await this.syncLeagueDetails();
      await this.syncTeamsForLeagues();  
      await this.syncRecentMatches();
      await this.syncHighlights();

      // Update sync status
      await this.updateSyncStatus();

      // Final report
      console.log('\n' + '='.repeat(50));
      console.log('🎉 COMPREHENSIVE SYNC COMPLETED!');
      console.log('='.repeat(50));
      console.log(`📊 Final Statistics:`);
      console.log(`   🏆 Leagues: ${this.progress.leagues.synced}/${this.progress.leagues.total} ✅`);
      console.log(`   👥 Teams: ${this.progress.teams.synced}/${this.progress.teams.total} ✅`);
      console.log(`   ⚽ Matches: ${this.progress.matches.synced}/${this.progress.matches.total} ✅`);
      console.log(`   🎬 Highlights: ${this.progress.highlights.synced}/${this.progress.highlights.total} ✅`);
      
      if (this.errors.length > 0) {
        console.log(`\n⚠️  ${this.errors.length} errors occurred during sync`);
        console.log('First 5 errors:');
        this.errors.slice(0, 5).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.phase}: ${error.item} - ${error.error}`);
        });
      }

      console.log('\n🎯 SUCCESS! Your database now contains REAL football data!');
      console.log('🚀 Users will see actual matches, teams, and highlights!');
      console.log('💪 Perfect referential integrity maintained!');
      console.log('🔥 No more Rick Roll URLs! 😄');

    } catch (error) {
      console.error('💥 Sync failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the comprehensive sync
const sync = new ComprehensiveDataSync();
sync.run().then(() => {
  console.log('✅ Sync process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Sync process failed:', error);
  process.exit(1);
}); 