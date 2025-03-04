
import { useRef } from "react";
import { League } from "@/types";
import HighlightCard from "./HighlightCard";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface LeagueSectionProps {
  league: League;
}

// Helper function to get country flag based on league ID
const getCountryFlag = (leagueId: string): string => {
  const flagMap: Record<string, string> = {
    'england-premier-league': 'https://flagcdn.com/w40/gb-eng.png', // English flag
    'spain-la-liga': 'https://flagcdn.com/w40/es.png', // Spanish flag
    'germany-bundesliga': 'https://flagcdn.com/w40/de.png', // German flag
    'italy-serie-a': 'https://flagcdn.com/w40/it.png', // Italian flag
    'france-ligue-1': 'https://flagcdn.com/w40/fr.png', // French flag
    'netherlands-eredivisie': 'https://flagcdn.com/w40/nl.png', // Dutch flag
    'portugal-liga-portugal': 'https://flagcdn.com/w40/pt.png', // Portuguese flag
    'brazil': 'https://flagcdn.com/w40/br.png', // Brazilian flag
    'argentina': 'https://flagcdn.com/w40/ar.png', // Argentine flag
    'champions-league': 'https://flagcdn.com/w40/eu.png', // EU flag for Champions League
    'europa-league': 'https://flagcdn.com/w40/eu.png', // EU flag for Europa League
  };
  
  return flagMap[leagueId] || 'https://www.sofascore.com/static/images/placeholders/tournament.svg';
};

const LeagueSection = ({ league }: LeagueSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // If no highlights, don't render the section
  if (!league.highlights || league.highlights.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Country flag with clickable link */}
          <Link to={`/competition/${league.id}`} className="block">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center hover:scale-110 transition-transform">
              <img 
                src={getCountryFlag(league.id)}
                alt={league.name}
                className="w-8 h-8 object-cover league-flag"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.sofascore.com/static/images/placeholders/tournament.svg";
                }}
              />
            </div>
          </Link>
          <div className="flex items-center space-x-3">
            <Link to={`/competition/${league.id}`} className="group hover:text-[#FFC30B] transition-colors">
              <h2 className="text-xl font-semibold tracking-tight text-white group-hover:text-[#FFC30B] transition-colors">{league.name}</h2>
            </Link>
            <span className="text-sm text-gray-400">
              {league.highlights.length} highlights
            </span>
          </div>
        </div>
        
        <Link 
          to={`/competition/${league.id}`} 
          className="text-sm text-highlight-500 hover:text-[#FFC30B] flex items-center clickable"
        >
          <span>View all</span>
          <ExternalLink size={14} className="ml-1" />
        </Link>
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
        
        {/* Only show scroll button if there are enough highlights */}
        {league.highlights.length > 3 && (
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-highlight-800/80 hover:bg-highlight-700 p-2 rounded-full shadow-md z-10 clickable"
            aria-label="See more highlights"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LeagueSection;
