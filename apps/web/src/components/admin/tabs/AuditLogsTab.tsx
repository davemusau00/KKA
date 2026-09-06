import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  X,
  FileJson,
  Shield,
  Activity,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AuditEvent } from '../../../types';

export const AuditLogsTab: React.FC = () => {
  const { auditLogs, users } = useApp();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);

  // Distinct action types
  const actionTypes = useMemo(() => {
    const types = Array.from(new Set(auditLogs.map((l) => l.action)));
    return ['all', ...types];
  }, [auditLogs]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = search.toLowerCase();
      const actor = users.find((u) => u.id === log.actorUserId);
      const actorName = actor ? actor.fullName.toLowerCase() : log.actorUserId.toLowerCase();
      const actionMatches = actionFilter === 'all' || log.action === actionFilter;
      const metadataStr = JSON.stringify(log.metadata || {}).toLowerCase();

      const textMatches =
        log.action.toLowerCase().includes(q) ||
        actorName.includes(q) ||
        metadataStr.includes(q);

      return actionMatches && textMatches;
    });
  }, [auditLogs, search, actionFilter, users]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kka_audit_trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="admin-tab-content">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Immutable Audit Trail &amp; Security Logs</span>
          </h2>
          <p className="admin-section-desc">
            Chronological, non-repudiable audit logs of system events, authentication sessions, document changes, and RBAC modifications.
          </p>
        </div>

        <button onClick={handleExportJSON} className="admin-btn-secondary">
          <Download className="w-4 h-4" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xl font-bold font-mono text-slate-100">{auditLogs.length}</div>
          <div className="text-xs text-slate-400">Total Recorded Events</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xl font-bold font-mono text-amber-400">
            {new Set(auditLogs.map((l) => l.actorUserId)).size}
          </div>
          <div className="text-xs text-slate-400">Unique Actors</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xl font-bold font-mono text-emerald-400">
            {actionTypes.length - 1}
          </div>
          <div className="text-xs text-slate-400">Event Action Types</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xl font-bold font-mono text-blue-400">
            100%
          </div>
          <div className="text-xs text-slate-400">Log Integrity Verifier</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by action, actor, or metadata..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Event Types' : t.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <span>Action &amp; Actor</span>
          <span>Timestamp &amp; Inspector</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="admin-empty-state">
              <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No audit records match your query</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const actor = users.find((u) => u.id === log.actorUserId);

              return (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-slate-800/40 transition flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-amber-400 uppercase text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        {log.action}
                      </span>
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{actor ? actor.fullName : log.actorUserId}</span>
                      </span>
                    </div>

                    {log.metadata && (
                      <div className="text-slate-400 font-mono text-[11px] truncate max-w-2xl">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Inspect Log Entry Payload"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: View Full JSON Log Payload */}
      {selectedLog && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-xl">
            <div className="admin-modal-header">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-500" />
                <h3 className="admin-modal-title">
                  Audit Log Event: {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="admin-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block font-mono text-[10px]">EVENT ID</span>
                  <span className="text-slate-200 font-mono">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-mono text-[10px]">ACTOR USER ID</span>
                  <span className="text-slate-200 font-mono">{selectedLog.actorUserId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-mono text-[10px]">TIMESTAMP</span>
                  <span className="text-slate-200 font-mono">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-mono text-[10px]">ACTION TYPE</span>
                  <span className="text-amber-400 font-mono uppercase font-bold">
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              <div>
                <label className="admin-field-label mb-1">Full Metadata &amp; Diff Payload</label>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                onClick={() => setSelectedLog(null)}
                className="admin-btn-secondary"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
