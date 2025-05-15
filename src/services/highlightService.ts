
import { fetchHighlightsFromApi } from './apiService';
import { MatchHighlight, League, Team, TeamDetails, TableRow, Fixture } from '@/types';

// Transform the API response into our MatchHighlight format
const transformApiHighlight = (highlight: any): MatchHighlight => {
  return {
    id: highlight.matchId || highlight.id || String(Math.random()),
    title: `${highlight.homeTeam.name} vs ${highlight.awayTeam.name}`,
    date: highlight.date || new Date().toISOString(),
    thumbnailUrl: highlight.thumbnailUrl || highlight.thumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
    videoUrl: highlight.video || highlight.videoUrl || '',
    duration: highlight.duration || '10:00',
    views: highlight.views || Math.floor(Math.random() * 1000000),
    homeTeam: {
      id: highlight.homeTeam.id || String(highlight.homeTeam.name).toLowerCase().replace(/\s/g, '-'),
      name: highlight.homeTeam.name,
      logo: highlight.homeTeam.logo || `https://api.sofascore.app/api/v1/team/${highlight.homeTeam.id}/logo`
    },
    awayTeam: {
      id: highlight.awayTeam.id || String(highlight.awayTeam.name).toLowerCase().replace(/\s/g, '-'),
      name: highlight.awayTeam.name,
      logo: highlight.awayTeam.logo || `https://api.sofascore.app/api/v1/team/${highlight.awayTeam.id}/logo`
    },
    score: {
      home: highlight.homeGoals || 0,
      away: highlight.awayGoals || 0
    },
    competition: {
      id: highlight.competition?.id || String(highlight.competition?.name).toLowerCase().replace(/\s/g, '-'),
      name: highlight.competition?.name || 'Unknown',
      logo: highlight.competition?.logo || '/placeholder.svg'
    }
  };
};

// Group highlights by competition/league
const groupHighlightsByLeague = (highlights: MatchHighlight[]): League[] => {
  const leaguesMap = new Map<string, League>();
  
  highlights.forEach(highlight => {
    const leagueId = highlight.competition.id;
    
    if (!leaguesMap.has(leagueId)) {
      leaguesMap.set(leagueId, {
        id: leagueId,
        name: highlight.competition.name,
        logo: highlight.competition.logo,
        highlights: []
      });
    }
    
    leaguesMap.get(leagueId)?.highlights.push(highlight);
  });
  
  return Array.from(leaguesMap.values());
};

// Get recommended highlights from API
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  try {
    // Fetch data from the API using our Supabase Edge Function
    const apiResponse = await fetchHighlightsFromApi();
    
    if (!apiResponse || !Array.isArray(apiResponse.highlights)) {
      console.warn('Invalid API response format, falling back to mock data');
      throw new Error('Invalid API response format');
    }
    
    console.log('API highlights:', apiResponse.highlights);
    
    // Transform API response to our format
    const transformedHighlights = apiResponse.highlights
      .map(transformApiHighlight)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent
    
    return transformedHighlights;
  } catch (error) {
    console.error('Error getting recommended highlights:', error);
    // Return an empty array if there's an error
    return [];
  }
};

// Get highlights grouped by league from API
export const getLeagueHighlights = async (): Promise<League[]> => {
  try {
    const highlights = await getRecommendedHighlights();
    
    if (!highlights || highlights.length === 0) {
      throw new Error('No highlights available');
    }
    
    // Group the highlights by league
    const leagues = groupHighlightsByLeague(highlights);
    
    return leagues;
  } catch (error) {
    console.error('Error getting league highlights:', error);
    // Return an empty array if there's an error
    return [];
  }
};

// Get a specific match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  try {
    // Try to fetch the specific match from the API
    const apiResponse = await fetchHighlightsFromApi(id);
    
    if (apiResponse && apiResponse.highlights && apiResponse.highlights[0]) {
      return transformApiHighlight(apiResponse.highlights[0]);
    }
    
    // If not found in specific API call, check in all highlights
    const allHighlights = await getRecommendedHighlights();
    const match = allHighlights.find(highlight => highlight.id === id);
    
    return match || null;
  } catch (error) {
    console.error('Error getting match by ID:', error);
    return null;
  }
};

// Search highlights based on a query string
export const searchHighlights = async (query: string): Promise<MatchHighlight[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  const highlights: MatchHighlight[] = [];
  
  // Get all highlights from all leagues
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    for (const highlight of league.highlights) {
      // Search in team names, match title, competition name
      if (
        highlight.homeTeam.name.toLowerCase().includes(normalizedQuery) ||
        highlight.awayTeam.name.toLowerCase().includes(normalizedQuery) ||
        highlight.title.toLowerCase().includes(normalizedQuery) ||
        highlight.competition.name.toLowerCase().includes(normalizedQuery)
      ) {
        highlights.push(highlight);
      }
    }
  }
  
  // Sort by date, most recent first
  return highlights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Method to get team details including standings and fixtures
