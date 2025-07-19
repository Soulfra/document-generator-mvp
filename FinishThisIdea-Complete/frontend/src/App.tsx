import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import JobPage from './pages/JobPage';
import ProfilesPage from './pages/ProfilesPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ReferralDashboard from './components/Referral/ReferralDashboard';
import AchievementSystem from './components/Gamification/AchievementSystem';
import Challenges from './components/Gamification/Challenges';
import MarketplacePage from './pages/MarketplacePage';
import AgentBuilderPage from './pages/AgentBuilderPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/job/:jobId" element={<JobPage />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/profile/:username" element={<PublicProfilePage />} />
            <Route path="/referrals" element={<ReferralDashboard />} />
            <Route path="/achievements" element={<AchievementSystem />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/agent-builder" element={<AgentBuilderPage />} />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;