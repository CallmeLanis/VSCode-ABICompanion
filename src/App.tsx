import { useState } from 'react';
import { Navigation, type Page } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { RaidLedger } from './pages/RaidLender';
import { RaidDetailPopup } from './pages/RaidDetailPopup';
import { Sessions } from './pages/Sessions';
import { Highlights } from './pages/Highlights';
import { LootDB } from './pages/LootDB';
import { Economy } from './pages/Economy';
import { Commander } from './pages/Commander';
import { SettingsPage } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedRaidId, setSelectedRaidId] = useState<string | null>(null);
  const [showRaidPopup, setShowRaidPopup] = useState(false);

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
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setCurrentPage}
            onRaidClick={handleRaidClick}
            onSessionClick={handleSessionClick}
          />
        );
      case 'raids':
        return <RaidLedger onRaidClick={handleRaidClick} />;
      case 'sessions':
        return <Sessions onRaidClick={handleRaidClick} />;
      case 'highlights':
        return <Highlights onRaidClick={handleRaidClick} />;
      case 'lootdb':
        return <LootDB />;
      case 'economy':
        return <Economy />;
      case 'commander':
        return <Commander />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-abi-bg text-abi-text">
      {/* Navigation */}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content */}
      <main className="min-h-screen lg:pl-0">
        {/* Mobile header spacer */}
        <div className="lg:hidden h-16" />

        {/* Page Content */}
        <div className="p-4 lg:p-6">
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
