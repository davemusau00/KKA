import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Play,
  Pause,
  Square,
  X,
  ChevronDown,
  DollarSign,
  Briefcase,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimeEntry } from '../../types';

export const GlobalTimeTracker: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndLogTimer,
    discardTimer,
    matters,
    currentUser,
    setActiveWorkspace,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [activityType, setActivityType] = useState<TimeEntry['activityType']>('Pleadings Drafting');
  const [hourlyRate, setHourlyRate] = useState<number>(currentUser.role === 'senior_partner' ? 25000 : 15000);
  const [timerNotes, setTimerNotes] = useState('');
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00');

  // Compute live elapsed seconds
  useEffect(() => {
    if (!activeTimer) {
      setElapsedDisplay('00:00');
      return;
    }

    const updateDisplay = () => {
      const additional = activeTimer.isRunning
        ? Math.floor((Date.now() - activeTimer.startTimestamp) / 1000)
        : 0;
      const totalSec = activeTimer.accumulatedSeconds + additional;
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = Math.floor(totalSec % 60);

      if (hrs > 0) {
        setElapsedDisplay(
          `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      } else {
        setElapsedDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const activeMatter = activeTimer ? matters.find((m) => m.id === activeTimer.matterId) : null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatterId) return;
    startTimer(selectedMatterId, activityType, hourlyRate);
    setIsModalOpen(false);
  };

  const handleStopAndBill = () => {
    const entry = stopAndLogTimer(timerNotes);
    setIsModalOpen(false);
    setTimerNotes('');
  };

  const currentSeconds = activeTimer
    ? activeTimer.accumulatedSeconds +
      (activeTimer.isRunning ? Math.floor((Date.now() - activeTimer.startTimestamp) / 1000) : 0)
    : 0;
  const currentAccruedFee = activeTimer
    ? Math.max(500, Math.round((currentSeconds / 3600) * activeTimer.hourlyRate))
    : 0;

  return (
    <>
      {/* Docked / Header Button */}
      {activeTimer ? (
        <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/70 rounded-lg px-2.5 py-1 text-xs text-amber-200 shadow-md shadow-amber-950/50">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <span
              className={`w-2 h-2 rounded-full ${
                activeTimer.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono font-bold tracking-wider text-amber-100">{elapsedDisplay}</span>
            <span className="hidden lg:inline text-[11px] text-amber-300/80 max-w-[110px] truncate">
              {activeMatter?.internalReference || 'Active Matter'}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-amber-800/80 pl-1.5 ml-1">
            {activeTimer.isRunning ? (
              <button
                onClick={pauseTimer}
                title="Pause Timer"
                className="p-1 hover:bg-amber-900/60 rounded text-amber-300 hover:text-white"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                title="Resume Timer"
                className="p-1 hover:bg-emerald-900/60 rounded text-emerald-400 hover:text-white"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              title="Stop and Bill to Finance"
              className="p-1 hover:bg-rose-900/60 rounded text-rose-400 hover:text-white"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (matters.length > 0 && !selectedMatterId) {
              setSelectedMatterId(matters[0].id);
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 text-xs px-2.5 py-1.5 rounded-lg transition"
          title="Start billable time tracker"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Track Time</span>
        </button>
      )}

      {/* Timer Details / Start Modal */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-base">
                    {activeTimer ? 'Active Billable Timer' : 'Start Billable Matter Timer'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Precision tracking synced directly to Kenya Advocates Accounts &amp; Finance Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTimer ? (
              /* Active Timer Controls */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2">
                  <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">
                    {activeTimer.isRunning ? 'Timer Running' : 'Timer Paused'} &bull; {activeTimer.activityType}
                  </span>
                  <div className="font-mono text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight">
                    {elapsedDisplay}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span>
                      Rate: <strong className="text-slate-200">KES {activeTimer.hourlyRate.toLocaleString()}/hr</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Accrued: <strong className="text-emerald-400">KES {currentAccruedFee.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
                  <div className="text-slate-400">Target Matter:</div>
                  <div className="font-semibold text-slate-100">
                    {activeMatter?.internalReference} - {activeMatter?.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Advocate: {currentUser.fullName} ({currentUser.jobTitle})
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Activity Description / Work Notes (Appears on Client Fee Note)
                  </label>
                  <textarea
                    rows={2}
                    value={timerNotes}
                    onChange={(e) => setTimerNotes(e.target.value)}
                    placeholder="e.g. Settled plaint, drafted affidavit of service, reviewed doctor's report..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={discardTimer}
                    className="text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-950/40 w-full sm:w-auto"
                  >
                    Discard Session
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {activeTimer.isRunning ? (
                      <button
                        type="button"
                        onClick={pauseTimer}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
                      >
                        <Pause className="w-4 h-4 text-amber-400" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resumeTimer}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
                      >
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleStopAndBill}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-amber-900/40 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Stop &amp; Bill (KES {currentAccruedFee.toLocaleString()})</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Start New Timer Form */
              <form onSubmit={handleStart} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Select Active Matter <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={selectedMatterId}
                    onChange={(e) => setSelectedMatterId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Matter File --</option>
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.internalReference} &bull; {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Billable Activity
                    </label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                    >
                      <option value="Court Attendance">Court Attendance (Hearing / Mention)</option>
                      <option value="Pleadings Drafting">Pleadings Drafting &amp; Settlement</option>
                      <option value="Client Consultation">Client Consultation &amp; Witness Prep</option>
                      <option value="Document Review">Document Review &amp; Evidence Audit</option>
                      <option value="Legal Research">Legal Research &amp; Precedent Brief</option>
                      <option value="Negotiation">Negotiation &amp; Adjuster Conference</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hourly Rate (KES)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
                  Billable rates align with the <strong className="text-slate-300">Advocates Remuneration Order (ARO)</strong>. Stopping the timer automatically logs an unbilled fee ledger record in Finance.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-900/40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Timer Now</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
