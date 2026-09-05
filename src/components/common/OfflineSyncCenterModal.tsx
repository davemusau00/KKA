import React from 'react';
import { X, Wifi, WifiOff, RefreshCw, CheckCircle, Clock, AlertTriangle, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineSyncCenterModal: React.FC = () => {
  const {
    isSyncCenterOpen,
    setIsSyncCenterOpen,
    isOnline,
    setIsOnline,
    mutationQueue,
    isSyncing,
    triggerSync,
  } = useApp();

  if (!isSyncCenterOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Offline PWA & Sync Center
              </h2>
              <p className="text-xs text-slate-400">Manage client cache and queued operations</p>
            </div>
          </div>
          <button
            onClick={() => setIsSyncCenterOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-5 text-xs">
          {/* Status card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-200">
                  Network Connectivity: {isOnline ? 'Online (Connected)' : 'Offline (Local Cache Active)'}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>
              <p className="text-slate-400 mt-1">
                {isOnline
                  ? 'All database writes immediately persist to VPS PostgreSQL backend.'
                  : 'You can continue working. Mutations are safely stored in IndexedDB and will sync upon reconnection.'}
              </p>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                isOnline
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-emerald-950 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
              }`}
            >
              {isOnline ? 'Simulate Offline' : 'Restore Online'}
            </button>
          </div>

          {/* Offline Sync Controls */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Queued Mutations ({mutationQueue.length})
              </div>
              <p className="text-slate-500 text-[11px]">Operations waiting to be synchronized to law firm database</p>
            </div>
            <button
              onClick={triggerSync}
              disabled={isSyncing || mutationQueue.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium transition flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* Queue List */}
          {mutationQueue.length === 0 ? (
            <div className="py-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">All local changes are in sync</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Zero pending offline actions. Safe to close browser or navigate freely.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {mutationQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-semibold uppercase text-[11px]">
                        {item.operation} {item.entityType}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 mt-1 font-mono text-[11px] truncate max-w-sm">
                      {JSON.stringify(item.payload)}
                    </div>
                  </div>
                  <div>
                    {item.status === 'synced' ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Synced
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400 text-xs">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Local Storage / PWA Info */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span>PWA Storage & Dexie Cache Policy</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              In accordance with section 9 of the specifications, recently viewed matters, staff tasks, upcoming court diary, and unfiled draft notes remain accessible during intermittent connectivity. Stale updates will prompt a conflict resolution dialog rather than silently overwriting legal deadlines or court appearances.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={() => setIsSyncCenterOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
