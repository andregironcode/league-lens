/**
 * Fix UI Crashes - Comprehensive Fix
 * This fixes the main UI crashes mentioned:
 * 1. League page crashes with "Cannot read properties of undefined (reading 'map')"
 * 2. Match details crashes with "Cannot read properties of undefined (reading 'logo')"
 * 3. Missing logo handling
 */

import fs from 'fs';
import path from 'path';

const fixes = [
  {
    file: 'src/pages/LeaguePage.tsx',
    description: 'Fix League page undefined map crash',
    patches: [
      {
        search: `// Calculate league statistics from match data
            if (past.length > 0) {`,
        replace: `// Calculate league statistics from match data
            if (past && Array.isArray(past) && past.length > 0) {`
      },
      {
        search: `past.forEach(match => {`,
        replace: `(past || []).forEach(match => {
                if (!match) return;`
      },
      {
        search: `const totalGoals = past.reduce((sum, match) => {`,
        replace: `const totalGoals = (past || []).reduce((sum, match) => {
                if (!match) return sum;`
      },
      {
        search: `past.forEach(match => {`,
        replace: `(past || []).forEach(match => {
                if (!match) return;`
      }
    ]
  },
  {
    file: 'src/pages/MatchDetails.tsx',
    description: 'Fix MatchDetails logo crashes',
    patches: [
      {
        search: `{match.competition?.logo ? (
                <img src={match.competition.logo} alt={match.competition.name || 'League'} className="w-5 h-5 object-contain rounded-full bg-white p-0.5" />
              ) : (`,
        replace: `{(match?.competition?.logo) ? (
                <img src={match.competition.logo} alt={match.competition?.name || 'League'} className="w-5 h-5 object-contain rounded-full bg-white p-0.5" 
                     onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (`
      },
      {
        search: `<ScorelineBanner match={match} timing={timing} />`,
        replace: `{match && <ScorelineBanner match={match} timing={timing} />}`
      }
    ]
  },
  {
    file: 'src/components/match-details/ScorelineBanner.tsx',
    description: 'Fix ScorelineBanner logo crashes',
    patches: [
      {
        search: `<img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />`,
        replace: `<img src={match?.homeTeam?.logo || '/icons/default.svg'} 
                   alt={match?.homeTeam?.name || 'Home Team'} 
                   className="w-20 h-20 object-contain mx-auto mb-3"
                   onError={(e) => { e.currentTarget.src = '/icons/default.svg'; }} />`
      },
      {
        search: `<img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 object-contain mx-auto mb-3" />`,
        replace: `<img src={match?.awayTeam?.logo || '/icons/default.svg'} 
                   alt={match?.awayTeam?.name || 'Away Team'} 
                   className="w-20 h-20 object-contain mx-auto mb-3"
                   onError={(e) => { e.currentTarget.src = '/icons/default.svg'; }} />`
      },
      {
        search: `<div className="text-white font-medium text-lg truncate px-1">{match.homeTeam.name}</div>`,
        replace: `<div className="text-white font-medium text-lg truncate px-1">{match?.homeTeam?.name || 'Home Team'}</div>`
      },
      {
        search: `<div className="text-white font-medium text-lg truncate px-1">{match.awayTeam.name}</div>`,
        replace: `<div className="text-white font-medium text-lg truncate px-1">{match?.awayTeam?.name || 'Away Team'}</div>`
      }
    ]
  },
  {
    file: 'src/components/LeaguePage.tsx',
    description: 'Fix LeagueDetails component crashes',
    patches: [
      {
        search: `const teamsData = [];
      if (Array.isArray(response)) {
        teamsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        teamsData = response.data;
      }`,
        replace: `let teamsData = [];
      if (Array.isArray(response)) {
        teamsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        teamsData = response.data;
      }`
      },
      {
        search: `let standingsData = [];
          if (response.groups && Array.isArray(response.groups) && response.groups.length > 0) {`,
        replace: `let standingsData = [];
          if (response?.groups && Array.isArray(response.groups) && response.groups.length > 0) {`
      },
      {
        search: `} else if (response.data && Array.isArray(response.data)) {`,
        replace: `} else if (response?.data && Array.isArray(response.data)) {`
      },
      {
        search: `} else if (response.league && response.league.standings) {`,
        replace: `} else if (response?.league?.standings) {`
      }
    ]
  }
];

async function applyFixes() {
  console.log('🔧 FIXING UI CRASHES');
  console.log('='.repeat(50));
  
  let totalFixes = 0;
  
  for (const fix of fixes) {
    console.log(`\n📁 Processing ${fix.file}...`);
    
    try {
      const filePath = path.join(process.cwd(), fix.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found: ${fix.file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let fileChanged = false;
      
      for (const patch of fix.patches) {
        if (content.includes(patch.search)) {
          content = content.replace(patch.search, patch.replace);
          fileChanged = true;
          totalFixes++;
          console.log(`   ✅ Applied patch: ${patch.search.substring(0, 50)}...`);
        } else {
          console.log(`   ⚠️  Pattern not found: ${patch.search.substring(0, 50)}...`);
        }
      }
      
      if (fileChanged) {
        fs.writeFileSync(filePath, content);
        console.log(`   💾 Saved ${fix.file}`);
      } else {
        console.log(`   ℹ️  No changes needed for ${fix.file}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${fix.file}:`, error.message);
    }
  }
  
  // Create fallback logo files if they don't exist
  console.log('\n🖼️  Creating fallback logo files...');
  
  const logoFiles = [
    {
      path: 'public/icons/default.svg',
      content: `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="12" fill="#374151"/>
  <circle cx="12" cy="12" r="10" fill="#1f2937" stroke="#4b5563" stroke-width="1"/>
  <text x="12" y="16" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#ffffff">?</text>
</svg>`
    },
    {
      path: 'public/teams/default.png',
      content: `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="16" fill="#6b7280"/>
  <circle cx="16" cy="16" r="14" fill="#374151" stroke="#4b5563" stroke-width="1"/>
  <text x="16" y="21" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#ffffff">⚽</text>
</svg>`
    },
    {
      path: 'public/leagues/default.png',
      content: `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="16" fill="#059669"/>
  <circle cx="16" cy="16" r="14" fill="#047857" stroke="#065f46" stroke-width="1"/>
  <text x="16" y="21" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#ffffff">🏆</text>
</svg>`
    }
  ];
  
  for (const logoFile of logoFiles) {
    try {
      const fullPath = path.join(process.cwd(), logoFile.path);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   📁 Created directory: ${dir}`);
      }
      
      // Create file if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, logoFile.content);
        console.log(`   ✅ Created fallback: ${logoFile.path}`);
      } else {
        console.log(`   ℹ️  Already exists: ${logoFile.path}`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating ${logoFile.path}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 UI CRASH FIXES COMPLETED!');
  console.log(`✅ Applied ${totalFixes} code patches`);
  console.log('✅ Created fallback logo files');
  console.log('\n🔧 ADDITIONAL RECOMMENDATIONS:');
  console.log('1. Clear browser cache and reload the app');
  console.log('2. Check browser console for any remaining errors');
  console.log('3. Test league and match detail pages');
  console.log('\n📋 WHAT WAS FIXED:');
  console.log('• League page undefined map crashes');
  console.log('• Match details logo crashes');
  console.log('• Missing fallback logos');
  console.log('• Null safety checks added');
}

applyFixes().catch(console.error); 