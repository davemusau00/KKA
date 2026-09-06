import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Scale,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  AlertTriangle,
  CalendarDays,
  ListFilter,
  Grid,
  Columns,
  List,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export const CalendarWorkspace: React.FC = () => {
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

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'court' | 'client_meeting' | 'internal_meeting' | 'filing' | 'deadline'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEventForOutcome, setSelectedEventForOutcome] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventMatterId, setEventMatterId] = useState(matters[0]?.id || '');
  const [eventType, setEventType] = useState<CalendarEvent['eventType']>('court');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('09:00');
  const [eventLocation, setEventLocation] = useState('Milimani Law Courts, Nairobi');
  const [eventAssignee, setEventAssignee] = useState(currentUser.id);

  // Outcome Form State
  const [courtStatusChoice, setCourtStatusChoice] = useState<'attended' | 'adjourned' | 'completed'>('attended');
  const [courtOutcomeText, setCourtOutcomeText] = useState('');
  const [nextCourtDateInput, setNextCourtDateInput] = useState('');

  // Conflict detection engine
  const conflictEventIds = useMemo(() => {
    const conflicts = new Set<string>();
    const eventsWithDates = calendarEvents.map((e) => ({
      id: e.id,
      userId: e.assignedUserId,
      start: new Date(e.startAt).getTime(),
      end: new Date(e.endAt || e.startAt).getTime() || new Date(e.startAt).getTime() + 3600000,
    }));

    for (let i = 0; i < eventsWithDates.length; i++) {
      for (let j = i + 1; j < eventsWithDates.length; j++) {
        const a = eventsWithDates[i];
        const b = eventsWithDates[j];
        if (a.userId === b.userId && a.start < b.end && b.start < a.end) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
    return conflicts;
  }, [calendarEvents]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return calendarEvents
      .filter((e) => (filterType === 'all' ? true : e.eventType === filterType))
      .filter((e) => (filterUser === 'all' ? true : e.assignedUserId === filterUser))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [calendarEvents, filterType, filterUser]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'day') d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'day') d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    createCalendarEvent({
      matterId: eventMatterId,
      title: eventTitle,
      eventType,
      startAt: `${eventDate}T${eventTime}:00Z`,
      endAt: `${eventDate}T${String(parseInt(eventTime) + 2).padStart(2, '0')}:00:00Z`,
      location: eventLocation,
      courtStatus: eventType === 'court' ? 'scheduled' : undefined,
      assignedUserId: eventAssignee,
      organizerId: currentUser.id,
    });

    setShowAddEventModal(false);
    setEventTitle('');
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForOutcome) return;
    recordCourtOutcome(selectedEventForOutcome.id, courtStatusChoice, courtOutcomeText, nextCourtDateInput || undefined);
    setSelectedEventForOutcome(null);
    setCourtOutcomeText('');
    setNextCourtDateInput('');
  };

  // Month grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Week days helpers
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Judiciary Court Diary &amp; Firm Calendar
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              EAT (UTC+3)
            </span>
            {conflictEventIds.size > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {conflictEventIds.size} Schedule Conflict{conflictEventIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Court Calendar &amp; Case Appearances
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            {(['month', 'week', 'day', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition ${
                  viewMode === mode
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddEventModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Diarize Event</span>
          </button>
        </div>
      </div>

      {/* Navigation & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-100 ml-2">
            {currentDate.toLocaleDateString('en-KE', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' ? { day: 'numeric' } : {}),
            })}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="court">Court Appearances</option>
            <option value="client_meeting">Client Consultations</option>
            <option value="internal_meeting">Internal Meetings</option>
            <option value="filing">Court Filings</option>
            <option value="deadline">Deadlines</option>
          </select>

          {/* Advocate filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Advocates &amp; Staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── 1. MONTH VIEW ─── */}
      {viewMode === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 text-center font-bold text-slate-400 py-2.5 bg-slate-950/50 uppercase tracking-wider text-[10px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {/* Blank prefix cells */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[100px] p-2 bg-slate-950/20 border-b border-r border-slate-800/50" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.startAt.startsWith(dateStr));
              const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[100px] p-2 border-b border-r border-slate-800/60 transition flex flex-col ${
                    isToday ? 'bg-amber-950/20' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isToday ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500">{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map((evt) => {
                      const hasConflict = conflictEventIds.has(evt.id);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            if (evt.eventType === 'court') {
                              setSelectedEventForOutcome(evt);
                              setCourtOutcomeText(evt.courtOutcome || '');
                            }
                          }}
                          className={`p-1 rounded text-[10px] font-medium truncate cursor-pointer transition border ${
                            hasConflict
                              ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                              : evt.eventType === 'court'
                              ? 'bg-amber-950/60 border-amber-800 text-amber-200 hover:bg-amber-900/60'
                              : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                          }`}
                          title={`${evt.title} (${new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                        >
                          <span className="font-mono text-[9px] mr-1">
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 2. WEEK VIEW ─── */}
      {viewMode === 'week' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="grid grid-cols-7 border-b border-slate-800 text-center py-2.5 bg-slate-950/50">
            {weekDays.map((d) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={d.toISOString()} className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {d.toLocaleDateString('en-KE', { weekday: 'short' })}
                  </div>
                  <div
                    className={`inline-block w-7 h-7 rounded-full leading-7 text-xs font-bold ${
                      isToday ? 'bg-amber-500 text-slate-950' : 'text-slate-200'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((d) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayEvents = filteredEvents.filter((e) => e.startAt.startsWith(dateStr));

              return (
                <div key={dateStr} className="p-2 border-r border-slate-800 space-y-2">
                  {dayEvents.map((evt) => {
                    const hasConflict = conflictEventIds.has(evt.id);
                    return (
                      <div
                        key={evt.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          hasConflict
                            ? 'bg-rose-950/40 border-rose-700'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {hasConflict && (
                            <span className="text-rose-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Conflict
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-200 leading-tight">{evt.title}</div>
                        {evt.location && <div className="text-[10px] text-slate-400 truncate">{evt.location}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. DAY VIEW ─── */}
      {viewMode === 'day' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-3">
            <span>Schedule for {currentDate.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredEvents.filter((e) => e.startAt.startsWith(currentDate.toISOString().split('T')[0])).length} Event(s)
            </span>
          </div>

          <div className="space-y-3">
            {filteredEvents
              .filter((e) => e.startAt.startsWith(currentDate.toISOString().split('T')[0]))
              .map((evt) => {
                const hasConflict = conflictEventIds.has(evt.id);
                const matter = matters.find((m) => m.id === evt.matterId);
                const assignee = users.find((u) => u.id === evt.assignedUserId);

                return (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                      hasConflict ? 'bg-rose-950/20 border-rose-800' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-amber-400 font-bold">
                          {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {evt.eventType}
                        </span>
                        {hasConflict && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overlapping Appearance
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-100">{evt.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        {evt.location && <span>📍 {evt.location}</span>}
                        {assignee && <span>👤 Advocate: {assignee.fullName}</span>}
                        {matter && <span className="font-mono text-amber-400">⚖️ {matter.internalReference}</span>}
                      </div>
                    </div>

                    {evt.eventType === 'court' && (
                      <button
                        onClick={() => {
                          setSelectedEventForOutcome(evt);
                          setCourtOutcomeText(evt.courtOutcome || '');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Record Outcome
                      </button>
                    )}
                  </div>
                );
              })}

            {filteredEvents.filter((e) => e.startAt.startsWith(currentDate.toISOString().split('T')[0])).length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No events scheduled for this day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 4. AGENDA VIEW ─── */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
            const matter = matters.find((m) => m.id === evt.matterId);
            const isCourt = evt.eventType === 'court';
            const isTomorrow = new Date(evt.startAt).toDateString() === new Date(Date.now() + 86400000).toDateString();
            const hasConflict = conflictEventIds.has(evt.id);

            return (
              <div
                key={evt.id}
                className={`p-5 rounded-2xl border transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  hasConflict
                    ? 'bg-rose-950/20 border-rose-800'
                    : isTomorrow
                    ? 'bg-amber-950/20 border-amber-800/80'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                        isCourt ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {evt.eventType}
                    </span>
                    {evt.courtStatus && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {evt.courtStatus}
                      </span>
                    )}
                    {hasConflict && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Schedule Conflict
                      </span>
                    )}
                    {isTomorrow && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                        Tomorrow
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{evt.title}</h3>

                  <div className="flex items-center gap-4 text-slate-400 text-xs flex-wrap">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{new Date(evt.startAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </div>
                    {evt.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{evt.location}</span>
                      </div>
                    )}
                    {matter && (
                      <button
                        onClick={() => {
                          setSelectedMatterId(matter.id);
                          setActiveWorkspace('matters');
                        }}
                        className="text-amber-400 hover:underline font-mono"
                      >
                        {matter.internalReference}
                      </button>
                    )}
                  </div>

                  {evt.courtOutcome && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                      <strong className="text-amber-400">Recorded Court Outcome:</strong> {evt.courtOutcome}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isCourt && (
                    <button
                      onClick={() => {
                        setSelectedEventForOutcome(evt);
                        setCourtOutcomeText(evt.courtOutcome || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
                    >
                      Record Outcome
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Outcome Modal */}
      {selectedEventForOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveOutcome} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-100">
              Record Court Appearance Outcome
            </h3>
            <p className="text-slate-400 text-xs">
              Brief court proceedings, directions, orders given, and automatic next court date diarization.
            </p>

            <div>
              <label className="block text-slate-300 mb-1">Appearance Outcome Status</label>
              <select
                value={courtStatusChoice}
                onChange={(e) => setCourtStatusChoice(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
              >
                <option value="attended">Attended &bull; Proceedings / Hearing Held</option>
                <option value="adjourned">Adjourned by Court or Adverse Party</option>
                <option value="completed">Concluded / Final Judgment Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Judge Directives &amp; Ruling Summary</label>
              <textarea
                rows={3}
                required
                value={courtOutcomeText}
                onChange={(e) => setCourtOutcomeText(e.target.value)}
                placeholder="e.g. Defendant counsel absent. Court adjourned hearing to 15th October with thrown away costs of KES 5,000..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Next Court Date (if given)</label>
              <input
                type="date"
                value={nextCourtDateInput}
                onChange={(e) => setNextCourtDateInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEventForOutcome(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Save Court Outcome
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Diarize Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-100">Diarize Court Hearing or Event</h3>

            <div>
              <label className="block text-slate-300 mb-1">Event Title / Purpose</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Plaint Mention for Directions before Hon. Justice Mwangi"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Associated Litigation Matter</label>
              <select
                value={eventMatterId}
                onChange={(e) => setEventMatterId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono"
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.internalReference} - {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEvent['eventType'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              >
                <option value="court">Court Appearance / Hearing</option>
                <option value="client_meeting">Client Consultation / Meeting</option>
                <option value="internal_meeting">Internal Team Meeting</option>
                <option value="medical">Medical Appointment</option>
                <option value="filing">Court Filing / Submission</option>
                <option value="deadline">Statutory Deadline</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Assigned Advocate / Staff</label>
              <select
                value={eventAssignee}
                onChange={(e) => setEventAssignee(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roles.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Location / Courtroom</label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Milimani Commercial Court, Court 4"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Save to Calendar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
