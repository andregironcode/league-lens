
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import MatchDetails from '@/pages/MatchDetails';
import TeamPage from '@/pages/TeamPage';
import CompetitionPage from '@/pages/CompetitionPage';
import SearchPage from '@/pages/SearchPage';
import NotFound from '@/pages/NotFound';
import SettingsPage from '@/pages/SettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/match/:id" element={<MatchDetails />} />
        <Route path="/team/:teamId" element={<TeamPage />} />
        <Route path="/competition/:competitionId" element={<CompetitionPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
