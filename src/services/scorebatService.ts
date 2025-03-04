import { MatchHighlight, League, ScorebatVideo, ScorebatResponse, ScorebatMapper, Team } from '@/types';
import { PREMIER_LEAGUE_ID, SCOREBAT_API_TOKEN } from './fallbackService';

// API constants based on the official documentation
const SCOREBAT_API_URL = 'https://www.scorebat.com/video-api/v3';
const SCOREBAT_FEED_ENDPOINT = `${SCOREBAT_API_URL}/feed`;
const SCOREBAT_COMPETITION_ENDPOINT = `${SCOREBAT_API_URL}/competition`;
const SCOREBAT_TEAM_ENDPOINT = `${SCOREBAT_API_URL}/team`;

// Widget access (free) alternative endpoints
const SCOREBAT_WIDGET_URL = 'https://www.scorebat.com/embed/';

// Reduced CORS proxies to just the most reliable one
const CORS_PROXIES = [
  'https://corsproxy.io/?',
];

// Request timeouts
const API_TIMEOUT = 8000; // 8 seconds timeout for API requests

// Create a map of competition names to league IDs
const competitionToLeagueMap: Record<string, { id: string, logo: string }> = {
  'ENGLAND: Premier League': { id: 'england-premier-league', logo: '/leagues/premierleague.png' },
  'SPAIN: La Liga': { id: 'spain-la-liga', logo: '/leagues/laliga.png' },
  'GERMANY: Bundesliga': { id: 'germany-bundesliga', logo: '/leagues/bundesliga.png' },
  'ITALY: Serie A': { id: 'italy-serie-a', logo: '/leagues/seriea.png' },
  'FRANCE: Ligue 1': { id: 'france-ligue-1', logo: '/leagues/ligue1.png' },
  'NETHERLANDS: Eredivisie': { id: 'netherlands-eredivisie', logo: '/leagues/eredivisie.png' },
  'PORTUGAL: Liga Portugal': { id: 'portugal-liga-portugal', logo: '/leagues/portugal.png' },
  'CHAMPIONS LEAGUE': { id: 'champions-league', logo: '/leagues/ucl.png' },
  'EUROPA LEAGUE': { id: 'europa-league', logo: '/leagues/uel.png' },
  'COLOMBIA: Primera Division, Apertura': { id: 'colombia-primera-a', logo: '/leagues/other.png' },
  'ARGENTINA: Liga Profesional': { id: 'argentina-liga', logo: '/leagues/other.png' },
  'BRAZIL: Serie A': { id: 'brazil-serie-a', logo: '/leagues/other.png' },
  'USA: MLS': { id: 'usa-mls', logo: '/leagues/other.png' },
  'INTERNATIONAL: Club Friendlies': { id: 'club-friendlies', logo: '/leagues/other.png' },
  'INTERNATIONAL: FIFA World Cup': { id: 'world-cup', logo: '/leagues/other.png' },
  'INTERNATIONAL: UEFA Nations League': { id: 'nations-league', logo: '/leagues/other.png' },
  'ENGLAND: FA Cup': { id: 'england-fa-cup', logo: '/leagues/other.png' },
  'ENGLAND: EFL Cup': { id: 'england-efl-cup', logo: '/leagues/other.png' },
  'SPAIN: Copa del Rey': { id: 'spain-copa-del-rey', logo: '/leagues/other.png' },
  'ITALY: Coppa Italia': { id: 'italy-coppa-italia', logo: '/leagues/other.png' },
  'GERMANY: DFB Pokal': { id: 'germany-dfb-pokal', logo: '/leagues/other.png' },
  'FRANCE: Coupe de France': { id: 'france-coupe', logo: '/leagues/other.png' },
};

