import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { League } from "@/types";
import HighlightCard from "./HighlightCard";
import { ChevronRight } from "lucide-react";

interface LeagueSectionProps {
  league: League;
}

// League country mapping - same comprehensive mapping as other components
const LEAGUE_COUNTRY_MAPPING: Record<string, string> = {
  // UEFA Competitions
  '2': 'EU', '3': 'EU', '848': 'EU', // UEFA competitions
  '2486': 'EU', // UEFA Champions League (corrected from ES/La Liga)
  
  // Major domestic leagues (1st tier)
  '33973': 'GB', // Premier League
  '119924': 'ES', // La Liga (corrected ID)
  '115669': 'IT', // Serie A (Italy)
  '67162': 'DE', // Bundesliga
  '52695': 'FR', // Ligue 1
  '216087': 'US', '253': 'US', // MLS
  '63': 'PT', // Liga Portugal
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
  '515': 'HT', // Ligue Haïtienne (Haiti)
  '516': 'JM', // Jamaica Premier League
  '517': 'TT', // TT Pro League (Trinidad and Tobago)
  '518': 'CR', // Liga FPD (Costa Rica)
  '519': 'GT', // Liga Nacional (Guatemala)
  '520': 'HN', // Liga Nacional (Honduras)
  '521': 'PA', // Liga Panameña de Fútbol
  '522': 'NI', // Primera División (Nicaragua)
  '523': 'SV', // Primera División (El Salvador)
  '524': 'BZ', // Premier League of Belize
  
  // Add more mappings as needed...
};

// Helper function to get country flag based on league ID using comprehensive mapping
const getCountryFlag = (leagueId: string): string => {
  console.log(`[DEBUG] getCountryFlag called with leagueId: "${leagueId}"`);
  
  const countryCode = LEAGUE_COUNTRY_MAPPING[leagueId];
  console.log(`[DEBUG] countryCode for "${leagueId}": ${countryCode}`);
  
  if (!countryCode) {
    console.log(`[DEBUG] No country mapping found for league ID: "${leagueId}", using default flag`);
    return '/icons/default-flag.svg';
  }
  
  const code = countryCode.toUpperCase();
  console.log(`[DEBUG] Uppercase country code: ${code}`);
  
  // Handle special cases
  if (code === 'EU') return 'https://flagcdn.com/w40/eu.png';
  if (code === 'WORLD') return 'https://flagcdn.com/w40/un.png';
  if (code === 'GB' || code === 'EN' || code === 'UK') return 'https://flagcdn.com/w40/gb.png';
  
  // Standard country codes
  const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  console.log(`[DEBUG] Final flag URL: ${flagUrl}`);
  return flagUrl;
};

const LeagueSection = ({ league }: LeagueSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  const handleLeagueClick = () => {
    // Navigate to league page - this can be expanded based on requirements
    // For now, let's assume we'd navigate to /league/{id}
    navigate(`/league/${league.id}`);
  };

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center space-x-3 mb-4">
        {/* Country flag instead of league logo - now clickable with hover effect */}
        <div 
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110"
          onClick={handleLeagueClick}
        >
          <img 
            src={getCountryFlag(league.id)}
            alt={league.name}
            className="w-8 h-8 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/icons/default-flag.svg";
            }}
          />
        </div>
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center space-x-3">
            {/* League name - now clickable with hover effect */}
            <h2 
              className="text-xl font-semibold tracking-tight text-white hover:text-[#FFC30B] cursor-pointer transition-colors duration-200"
              onClick={handleLeagueClick}
            >
              {league.name}
            </h2>
            {/* Removed the following span that displayed the number of highlights */}
            {/* <span className="text-sm text-gray-400">
              {league.highlights.length} highlights
            </span> */}
          </div>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide gap-4 pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {league.highlights.map((highlight) => (
            <div 
              key={highlight.id} 
              className="flex-shrink-0 w-[280px] md:w-[320px] transform transition-all duration-300 hover:z-10"
            >
              <HighlightCard highlight={highlight} />
            </div>
          ))}
        </div>
        
        {/* Scroll button */}
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-highlight-800/80 hover:bg-highlight-700 p-2 rounded-full shadow-md z-10"
          aria-label="See more highlights"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default LeagueSection;
