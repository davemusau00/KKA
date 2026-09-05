import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  Building2,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReportsWorkspace: React.FC = () => {
  const {
    matters,
    workflowStages,
    users,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  // Find stalled matters
  const stalledMatters = matters
    .map((m) => {
      const daysInactive = Math.floor((Date.now() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
      const stage = workflowStages.find((s) => s.id === m.currentStageId);
      const stageOverdue = stage ? daysInactive > stage.targetDurationDays : false;
      return {
        ...m,
        daysInactive,
        stageName: stage?.name || '',
        stageTarget: stage?.targetDurationDays || 14,
        isStalled: daysInactive > 30 || stageOverdue,
      };
    })
    .filter((m) => m.isStalled);

  // Group by practice area
  const practiceAreaCounts: Record<string, number> = {};
  matters.forEach((m) => {
    practiceAreaCounts[m.practiceArea] = (practiceAreaCounts[m.practiceArea] || 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Executive Analytics &amp; Bottlenecks
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Reports &amp; Stalled Matters Diagnostic
          </h1>
        </div>
      </div>

      {/* Critical Stalled Cases Diagnostic (Section 4 & 5 Requirement) */}
      <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/60 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-900/60 text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-100 uppercase tracking-wider">
                Stalled Litigation Matters Requiring Partner Review
              </h2>
              <p className="text-rose-300/80 text-xs">
                Cases with zero recorded activity for &gt;30 days or exceeding workflow stage target duration.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-900 text-rose-200">
            {stalledMatters.length} Stalled Files
          </span>
        </div>

        <div className="space-y-2.5">
          {stalledMatters.map((m) => {
            const supervisor = users.find((u) => u.id === m.supervisingUserId);
            return (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-rose-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {m.internalReference}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase">
                      {m.daysInactive} days inactive
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Stage {m.currentStageId}: {m.stageName} (Target: {m.stageTarget}d)
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mt-1">{m.title}</div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    Supervisor: <strong className="text-slate-300">{supervisor?.fullName}</strong> &bull; Next Action: {m.nextAction}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedMatterId(m.id);
                    setActiveWorkspace('matters');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium transition flex items-center gap-1.5 text-xs shrink-0"
                >
                  <span>Open Matter File</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Practice Area Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>Practice Area Breakdown</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(practiceAreaCounts).map(([area, count]) => {
              const percentage = Math.round((count / matters.length) * 100);
              return (
                <div key={area} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{area}</span>
                    <span className="font-mono font-bold text-amber-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Caseload Comparison */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Multi-Branch Operational Load</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Nairobi Branch (HQ)</div>
                <div className="text-slate-400 text-[11px]">Milimani Law Courts / High Court Commercial</div>
              </div>
              <div className="text-right">
                <div className="text-base font-mono font-bold text-emerald-400">
                  {matters.filter((m) => m.originatingBranchId === 'branch-nairobi').length} Matters
                </div>
                <div className="text-[10px] text-slate-500 font-mono">14 Active Staff</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Mombasa Branch</div>
                <div className="text-slate-400 text-[11px]">Mombasa Law Courts / Admiralty &amp; Commercial</div>
              </div>
              <div className="text-right">
                <div className="text-base font-mono font-bold text-emerald-400">
                  {matters.filter((m) => m.originatingBranchId === 'branch-two').length} Matters
                </div>
                <div className="text-[10px] text-slate-500 font-mono">6 Active Staff</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
