import { useState, useEffect } from 'react';
import { Navigation, type Page } from './components/Navigation';
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
import { IntelligenceCenter } from './pages/IntelligenceCenter';
import { PageTransition } from './components/motion';
import { loadDemoData } from './utils/mockData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [selectedRaidId, setSelectedRaidId] = useState<string | null>(null);
  const [showRaidPopup, setShowRaidPopup] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (!isDataLoaded) {
      const hasVisited = localStorage.getItem('abi_has_visited');
      if (!hasVisited) {
        loadDemoData();
        localStorage.setItem('abi_has_visited', 'true');
      }
      setIsDataLoaded(true);
    }
  }, [isDataLoaded]);

  const handleRaidClick = (raidId: string) => {
    setSelectedRaidId(raidId);
    setShowRaidPopup(true);
  };

  const handleNavigate = (page: Page) => {
    // Dashboard duplicated Economy — fold into Economy
    setCurrentPage(page === 'dashboard' ? 'economy' : page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview onRaidClick={handleRaidClick} />;
      case 'dashboard':
      case 'economy':
        return <Economy />;
      case 'raids':
        return <RaidsPage onRaidClick={handleRaidClick} />;
      case 'sessions':
        return <Sessions onRaidClick={handleRaidClick} />;
      case 'highlights':
        return <Highlights onRaidClick={handleRaidClick} />;
      case 'lootdb':
        return <LootDB />;
      case 'gear':
        return <Gear />;
      case 'performance':
        return <Performance />;
      case 'intelligence':
        return <IntelligenceCenter />;
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
      <a
        href="#main-content"
        className="sr-only type-label focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-abi-orange focus:text-abi-bg focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />

      <main id="main-content" className="main-content">
        <div className="lg:hidden h-16" />

        <PageTransition pageKey={currentPage} className="page-content">
          {renderPage()}
        </PageTransition>
      </main>

      <RaidDetailPopup
        raidId={selectedRaidId}
        isOpen={showRaidPopup}
        onClose={() => setShowRaidPopup(false)}
      />
    </div>
  );
}
