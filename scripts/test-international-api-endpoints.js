/**
 * TEST INTERNATIONAL API ENDPOINTS
 * 
 * Quick test to explore different API endpoints and seasons for international tournaments
 */

import { createClient } from '@supabase/supabase-js';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/highlightly';

// Utility function to make API calls
async function makeAPICall(endpoint, params = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`📡 Testing: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.log(`❌ ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Analyze response structure
    if (data && data.groups && Array.isArray(data.groups)) {
      console.log(`✅ Groups format: ${data.groups.length} groups`);
      data.groups.forEach((group, index) => {
        if (group.standings) {
          console.log(`   Group ${index + 1}: ${group.standings.length} teams`);
          group.standings.slice(0, 3).forEach(standing => {
            console.log(`      - ${standing.team?.name || 'Unknown'}`);
          });
        }
      });
      return data;
    } else if (data && data.data) {
      console.log(`✅ Data array: ${data.data.length} items`);
      data.data.slice(0, 5).forEach(item => {
        console.log(`   - ${item.name || item.title || JSON.stringify(item).slice(0, 50)}`);
      });
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`✅ Direct array: ${data.length} items`);
      data.slice(0, 5).forEach(item => {
        console.log(`   - ${item.name || item.title || JSON.stringify(item).slice(0, 50)}`);
      });
      return data;
    } else {
      console.log(`⚠️  Unexpected format. Keys: ${Object.keys(data).join(', ')}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testInternationalEndpoints() {
  console.log('🧪 TESTING INTERNATIONAL API ENDPOINTS');
  console.log('=' .repeat(60));

  const tournaments = [
    { id: 4188, name: 'Euro Championship' },
    { id: 8443, name: 'Copa America' },
    { id: 1, name: 'FIFA World Cup' }
  ];

  const seasons = [2024, 2023, 2022, 2021, 2020];
  const endpoints = ['/standings', '/teams', '/matches'];

  for (const tournament of tournaments) {
    console.log(`\n🏆 Testing ${tournament.name} (ID: ${tournament.id})`);
    console.log('-'.repeat(40));

    for (const season of seasons) {
      console.log(`\n📅 Season ${season}:`);
      
      for (const endpoint of endpoints) {
        await makeAPICall(endpoint, {
          leagueId: tournament.id,
          season: season
        });
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Break after first successful season to save time
      console.log('\n---');
    }
  }

  // Test some other potential international tournament IDs
  console.log('\n🔍 Testing other potential tournament IDs:');
  console.log('-'.repeat(40));
  
  const otherIds = [
    { id: 2486, name: 'UEFA Champions League (for reference)' },
    { id: 16, name: 'Nations League (potential)' },
    { id: 32, name: 'World Cup Qualifiers (potential)' },
    { id: 64, name: 'Euro Qualifiers (potential)' }
  ];

  for (const tournament of otherIds) {
    console.log(`\n🧪 ${tournament.name} (ID: ${tournament.id}):`);
    await makeAPICall('/standings', {
      leagueId: tournament.id,
      season: 2024
    });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

testInternationalEndpoints(); 