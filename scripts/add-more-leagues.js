/**
 * ADD MORE LEAGUES
 * 
 * Add Europa League, Conference League, Euros, and Copa America
 */

import { createClient } from '@supabase/supabase-js';

// Correct Supabase configuration
const SUPABASE_URL = 'https://septerrkdnojsmtmmska.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA2ODAsImV4cCI6MjA2MzkxNjY4MH0.j3H1LJsewuwQqxC7knmCznx8T4Y-Ad3zhYK3UwGBy-4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addMoreLeagues() {
  console.log('🚀 ADDING MORE FEATURED LEAGUES');
  console.log('='.repeat(50));

  // Additional leagues to add
  const additionalLeagues = [
    {
      id: 999005,
      name: 'UEFA Europa League',
      logo: 'https://media.api-sports.io/football/leagues/3.png',
      country_code: 'EU',
      country_name: 'Europe',
      country_logo: 'https://media.api-sports.io/flags/eu.svg',
      priority: false
    },
    {
      id: 999006,
      name: 'UEFA Europa Conference League',
      logo: 'https://media.api-sports.io/football/leagues/848.png',
      country_code: 'EU',
      country_name: 'Europe',
      country_logo: 'https://media.api-sports.io/flags/eu.svg',
      priority: false
    },
    {
      id: 999007,
      name: 'UEFA Euro Championship',
      logo: 'https://media.api-sports.io/football/leagues/4.png',
      country_code: 'EU',
      country_name: 'Europe',
      country_logo: 'https://media.api-sports.io/flags/eu.svg',
      priority: false
    },
    {
      id: 999008,
      name: 'Copa America',
      logo: 'https://media.api-sports.io/football/leagues/9.png',
      country_code: 'SA',
      country_name: 'South America',
      country_logo: 'https://media.api-sports.io/flags/ar.svg',
      priority: false
    },
    {
      id: 999009,
      name: 'FIFA World Cup',
      logo: 'https://media.api-sports.io/football/leagues/1.png',
      country_code: 'WW',
      country_name: 'World',
      country_logo: 'https://media.api-sports.io/flags/fifa.svg',
      priority: false
    },
    {
      id: 999010,
      name: 'FIFA Club World Cup',
      logo: 'https://media.api-sports.io/football/leagues/15.png',
      country_code: 'WW',
      country_name: 'World',
      country_logo: 'https://media.api-sports.io/flags/fifa.svg',
      priority: false
    }
  ];

  let addedCount = 0;

  for (const league of additionalLeagues) {
    console.log(`\n➕ Adding ${league.name}...`);
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('leagues')
      .select('id')
      .eq('name', league.name)
      .single();

    if (existing) {
      console.log(`⏭️  ${league.name} already exists`);
      continue;
    }

    const { error } = await supabase
      .from('leagues')
      .insert({
        id: league.id,
        name: league.name,
        logo: league.logo,
        country_code: league.country_code,
        country_name: league.country_name,
        country_logo: league.country_logo,
        priority: league.priority,
        current_season: 2024
      });

    if (error) {
      console.log(`❌ Error adding ${league.name}: ${error.message}`);
    } else {
      console.log(`✅ Added ${league.name} with logo`);
      addedCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 MORE LEAGUES ADDED');
  console.log(`✅ Added ${addedCount} new leagues`);
  console.log('🏆 All major competitions now available!');
}

// Run the script
addMoreLeagues(); 