// Map of team name to ID and logo
const teamMap: Record<string, { id: string, logo: string }> = {
  // Premier League
  'Arsenal': { id: 'arsenal', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Aston Villa': { id: 'aston-villa', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bournemouth': { id: 'bournemouth', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Brentford': { id: 'brentford', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Brighton': { id: 'brighton', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Chelsea': { id: 'chelsea', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Crystal Palace': { id: 'crystal-palace', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Everton': { id: 'everton', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Fulham': { id: 'fulham', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Leeds': { id: 'leeds', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Leicester City': { id: 'leicester-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Liverpool': { id: 'liverpool', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Manchester City': { id: 'manchester-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Manchester United': { id: 'manchester-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Newcastle United': { id: 'newcastle-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Nottingham Forest': { id: 'nottingham-forest', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Southampton': { id: 'southampton', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Tottenham Hotspur': { id: 'tottenham-hotspur', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'West Ham United': { id: 'west-ham-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Wolves': { id: 'wolves', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Championship
  'Birmingham': { id: 'birmingham', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Blackburn': { id: 'blackburn', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Blackpool': { id: 'blackpool', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bristol City': { id: 'bristol-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Burnley': { id: 'burnley', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Cardiff City': { id: 'cardiff-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Coventry': { id: 'coventry', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Huddersfield': { id: 'huddersfield', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Hull City': { id: 'hull-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Luton': { id: 'luton', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Middlesbrough': { id: 'middlesbrough', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Millwall': { id: 'millwall', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Norwich City': { id: 'norwich-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Preston NE': { id: 'preston-ne', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'QPR': { id: 'qpr', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Reading': { id: 'reading', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Rotherham': { id: 'rotherham', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sheffield United': { id: 'sheffield-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Stoke City': { id: 'stoke-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sunderland': { id: 'sunderland', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Swansea City': { id: 'swansea-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Watford': { id: 'watford', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'West Bromwich Albion': { id: 'west-bromwich-albion', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Wigan': { id: 'wigan', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // La Liga
  'Atletico Madrid': { id: 'atletico-madrid', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Barcelona': { id: 'barcelona', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Real Madrid': { id: 'real-madrid', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Almeria': { id: 'almeria', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Athletic Bilbao': { id: 'athletic-bilbao', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Cadiz': { id: 'cadiz', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Celta Vigo': { id: 'celta-vigo', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Elche': { id: 'elche', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Espanyol': { id: 'espanyol', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Getafe': { id: 'getafe', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Girona': { id: 'girona', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Mallorca': { id: 'mallorca', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Osasuna': { id: 'osasuna', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Rayo Vallecano': { id: 'rayo-vallecano', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Real Betis': { id: 'real-betis', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Real Sociedad': { id: 'real-sociedad', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Real Valladolid': { id: 'real-valladolid', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sevilla': { id: 'sevilla', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Valencia': { id: 'valencia', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Villarreal': { id: 'villarreal', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Serie A
  'AC Milan': { id: 'ac-milan', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Atalanta': { id: 'atalanta', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bologna': { id: 'bologna', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Cremonese': { id: 'cremonese', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Empoli': { id: 'empoli', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Fiorentina': { id: 'fiorentina', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Inter Milan': { id: 'inter-milan', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Juventus': { id: 'juventus', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Lazio': { id: 'lazio', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Lecce': { id: 'lecce', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Monza': { id: 'monza', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Napoli': { id: 'napoli', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Roma': { id: 'roma', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Salernitana': { id: 'salernitana', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sampdoria': { id: 'sampdoria', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sassuolo': { id: 'sassuolo', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Spezia': { id: 'spezia', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Torino': { id: 'torino', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Udinese': { id: 'udinese', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Verona': { id: 'verona', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Bundesliga
  'Augsburg': { id: 'augsburg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bayern Munich': { id: 'bayern-munich', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bayer Leverkusen': { id: 'bayer-leverkusen', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bochum': { id: 'bochum', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Borussia Dortmund': { id: 'borussia-dortmund', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Borussia Monchengladbach': { id: 'borussia-monchengladbach', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Eintracht Frankfurt': { id: 'eintracht-frankfurt', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Hertha Berlin': { id: 'hertha-berlin', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Hoffenheim': { id: 'hoffenheim', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Koln': { id: 'koln', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Mainz': { id: 'mainz', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'RB Leipzig': { id: 'rb-leipzig', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'SC Freiburg': { id: 'sc-freiburg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Schalke': { id: 'schalke', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Stuttgart': { id: 'stuttgart', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Union Berlin': { id: 'union-berlin', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Werder Bremen': { id: 'werder-bremen', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Wolfsburg': { id: 'wolfsburg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },

  // Ligue 1
  'Ajaccio': { id: 'ajaccio', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Angers': { id: 'angers', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Auxerre': { id: 'auxerre', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Brest': { id: 'brest', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Clermont': { id: 'clermont', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Lens': { id: 'lens', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Lille': { id: 'lille', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Lorient': { id: 'lorient', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Lyon': { id: 'lyon', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Marseille': { id: 'marseille', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Monaco': { id: 'monaco', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Montpellier': { id: 'montpellier', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Nantes': { id: 'nantes', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Nice': { id: 'nice', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'PSG': { id: 'psg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Reims': { id: 'reims', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Rennes': { id: 'rennes', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Strasbourg': { id: 'strasbourg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Toulouse': { id: 'toulouse', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Troyes': { id: 'troyes', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Dutch Eredivisie
  'Ajax': { id: 'ajax', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'AZ': { id: 'az', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Cambuur Leeuwarden': { id: 'cambuur-leeuwarden', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Emmen': { id: 'emmen', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Excelsior': { id: 'excelsior', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Feyenoord': { id: 'feyenoord', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Fortuna Sittard': { id: 'fortuna-sittard', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Go Ahead Eagles': { id: 'go-ahead-eagles', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Groningen': { id: 'groningen', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'NEC': { id: 'nec', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'PSV': { id: 'psv', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'RKC': { id: 'rkc', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sparta Rotterdam': { id: 'sparta-rotterdam', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Twente': { id: 'twente', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Utrecht': { id: 'utrecht', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Vitesse': { id: 'vitesse', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Volendam': { id: 'volendam', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Portuguese Liga
  'Benfica': { id: 'benfica', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Porto': { id: 'porto', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Sporting': { id: 'sporting', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Greek Super League
  'AEK': { id: 'aek', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Olympiakos': { id: 'olympiakos', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Panathinaikos': { id: 'panathinaikos', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'PAOK': { id: 'paok', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Turkish Super Lig
  'Besiktas': { id: 'besiktas', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Fenerbahce': { id: 'fenerbahce', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Galatasaray': { id: 'galatasaray', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // National Teams
  'Argentina': { id: 'argentina', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Belgium': { id: 'belgium', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Brazil': { id: 'brazil', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'England': { id: 'england', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'France': { id: 'france', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Germany': { id: 'germany', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Italy': { id: 'italy', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Netherlands': { id: 'netherlands', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Portugal': { id: 'portugal', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Spain': { id: 'spain', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Other notable teams
  'Celtic': { id: 'celtic', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Rangers': { id: 'rangers', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Inter Miami FC': { id: 'inter-miami-fc', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Al Nassr': { id: 'al-nassr', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  
  // Add common alternative naming patterns
  'Man United': { id: 'manchester-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Man Utd': { id: 'manchester-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Man City': { id: 'manchester-city', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Spurs': { id: 'tottenham-hotspur', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Atletico': { id: 'atletico-madrid', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Barca': { id: 'barcelona', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Barça': { id: 'barcelona', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Real': { id: 'real-madrid', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Bayern': { id: 'bayern-munich', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Juve': { id: 'juventus', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Inter': { id: 'inter-milan', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Paris Saint-Germain': { id: 'psg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Paris Saint Germain': { id: 'psg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Paris SG': { id: 'psg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Newcastle': { id: 'newcastle-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'West Ham': { id: 'west-ham-united', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Brighton & Hove Albion': { id: 'brighton', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Brighton and Hove Albion': { id: 'brighton', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Athletic Club': { id: 'athletic-bilbao', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Milan': { id: 'ac-milan', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Dortmund': { id: 'borussia-dortmund', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Gladbach': { id: 'borussia-monchengladbach', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Leipzig': { id: 'rb-leipzig', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Leverkusen': { id: 'bayer-leverkusen', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Frankfurt': { id: 'eintracht-frankfurt', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
  'Wolfsburg VfL': { id: 'wolfsburg', logo: 'https://www.sofascore.com/static/images/placeholders/team.svg' },
};

// Get the active API token (env var or default)
const getApiToken = (): string => {
  return import.meta.env.VITE_SCOREBAT_API_TOKEN || SCOREBAT_API_TOKEN;
};

// Helper for request with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Helper to extract team info from Scorebat data
const extractTeamInfo = (teamData: { name: string, url: string } | string | undefined): Team => {
  let teamName = '';
  let teamUrl = '';
  
  if (typeof teamData === 'string') {
    teamName = teamData;
  } else if (teamData && typeof teamData === 'object') {
    teamName = teamData.name || 'Unknown';
    teamUrl = teamData.url || '';
  } else {
    teamName = 'Unknown';
  }
  
  // Look up the team in our map
  const teamLookup = teamMap[teamName];
  if (teamLookup) {
    return {
      id: teamLookup.id,
      name: teamName,
      logo: teamLookup.logo
    };
  }
  
  // If not found in our map, derive ID from name or URL
  const id = teamUrl ? new URL(teamUrl).pathname.split('/').pop() || 
           teamName.toLowerCase().replace(/\s+/g, '-') : 
           teamName.toLowerCase().replace(/\s+/g, '-');
           
  return {
    id,
    name: teamName,
    logo: `https://www.sofascore.com/static/images/placeholders/team.svg`
  };
};

// Helper to extract duration from embed code (approximate, as Scorebat doesn't provide duration)
const extractDuration = (): string => {
  const minutes = Math.floor(Math.random() * 7) + 5;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// Helper to extract views (Scorebat doesn't provide views, so we generate a random number)
const generateViews = (): number => {
  return Math.floor(Math.random() * 900000) + 100000;
};

// Helper to extract score from title (approximate, as Scorebat doesn't provide structured score data)
const extractScoreFromTitle = (title: string): { home: number, away: number } => {
  const scoreRegex = /(\d+)\s*-\s*(\d+)/;
  const match = title.match(scoreRegex);
  
  if (match && match.length >= 3) {
    return {
      home: parseInt(match[1], 10),
      away: parseInt(match[2], 10)
    };
  }
  
  return {
    home: 0,
    away: 0
  };
};

// Helper to extract team names from title when API doesn't provide them
const extractTeamsFromTitle = (title: string): { homeName: string, awayName: string } => {
  const vsPatterns = [
    /^(.+?)\s+vs\s+(.+?)(?:\s+-\s+|$|\s+\d+-\d+)/i,
    /^(.+?)\s+-\s+(.+?)(?:\s+\d+-\d+|\s+\(|$)/i,
    /^(.+?)\s+v\s+(.+?)(?:\s+-\s+|$|\s+\d+-\d+)/i,
    /^(.+?)[\s-]+(\d+)[^\d]+(\d+)[\s-]+(.+?)(?:\s+\||$)/i, // Format: Team1 2-1 Team2
  ];
  
  for (const pattern of vsPatterns) {
    const match = title.match(pattern);
    if (match && match.length >= 3) {
      // For the score-in-middle pattern (Team1 2-1 Team2)
      if (match.length >= 5 && /\d+/.test(match[2])) {
        return {
          homeName: match[1].trim(),
          awayName: match[4].trim()
        };
      }
      
      return {
        homeName: match[1].trim(),
        awayName: match[2].trim()
      };
    }
  }
  
  return {
    homeName: 'Unknown',
    awayName: 'Unknown'
  };
};

// Mapper to convert Scorebat data to our application format
const scorebatMapper: ScorebatMapper = {
  mapToMatchHighlight: (video: ScorebatVideo): MatchHighlight => {
    let homeTeam = extractTeamInfo(video.side1 || video.team1);
    let awayTeam = extractTeamInfo(video.side2 || video.team2);
    
    if ((homeTeam.name === 'Unknown' || awayTeam.name === 'Unknown')) {
      const { homeName, awayName } = extractTeamsFromTitle(video.title);
      
      if (homeName !== 'Unknown' && homeTeam.name === 'Unknown') {
        const teamInfo = teamMap[homeName];
        if (teamInfo) {
          homeTeam = {
            id: teamInfo.id,
            name: homeName,
            logo: teamInfo.logo
          };
        } else {
          homeTeam = {
            id: homeName.toLowerCase().replace(/\s+/g, '-'),
            name: homeName,
            logo: homeTeam.logo
          };
        }
      }
      
      if (awayName !== 'Unknown' && awayTeam.name === 'Unknown') {
        const teamInfo = teamMap[awayName];
        if (teamInfo) {
          awayTeam = {
            id: teamInfo.id,
            name: awayName,
            logo: teamInfo.logo
          };
        } else {
          awayTeam = {
            id: awayName.toLowerCase().replace(/\s+/g, '-'),
            name: awayName,
            logo: awayTeam.logo
          };
        }
      }
    }
    
    const competitionName = typeof video.competition === 'string' 
      ? video.competition 
      : (video.competition?.name || 'Unknown');
      
    const competitionInfo = competitionToLeagueMap[competitionName] || 
                          { id: competitionName.toLowerCase().replace(/[\s:,]+/g, '-'), logo: '/leagues/other.png' };
    
    const score = extractScoreFromTitle(video.title);
    
    return {
      id: video.matchId || video.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: video.title,
      date: video.date,
      thumbnailUrl: video.thumbnail || video.image,
      videoUrl: video.matchviewUrl || video.url,
      duration: extractDuration(),
      views: generateViews(),
      homeTeam,
      awayTeam,
      score,
      competition: {
        id: competitionInfo.id,
        name: competitionName,
        logo: competitionInfo.logo
      }
    };
  },
  
  mapToLeagues: (videos: ScorebatVideo[]): League[] => {
    const leagueMap = new Map<string, ScorebatVideo[]>();
    
    videos.forEach(video => {
      const competitionName = video.competition.name;
      if (!leagueMap.has(competitionName)) {
        leagueMap.set(competitionName, []);
      }
      leagueMap.get(competitionName)?.push(video);
    });
    
    const leagues: League[] = [];
    
    leagueMap.forEach((videos, competitionName) => {
      const competitionInfo = competitionToLeagueMap[competitionName] || 
                              { id: competitionName.toLowerCase().replace(/[\s:]+/g, '-'), logo: '/leagues/other.png' };
      
      const highlights = videos.map(video => scorebatMapper.mapToMatchHighlight(video));
      
      leagues.push({
        id: competitionInfo.id,
        name: competitionName,
        logo: competitionInfo.logo,
        highlights
      });
    });
    
    return leagues;
  }
};

// Fetch videos from Scorebat API main feed endpoint
export const fetchScorebatVideos = async (): Promise<ScorebatVideo[]> => {
  console.log('Starting fetchScorebatVideos with proper API endpoint');
  
  const token = getApiToken();
  
  if (!token) {
    throw new Error('No API token available');
  }
  
  try {
    const apiUrl = `${SCOREBAT_FEED_ENDPOINT}?token=${token}`;
    console.log('Calling Scorebat feed API with token');
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Feed API response structure:', Object.keys(data));
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} videos in feed`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} videos in feed (direct array)`);
      return transformVideoArray(data);
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid API response format - expected array or {response: array}');
    }
  } catch (error) {
    console.error('Error fetching from Scorebat API:', error);
    throw error;
  }
};

// Direct API call for Premier League highlights
export const fetchPremierLeagueVideos = async (): Promise<ScorebatVideo[]> => {
  try {
    console.log('Fetching Premier League highlights using direct API with token...');
    
    const token = getApiToken();
    const apiUrl = `${SCOREBAT_COMPETITION_ENDPOINT}/${PREMIER_LEAGUE_ID}/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    }, 8000);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Premier League API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Premier League API response structure:', typeof data, Array.isArray(data) ? 'array' : Object.keys(data));
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} Premier League videos`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} Premier League videos (array format)`);
      return transformVideoArray(data);
    }
    
    console.error('Unexpected Premier League API response format:', data);
    throw new Error('Invalid Premier League API response format');
  } catch (error) {
    console.error('Error fetching Premier League highlights:', error);
    throw error;
  }
};

// Fetch data for a specific competition
export const fetchCompetitionVideos = async (competitionId: string): Promise<ScorebatVideo[]> => {
  try {
    console.log(`Fetching competition ${competitionId} highlights...`);
    
    const token = getApiToken();
    const apiUrl = `${SCOREBAT_COMPETITION_ENDPOINT}/${competitionId}/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Competition API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} videos for competition ${competitionId}`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} videos for competition ${competitionId}`);
      return transformVideoArray(data);
    }
    
    throw new Error('Invalid competition API response format');
  } catch (error) {
    console.error(`Error fetching competition ${competitionId} highlights:`, error);
    throw error;
  }
};

// Fetch data for a specific team
export const fetchTeamVideos = async (teamId: string): Promise<ScorebatVideo[]> => {
  try {
    console.log(`Fetching team ${teamId} highlights...`);
    
    const token = getApiToken();
    const apiUrl = `${SCOREBAT_TEAM_ENDPOINT}/${teamId}/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Team API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.response && Array.isArray(data.response)) {
      console.log(`Found ${data.response.length} videos for team ${teamId}`);
      return transformVideoArray(data.response);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} videos for team ${teamId}`);
      return transformVideoArray(data);
    }
    
    throw new Error('Invalid team API response format');
  } catch (error) {
    console.error(`Error fetching team ${teamId} highlights:`, error);
    throw error;
  }
};

// Helper to transform an array of video objects with flexible format handling
const transformVideoArray = (videoArray: any[]): ScorebatVideo[] => {
  console.log('First video object structure:', videoArray.length > 0 ? Object.keys(videoArray[0]) : 'empty array');
  
  if (videoArray.length > 0) {
    const sampleVideo = videoArray[0];
    console.log('Sample competition:', sampleVideo.competition);
    console.log('Sample team1/side1:', sampleVideo.side1 || sampleVideo.team1);
    console.log('Sample team2/side2:', sampleVideo.side2 || sampleVideo.team2);
    console.log('Sample title:', sampleVideo.title);
  }
  
  return videoArray.map((item: any) => {
    const competition = typeof item.competition === 'string' 
      ? { id: '', name: item.competition, url: '' }
      : item.competition || { id: '', name: 'Unknown', url: '' };
      
    let side1, side2;
    
    if (item.side1) {
      side1 = typeof item.side1 === 'string' 
        ? { name: item.side1, url: '' }
        : item.side1;
    } else if (item.team1) {
      side1 = typeof item.team1 === 'string'
        ? { name: item.team1, url: '' }
        : {
            name: item.team1?.name || 'Unknown',
            url: item.team1?.url || '',
          };
    } else {
      const { homeName } = extractTeamsFromTitle(item.title || '');
      side1 = {
        name: homeName,
        url: '',
      };
    }
    
    if (item.side2) {
      side2 = typeof item.side2 === 'string'
        ? { name: item.side2, url: '' }
        : item.side2;
    } else if (item.team2) {
      side2 = typeof item.team2 === 'string'
        ? { name: item.team2, url: '' }
        : {
            name: item.team2?.name || 'Unknown',
            url: item.team2?.url || '',
          };
    } else {
      const { awayName } = extractTeamsFromTitle(item.title || '');
      side2 = {
        name: awayName,
        url: '',
      };
    }
    
    return {
      id: item.matchId || item.id || `scorebat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title || `${side1.name} vs ${side2.name}`,
      embed: item.embed || '',
      url: item.matchviewUrl || item.url || '',
      thumbnail: item.thumbnail || item.image || '',
      date: item.date || new Date().toISOString(),
      competition: competition,
      matchviewUrl: item.matchviewUrl || item.url || '',
      competitionUrl: item.competitionUrl || competition.url || '',
      side1: side1,
      side2: side2,
      team1: {
        name: side1.name || 'Unknown',
        url: side1.url || '',
      },
      team2: {
        name: side2.name || 'Unknown',
        url: side2.url || '',
      },
      videos: item.videos || []
    };
  });
};

// Get recommended highlights (latest videos from API)
export const getRecommendedHighlights = async (): Promise<MatchHighlight[]> => {
  console.log('Getting recommended highlights from API');
  const videos = await fetchScorebatVideos();
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const recommendedVideos = sortedVideos.slice(0, 5);
  
  console.log(`Returning ${recommendedVideos.length} recommended videos`);
  return recommendedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get all highlights grouped by league
export const getLeagueHighlights = async (): Promise<League[]> => {
  console.log('Getting league highlights from API');
  const videos = await fetchScorebatVideos();
  
  const leagues = scorebatMapper.mapToLeagues(videos);
  
  leagues.forEach(league => {
    league.highlights.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
  
  console.log(`Returning ${leagues.length} leagues with highlights`);
  return leagues;
};

// Get highlights for a specific competition
export const getCompetitionHighlights = async (competitionId: string): Promise<MatchHighlight[]> => {
  console.log(`Getting highlights for competition ${competitionId}`);
  const videos = await fetchCompetitionVideos(competitionId);
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get Premier League highlights using the direct API
export const getPremierLeagueHighlights = async (): Promise<MatchHighlight[]> => {
  console.log('Getting Premier League highlights from direct API');
  const videos = await fetchPremierLeagueVideos();
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Get a specific match by ID
export const getMatchById = async (id: string): Promise<MatchHighlight | null> => {
  console.log(`Searching for match with ID: ${id}`);
  
  // Load all videos first
  const videos = await fetchScorebatVideos();
  console.log(`Loaded ${videos.length} videos to search for match ${id}`);
  
  // Look for match by direct ID comparison
  let video = videos.find(v => v.id === id || v.matchId === id);
  
  // If not found, try additional ID formats
  if (!video) {
    console.log(`Match not found with direct ID ${id}, trying alternative ID formats`);
    
    // Check if the ID might be wrapped in an additional property
    video = videos.find(v => {
      // Safely check nested id properties
      const nestedIdMatch = 
        (v.id && typeof v.id === 'object' && 'id' in v.id && v.id.id === id);
      const nestedMatchIdMatch = 
        (v.matchId && typeof v.matchId === 'object' && 'id' in v.matchId && v.matchId.id === id);
      
      return nestedIdMatch || nestedMatchIdMatch;
    });
  }
  
  // If still not found, try extracting IDs from URLs
  if (!video) {
    console.log(`Match not found with object ID ${id}, trying URL matching`);
    
    // Try to match by URL pattern
    video = videos.find(v => {
      const url = v.matchviewUrl || v.url || '';
      return url.includes(id) || url.endsWith(id);
    });
  }
  
  if (!video) {
    console.warn(`No match found with ID ${id} after all search attempts`);
    return null;
  }
  
  console.log(`Found match with ID ${id}:`, video.title);
  return scorebatMapper.mapToMatchHighlight(video);
};

// Get highlights for a specific team
export const getTeamHighlights = async (teamId: string): Promise<MatchHighlight[]> => {
  const videos = await fetchTeamVideos(teamId);
  
  const sortedVideos = [...videos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};

// Search highlights
export const searchHighlights = async (query: string): Promise<MatchHighlight[]> => {
  if (!query.trim()) return [];
  
  const videos = await fetchScorebatVideos();
  const normalizedQuery = query.toLowerCase().trim();
  
  const matchingVideos = videos.filter(video => {
    return (
      video.title.toLowerCase().includes(normalizedQuery) ||
      video.team1.name.toLowerCase().includes(normalizedQuery) ||
      video.team2.name.toLowerCase().includes(normalizedQuery) ||
      video.competition.name.toLowerCase().includes(normalizedQuery)
    );
  });
  
  const sortedVideos = [...matchingVideos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sortedVideos.map(video => scorebatMapper.mapToMatchHighlight(video));
};
