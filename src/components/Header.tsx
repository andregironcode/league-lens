
import { useState, useEffect, useRef } from 'react';
import { Search, User, X, Bell, Settings, Bookmark, Sun, Moon, PencilIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MatchHighlight } from '@/types';
import { searchHighlights } from '@/services/highlightService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback, DefaultProfileImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MatchHighlight[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [username, setUsername] = useState('User Name');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

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
      const results = await searchHighlights(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (id: string) => {
    navigate(`/match/${id}`);
    setSearchQuery('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleEditUsername = () => {
    setIsEditingUsername(true);
    setTimeout(() => {
      usernameInputRef.current?.focus();
      usernameInputRef.current?.select();
    }, 100);
  };

  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInputRef.current?.value.trim()) {
      setUsername(usernameInputRef.current.value);
    }
    setIsEditingUsername(false);
  };

  const handleEditProfilePicture = () => {
    console.log('Opening profile picture edit dialog');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 py-4 md:py-3 ${
        scrolled ? 'bg-[#222222]/95 backdrop-blur-md shadow-sm' : 'bg-[#222222]/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center flex-1 space-x-4 md:space-x-6">
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/lovable-uploads/3f69b4d3-7c25-4f74-a779-c3f73cd73d08.png" 
              alt="Score 90" 
              className="h-7 md:h-8" 
            />
          </Link>

          <div ref={searchRef} className="relative flex-1 max-w-xl">
            <div className="flex items-center bg-[#333333] rounded-full w-full">
              <Search size={20} className={`ml-4 ${isSearching ? 'text-[#FFC30B]' : 'text-gray-400'} flex-shrink-0`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for teams or matches"
                className="bg-transparent text-white placeholder:text-gray-400 w-full pl-3 pr-4 py-2 rounded-full focus:outline-none"
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowResults(true);
                  }
                }}
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="mr-4 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#333333] rounded-lg shadow-lg max-h-[80vh] overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-300">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-300">
                    No results found
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <div 
                        key={result.id}
                        onClick={() => handleResultClick(result.id)}
                        className="px-4 py-2 hover:bg-[#444444] cursor-pointer"
                      >
                        <div className="flex items-center">
                          <div className="flex items-center space-x-2 flex-1">
                            <img 
                              src={result.homeTeam.logo} 
                              alt={result.homeTeam.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                            <span className="text-white text-sm">{result.score.home} - {result.score.away}</span>
                            <img 
                              src={result.awayTeam.logo} 
                              alt={result.awayTeam.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                              }}
                            />
                          </div>
                          <div className="text-gray-300 text-xs">
                            {result.competition.name}
                          </div>
                        </div>
                        <div className="text-white text-sm mt-1">{result.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center pl-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="p-2 rounded-full bg-highlight-800/50 hover:bg-highlight-700/50 transition-colors"
                aria-label="User profile"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback outlineStyle>
                    <img 
                      src={DefaultProfileImage} 
                      alt="User" 
                      className="h-full w-full object-cover"
                    />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#333333] border-[#444444] text-white">
              <DropdownMenuLabel className="flex flex-col items-center py-4">
                <div className="relative mb-2">
                  <Avatar 
                    className="h-16 w-16 cursor-pointer hover:opacity-90 transition-opacity"
                    showEditButton
                    onEditClick={handleEditProfilePicture}
                  >
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback outlineStyle>
                      <img 
                        src={DefaultProfileImage} 
                        alt="User" 
                        className="h-full w-full object-cover"
                      />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {isEditingUsername ? (
                  <form onSubmit={handleUsernameChange} className="flex items-center mb-1">
                    <input
                      ref={usernameInputRef}
                      type="text"
                      defaultValue={username}
                      className="text-base bg-[#444444] px-2 py-1 rounded text-center focus:outline-none focus:ring-1 focus:ring-[#FFC30B]"
                      onBlur={handleUsernameChange}
                    />
                  </form>
                ) : (
                  <div className="flex items-center mb-1">
                    <span className="text-base font-medium">{username}</span>
                    <button 
                      onClick={handleEditUsername}
                      className="ml-2 p-1 hover:bg-[#444444] rounded-full transition-colors"
                    >
                      <PencilIcon size={12} className="text-gray-400" />
                    </button>
                  </div>
                )}
                
                <span className="text-xs text-gray-400">user@example.com</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#444444]" />
              <DropdownMenuItem className="cursor-pointer hover:bg-[#444444] focus:bg-[#444444]">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-[#444444] focus:bg-[#444444]">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-[#444444] focus:bg-[#444444]">
                <Bookmark className="mr-2 h-4 w-4" />
                <span>Saved Games</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#444444]" />
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-[#444444] focus:bg-[#444444]"
                onClick={toggleTheme}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {isDarkMode ? 
                      <Sun className="mr-2 h-4 w-4" /> : 
                      <Moon className="mr-2 h-4 w-4" />
                    }
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative ${isDarkMode ? 'bg-[#FFC30B]' : 'bg-[#555555]'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                      isDarkMode ? 'bg-white right-0.5' : 'bg-white left-0.5'
                    }`}></div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
