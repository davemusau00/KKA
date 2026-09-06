import React, { useState } from 'react';
import {
  Scale,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  ChevronRight,
  Plus,
  Filter,
  Gavel,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Send,
  ExternalLink,
  CheckSquare,
  Users,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent, CourtFilingPackage, ServiceQueueItem } from '../../types';

type CourtView = 'diary' | 'filing_queue' | 'service_queue' | 'outcomes' | 'new';

const COURT_STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-950 text-blue-300 border-blue-800',
  attended: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  adjourned: 'bg-amber-950 text-amber-300 border-amber-800',
  completed: 'bg-slate-800 text-slate-300 border-slate-700',
  cancelled: 'bg-rose-950 text-rose-300 border-rose-800',
  default: 'bg-slate-800 text-slate-300 border-slate-700',
};

const FILING_STATUS_BADGE: Record<string, { label: string; class: string }> = {
  ready_to_file: { label: 'Ready for CTS', class: 'bg-amber-950 text-amber-300 border-amber-800' },
  requisition_pending: { label: 'Fee Requisition Pending', class: 'bg-purple-950 text-purple-300 border-purple-800' },
  submitted_cts: { label: 'Submitted to CTS', class: 'bg-blue-950 text-blue-300 border-blue-800' },
  stamped_filed: { label: 'Stamped & Filed', class: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  rejected_by_registry: { label: 'Registry Rejected', class: 'bg-rose-950 text-rose-300 border-rose-800' },
};

const SERVICE_STATUS_BADGE: Record<string, { label: string; class: string }> = {
  requested: { label: 'Service Requested', class: 'bg-amber-950 text-amber-300 border-amber-800' },
  assigned: { label: 'Process Server Assigned', class: 'bg-blue-950 text-blue-300 border-blue-800' },
  attempted: { label: 'Attempt Logged', class: 'bg-purple-950 text-purple-300 border-purple-800' },
  served: { label: 'Personal Service Effected', class: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  failed: { label: 'Service Failed / Evaded', class: 'bg-rose-950 text-rose-300 border-rose-800' },
  affidavit_received: { label: 'Affidavit Received', class: 'bg-teal-950 text-teal-300 border-teal-800' },
  filed: { label: 'Affidavit Filed in CTS', class: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
};

export const CourtOperationsWorkspace: React.FC = () => {
  const {
    calendarEvents,
    matters,
    users,
    currentUser,
    createCalendarEvent,
    recordCourtOutcome,
    courtFilingPackages,
    updateCourtFilingPackage,
    serviceQueue,
    updateServiceQueueItem,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [view, setView] = useState<CourtView>('diary');
  const [filterDiary, setFilterDiary] = useState<'all' | 'today_tomorrow' | 'upcoming' | 'pending_outcome' | 'completed'>('all');
  const [filterFiling, setFilterFiling] = useState<'all' | 'ready_to_file' | 'submitted_cts' | 'stamped_filed'>('all');
  const [filterService, setFilterService] = useState<'all' | 'assigned' | 'served' | 'affidavit_received' | 'filed'>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Modals / Dialog state
  const [selectedFilingToUpdate, setSelectedFilingToUpdate] = useState<CourtFilingPackage | null>(null);
  const [ctsInput, setCtsInput] = useState('');
  const [caseNoInput, setCaseNoInput] = useState('');

  const [selectedServiceToUpdate, setSelectedServiceToUpdate] = useState<ServiceQueueItem | null>(null);
  const [attemptNotes, setAttemptNotes] = useState('');

  // New court date form
  const [newTitle, setNewTitle] = useState('');
  const [newMatterId, setNewMatterId] = useState(matters[0]?.id || '');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00');
  const [newLocation, setNewLocation] = useState('Milimani Law Courts, Nairobi');
  const [newAssignee, setNewAssignee] = useState(currentUser.id);

  // Outcome form
  const [outcomeStatus, setOutcomeStatus] = useState<'attended' | 'adjourned' | 'completed'>('attended');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextDate, setNextDate] = useState('');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 23, 59, 59);

  const courtEvents = calendarEvents
    .filter((e) => e.eventType === 'court')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Appearances filtered
  const filteredEvents = courtEvents.filter((e) => {
    const eventDate = new Date(e.startAt);
    const status = e.courtStatus || 'scheduled';

    if (filterDiary === 'today_tomorrow') {
      return eventDate >= startOfToday && eventDate <= endOfTomorrow;
    }
    if (filterDiary === 'upcoming') {
      return eventDate >= now && status === 'scheduled';
    }
    if (filterDiary === 'pending_outcome') {
      return eventDate < now && (status === 'scheduled' || status === 'attended');
    }
    if (filterDiary === 'completed') {
      return status === 'completed' || status === 'adjourned';
    }
    return true;
  });

  const todayTomorrowCount = courtEvents.filter((e) => {
    const d = new Date(e.startAt);
    return d >= startOfToday && d <= endOfTomorrow;
  }).length;

  const upcomingCount = courtEvents.filter((e) => new Date(e.startAt) >= now && (e.courtStatus || 'scheduled') === 'scheduled').length;
  const pendingOutcomeCount = courtEvents.filter(
    (e) => new Date(e.startAt) < now && ((e.courtStatus || 'scheduled') === 'scheduled' || e.courtStatus === 'attended')
  ).length;
  const activeFilingsCount = courtFilingPackages.filter((f) => f.status !== 'stamped_filed').length;
  const activeServiceCount = serviceQueue.filter((s) => s.status !== 'filed').length;

  const filteredFilings = courtFilingPackages.filter((f) => {
    if (filterFiling === 'all') return true;
    return f.status === filterFiling;
  });

  const filteredServices = serviceQueue.filter((s) => {
    if (filterService === 'all') return true;
    return s.status === filterService;
  });

  const handleCreateCourtDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createCalendarEvent({
      matterId: newMatterId,
      title: newTitle,
      eventType: 'court',
      startAt: `${newDate}T${newTime}:00Z`,
      endAt: `${newDate}T${String(parseInt(newTime) + 2).padStart(2, '0')}:00:00Z`,
      location: newLocation,
      assignedUserId: newAssignee,
      organizerId: currentUser.id,
      courtStatus: 'scheduled',
    });
    setNewTitle('');
    setView('diary');
  };

  const handleRecordOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    recordCourtOutcome(selectedEvent.id, outcomeStatus, outcomeNotes, nextDate || undefined);
    setSelectedEvent(null);
    setOutcomeNotes('');
    setNextDate('');
  };

  const handleUpdateFilingCts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilingToUpdate) return;
    updateCourtFilingPackage(selectedFilingToUpdate.id, {
      ctsReference: ctsInput.trim() || selectedFilingToUpdate.ctsReference,
      courtCaseNumber: caseNoInput.trim() || selectedFilingToUpdate.courtCaseNumber,
      status: 'submitted_cts',
      submittedAt: new Date().toISOString(),
    });
    setSelectedFilingToUpdate(null);
    setCtsInput('');
    setCaseNoInput('');
  };

  const handleMarkFilingComplete = (pkg: CourtFilingPackage) => {
    updateCourtFilingPackage(pkg.id, {
      status: 'stamped_filed',
      stampedDocsUploaded: true,
      filedAt: new Date().toISOString(),
    });
  };

  const handleRecordServiceAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceToUpdate) return;
    const nowIso = new Date().toISOString();
    const attempts = [
      ...selectedServiceToUpdate.attempts,
      {
        attemptNo: selectedServiceToUpdate.attempts.length + 1,
        date: nowIso,
        outcome: 'Attempt Logged',
        notes: attemptNotes || 'Attempted personal service at given physical address.',
      },
    ];
    updateServiceQueueItem(selectedServiceToUpdate.id, {
      attempts,
      status: 'attempted',
    });
    setSelectedServiceToUpdate(null);
    setAttemptNotes('');
  };

  const handleMarkServiceSuccess = (item: ServiceQueueItem) => {
    updateServiceQueueItem(item.id, {
      status: 'served',
      serviceDate: new Date().toISOString(),
      affidavitOfServiceStatus: 'received',
    });
  };

  const handleMarkAffidavitFiled = (item: ServiceQueueItem) => {
    updateServiceQueueItem(item.id, {
      status: 'filed',
      affidavitOfServiceStatus: 'filed',
    });
  };

  const getMatter = (matterId?: string) => (matterId ? matters.find((m) => m.id === matterId) : undefined);
  const getUser = (userId?: string) => (userId ? users.find((u) => u.id === userId) : undefined);

  const tabs: { id: CourtView; label: string; badge?: number; badgeColor?: string }[] = [
    { id: 'diary', label: 'Court Diary', badge: upcomingCount },
    { id: 'filing_queue', label: 'E-Filing CTS Queue', badge: activeFilingsCount, badgeColor: 'bg-blue-600' },
    { id: 'service_queue', label: 'Summons & Service', badge: activeServiceCount, badgeColor: 'bg-purple-600' },
    { id: 'outcomes', label: 'Pending Outcomes', badge: pendingOutcomeCount, badgeColor: 'bg-amber-600' },
    { id: 'new', label: '+ Diarize Hearing' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden text-xs">
      {/* Top Persistent Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-blue-400 tracking-widest font-bold">
                KKA Legal Operations Engine
              </div>
              <h1 className="text-lg font-serif font-bold text-slate-100">
                Court Operations &amp; Registry Management Centre
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { label: 'Today / Tmrw', value: todayTomorrowCount, color: 'text-amber-400' },
              { label: 'Upcoming', value: upcomingCount, color: 'text-blue-400' },
              { label: 'Pending Filings', value: activeFilingsCount, color: 'text-purple-400' },
              { label: 'In Service', value: activeServiceCount, color: 'text-emerald-400' },
              { label: 'Need Outcome', value: pendingOutcomeCount, color: 'text-rose-400' },
            ].map((stat) => (
              <div key={stat.label} className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center min-w-[70px]">
                <div className={`text-base font-black font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[9px] uppercase text-slate-400 font-mono tracking-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary View Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                view === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  view === tab.id ? 'bg-white/25 text-white' : tab.badgeColor ? `${tab.badgeColor} text-white` : 'bg-slate-700 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {/* ─── TAB 1: COURT DIARY ─── */}
        {view === 'diary' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Filter pills */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Appearances' },
                  { id: 'today_tomorrow', label: '⚡ Today & Tomorrow' },
                  { id: 'upcoming', label: 'Upcoming Hearings' },
                  { id: 'pending_outcome', label: 'Needs Outcome Record' },
                  { id: 'completed', label: 'Concluded' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterDiary(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      filterDiary === f.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setView('new')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition ml-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Diarize Hearing
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                <Scale className="w-12 h-12 mb-3 text-slate-700" />
                <div className="font-semibold text-slate-300">No court appearances matching filter</div>
                <p className="text-xs text-slate-500 mt-1">Try selecting 'All Appearances' or diarize a new appearance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const matter = getMatter(event.matterId);
                  const assignee = getUser(event.assignedUserId);
                  const eventDate = new Date(event.startAt);
                  const cStatus = event.courtStatus || 'scheduled';
                  const isOverdue = eventDate < now && (cStatus === 'scheduled' || cStatus === 'attended');
                  const statusClass = COURT_STATUS_COLOR[cStatus] || COURT_STATUS_COLOR.default;

                  return (
                    <div
                      key={event.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition ${
                        isOverdue
                          ? 'bg-amber-950/20 border-amber-700/60 shadow-lg shadow-amber-950/20'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isOverdue && (
                              <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase tracking-wide bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                                <AlertTriangle className="w-3 h-3" />
                                Awaiting outcome record
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                              {cStatus.toUpperCase()}
                            </span>
                            {matter && (
                              <button
                                onClick={() => {
                                  setSelectedMatterId(matter.id);
                                  setActiveWorkspace('matters');
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px] hover:bg-slate-700 transition flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                {matter.internalReference} — {matter.title}
                              </button>
                            )}
                          </div>

                          <div className="font-semibold text-slate-100 text-sm">{event.title}</div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1 font-mono text-slate-300">
                              <Calendar className="w-3 h-3 text-blue-400" />
                              {eventDate.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-slate-300">
                              <Clock className="w-3 h-3 text-blue-400" />
                              {eventDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {event.location}
                              </span>
                            )}
                            {assignee && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Users className="w-3 h-3 text-emerald-400" />
                                Counsel: <strong>{assignee.fullName}</strong>
                              </span>
                            )}
                          </div>

                          {event.courtOutcome && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                              <div className="text-[9px] uppercase font-mono text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Recorded Court Outcome &amp; Directions
                              </div>
                              <div className="leading-relaxed">{event.courtOutcome}</div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          {(cStatus === 'scheduled' || cStatus === 'attended') && (
                            <button
                              onClick={() => {
                                setSelectedEvent(event);
                                setView('outcomes');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 text-[11px] font-bold flex items-center gap-1 transition shadow"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Record Outcome
                            </button>
                          )}
                          {matter && (
                            <button
                              onClick={() => {
                                setSelectedMatterId(matter.id);
                                setActiveWorkspace('matters');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Matter Workspace
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
        )}

        {/* ─── TAB 2: E-FILING CTS QUEUE ─── */}
        {view === 'filing_queue' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Filings' },
                  { id: 'ready_to_file', label: 'Ready for CTS' },
                  { id: 'submitted_cts', label: 'Submitted to CTS' },
                  { id: 'stamped_filed', label: 'Stamped & Filed' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterFiling(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      filterFiling === f.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                CTS Integrated Registry Portal
              </div>
            </div>

            {filteredFilings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                <FileCheck className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <div className="font-semibold text-slate-300">No filings matching this filter</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFilings.map((pkg) => {
                  const badge = FILING_STATUS_BADGE[pkg.status] || { label: pkg.status, class: 'bg-slate-800 text-slate-300 border-slate-700' };
                  const matter = getMatter(pkg.matterId);
                  const clerk = getUser(pkg.assignedClerkId);

                  return (
                    <div
                      key={pkg.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-400">{pkg.matterRef}</span>
                          <span className="text-slate-300 font-medium">{pkg.courtStation} — {pkg.division}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                          {pkg.courtCaseNumber ? (
                            <span className="text-emerald-400 font-bold">Case No: {pkg.courtCaseNumber}</span>
                          ) : (
                            <span className="text-amber-400">Case No: Pending Registry</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-mono text-slate-500">Pleadings Bundle</div>
                          <div className="space-y-1">
                            {pkg.documents.map((d, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                                {d.isStamped ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                )}
                                <span className="truncate">{d.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-mono text-slate-500">Registry Assessment &amp; CTS</div>
                          <div className="text-slate-300">
                            Court Assessment: <strong className="font-mono text-amber-300">KES {pkg.courtAssessmentKes.toLocaleString()}</strong>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            CTS Ref: <strong className="font-mono text-slate-200">{pkg.ctsReference || 'Not yet generated'}</strong>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Assigned Clerk: <strong className="text-slate-200">{clerk?.fullName || pkg.assignedClerkId}</strong>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end gap-2 sm:items-end">
                          {pkg.status !== 'stamped_filed' && (
                            <button
                              onClick={() => {
                                setSelectedFilingToUpdate(pkg);
                                setCtsInput(pkg.ctsReference || '');
                                setCaseNoInput(pkg.courtCaseNumber || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition text-xs shadow"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Update CTS Barcode &amp; Status
                            </button>
                          )}
                          {pkg.status === 'submitted_cts' && (
                            <button
                              onClick={() => handleMarkFilingComplete(pkg)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5 transition text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirm Stamped &amp; Filed
                            </button>
                          )}
                          {matter && (
                            <button
                              onClick={() => {
                                setSelectedMatterId(matter.id);
                                setActiveWorkspace('matters');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] transition flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Go to Matter
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
        )}

        {/* ─── TAB 3: SUMMONS & SERVICE QUEUE ─── */}
        {view === 'service_queue' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'assigned', label: 'Active Service' },
                  { id: 'served', label: 'Served' },
                  { id: 'affidavit_received', label: 'Affidavit Received' },
                  { id: 'filed', label: 'Filed in CTS' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterService(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      filterService === f.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Order V Civil Procedure Rules Track
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <div className="font-semibold text-slate-300">No service items matching filter</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((item) => {
                  const badge = SERVICE_STATUS_BADGE[item.status] || { label: item.status, class: 'bg-slate-800 text-slate-300 border-slate-700' };
                  const matter = getMatter(item.matterId);

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-400">{item.matterRef}</span>
                          <span className="text-slate-200 font-semibold">{item.documentTitle}</span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono">
                          Service Due: <strong className="text-rose-400">{new Date(item.dueDate).toLocaleDateString()}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-mono text-slate-500">Party to Serve</div>
                          <div className="text-slate-200 font-semibold">{item.partyToServe}</div>
                          <div className="text-slate-400 text-[11px] flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span>{item.partyAddress}</span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Method: <strong className="text-slate-300">{item.serviceMethod}</strong>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-mono text-slate-500">Process Server &amp; Affidavit</div>
                          <div className="text-slate-300">
                            Server: <strong className="text-blue-400">{item.processServerName}</strong>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Affidavit Status: <strong className="text-amber-300 uppercase">{item.affidavitOfServiceStatus}</strong>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Attempts Logged: <strong className="font-mono text-slate-200">{item.attempts.length}</strong>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end gap-2 sm:items-end">
                          {item.status !== 'served' && item.status !== 'filed' && (
                            <button
                              onClick={() => {
                                setSelectedServiceToUpdate(item);
                                setAttemptNotes('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition text-xs shadow"
                            >
                              <Plus className="w-3.5 h-3.5" /> Log Attempt
                            </button>
                          )}
                          {item.status !== 'served' && item.status !== 'filed' && (
                            <button
                              onClick={() => handleMarkServiceSuccess(item)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5 transition text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Personal Service Effected
                            </button>
                          )}
                          {item.status === 'served' && item.affidavitOfServiceStatus !== 'filed' && (
                            <button
                              onClick={() => handleMarkAffidavitFiled(item)}
                              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-semibold flex items-center gap-1.5 transition text-xs shadow"
                            >
                              <FileCheck className="w-3.5 h-3.5" /> File Affidavit in CTS
                            </button>
                          )}
                          {matter && (
                            <button
                              onClick={() => {
                                setSelectedMatterId(matter.id);
                                setActiveWorkspace('matters');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] transition flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Open Matter File
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
        )}

        {/* ─── TAB 4: OUTCOMES TAB ─── */}
        {view === 'outcomes' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              <span>Record Court Appearance Outcome &amp; Next Directions</span>
            </h2>

            {!selectedEvent ? (
              <div className="space-y-3">
                {courtEvents
                  .filter((e) => (e.courtStatus || 'scheduled') === 'scheduled' || e.courtStatus === 'attended')
                  .filter((e) => new Date(e.startAt) < now)
                  .map((event) => {
                    const matter = getMatter(event.matterId);
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left p-4 rounded-2xl bg-slate-900 border border-amber-700/50 hover:border-amber-500 transition group space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-200 group-hover:text-white text-sm">{event.title}</div>
                            <div className="text-[11px] text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {new Date(event.startAt).toLocaleDateString()} — Outcome pending
                            </div>
                            {matter && (
                              <div className="text-[10px] font-mono text-slate-400">
                                {matter.internalReference} — {matter.title}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition shrink-0" />
                        </div>
                      </button>
                    );
                  })}

                {courtEvents.filter((e) =>
                  ((e.courtStatus || 'scheduled') === 'scheduled' || e.courtStatus === 'attended') && new Date(e.startAt) < now
                ).length === 0 && (
                  <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <div className="font-semibold text-slate-300">All court appearances are up to date</div>
                    <p className="text-xs text-slate-500 mt-1">No pending outcome records required at this time.</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleRecordOutcome} className="space-y-5 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-amber-400 font-bold">Selected Appearance</span>
                  <div className="font-semibold text-slate-100 text-sm">{selectedEvent.title}</div>
                  <div className="text-slate-400 text-xs">
                    {new Date(selectedEvent.startAt).toLocaleDateString()} at {selectedEvent.location || 'Court'}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Court Status *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'attended', label: 'Attended / Order Given' },
                      { id: 'adjourned', label: 'Adjourned' },
                      { id: 'completed', label: 'Hearing Concluded' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setOutcomeStatus(s.id as any)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                          outcomeStatus === s.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Court Directions &amp; Orders Summary *</label>
                  <textarea
                    rows={4}
                    required
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="e.g. Plaint admitted. Defendant granted 14 days to file written statement of defence. Mention on 18th October 2026 for pre-trial directions."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Next Mention / Hearing Date (Optional)</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
                  >
                    Back to List
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Save Court Outcome
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── TAB 5: NEW COURT DATE ─── */}
        {view === 'new' && (
          <form onSubmit={handleCreateCourtDate} className="space-y-4 max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Diarize Court Appearance</span>
            </h2>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Matter *</label>
              <select
                value={newMatterId}
                onChange={(e) => setNewMatterId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.internalReference} — {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Hearing Description *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Pre-Trial Directions Mention / Notice of Motion Hearing"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Court Station / Virtual Link</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Milimani Law Courts, Nairobi / Virtual MS Teams Link"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Assigned Counsel</label>
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.roles.join(', ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setView('diary')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow"
              >
                <Calendar className="w-3.5 h-3.5" />
                Diarize Court Date
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MODAL: Update CTS Filing Package */}
      {selectedFilingToUpdate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Update CTS E-Filing Details</h3>
              <button
                onClick={() => setSelectedFilingToUpdate(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFilingCts} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Judiciary CTS Reference / Barcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CTS-2026-NAI-00892"
                  value={ctsInput}
                  onChange={(e) => setCtsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Assigned Official Court Case Number</label>
                <input
                  type="text"
                  placeholder="e.g. HCCC NO. E142 OF 2026"
                  value={caseNoInput}
                  onChange={(e) => setCaseNoInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFilingToUpdate(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Save CTS Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Service Attempt */}
      {selectedServiceToUpdate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Record Process Server Attempt</h3>
              <button
                onClick={() => setSelectedServiceToUpdate(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordServiceAttempt} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div className="text-[10px] uppercase font-mono text-slate-500">Target Party</div>
                <div className="font-semibold text-slate-100">{selectedServiceToUpdate.partyToServe}</div>
                <div className="text-[11px] text-slate-400">{selectedServiceToUpdate.partyAddress}</div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Process Server Attempt Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Visited company headquarters at 10:30 AM; company secretary absent, security directed return on Monday."
                  value={attemptNotes}
                  onChange={(e) => setAttemptNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceToUpdate(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Service Attempt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
