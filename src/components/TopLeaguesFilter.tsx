import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseDataService } from '@/services/supabaseDataService';

interface League {
  id: string;
  name: string;
  logo?: string;
  country?: {
    code: string;
    name: string;
    logo?: string;
  };
  category: 'international-club' | 'domestic' | 'international-tournament';
}

interface TopLeaguesFilterProps {
  selectedLeagueId?: string | null;
  onLeagueSelect?: (leagueId: string | null) => void;
}

// Priority league IDs - All leagues from database with correct Highlightly API IDs
const PRIORITY_LEAGUE_IDS = [
  // Big 5 European Leagues (Priority)
  '33973',  // Premier League
  '119924', // La Liga
  '115669', // Serie A
  '67162',  // Bundesliga
  '52695',  // Ligue 1
  
  // Major International Club Competitions
  '2486',   // UEFA Champions League
  '3337',   // UEFA Europa League
  '11847',  // CONMEBOL Libertadores
  
  // International Tournaments
  '4188',   // Euro Championship
  '8443',   // Copa America
  '13549',  // FIFA Club World Cup
  
  // Additional Popular Leagues
  '34824',  // Championship (EFL)
  '16102'   // AFC Cup
];

// Helper function to get category display name
const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'international-club':
      return 'International Club';
    case 'domestic':
      return 'Big 5 European Leagues';
    case 'international-tournament':
      return 'International Tournaments';
    default:
      return 'Other';
  }
};

// Helper function to get category icon
const getCategoryIcon = (category: string): JSX.Element => {
  switch (category) {
    case 'international-club':
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'domestic':
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'international-tournament':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
  }
};

// Helper function to categorize leagues based on their names and attributes
const categorizeLeague = (league: any): 'international-club' | 'domestic' | 'international-tournament' => {
  const name = league.name.toLowerCase();
  const leagueId = league.id?.toString();
  
  // International club competitions - use exact IDs from our database
  if (leagueId === '999001' || // UEFA Champions League
      leagueId === '999005' || // UEFA Europa League
      leagueId === '999006' || // UEFA Europa Conference League
      name.includes('uefa champions league') || 
      name.includes('champions league') || 
      name.includes('uefa europa league') || 
      name.includes('europa league') ||
      name.includes('uefa europa conference league') ||
      name.includes('conference league') ||
      name.includes('conmebol libertadores') ||
      name.includes('copa libertadores') ||
      name.includes('libertadores')) {
    return 'international-club';
  }
  
  // International tournaments - use exact IDs from our database
  if (leagueId === '999009' || // FIFA World Cup
      leagueId === '999007' || // UEFA Euro Championship
      leagueId === '999008' || // Copa America
      leagueId === '999010' || // FIFA Club World Cup
      (name.includes('world cup') && !name.includes('club')) || // FIFA World Cup by name (excluding club versions)
      name.includes('euro championship') ||
      name.includes('european championship') ||
      name.includes('uefa euro') ||
      (name.includes('euro') && name.includes('202')) || // Euro 2020, 2024, etc.
      name.includes('africa cup of nations') ||
      name.includes('afcon') ||
      name.includes('copa américa') ||
      name.includes('copa america') ||
      name.includes('fifa club world cup') ||
      name.includes('afc cup') ||
      name.includes('asian cup')) {
    return 'international-tournament';
  }
  
  // Top domestic leagues - use exact IDs from our database
  if (leagueId === '33973' ||  // Premier League
      leagueId === '119924' || // La Liga
      leagueId === '115669' || // Serie A
      leagueId === '67162' ||  // Bundesliga
      leagueId === '52695' ||  // Ligue 1
      leagueId === '999004' || // EFL Championship
      leagueId === '999002' || // MLS
      leagueId === '999003' || // Saudi Pro League
      (name.includes('premier league') && !name.includes('australian') && !name.includes('south african')) ||
      name.includes('la liga') || 
      name.includes('laliga') ||
      (name.includes('serie a') && (name.includes('italy') || name.includes('italia'))) ||
      (name.includes('bundesliga') && !name.includes('2.') && !name.includes('frauen')) ||
      name.includes('ligue 1') ||
      name.includes('efl championship') ||
      name.includes('major league soccer') ||
      name.includes('mls') ||
      name.includes('saudi pro league')) {
    return 'domestic';
  }
  
  // Everything else defaults to 'domestic' but will be less prioritized
  return 'domestic';
};

