import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Building2,
  FileCheck,
  Send,
  Gavel,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CourtDeadlinesAlertDashboard: React.FC = () => {
  const {
    calendarEvents,
    deadlines,
    tasks,
    matters,
    currentUser,
    completeTask,
    setSelectedMatterId,
    setActiveWorkspace,
    notify,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'court' | 'filing'>('all');
  const [sentReminders, setSentReminders] = useState<Record<string, boolean>>({});

  const now = new Date();
  const nowMs = now.getTime();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // 1. Court Appearances / Hearings in next 48 hours
  const upcomingEvents48h = calendarEvents.filter((ev) => {
    const time = new Date(ev.startAt).getTime();
    const diff = time - nowMs;
    return diff >= -3600000 && diff <= fortyEightHoursMs;
  });

  // 2. Deadlines in next 48 hours
  const upcomingDeadlines48h = deadlines.filter((dl) => {
    const time = new Date(dl.officialDueAt).getTime();
    const diff = time - nowMs;
    return !dl.completedAt && diff >= -86400000 && diff <= fortyEightHoursMs;
  });

  // 3. Court Filing tasks in next 48 hours
  const filingTasks48h = tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const time = new Date(t.dueAt).getTime();
    const diff = time - nowMs;
    const isFiling =
      t.title.toLowerCase().includes('file') ||
      t.title.toLowerCase().includes('filing') ||
      t.title.toLowerCase().includes('court') ||
      t.title.toLowerCase().includes('pleadings') ||
      t.title.toLowerCase().includes('affidavit') ||
      t.title.toLowerCase().includes('submissions');
    return isFiling && diff >= -86400000 && diff <= fortyEightHoursMs;
  });

  // Combine unified alert items
  interface AlertItem {
    id: string;
    type: 'court_hearing' | 'filing_deadline' | 'filing_task';
    title: string;
    timestamp: string;
    matterId?: string;
    station: string;
    details?: string;
    urgency: 'critical' | 'high' | 'medium';
    hoursLeft: number;
    originalRef: any;
  }

  const alertItems: AlertItem[] = [
    ...upcomingEvents48h.map((e) => {
      const ms = new Date(e.startAt).getTime() - nowMs;
      const hours = Math.round(ms / 3600000);
      return {
        id: `ev-${e.id}`,
        type: 'court_hearing' as const,
        title: e.title,
        timestamp: e.startAt,
        matterId: e.matterId,
        station: e.location || 'Milimani Law Courts',
        details: e.notes || 'Hearing / Court Attendance Scheduled',
        urgency: hours <= 12 ? ('critical' as const) : hours <= 24 ? ('high' as const) : ('medium' as const),
        hoursLeft: hours,
        originalRef: e,
      };
    }),
    ...upcomingDeadlines48h.map((d) => {
      const ms = new Date(d.officialDueAt).getTime() - nowMs;
      const hours = Math.round(ms / 3600000);
      return {
        id: `dl-${d.id}`,
        type: 'filing_deadline' as const,
        title: d.title,
        timestamp: d.officialDueAt,
        matterId: d.matterId,
        station: 'Kenya Judiciary CTS Portal',
        details: `Statutory / Rule Deadline (${d.source}): ${d.notes || 'Formal compliance filing required'}`,
        urgency: hours <= 12 ? ('critical' as const) : hours <= 24 ? ('high' as const) : ('medium' as const),
        hoursLeft: hours,
        originalRef: d,
      };
    }),
    ...filingTasks48h.map((t) => {
      const ms = new Date(t.dueAt).getTime() - nowMs;
      const hours = Math.round(ms / 3600000);
      return {
        id: `task-${t.id}`,
        type: 'filing_task' as const,
        title: t.title,
        timestamp: t.dueAt,
        matterId: t.matterId,
        station: 'Court Registry / E-Filing Desk',
        details: `Registry Action: ${t.description || 'Pleadings service and filing'}`,
        urgency: hours <= 12 ? ('critical' as const) : hours <= 24 ? ('high' as const) : ('medium' as const),
        hoursLeft: hours,
        originalRef: t,
      };
    }),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const filteredItems = alertItems.filter((item) => {
    if (filterType === 'court') return item.type === 'court_hearing';
    if (filterType === 'filing') return item.type === 'filing_deadline' || item.type === 'filing_task';
    return true;
  });

  const handleSendReminder = (item: AlertItem) => {
    const matter = matters.find((m) => m.id === item.matterId);
    setSentReminders((prev) => ({ ...prev, [item.id]: true }));
    notify(
      currentUser.id,
      `Client & Advocate Reminders Sent: ${item.title}`,
      `Automated WhatsApp & SMS dispatched to client and lead advocate for ${matter?.internalReference || 'matter'} with court reporting instructions.`,
      'court_event'
    );
  };

  const criticalCount = alertItems.filter((i) => i.urgency === 'critical').length;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              criticalCount > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Litigation Operations
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Real-time Calendar Sync
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Upcoming Court Deadlines &amp; Filing Requirements</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-sans font-semibold ${
                  criticalCount > 0
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {alertItems.length} within 48h
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous monitoring of statutory limitation dates, pleadings filings, and scheduled mentions across Nairobi and Mombasa registries.
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl self-start md:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'all'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({alertItems.length})
          </button>
          <button
            onClick={() => setFilterType('court')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'court'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Court Dates ({upcomingEvents48h.length})
          </button>
          <button
            onClick={() => setFilterType('filing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'filing'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Filings ({upcomingDeadlines48h.length + filingTasks48h.length})
          </button>
        </div>
      </div>

      {/* Alert Items List */}
      <div className="p-4 sm:p-5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-slate-200">
              No Pending Deadlines in the Next 48 Hours
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              All court appearances, pleading submissions, and statutory filing requisitions within the 48-hour window are up to date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => {
              const matter = matters.find((m) => m.id === item.matterId);
              const isHearing = item.type === 'court_hearing';
              const isReminderSent = !!sentReminders[item.id];

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    item.urgency === 'critical'
                      ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-700 shadow-sm'
                      : item.urgency === 'high'
                      ? 'bg-amber-950/20 border-amber-800/70 hover:border-amber-700'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Pill Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            item.urgency === 'critical'
                              ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                              : item.urgency === 'high'
                              ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {item.hoursLeft <= 0
                            ? 'DUE NOW'
                            : item.hoursLeft === 1
                            ? 'IN 1 HOUR'
                            : `IN ${item.hoursLeft} HOURS`}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
                          {isHearing ? <Gavel className="w-3 h-3 text-amber-400" /> : <Scale className="w-3 h-3 text-sky-400" />}
                          {isHearing ? 'Court Appearance' : 'Filing Deadline'}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        &bull;{' '}
                        {new Date(item.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Title and Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h4>
                      {item.details && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {item.details}
                        </p>
                      )}
                    </div>

                    {/* Court / Station / Matter Meta */}
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate font-medium">{item.station}</span>
                      </div>
                      {matter && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
                          <span className="text-amber-400 font-semibold">{matter.internalReference}</span>
                          <span>&bull;</span>
                          <span className="truncate">{matter.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {matter && (
                        <button
                          onClick={() => {
                            setSelectedMatterId(matter.id);
                            setActiveWorkspace('matters');
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
                        >
                          <span>Open Matter File</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setActiveWorkspace('calendar')}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Court Diary</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendReminder(item)}
                        disabled={isReminderSent}
                        className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                          isReminderSent
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                        title="Dispatches WhatsApp & SMS with court directions to client"
                      >
                        {isReminderSent ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Reminder Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 text-emerald-400" />
                            <span>Notify Client</span>
                          </>
                        )}
                      </button>

                      {item.type === 'filing_task' && (
                        <button
                          onClick={() => completeTask(item.originalRef.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 shadow transition"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>Mark Filed</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