export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // First find the team in our existing data
  let team: Team | null = null;
  
  // Check recommended highlights
  const recommendedHighlights = await getRecommendedHighlights();
  for (const highlight of recommendedHighlights) {
    if (highlight.homeTeam.id === teamId) {
      team = highlight.homeTeam;
      break;
    }
    if (highlight.awayTeam.id === teamId) {
      team = highlight.awayTeam;
      break;
    }
  }
  
  // If not found, check league highlights
  if (!team) {
    const leagues = await getLeagueHighlights();
    outerLoop: for (const league of leagues) {
      for (const highlight of league.highlights) {
        if (highlight.homeTeam.id === teamId) {
          team = highlight.homeTeam;
          break outerLoop;
        }
        if (highlight.awayTeam.id === teamId) {
          team = highlight.awayTeam;
          break outerLoop;
        }
      }
    }
  }
  
  if (!team) return null;
  
  // Find which league this team belongs to
  let teamLeague = '';
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    const hasTeam = league.highlights.some(
      highlight => highlight.homeTeam.id === teamId || highlight.awayTeam.id === teamId
    );
    if (hasTeam) {
      teamLeague = league.name;
      break;
    }
  }
  
  // Create mock data for team details
  let europeanCompetition: string | null = null;
  
  // Assign European competition based on team ID
  switch (teamId) {
    case 'mci':
    case 'liv':
    case 'fcb':
    case 'rma':
    case 'bay':
      europeanCompetition = 'UEFA Champions League';
      break;
    case 'ars':
    case 'che':
    case 'atm':
      europeanCompetition = 'UEFA Europa League';
      break;
    case 'tot':
    case 'sev':
      europeanCompetition = 'UEFA Conference League';
      break;
    default:
      europeanCompetition = null;
  }
  
  // Generate league table with the team in a realistic position
  const leagueTable: TableRow[] = generateLeagueTable(teamId, teamLeague);
  
  // Generate European table if applicable
  const europeanTable: TableRow[] = europeanCompetition 
    ? generateEuropeanTable(teamId, europeanCompetition) 
    : [];
  
  // Get the position of the team in the league table
  const teamLeaguePosition = leagueTable.find(row => row.team.id === teamId)?.position || 0;
  const teamEuropeanPosition = europeanTable.find(row => row.team.id === teamId)?.position || 0;
  
  // Generate fixtures
  const fixtures: Fixture[] = generateFixtures(teamId, teamLeague, europeanCompetition);
  
  return {
    team,
    leagueStanding: `${teamLeaguePosition}${getOrdinalSuffix(teamLeaguePosition)}`,
    europeanCompetition,
    europeanStanding: europeanCompetition ? `${teamEuropeanPosition}${getOrdinalSuffix(teamEuropeanPosition)}` : null,
    leagueTable,
    europeanTable,
    fixtures
  };
};

// Method to get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const highlights: MatchHighlight[] = [];
  
  // First, check recommended highlights
  const recommendedHighlights = await getRecommendedHighlights();
  const teamHighlightsFromRecommended = recommendedHighlights.filter(
    highlight => highlight.homeTeam.id === teamId || highlight.awayTeam.id === teamId
  );
  highlights.push(...teamHighlightsFromRecommended);
  
  // Then check all league highlights
  const leagues = await getLeagueHighlights();
  for (const league of leagues) {
    const teamHighlightsFromLeague = league.highlights.filter(
      highlight => highlight.homeTeam.id === teamId || highlight.awayTeam.id === teamId
    );
    highlights.push(...teamHighlightsFromLeague);
  }
  
  // Sort by date, most recent first
  return highlights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Helper function to get ordinal suffix for numbers
