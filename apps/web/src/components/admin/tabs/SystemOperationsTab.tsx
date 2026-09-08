import React, { useState } from 'react';
import {
  Server, Database, Download, Plus, Trash2, RotateCcw, Activity,
  HardDrive, Cpu, Wifi, Clock, Package, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { BackupSnapshot } from '../../../types';

const formatBytes = (bytes: number) => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
};

const SNAPSHOT_TYPE_LABELS: Record<BackupSnapshot['type'], string> = {
  manual: 'Manual Checkpoint',
  scheduled_daily: 'Scheduled Daily Backup',
  pre_upgrade: 'Pre-Upgrade Snapshot',
};

const SNAPSHOT_TYPE_COLORS: Record<BackupSnapshot['type'], string> = {
  manual: 'bg-blue-900/30 text-blue-400',
  scheduled_daily: 'bg-emerald-900/30 text-emerald-400',
  pre_upgrade: 'bg-amber-900/30 text-amber-400',
};

export const SystemOperationsTab: React.FC = () => {
  const {
    backupSnapshots,
    systemHealth,
    createDatabaseBackupSnapshot,
    deleteBackupSnapshot,
    restoreBackupSnapshot,
    exportSystemDiagnosticBundle,
    matters,
    clients,
    documents,
    auditLogs,
  } = useApp();

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [lastExportFile, setLastExportFile] = useState<string | null>(null);
  const [snapshotType, setSnapshotType] = useState<BackupSnapshot['type']>('manual');

  const handleCreateSnapshot = () => {
    createDatabaseBackupSnapshot(snapshotType);
    setRestoreResult('Backup creation is unavailable in local mode; no snapshot was created.');
  };

  const handleRestore = (id: string) => {
    setRestoringId(id);
    setTimeout(() => {
      const ok = restoreBackupSnapshot(id);
      setRestoreResult(ok ? `✓ Snapshot restored in sandbox. Please review test environment before applying to production.` : '✗ Snapshot not found.');
      setRestoringId(null);
    }, 1800);
  };

  const handleExport = () => {
    const bundle = exportSystemDiagnosticBundle();
    const blob = new Blob([bundle.payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bundle.filename;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportFile(bundle.filename);
  };

  const healthItems = systemHealth ? [
    { label: 'VPS Uptime', value: formatUptime(systemHealth.vpsUptimeSeconds), icon: <Clock size={14} />, color: 'text-emerald-400' },
    { label: 'Node.js', value: systemHealth.nodeVersion, icon: <Package size={14} />, color: 'text-blue-400' },
    { label: 'Database', value: systemHealth.dbStatus, icon: <Database size={14} />, color: systemHealth.dbStatus === 'healthy' ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'DB Connections', value: String(systemHealth.dbConnections), icon: <Wifi size={14} />, color: 'text-cyan-400' },
    { label: 'Redis', value: systemHealth.redisStatus, icon: <Server size={14} />, color: systemHealth.redisStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Active Workers', value: String(systemHealth.activeWorkersCount), icon: <Cpu size={14} />, color: 'text-purple-400' },
    { label: 'Disk Usage', value: `${systemHealth.diskUsagePercent}%`, icon: <HardDrive size={14} />, color: systemHealth.diskUsagePercent > 80 ? 'text-rose-400' : 'text-amber-400' },
    { label: 'Memory', value: `${systemHealth.memoryUsageMb.toFixed(0)} MB`, icon: <Activity size={14} />, color: 'text-pink-400' },
  ] : [];

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">System Operations &amp; Backup Sandbox</h2>
          <p className="admin-section-desc">VPS health monitoring, database snapshot management, and diagnostic bundle export</p>
        </div>
        <button className="admin-btn-secondary" onClick={handleExport}>
          <Download size={14} /> Export Diagnostic Bundle
        </button>
      </div>

      {lastExportFile && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/40 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={13} />
          Diagnostic report <code className="font-mono">{lastExportFile}</code> downloaded
        </div>
      )}

      <div className="admin-grid-2 mb-6">
        {/* System Health */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Activity size={15} /> VPS Health Metrics</h3>
          <p className="text-xs text-gray-500 mb-4">Last backup: {systemHealth?.lastBackupAt ? new Date(systemHealth.lastBackupAt).toLocaleString() : '—'}</p>
          <div className="grid grid-cols-2 gap-2">
            {healthItems.map(({ label, value, icon, color }) => (
              <div key={label} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5 mb-1 text-gray-500">
                  {icon}
                  <span className="text-xs">{label}</span>
                </div>
                <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Database Summary */}
        <div className="admin-card">
          <h3 className="admin-card-title"><Database size={15} /> Database Record Summary</h3>
          <div className="space-y-3 mt-2">
            {[
              { label: 'Active Matters', count: matters.length, color: 'text-amber-400' },
              { label: 'Registered Clients', count: clients.length, color: 'text-emerald-400' },
              { label: 'Legal Documents', count: documents.length, color: 'text-blue-400' },
              { label: 'Audit Trail Entries', count: auditLogs.length, color: 'text-purple-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                <span className="text-sm text-gray-400">{label}</span>
                <span className={`text-lg font-bold font-mono ${color}`}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backup Snapshots */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="admin-card-title"><Package size={15} /> Database Backup Snapshots</h3>
          <div className="flex items-center gap-2">
            <select className="admin-input text-sm w-48" value={snapshotType} onChange={(e) => setSnapshotType(e.target.value as BackupSnapshot['type'])}>
              <option value="manual">Manual Checkpoint</option>
              <option value="scheduled_daily">Scheduled Daily</option>
              <option value="pre_upgrade">Pre-Upgrade</option>
            </select>
            <button className="admin-btn-primary" onClick={handleCreateSnapshot}>
              <Plus size={14} /> Create Snapshot
            </button>
          </div>
        </div>

        {restoreResult && (
          <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-700/40 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            {restoreResult}
          </div>
        )}

        <div className="space-y-3">
          {backupSnapshots.map((snap) => (
            <div key={snap.id} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${SNAPSHOT_TYPE_COLORS[snap.type]}`}>
                  <Database size={16} />
                </div>
                <div>
                  <p className="font-mono text-sm text-white font-semibold">{snap.filename}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SNAPSHOT_TYPE_COLORS[snap.type]}`}>
                      {SNAPSHOT_TYPE_LABELS[snap.type]}
                    </span>
                    <span className="text-xs text-gray-500">{formatBytes(snap.sizeBytes)}</span>
                    <span className="text-xs text-gray-500">{new Date(snap.createdAt).toLocaleString()}</span>
                    <span className={`text-xs flex items-center gap-1 ${snap.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <CheckCircle2 size={10} /> {snap.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono mt-1">{snap.storageLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="admin-btn-secondary text-xs py-1.5 px-3"
                  onClick={() => handleRestore(snap.id)}
                  disabled={restoringId === snap.id}
                >
                  {restoringId === snap.id ? (
                    <span className="flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> Restoring…</span>
                  ) : (
                    <span className="flex items-center gap-1"><RotateCcw size={12} /> Restore Sandbox</span>
                  )}
                </button>
                <button
                  className="p-1.5 hover:bg-rose-900/30 rounded text-gray-400 hover:text-rose-400"
                  onClick={() => deleteBackupSnapshot(snap.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
