import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Match, Team, League } from '@/types';
import { searchEntities } from '@/services/serviceAdapter';
import ServiceSwitcher from './ServiceSwitcher';

const Header = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ type: 'match' | 'team' | 'league'; item: any }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const { matches, teams, leagues } = await searchEntities(searchQuery);
      const flattened: Array<{ type: 'match' | 'team' | 'league'; item: any }> = [
        ...matches.map((m: Match) => ({ type: 'match', item: m })),
        ...teams.map((t: Team) => ({ type: 'team', item: t })),
        ...leagues.map((l: League) => ({ type: 'league', item: l })),
      ];
      setSearchResults(flattened);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: { type: 'match' | 'team' | 'league'; item: any }) => {
    switch (result.type) {
      case 'match':
        navigate(`/match/${result.item.id}`);
        break;
      case 'team':
        navigate(`/team/${result.item.id}`);
        break;
      case 'league':
        navigate(`/league/${result.item.id}`);
        break;
      default:
        break;
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 py-4 md:py-3 ${
        scrolled ? 'bg-[#222222]/95 backdrop-blur-md shadow-sm' : 'bg-[#222222]/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Logo - Left Side */}
        <div className="flex-shrink-0 flex items-center space-x-8">
          <Link to="/" className="flex items-center transition-transform duration-200 hover:scale-110">
            <img 
              src="/lovable-uploads/3f69b4d3-7c25-4f74-a779-c3f73cd73d08.png" 
              alt="Score 90" 
              className="h-8 md:h-9" 
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            {/* Navigation links can be added here when needed */}
            {/* <Link to="/teams" className="text-gray-300 hover:text-white font-medium transition-colors">
              Teams
            </Link> */}
          </nav>
        </div>

        {/* Search Bar - Center */}
        <div className="flex-1 flex justify-center px-8">
          <div ref={searchRef} className="relative w-full max-w-xl">
            <div className="flex items-center bg-[#333333] rounded-full w-full shadow-lg border border-gray-600/30">
              <Search size={24} className={`ml-5 ${isSearching ? 'text-[#FFC30B]' : 'text-gray-400'} flex-shrink-0`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for teams or matches"
                className="bg-transparent text-white placeholder:text-gray-400 w-full pl-4 pr-5 py-2 rounded-full focus:outline-none text-lg font-medium"
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowResults(true);
                  }
                }}
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="mr-5 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#333333] rounded-xl shadow-xl border border-gray-600/30 max-h-[80vh] overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-6 text-center text-gray-300">
                    <div className="inline-flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC30B]"></div>
                      <span>Searching...</span>
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-300">
                    <div className="text-gray-400 mb-2">
                      <Search size={24} className="mx-auto opacity-50" />
                    </div>
                    No results found
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((result, idx) => (
                      <div 
                        key={`${result.type}-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className="px-6 py-3 hover:bg-[#444444] cursor-pointer transition-colors duration-200 border-b border-gray-600/20 last:border-b-0"
                      >
                        {result.type === 'match' ? (
                          (() => {
                            const homeTeam = result.item.homeTeam ?? result.item.teams?.home;
                            const awayTeam = result.item.awayTeam ?? result.item.teams?.away;
                            const scoreHome = result.item.score?.home ?? result.item.goals?.home ?? '-';
                            const scoreAway = result.item.score?.away ?? result.item.goals?.away ?? '-';
                            return (
                              <div className="flex items-center space-x-3">
                                {homeTeam && (
                                  <img
                                    src={homeTeam.logo}
                                    alt={homeTeam.name}
                                    className="w-7 h-7 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'https://www.sofascore.com/static/images/placeholders/team.svg';
                                    }}
                                  />
                                )}
                                <span className="text-white text-base font-semibold">{scoreHome} - {scoreAway}</span>
                                {awayTeam && (
                                  <img
                                    src={awayTeam.logo}
                                    alt={awayTeam.name}
                                    className="w-7 h-7 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'https://www.sofascore.com/static/images/placeholders/team.svg';
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })()
                        ) : result.type === 'team' ? (
                          <div className="flex items-center space-x-3">
                            <img
                              src={result.item.logo}
                              alt={result.item.name}
                              className="w-7 h-7 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://www.sofascore.com/static/images/placeholders/team.svg';
                              }}
                            />
                            <span className="text-white text-base font-semibold">{result.item.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <img
                              src={result.item.logo}
                              alt={result.item.name}
                              className="w-7 h-7 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://www.sofascore.com/static/images/placeholders/team.svg';
                              }}
                            />
                            <span className="text-white text-base font-semibold">{result.item.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Service Switcher - Right Side */}
        <div className="flex-shrink-0">
        <div className="hidden md:block">
          <ServiceSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
