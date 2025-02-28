
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 py-3 md:px-10 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="text-xl md:text-2xl font-semibold tracking-tight transition-colors hover:text-highlight-700">
            League<span className="font-light">Lens</span>
          </a>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex items-center space-x-6">
            <a 
              href="/" 
              className="text-sm font-medium transition-colors hover:text-highlight-700"
            >
              Home
            </a>
            <a 
              href="#leagues" 
              className="text-sm font-medium transition-colors hover:text-highlight-700"
            >
              Leagues
            </a>
            <a 
              href="#latest" 
              className="text-sm font-medium transition-colors hover:text-highlight-700"
            >
              Latest
            </a>
          </nav>
        </div>

        <div className="flex items-center">
          <button 
            className="p-2 rounded-full transition-colors hover:bg-highlight-200"
            aria-label="Search"
          >
            <Search size={20} className="text-highlight-700" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
