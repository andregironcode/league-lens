
import { useState, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { fetchLeagues } from '@/services/highlightService';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterProps {
  onFilterChange: (filters: {
    league?: string;
    country?: string;
    date?: Date;
  }) => void;
}

const EnhancedMatchFilters = ({ onFilterChange }: FilterProps) => {
  const [leagues, setLeagues] = useState<{id: string, name: string}[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch leagues from API
        const leaguesData = await fetchLeagues();
        
        // Extract leagues
        const extractedLeagues = leaguesData?.map((league: any) => ({
          id: league.id,
          name: league.name
        })) || [];
        
        // Extract unique countries
        const extractedCountries = Array.from(
          new Set(leaguesData?.map((league: any) => league.country).filter(Boolean))
        ) as string[];
        
        setLeagues(extractedLeagues);
        setCountries(extractedCountries);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilterData();
  }, []);

  const handleLeagueSelect = (league: string) => {
    const newLeague = league === selectedLeague ? null : league;
    setSelectedLeague(newLeague);
    
    onFilterChange({
      league: newLeague || undefined,
      country: selectedCountry || undefined
    });
  };

  const handleCountrySelect = (country: string) => {
    const newCountry = country === selectedCountry ? null : country;
    setSelectedCountry(newCountry);
    
    onFilterChange({
      league: selectedLeague || undefined,
      country: newCountry || undefined
    });
  };

  const clearFilters = () => {
    setSelectedLeague(null);
    setSelectedCountry(null);
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-highlight-800 rounded-lg">
      <div className="flex items-center">
        <span className="text-white mr-3">Filters:</span>
        
        {/* League Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-highlight-700 border-highlight-600 text-white hover:bg-highlight-600 focus:ring-offset-0 flex items-center"
              disabled={loading}
            >
              {selectedLeague ? selectedLeague : 'League'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-highlight-700 border-highlight-600 text-white p-0">
            <div className="max-h-[300px] overflow-auto py-1">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-highlight-600 ${
                    selectedLeague === league.name ? 'bg-highlight-600' : ''
                  }`}
                  onClick={() => handleLeagueSelect(league.name)}
                >
                  <span>{league.name}</span>
                  {selectedLeague === league.name && <Check className="h-4 w-4" />}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Country Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-highlight-700 border-highlight-600 text-white hover:bg-highlight-600 focus:ring-offset-0 ml-2 flex items-center"
              disabled={loading}
            >
              {selectedCountry ? selectedCountry : 'Country'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-highlight-700 border-highlight-600 text-white p-0">
            <div className="max-h-[300px] overflow-auto py-1">
              {countries.map((country) => (
                <div
                  key={country}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-highlight-600 ${
                    selectedCountry === country ? 'bg-highlight-600' : ''
                  }`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <span>{country}</span>
                  {selectedCountry === country && <Check className="h-4 w-4" />}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Applied Filters */}
      <div className="flex-1 flex flex-wrap gap-2 mt-2 md:mt-0">
        {selectedLeague && (
          <Badge variant="secondary" className="bg-highlight-600 hover:bg-highlight-700 gap-1 items-center">
            League: {selectedLeague}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleLeagueSelect(selectedLeague)} />
          </Badge>
        )}
        {selectedCountry && (
          <Badge variant="secondary" className="bg-highlight-600 hover:bg-highlight-700 gap-1 items-center">
            Country: {selectedCountry}
            <X className="h-3 w-3 cursor-pointer" onClick={() => handleCountrySelect(selectedCountry)} />
          </Badge>
        )}
        {(selectedLeague || selectedCountry) && (
          <Badge variant="destructive" className="cursor-pointer" onClick={clearFilters}>
            Clear all
          </Badge>
        )}
      </div>
    </div>
  );
};

export default EnhancedMatchFilters;
