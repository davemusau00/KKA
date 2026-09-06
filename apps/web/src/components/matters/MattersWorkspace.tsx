import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Columns,
  List,
  Plus,
  AlertTriangle,
  Clock,
  Building2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MatterDetailWorkspace } from './MatterDetailWorkspace';
import { Matter, PracticeArea } from '../../types';

export const MattersWorkspace: React.FC = () => {
  const {
    matters,
    selectedMatterId,
    setSelectedMatterId,
    currentBranchFilter,
    users,
    workflowStages,
    setIsQuickCreateOpen,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceFilter, setPracticeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [stalledOnly, setStalledOnly] = useState(false);

  // If a matter is selected, show the detail workspace
  const activeMatter = matters.find((m) => m.id === selectedMatterId);
  if (activeMatter) {
    return (
      <MatterDetailWorkspace
        matter={activeMatter}
        onBack={() => setSelectedMatterId(null)}
      />
    );
  }

  // Filter matters
  const filteredMatters = matters.filter((m) => {
    if (currentBranchFilter !== 'all' && m.originatingBranchId !== currentBranchFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (practiceFilter !== 'all' && m.practiceArea !== practiceFilter) return false;

    const daysInactive = (Date.now() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    if (stalledOnly && daysInactive <= 30) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = m.internalReference.toLowerCase().includes(q);
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSummary = m.summary.toLowerCase().includes(q);
      return matchRef || matchTitle || matchSummary;
    }
    return true;
  });

  const stalledCount = matters.filter((m) => {
    const days = (Date.now() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    return m.status === 'active' && days > 30;
  }).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Quick Create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Matter Portfolio
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {matters.length} Total Matters
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Litigation &amp; Client Matters
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'board' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Workflow Stage Kanban Board"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsQuickCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Matter</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ref (KKC/PI/2026/...), client name, court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Practice Area Filter */}
          <select
            value={practiceFilter}
            onChange={(e) => setPracticeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
          >
            <option value="all">All Practice Areas</option>
            <option value="Personal Injury">Personal Injury</option>
            <option value="Commercial Litigation">Commercial Litigation</option>
            <option value="Conveyancing">Conveyancing &amp; Land</option>
            <option value="Probate">Probate &amp; Administration</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Matters</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed / Archived</option>
          </select>

          {/* Stalled Only Toggle Button */}
          <button
            onClick={() => setStalledOnly(!stalledOnly)}
            className={`px-3 py-2 rounded-xl border font-medium flex items-center gap-1.5 transition ${
              stalledOnly
                ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Stalled &gt;30d ({stalledCount})</span>
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredMatters.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No matters match your filter criteria.
            </div>
          ) : (
            filteredMatters.map((m) => {
              const stage = workflowStages.find((s) => s.id === m.currentStageId);
              const supervisor = users.find((u) => u.id === m.supervisingUserId);
              const daysInactive = Math.floor(
                (Date.now() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              const isStalled = daysInactive > 30;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatterId(m.id)}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-amber-600/60 hover:bg-slate-800/50 cursor-pointer transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {m.internalReference}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-medium">
                        Stage {m.currentStageId}: {stage?.name || 'In Progress'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {m.originatingBranchId === 'branch-nairobi' ? 'Nairobi' : 'Mombasa'}
                      </span>
                      {isStalled && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase tracking-wider animate-pulse">
                          Stalled ({daysInactive}d inactive)
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-slate-100">{m.title}</h2>
                    <div className="text-xs text-slate-400 line-clamp-1">{m.summary}</div>

                    <div className="text-xs text-amber-300/90 flex items-center gap-1 pt-1 font-medium">
                      <span>Immediate Next Action:</span>
                      <span className="text-slate-300 font-normal">{m.nextAction}</span>
                    </div>
                  </div>

                  {/* Right Meta */}
                  <div className="flex items-center gap-4 text-xs shrink-0 self-end md:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-slate-400">Supervisor:</div>
                      <div className="font-semibold text-slate-200">{supervisor?.fullName || 'Advocate'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Opened: {new Date(m.openedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* KANBAN STAGE BOARD VIEW (Scattered across stages) */}
      {viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {workflowStages.map((stage) => {
            const stageMatters = filteredMatters.filter((m) => m.currentStageId === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col h-[70vh]"
              >
                <div className="p-2 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-amber-400">
                      Stage {stage.id}: {stage.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Target: {stage.targetDurationDays}d
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {stageMatters.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
                  {stageMatters.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-xs italic">
                      No matters in this stage
                    </div>
                  ) : (
                    stageMatters.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMatterId(m.id)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 cursor-pointer transition text-xs space-y-1.5"
                      >
                        <div className="font-mono text-[11px] font-bold text-amber-400">
                          {m.internalReference}
                        </div>
                        <div className="font-semibold text-slate-200 line-clamp-2">{m.title}</div>
                        <div className="text-slate-400 text-[10px] line-clamp-1">{m.nextAction}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
