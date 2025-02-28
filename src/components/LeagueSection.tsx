
import { useState } from "react";
import { League } from "@/types";
import HighlightCard from "./HighlightCard";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LeagueSectionProps {
  league: League;
}

const LeagueSection = ({ league }: LeagueSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center space-x-3 mb-4">
        {/* This would be a real league logo in production */}
        <div className="w-8 h-8 rounded-full bg-highlight-800 flex items-center justify-center overflow-hidden">
          <img 
            src={league.logo !== '/leagues/premierleague.png' ? 
                 `https://api.sofascore.app/api/v1/unique-tournament/${league.id}/image` : 
                 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png'} 
            alt={league.name}
            className="w-6 h-6 object-contain"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {league.highlights.map((highlight) => (
            <div key={highlight.id} className="transform transition-all duration-300 hover:z-10">
              <HighlightCard highlight={highlight} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueSection;
