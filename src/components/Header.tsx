
import { useState, useEffect } from 'react';
import { Search, X, Home, Calendar, Star, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery('');
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 py-3 md:px-10 ${
        scrolled || searchOpen
          ? 'bg-background/95 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-xl md:text-2xl font-semibold tracking-tight transition-colors hover:text-highlight-700">
            League<span className="font-light">Lens</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-sm font-medium transition-colors hover:text-highlight-700 flex items-center"
            >
              <Home size={18} className="mr-2" />
              Home
            </Link>
            <a 
              href="#leagues" 
              className="text-sm font-medium transition-colors hover:text-highlight-700 flex items-center"
            >
              <Calendar size={18} className="mr-2" />
              Leagues
            </a>
            <a 
              href="#latest" 
              className="text-sm font-medium transition-colors hover:text-highlight-700 flex items-center"
            >
              <Star size={18} className="mr-2" />
              Latest
            </a>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {searchOpen ? (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for teams, leagues, matches..."
                className="bg-highlight-800/50 text-white placeholder:text-gray-400 w-[300px] py-2 pl-4 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-highlight-700"
                autoFocus
              />
              <button 
                onClick={handleSearchToggle}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X size={18} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSearchToggle}
              className="p-2 rounded-full transition-colors hover:bg-highlight-800/50"
              aria-label="Search"
            >
              <Search size={20} className="text-white" />
            </button>
          )}
          
          <button 
            className="md:hidden p-2 rounded-full transition-colors hover:bg-highlight-800/50"
            aria-label="Menu"
          >
            <Menu size={20} className="text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
