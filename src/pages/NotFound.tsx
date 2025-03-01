
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const NotFound = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} ${isDarkMode ? 'text-white' : 'text-black'} flex flex-col items-center justify-center p-4`}>
      <h1 className="text-4xl md:text-6xl font-bold mb-4">404</h1>
      <p className="text-xl md:text-2xl mb-8 text-center">
        The highlight you're looking for doesn't exist
      </p>
      <Link
        to="/"
        className={`${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} px-6 py-3 rounded-full font-semibold flex items-center hover:bg-opacity-90 transition-colors`}
      >
        <Home className="w-5 h-5 mr-2" />
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
