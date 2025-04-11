
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import LiveScores from '@/pages/LiveScores';
import Fixtures from '@/pages/Fixtures';
import MatchDetails from '@/pages/MatchDetails';
import TeamPage from '@/pages/TeamPage';
import LeaguePage from '@/pages/LeaguePage';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/live" element={<LiveScores />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/match/:id" element={<MatchDetails />} />
        <Route path="/team/:teamId" element={<TeamPage />} />
        <Route path="/league/:leagueId" element={<LeaguePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
