
import { useState, useRef } from "react";
import { League } from "@/types";
import HighlightCard from "./HighlightCard";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

interface LeagueSectionProps {
  league: League;
}

// Helper function to get country flag based on league ID
const getCountryFlag = (leagueId: string): string => {
  const flagMap: Record<string, string> = {
    'pl': 'https://flagcdn.com/w40/gb-eng.png', // English flag
    'laliga': 'https://flagcdn.com/w40/es.png', // Spanish flag
    'bundesliga': 'https://flagcdn.com/w40/de.png', // German flag
    'seriea': 'https://flagcdn.com/w40/it.png', // Italian flag
    'ligue1': 'https://flagcdn.com/w40/fr.png', // French flag
    'eredivisie': 'https://flagcdn.com/w40/nl.png', // Dutch flag
    'portugal': 'https://flagcdn.com/w40/pt.png', // Portuguese flag
    'brazil': 'https://flagcdn.com/w40/br.png', // Brazilian flag
    'argentina': 'https://flagcdn.com/w40/ar.png', // Argentine flag
  };
  
  return flagMap[leagueId] || 'https://www.sofascore.com/static/images/placeholders/tournament.svg';
};

const LeagueSection = ({ league }: LeagueSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center space-x-3 mb-4">
        {/* Country flag instead of league logo */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
          <img 
            src={getCountryFlag(league.id)}
            alt={league.name}
            className="w-8 h-8 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://www.sofascore.com/static/images/placeholders/tournament.svg";
            }}
          />
        </div>
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold tracking-tight text-white">{league.name}</h2>
            <span className="text-sm text-gray-400">
              {league.highlights.length} highlights
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full hover:bg-highlight-800 transition-colors"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
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
      )}
    </div>
  );
};

export default LeagueSection;
