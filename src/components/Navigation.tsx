import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Swords,
  Clock,
  Star,
  Database,
  TrendingUp,
  Crosshair,
  Shield,
  User,
  Settings,
  Menu,
  X,
  Activity,
  Radar,
} from 'lucide-react';

type Page =
  | 'overview'
  | 'dashboard'
  | 'raids'
  | 'sessions'
  | 'highlights'
  | 'lootdb'
  | 'economy'
  | 'gear'
  | 'performance'
  | 'intelligence'
  | 'commander'
  | 'settings';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_SECTIONS: {
  label: string;
  items: { id: Page; label: string; icon: React.ReactNode }[];
}[] = [
  {
    label: 'Ops',
    items: [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} strokeWidth={1.75} /> },
      { id: 'raids', label: 'Raids', icon: <Swords size={18} strokeWidth={1.75} /> },
      { id: 'sessions', label: 'Sessions', icon: <Clock size={18} strokeWidth={1.75} /> },
      { id: 'highlights', label: 'Highlights', icon: <Star size={18} strokeWidth={1.75} /> },
    ],
  },
  {
    label: 'Intel',
    items: [
      { id: 'economy', label: 'Economy', icon: <TrendingUp size={18} strokeWidth={1.75} /> },
      { id: 'gear', label: 'Gear', icon: <Shield size={18} strokeWidth={1.75} /> },
      { id: 'performance', label: 'Performance', icon: <Activity size={18} strokeWidth={1.75} /> },
      { id: 'lootdb', label: 'Loot DB', icon: <Database size={18} strokeWidth={1.75} /> },
      { id: 'intelligence', label: 'Intelligence', icon: <Radar size={18} strokeWidth={1.75} /> },
    ],
  },
  {
    label: 'Unit',
    items: [
      { id: 'commander', label: 'Commander', icon: <User size={18} strokeWidth={1.75} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.75} /> },
    ],
  },
];

interface NavLinksProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  showLabels?: boolean;
}

function NavLinks({ currentPage, onNavigate, showLabels = true }: NavLinksProps) {
  return (
    <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {showLabels && (
            <p className="px-3 mb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-abi-text-dim">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md
                    transition-colors duration-150 relative
                    ${
                      isActive
                        ? 'text-abi-orange bg-abi-orange/10 border border-abi-orange/25'
                        : 'text-abi-text-muted border border-transparent hover:text-abi-text hover:bg-abi-bg-hover hover:border-abi-border'
                    }
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-abi-orange" />
                  )}
                  <span className={`flex-shrink-0 ${isActive ? 'text-abi-orange' : ''}`}>
                    {item.icon}
                  </span>
                  {showLabels && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openNav = useCallback(() => {
    clearCloseTimer();
    setIsNavOpen(true);
  }, [clearCloseTimer]);

  const closeNav = useCallback(() => {
    clearCloseTimer();
    setIsNavOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsNavOpen(false);
      closeTimerRef.current = null;
    }, 200);
  }, [clearCloseTimer]);

  const toggleNav = useCallback(() => {
    clearCloseTimer();
    setIsNavOpen((prev) => !prev);
  }, [clearCloseTimer]);

  const handleNavigate = useCallback(
    (page: Page) => {
      onNavigate(page);
      setIsMobileOpen(false);
      closeNav();
    },
    [onNavigate, closeNav],
  );

  useEffect(() => {
    if (!isNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNav();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isNavOpen, closeNav]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-abi-bg/95 border-b border-abi-border px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-abi-orange/50 bg-abi-orange/10 flex items-center justify-center">
              <Crosshair size={16} className="text-abi-orange" strokeWidth={2} />
            </div>
            <div>
              <span className="font-orbitron text-sm font-semibold text-abi-text tracking-wide">
                ABI
              </span>
              <span className="font-mono text-[10px] text-abi-text-muted ml-2 tracking-widest uppercase">
                Companion
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-abi-text-muted hover:text-abi-text border border-transparent hover:border-abi-border rounded-md"
            aria-label="Toggle menu"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          mobile-nav-drawer
          flex flex-col lg:hidden
          ${isMobileOpen ? 'translate-x-0 fixed inset-y-0 left-0 z-40' : '-translate-x-full fixed inset-y-0 left-0 z-40'}
        `}
        aria-hidden={!isMobileOpen}
      >
        <div className="flex items-center gap-3 px-3.5 py-5 border-b border-abi-border">
          <div className="w-10 h-10 border border-abi-orange/60 bg-abi-orange/10 flex items-center justify-center flex-shrink-0">
            <Crosshair size={20} className="text-abi-orange" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-orbitron text-sm font-bold text-abi-text tracking-wide">
              ABI Companion
            </h1>
            <p className="font-mono text-[10px] text-abi-text-dim tracking-[0.16em] uppercase">
              Raid ops console
            </p>
          </div>
        </div>

        <NavLinks currentPage={currentPage} onNavigate={handleNavigate} />

        <div className="px-3 py-4 border-t border-abi-border">
          <p className="font-mono text-[9px] tracking-[0.14em] text-abi-text-dim uppercase">
            Local · Offline
          </p>
        </div>
      </aside>

      {/* Desktop overlay backdrop */}
      {isNavOpen && (
        <div
          className="nav-overlay-backdrop hidden lg:block"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Desktop trigger + overlay panel */}
      <div
        className={`nav-zone hidden lg:flex flex-col ${isNavOpen ? 'nav-zone--open' : ''}`}
        onMouseLeave={scheduleClose}
      >
        <div className="nav-trigger-wrap">
          <button
            type="button"
            className={`nav-trigger ${isNavOpen ? 'nav-trigger--active' : ''}`}
            onClick={toggleNav}
            onMouseEnter={openNav}
            aria-label="Open navigation"
            aria-expanded={isNavOpen}
            aria-controls="desktop-nav-panel"
          >
            <Crosshair size={24} className="text-abi-orange" strokeWidth={2} />
          </button>
        </div>

        <aside
          id="desktop-nav-panel"
          className={`nav-overlay-panel ${isNavOpen ? 'nav-overlay-panel--open' : ''}`}
          aria-hidden={!isNavOpen}
        >
          <div className="flex items-center gap-3 px-3.5 py-4 border-b border-abi-border">
            <div className="w-10 h-10 border border-abi-orange/60 bg-abi-orange/10 flex items-center justify-center flex-shrink-0">
              <Crosshair size={20} className="text-abi-orange" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-orbitron text-sm font-bold text-abi-text tracking-wide">
                ABI Companion
              </h1>
              <p className="font-mono text-[10px] text-abi-text-dim tracking-[0.16em] uppercase">
                Raid ops console
              </p>
            </div>
          </div>

          <NavLinks currentPage={currentPage} onNavigate={handleNavigate} />

          <div className="px-3 py-4 border-t border-abi-border">
            <p className="font-mono text-[9px] tracking-[0.14em] text-abi-text-dim uppercase">
              Local · Offline
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

export type { Page };
