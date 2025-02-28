
import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 py-4 md:py-3 ${
        scrolled ? 'bg-[#222222]/95 backdrop-blur-md shadow-sm' : 'bg-[#222222]/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center flex-1 space-x-4 md:space-x-6">
          {/* Logo - sized similar to FotMob */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/lovable-uploads/3f69b4d3-7c25-4f74-a779-c3f73cd73d08.png" 
              alt="Score 90" 
              className="h-7 md:h-8" 
            />
          </Link>

          {/* Search bar - styled similar to FotMob */}
          <div className="relative flex-1 max-w-xl">
            <div className="flex items-center bg-[#333333] rounded-full w-full">
              <Search size={20} className="ml-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent text-white placeholder:text-gray-400 w-full pl-3 pr-4 py-2 rounded-full focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center pl-4">
          <button 
            className="p-2 rounded-full bg-highlight-800/50 hover:bg-highlight-700/50 transition-colors"
            aria-label="User profile"
          >
            <User size={20} className="text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
