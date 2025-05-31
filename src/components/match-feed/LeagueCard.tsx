import React, { useState } from 'react';
import type { LeagueWithMatches } from '@/types';
import MatchRow from './MatchRow';

interface LeagueCardProps {
  league: LeagueWithMatches;
  defaultExpanded?: boolean;
  onCountrySelect?: (countryCode: string | null) => void;
}

// League country mapping (same as in MatchFeedByLeague)
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

// Country name mapping
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

const LeagueCard: React.FC<LeagueCardProps> = ({ league, defaultExpanded = false, onCountrySelect }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get country info for the league
  const getLeagueCountryInfo = () => {
    const countryCode = LEAGUE_COUNTRY_MAPPING[league.id];
    const countryName = countryCode ? COUNTRY_NAMES[countryCode] : null;
    
    // Log unmapped leagues for easier identification
    if (!countryCode) {
      console.warn(`⚠️ UNMAPPED LEAGUE: ID="${league.id}", Name="${league.name}" - needs to be added to LEAGUE_COUNTRY_MAPPING`);
    }
    
    return {
      code: countryCode,
      name: countryName
    };
  };

  // Enhanced country flag function - always returns a valid flag
  const getCountryFlagUrl = (countryCode?: string): string => {
    if (!countryCode) {
      return '/icons/default-flag.svg';
    }
    
    const code = countryCode.toUpperCase();
    
    // Handle special cases
    if (code === 'EU') {
      const flagUrl = 'https://flagcdn.com/w40/eu.png';
      return flagUrl;
    }
    if (code === 'WORLD') {
      const flagUrl = 'https://flagcdn.com/w40/un.png';
      return flagUrl;
    }
    if (code === 'GB' || code === 'EN' || code === 'UK') {
      const flagUrl = 'https://flagcdn.com/w40/gb.png';
      return flagUrl;
    }
    
    // Standard country codes - use external CDN
    const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
    return flagUrl;
  };

  // Helper function to get league logo with proper scoresite CDN fallbacks
  const getLeagueLogoUrl = (leagueLogo?: string, leagueId?: string): string => {
    if (leagueLogo && leagueLogo.length > 0) {
      return leagueLogo;
    }
    if (leagueId) {
      return `https://cdn.scoresite.com/logos/leagues/${leagueId}.png`;
    }
    return '/icons/default.svg';
  };

  // Calculate match statistics
  const liveMatches = league.matches.filter(m => 
    m.fixture?.status?.short === 'LIVE' || m.status === 'live'
  ).length;
  const upcomingMatches = league.matches.filter(m => 
    m.fixture?.status?.short === 'NS' || m.status === 'upcoming'
  ).length;
  const finishedMatches = league.matches.filter(m => 
    m.fixture?.status?.short === 'FT' || m.status === 'finished'
  ).length;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCountryClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing the league
    const countryInfo = getLeagueCountryInfo();
    if (countryInfo.code && onCountrySelect) {
      onCountrySelect(countryInfo.code);
    }
  };

  const countryInfo = getLeagueCountryInfo();

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700/30">
      {/* League Header - Clickable to toggle */}
      <button
        onClick={toggleExpanded}
        className="w-full p-6 border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          {/* Country Flag + Country Name + League Name */}
          <div className="flex items-center gap-2 px-4 py-1">
            {countryInfo.code && (
              <button
                onClick={handleCountryClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title={`Filter by ${countryInfo.name}`}
              >
                <img
                  src={getCountryFlagUrl(countryInfo.code)}
                  alt={`${countryInfo.name} flag`}
                  className="w-5 h-5 object-cover rounded-full"
                  onLoad={() => {
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/icons/default-flag.svg'; // Fallback to local default flag
                  }}
                />
                {countryInfo.name && (
                  <span className="text-gray-300 text-sm font-medium">{countryInfo.name}</span>
                )}
              </button>
            )}
            <span className="text-white text-sm font-semibold">— {league.name}</span>
            
            {/* Match status indicators */}
            <div className="flex items-center gap-2 ml-4">
              {liveMatches > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                  {liveMatches} LIVE
                </span>
              )}
              {upcomingMatches > 0 && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {upcomingMatches} upcoming
                </span>
              )}
              {finishedMatches > 0 && (
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  {finishedMatches} finished
                </span>
              )}
            </div>
          </div>
          
          {/* Match Count and Expand/Collapse Icon */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {league.matches.length}
              </div>
            </div>
            
            {/* Expand/Collapse Icon */}
            <div className="text-gray-400">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </button>
      
      {/* Matches List - Collapsible */}
      {isExpanded && (
        <div className="divide-y divide-gray-700/30">
          {league.matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard; 