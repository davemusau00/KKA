import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Shield,
  Lock,
  FileUp,
  Link2,
  ArrowRight,
  X,
  User,
  Check,
  RefreshCw,
  Briefcase,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  Info,
  CalendarCheck,
  Gavel,
  Clock3,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent, CalendarEditPolicy, CourtEventStatus } from '../../types';

type CalendarViewMode = 'agenda' | '3day' | 'day' | 'week' | 'month';

export const CalendarWorkspace: React.FC = () => {
  const {
    calendarEvents,
    matters,
    users,
    currentUser,
    tasks,
    documents,
    createCalendarEvent,
    recordCourtOutcome,
    rescheduleCalendarEvent,
    linkDocumentToCalendarEvent,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // View mode state - Defaults to 'agenda' on mobile, 'month' on desktop
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'month';
  });

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'court' | 'client_meeting' | 'internal_meeting' | 'medical' | 'filing' | 'deadline'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [conflictsOnly, setConflictsOnly] = useState<boolean>(false);

  // Modal / Drawer state
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [selectedEventForOutcome, setSelectedEventForOutcome] = useState<CalendarEvent | null>(null);
  const [selectedEventForReschedule, setSelectedEventForReschedule] = useState<CalendarEvent | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(false);
  const [showLinkDocModal, setShowLinkDocModal] = useState<boolean>(false);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventMatterId, setEventMatterId] = useState(matters[0]?.id || '');
  const [eventType, setEventType] = useState<CalendarEvent['eventType']>('court');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('09:00');
  const [eventDuration, setEventDuration] = useState('2'); // hours
  const [eventLocation, setEventLocation] = useState('Milimani Law Courts, Nairobi');
  const [eventAssignee, setEventAssignee] = useState(currentUser.id);
  const [eventEditPolicy, setEventEditPolicy] = useState<CalendarEditPolicy>('reason_required');
  const [eventNotes, setEventNotes] = useState('');

  // Outcome Form State
  const [courtStatusChoice, setCourtStatusChoice] = useState<'attended' | 'adjourned' | 'completed'>('attended');
  const [courtOutcomeText, setCourtOutcomeText] = useState('');
  const [nextCourtDateInput, setNextCourtDateInput] = useState('');
  const [directionsIssued, setDirectionsIssued] = useState(false);
  const [filingDeadlineInput, setFilingDeadlineInput] = useState('');
  const [filingTitleInput, setFilingTitleInput] = useState('');
  const [generatePrepTask, setGeneratePrepTask] = useState(true);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSource, setRescheduleSource] = useState<'court_order' | 'consent' | 'administrative' | 'adjourned' | 'client_request'>('adjourned');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Document Linking Form State
  const [selectedDocToLink, setSelectedDocToLink] = useState('');

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
      .filter((e) => (!conflictsOnly ? true : conflictEventIds.has(e.id)))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [calendarEvents, filterType, filterUser, conflictsOnly, conflictEventIds]);

  // Unscheduled tasks suitable for calendar scheduling
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed');
  }, [tasks]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === '3day') d.setDate(d.getDate() - 3);
    else if (viewMode === 'day' || viewMode === 'agenda') d.setDate(d.getDate() - 1);
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === '3day') d.setDate(d.getDate() + 3);
    else if (viewMode === 'day' || viewMode === 'agenda') d.setDate(d.getDate() + 1);
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Create event submission
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const startIso = `${eventDate}T${eventTime}:00Z`;
    const durHours = parseInt(eventDuration, 10) || 1;
    const endHour = String(Math.min(23, parseInt(eventTime.split(':')[0], 10) + durHours)).padStart(2, '0');
    const endIso = `${eventDate}T${endHour}:${eventTime.split(':')[1] || '00'}:00Z`;

    const persisted = await createCalendarEvent({
      matterId: eventMatterId,
      title: eventTitle,
      eventType,
      startAt: startIso,
      endAt: endIso,
      location: eventLocation,
      courtStatus: eventType === 'court' ? 'scheduled' : undefined,
      assignedUserId: eventAssignee,
      organizerId: currentUser.id,
      editPolicy: eventEditPolicy,
      notes: eventNotes || undefined,
    });

    if (!persisted) return;

    setShowAddEventModal(false);
    setEventTitle('');
    setEventNotes('');
  };

  // Save Outcome with Workflow Automation
  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForOutcome) return;

    recordCourtOutcome(
      selectedEventForOutcome.id,
      courtStatusChoice,
      courtOutcomeText,
      nextCourtDateInput || undefined,
      directionsIssued && filingDeadlineInput
        ? {
            filingDeadlineDate: filingDeadlineInput,
            filingTitle: filingTitleInput || `Court Directions Filing for ${selectedEventForOutcome.title}`,
            draftingTaskTitle: generatePrepTask
              ? `Draft Pleadings / Submissions (${selectedEventForOutcome.title})`
              : undefined,
          }
        : undefined
    );

    setSelectedEventForOutcome(null);
    setCourtOutcomeText('');
    setNextCourtDateInput('');
    setDirectionsIssued(false);
    setFilingDeadlineInput('');
    setFilingTitleInput('');
  };

  // Save Reschedule
  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForReschedule) return;
    setRescheduleError(null);

    const startIso = `${rescheduleDate}T${rescheduleTime}:00Z`;
    const endIso = `${rescheduleDate}T${String(parseInt(rescheduleTime.split(':')[0], 10) + 2).padStart(2, '0')}:00:00Z`;

    const res = await rescheduleCalendarEvent(
      selectedEventForReschedule.id,
      startIso,
      endIso,
      rescheduleReason,
      rescheduleSource
    );

    if (!res.success) {
      setRescheduleError(res.error || 'Failed to reschedule event');
      return;
    }

    setSelectedEventForReschedule(null);
    setRescheduleReason('');
    setRescheduleError(null);
  };

  // Link Document handler
  const handleLinkDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForDetail || !selectedDocToLink) return;
    await linkDocumentToCalendarEvent(selectedEventForDetail.id, selectedDocToLink);
    setShowLinkDocModal(false);
    setSelectedDocToLink('');
  };

  // 14-day date strip centered around currentDate
  const dateStripDays = useMemo(() => {
    const days: Date[] = [];
    const base = new Date(currentDate);
    base.setDate(base.getDate() - 4); // Show 4 days in past, 9 in future
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // 3-Day View days
  const threeDays = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + offset);
      return d;
    });
  }, [currentDate]);

  // Month grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Week days helpers (for desktop 7-col week view)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Selected date ISO string prefix YYYY-MM-DD
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.startAt.startsWith(selectedDateStr));
  }, [filteredEvents, selectedDateStr]);

  // Category Icon & Color Helper
  const getEventBadgeStyles = (type: CalendarEvent['eventType'], hasConflict?: boolean) => {
    if (hasConflict) {
      return {
        bg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
        icon: <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
        label: 'Conflict',
      };
    }
    switch (type) {
      case 'court':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80',
          icon: <Gavel className="w-3 h-3 text-amber-700 dark:text-amber-400" />,
          label: 'Court Appearance',
        };
      case 'deadline':
      case 'filing':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800',
          icon: <Clock3 className="w-3 h-3 text-rose-700 dark:text-rose-400" />,
          label: type === 'deadline' ? 'Deadline' : 'Filing',
        };
      case 'client_meeting':
        return {
          bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800',
          icon: <Users className="w-3 h-3 text-blue-700 dark:text-blue-400" />,
          label: 'Client Consultation',
        };
      case 'medical':
        return {
          bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800',
          icon: <ActivityIcon className="w-3 h-3 text-purple-700 dark:text-purple-400" />,
          label: 'Medical Assessment',
        };
      case 'internal_meeting':
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
          icon: <CalendarIcon className="w-3 h-3 text-slate-600 dark:text-slate-400" />,
          label: 'Internal Meeting',
        };
    }
  };

  // Helper for medical icon
  function ActivityIcon(props: { className?: string }) {
    return (
      <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }

  // Open reschedule dialog
  const openRescheduleModal = (event: CalendarEvent) => {
    setSelectedEventForReschedule(event);
    setRescheduleDate(event.startAt.split('T')[0] || new Date().toISOString().split('T')[0]);
    setRescheduleTime(event.startAt.split('T')[1]?.slice(0, 5) || '09:00');
    setRescheduleReason('');
    setRescheduleError(null);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full text-xs transition-colors">
      {/* ─── 1. TOP HEADER & TEMPORAL COMMAND CENTRE ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Judiciary Court Diary &amp; Temporal Command Centre
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              EAT (UTC+3)
            </span>
            {conflictEventIds.size > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {conflictEventIds.size} Conflict{conflictEventIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
            Court Calendar &amp; Case Appearances
          </h1>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Responsive View Switcher */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex items-center gap-0.5">
            {/* Mobile View Switcher */}
            {isMobile ? (
              (['agenda', '3day', 'day', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition ${
                    viewMode === mode
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode === '3day' ? '3-Day' : mode}
                </button>
              ))
            ) : (
              /* Desktop View Switcher */
              (['month', 'week', '3day', 'day', 'agenda'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition ${
                    viewMode === mode
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode === '3day' ? '3-Day' : mode}
                </button>
              ))
            )}
          </div>

          {/* Unscheduled Tasks Toggle */}
          <button
            onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showUnscheduledDrawer
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Unscheduled Litigation Tasks"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
              {unscheduledTasks.length}
            </span>
          </button>

          {/* Diarize Event Button */}
          <button
            onClick={() => setShowAddEventModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Diarize</span>
          </button>
        </div>
      </div>

      {/* ─── 2. NAVIGATION & FILTER BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Previous Period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Next Period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 ml-2">
            {currentDate.toLocaleDateString('en-KE', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' ? { day: 'numeric', weekday: 'short' } : {}),
            })}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="court">⚖ Court Appearances</option>
            <option value="deadline">⏰ Statutory &amp; Court Deadlines</option>
            <option value="client_meeting">👥 Client Consultations</option>
            <option value="medical">🏥 Medical Appointments</option>
            <option value="filing">📁 Court Filings</option>
            <option value="internal_meeting">Internal Meetings</option>
          </select>

          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-300 text-xs focus:outline-none max-w-[140px] sm:max-w-none"
          >
            <option value="all">All Staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>

          {conflictEventIds.size > 0 && (
            <button
              onClick={() => setConflictsOnly(!conflictsOnly)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 border transition ${
                conflictsOnly
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Conflicts ({conflictEventIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 3. HORIZONTAL DATE STRIP (MOBILE / TABLET & AGENDA CONTEXT) ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-2 mb-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Select Day to Focus Schedule &amp; Agenda</span>
          </span>
          <span className="text-[10px] font-mono">
            {selectedDate.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Scrollable Date Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {dateStripDays.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = selectedDate.toDateString() === day.toDateString();
            const isToday = new Date().toDateString() === day.toDateString();

            const dayEvts = filteredEvents.filter((e) => e.startAt.startsWith(dateStr));
            const hasCourt = dayEvts.some((e) => e.eventType === 'court');
            const hasDeadline = dayEvts.some((e) => e.eventType === 'deadline');
            const hasConflict = dayEvts.some((e) => conflictEventIds.has(e.id));

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(day);
                  setCurrentDate(day);
                }}
                className={`flex-shrink-0 w-14 sm:w-16 py-2 px-1 rounded-xl flex flex-col items-center justify-between border transition text-center ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md font-bold'
                    : isToday
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700/80 text-amber-900 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {day.toLocaleDateString('en-KE', { weekday: 'short' })}
                </span>
                <span className="text-sm sm:text-base font-extrabold my-0.5 leading-none">
                  {day.getDate()}
                </span>

                {/* Indicators Row */}
                <div className="flex items-center gap-1 h-3 mt-0.5">
                  {hasCourt && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`}
                      title="Court Appearance"
                    />
                  )}
                  {hasDeadline && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`}
                      title="Statutory / Court Deadline"
                    />
                  )}
                  {!hasCourt && !hasDeadline && dayEvts.length > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`}
                      title="Event"
                    />
                  )}
                  {hasConflict && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-200' : 'bg-rose-600'}`}
                      title="Schedule Conflict"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. VIEW CONTENT AREA ─── */}

      {/* 4A. AGENDA / TODAY VIEW (MOBILE DEFAULT) */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Agenda for {selectedDate.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {selectedDayEvents.length} Item{selectedDayEvents.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {selectedDayEvents.length === 0 && (
              <button
                onClick={() => {
                  setEventDate(selectedDateStr);
                  setShowAddEventModal(true);
                }}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Diarize on this day
              </button>
            )}
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDayEvents.map((evt) => {
                const matter = matters.find((m) => m.id === evt.matterId);
                const assignee = users.find((u) => u.id === evt.assignedUserId);
                const hasConflict = conflictEventIds.has(evt.id);
                const badge = getEventBadgeStyles(evt.eventType, hasConflict);
                const isCourt = evt.eventType === 'court';
                const isLocked = evt.editPolicy === 'locked' || evt.isStatutoryLocked;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForDetail(evt)}
                    className={`p-4 sm:p-5 rounded-2xl border transition shadow-sm cursor-pointer hover:shadow-md flex flex-col gap-3 ${
                      hasConflict
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : isCourt
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700/80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Type, Time, Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {evt.endAt && ` - ${new Date(evt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </span>

                        {isLocked && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-rose-500" /> Locked Order
                          </span>
                        )}

                        {evt.courtStatus && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {evt.courtStatus}
                          </span>
                        )}
                      </div>

                      {hasConflict && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Schedule Overlap
                        </span>
                      )}
                    </div>

                    {/* Middle Row: Title & Matter Context */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {evt.title}
                      </h3>
                      {matter && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMatterId(matter.id);
                              setActiveWorkspace('matters');
                            }}
                            className="text-amber-700 dark:text-amber-400 hover:underline font-mono text-xs font-semibold flex items-center gap-1"
                          >
                            <Scale className="w-3 h-3" />
                            <span>{matter.internalReference}</span>
                          </button>
                          <span className="text-slate-400 dark:text-slate-600">&bull;</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs">
                            {matter.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Location, Assignee & Quick Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex-wrap">
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        {evt.location && (
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{evt.location}</span>
                          </span>
                        )}
                        {assignee && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{assignee.fullName}</span>
                          </span>
                        )}
                        {evt.requiredDocumentTypeIds && evt.requiredDocumentTypeIds.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📄 {evt.linkedDocumentIds?.length || 0}/{evt.requiredDocumentTypeIds.length} Docs
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCourt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventForOutcome(evt);
                              setCourtOutcomeText(evt.courtOutcome || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1"
                          >
                            <Gavel className="w-3 h-3" />
                            <span>Record Outcome</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventForDetail(evt);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 opacity-60" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No events scheduled for this day
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use the date strip above to view other days or schedule an appearance.
                </p>
              </div>
              <button
                onClick={() => {
                  setEventDate(selectedDateStr);
                  setShowAddEventModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Diarize Hearing / Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4B. MOBILE 3-DAY VIEW (HIGH-LEGIBILITY COLUMN TIMELINE) */}
      {viewMode === '3day' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-950/60 divide-x divide-slate-200 dark:divide-slate-800">
            {threeDays.map((d) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const isSelected = d.toDateString() === selectedDate.toDateString();
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={`py-3 px-2 cursor-pointer transition ${
                    isSelected ? 'bg-amber-50 dark:bg-amber-950/30' : ''
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    {d.toLocaleDateString('en-KE', { weekday: 'short' })}
                  </div>
                  <div
                    className={`inline-block w-7 h-7 rounded-full leading-7 text-xs font-bold mt-0.5 ${
                      isToday
                        ? 'bg-amber-600 text-white shadow'
                        : isSelected
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3 Columns Content */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 min-h-[380px]">
            {threeDays.map((d) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayEvts = filteredEvents.filter((e) => e.startAt.startsWith(dateStr));

              return (
                <div key={dateStr} className="p-2 space-y-2 bg-white dark:bg-slate-900">
                  {dayEvts.map((evt) => {
                    const hasConflict = conflictEventIds.has(evt.id);
                    const badge = getEventBadgeStyles(evt.eventType, hasConflict);

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventForDetail(evt)}
                        className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer hover:shadow-md transition ${
                          hasConflict
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                            : evt.eventType === 'court'
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 hover:border-amber-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {badge.icon}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                          {evt.title}
                        </div>
                        {evt.location && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            📍 {evt.location}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {dayEvts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600 text-[11px] text-center">
                      <span>No events</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4C. DAY VIEW (HOURLY / CHRONOLOGICAL FOCUS) */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span>Schedule for {currentDate.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
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
                const badge = getEventBadgeStyles(evt.eventType, hasConflict);

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForDetail(evt)}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-3 cursor-pointer hover:shadow-md transition ${
                      hasConflict
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-bold">
                          {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {evt.endAt && ` - ${new Date(evt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {hasConflict && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overlapping Appearance
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{evt.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                        {evt.location && <span>📍 {evt.location}</span>}
                        {assignee && <span>👤 Advocate: {assignee.fullName}</span>}
                        {matter && <span className="font-mono text-amber-700 dark:text-amber-400">⚖️ {matter.internalReference}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {evt.eventType === 'court' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventForOutcome(evt);
                            setCourtOutcomeText(evt.courtOutcome || '');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Record Outcome
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForDetail(evt);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}

            {filteredEvents.filter((e) => e.startAt.startsWith(currentDate.toISOString().split('T')[0])).length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No events scheduled for this day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4D. MONTH VIEW (DENSITY SCANNING ON MOBILE & FULL GRID ON DESKTOP) */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center font-bold text-slate-500 dark:text-slate-400 py-2.5 bg-slate-50 dark:bg-slate-950/50 uppercase tracking-wider text-[10px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              {/* Blank prefix cells */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[60px] sm:min-h-[100px] p-1.5 bg-slate-50/50 dark:bg-slate-950/20" />
              ))}

              {/* Days of current month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = filteredEvents.filter((e) => e.startAt.startsWith(dateStr));
                const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();
                const isSelected = selectedDate.toDateString() === new Date(year, month, dayNum).toDateString();

                const hasCourt = dayEvents.some((e) => e.eventType === 'court');
                const hasDeadline = dayEvents.some((e) => e.eventType === 'deadline');

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDate(new Date(year, month, dayNum))}
                    className={`min-h-[60px] sm:min-h-[105px] p-1.5 sm:p-2 transition flex flex-col cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 ring-2 ring-inset ring-amber-500'
                        : isToday
                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isToday
                            ? 'bg-amber-600 text-white'
                            : isSelected
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Mobile: Density indicator dots */}
                    <div className="sm:hidden flex items-center gap-1 flex-wrap mt-auto">
                      {hasCourt && <span className="w-2 h-2 rounded-full bg-amber-500" title="Court Hearing" />}
                      {hasDeadline && <span className="w-2 h-2 rounded-full bg-rose-500" title="Deadline" />}
                      {!hasCourt && !hasDeadline && dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Meeting" />
                      )}
                    </div>

                    {/* Desktop: Mini Event Cards */}
                    <div className="hidden sm:block space-y-1 overflow-y-auto max-h-[75px]">
                      {dayEvents.map((evt) => {
                        const hasConflict = conflictEventIds.has(evt.id);
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventForDetail(evt);
                            }}
                            className={`p-1 rounded text-[10px] font-medium truncate cursor-pointer transition border ${
                              hasConflict
                                ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                                : evt.eventType === 'court'
                                ? 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-200/80'
                                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
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

          {/* On Mobile or Desktop: Show the Selected Day's Agenda beneath the Month Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Selected: {selectedDate.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {selectedDayEvents.length} Item{selectedDayEvents.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <button
                onClick={() => {
                  setEventDate(selectedDateStr);
                  setShowAddEventModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Diarize</span>
              </button>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map((evt) => {
                  const matter = matters.find((m) => m.id === evt.matterId);
                  const hasConflict = conflictEventIds.has(evt.id);
                  const badge = getEventBadgeStyles(evt.eventType, hasConflict);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventForDetail(evt)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-amber-400 dark:hover:border-amber-700/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {hasConflict && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Conflict
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{evt.title}</div>
                        {matter && (
                          <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                            ⚖ {matter.internalReference} &bull; {matter.title}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {evt.eventType === 'court' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventForOutcome(evt);
                              setCourtOutcomeText(evt.courtOutcome || '');
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                          >
                            Outcome
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventForDetail(evt);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                No events on this day. Tap another date on the calendar above.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4E. DESKTOP 7-COLUMN WEEK VIEW (ONLY FOR WIDE VIEWPORTS) */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center py-2.5 bg-slate-50 dark:bg-slate-950/50">
            {weekDays.map((d) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={d.toISOString()} className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    {d.toLocaleDateString('en-KE', { weekday: 'short' })}
                  </div>
                  <div
                    className={`inline-block w-7 h-7 rounded-full leading-7 text-xs font-bold ${
                      isToday ? 'bg-amber-600 text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 min-h-[400px] divide-x divide-slate-100 dark:divide-slate-800">
            {weekDays.map((d) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayEvents = filteredEvents.filter((e) => e.startAt.startsWith(dateStr));

              return (
                <div key={dateStr} className="p-2 space-y-2">
                  {dayEvents.map((evt) => {
                    const hasConflict = conflictEventIds.has(evt.id);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventForDetail(evt)}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer hover:shadow-md transition ${
                          hasConflict
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                            : evt.eventType === 'court'
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {hasConflict && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Conflict
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-slate-200 leading-tight">
                          {evt.title}
                        </div>
                        {evt.location && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {evt.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 5. INTERACTIVE EVENT BOTTOM SHEET (MOBILE) & SIDE DRAWER (DESKTOP) ─── */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          {/* Backdrop click dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setSelectedEventForDetail(null)}
          />

          {/* Sheet/Drawer Panel */}
          <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 border-t sm:border-l sm:border-t-0 border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-none p-5 sm:p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[85vh] sm:max-h-full">
            {/* Mobile Drag Handle */}
            <div className="sm:hidden flex justify-center -mt-2 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getEventBadgeStyles(selectedEventForDetail.eventType).bg}`}>
                    {getEventBadgeStyles(selectedEventForDetail.eventType).label}
                  </span>
                  {selectedEventForDetail.courtStatus && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedEventForDetail.courtStatus}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedEventForDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legal Edit Policy Banner */}
            {selectedEventForDetail.editPolicy === 'locked' || selectedEventForDetail.isStatutoryLocked ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-900 dark:text-rose-200">
                <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs">🔒 Court-Ordered / Statutory Limitation Date</span>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                    This date is protected by legal-source authority (Court Order / CPR). It cannot be moved without an amended court direction or registry order.
                  </p>
                </div>
              </div>
            ) : selectedEventForDetail.editPolicy === 'reason_required' ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-amber-900 dark:text-amber-200">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs">🛡️ Judicial Appearance Governance</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Court hearing dates require official justification (adjourned by court, consent, or administrative order) to reschedule.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Schedule & Venue Section */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {new Date(selectedEventForDetail.startAt).toLocaleDateString('en-KE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {new Date(selectedEventForDetail.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {selectedEventForDetail.endAt && ` &ndash; ${new Date(selectedEventForDetail.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    {' '}(East Africa Time)
                  </div>
                </div>
              </div>

              {selectedEventForDetail.location && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Courtroom / Venue</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">{selectedEventForDetail.location}</div>
                  </div>
                </div>
              )}

              {selectedEventForDetail.virtualMeetingUrl && (
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Virtual Court / Conference Link</div>
                    <a
                      href={selectedEventForDetail.virtualMeetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate block max-w-xs"
                    >
                      {selectedEventForDetail.virtualMeetingUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Matter Association */}
            {selectedEventForDetail.matterId && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Associated Matter &amp; Case File
                </span>
                {(() => {
                  const m = matters.find((item) => item.id === selectedEventForDetail.matterId);
                  if (!m) return <p className="text-slate-400">Matter record not found</p>;
                  return (
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{m.title}</div>
                      <div className="font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        {m.internalReference} &bull; Stage {m.currentStageId}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMatterId(m.id);
                          setActiveWorkspace('matters');
                          setSelectedEventForDetail(null);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        <span>Open Complete Matter File</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Required Documents Checklist */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Required Documents &amp; Bundles
                </span>
                <button
                  onClick={() => setShowLinkDocModal(true)}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Link Document
                </button>
              </div>

              {selectedEventForDetail.requiredDocumentTypeIds && selectedEventForDetail.requiredDocumentTypeIds.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedEventForDetail.requiredDocumentTypeIds.map((docType) => {
                    const isLinked = selectedEventForDetail.linkedDocumentIds && selectedEventForDetail.linkedDocumentIds.length > 0;
                    return (
                      <div
                        key={docType}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{docType}</span>
                        {isLinked ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Attached
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Required
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No specific document checklist declared for this appearance.
                </p>
              )}
            </div>

            {/* Recorded Court Outcome (if any) */}
            {selectedEventForDetail.courtOutcome && (
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  Recorded Court Directions / Ruling
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedEventForDetail.courtOutcome}
                </p>
                {selectedEventForDetail.nextCourtDate && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 font-mono font-bold">
                    Next Court Date: {selectedEventForDetail.nextCourtDate}
                  </div>
                )}
              </div>
            )}

            {/* Reschedule / Audit History */}
            {selectedEventForDetail.revisions && selectedEventForDetail.revisions.length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Reschedule Audit History
                </span>
                <div className="space-y-2">
                  {selectedEventForDetail.revisions.map((rev) => (
                    <div key={rev.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Source: {rev.source}</span>
                        <span>{new Date(rev.changedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        Reason: {rev.reason}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Moved from {new Date(rev.oldStart).toLocaleDateString()} to {new Date(rev.newStart).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 flex-wrap">
              {selectedEventForDetail.eventType === 'court' && (
                <button
                  onClick={() => {
                    setSelectedEventForOutcome(selectedEventForDetail);
                    setCourtOutcomeText(selectedEventForDetail.courtOutcome || '');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Gavel className="w-4 h-4" />
                  <span>Record Outcome</span>
                </button>
              )}

              {selectedEventForDetail.editPolicy !== 'locked' && !selectedEventForDetail.isStatutoryLocked && (
                <button
                  onClick={() => openRescheduleModal(selectedEventForDetail)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>
              )}

              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. UNSCHEDULED TASKS WORKLOAD DRAWER ─── */}
      {showUnscheduledDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-0" onClick={() => setShowUnscheduledDrawer(false)} />

          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Unscheduled Litigation Tasks</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a task to diarize directly into your court or firm calendar.
                </p>
              </div>
              <button
                onClick={() => setShowUnscheduledDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {unscheduledTasks.map((t) => {
                const m = matters.find((item) => item.id === t.matterId);
                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {t.priority} priority
                      </span>
                      {t.dueAt && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Due: {t.dueAt}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{t.title}</div>
                    {m && (
                      <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                        ⚖ {m.internalReference}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setEventTitle(t.title);
                        if (t.matterId) setEventMatterId(t.matterId);
                        setEventType('internal_meeting');
                        setShowAddEventModal(true);
                        setShowUnscheduledDrawer(false);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Schedule onto Calendar
                    </button>
                  </div>
                );
              })}

              {unscheduledTasks.length === 0 && (
                <p className="text-center text-slate-500 text-xs py-8">
                  No pending unscheduled tasks.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. RECORD COURT OUTCOME & AUTOMATION WIZARD ─── */}
      {selectedEventForOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveOutcome}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Record Court Outcome &amp; Auto-Workflow</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEventForOutcome(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Appearance Outcome Status
              </label>
              <select
                value={courtStatusChoice}
                onChange={(e) => setCourtStatusChoice(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-200 text-xs outline-none"
              >
                <option value="attended">Attended &bull; Proceedings / Hearing Held</option>
                <option value="adjourned">Adjourned by Court or Adverse Party</option>
                <option value="completed">Concluded / Final Judgment Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Judge Directives, Orders &amp; Ruling Summary *
              </label>
              <textarea
                rows={3}
                required
                value={courtOutcomeText}
                onChange={(e) => setCourtOutcomeText(e.target.value)}
                placeholder="e.g. Defendant counsel granted 14 days to file replying affidavit. Mention on 28th October for pre-trial directions..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 text-xs outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Next Court Date (automatically diarizes new hearing event)
              </label>
              <input
                type="date"
                value={nextCourtDateInput}
                onChange={(e) => setNextCourtDateInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none font-mono"
              />
            </div>

            {/* Automated Workflow: Filing Directions & Preparation Task */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directionsIssued}
                  onChange={(e) => setDirectionsIssued(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Court Ordered Filing Directions (Auto-Generate Deadline &amp; Task)
                </span>
              </label>

              {directionsIssued && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Filing Deadline Date *
                    </label>
                    <input
                      type="date"
                      required={directionsIssued}
                      value={filingDeadlineInput}
                      onChange={(e) => setFilingDeadlineInput(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Directions Filing Title
                    </label>
                    <input
                      type="text"
                      value={filingTitleInput}
                      onChange={(e) => setFilingTitleInput(e.target.value)}
                      placeholder="e.g. File and serve Supplementary Affidavit & Submissions"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={generatePrepTask}
                      onChange={(e) => setGeneratePrepTask(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Generate internal drafting task for advocate (due 3 days before filing)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEventForOutcome(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition"
              >
                Save &amp; Propagate Workflow
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── 8. RESCHEDULE MODAL (WITH LEGAL POLICY GOVERNANCE) ─── */}
      {selectedEventForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveReschedule}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Reschedule Appearance / Event</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEventForReschedule(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  New Date *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  New Time *
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Legal Reschedule Authority / Source *
              </label>
              <select
                value={rescheduleSource}
                onChange={(e) => setRescheduleSource(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-200 text-xs outline-none"
              >
                <option value="adjourned">Adjourned by Court (Directions)</option>
                <option value="court_order">Formal Court Order</option>
                <option value="consent">Consent of Adverse Parties</option>
                <option value="client_request">Client Convenience / Request</option>
                <option value="administrative">Administrative Registry Rescheduling</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Mandatory Audit Reason *
              </label>
              <textarea
                rows={2}
                required
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Lead counsel on trial before High Court Nakuru; adjourned by consent..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEventForReschedule(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── 9. DIARIZE EVENT MODAL ─── */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateEvent}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Diarize Court Appearance or Event</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Event Title / Appearance Purpose *
              </label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Plaint Mention for Directions before Hon. Justice Mwangi"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Associated Matter
                </label>
                <select
                  value={eventMatterId}
                  onChange={(e) => setEventMatterId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none font-mono"
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.internalReference} - {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Event Category
                </label>
                <select
                  value={eventType}
                  onChange={(e) => {
                    const t = e.target.value as CalendarEvent['eventType'];
                    setEventType(t);
                    if (t === 'court') setEventEditPolicy('reason_required');
                    else if (t === 'deadline') setEventEditPolicy('locked');
                    else setEventEditPolicy('free');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none"
                >
                  <option value="court">⚖ Court Hearing / Mention</option>
                  <option value="deadline">⏰ Statutory / Court Deadline</option>
                  <option value="client_meeting">👥 Client Consultation</option>
                  <option value="medical">🏥 Medical Examination</option>
                  <option value="filing">📁 Court Filing / Submission</option>
                  <option value="internal_meeting">Internal Meeting</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assigned Advocate / Staff
                </label>
                <select
                  value={eventAssignee}
                  onChange={(e) => setEventAssignee(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Legal Edit Policy
                </label>
                <select
                  value={eventEditPolicy}
                  onChange={(e) => setEventEditPolicy(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none"
                >
                  <option value="reason_required">Reason Required (Court Appearance)</option>
                  <option value="locked">Locked (Statutory / Court-Ordered)</option>
                  <option value="confirm">Confirm Required (Client Meeting)</option>
                  <option value="free">Free Edit (Internal Tasks / Meetings)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Location / Courtroom
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Milimani Commercial Court, Court 4"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition"
              >
                Save to Calendar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── 10. LINK DOCUMENT MODAL ─── */}
      {showLinkDocModal && selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleLinkDocument}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Link Matter Document to Event</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkDocModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Select Document from Matter
              </label>
              <select
                value={selectedDocToLink}
                onChange={(e) => setSelectedDocToLink(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs outline-none"
              >
                <option value="">-- Choose document --</option>
                {documents
                  .filter((d) => !selectedEventForDetail.matterId || d.matterId === selectedEventForDetail.matterId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.category})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkDocModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
              >
                Attach Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
