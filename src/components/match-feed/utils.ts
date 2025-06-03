// League country mapping and country names
export const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
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
};

export const COUNTRY_NAMES: Record<string, string> = {
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
};

export const getLeagueCountryInfo = (leagueId: string) => {
  const countryCode = LEAGUE_COUNTRY_MAPPING[leagueId] || null;
  const countryName = countryCode ? COUNTRY_NAMES[countryCode] || null : null;
  
  return {
    code: countryCode,
    name: countryName
  };
};

export const getCountryFlagUrl = (code: string): string => {
  // Special cases
  if (code === 'EU') return '/flags/eu.svg';
  if (code === 'WORLD') return '/flags/world.svg';
  if (code === 'GB') return '/flags/gb-eng.svg'; // Use England flag for Premier League
  
  // Use country code for flag URL
  return `/flags/${code.toLowerCase()}.svg`;
};

export const getLeagueLogo = (leagueId: string, leagueName: string, apiLogo?: string): string => {
  // Try to use API-provided logo first
  if (apiLogo) return apiLogo;
  
  // Fallback to local logo if available
  return `/leagues/${leagueId}.svg`;
}; 