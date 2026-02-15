import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { UserProfile } from './types';
import ProfileSetup from './components/ProfileSetup';
import VenueSearch from './components/VenueSearch';
import LiveAssistant from './components/LiveAssistant';
import ChatAssistant from './components/ChatAssistant';
import ImageTools from './components/ImageTools';
import BusinessClaim from './components/BusinessClaim';

const DEFAULT_PROFILE: UserProfile = {
  mobility: { wheelchair: false, walker: false, cane: false, noStairs: false },
  sensory: { lowNoise: false, lowLight: false, scentFree: false },
  visual: { braille: false, screenReader: false },
  other: { serviceAnimal: false, accessibleRestroom: false, accessibleParking: false }
};

const NavLink = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center p-2 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
      <span className="material-symbols-outlined text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
      // Load fonts for icons
      const link = document.createElement('link');
      link.href = "https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined";
      link.rel = "stylesheet";
      document.head.appendChild(link);
  }, []);

  return (
    <Router>
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10 px-4 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">OA</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">OpenAccess</h1>
          </div>
          <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-lg">person</span>
          </Link>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Routes>
            <Route path="/" element={<VenueSearch profile={profile} />} />
            <Route path="/live" element={<LiveAssistant />} />
            <Route path="/chat" element={<ChatAssistant profile={profile} />} />
            <Route path="/create" element={<ImageTools />} />
            <Route path="/profile" element={<ProfileSetup profile={profile} onSave={setProfile} />} />
            <Route path="/claim" element={<BusinessClaim />} />
          </Routes>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-slate-200 shrink-0 pb-safe">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            <NavLink to="/" icon="map" label="Explore" />
            <NavLink to="/live" icon="graphic_eq" label="Live" />
            <NavLink to="/chat" icon="chat_spark" label="Ask AI" />
            <NavLink to="/create" icon="image" label="Tools" />
          </div>
        </nav>
      </div>
    </Router>
  );
}
