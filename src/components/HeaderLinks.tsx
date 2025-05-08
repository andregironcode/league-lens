
import { NavLink } from 'react-router-dom';
import { Radio, BarChart2, Calendar, Clock } from 'lucide-react';

const HeaderLinks = () => {
  return (
    <nav className="hidden md:flex items-center space-x-6">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `text-sm font-medium ${isActive ? 'text-[#FFC30B]' : 'text-white hover:text-[#FFC30B]'} transition-colors`
        }
      >
        Home
      </NavLink>
      <NavLink 
        to="/live" 
        className={({ isActive }) => 
          `text-sm font-medium flex items-center ${isActive ? 'text-[#FFC30B]' : 'text-white hover:text-[#FFC30B]'} transition-colors`
        }
      >
        <Radio size={16} className="mr-1" />
        Live Scores
      </NavLink>
      <NavLink 
        to="/league/pl" 
        className={({ isActive }) => 
          `text-sm font-medium flex items-center ${isActive ? 'text-[#FFC30B]' : 'text-white hover:text-[#FFC30B]'} transition-colors`
        }
      >
        <BarChart2 size={16} className="mr-1" />
        Standings
      </NavLink>
      <NavLink 
        to="/fixtures" 
        className={({ isActive }) => 
          `text-sm font-medium flex items-center ${isActive ? 'text-[#FFC30B]' : 'text-white hover:text-[#FFC30B]'} transition-colors`
        }
      >
        <Calendar size={16} className="mr-1" />
        Fixtures
      </NavLink>
    </nav>
  );
};

export default HeaderLinks;
