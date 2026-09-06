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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';

type CourtView = 'diary' | 'outcomes' | 'new';

const COURT_STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-950 text-blue-300 border-blue-800',
  attended: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  adjourned: 'bg-amber-950 text-amber-300 border-amber-800',
  completed: 'bg-slate-800 text-slate-300 border-slate-700',
  cancelled: 'bg-rose-950 text-rose-300 border-rose-800',
  default: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const CourtOperationsWorkspace: React.FC = () => {
  const {
    calendarEvents,
    matters,
    users,
    currentUser,
    createCalendarEvent,
    recordCourtOutcome,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [view, setView] = useState<CourtView>('diary');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'pending_outcome' | 'completed'>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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

  const courtEvents = calendarEvents
    .filter((e) => e.eventType === 'court')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const now = new Date();

  const filteredEvents = courtEvents.filter((e) => {
    const eventDate = new Date(e.startAt);
    if (filterStatus === 'upcoming') return eventDate >= now && e.status === 'scheduled';
    if (filterStatus === 'pending_outcome') return eventDate < now && (e.status === 'scheduled' || e.status === 'attended');
    if (filterStatus === 'completed') return e.status === 'completed' || e.status === 'adjourned';
    return true;
  });

  const upcomingCount = courtEvents.filter((e) => new Date(e.startAt) >= now && e.status === 'scheduled').length;
  const pendingOutcomeCount = courtEvents.filter(
    (e) => new Date(e.startAt) < now && (e.status === 'scheduled' || e.status === 'attended')
  ).length;
  const completedCount = courtEvents.filter((e) => e.status === 'completed' || e.status === 'adjourned').length;

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
      status: 'scheduled',
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

  const getMatter = (matterId: string) => matters.find((m) => m.id === matterId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const tabs: { id: CourtView; label: string; badge?: number }[] = [
    { id: 'diary', label: 'Court Diary', badge: upcomingCount },
    { id: 'outcomes', label: 'Pending Outcomes', badge: pendingOutcomeCount },
    { id: 'new', label: '+ New Hearing Date' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-blue-400 tracking-widest">KKA Legal OS</div>
              <h1 className="text-lg font-serif font-bold text-slate-100">Court Operations Centre</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {[
              { label: 'Upcoming', value: upcomingCount, color: 'text-blue-400' },
              { label: 'Needs Outcome', value: pendingOutcomeCount, color: 'text-amber-400' },
              { label: 'Concluded', value: completedCount, color: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-center">
                <div className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[9px] uppercase text-slate-400 font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                view === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  view === tab.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ─── COURT DIARY TAB ─── */}
        {view === 'diary' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: 'All Appearances' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'pending_outcome', label: 'Needs Outcome' },
                { id: 'completed', label: 'Concluded' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                    filterStatus === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Scale className="w-12 h-12 mb-3 text-slate-700" />
                <div className="font-semibold text-slate-300">No court appearances found</div>
                <p className="text-sm mt-1">Schedule a new hearing date to get started.</p>
                <button
                  onClick={() => setView('new')}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Hearing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const matter = getMatter(event.matterId);
                  const assignee = getUser(event.assignedUserId);
                  const eventDate = new Date(event.startAt);
                  const isOverdue = eventDate < now && (event.status === 'scheduled' || event.status === 'attended');
                  const statusClass = COURT_STATUS_COLOR[event.status] || COURT_STATUS_COLOR.default;

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-2xl border transition ${
                        isOverdue
                          ? 'bg-amber-950/20 border-amber-700/60'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {isOverdue && (
                            <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase tracking-wide">
                              <AlertTriangle className="w-3 h-3" />
                              Awaiting outcome record
                            </div>
                          )}
                          <div className="font-semibold text-slate-100 text-sm">{event.title}</div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {eventDate.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {eventDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                              {event.status.toUpperCase()}
                            </span>
                            {matter && (
                              <button
                                onClick={() => { setSelectedMatterId(matter.id); setActiveWorkspace('matters'); }}
                                className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px] hover:bg-slate-700 transition flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                {matter.internalReference}
                              </button>
                            )}
                            {assignee && (
                              <span className="text-[10px] text-slate-400">
                                Advocate: <strong className="text-slate-300">{assignee.fullName}</strong>
                              </span>
                            )}
                          </div>

                          {event.outcomeNotes && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] text-slate-300">
                              <div className="text-[9px] uppercase font-mono text-slate-500 mb-0.5">Outcome Notes</div>
                              {event.outcomeNotes}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 shrink-0">
                          {(event.status === 'scheduled' || event.status === 'attended') && (
                            <button
                              onClick={() => { setSelectedEvent(event); setView('outcomes'); }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Record Outcome
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

        {/* ─── OUTCOMES TAB ─── */}
        {view === 'outcomes' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Record Court Outcome</h2>

            {!selectedEvent ? (
              <div className="space-y-3">
                {courtEvents
                  .filter((e) => e.status === 'scheduled' || e.status === 'attended')
                  .filter((e) => new Date(e.startAt) < now)
                  .map((event) => {
                    const matter = getMatter(event.matterId);
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left p-4 rounded-2xl bg-slate-900 border border-amber-700/50 hover:border-amber-600 transition group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-200 group-hover:text-white">{event.title}</div>
                            <div className="text-[11px] text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {new Date(event.startAt).toLocaleDateString()} — Outcome not yet recorded
                            </div>
                            {matter && (
                              <div className="text-[10px] font-mono text-slate-400">{matter.internalReference}</div>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
                        </div>
                      </button>
                    );
                  })}

                {courtEvents.filter((e) =>
                  (e.status === 'scheduled' || e.status === 'attended') && new Date(e.startAt) < now
                ).length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                    <div className="font-semibold text-slate-300">All court appearances are up to date</div>
                    <p className="text-sm mt-1">No pending outcome records required.</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleRecordOutcome} className="space-y-5 max-w-xl">
                {/* Event summary */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Recording outcome for</div>
                  <div className="font-bold text-slate-100">{selectedEvent.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(selectedEvent.startAt).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {selectedEvent.location && ` · ${selectedEvent.location}`}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 text-xs mb-1">Hearing Outcome *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'attended', label: 'Attended & Concluded', icon: CheckCircle, color: 'emerald' },
                      { val: 'adjourned', label: 'Adjourned', icon: Clock, color: 'amber' },
                      { val: 'completed', label: 'Case Closed / Won / Settled', icon: Scale, color: 'blue' },
                    ].map(({ val, label, icon: Icon, color }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setOutcomeStatus(val as any)}
                        className={`p-3 rounded-xl border text-center transition ${
                          outcomeStatus === val
                            ? `bg-${color}-950/60 border-${color}-600 text-${color}-300`
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-[10px] font-semibold">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Outcome Notes / Minutes *</label>
                  <textarea
                    rows={4}
                    required
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="e.g. Matter called. Defence filed preliminary objection. Court directed Plaintiff to respond within 14 days. Next date set..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {outcomeStatus === 'adjourned' && (
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Next Hearing Date</label>
                    <input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Save Court Outcome
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── NEW HEARING DATE TAB ─── */}
        {view === 'new' && (
          <form onSubmit={handleCreateCourtDate} className="space-y-5 max-w-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Schedule New Court Hearing</h2>

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
                placeholder="e.g. Mention — Interlocutory Application"
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
              <label className="block text-slate-400 text-xs mb-1">Court / Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Assigned Advocate</label>
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('diary')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                Diarize Court Date
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
