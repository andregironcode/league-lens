import { supabase } from './client';
import type { 
  TeamInsert, 
  CompetitionInsert, 
  MatchHighlightInsert,
  LeagueTableInsert,
  FixtureInsert,
  TeamCompetitionInsert
} from './types';

/**
 * This script sets up the Supabase database with initial data
 * Run this script once to initialize your database
 */

// Initial Teams Data
const teamsData: TeamInsert[] = [
  {
    id: 'mci',
    name: 'Manchester City',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    created_at: new Date().toISOString()
  },
  {
    id: 'ars',
    name: 'Arsenal',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    created_at: new Date().toISOString()
  },
  {
    id: 'fcb',
    name: 'Barcelona',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    created_at: new Date().toISOString()
  },
  {
    id: 'rma',
    name: 'Real Madrid',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    created_at: new Date().toISOString()
  },
  {
    id: 'bay',
    name: 'Bayern Munich',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    created_at: new Date().toISOString()
  },
  {
    id: 'bvb',
    name: 'Borussia Dortmund',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    created_at: new Date().toISOString()
  }
];

// Initial Competitions Data
const competitionsData: CompetitionInsert[] = [
  {
    id: 'pl',
    name: 'Premier League',
    logo: '/leagues/premierleague.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'laliga',
    name: 'La Liga',
    logo: '/leagues/laliga.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    logo: '/leagues/bundesliga.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'ucl',
    name: 'Champions League',
    logo: '/leagues/championsleague.png',
    created_at: new Date().toISOString()
  }
];

// Initial Team Competitions Data
const teamCompetitionsData: TeamCompetitionInsert[] = [
  { id: 'tc1', team_id: 'mci', competition_id: 'pl', created_at: new Date().toISOString() },
  { id: 'tc2', team_id: 'ars', competition_id: 'pl', created_at: new Date().toISOString() },
  { id: 'tc3', team_id: 'fcb', competition_id: 'laliga', created_at: new Date().toISOString() },
  { id: 'tc4', team_id: 'rma', competition_id: 'laliga', created_at: new Date().toISOString() },
  { id: 'tc5', team_id: 'bay', competition_id: 'bundesliga', created_at: new Date().toISOString() },
  { id: 'tc6', team_id: 'bvb', competition_id: 'bundesliga', created_at: new Date().toISOString() },
  { id: 'tc7', team_id: 'mci', competition_id: 'ucl', created_at: new Date().toISOString() },
  { id: 'tc8', team_id: 'rma', competition_id: 'ucl', created_at: new Date().toISOString() },
  { id: 'tc9', team_id: 'bay', competition_id: 'ucl', created_at: new Date().toISOString() }
];

// Initial Match Highlights Data
const matchHighlightsData: MatchHighlightInsert[] = [
  {
    id: '1',
    title: 'Manchester City vs Arsenal',
    date: '2023-04-26T19:30:00Z',
    thumbnail_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGZvb3RiYWxsfGVufDB8fDB8fHww',
    video_url: 'https://www.youtube.com/watch?v=38qkI3jAl68',
    duration: '10:24',
    views: 1243000,
    home_team_id: 'mci',
    away_team_id: 'ars',
    home_score: 4,
    away_score: 1,
    competition_id: 'pl',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Barcelona vs Real Madrid',
    date: '2023-04-25T19:00:00Z',
    thumbnail_url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGZvb3RiYWxsfGVufDB8fDB8fHww',
    video_url: 'https://www.youtube.com/watch?v=MFb7LCqm6FE',
    duration: '12:08',
    views: 3567000,
    home_team_id: 'fcb',
    away_team_id: 'rma',
    home_score: 2,
    away_score: 3,
    competition_id: 'laliga',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Bayern Munich vs Borussia Dortmund',
    date: '2023-04-23T16:30:00Z',
    thumbnail_url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vdGJhbGx8ZW58MHx8MHx8fDA%3D',
    video_url: 'https://www.youtube.com/watch?v=sApmPP5ku5k',
    duration: '9:45',
    views: 1876000,
    home_team_id: 'bay',
    away_team_id: 'bvb',
    home_score: 3,
    away_score: 2,
    competition_id: 'bundesliga',
    created_at: new Date().toISOString()
  }
];

