
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { fetchMatches } from '@/services/highlightService';
import HeaderLinks from './HeaderLinks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-mobile';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Close menu when screen size changes
  useEffect(() => {
    if (!isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMobile, isMenuOpen]);

  // Handle clicks outside the search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Fetch all matches and filter by search query
      const matches = await fetchMatches();
      const filteredResults = matches.filter((match: any) => 
        match.homeTeam.name.toLowerCase().includes(query.toLowerCase()) || 
        match.awayTeam.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Limit to 5 results
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching matches:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchItemClick = (matchId: string) => {
    navigate(`/match/${matchId}`);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-highlight-900 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-xl text-white">Highlightly</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center space-x-8">
            <HeaderLinks />
          </div>

          {/* Search Input */}
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search teams, matches..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-56 bg-highlight-800 border-highlight-700 text-white pr-8"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute mt-1 w-full bg-highlight-800 border border-highlight-700 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-highlight-500 mx-auto"></div>
                    <div className="mt-2">Searching...</div>
                  </div>
                ) : (
                  <ul>
                    {searchResults.map((result) => (
                      <li
                        key={result.id}
                        className="px-4 py-2 hover:bg-highlight-700 cursor-pointer"
                        onClick={() => handleSearchItemClick(result.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <img
                              src={result.homeTeam.logo}
                              alt={result.homeTeam.name}
                              className="w-5 h-5 mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                            <span className="text-white">{result.homeTeam.name}</span>
                          </div>
                          <span className="text-gray-400 mx-2">vs</span>
                          <div className="flex items-center">
                            <span className="text-white">{result.awayTeam.name}</span>
                            <img
                              src={result.awayTeam.logo}
                              alt={result.awayTeam.name}
                              className="w-5 h-5 ml-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-highlight-800">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <HeaderLinks mobile />
            
            {/* Mobile Search */}
            <div className="pt-2" ref={searchRef}>
              <Input
                type="text"
                placeholder="Search teams, matches..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-highlight-700 border-highlight-600 text-white"
              />
              
              {/* Mobile Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-1 w-full bg-highlight-700 border border-highlight-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  <ul>
                    {searchResults.map((result) => (
                      <li
                        key={result.id}
                        className="px-4 py-3 hover:bg-highlight-600 cursor-pointer border-b border-highlight-600 last:border-b-0"
                        onClick={() => handleSearchItemClick(result.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <img
                              src={result.homeTeam.logo}
                              alt={result.homeTeam.name}
                              className="w-5 h-5 mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                            <span className="text-white">{result.homeTeam.name}</span>
                          </div>
                          <span className="text-gray-400 mx-2">vs</span>
                          <div className="flex items-center">
                            <span className="text-white">{result.awayTeam.name}</span>
                            <img
                              src={result.awayTeam.logo}
                              alt={result.awayTeam.name}
                              className="w-5 h-5 ml-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