// Helper function to get league priority based on exact ID matching
const getLeaguePriority = (league: any): number => {
  const leagueId = league.id?.toString();
  
  // Use exact ID matching for priority leagues
  const priorityIndex = PRIORITY_LEAGUE_IDS.indexOf(leagueId);
  if (priorityIndex !== -1) {
    // Return priority based on position in array (lower index = higher priority)
    return priorityIndex + 1;
  }
  
  // Default priority for non-priority leagues
  return 999;
};

const TopLeaguesFilter: React.FC<TopLeaguesFilterProps> = ({
  selectedLeagueId,
  onLeagueSelect
}) => {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leagues from Supabase - instant, no rate limits!
  useEffect(() => {
    const fetchTopLeagues = async () => {
      try {
        setLoading(true);
        console.log('[TopLeaguesFilter] Fetching priority leagues from Supabase...');
        
        // Get priority leagues directly from Supabase
        const priorityLeagues = await supabaseDataService.getPriorityLeagues();
        
        // Transform to our format with categorization
        const transformedLeagues: League[] = priorityLeagues
          .map((league: any) => ({
            id: league.id.toString(),
            name: league.name,
            logo: league.logo,
            country: league.country,
            category: categorizeLeague(league)
          }))
          .sort((a, b) => getLeaguePriority(a) - getLeaguePriority(b));
        
        setLeagues(transformedLeagues);
        console.log(`[TopLeaguesFilter] ✅ Got ${transformedLeagues.length} priority leagues from Supabase`);
        
      } catch (error) {
        console.error('[TopLeaguesFilter] Error fetching leagues:', error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLeagues();
  }, []);

  // Sort leagues by priority
  const sortedLeagues = [...leagues].sort((a, b) => getLeaguePriority(a) - getLeaguePriority(b));

  const handleLeagueClick = (leagueId: string) => {
    console.log(`[TopLeaguesFilter] League clicked: ${leagueId}`);
    
    // Notify parent component if callback provided
    if (onLeagueSelect) {
      onLeagueSelect(leagueId);
    }
    
    // Navigate to league page
    navigate(`/league/${leagueId}`);
  };

  const getLeagueIcon = (league: League): JSX.Element => {
    // If we have a logo URL from the API, use it
    if (league.logo) {
      return (
        <div className="w-8 h-8 flex-shrink-0 bg-white rounded-full p-1 flex items-center justify-center">
          <img 
            src={league.logo} 
            alt={`${league.name} logo`}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback initials icon (hidden by default) */}
          <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center hidden">
            <span className="text-white text-xs font-bold">
              {league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      );
    }

    // Fallback to initials if no logo available
    const initials = league.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    
    return (
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        <div className="w-7 h-7 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-lg font-semibold">Featured Leagues</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white text-lg font-semibold">Featured Leagues</span>
      </div>
      
      {leagues.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No featured leagues available</div>
          <div className="text-gray-500 text-sm">Unable to load priority leagues from API</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLeagues.map((league) => {
            const isPriorityLeague = PRIORITY_LEAGUE_IDS.includes(league.id);
            
            return (
              <button
                key={league.id}
                onClick={() => handleLeagueClick(league.id)}
                className={`
                  w-full rounded-lg p-3 flex items-center gap-3
                  transition-all duration-200 hover:bg-[#121212]
                  ${selectedLeagueId === league.id
                    ? 'bg-[#121212] text-white' 
                    : 'bg-transparent text-gray-300 hover:text-white'
                  }
                `}
              >
                {/* League Icon with white circle */}
                <div className="flex-shrink-0">
                  {getLeagueIcon(league)}
                </div>
                
                {/* League Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className={`
                    font-medium leading-tight truncate
                    ${selectedLeagueId === league.id ? 'text-white' : 'text-gray-300'}
                  `}>
                    {league.name}
                  </div>
                  {league.country && (
                    <div className="text-xs text-gray-500 truncate">
                      {league.country.name}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default TopLeaguesFilter; 