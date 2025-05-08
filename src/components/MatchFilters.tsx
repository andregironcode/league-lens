
import { useState, useEffect } from 'react';
import { fetchLeagues } from '@/services/highlightService';
import { CalendarIcon, ChevronDown, Globe } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Button } from '@/components/ui/button';

interface MatchFiltersProps {
  onFilterChange: (filters: {
    league?: string;
    country?: string;
    date?: Date;
  }) => void;
}

const MatchFilters = ({ onFilterChange }: MatchFiltersProps) => {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLeagueOpen, setIsLeagueOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  
  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const leaguesData = await fetchLeagues();
        setLeagues(leaguesData);
        
        // Extract unique countries
        const uniqueCountries = Array.from(
          new Set(leaguesData.map((league: any) => league.country))
        ).filter(Boolean);
        setCountries(uniqueCountries as string[]);
      } catch (error) {
        console.error('Failed to load leagues:', error);
      }
    };
    
    loadLeagues();
  }, []);

  useEffect(() => {
    onFilterChange({
      league: selectedLeague || undefined,
      country: selectedCountry || undefined,
      date: selectedDate
    });
  }, [selectedLeague, selectedCountry, selectedDate, onFilterChange]);

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeague(leagueId === selectedLeague ? null : leagueId);
    setIsLeagueOpen(false);
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country === selectedCountry ? null : country);
    setIsCountryOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const clearFilters = () => {
    setSelectedLeague(null);
    setSelectedCountry(null);
    setSelectedDate(undefined);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3">
        {/* League filter */}
        <Popover open={isLeagueOpen} onOpenChange={setIsLeagueOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`bg-highlight-800 border-highlight-700 hover:bg-highlight-700 ${
                selectedLeague ? 'text-[#FFC30B]' : 'text-white'
              }`}
            >
              <span className="mr-1">League</span>
              <ChevronDown size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-h-80 overflow-y-auto bg-highlight-800 border-highlight-700 p-0">
            <div className="p-2">
              {leagues.map((league) => (
                <div 
                  key={league.id}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-highlight-700 ${
                    selectedLeague === league.id ? 'bg-highlight-700 text-[#FFC30B]' : 'text-white'
                  }`}
                  onClick={() => handleLeagueSelect(league.id)}
                >
                  {league.logo && (
                    <img 
                      src={league.logo} 
                      alt={league.name} 
                      className="w-5 h-5 mr-2 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  )}
                  <span className="text-sm">{league.name}</span>
                </div>
              ))}
              {leagues.length === 0 && (
                <div className="p-2 text-center text-gray-400">
                  No leagues available
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Country filter */}
        <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`bg-highlight-800 border-highlight-700 hover:bg-highlight-700 ${
                selectedCountry ? 'text-[#FFC30B]' : 'text-white'
              }`}
            >
              <Globe size={16} className="mr-1" />
              <span className="mr-1">Country</span>
              <ChevronDown size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-h-80 overflow-y-auto bg-highlight-800 border-highlight-700 p-0">
            <div className="p-2">
              {countries.map((country) => (
                <div 
                  key={country}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-highlight-700 ${
                    selectedCountry === country ? 'bg-highlight-700 text-[#FFC30B]' : 'text-white'
                  }`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-sm">{country}</span>
                </div>
              ))}
              {countries.length === 0 && (
                <div className="p-2 text-center text-gray-400">
                  No countries available
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Date filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`bg-highlight-800 border-highlight-700 hover:bg-highlight-700 ${
                selectedDate ? 'text-[#FFC30B]' : 'text-white'
              }`}
            >
              <CalendarIcon size={16} className="mr-1" />
              {selectedDate ? format(selectedDate, "PPP") : "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-highlight-800 border-highlight-700">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="bg-highlight-800 text-white"
              classNames={{
                day_selected: "bg-[#FFC30B] text-black",
                day_today: "text-[#FFC30B]",
              }}
            />
          </PopoverContent>
        </Popover>
        
        {/* Clear filters button */}
        {(selectedLeague || selectedCountry || selectedDate) && (
          <Button 
            variant="outline" 
            className="bg-highlight-900 border-highlight-700 hover:bg-highlight-800 text-gray-300"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default MatchFilters;
