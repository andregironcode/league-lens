import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function extractRealData() {
  console.log('🚀 Extracting REAL football data from API cache...');
  console.log('📋 This will populate your database with actual Premier League, La Liga, Champions League data!');
  console.log('='.repeat(60));

  try {
    // Load the cache file
    console.log('📁 Loading API cache...');
    const cacheData = JSON.parse(readFileSync('server/cache/api-cache.json', 'utf8'));
    
    // Clear existing test data
    console.log('🧹 Clearing test data...');
    await supabase.from('highlights').delete().neq('id', '');
    await supabase.from('matches').delete().neq('id', '');
    await supabase.from('teams').delete().neq('id', '');
    
    // Extract and update leagues with real data
    console.log('🏆 Updating leagues with real data...');
    const leagueKeys = Object.keys(cacheData).filter(key => 
      key.match(/^\/api\/highlightly\/leagues\/\d+$/) && 
      !key.includes('/teams') && 
      !key.includes('/matches')
    );
    
    let leagueCount = 0;
    for (const key of leagueKeys.slice(0, 6)) { // Top 6 leagues
      const leagueData = cacheData[key].data[0];
      if (leagueData) {
        await supabase.from('leagues').upsert({
          id: leagueData.id.toString(),
          name: leagueData.name,
          logo: leagueData.logo,
          country_name: leagueData.country?.name || 'Unknown',
          country_code: leagueData.country?.code || 'XX',
          country_logo: leagueData.country?.logo || '',
          api_data: leagueData
        }, { onConflict: 'id' });
        
        console.log(`✅ ${leagueData.name} (${leagueData.country?.name})`);
        leagueCount++;
      }
    }
    
    // Extract teams from cache
    console.log('👥 Extracting teams...');
    const teamKeys = Object.keys(cacheData).filter(key => key.includes('/teams'));
    let teamCount = 0;
    
    for (const key of teamKeys.slice(0, 10)) { // Limit to avoid too much data
      const leagueIdMatch = key.match(/\/leagues\/(\d+)\/teams/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        const teamsData = cacheData[key].data;
        
        if (Array.isArray(teamsData)) {
          for (const team of teamsData.slice(0, 10)) { // Top 10 teams per league
            await supabase.from('teams').upsert({
              id: team.id.toString(),
              name: team.name,
              logo: team.logo || '',
              league_id: leagueId,
              api_data: team
            }, { onConflict: 'id' });
            teamCount++;
          }
        }
      }
    }
    console.log(`✅ ${teamCount} teams extracted`);
    
    // Extract matches from cache
    console.log('⚽ Extracting matches...');
    const matchKeys = Object.keys(cacheData).filter(key => key.includes('/matches') && !key.includes('/highlights'));
    let matchCount = 0;
    
    for (const key of matchKeys.slice(0, 5)) { // Limit matches
      const leagueIdMatch = key.match(/\/leagues\/(\d+)\/matches/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        const matchesData = cacheData[key].data;
        
        if (Array.isArray(matchesData)) {
          for (const match of matchesData.slice(0, 20)) { // Top 20 matches per league
            if (match.homeTeam && match.awayTeam) {
              // Ensure teams exist first
              await supabase.from('teams').upsert({
                id: match.homeTeam.id.toString(),
                name: match.homeTeam.name,
                logo: match.homeTeam.logo || '',
                league_id: leagueId,
                api_data: match.homeTeam
              }, { onConflict: 'id' });
              
              await supabase.from('teams').upsert({
                id: match.awayTeam.id.toString(),
                name: match.awayTeam.name,
                logo: match.awayTeam.logo || '',
                league_id: leagueId,
                api_data: match.awayTeam
              }, { onConflict: 'id' });
              
              // Calculate season
              const matchDate = new Date(match.date);
              const year = matchDate.getFullYear();
              const month = matchDate.getMonth() + 1;
              const season = month <= 5 ? (year - 1).toString() : year.toString();
              
              // Extract score
              let homeScore = 0, awayScore = 0;
              if (match.state?.score?.current) {
                const parts = match.state.score.current.split('-');
                homeScore = parseInt(parts[0]) || 0;
                awayScore = parseInt(parts[1]) || 0;
              }
              
              await supabase.from('matches').upsert({
                id: match.id.toString(),
                home_team_id: match.homeTeam.id.toString(),
                away_team_id: match.awayTeam.id.toString(),
                league_id: leagueId,
                match_date: match.date,
                match_time: match.time || '00:00',
                status: match.status || 'Unknown',
                home_score: homeScore,
                away_score: awayScore,
                season: season,
                has_highlights: Boolean(match.highlights && match.highlights.length > 0),
                api_data: match
              }, { onConflict: 'id' });
              
              matchCount++;
            }
          }
        }
      }
    }
    console.log(`✅ ${matchCount} matches extracted`);
    
    // Extract highlights from cache
    console.log('🎬 Extracting highlights...');
    const highlightKeys = Object.keys(cacheData).filter(key => key.includes('/highlights'));
    let highlightCount = 0;
    
    for (const key of highlightKeys.slice(0, 10)) { // Limit highlights
      const matchIdMatch = key.match(/\/matches\/([^\/]+)\/highlights/);
      if (matchIdMatch) {
        const matchId = matchIdMatch[1];
        const highlightsData = cacheData[key].data;
        
        if (Array.isArray(highlightsData)) {
          for (const highlight of highlightsData) {
            await supabase.from('highlights').upsert({
              id: highlight.id?.toString() || `${matchId}-${Date.now()}`,
              match_id: matchId,
              title: highlight.title || 'Match Highlights',
              url: highlight.url || highlight.videoUrl || '',
              thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
              duration: highlight.duration || 0,
              views: highlight.views || 0,
              api_data: highlight
            }, { onConflict: 'id' });
            highlightCount++;
          }
        }
      }
    }
    console.log(`✅ ${highlightCount} highlights extracted`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Your database now contains REAL football data!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   🏆 Leagues: ${leagueCount} real leagues updated`);
    console.log(`   👥 Teams: ${teamCount} real teams extracted`);
    console.log(`   ⚽ Matches: ${matchCount} real matches extracted`);
    console.log(`   🎬 Highlights: ${highlightCount} real highlights extracted`);
    console.log('\n🚀 Your app now shows ACTUAL football data!');
    console.log('🔥 No more Rick Roll URLs! 😄');
    console.log('⚡ All from your existing API cache - no API calls needed!');
    
  } catch (error) {
    console.error('❌ Error extracting data:', error);
  }
}

// Run the extraction
extractRealData().then(() => {
  console.log('✅ Real data extraction completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Real data extraction failed:', error);
  process.exit(1);
}); 
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function extractRealData() {
  console.log('🚀 Extracting REAL football data from API cache...');
  console.log('📋 This will populate your database with actual Premier League, La Liga, Champions League data!');
  console.log('='.repeat(60));

  try {
    // Load the cache file
    console.log('📁 Loading API cache...');
    const cacheData = JSON.parse(readFileSync('server/cache/api-cache.json', 'utf8'));
    
    // Clear existing test data
    console.log('🧹 Clearing test data...');
    await supabase.from('highlights').delete().neq('id', '');
    await supabase.from('matches').delete().neq('id', '');
    await supabase.from('teams').delete().neq('id', '');
    
    // Extract and update leagues with real data
    console.log('🏆 Updating leagues with real data...');
    const leagueKeys = Object.keys(cacheData).filter(key => 
      key.match(/^\/api\/highlightly\/leagues\/\d+$/) && 
      !key.includes('/teams') && 
      !key.includes('/matches')
    );
    
    let leagueCount = 0;
    for (const key of leagueKeys.slice(0, 6)) { // Top 6 leagues
      const leagueData = cacheData[key].data[0];
      if (leagueData) {
        await supabase.from('leagues').upsert({
          id: leagueData.id.toString(),
          name: leagueData.name,
          logo: leagueData.logo,
          country_name: leagueData.country?.name || 'Unknown',
          country_code: leagueData.country?.code || 'XX',
          country_logo: leagueData.country?.logo || '',
          api_data: leagueData
        }, { onConflict: 'id' });
        
        console.log(`✅ ${leagueData.name} (${leagueData.country?.name})`);
        leagueCount++;
      }
    }
    
    // Extract teams from cache
    console.log('👥 Extracting teams...');
    const teamKeys = Object.keys(cacheData).filter(key => key.includes('/teams'));
    let teamCount = 0;
    
    for (const key of teamKeys.slice(0, 10)) { // Limit to avoid too much data
      const leagueIdMatch = key.match(/\/leagues\/(\d+)\/teams/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        const teamsData = cacheData[key].data;
        
        if (Array.isArray(teamsData)) {
          for (const team of teamsData.slice(0, 10)) { // Top 10 teams per league
            await supabase.from('teams').upsert({
              id: team.id.toString(),
              name: team.name,
              logo: team.logo || '',
              league_id: leagueId,
              api_data: team
            }, { onConflict: 'id' });
            teamCount++;
          }
        }
      }
    }
    console.log(`✅ ${teamCount} teams extracted`);
    
    // Extract matches from cache
    console.log('⚽ Extracting matches...');
    const matchKeys = Object.keys(cacheData).filter(key => key.includes('/matches') && !key.includes('/highlights'));
    let matchCount = 0;
    
    for (const key of matchKeys.slice(0, 5)) { // Limit matches
      const leagueIdMatch = key.match(/\/leagues\/(\d+)\/matches/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        const matchesData = cacheData[key].data;
        
        if (Array.isArray(matchesData)) {
          for (const match of matchesData.slice(0, 20)) { // Top 20 matches per league
            if (match.homeTeam && match.awayTeam) {
              // Ensure teams exist first
              await supabase.from('teams').upsert({
                id: match.homeTeam.id.toString(),
                name: match.homeTeam.name,
                logo: match.homeTeam.logo || '',
                league_id: leagueId,
                api_data: match.homeTeam
              }, { onConflict: 'id' });
              
              await supabase.from('teams').upsert({
                id: match.awayTeam.id.toString(),
                name: match.awayTeam.name,
                logo: match.awayTeam.logo || '',
                league_id: leagueId,
                api_data: match.awayTeam
              }, { onConflict: 'id' });
              
              // Calculate season
              const matchDate = new Date(match.date);
              const year = matchDate.getFullYear();
              const month = matchDate.getMonth() + 1;
              const season = month <= 5 ? (year - 1).toString() : year.toString();
              
              // Extract score
              let homeScore = 0, awayScore = 0;
              if (match.state?.score?.current) {
                const parts = match.state.score.current.split('-');
                homeScore = parseInt(parts[0]) || 0;
                awayScore = parseInt(parts[1]) || 0;
              }
              
              await supabase.from('matches').upsert({
                id: match.id.toString(),
                home_team_id: match.homeTeam.id.toString(),
                away_team_id: match.awayTeam.id.toString(),
                league_id: leagueId,
                match_date: match.date,
                match_time: match.time || '00:00',
                status: match.status || 'Unknown',
                home_score: homeScore,
                away_score: awayScore,
                season: season,
                has_highlights: Boolean(match.highlights && match.highlights.length > 0),
                api_data: match
              }, { onConflict: 'id' });
              
              matchCount++;
            }
          }
        }
      }
    }
    console.log(`✅ ${matchCount} matches extracted`);
    
    // Extract highlights from cache
    console.log('🎬 Extracting highlights...');
    const highlightKeys = Object.keys(cacheData).filter(key => key.includes('/highlights'));
    let highlightCount = 0;
    
    for (const key of highlightKeys.slice(0, 10)) { // Limit highlights
      const matchIdMatch = key.match(/\/matches\/([^\/]+)\/highlights/);
      if (matchIdMatch) {
        const matchId = matchIdMatch[1];
        const highlightsData = cacheData[key].data;
        
        if (Array.isArray(highlightsData)) {
          for (const highlight of highlightsData) {
            await supabase.from('highlights').upsert({
              id: highlight.id?.toString() || `${matchId}-${Date.now()}`,
              match_id: matchId,
              title: highlight.title || 'Match Highlights',
              url: highlight.url || highlight.videoUrl || '',
              thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
              duration: highlight.duration || 0,
              views: highlight.views || 0,
              api_data: highlight
            }, { onConflict: 'id' });
            highlightCount++;
          }
        }
      }
    }
    console.log(`✅ ${highlightCount} highlights extracted`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Your database now contains REAL football data!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   🏆 Leagues: ${leagueCount} real leagues updated`);
    console.log(`   👥 Teams: ${teamCount} real teams extracted`);
    console.log(`   ⚽ Matches: ${matchCount} real matches extracted`);
    console.log(`   🎬 Highlights: ${highlightCount} real highlights extracted`);
    console.log('\n🚀 Your app now shows ACTUAL football data!');
    console.log('🔥 No more Rick Roll URLs! 😄');
    console.log('⚡ All from your existing API cache - no API calls needed!');
    
  } catch (error) {
    console.error('❌ Error extracting data:', error);
  }
}

