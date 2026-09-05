import React, { useState } from 'react';
import {
  Shield,
  Users,
  Building2,
  Lock,
  RotateCcw,
  CheckCircle,
  Clock,
  Key,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminWorkspace: React.FC = () => {
  const {
    users,
    branches,
    currentUser,
    setCurrentUser,
    auditLogs,
    resetDataToDefault,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'branches' | 'audit'>('staff');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Firm Administration &amp; Governance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              RBAC Matrix Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Staff Management, Branches &amp; Audit Trail
          </h1>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all demo state to original Kariuki Kagunda Lawfirm OS seed data?')) {
              resetDataToDefault();
            }
          }}
          className="px-3.5 py-2 rounded-xl border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo Seed Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex w-fit">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'staff' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Staff &amp; Personas ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'branches' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Firm Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'audit' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const isSelf = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl border transition shadow-sm space-y-3 ${
                  isSelf
                    ? 'bg-amber-950/30 border-amber-600/70'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl}
                    alt={u.fullName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif font-bold text-sm text-slate-100 truncate">
                      {u.fullName}
                    </div>
                    <div className="text-slate-400 text-xs truncate">{u.jobTitle}</div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 inline-block mt-1">
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400 text-xs">
                  <div>✉️ {u.email}</div>
                  <div>📞 {u.phone}</div>
                  <div>
                    Branch: {u.homeBranchId === 'branch-nairobi' ? 'Nairobi HQ' : 'Mombasa'}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentUser(u)}
                  disabled={isSelf}
                  className={`w-full py-1.5 rounded-lg font-medium transition ${
                    isSelf
                      ? 'bg-amber-600/30 text-amber-300 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isSelf ? 'Current Active Persona' : 'Switch to this Persona'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b) => (
            <div key={b.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-serif font-bold text-base text-slate-100">{b.name}</div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-amber-400 uppercase">
                  {b.code}
                </span>
              </div>
              <div className="text-slate-400 text-xs space-y-1">
                <div>📍 {b.address}</div>
                <div>📞 {b.phone}</div>
                <div>✉️ {b.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
            Immutable Audit Trail &amp; Access Log
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => {
              const actor = users.find((u) => u.id === log.actorUserId);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 uppercase text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-slate-400 font-medium">
                        by {actor?.fullName || log.actorUserId}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono text-[10px] mt-0.5 truncate max-w-xl">
                      {JSON.stringify(log.metadata)}
                    </div>
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
