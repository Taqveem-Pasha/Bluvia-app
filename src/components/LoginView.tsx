import React, { useState } from 'react';
import { UserProfile, BusinessSettings } from '../types';
import { BluviaLogo } from './BluviaLogo';
import { ShieldCheck, Truck, DollarSign, Briefcase, KeyRound, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface LoginViewProps {
  settings: BusinessSettings;
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ settings, users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(users[0] || null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return ShieldCheck;
      case 'manager':
        return Briefcase;
      case 'cashier':
        return DollarSign;
      case 'delivery':
        return Truck;
      default:
        return Briefcase;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner (Full Access)', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/60' };
      case 'manager':
        return { label: 'Manager', color: 'border-teal-500/40 text-teal-300 bg-teal-950/60' };
      case 'cashier':
        return { label: 'Cashier', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60' };
      case 'delivery':
        return { label: 'Delivery Staff', color: 'border-amber-500/40 text-amber-300 bg-amber-950/60' };
      default:
        return { label: role, color: 'border-slate-700 text-slate-300 bg-slate-800' };
    }
  };

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setError('Please select an account');
      return;
    }

    // Verify PIN if set, or allow quick enter if blank
    if (selectedUser.pin && pin && selectedUser.pin !== pin) {
      setError(`Invalid PIN code for ${selectedUser.name}`);
      return;
    }

    setError('');
    onLogin(selectedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Authentic BLUVIA Logo */}
        <div className="mb-4">
          <BluviaLogo
            size="2xl"
            logoUrl={settings.logoUrl}
            variant="inverted-card"
            alt={settings.businessName}
            className="shadow-2xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Business Title & Owner Details */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {settings.businessName}
        </h1>
        <p className="text-xs text-cyan-400 font-semibold mt-1">
          Owner: {settings.ownerName || 'Taqveem Ahsan Pasha'}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
          {settings.email || 'bluvia.pure@gmail.com'}
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed italic">
          "{settings.tagline}"
        </p>

        {/* Account Selector */}
        <div className="w-full mt-6 text-left">
          <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
            Select Active Profile
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const RoleIcon = getRoleIcon(u.role);
              const badge = getRoleBadge(u.role);

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setError('');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{u.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 inline" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}>
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Entry (optional / fast sign in) */}
        <form onSubmit={handleSignIn} className="w-full mt-4 space-y-3">
          {selectedUser?.pin && (
            <div className="text-left">
              <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>Security PIN (optional, default: {selectedUser.pin})</span>
              </label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={`Enter PIN or leave blank for quick access`}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white tracking-widest font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In as {selectedUser?.name ? selectedUser.name.split(' ')[0] : 'Staff'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 w-full text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            🔒 Offline-First Enterprise Applet
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            IndexedDB Local Storage • Syncs automatically when online
          </p>
        </div>
      </div>
    </div>
  );
};
