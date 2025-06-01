import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { LeagueWithMatches } from '@/types';
import LeagueCard from './LeagueCard';

interface MatchFeedByLeagueProps {
  leaguesWithMatches: LeagueWithMatches[];
  loading?: boolean;
  selectedDate?: string;
  isToday?: boolean;
  selectedLeagueIds?: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
  selectedCountryCode?: string | null;
  onCountrySelect?: (countryCode: string | null) => void;
}

// League country mapping and country names
const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
  // UEFA Competitions
  '2486': 'EU', '2': 'EU', '3337': 'EU', '3': 'EU', '722432': 'EU', // UEFA competitions
  
  // Major domestic leagues (1st tier)
  '39': 'GB', // Premier League
  '140': 'ES', // La Liga
  '135': 'IT', // Serie A
  '78': 'DE', // Bundesliga
  '61': 'FR', // Ligue 1
  '216087': 'US', '253': 'US', // MLS
  '94': 'PT', // Liga Portugal
  '307': 'SA', // Saudi Pro League
  '88': 'NL', // Eredivisie
  '71': 'BR', // Série A Brasil
  '128': 'AR', // Primera División Argentina
  '1': 'WORLD', // FIFA World Cup
  
  // Second tier domestic leagues (2nd division)
  '40': 'GB', // Championship
  '141': 'ES', // Segunda División
  '136': 'IT', // Serie B
  '80': 'DE', // 2. Bundesliga
  '62': 'FR', // Ligue 2
  '95': 'PT', // Liga Portugal 2
  '89': 'NL', // Eerste Divisie
  '72': 'BR', // Série B Brasil
  '129': 'AR', // Primera B Nacional
  
  // Third tier domestic leagues (3rd division)
  '41': 'GB', // League One
  '142': 'ES', // Primera División RFEF
  '137': 'IT', // Serie C
  '81': 'DE', // 3. Liga
  '63': 'FR', // Championnat National
  '73': 'BR', // Série C Brasil
  
  // Additional major leagues and smaller nations
  '106': 'TR', // Süper Lig (Turkey)
  '87': 'DK', // Danish Superliga
  '103': 'NO', // Eliteserien (Norway)
  '113': 'SE', // Allsvenskan (Sweden)
  '119': 'CH', // Swiss Super League
  '169': 'PL', // Ekstraklasa (Poland)
  '345': 'CZ', // Czech First League
  '318': 'GR', // Greek Super League
  '203': 'UA', // Ukrainian Premier League
  '235': 'RU', // Russian Premier League
  '286': 'JP', // J1 League (Japan)
  '292': 'KR', // K League 1 (South Korea)
  '271': 'AU', // A-League (Australia)
  '144': 'BE', // Jupiler Pro League (Belgium)
  
  // Caribbean and Central America
  '323313': 'HT', // Ligue Haïtienne (Haiti) - corrected ID
  '516': 'JM', // Jamaica Premier League
  '517': 'TT', // TT Pro League (Trinidad and Tobago)
  '518': 'CR', // Liga FPD (Costa Rica)
  '519': 'GT', // Liga Nacional (Guatemala)
  '520': 'HN', // Liga Nacional (Honduras)
  '521': 'PA', // Liga Panameña de Fútbol
  '522': 'NI', // Primera División (Nicaragua)
  '523': 'SV', // Primera División (El Salvador)
  '524': 'BZ', // Premier League of Belize
  
  // North America
  '254': 'CA', // Canadian Premier League
  '262': 'MX', // Liga MX (Mexico)
  
  // South America
  '325': 'UY', // Primera División (Uruguay)
  '326': 'PE', // Liga 1 (Peru)
  '327': 'EC', // Serie A (Ecuador)
  '328': 'CO', // Liga BetPlay (Colombia)
  '329': 'VE', // Primera División (Venezuela)
  '330': 'BO', // División Profesional (Bolivia)
  '331': 'PY', // División Profesional (Paraguay)
  '332': 'CL', // Primera División (Chile)
  
  // Africa
  '410': 'EG', // Egyptian Premier League
  '411': 'MA', // Botola (Morocco)
  '412': 'TN', // Tunisian Ligue Professionnelle 1
  '413': 'DZ', // Ligue Professionnelle 1 (Algeria)
  '414': 'ZA', // PSL (South Africa)
  '415': 'NG', // NPFL (Nigeria)
  '416': 'GH', // Ghana Premier League
  '417': 'CI', // Ligue 1 (Ivory Coast)
  '418': 'SN', // Ligue 1 (Senegal)
  '419': 'CM', // Elite One (Cameroon)
  '420': 'KE', // FKF Premier League (Kenya)
  
  // Asia
  '350': 'CN', // Chinese Super League
  '351': 'IN', // Indian Super League
  '352': 'TH', // Thai League 1
  '353': 'VN', // V.League 1 (Vietnam)
  '354': 'MY', // Malaysia Super League
  '355': 'SG', // Singapore Premier League
  '356': 'ID', // Liga 1 (Indonesia)
  '357': 'PH', // Philippines Football League
  '358': 'IR', // Persian Gulf Pro League (Iran)
  '359': 'IQ', // Iraqi Premier League
  '360': 'AE', // UAE Pro League
  '361': 'QA', // Qatar Stars League
  '362': 'KW', // Kuwaiti Premier League
  '363': 'BH', // Bahraini Premier League
  '364': 'OM', // Oman Professional League
  '365': 'JO', // Jordan Pro League
  '366': 'LB', // Lebanese Premier League
  '367': 'SY', // Syrian Premier League
  '368': 'PS', // Gaza Strip League (Palestine)
  
  // Europe - Smaller nations
  '390': 'IS', // Úrvalsdeild (Iceland)
  '391': 'FO', // Faroese Premier League
  '392': 'MT', // Maltese Premier League
  '393': 'CY', // Cypriot First Division
  '394': 'LU', // Luxembourg National Division
  '395': 'LI', // Liechtenstein Football Cup
  '396': 'AD', // Andorran First Division
  '397': 'SM', // San Marino Championship
  '398': 'GI', // Gibraltar National League
  '399': 'MC', // Monaco (plays in French system)
  
  // Eastern Europe
  '375': 'LV', // Latvian Higher League
  '376': 'LT', // A Lyga (Lithuania)
  '377': 'EE', // Meistriliiga (Estonia)
  '378': 'BY', // Belarusian Premier League
  '379': 'MD', // Moldovan National Division
  '380': 'AM', // Armenian Premier League
  '381': 'AZ', // Azerbaijan Premier League
  '382': 'GE', // Erovnuli Liga (Georgia)
  '383': 'KZ', // Kazakhstan Premier League
  '384': 'UZ', // Uzbekistan Super League
  '385': 'KG', // Kyrgyzstan League
  '386': 'TJ', // Tajikistan Higher League
  '387': 'TM', // Turkmenistan Ýokary Liga
  
  // Balkans
  '425': 'RS', // Serbian SuperLiga
  '426': 'HR', // Croatian First League
  '427': 'BA', // Premier League (Bosnia and Herzegovina)
  '428': 'ME', // Montenegrin First League
  '429': 'MK', // North Macedonian First League
  '430': 'AL', // Albanian Superiore
  '431': 'XK', // Football Superleague of Kosovo
  '432': 'SI', // Slovenian PrvaLiga
  '433': 'SK', // Slovak Super Liga
  '434': 'HU', // Hungarian NB I
  '435': 'RO', // Liga I (Romania)
  '436': 'BG', // Bulgarian First League
  
  // Oceania
  '500': 'NZ', // New Zealand Football Championship
  '501': 'FJ', // Fiji Premier League
  '502': 'NC', // New Caledonia Super Ligue
  '503': 'PF', // Tahiti Ligue 1
  '504': 'VU', // Port Vila Football League (Vanuatu)
  '505': 'SB', // Solomon Islands S-League
  '506': 'PG', // Papua New Guinea National Soccer League
  '507': 'TO', // Tonga Major League
  '508': 'WS', // Samoa National League
  '509': 'CK', // Cook Islands Round Cup
  '510': 'AS', // American Samoa Soccer League
};

