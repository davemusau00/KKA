import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Plus,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  Filter,
  Columns,
  List,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskStatus } from '../../types';

export const TasksWorkspace: React.FC = () => {
  const {
    tasks,
    matters,
    users,
    currentUser,
    createTask,
    updateTask,
    completeTask,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [filterScope, setFilterScope] = useState<'my' | 'all' | 'overdue'>('my');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [matterId, setMatterId] = useState(matters[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueAt, setDueAt] = useState(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [officialDeadline, setOfficialDeadline] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterScope === 'my') return t.assignedTo === currentUser.id;
    if (filterScope === 'overdue') {
      return t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueAt) < new Date();
    }
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title,
      description,
      matterId,
      assignedTo,
      createdBy: currentUser.id,
      priority,
      status: 'todo',
      dueAt: `${dueAt}T17:00:00Z`,
      officialDeadlineAt: officialDeadline ? `${officialDeadline}T17:00:00Z` : undefined,
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
  };

  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueAt) < new Date()
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Action Central
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {tasks.length} Active Work Items
            </span>
            {overdueCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                {overdueCount} Overdue
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Tasks, Filings &amp; Statutory Deadlines
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setFilterScope('my')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterScope === 'my' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterScope === 'all' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Firm-Wide
            </button>
            <button
              onClick={() => setFilterScope('overdue')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterScope === 'overdue' ? 'bg-rose-900 text-rose-200 shadow' : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              Overdue ({overdueCount})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const matter = matters.find((m) => m.id === t.matterId);
            const assignee = users.find((u) => u.id === t.assignedTo);
            const isOverdue = t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueAt) < new Date();

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                  isOverdue
                    ? 'border-rose-900/60 bg-rose-950/20'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => completeTask(t.id)}
                    className={`p-2 rounded-xl transition mt-0.5 shrink-0 ${
                      t.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {t.title}
                      </span>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                        t.priority === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : t.priority === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t.status}
                      </span>
                    </div>

                    {t.description && <p className="text-slate-400 text-xs">{t.description}</p>}

                    <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1">
                      {matter && (
                        <button
                          onClick={() => {
                            setSelectedMatterId(matter.id);
                            setActiveWorkspace('matters');
                          }}
                          className="font-mono text-amber-400 hover:underline"
                        >
                          {matter.internalReference}: {matter.title}
                        </button>
                      )}
                      <span>Assigned to: <strong className="text-slate-300">{assignee?.fullName || 'Staff'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Deadlines Block */}
                <div className="flex items-center gap-4 shrink-0 text-right self-end md:self-center">
                  <div className="space-y-0.5">
                    <div className={`text-xs font-mono font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      Target Due: {new Date(t.dueAt).toLocaleDateString()}
                    </div>
                    {t.officialDeadlineAt && (
                      <div className="text-[10px] font-mono text-rose-300/80">
                        Statutory Cutoff: {new Date(t.officialDeadlineAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <select
                    value={t.status}
                    onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none text-[11px]"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateTask} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-100">Create Action Task</h3>

            <div>
              <label className="block text-slate-300 mb-1">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Draft and file Notice of Appointment of Advocates"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Associated Matter</label>
              <select
                value={matterId}
                onChange={(e) => setMatterId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono"
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.internalReference} - {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Assignee</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Internal Target Due Date</label>
                <input
                  type="date"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Statutory Deadline (Optional)</label>
                <input
                  type="date"
                  value={officialDeadline}
                  onChange={(e) => setOfficialDeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
