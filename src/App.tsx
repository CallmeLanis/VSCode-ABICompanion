import { useState, useEffect } from 'react';
import { Navigation, type Page } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { RaidsPage } from './pages/RaidsPage';
import { RaidDetailPopup } from './pages/RaidDetailPopup';
import { Sessions } from './pages/Sessions';
import { Highlights } from './pages/Highlights';
import { LootDB } from './pages/LootDB';
import { Economy } from './pages/Economy';
import { Commander } from './pages/Commander';
import { SettingsPage } from './pages/Settings';
import { Overview } from './pages/Overview';
import { Gear } from './pages/Gear';
import { Performance } from './pages/Performance';
import { generateMockRaids, generateMockSessions, generateMockHighlights } from './utils/mockData';
import { saveRaids, saveSessions, saveHighlights } from './utils/storage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [selectedRaidId, setSelectedRaidId] = useState<string | null>(null);
  const [showRaidPopup, setShowRaidPopup] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Initialize mock data if storage is empty (only on first visit)
  useEffect(() => {
    if (!isDataLoaded) {
      const hasVisited = localStorage.getItem('abi_has_visited');
      if (!hasVisited) {
        const mockRaids = generateMockRaids();
        const mockSessions = generateMockSessions();
        const mockHighlights = generateMockHighlights();
        saveRaids(mockRaids);
        saveSessions(mockSessions);
        saveHighlights(mockHighlights);
        localStorage.setItem('abi_has_visited', 'true');
      }
      setIsDataLoaded(true);
    }
  }, [isDataLoaded]);

  // Handle raid click
  const handleRaidClick = (raidId: string) => {
    setSelectedRaidId(raidId);
    setShowRaidPopup(true);
  };

  // Handle session click
  const handleSessionClick = (_sessionId: string) => {
    // Navigate to sessions
    setCurrentPage('sessions');
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview onRaidClick={handleRaidClick} />;
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'raids':
        return <RaidsPage onRaidClick={handleRaidClick} />;
      case 'sessions':
        return <Sessions onRaidClick={handleRaidClick} />;
      case 'highlights':
        return <Highlights onRaidClick={handleRaidClick} />;
      case 'lootdb':
        return <LootDB />;
      case 'economy':
        return <Economy />;
      case 'gear':
        return <Gear />;
      case 'performance':
        return <Performance />;
      case 'commander':
        return <Commander />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile header spacer */}
        <div className="lg:hidden h-16" />

        {/* Page Content */}
        <div className="page-content">
          {renderPage()}
        </div>
      </main>

      {/* Raid Detail Popup */}
      <RaidDetailPopup
        raidId={selectedRaidId}
        isOpen={showRaidPopup}
        onClose={() => setShowRaidPopup(false)}
      />
    </div>
  );
}
