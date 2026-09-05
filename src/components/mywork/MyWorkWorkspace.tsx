import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  FileCheck,
  Calendar,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Filter,
  User,
  ArrowRight,
  Hourglass,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

export const MyWorkWorkspace: React.FC = () => {
  const {
    currentUser,
    tasks,
    matters,
    calendarEvents,
    documents,
    setSelectedMatterId,
    setActiveWorkspace,
    completeTask,
    updateTask,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'approvals' | 'hearings'>('all');

  // Filter tasks assigned to current user
  const myTasks = tasks.filter(
    (t) => t.assignedToUserId === currentUser.id || t.assignedToUserId === 'all'
  );

  const pendingTasks = myTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');

  // Overdue tasks
  const overdueTasks = pendingTasks.filter((t) => new Date(t.dueAt) < new Date());

  // My upcoming hearings
  const myEvents = calendarEvents.filter(
    (e) =>
      e.assignedAdvocateId === currentUser.id ||
      e.assignedClerkId === currentUser.id ||
      e.matterId
  );

  // Pending document reviews
  const pendingDocs = documents.filter((d) => d.status === 'review');

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md shadow-amber-950/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-amber-500 font-bold uppercase text-xs tracking-wider">
                Personal Operational Queue
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                {currentUser.jobTitle}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-0.5">
              My Active Work &amp; Action Queue
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Tasks, matter stage approvals, and court diary commitments assigned directly to you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-slate-400 font-mono">Pending Tasks</div>
            <div className="text-xl font-bold font-mono text-amber-400">{pendingTasks.length}</div>
          </div>
          {overdueTasks.length > 0 && (
            <div className="bg-rose-950/80 border border-rose-800 px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-rose-300 font-mono">Overdue</div>
              <div className="text-xl font-bold font-mono text-rose-400">{overdueTasks.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filterType === 'all'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          All Items ({pendingTasks.length + pendingDocs.length + myEvents.length})
        </button>

        <button
          onClick={() => setFilterType('tasks')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filterType === 'tasks'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Tasks ({pendingTasks.length})
        </button>

        <button
          onClick={() => setFilterType('approvals')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filterType === 'approvals'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Reviews &amp; Approvals ({pendingDocs.length})
        </button>

        <button
          onClick={() => setFilterType('hearings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filterType === 'hearings'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          My Diary ({myEvents.length})
        </button>
      </div>

      {/* Task List */}
      {(filterType === 'all' || filterType === 'tasks') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-slate-100 text-base">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>Assigned Action Items</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {pendingTasks.length} active / {completedTasks.length} done
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No outstanding tasks assigned to you. All clear!
              </div>
            ) : (
              pendingTasks.map((t) => {
                const matter = matters.find((m) => m.id === t.matterId);
                const isOverdue = new Date(t.dueAt) < new Date();

                return (
                  <div
                    key={t.id}
                    className="p-4 hover:bg-slate-850 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                            t.priority === 'urgent'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : t.priority === 'high'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>

                        <span
                          className={`text-xs font-mono flex items-center gap-1 ${
                            isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          Due: {new Date(t.dueAt).toLocaleDateString()}
                          {isOverdue && ' (OVERDUE)'}
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-100 text-sm">{t.title}</h4>
                      {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
                      {matter && (
                        <div className="text-xs text-amber-500/90 font-mono">
                          {matter.matterNumber} &bull; {matter.title}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {matter && (
                        <button
                          onClick={() => {
                            setSelectedMatterId(matter.id);
                            setActiveWorkspace('matters');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                        >
                          Open Matter
                        </button>
                      )}

                      <button
                        onClick={() => completeTask(t.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Review Queue */}
      {(filterType === 'all' || filterType === 'approvals') && pendingDocs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-slate-100 text-base">
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>Pending Document Review &amp; Sign-off</span>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              {pendingDocs.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {documents
              .filter((d) => d.status === 'review')
              .map((doc) => {
                const matter = matters.find((m) => m.id === doc.matterId);
                return (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-slate-850 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{doc.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Category: {doc.category} &bull; v{doc.currentVersion}
                      </div>
                      {matter && (
                        <div className="text-xs text-amber-500/90 font-mono mt-0.5">
                          {matter.matterNumber}: {matter.title}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveWorkspace('documents')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Review in Vault
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Diary Hearings */}
      {(filterType === 'all' || filterType === 'hearings') && myEvents.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-slate-100 text-base">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Upcoming Court Appearances &amp; Commitments</span>
            </div>
            <span className="text-xs font-mono text-slate-400">Firm Diary</span>
          </div>

          <div className="divide-y divide-slate-800">
            {myEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 hover:bg-slate-850 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950 text-blue-300 border border-blue-800">
                      {ev.eventType}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {new Date(ev.startDate).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      {ev.startTime}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-100 text-sm mt-1">{ev.title}</div>
                  {ev.location && <div className="text-xs text-slate-400 mt-0.5">{ev.location}</div>}
                </div>

                <button
                  onClick={() => setActiveWorkspace('court_ops')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  Court Registry
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