const COUNTRY_NAMES: Record<string, string> = {
  'EU': 'Europe',
  'WORLD': 'International',
  
  // Major countries
  'GB': 'England',
  'ES': 'Spain',
  'IT': 'Italy',
  'DE': 'Germany',
  'FR': 'France',
  'US': 'United States',
  'PT': 'Portugal',
  'SA': 'Saudi Arabia',
  'NL': 'Netherlands',
  'BR': 'Brazil',
  'AR': 'Argentina',
  
  // Europe
  'TR': 'Turkey',
  'BE': 'Belgium',
  'DK': 'Denmark',
  'NO': 'Norway',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'GR': 'Greece',
  'UA': 'Ukraine',
  'RU': 'Russia',
  'IS': 'Iceland',
  'FO': 'Faroe Islands',
  'MT': 'Malta',
  'CY': 'Cyprus',
  'LU': 'Luxembourg',
  'LI': 'Liechtenstein',
  'AD': 'Andorra',
  'SM': 'San Marino',
  'GI': 'Gibraltar',
  'MC': 'Monaco',
  'LV': 'Latvia',
  'LT': 'Lithuania',
  'EE': 'Estonia',
  'BY': 'Belarus',
  'MD': 'Moldova',
  'AM': 'Armenia',
  'AZ': 'Azerbaijan',
  'GE': 'Georgia',
  'KZ': 'Kazakhstan',
  'UZ': 'Uzbekistan',
  'KG': 'Kyrgyzstan',
  'TJ': 'Tajikistan',
  'TM': 'Turkmenistan',
  'RS': 'Serbia',
  'HR': 'Croatia',
  'BA': 'Bosnia and Herzegovina',
  'ME': 'Montenegro',
  'MK': 'North Macedonia',
  'AL': 'Albania',
  'XK': 'Kosovo',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  
  // Asia
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'IN': 'India',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'IR': 'Iran',
  'IQ': 'Iraq',
  'AE': 'UAE',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'BH': 'Bahrain',
  'OM': 'Oman',
  'JO': 'Jordan',
  'LB': 'Lebanon',
  'SY': 'Syria',
  'PS': 'Palestine',
  
  // Africa
  'EG': 'Egypt',
  'MA': 'Morocco',
  'TN': 'Tunisia',
  'DZ': 'Algeria',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'GH': 'Ghana',
  'CI': 'Ivory Coast',
  'SN': 'Senegal',
  'CM': 'Cameroon',
  'KE': 'Kenya',
  
  // North America
  'CA': 'Canada',
  'MX': 'Mexico',
  
  // Caribbean and Central America
  'HT': 'Haiti',
  'JM': 'Jamaica',
  'TT': 'Trinidad and Tobago',
  'CR': 'Costa Rica',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'PA': 'Panama',
  'NI': 'Nicaragua',
  'SV': 'El Salvador',
  'BZ': 'Belize',
  
  // South America
  'UY': 'Uruguay',
  'PE': 'Peru',
  'EC': 'Ecuador',
  'CO': 'Colombia',
  'VE': 'Venezuela',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'CL': 'Chile',
  
  // Oceania
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'FJ': 'Fiji',
  'NC': 'New Caledonia',
  'PF': 'French Polynesia',
  'VU': 'Vanuatu',
  'SB': 'Solomon Islands',
  'PG': 'Papua New Guinea',
  'TO': 'Tonga',
  'WS': 'Samoa',
  'CK': 'Cook Islands',
  'AS': 'American Samoa',
};

