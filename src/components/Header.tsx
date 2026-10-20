import React, { useState } from 'react';
import { UserProfile, UserRole, BusinessSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { BluviaLogo } from './BluviaLogo';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  ShieldCheck,
  Truck,
  DollarSign,
  UserCheck,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  settings?: BusinessSettings | null;
  onSwitchUser: (user: UserProfile) => void;
  onLockSession?: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  onTriggerSync: () => void;
  onOpenQuickAction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  settings,
  onSwitchUser,
  onLockSession,
  isOnline,
  isSyncing,
  pendingSyncCount,
  onTriggerSync,
  onOpenQuickAction,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: ShieldCheck };
      case 'manager':
        return { label: 'Manager', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: UserCheck };
      case 'cashier':
        return { label: 'Cashier', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: DollarSign };
      case 'delivery':
        return { label: 'Delivery', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Truck };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const RoleIcon = badge.icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-cyan-950/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <BluviaLogo
            size="sm"
            logoUrl={settings?.logoUrl}
            variant="badge"
            alt={settings?.businessName || 'BLUVIA Premium Drinking Water Fresh'}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base md:text-lg bg-gradient-to-r from-cyan-400 via-sky-300 to-white bg-clip-text text-transparent">
                BLUVIA
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Fresh
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
              {settings?.businessName || 'BLUVIA Premium Drinking Water Fresh'} • {settings?.ownerName ? `Owner: ${settings.ownerName}` : 'Business Manager'}
            </p>
          </div>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline Status Pill */}
          <div
            onClick={onTriggerSync}
            title={isOnline ? (pendingSyncCount > 0 ? `${pendingSyncCount} pending to sync` : 'All synced to cloud') : 'Working Offline'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition ${
              isOnline
                ? pendingSyncCount > 0
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? (pendingSyncCount > 0 ? `${pendingSyncCount} Pending` : 'Online') : 'Offline'}
            </span>
            {pendingSyncCount > 0 && isOnline && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            <button
              aria-label="Force Sync Now"
              className={`p-0.5 hover:text-white transition ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenQuickAction}
            aria-label="Add Transaction"
            className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-cyan-950 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Add</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Account / Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              aria-label="Current User Profile"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${badge.color} hover:brightness-110 transition cursor-pointer`}
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="font-semibold truncate max-w-[80px] sm:max-w-[110px]">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] opacity-80 uppercase">({badge.label})</span>
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-40 text-slate-100">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Switch Device / Staff Account
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {users.map((u) => {
                      const uBadge = getRoleBadge(u.role);
                      const UIcon = uBadge.icon;
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                            isSelected ? 'bg-cyan-950/60 font-semibold text-cyan-300' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: u.avatarColor }}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="truncate leading-tight">{u.name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${uBadge.color}`}>
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-3 pt-2 pb-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Role access enforced</span>
                    {onLockSession && (
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLockSession();
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                      >
                        Lock Screen
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