// Run the extraction
extractRealData().then(() => {
  console.log('✅ Real data extraction completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Real data extraction failed:', error);
  process.exit(1);
}); 
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function extractRealData() {
  console.log('🚀 Extracting REAL football data from API cache...');
  console.log('📋 This will populate your database with actual Premier League, La Liga, Champions League data!');
  console.log('='.repeat(60));

  try {
    // Load the cache file
    console.log('📁 Loading API cache...');
    const cacheData = JSON.parse(readFileSync('server/cache/api-cache.json', 'utf8'));
    
    // Clear existing test data
    console.log('🧹 Clearing test data...');
    await supabase.from('highlights').delete().neq('id', '');
    await supabase.from('matches').delete().neq('id', '');
    await supabase.from('teams').delete().neq('id', '');
    
    // Extract and update leagues with real data
    console.log('🏆 Updating leagues with real data...');
    const leagueKeys = Object.keys(cacheData).filter(key => 
      key.match(/^\/api\/highlightly\/leagues\/\d+$/) && 
      !key.includes('/teams') && 
      !key.includes('/matches')
    );
    
    let leagueCount = 0;
    for (const key of leagueKeys.slice(0, 6)) { // Top 6 leagues
      const leagueData = cacheData[key].data[0];
      if (leagueData) {
        await supabase.from('leagues').upsert({
          id: leagueData.id.toString(),
          name: leagueData.name,
          logo: leagueData.logo,
          country_name: leagueData.country?.name || 'Unknown',
          country_code: leagueData.country?.code || 'XX',
          country_logo: leagueData.country?.logo || '',
          api_data: leagueData
        }, { onConflict: 'id' });
        
        console.log(`✅ ${leagueData.name} (${leagueData.country?.name})`);
        leagueCount++;
      }
    }
    
    // Extract teams from cache
    console.log('👥 Extracting teams...');
    const teamKeys = Object.keys(cacheData).filter(key => key.includes('/teams'));
    let teamCount = 0;
    
    for (const key of teamKeys.slice(0, 10)) { // Limit to avoid too much data
      const leagueIdMatch = key.match(/\/leagues\/(\d+)\/teams/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        const teamsData = cacheData[key].data;
        
        if (Array.isArray(teamsData)) {
          for (const team of teamsData.slice(0, 10)) { // Top 10 teams per league
            await supabase.from('teams').upsert({
              id: team.id.toString(),
              name: team.name,
              logo: team.logo || '',
              league_id: leagueId,
              api_data: team
            }, { onConflict: 'id' });
            teamCount++;
          }
        }
      }
    }
    console.log(`✅ ${teamCount} teams extracted`);
    
    // Extract matches from cache
    console.log('⚽ Extracting matches...');
    const matchKeys = Object.keys(cacheData).filter(key => key.includes('/matches') && !key.includes('/highlights'));
    let matchCount = 0;
    
    for (const key of matchKeys.slice(0, 5)) { // Limit matches
      const leagueIdMatch = key.match(/\/leagues\/(\d+)\/matches/);
      if (leagueIdMatch) {
        const leagueId = leagueIdMatch[1];
        const matchesData = cacheData[key].data;
        
        if (Array.isArray(matchesData)) {
          for (const match of matchesData.slice(0, 20)) { // Top 20 matches per league
            if (match.homeTeam && match.awayTeam) {
              // Ensure teams exist first
              await supabase.from('teams').upsert({
                id: match.homeTeam.id.toString(),
                name: match.homeTeam.name,
                logo: match.homeTeam.logo || '',
                league_id: leagueId,
                api_data: match.homeTeam
              }, { onConflict: 'id' });
              
              await supabase.from('teams').upsert({
                id: match.awayTeam.id.toString(),
                name: match.awayTeam.name,
                logo: match.awayTeam.logo || '',
                league_id: leagueId,
                api_data: match.awayTeam
              }, { onConflict: 'id' });
              
              // Calculate season
              const matchDate = new Date(match.date);
              const year = matchDate.getFullYear();
              const month = matchDate.getMonth() + 1;
              const season = month <= 5 ? (year - 1).toString() : year.toString();
              
              // Extract score
              let homeScore = 0, awayScore = 0;
              if (match.state?.score?.current) {
                const parts = match.state.score.current.split('-');
                homeScore = parseInt(parts[0]) || 0;
                awayScore = parseInt(parts[1]) || 0;
              }
              
              await supabase.from('matches').upsert({
                id: match.id.toString(),
                home_team_id: match.homeTeam.id.toString(),
                away_team_id: match.awayTeam.id.toString(),
                league_id: leagueId,
                match_date: match.date,
                match_time: match.time || '00:00',
                status: match.status || 'Unknown',
                home_score: homeScore,
                away_score: awayScore,
                season: season,
                has_highlights: Boolean(match.highlights && match.highlights.length > 0),
                api_data: match
              }, { onConflict: 'id' });
              
              matchCount++;
            }
          }
        }
      }
    }
    console.log(`✅ ${matchCount} matches extracted`);
    
    // Extract highlights from cache
    console.log('🎬 Extracting highlights...');
    const highlightKeys = Object.keys(cacheData).filter(key => key.includes('/highlights'));
    let highlightCount = 0;
    
    for (const key of highlightKeys.slice(0, 10)) { // Limit highlights
      const matchIdMatch = key.match(/\/matches\/([^\/]+)\/highlights/);
      if (matchIdMatch) {
        const matchId = matchIdMatch[1];
        const highlightsData = cacheData[key].data;
        
        if (Array.isArray(highlightsData)) {
          for (const highlight of highlightsData) {
            await supabase.from('highlights').upsert({
              id: highlight.id?.toString() || `${matchId}-${Date.now()}`,
              match_id: matchId,
              title: highlight.title || 'Match Highlights',
              url: highlight.url || highlight.videoUrl || '',
              thumbnail: highlight.thumbnail || highlight.thumbnailUrl || '',
              duration: highlight.duration || 0,
              views: highlight.views || 0,
              api_data: highlight
            }, { onConflict: 'id' });
            highlightCount++;
          }
        }
      }
    }
    console.log(`✅ ${highlightCount} highlights extracted`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Your database now contains REAL football data!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   🏆 Leagues: ${leagueCount} real leagues updated`);
    console.log(`   👥 Teams: ${teamCount} real teams extracted`);
    console.log(`   ⚽ Matches: ${matchCount} real matches extracted`);
    console.log(`   🎬 Highlights: ${highlightCount} real highlights extracted`);
    console.log('\n🚀 Your app now shows ACTUAL football data!');
    console.log('🔥 No more Rick Roll URLs! 😄');
    console.log('⚡ All from your existing API cache - no API calls needed!');
    
  } catch (error) {
    console.error('❌ Error extracting data:', error);
  }
}

// Run the extraction
extractRealData().then(() => {
  console.log('✅ Real data extraction completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Real data extraction failed:', error);
  process.exit(1);
}); 