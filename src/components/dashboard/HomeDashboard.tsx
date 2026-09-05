import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Plus,
  Building2,
  FileText,
  UserCheck,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CourtDeadlinesAlertDashboard } from './CourtDeadlinesAlertDashboard';

export const HomeDashboard: React.FC = () => {
  const {
    currentUser,
    currentBranchFilter,
    matters,
    tasks,
    calendarEvents,
    expenses,
    proceedings,
    setSelectedMatterId,
    setActiveWorkspace,
    completeTask,
    setIsQuickCreateOpen,
    approveExpense,
  } = useApp();

  const [viewScope, setViewScope] = useState<'personal' | 'branch' | 'firm'>('personal');

  // Filter matters by branch and scope
  const filteredMatters = matters.filter((m) => {
    if (currentBranchFilter !== 'all' && m.originatingBranchId !== currentBranchFilter) return false;
    if (viewScope === 'personal') return m.assignedUserIds.includes(currentUser.id);
    return true;
  });

  // Today & Upcoming Court Events (sorted ascending)
  const upcomingHearings = calendarEvents
    .filter((e) => e.eventType === 'court')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      new Date(t.dueAt) < new Date() &&
      (viewScope === 'firm' || t.assignedTo === currentUser.id)
  );

  // My Tasks due soon
  const myUpcomingTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (viewScope === 'firm' || t.assignedTo === currentUser.id)
  );

  // Stalled matters (> 30 days without activity or stage duration exceeded)
  const stalledMatters = matters.filter((m) => {
    const daysInactive = (Date.now() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    return m.status === 'active' && daysInactive > 30;
  });

  // Pending Expense Requisitions
  const pendingExpenses = expenses.filter((e) => e.status === 'submitted');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Welcome & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Daily Operational Cockpit
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Africa/Nairobi (EAT)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Welcome back, {currentUser.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Role: <span className="font-semibold text-slate-200">{currentUser.jobTitle}</span> &bull;{' '}
            Branch: <span className="text-amber-400">{currentUser.homeBranchId === 'branch-nairobi' ? 'Nairobi HQ' : 'Mombasa'}</span>
          </p>
        </div>

        {/* View Scope Tabs: Personal vs Branch vs Firm */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setViewScope('personal')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewScope === 'personal'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Work
            </button>
            <button
              onClick={() => setViewScope('branch')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewScope === 'branch'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Branch
            </button>
            <button
              onClick={() => setViewScope('firm')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewScope === 'firm'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Firm-Wide
            </button>
          </div>

          <button
            onClick={() => setIsQuickCreateOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl font-medium transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Record</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Banners */}
      {stalledMatters.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-900/60 text-rose-300 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-rose-200 text-sm flex items-center gap-2">
                <span>Stalled Matters Detected ({stalledMatters.length})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900 text-rose-200 uppercase font-bold">
                  Attention Required
                </span>
              </div>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {stalledMatters[0].internalReference}: {stalledMatters[0].title} has exceeded stage target with no activity for 38 days.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedMatterId(stalledMatters[0].id);
              setActiveWorkspace('matters');
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition"
          >
            Review Stalled Matter
          </button>
        </div>
      )}

      {/* 48-Hour Court Deadlines & Filing Alert Center */}
      <CourtDeadlinesAlertDashboard />

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>Active Matters</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-100 mt-2">
            {filteredMatters.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>19 PI workflow stages active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>Upcoming Hearings</span>
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-blue-400 mt-2">
            {upcomingHearings.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Trial tomorrow 09:00 AM
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>Overdue Tasks</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-400 mt-2">
            {overdueTasks.length}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            Statutory deadlines at risk
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>Pending Approvals</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-2">
            {pendingExpenses.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Requisitions awaiting partner
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Court vs Overdue & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Court Hearings Diary & Waiting on Me */}
        <div className="lg:col-span-2 space-y-6">
          {/* Court Appearances Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Upcoming Court Diary &amp; Trials
                </h2>
              </div>
              <button
                onClick={() => setActiveWorkspace('calendar')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                Full Calendar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingHearings.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">No court dates scheduled.</div>
              ) : (
                upcomingHearings.map((evt) => {
                  const matter = matters.find((m) => m.id === evt.matterId);
                  const isTomorrow = new Date(evt.startAt).toDateString() === new Date(Date.now() + 86400000).toDateString();
                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {matter?.internalReference || 'General Court'}
                          </span>
                          {isTomorrow && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase tracking-wider animate-pulse">
                              Tomorrow 09:00 AM
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                            {evt.courtStatus}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">{evt.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                          <span>📍 {evt.location}</span>
                          <span>🕒 {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (evt.matterId) setSelectedMatterId(evt.matterId);
                          setActiveWorkspace('calendar');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 transition flex items-center gap-1"
                      >
                        <span>View Brief</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pending Approvals & Requisitions (Scenario E) */}
          {pendingExpenses.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Expense Requisitions Awaiting Approval
                  </h2>
                </div>
                <button
                  onClick={() => setActiveWorkspace('finance')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  Finance Ledger →
                </button>
              </div>

              <div className="space-y-2.5">
                {pendingExpenses.map((exp) => {
                  const matter = matters.find((m) => m.id === exp.matterId);
                  return (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl border border-amber-800/40 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            KES {exp.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-mono">
                            {exp.categoryId.replace('_', ' ')}
                          </span>
                          {matter && (
                            <span className="font-mono text-slate-400">({matter.internalReference})</span>
                          )}
                        </div>
                        <div className="text-slate-200 font-medium mt-1">{exp.description}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          Source: {exp.paymentSource} &bull; Requested by staff
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {currentUser.role === 'senior_partner' || currentUser.role === 'advocate' ? (
                          <button
                            onClick={() => approveExpense(exp.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-xs text-amber-400 font-medium italic">
                            Waiting on Senior Partner
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Matters Quick Access */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Active Firm Matters
                </h2>
              </div>
              <button
                onClick={() => setActiveWorkspace('matters')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                View All Matters →
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredMatters.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMatterId(m.id);
                    setActiveWorkspace('matters');
                  }}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/50 cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{m.internalReference}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        Stage {m.currentStageId}: {m.practiceArea}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">{m.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{m.nextAction}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Tasks & Deadlines */}
        <div className="space-y-6">
          {/* Overdue / High Priority Tasks */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Action Tasks &amp; Deadlines
                </h2>
              </div>
              <button
                onClick={() => setActiveWorkspace('tasks')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                Task Board →
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {myUpcomingTasks.length === 0 ? (
                <div className="py-6 text-center text-slate-500">All tasks completed.</div>
              ) : (
                myUpcomingTasks.slice(0, 6).map((t) => {
                  const isOverdue = new Date(t.dueAt) < new Date();
                  const matter = matters.find((m) => m.id === t.matterId);
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition ${
                        isOverdue
                          ? 'border-rose-900/70 bg-rose-950/20'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-200">{t.title}</div>
                          {matter && (
                            <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                              {matter.internalReference}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                              Due: {new Date(t.dueAt).toLocaleDateString()}
                            </span>
                            {t.officialDeadlineAt && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                (Statutory: {new Date(t.officialDeadlineAt).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => completeTask(t.id)}
                          title="Mark complete"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 transition"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Branch Directory Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md text-xs space-y-3">
            <div className="font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Branch Contacts</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="font-semibold text-slate-200">Nairobi Branch (HQ)</div>
                <div className="text-slate-400 text-[11px]">View Park Towers, 5th Floor</div>
                <div className="text-amber-400 font-mono text-[11px] mt-0.5">+254 20 221 4450</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="font-semibold text-slate-200">Mombasa Branch</div>
                <div className="text-slate-400 text-[11px]">TSS Towers, 3rd Floor, Nkrumah Rd</div>
                <div className="text-amber-400 font-mono text-[11px] mt-0.5">+254 41 231 8890</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
