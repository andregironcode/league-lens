
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold tracking-tight">{league.name}</h2>
          <span className="text-sm text-muted-foreground">
            {league.highlights.length} highlights
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>
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
