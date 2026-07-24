import React, { useState } from 'react';
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

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
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
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-abi-text-muted hover:text-abi-text border border-transparent hover:border-abi-border rounded-md"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          sidebar
          flex flex-col
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0 fixed inset-y-0 left-0 z-40 !w-[240px]' : '-translate-x-full lg:translate-x-0'}
          group
        `}
      >
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-5 border-b border-abi-border overflow-hidden">
          <div className="w-10 h-10 border border-abi-orange/60 bg-abi-orange/10 flex items-center justify-center flex-shrink-0">
            <Crosshair size={20} className="text-abi-orange" strokeWidth={2} />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-250 whitespace-nowrap">
            <h1 className="font-orbitron text-sm font-bold text-abi-text tracking-wide">
              ABI Companion
            </h1>
            <p className="font-mono text-[10px] text-abi-text-dim tracking-[0.16em] uppercase">
              Raid ops console
            </p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-hidden group-hover:overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-abi-text-dim opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMobileOpen(false);
                      }}
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
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity duration-250 whitespace-nowrap">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden lg:block px-3 py-4 border-t border-abi-border opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-mono text-[9px] tracking-[0.14em] text-abi-text-dim uppercase">
            Local · Offline
          </p>
        </div>
      </aside>
    </>
  );
}

export type { Page };
