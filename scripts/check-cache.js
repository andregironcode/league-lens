import { readFileSync } from 'fs';

try {
  const cache = JSON.parse(readFileSync('server/cache/api-cache.json', 'utf8'));
  const keys = Object.keys(cache);
  
  console.log('='.repeat(50));
  console.log('📁 API Cache Analysis');
  console.log('='.repeat(50));
  console.log(`Total cache entries: ${keys.length}`);
  
  console.log('\n🏆 League entries:');
  const leagueKeys = keys.filter(k => k.includes('/leagues/') && !k.includes('/teams') && !k.includes('/matches'));
  leagueKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n👥 Team entries:');
  const teamKeys = keys.filter(k => k.includes('/teams'));
  teamKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n⚽ Match entries:');
  const matchKeys = keys.filter(k => k.includes('/matches') && !k.includes('/highlights'));
  matchKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n🎬 Highlight entries:');
  const highlightKeys = keys.filter(k => k.includes('/highlights'));
  highlightKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n📊 Summary:');
  console.log(`  Leagues: ${leagueKeys.length}`);
  console.log(`  Teams: ${teamKeys.length}`);
  console.log(`  Matches: ${matchKeys.length}`);
  console.log(`  Highlights: ${highlightKeys.length}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 

try {
  const cache = JSON.parse(readFileSync('server/cache/api-cache.json', 'utf8'));
  const keys = Object.keys(cache);
  
  console.log('='.repeat(50));
  console.log('📁 API Cache Analysis');
  console.log('='.repeat(50));
  console.log(`Total cache entries: ${keys.length}`);
  
  console.log('\n🏆 League entries:');
  const leagueKeys = keys.filter(k => k.includes('/leagues/') && !k.includes('/teams') && !k.includes('/matches'));
  leagueKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n👥 Team entries:');
  const teamKeys = keys.filter(k => k.includes('/teams'));
  teamKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n⚽ Match entries:');
  const matchKeys = keys.filter(k => k.includes('/matches') && !k.includes('/highlights'));
  matchKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n🎬 Highlight entries:');
  const highlightKeys = keys.filter(k => k.includes('/highlights'));
  highlightKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n📊 Summary:');
  console.log(`  Leagues: ${leagueKeys.length}`);
  console.log(`  Teams: ${teamKeys.length}`);
  console.log(`  Matches: ${matchKeys.length}`);
  console.log(`  Highlights: ${highlightKeys.length}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 

try {
  const cache = JSON.parse(readFileSync('server/cache/api-cache.json', 'utf8'));
  const keys = Object.keys(cache);
  
  console.log('='.repeat(50));
  console.log('📁 API Cache Analysis');
  console.log('='.repeat(50));
  console.log(`Total cache entries: ${keys.length}`);
  
  console.log('\n🏆 League entries:');
  const leagueKeys = keys.filter(k => k.includes('/leagues/') && !k.includes('/teams') && !k.includes('/matches'));
  leagueKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n👥 Team entries:');
  const teamKeys = keys.filter(k => k.includes('/teams'));
  teamKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n⚽ Match entries:');
  const matchKeys = keys.filter(k => k.includes('/matches') && !k.includes('/highlights'));
  matchKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n🎬 Highlight entries:');
  const highlightKeys = keys.filter(k => k.includes('/highlights'));
  highlightKeys.slice(0, 10).forEach(k => console.log(`  ${k}`));
  
  console.log('\n📊 Summary:');
  console.log(`  Leagues: ${leagueKeys.length}`);
  console.log(`  Teams: ${teamKeys.length}`);
  console.log(`  Matches: ${matchKeys.length}`);
  console.log(`  Highlights: ${highlightKeys.length}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 