import React, { useState } from 'react';
import { BusinessSettings, UserProfile, AuditLogEntry, UserRole } from '../types';
import { BluviaLogo } from './BluviaLogo';
import {
  Settings,
  Users,
  ShieldCheck,
  Smartphone,
  Database,
  Copy,
  Check,
  UserPlus,
  PowerOff,
  History,
  FileCode,
  BookOpen,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface SettingsStaffViewProps {
  settings: BusinessSettings;
  users: UserProfile[];
  auditLogs: AuditLogEntry[];
  currentUser: UserProfile;
  onSaveSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  onCreateStaffUser: (staff: { name: string; email: string; role: UserRole; phone: string; pin: string }) => Promise<void>;
  onToggleUserActive: (userId: string) => Promise<void>;
}

export const SettingsStaffView: React.FC<SettingsStaffViewProps> = ({
  settings,
  users,
  auditLogs,
  currentUser,
  onSaveSettings,
  onCreateStaffUser,
  onToggleUserActive,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'business' | 'guide' | 'schema' | 'audit'>('business');
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Business settings form
  const [businessName, setBusinessName] = useState(settings.businessName || 'BLUVIA Premium Drinking Water Fresh');
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'Taqveem Ahsan Pasha');
  const [businessEmail, setBusinessEmail] = useState(settings.email || 'bluvia.pure@gmail.com');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '/bluvia-logo.png');
  const [phone, setPhone] = useState(settings.phone || '+92 300 8547219');
  const [address, setAddress] = useState(settings.address || 'Plot 48, Industrial Triangle, Kahuta Road, Islamabad');
  const [city, setCity] = useState(settings.city || 'Islamabad / Rawalpindi');
  const [price19L, setPrice19L] = useState(settings.defaultPrice19L || 180);
  const [depositAmount, setDepositAmount] = useState(settings.depositAmountPerBottle || 800);
  const [minAlert, setMinAlert] = useState(settings.minFullBottlesAlert || 50);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');

  // Add staff modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('delivery');
  const [staffPin, setStaffPin] = useState('1234');

  const isOwner = currentUser.role === 'owner';

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = () => {
    setLogoUrl('/bluvia-logo.png');
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setIsSaving(true);
    await onSaveSettings({
      businessName,
      ownerName,
      email: businessEmail,
      logoUrl,
      phone,
      address,
      city,
      defaultPrice19L: Number(price19L),
      depositAmountPerBottle: Number(depositAmount),
      minFullBottlesAlert: Number(minAlert),
      supabaseUrl,
      supabaseAnonKey,
    });
    setIsSaving(false);
    setSaveSuccessMsg('Business profile and logo saved successfully! Synchronized offline and across devices.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateStaffUser({
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      role: staffRole,
      pin: staffPin,
    });
    setShowAddStaffModal(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
  };

  const sqlSampleSnippet = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  stock_full INT NOT NULL DEFAULT 0,
  stock_empty INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(10, 2) NOT NULL
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- (See full schema in supabase-schema.sql)`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Banner and Sub-tab Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Settings, Staff Accounts & Setup Guide
            </h2>
            <p className="text-xs text-slate-400">
              Role-Based Access Control, pricing parameters, and step-by-step Android installation
            </p>
          </div>

          {currentUser.role === 'owner' && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Account</span>
            </button>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'staff' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Staff Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'business' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Business Profile
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'guide' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Owner Setup Guide & Android PWA
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'schema' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Supabase SQL Schema
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Subtab 1: Staff Accounts */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${
                  !user.active ? 'opacity-50 border-slate-800' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{user.name}</h3>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-4 text-xs text-slate-300 space-y-1">
                    <p className="text-slate-400">Phone: <strong className="text-slate-200">{user.phone}</strong></p>
                    <p className="text-slate-400">Login PIN: <strong className="text-slate-200">**** ({user.pin})</strong></p>
                    <p className="text-slate-400">
                      Permissions:{' '}
                      <strong className="text-cyan-300">
                        {user.role === 'owner'
                          ? 'Full Business Access & Backups'
                          : user.role === 'manager'
                          ? 'Stock, Customers, Orders & Deliveries'
                          : user.role === 'cashier'
                          ? 'Receipts, Payments & Cash Book'
                          : 'Assigned Deliveries & Bottle Returns'}
                      </strong>
                    </p>
                  </div>
                </div>

                {currentUser.role === 'owner' && user.id !== currentUser.id && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => onToggleUserActive(user.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        user.active
                          ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800'
                          : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                      }`}
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>{user.active ? 'Disable Account' : 'Enable Account'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Business Profile */}
      {activeTab === 'business' && (
        <div className="space-y-4 max-w-3xl">
          {/* Permission Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isOwner
              ? 'bg-cyan-950/60 border-cyan-800 text-cyan-200'
              : 'bg-amber-950/60 border-amber-800 text-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                {isOwner ? (
                  <>
                    Authorized Owner Access: <strong className="text-white">{ownerName}</strong> ({businessEmail}) can edit business identity & parameters.
                  </>
                ) : (
                  <>
                    View-Only Access: Only the authorized owner (<strong className="text-white">{settings.ownerName || 'Taqveem Ahsan Pasha'}</strong>) can edit business profile and brand logo.
                  </>
                )}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
              {currentUser.role}
            </span>
          </div>

          {/* Success Banner */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-2 text-xs shadow-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{saveSuccessMsg}</span>
            </div>
          )}

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                Business Profile & Brand Identity
              </h3>
              <p className="text-xs text-slate-400">
                Configure official company details, owner information, and brand logo. Automatically stored offline and synchronized across authorized devices.
              </p>
            </div>

            <form onSubmit={handleSaveSettingsSubmit} className="space-y-5">
              {/* Logo Management & Preview Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                    Official BLUVIA Logo & Preview
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Original Proportions (1:1)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Logo Preview Box */}
                  <div className="flex flex-col items-center">
                    <BluviaLogo
                      size="xl"
                      logoUrl={logoUrl}
                      variant="inverted-card"
                      alt={businessName}
                      className="w-28 h-28 sm:w-32 sm:h-32"
                    />
                    <span className="text-[10px] font-semibold text-emerald-400 mt-2 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                      Active Logo Preview
                    </span>
                  </div>

                  {/* Logo Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Upload Logo File (stored offline in IndexedDB)
                      </label>
                      <label className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed text-xs font-semibold cursor-pointer transition ${
                        isOwner
                          ? 'border-cyan-700 bg-slate-900 hover:bg-slate-800 text-cyan-300'
                          : 'border-slate-800 bg-slate-950 text-slate-500 cursor-not-allowed'
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Image File (PNG, JPEG, SVG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isOwner}
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Logo Asset URL or Path
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="/bluvia-logo.png"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-xs text-slate-200 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!isOwner}
                        onClick={handleResetToDefaultLogo}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        <span>Reset to Original BLUVIA Logo</span>
                      </button>
                      <span className="text-[10px] text-slate-500">Preserves original colours & lettering</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Business & Owner Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Business Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isOwner}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Owner's Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isOwner}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Taqveem Ahsan Pasha"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Business Email <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!isOwner}
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="bluvia.pure@gmail.com"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Helpline Phone Number <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isOwner}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Plant / Office Address</label>
                  <input
                    type="text"
                    required
                    disabled={!isOwner}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City / Region</label>
                  <input
                    type="text"
                    required
                    disabled={!isOwner}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Rate Card & Parameters */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Standard Pricing & Stock Buffers</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">19L Refill Price (Rs.)</label>
                    <input
                      type="number"
                      required
                      disabled={!isOwner}
                      value={price19L}
                      onChange={(e) => setPrice19L(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Bottle Deposit (Rs.)</label>
                    <input
                      type="number"
                      required
                      disabled={!isOwner}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Min Full Bottle Alert</label>
                    <input
                      type="number"
                      required
                      disabled={!isOwner}
                      value={minAlert}
                      onChange={(e) => setMinAlert(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 disabled:opacity-60 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Supabase Shared Cloud Sync */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Supabase Shared Cloud Sync (Optional)
                </h4>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Project URL</label>
                  <input
                    type="url"
                    disabled={!isOwner}
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Anon Public Key</label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Save Changes Button */}
              {isOwner ? (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving Profile...' : 'Save Changes'}
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  Login as Owner ({settings.ownerName || 'Taqveem Ahsan Pasha'}) to enable the Save Changes button.
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Subtab 3: Owner Setup Guide & Android PWA Instructions */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs text-slate-300">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Non-Technical Owner Setup & Android Guide
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-white text-sm">How to install on Android Phones</h4>
                <p className="text-slate-400">
                  Staff can use any Android phone (Samsung, Xiaomi, Oppo, Vivo, Infinix) without Google Play store:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Open Chrome on the Android phone.</li>
                  <li>Visit this web link.</li>
                  <li>Tap the <strong>"Install App"</strong> button in the header, OR tap the Chrome menu (3 dots) and select <strong>"Add to Home screen"</strong>.</li>
                  <li>The <strong>BLUVIA</strong> app icon appears on your home screen and operates even with <strong>airplane mode / no internet</strong>!</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-white text-sm">Offline First Operation & Durability</h4>
                <p className="text-slate-400">
                  Every order, payment, and bottle movement is saved directly into <strong>IndexedDB</strong> on the device first:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Survives phone restarts, app closures, and power cuts.</li>
                  <li>Transactions queue in the <strong>Durable Outbox</strong>.</li>
                  <li>When 4G data or Wi-Fi reconnects, transactions sync automatically with <strong>idempotency keys</strong> to prevent duplicate charging.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-white text-sm">Google Drive Independent Backups</h4>
                <p className="text-slate-400">
                  The app backs up to your Google account in a dedicated folder named <strong>BLUVIA Business Backups</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Daily automatic snapshots + "Back Up Now" action.</li>
                  <li>Versioned JSON bundles containing all tables with SHA-256 checksums.</li>
                  <li>Instant CSV exports for Customers, Stock, and Cash Book.</li>
                  <li>Safe restoration workflow that saves a safety snapshot before restoring.</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <h4 className="font-bold text-white text-sm">Inviting & Managing Staff Roles</h4>
                <p className="text-slate-400">
                  Each staff member uses an individual account with enforced permissions:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Owner:</strong> Full access, financial ledgers, settings, staff creation, backups.</li>
                  <li><strong>Manager:</strong> Stock purchases, customer accounts, orders, dispatches.</li>
                  <li><strong>Cashier:</strong> Cash receipts, payment allocations, expenses, cash book.</li>
                  <li><strong>Delivery Person:</strong> Assigned orders, doorstep delivery completion, empties retrieval.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: Supabase SQL Schema */}
      {activeTab === 'schema' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Complete Supabase SQL Migration Script
              </h3>
              <p className="text-xs text-slate-400">
                Generated at <strong className="text-cyan-300">/supabase-schema.sql</strong> with complete Row Level Security (RLS) policies
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(sqlSampleSnippet)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              <span>{copiedSql ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-96">
{`-- BLUVIA Premium Drinking Water Fresh Complete Schema
-- Tables: profiles, business_settings, products, customers, suppliers,
--         orders, payments, promised_payments, expenses, cash_ledger,
--         stock_movements, audit_logs, sync_outbox, backup_records.
-- RLS: Enabled on all tables with current_user_role() security definer.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2) NOT NULL,
  stock_full INT NOT NULL DEFAULT 0,
  stock_empty INT NOT NULL DEFAULT 0,
  stock_damaged INT NOT NULL DEFAULT 0,
  in_transit INT NOT NULL DEFAULT 0,
  is_reusable_bottle BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  area VARCHAR(100) NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  delivery_charges NUMERIC(10, 2) DEFAULT 0,
  net_total NUMERIC(12, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  payment_status VARCHAR(30) DEFAULT 'unpaid'
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- [Full 300-line script is saved in /supabase-schema.sql ready to execute]`}
          </pre>
        </div>
      )}

      {/* Subtab 5: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3">Immutable Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User & Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[...auditLogs].reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {log.userName} <span className="text-[10px] uppercase text-cyan-400">({log.role})</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{log.action}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono text-[10px]">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-sm truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Account */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-cyan-300">Create Staff Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforce role-based access for multiple staff phones
            </p>

            <form onSubmit={handleAddStaffSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Zahid Iqbal"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="zahid@bluvia.pk"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Access Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="delivery">Delivery Person</option>
                    <option value="owner">Owner (Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Quick Login PIN (4 digits)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono text-center tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition shadow-lg"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