const getOrdinalSuffix = (i: number): string => {
  const j = i % 10,
        k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

// Generate a realistic league table
const generateLeagueTable = (teamId: string, leagueName: string): TableRow[] => {
  const teams: Team[] = [];
  
  // Get team data based on the league
  switch (leagueName) {
    case 'Premier League':
      teams.push(
        { id: 'mci', name: 'Manchester City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
        { id: 'liv', name: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
        { id: 'ars', name: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
        { id: 'manu', name: 'Manchester United', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
        { id: 'tot', name: 'Tottenham', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
        { id: 'che', name: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
        { id: 'avl', name: 'Aston Villa', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg' },
        { id: 'new', name: 'Newcastle', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg' }
      );
      break;
    case 'La Liga':
      teams.push(
        { id: 'rma', name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
        { id: 'fcb', name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
        { id: 'atm', name: 'Atletico Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
        { id: 'sev', name: 'Sevilla', logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' },
        { id: 'vil', name: 'Villarreal', logo: 'https://upload.wikimedia.org/wikipedia/en/4/4b/Villarreal_CF_badge.svg' },
        { id: 'rso', name: 'Real Sociedad', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg' }
      );
      break;
    case 'Bundesliga':
      teams.push(
        { id: 'bay', name: 'Bayern Munich', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
        { id: 'bvb', name: 'Borussia Dortmund', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg' },
        { id: 'rbl', name: 'RB Leipzig', logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg' },
        { id: 'b04', name: 'Bayer Leverkusen', logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
        { id: 'bmg', name: 'Borussia Monchengladbach', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg' },
        { id: 'wob', name: 'Wolfsburg', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg' }
      );
      break;
    default:
      break;
  }
  
  // Make sure our team is in the list
  const teamIndex = teams.findIndex(team => team.id === teamId);
  if (teamIndex === -1) {
    // If the requested team is not part of our standard teams for this league,
    // add a generic one
    teams.push({
      id: teamId,
      name: "Team " + teamId.toUpperCase(),
      logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
    });
  }
  
  // Generate standings, favoring the requested team to be in top 4
  const targetPosition = Math.min(Math.floor(Math.random() * 4) + 1, teams.length);
  
  // Create table rows
  const tableRows: TableRow[] = [];
  
  // Shuffle teams (except put the target team in its position)
  const nonTargetTeams = teams.filter(team => team.id !== teamId);
  const shuffled = [...nonTargetTeams].sort(() => 0.5 - Math.random());
  
  // Insert the target team at its position
  const targetTeam = teams.find(team => team.id === teamId);
  if (targetTeam) {
    shuffled.splice(targetPosition - 1, 0, targetTeam);
  }
  
  // Generate the table
  shuffled.forEach((team, index) => {
    const position = index + 1;
    
    // Generate random but realistic stats
    const played = 38; // Full season
    const baseWins = Math.floor(Math.random() * 8) + 8; // 8-15 wins
    
    // Teams at the top win more
    const positionFactor = Math.max(0, (teams.length - position) / teams.length);
    const additionalWins = Math.floor(positionFactor * 12); // Up to 12 more wins for top teams
    
    const won = baseWins + additionalWins;
    const drawn = Math.floor(Math.random() * 10) + 2; // 2-11 draws
    const lost = played - won - drawn;
    
    const goalsFor = won * 2 + drawn + Math.floor(Math.random() * 10);
    const goalsAgainst = lost * 2 + drawn - Math.floor(Math.random() * 5) + 5;
    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn;
    
    tableRows.push({
      position,
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points
    });
  });
  
  // Sort by points, then goal difference
  return tableRows.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }).map((row, index) => ({
    ...row,
    position: index + 1
  }));
};

// Generate a European competition table
const generateEuropeanTable = (teamId: string, competition: string): TableRow[] => {
  let teams: Team[] = [];
  
  // Different teams for different competitions
  switch (competition) {
    case 'UEFA Champions League':
      teams = [
        { id: 'mci', name: 'Manchester City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
        { id: 'liv', name: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
        { id: 'rma', name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
        { id: 'fcb', name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
        { id: 'bay', name: 'Bayern Munich', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
        { id: 'psg', name: 'Paris Saint-Germain', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
        { id: 'int', name: 'Inter Milan', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg' },
        { id: 'ben', name: 'Benfica', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg' }
      ];
      break;
    case 'UEFA Europa League':
      teams = [
        { id: 'ars', name: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
        { id: 'che', name: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
        { id: 'atm', name: 'Atletico Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
        { id: 'rom', name: 'Roma', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg' },
        { id: 'lev', name: 'Bayer Leverkusen', logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
        { id: 'por', name: 'Porto', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg' }
      ];
      break;
    case 'UEFA Conference League':
      teams = [
        { id: 'tot', name: 'Tottenham', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
        { id: 'sev', name: 'Sevilla', logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' },
        { id: 'whu', name: 'West Ham', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg' },
        { id: 'psv', name: 'PSV Eindhoven', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c1/PSV_Eindhoven.svg' },
        { id: 'ren', name: 'Rennes', logo: 'https://upload.wikimedia.org/wikipedia/en/5/5a/Stade_Rennais_FC.svg' },
        { id: 'bas', name: 'Basel', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/FC_Basel_crest.svg' }
      ];
      break;
    default:
      teams = [];
  }
  
  // Make sure our team is in the list
  const teamExists = teams.some(team => team.id === teamId);
  if (!teamExists) {
    teams.push({
      id: teamId,
      name: "Team " + teamId.toUpperCase(),
      logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
    });
  }
  
  // Generate standings, favoring the requested team to be higher
  const targetPosition = Math.min(Math.floor(Math.random() * 4) + 1, teams.length);
  
  // Create table rows with the same approach as the league table
  const tableRows: TableRow[] = [];
  
  // Shuffle teams (except put the target team in its position)
  const nonTargetTeams = teams.filter(team => team.id !== teamId);
  const shuffled = [...nonTargetTeams].sort(() => 0.5 - Math.random());
  
  // Insert the target team at its position
  const targetTeam = teams.find(team => team.id === teamId);
  if (targetTeam) {
    shuffled.splice(targetPosition - 1, 0, targetTeam);
  }
  
  // Generate the table with fewer games (group stage)
  shuffled.forEach((team, index) => {
    const position = index + 1;
    
    // European competition has fewer games
    const played = 6; // Group stage
    
    // Generate random but realistic stats
    const baseWins = Math.floor(Math.random() * 2) + 1; // 1-2 wins
    
    // Teams at the top win more
    const positionFactor = Math.max(0, (teams.length - position) / teams.length);
    const additionalWins = Math.floor(positionFactor * 4); // Up to 4 more wins for top teams
    
    const won = Math.min(played, baseWins + additionalWins);
    const drawn = Math.min(played - won, Math.floor(Math.random() * 3)); // 0-2 draws
    const lost = played - won - drawn;
    
    const goalsFor = won * 2 + drawn + Math.floor(Math.random() * 4);
    const goalsAgainst = lost * 2 + Math.floor(Math.random() * 2);
    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn;
    
    tableRows.push({
      position,
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points
    });
  });
  
  // Sort by points, then goal difference
  return tableRows.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }).map((row, index) => ({
    ...row,
    position: index + 1
  }));
};

// Generate fixtures for a team
const generateFixtures = (teamId: string, league: string, europeanCompetition: string | null): Fixture[] => {
  const fixtures: Fixture[] = [];
  const now = new Date();
  
  // Get possible opponents from both league and European competition
  const leagueTeams = generateLeagueTable(teamId, league)
    .filter(row => row.team.id !== teamId)
    .map(row => row.team);
  
  const europeanTeams = europeanCompetition 
    ? generateEuropeanTable(teamId, europeanCompetition)
        .filter(row => row.team.id !== teamId)
        .map(row => row.team)
    : [];
  
  // Generate 3-5 upcoming fixtures
  const fixtureCount = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < fixtureCount; i++) {
    // Alternate between home and away
    const isHome = i % 2 === 0;
    
    // Alternate between league and European matches if applicable
    const isEuropean = europeanCompetition && i % 3 === 1;
    
    // Select an opponent
    const opponents = isEuropean ? europeanTeams : leagueTeams;
    const opponent = opponents[Math.floor(Math.random() * opponents.length)];
    
    // Calculate date (each 3-7 days in the future)
    const daysToAdd = 3 + i * 4 + Math.floor(Math.random() * 4);
    const fixtureDate = new Date(now);
    fixtureDate.setDate(fixtureDate.getDate() + daysToAdd);
    
    // Set a random time
    const hours = Math.floor(Math.random() * 8) + 12; // Between 12:00 and 20:00
    const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; // 00, 15, 30, or 45 minutes
    fixtureDate.setHours(hours, minutes);
    
    // Grab our team info
    const ourTeam: Team = {
      id: teamId,
      name: "Team " + teamId.toUpperCase(),
      logo: "https://www.sofascore.com/static/images/placeholders/team.svg"
    };
    
    // Look for our team's info in league table
    const leagueTable = generateLeagueTable(teamId, league);
    const ourTeamInfo = leagueTable.find(row => row.team.id === teamId);
    if (ourTeamInfo) {
      ourTeam.name = ourTeamInfo.team.name;
      ourTeam.logo = ourTeamInfo.team.logo;
    }
    
    fixtures.push({
      id: `fixture-${i}`,
      homeTeam: isHome ? ourTeam : opponent,
      awayTeam: isHome ? opponent : ourTeam,
      date: fixtureDate.toISOString(),
      competition: isEuropean ? europeanCompetition! : league,
      venue: isHome ? `${ourTeam.name} Stadium` : `${opponent.name} Stadium`
    });
  }
  
  // Sort by date
  return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
