import React, { useState } from 'react';
import { BackupRecord, OutboxSyncItem, UserProfile } from '../types';
import { GoogleDriveBackupService } from '../services/googleDriveService';
import {
  Database,
  CloudUpload,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  FolderLock,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface BackupSyncViewProps {
  backupRecords: BackupRecord[];
  outboxItems: OutboxSyncItem[];
  currentUser: UserProfile;
  isOnline: boolean;
  isSyncing: boolean;
  onTriggerSync: () => Promise<any>;
  onTriggerBackupNow: () => Promise<void>;
  onRestoreBackupFromFile: (fileContent: string) => Promise<{ success: boolean; message: string; recordCounts?: Record<string, number> }>;
  onExportCustomerCSV: () => void;
  onExportStockCSV: () => void;
  onExportCashBookCSV: () => void;
}

export const BackupSyncView: React.FC<BackupSyncViewProps> = ({
  backupRecords,
  outboxItems,
  currentUser,
  isOnline,
  isSyncing,
  onTriggerSync,
  onTriggerBackupNow,
  onRestoreBackupFromFile,
  onExportCustomerCSV,
  onExportStockCSV,
  onExportCashBookCSV,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'outbox'>('backup');
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  const pendingOutbox = outboxItems.filter((i) => i.status === 'queued' || i.status === 'failed');

  const handleManualBackup = async () => {
    setIsProcessingBackup(true);
    try {
      await onTriggerBackupNow();
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = await onRestoreBackupFromFile(content);
      if (res.success) {
        setRestoreMessage({ type: 'success', text: res.message });
      } else {
        setRestoreMessage({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Google Drive Backups & Offline Sync Engine
            </h2>
            <p className="text-xs text-slate-400">
              Folder: <strong className="text-cyan-300">BLUVIA Business Backups</strong> • Authoritative transactional database with independent backups
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualBackup}
              disabled={isProcessingBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isProcessingBackup ? 'animate-bounce' : ''}`} />
              <span>{isProcessingBackup ? 'Generating Backup...' : 'Back Up Now'}</span>
            </button>
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Outbox</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'backup' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Google Drive Backups ({backupRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'outbox' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Offline Outbox Queue ({pendingOutbox.length} Pending)
          </button>
        </div>
      </div>

      {restoreMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            restoreMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}
        >
          <span>{restoreMessage.text}</span>
          <button onClick={() => setRestoreMessage(null)} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Google Drive Backups & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-5">
          {/* Status & Quick CSV exports card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">Target Backup Folder</span>
              <p className="font-black text-cyan-300 text-sm flex items-center gap-1.5">
                <FolderLock className="w-4 h-4 text-cyan-400" />
                BLUVIA Business Backups
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Stored in root Google Drive with SHA-256 integrity checksums.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">Last Validated Backup</span>
              <p className="font-black text-emerald-400 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {backupRecords[0] ? new Date(backupRecords[0].timestamp).toLocaleString() : 'Pending first backup'}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Status: {backupRecords[0]?.status || 'Ready'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs block mb-1">Instant Audit CSV Exports</span>
                <p className="text-xs text-slate-300">Direct download for Excel & WhatsApp share</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={onExportCustomerCSV}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 transition"
                >
                  Customers
                </button>
                <button
                  onClick={onExportStockCSV}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 transition"
                >
                  Stock
                </button>
                <button
                  onClick={onExportCashBookCSV}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 transition"
                >
                  Cash Book
                </button>
              </div>
            </div>
          </div>

          {/* Safe Restoration Section (Owner Only) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  Restore Business Database from Validated Backup
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Protects data integrity: automatically validates payload, checks BLUVIA ownership, and saves a safety snapshot before applying.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold uppercase border border-cyan-800">
                Owner Protected
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">
                Select a previously generated <strong>.json</strong> backup file to restore:
              </span>
              <label className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow">
                <Download className="w-3.5 h-3.5" />
                <span>Upload & Restore Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Backup History Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Backup History & Verified Versions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Records Preview</th>
                    <th className="py-2.5 px-3">Checksum</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {backupRecords.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-cyan-300 font-bold">{b.fileName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(b.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-300">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {b.recordCounts.customers} Cust, {b.recordCounts.orders} Orders, {b.recordCounts.products} Prods
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{b.checksum.substring(0, 8)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{b.initiatedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Offline Outbox Queue */}
      {activeTab === 'outbox' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Durable Synchronization Outbox
              </h3>
              <p className="text-xs text-slate-400">
                Guarantees zero data loss during power cuts and poor 4G connectivity across Pakistan
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
              {pendingOutbox.length} Transactions Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                  <th className="py-2.5 px-3">Persistence Status</th>
                  <th className="py-2.5 px-3 text-center">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outboxItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Outbox queue is empty. All device transactions are synchronized!
                    </td>
                  </tr>
                ) : (
                  outboxItems.map((item) => {
                    const isSynced = item.status === 'synced';
                    const isSyncing = item.status === 'syncing';
                    const isFailed = item.status === 'failed';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200 capitalize">
                          {item.entityType.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-800 text-cyan-300">
                            {item.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                          {item.idempotencyKey}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isSynced
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : isSyncing
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                                : isFailed
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {isSynced
                              ? 'Saved to Cloud'
                              : isSyncing
                              ? 'Syncing...'
                              : isFailed
                              ? 'Sync Failed'
                              : 'Saved Locally'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {item.retryCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