// Helper function to get country info for a league
const getLeagueCountryInfo = (leagueId: string) => {
  const countryCode = LEAGUE_COUNTRY_MAPPING[leagueId];
  const countryName = countryCode ? COUNTRY_NAMES[countryCode] : null;
  
  // Log unmapped leagues for easier identification
  if (!countryCode) {
    console.warn(`⚠️ UNMAPPED LEAGUE: ID="${leagueId}" - needs to be added to LEAGUE_COUNTRY_MAPPING`);
  }
  
  return {
    code: countryCode,
    name: countryName
  };
};

// Enhanced logo mapping function - prioritizes multiple external sources for best reliability
const getLeagueLogo = (leagueId: string, leagueName: string, apiLogo?: string): string => {
  // Priority 1: Use API logo if it exists and looks valid
  if (apiLogo && apiLogo.trim() && !apiLogo.includes('placeholder') && !apiLogo.includes('default')) {
    return apiLogo;
  }

  // Priority 2: Use reliable external CDN sources for major leagues
  const externalLogos: Record<string, string> = {
    // UEFA Competitions
    '2486': 'https://media.api-sports.io/football/leagues/2.png', // Champions League
    '2': 'https://media.api-sports.io/football/leagues/2.png', // Champions League
    '3337': 'https://media.api-sports.io/football/leagues/3.png', // Europa League
    '3': 'https://media.api-sports.io/football/leagues/3.png', // Europa League
    '1': 'https://media.api-sports.io/football/leagues/1.png', // World Cup
    
    // Top European Leagues
    '39': 'https://media.api-sports.io/football/leagues/39.png', // Premier League
    '140': 'https://media.api-sports.io/football/leagues/140.png', // La Liga
    '135': 'https://media.api-sports.io/football/leagues/135.png', // Serie A
    '78': 'https://media.api-sports.io/football/leagues/78.png', // Bundesliga
    '61': 'https://media.api-sports.io/football/leagues/61.png', // Ligue 1
    
    // Other Major Leagues
    '216087': 'https://media.api-sports.io/football/leagues/253.png', // MLS
    '94': 'https://media.api-sports.io/football/leagues/94.png', // Liga Portugal
    '307': 'https://media.api-sports.io/football/leagues/307.png', // Saudi Pro League
  };

  // Priority 2: Use external logo if available
  if (externalLogos[leagueId]) {
    return externalLogos[leagueId];
  }

  // Priority 3: Try API-Sports generic league endpoint
  if (leagueId && leagueId.match(/^\d+$/)) {
    return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
  }

  // Priority 4: Try alternative sources based on league name
  const nameBasedLogos: Record<string, string> = {
    'champions league': 'https://media.api-sports.io/football/leagues/2.png',
    'europa league': 'https://media.api-sports.io/football/leagues/3.png',
    'premier league': 'https://media.api-sports.io/football/leagues/39.png',
    'la liga': 'https://media.api-sports.io/football/leagues/140.png',
    'serie a': 'https://media.api-sports.io/football/leagues/135.png',
    'bundesliga': 'https://media.api-sports.io/football/leagues/78.png',
    'ligue 1': 'https://media.api-sports.io/football/leagues/61.png',
    'major league soccer': 'https://media.api-sports.io/football/leagues/253.png',
    'mls': 'https://media.api-sports.io/football/leagues/253.png',
  };

  const normalizedName = leagueName.toLowerCase();
  for (const [key, logo] of Object.entries(nameBasedLogos)) {
    if (normalizedName.includes(key)) {
      return logo;
    }
  }

  // Priority 5: Generate a professional text-based logo as final fallback
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="url(#bg)" rx="8"/>
      <rect width="36" height="36" x="2" y="2" fill="none" rx="6" stroke="#4b5563" stroke-width="1"/>
      <text x="20" y="26" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#ffffff">
        ${leagueName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
      </text>
    </svg>
  `)}`;
};

// Get country flag URL
const getCountryFlagUrl = (code: string): string => {
  // Special cases for non-standard country codes
  if (code === 'EU') {
    return 'https://flagcdn.com/w40/eu.png';
  }
  
  if (code === 'WORLD') {
    return 'https://flagcdn.com/w40/un.png'; // UN flag for World Cup
  }
  
  // Standard country codes
  if (code && code.length === 2) {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  }
  
  // Fallback for unknown countries
  return '/icons/default-flag.svg';
};

// League filters data for the integrated filter with country mappings
const LEAGUE_FILTERS = [
  // Top competitions and tournaments
  { id: '2486', name: 'UEFA Champions League', logoUrl: 'https://media.api-sports.io/football/leagues/2.png', countryCode: 'EU' },
  { id: '1', name: 'FIFA World Cup', logoUrl: 'https://media.api-sports.io/football/leagues/1.png', countryCode: 'WORLD' },
  { id: '3337', name: 'UEFA Europa League', logoUrl: 'https://media.api-sports.io/football/leagues/3.png', countryCode: 'EU' },
  
  // Top domestic leagues (1st tier)
  { id: '39', name: 'Premier League', logoUrl: 'https://media.api-sports.io/football/leagues/39.png', countryCode: 'GB' },
  { id: '140', name: 'La Liga', logoUrl: 'https://media.api-sports.io/football/leagues/140.png', countryCode: 'ES' },
  { id: '135', name: 'Serie A', logoUrl: 'https://media.api-sports.io/football/leagues/135.png', countryCode: 'IT' },
  { id: '78', name: 'Bundesliga', logoUrl: 'https://media.api-sports.io/football/leagues/78.png', countryCode: 'DE' },
  { id: '61', name: 'Ligue 1', logoUrl: 'https://media.api-sports.io/football/leagues/61.png', countryCode: 'FR' },
  { id: '253', name: 'Major League Soccer', logoUrl: 'https://media.api-sports.io/football/leagues/253.png', countryCode: 'US' },
  { id: '94', name: 'Liga Portugal', logoUrl: 'https://media.api-sports.io/football/leagues/94.png', countryCode: 'PT' },
  { id: '307', name: 'Saudi Pro League', logoUrl: 'https://media.api-sports.io/football/leagues/307.png', countryCode: 'SA' },
  { id: '88', name: 'Eredivisie', logoUrl: 'https://media.api-sports.io/football/leagues/88.png', countryCode: 'NL' },
  { id: '71', name: 'Série A Brasil', logoUrl: 'https://media.api-sports.io/football/leagues/71.png', countryCode: 'BR' },
  { id: '128', name: 'Primera División Argentina', logoUrl: 'https://media.api-sports.io/football/leagues/128.png', countryCode: 'AR' },
  
  // Second tier domestic leagues (2nd division)
  { id: '40', name: 'Championship', logoUrl: 'https://media.api-sports.io/football/leagues/40.png', countryCode: 'GB' },
  { id: '141', name: 'Segunda División', logoUrl: 'https://media.api-sports.io/football/leagues/141.png', countryCode: 'ES' },
  { id: '136', name: 'Serie B', logoUrl: 'https://media.api-sports.io/football/leagues/136.png', countryCode: 'IT' },
  { id: '80', name: '2. Bundesliga', logoUrl: 'https://media.api-sports.io/football/leagues/80.png', countryCode: 'DE' },
  { id: '62', name: 'Ligue 2', logoUrl: 'https://media.api-sports.io/football/leagues/62.png', countryCode: 'FR' }
];

// Helper function to get country code for a league
const getLeagueCountryCode = (leagueId: string): string | null => {
  const leagueFilter = LEAGUE_FILTERS.find(filter => filter.id === leagueId);
  return leagueFilter?.countryCode || null;
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="p-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="w-6 h-6 bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-24"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-700 rounded w-8 mb-1"></div>
              <div className="h-3 bg-gray-600 rounded w-12"></div>
            </div>
          </div>
        </div>
        
        {/* Matches skeleton */}
        <div className="divide-y divide-gray-700/30">
          {[1, 2, 3].map((j) => (
            <div key={j} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-4 bg-gray-700 rounded w-12"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const formatSelectedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isTomorrow) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Create filter component outside the main component to prevent recreation
const LeagueFilter: React.FC<{
  leaguesWithMatches: LeagueWithMatches[];
  selectedLeagueIds: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
}> = React.memo(({ leaguesWithMatches, selectedLeagueIds, onLeagueSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Save scroll position before any potential re-render
  const saveScrollPosition = () => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
  };

  // Set up scroll listener and save position on mount
  useLayoutEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', saveScrollPosition);
      // Save initial position
      saveScrollPosition();
      
      return () => {
        saveScrollPosition(); // Save on cleanup
        scrollContainer.removeEventListener('scroll', saveScrollPosition);
      };
    }
  }, []);

  // Restore scroll position after re-render
  useLayoutEffect(() => {
    if (scrollRef.current && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM has been updated
      requestAnimationFrame(() => {
        if (scrollRef.current && scrollPositionRef.current > 0) {
          scrollRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  });

  // Save scroll position when dependencies change
  useLayoutEffect(() => {
    saveScrollPosition();
  }, [selectedLeagueIds]);

  // Show all top leagues from LEAGUE_FILTERS, not just ones with current matches
  const allTopLeagues = LEAGUE_FILTERS.slice(0, 15).map(filter => {
    // Find current matches for this league
    const leagueData = leaguesWithMatches.find(league => league.id === filter.id);
    const matchCount = leagueData ? leagueData.matches.length : 0;
    const liveMatchCount = leagueData ? leagueData.matches.filter(m => 
      m.fixture?.status?.short === 'LIVE' || m.status === 'live'
    ).length : 0;
    
    return {
      id: filter.id,
      name: filter.name,
      logoUrl: filter.logoUrl,
      countryCode: filter.countryCode,
      matchCount: matchCount,
      liveMatchCount: liveMatchCount,
      hasLiveMatches: liveMatchCount > 0
    };
  });

  // Sort by priority: keep original LEAGUE_FILTERS order, then by live matches, then by match count
  const sortedLeagues = allTopLeagues.sort((a, b) => {
    // First: maintain original order from LEAGUE_FILTERS
    const aIndex = LEAGUE_FILTERS.findIndex(f => f.id === a.id);
    const bIndex = LEAGUE_FILTERS.findIndex(f => f.id === b.id);
    if (aIndex !== bIndex) return aIndex - bIndex;
    
    // Second: live matches (for leagues not in LEAGUE_FILTERS)
    if (a.hasLiveMatches && !b.hasLiveMatches) return -1;
    if (!a.hasLiveMatches && b.hasLiveMatches) return 1;
    
    // Third: match count (more matches first)
    return b.matchCount - a.matchCount;
  });

  const handleLeagueClick = (leagueId: string) => {
    if (!onLeagueSelect) return;
    
    // Toggle league selection (add if not selected, remove if selected)
    if (selectedLeagueIds.includes(leagueId)) {
      onLeagueSelect(selectedLeagueIds.filter(id => id !== leagueId));
    } else {
      onLeagueSelect([...selectedLeagueIds, leagueId]);
    }
  };

  return (
    <div className="sticky top-6">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Top Leagues</h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto" ref={scrollRef}>
        {sortedLeagues.length > 0 ? (
          sortedLeagues.map((league) => {
            const isSelected = selectedLeagueIds.includes(league.id);

            return (
              <button
                key={league.id}
                onClick={() => handleLeagueClick(league.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors focus:outline-none backdrop-blur-sm
                  ${isSelected 
                    ? 'bg-[#FFC30B] text-black' 
                    : 'hover:bg-white/10 text-gray-300 border border-white/10'
                  }
                `}
              >
                <img
                  src={league.logoUrl}
                  alt={league.name}
                  className="w-5 h-5 object-contain rounded-full bg-white p-0.5"
                  style={{ minWidth: '20px', minHeight: '20px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{league.name}</div>
                  <div className="text-xs text-gray-400">
                    {league.hasLiveMatches && (
                      <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                        {league.liveMatchCount} LIVE
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                )}
                {league.hasLiveMatches && !isSelected && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">No leagues available</p>
          </div>
        )}
      </div>
    </div>
  );
});

LeagueFilter.displayName = 'LeagueFilter';

// Create country filter component outside the main component to prevent recreation
const CountryFilter: React.FC<{
  leaguesWithMatches: LeagueWithMatches[];
  selectedLeagueIds: string[];
  onLeagueSelect?: (leagueIds: string[]) => void;
  selectedCountryCode?: string | null;
}> = React.memo(({ leaguesWithMatches, selectedLeagueIds, onLeagueSelect, selectedCountryCode }) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Save scroll position before any potential re-render
  const saveScrollPosition = () => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
  };

  // Set up scroll listener and save position on mount
  useLayoutEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', saveScrollPosition);
      // Save initial position
      saveScrollPosition();
      
      return () => {
        saveScrollPosition(); // Save on cleanup
        scrollContainer.removeEventListener('scroll', saveScrollPosition);
      };
    }
  }, []);

  // Restore scroll position after re-render
  useLayoutEffect(() => {
    if (scrollRef.current && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM has been updated
      requestAnimationFrame(() => {
        if (scrollRef.current && scrollPositionRef.current > 0) {
          scrollRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  });

  // Save scroll position when dependencies change
  useLayoutEffect(() => {
    saveScrollPosition();
  }, [selectedCountryCode, expandedCountries]);

  // Group leagues by country using the mapping
  const countriesMap = new Map();
  leaguesWithMatches.forEach(league => {
    if (league.matches && league.matches.length > 0) {
      const countryInfo = getLeagueCountryInfo(league.id);
      
      if (!countryInfo.code || !countryInfo.name) return;
      
      const liveMatchCount = league.matches.filter(m => 
        m.fixture?.status?.short === 'LIVE' || m.status === 'live'
      ).length;
      
      if (!countriesMap.has(countryInfo.code)) {
        countriesMap.set(countryInfo.code, {
          code: countryInfo.code,
          name: countryInfo.name,
          flagUrl: getCountryFlagUrl(countryInfo.code),
          leagues: [],
          totalMatches: 0,
          totalLiveMatches: 0,
          hasLiveMatches: false
        });
      }
      
      const country = countriesMap.get(countryInfo.code);
      country.leagues.push({
        id: league.id,
        name: league.name,
        logoUrl: getLeagueLogo(league.id, league.name, league.logo),
        matchCount: league.matches.length,
        liveMatchCount: liveMatchCount,
        hasLiveMatches: liveMatchCount > 0
      });
      country.totalMatches += league.matches.length;
      country.totalLiveMatches += liveMatchCount;
      country.hasLiveMatches = country.hasLiveMatches || liveMatchCount > 0;
    }
  });

  // Sort countries by priority: live matches first, then by total matches
  const sortedCountries = Array.from(countriesMap.values()).sort((a, b) => {
    if (a.hasLiveMatches && !b.hasLiveMatches) return -1;
    if (!a.hasLiveMatches && b.hasLiveMatches) return 1;
    return b.totalMatches - a.totalMatches;
  });

  const toggleCountryExpansion = (countryCode: string) => {
    // Save scroll position before the DOM changes
    saveScrollPosition();
    
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryCode)) {
      newExpanded.delete(countryCode);
    } else {
      newExpanded.add(countryCode);
    }
    setExpandedCountries(newExpanded);
  };

  const handleLeagueClick = (leagueId: string) => {
    if (!onLeagueSelect) return;
    
    // If clicking the same league, reset the filter
    if (selectedLeagueIds.includes(leagueId)) {
      onLeagueSelect(selectedLeagueIds.filter(id => id !== leagueId));
    } else {
      onLeagueSelect([...selectedLeagueIds, leagueId]);
    }
  };

  return (
    <div className="sticky top-6">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">By Country</h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto" ref={scrollRef}>
        {sortedCountries.length > 0 ? (
          sortedCountries.map((country) => {
            const isExpanded = expandedCountries.has(country.code);
            
            return (
              <div key={country.code} className="border border-gray-700/30 rounded-lg overflow-hidden">
                {/* Country Header - Clickable to expand/collapse */}
                <button
                  onClick={() => toggleCountryExpansion(country.code)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-black/30 hover:bg-white/10 backdrop-blur-sm transition-colors text-left focus:outline-none rounded-lg border border-white/10"
                >
                  <img
                    src={country.flagUrl}
                    alt={`${country.name} flag`}
                    className="w-5 h-5 object-cover rounded-full"
                    style={{ minWidth: '20px', minHeight: '20px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/icons/default-flag.svg'; // Fallback to local default flag
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{country.name}</div>
                    <div className="text-xs text-gray-400">
                      {country.totalMatches} {country.totalMatches === 1 ? 'match' : 'matches'}
                      {country.hasLiveMatches && (
                        <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                          {country.totalLiveMatches} LIVE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                    <svg 
                      className="w-full h-full text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {country.hasLiveMatches && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                  )}
                </button>
                
                {/* Leagues List - Collapsible */}
                {isExpanded && (
                  <div className="divide-y divide-white/10 bg-black/20 backdrop-blur-sm rounded-lg mt-2 border border-white/10">
                    {country.leagues.map((league) => {
                      const isSelected = selectedLeagueIds.includes(league.id);
                      
                      return (
                        <button
                          key={league.id}
                          onClick={() => handleLeagueClick(league.id)}
                          className={`
                            w-full flex items-center gap-3 px-6 py-2 text-left transition-colors focus:outline-none backdrop-blur-sm
                            ${isSelected 
                              ? 'bg-[#FFC30B] text-black' 
                              : 'hover:bg-white/10 text-gray-300'
                            }
                          `}
                        >
                          <img
                            src={league.logoUrl}
                            alt={league.name}
                            className="w-4 h-4 object-contain rounded-full bg-white p-0.5"
                            style={{ minWidth: '16px', minHeight: '16px' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{league.name}</div>
                            <div className="text-xs text-gray-400">
                              {league.hasLiveMatches && (
                                <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold">
                                  {league.liveMatchCount} LIVE
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                          )}
                          {league.hasLiveMatches && !isSelected && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">No countries available</p>
          </div>
        )}
      </div>
    </div>
  );
});

CountryFilter.displayName = 'CountryFilter';

const MatchFeedByLeague: React.FC<MatchFeedByLeagueProps> = ({ 
  leaguesWithMatches, 
  loading = false,
  selectedDate,
  isToday = false,
  selectedLeagueIds = [],
  onLeagueSelect,
  selectedCountryCode = null,
  onCountrySelect
}) => {
  const [activeSelector, setActiveSelector] = useState<'all' | 'highlights' | 'live'>('all');
  
  // Filter leagues based on selected filters and current selector
  const filteredLeagues = useMemo(() => {
    // First apply league filter
    let filtered = selectedLeagueIds.length > 0 
      ? leaguesWithMatches.filter(league => selectedLeagueIds.includes(league.id))
      : leaguesWithMatches;
    
    // Then apply country filter 
    if (selectedCountryCode) {
      filtered = filtered.filter(league => {
        const countryCode = getLeagueCountryCode(league.id);
        return countryCode === selectedCountryCode;
      });
    }
    
    // Then apply match type filter based on current selector
    const result = filtered.map(league => ({
      ...league,
      matches: league.matches.filter(match => {
        if (activeSelector === 'highlights') {
          return match.status === 'finished';
        } else if (activeSelector === 'live') {
          return match.status === 'live';
        }
        return true; // 'all' shows everything
      })
    }));
    
    // Only filter out leagues with no matches if NO leagues are specifically selected
    // If leagues are selected, show them even if they have no matches for this date/selector
    if (selectedLeagueIds.length > 0) {
      return result; // Show selected leagues regardless of match count
    } else {
      return result.filter(league => league.matches.length > 0); // Only show leagues with matches when no filter applied
    }
  }, [leaguesWithMatches, selectedLeagueIds, selectedCountryCode, activeSelector]);
  
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate) : 'Matches';
  
  // Calculate match counts for the pills - based on filtered data if leagues are selected
  const baseLeagues = selectedLeagueIds.length > 0 
    ? leaguesWithMatches.filter(league => selectedLeagueIds.includes(league.id))
    : leaguesWithMatches;
    
  const allMatchesCount = baseLeagues.reduce((total, league) => total + league.matches.length, 0);
  const finishedMatchesCount = baseLeagues.reduce((total, league) => 
    total + league.matches.filter(match => match.status === 'finished').length, 0);
  const liveMatchesCount = baseLeagues.reduce((total, league) => 
    total + league.matches.filter(match => match.status === 'live').length, 0);
  
  if (loading) {
    return (
      <section className="mb-16">
          <LoadingSkeleton />
      </section>
    );
  }

  // Handle edge case: selected league has no matches
  if (selectedLeagueIds.length > 0 && filteredLeagues.length === 0) {
    // Find the league name for better UX
    const selectedLeague = leaguesWithMatches.find(league => selectedLeagueIds.includes(league.id));
    const leagueName = selectedLeague?.name || 'selected leagues';
    
    return (
      <section className="mb-16">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="border border-gray-600/40 rounded-xl p-8 bg-transparent">
              {/* Match Type Selectors */}
              <div className="flex items-center justify-center gap-8 mb-8 border-b border-gray-700/30 pb-4 relative">
                <button
                  onClick={() => setActiveSelector('all')}
                  className={`relative py-2 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeSelector === 'all' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  All
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeSelector === 'all' 
                      ? 'bg-[#FFC30B] text-black' 
                      : 'bg-white/20 text-gray-300'
                  }`}>
                    {allMatchesCount}
                  </span>
                  {activeSelector === 'all' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-[#FFC30B] rounded-full"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveSelector('highlights')}
                  className={`relative py-2 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeSelector === 'highlights' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Highlights
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeSelector === 'highlights' 
                      ? 'bg-[#FFC30B] text-black' 
                      : 'bg-white/20 text-gray-300'
                  }`}>
                    {finishedMatchesCount}
                  </span>
                  {activeSelector === 'highlights' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-[#FFC30B] rounded-full"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveSelector('live')}
                  className={`relative py-2 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeSelector === 'live' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Live
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeSelector === 'live' 
                      ? 'bg-[#FFC30B] text-black' 
                      : 'bg-white/20 text-gray-300'
                  }`}>
                    {liveMatchesCount}
                  </span>
                  {activeSelector === 'live' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-[#FFC30B] rounded-full"></div>
                  )}
                </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center border border-gray-700/30">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
                <h3 className="text-xl font-semibold text-white mb-2">No matches for {leagueName}</h3>
                <p className="text-gray-400">
                  No matches found for your selected leagues on {dateLabel.toLowerCase()}. Try selecting a different date or adjusting your league selection.
                </p>
              </div>
            </div>
          </div>
          
          {/* Filter sidebar - Always show when leagues are selected so user can change selection */}
          <div className="w-80 flex-shrink-0 hidden lg:block space-y-6">
            <div className="border border-gray-600/40 rounded-xl p-8 bg-transparent">
              <LeagueFilter leaguesWithMatches={leaguesWithMatches} selectedLeagueIds={selectedLeagueIds} onLeagueSelect={onLeagueSelect} />
            </div>
            <div className="border border-gray-600/40 rounded-xl p-8 bg-transparent">
              <CountryFilter leaguesWithMatches={leaguesWithMatches} selectedLeagueIds={selectedLeagueIds} onLeagueSelect={onLeagueSelect} selectedCountryCode={selectedCountryCode} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Handle edge case: selected country has no matches
  if (selectedCountryCode && filteredLeagues.length === 0) {
    const countryName = COUNTRY_NAMES[selectedCountryCode.toUpperCase()] || 'this country';
    
    return (
      <section className="mb-16">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div 
              className="rounded-xl p-8 overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-12 text-center border border-white/20">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No matches for {countryName}</h3>
            <p className="text-gray-400">
                  Try selecting a different country or date to see more matches.
                </p>
              </div>
            </div>
          </div>
          
          {/* Filter sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block space-y-6">
            <div 
              className="rounded-xl p-8 overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">Filter options available when matches are present</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Handle case: no leagues at all
  if (filteredLeagues.length === 0) {
    let message = "No matches found";
    let description = `No matches scheduled for ${dateLabel.toLowerCase()}.`;
    
    return (
      <section className="mb-16">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div 
              className="rounded-xl p-8 overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-12 text-center border border-white/20">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
            </div>
                <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
            <p className="text-gray-400">
                  {description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Filter sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block space-y-6">
            <div 
              className="rounded-xl p-8 overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">Filter options available when matches are present</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      {/* Main content with filter */}
      <div className="flex gap-8">
        {/* Matches content - made smaller to accommodate filter */}
        <div className="flex-1 min-w-0">
          <div 
            className="rounded-xl p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Match Type Selectors */}
            <div className="flex items-center justify-center gap-8 mb-8 border-b border-white/20 pb-4 relative">
              <button
                onClick={() => setActiveSelector('all')}
                className={`relative py-2 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeSelector === 'all' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                All
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeSelector === 'all' 
                    ? 'bg-[#FFC30B] text-black' 
                    : 'bg-white/20 text-gray-300'
                }`}>
                  {allMatchesCount}
                </span>
                {activeSelector === 'all' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-[#FFC30B] rounded-full"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveSelector('highlights')}
                className={`relative py-2 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeSelector === 'highlights' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Highlights
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeSelector === 'highlights' 
                    ? 'bg-[#FFC30B] text-black' 
                    : 'bg-white/20 text-gray-300'
                }`}>
                  {finishedMatchesCount}
              </span>
                {activeSelector === 'highlights' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-[#FFC30B] rounded-full"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveSelector('live')}
                className={`relative py-2 px-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeSelector === 'live' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Live
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeSelector === 'live' 
                    ? 'bg-[#FFC30B] text-black' 
                    : 'bg-white/20 text-gray-300'
                }`}>
                  {liveMatchesCount}
              </span>
                {activeSelector === 'live' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-[#FFC30B] rounded-full"></div>
            )}
              </button>
            </div>

            <div className="space-y-6">
              {filteredLeagues.map((league) => {
                // Auto-expand leagues with live matches
                const hasLiveMatches = league.matches.some(m => 
                  m.fixture?.status?.short === 'LIVE' || m.status === 'live'
                );
                
                return (
                  <LeagueCard 
                    key={league.id} 
                    league={league}
                    defaultExpanded={hasLiveMatches}
                    onCountrySelect={onCountrySelect}
                  />
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Filter sidebar */}
        <div className="w-80 flex-shrink-0 hidden lg:block space-y-6">
          <div 
            className="rounded-xl p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <LeagueFilter leaguesWithMatches={leaguesWithMatches} selectedLeagueIds={selectedLeagueIds} onLeagueSelect={onLeagueSelect} />
          </div>
          <div 
            className="rounded-xl p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, #000000 0%, #374151 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <CountryFilter leaguesWithMatches={leaguesWithMatches} selectedLeagueIds={selectedLeagueIds} onLeagueSelect={onLeagueSelect} selectedCountryCode={selectedCountryCode} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchFeedByLeague; 