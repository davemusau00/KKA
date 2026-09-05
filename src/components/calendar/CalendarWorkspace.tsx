import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';

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

  const [filterType, setFilterType] = useState<'all' | 'court' | 'client_meeting' | 'internal_meeting' | 'filing' | 'deadline'>('all');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEventForOutcome, setSelectedEventForOutcome] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventMatterId, setEventMatterId] = useState(matters[0]?.id || '');
  const [eventType, setEventType] = useState<CalendarEvent['eventType']>('court');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('09:00');
  const [eventLocation, setEventLocation] = useState('Milimani Law Courts, Nairobi');

  // Outcome Form State
  const [courtStatusChoice, setCourtStatusChoice] = useState<'attended' | 'adjourned' | 'completed'>('attended');
  const [courtOutcomeText, setCourtOutcomeText] = useState('');
  const [nextCourtDateInput, setNextCourtDateInput] = useState('');

  const filteredEvents = calendarEvents
    .filter((e) => (filterType === 'all' ? true : e.eventType === filterType))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    createCalendarEvent({
      matterId: eventMatterId,
      title: eventTitle,
      eventType,
      startAt: `${eventDate}T${eventTime}:00Z`,
      endAt: `${eventDate}T11:00:00Z`,
      location: eventLocation,
      courtStatus: eventType === 'court' ? 'scheduled' : undefined,
      assignedUserId: currentUser.id,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Judiciary Court Diary &amp; Meetings
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              EAT (UTC+3)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Court Calendar &amp; Case Appearances
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'all' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('court')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'court' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Court Only
            </button>
            <button
              onClick={() => setFilterType('client_meeting')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'client_meeting' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Consultations
            </button>
            <button
              onClick={() => setFilterType('filing')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'filing' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Filings
            </button>
            <button
              onClick={() => setFilterType('deadline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'deadline' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deadlines
            </button>
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

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => {
          const matter = matters.find((m) => m.id === evt.matterId);
          const isCourt = evt.eventType === 'court';
          const isTomorrow = new Date(evt.startAt).toDateString() === new Date(Date.now() + 86400000).toDateString();

          return (
            <div
              key={evt.id}
              className={`p-5 rounded-2xl border transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isTomorrow
                  ? 'bg-rose-950/20 border-rose-800/80'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                    isCourt ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {evt.eventType}
                  </span>
                  {evt.courtStatus && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {evt.courtStatus}
                    </span>
                  )}
                  {isTomorrow && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase animate-pulse">
                      Tomorrow 09:00 AM
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