// Initial League Tables Data
const leagueTablesData: LeagueTableInsert[] = [
  // Premier League
  {
    id: 'pl-mci',
    team_id: 'mci',
    competition_id: 'pl',
    position: 1,
    played: 38,
    won: 29,
    drawn: 5,
    lost: 4,
    goals_for: 94,
    goals_against: 33,
    goal_difference: 61,
    points: 92,
    created_at: new Date().toISOString()
  },
  {
    id: 'pl-ars',
    team_id: 'ars',
    competition_id: 'pl',
    position: 2,
    played: 38,
    won: 26,
    drawn: 6,
    lost: 6,
    goals_for: 88,
    goals_against: 43,
    goal_difference: 45,
    points: 84,
    created_at: new Date().toISOString()
  },
  // La Liga
  {
    id: 'laliga-rma',
    team_id: 'rma',
    competition_id: 'laliga',
    position: 1,
    played: 38,
    won: 27,
    drawn: 8,
    lost: 3,
    goals_for: 76,
    goals_against: 29,
    goal_difference: 47,
    points: 89,
    created_at: new Date().toISOString()
  },
  {
    id: 'laliga-fcb',
    team_id: 'fcb',
    competition_id: 'laliga',
    position: 2,
    played: 38,
    won: 24,
    drawn: 10,
    lost: 4,
    goals_for: 70,
    goals_against: 40,
    goal_difference: 30,
    points: 82,
    created_at: new Date().toISOString()
  },
  // Bundesliga
  {
    id: 'bundesliga-bay',
    team_id: 'bay',
    competition_id: 'bundesliga',
    position: 1,
    played: 34,
    won: 25,
    drawn: 4,
    lost: 5,
    goals_for: 92,
    goals_against: 32,
    goal_difference: 60,
    points: 79,
    created_at: new Date().toISOString()
  },
  {
    id: 'bundesliga-bvb',
    team_id: 'bvb',
    competition_id: 'bundesliga',
    position: 2,
    played: 34,
    won: 22,
    drawn: 5,
    lost: 7,
    goals_for: 83,
    goals_against: 44,
    goal_difference: 39,
    points: 71,
    created_at: new Date().toISOString()
  },
  // Champions League
  {
    id: 'ucl-rma',
    team_id: 'rma',
    competition_id: 'ucl',
    position: 1,
    played: 13,
    won: 11,
    drawn: 1,
    lost: 1,
    goals_for: 28,
    goals_against: 10,
    goal_difference: 18,
    points: 34,
    created_at: new Date().toISOString()
  },
  {
    id: 'ucl-mci',
    team_id: 'mci',
    competition_id: 'ucl',
    position: 2,
    played: 13,
    won: 10,
    drawn: 2,
    lost: 1,
    goals_for: 31,
    goals_against: 11,
    goal_difference: 20,
    points: 32,
    created_at: new Date().toISOString()
  },
  {
    id: 'ucl-bay',
    team_id: 'bay',
    competition_id: 'ucl',
    position: 3,
    played: 12,
    won: 8,
    drawn: 2,
    lost: 2,
    goals_for: 27,
    goals_against: 14,
    goal_difference: 13,
    points: 26,
    created_at: new Date().toISOString()
  }
];

// Initial Fixtures Data
const fixturesData: FixtureInsert[] = [
  {
    id: 'fixture-1',
    home_team_id: 'mci',
    away_team_id: 'ars',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    competition_id: 'pl',
    venue: 'Etihad Stadium',
    created_at: new Date().toISOString()
  },
  {
    id: 'fixture-2',
    home_team_id: 'fcb',
    away_team_id: 'rma',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    competition_id: 'laliga',
    venue: 'Camp Nou',
    created_at: new Date().toISOString()
  },
  {
    id: 'fixture-3',
    home_team_id: 'bay',
    away_team_id: 'bvb',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    competition_id: 'bundesliga',
    venue: 'Allianz Arena',
    created_at: new Date().toISOString()
  },
  {
    id: 'fixture-4',
    home_team_id: 'rma',
    away_team_id: 'mci',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
    competition_id: 'ucl',
    venue: 'Santiago Bernabéu',
    created_at: new Date().toISOString()
  }
];

/**
 * Initialize the database with sample data
 */
export async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Create tables if they don't exist (this would normally be done with Supabase migrations)
    console.log('Setting up teams...');
    const { error: teamsError } = await supabase.from('teams').insert(teamsData);
    if (teamsError && teamsError.code !== '23505') { // Ignore duplicate key errors
      throw teamsError;
    }
    
    console.log('Setting up competitions...');
    const { error: competitionsError } = await supabase.from('competitions').insert(competitionsData);
    if (competitionsError && competitionsError.code !== '23505') {
      throw competitionsError;
    }
    
    console.log('Setting up team competitions...');
    const { error: teamCompError } = await supabase.from('team_competitions').insert(teamCompetitionsData);
    if (teamCompError && teamCompError.code !== '23505') {
      throw teamCompError;
    }
    
    console.log('Setting up match highlights...');
    const { error: highlightsError } = await supabase.from('match_highlights').insert(matchHighlightsData);
    if (highlightsError && highlightsError.code !== '23505') {
      throw highlightsError;
    }
    
    console.log('Setting up league tables...');
    const { error: tablesError } = await supabase.from('league_tables').insert(leagueTablesData);
    if (tablesError && tablesError.code !== '23505') {
      throw tablesError;
    }
    
    console.log('Setting up fixtures...');
    const { error: fixturesError } = await supabase.from('fixtures').insert(fixturesData);
    if (fixturesError && fixturesError.code !== '23505') {
      throw fixturesError;
    }
    
    console.log('Database initialization complete!');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  }
}

// Uncomment this line to run the initialization
// initializeDatabase();
