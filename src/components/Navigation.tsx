import React, { useState } from 'react';
import {
  LayoutDashboard,
  Swords,
  Clock,
  Star,
  Database,
  TrendingUp,
  User,
  Settings,
  Menu,
  X,
} from 'lucide-react';

type Page = 'overview' | 'dashboard' | 'raids' | 'sessions' | 'highlights' | 'lootdb' | 'economy' | 'gear' | 'performance' | 'commander' | 'settings';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'raids', label: 'Raids', icon: <Swords size={20} /> },
  { id: 'sessions', label: 'Sessions', icon: <Clock size={20} /> },
  { id: 'highlights', label: 'Highlights', icon: <Star size={20} /> },
  { id: 'lootdb', label: 'LootDB', icon: <Database size={20} /> },
  { id: 'economy', label: 'Economy', icon: <TrendingUp size={20} /> },
  { id: 'gear', label: 'Gear', icon: <User size={20} /> },
  { id: 'performance', label: 'Performance', icon: <TrendingUp size={20} /> },
  { id: 'commander', label: 'Commander', icon: <User size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-abi-bg border-b border-abi-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-abi-orange/20 flex items-center justify-center">
              <Swords size={18} className="text-abi-orange" />
            </div>
            <span className="font-bold text-abi-text">ABI Companion</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-abi-text-muted hover:text-abi-text"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          sidebar
          flex flex-col
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          group
        `}
      >
        {/* Logo */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-5 border-b border-abi-border overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-abi-orange to-abi-orange-dark flex items-center justify-center shadow-glow flex-shrink-0">
            <Swords size={22} className="text-white" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="font-bold text-abi-text text-lg">ABI Companion</h1>
            <p className="text-xs text-abi-text-dim">Tactical Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-hidden group-hover:overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'text-abi-orange bg-abi-orange/10'
                    : 'text-abi-text-muted hover:text-abi-text hover:bg-abi-bg-hover'
                  }
                `.replace(/\s+/g, ' ').trim()}
              >
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-abi-orange rounded-r-full" />
                )}
                <span className={`flex-shrink-0 ${isActive ? 'text-abi-orange' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

      </aside>

    </>
  );
}

export type { Page };
