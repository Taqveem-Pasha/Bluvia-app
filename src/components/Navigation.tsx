import React from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Receipt,
  Database,
  Settings,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'stock' | 'customers' | 'deliveries' | 'finance' | 'backup' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingSyncCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingSyncCount,
}) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock' as ActiveTab, label: 'Stock & Bottles', icon: Package },
    { id: 'customers' as ActiveTab, label: 'Customers', icon: Users },
    { id: 'deliveries' as ActiveTab, label: 'Deliveries', icon: Truck },
    { id: 'finance' as ActiveTab, label: 'Finance', icon: Receipt },
    { id: 'backup' as ActiveTab, label: 'Backup & Sync', icon: Database, badge: pendingSyncCount > 0 ? pendingSyncCount : null },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top Navigation Tabs */}
      <nav aria-label="Main Navigation" className="hidden md:block bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-900/80 to-blue-900/80 text-cyan-300 border border-cyan-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Sticky Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-cyan-950/80 pb-safe">
        <div className="grid grid-cols-5 h-16">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition cursor-pointer ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] bg-amber-500 text-slate-950 font-extrabold">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[64px]">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
