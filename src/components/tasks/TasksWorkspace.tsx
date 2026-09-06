import React, { useState, useEffect } from 'react';
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
  Lock,
  Unlock,
  GitBranch,
  ArrowRight,
  ShieldAlert,
  X,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import {
  evaluateTaskDependencies,
  canUpdateTaskStatus,
  getTasksDependentOn,
  wouldCreateCircularDependency,
} from '../../utils/taskDependencies';

export const TasksWorkspace: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const [viewMode, setViewMode] = useState<'list' | 'dependencies'>('list');
  const [filterScope, setFilterScope] = useState<'my' | 'all' | 'overdue' | 'blocked'>('my');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Blocked alert modal state
  const [blockedNotice, setBlockedNotice] = useState<{
    task: Task;
    attemptedStatus: TaskStatus;
    reason: string;
    blockingTasks: Task[];
  } | null>(null);

  // Task Dependency Editor Modal
  const [editingDepTask, setEditingDepTask] = useState<Task | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [matterId, setMatterId] = useState(matters[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueAt, setDueAt] = useState(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [officialDeadline, setOfficialDeadline] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  // Tasks belonging to currently selected matter in creation modal
  const matterTasksForDep = tasks.filter((t) => t.matterId === matterId);

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    const res = updateTask(task.id, { status: newStatus });
    if (!res.success) {
      const evalResult = evaluateTaskDependencies(task, tasks);
      setBlockedNotice({
        task,
        attemptedStatus: newStatus,
        reason: res.error || 'Prerequisite tasks must be completed first.',
        blockingTasks: evalResult.pendingDependencies,
      });
    }
  };

  const handleToggleComplete = (task: Task) => {
    if (task.status === 'completed') {
      updateTask(task.id, { status: 'todo' }, true);
      return;
    }
    const res = completeTask(task.id);
    if (!res.success) {
      const evalResult = evaluateTaskDependencies(task, tasks);
      setBlockedNotice({
        task,
        attemptedStatus: 'completed',
        reason: res.error || 'Prerequisite tasks must be completed first.',
        blockingTasks: evalResult.pendingDependencies,
      });
    }
  };

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
      dependsOnTaskIds: selectedDependencies,
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setSelectedDependencies([]);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterScope === 'my') return t.assignedTo === currentUser.id;
    if (filterScope === 'overdue') {
      return t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueAt) < new Date();
    }
    if (filterScope === 'blocked') {
      const evalResult = evaluateTaskDependencies(t, tasks);
      return evalResult.isBlocked && t.status !== 'completed' && t.status !== 'cancelled';
    }
    return true;
  });

  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueAt) < new Date()
  ).length;

  const blockedCount = tasks.filter((t) => {
    return evaluateTaskDependencies(t, tasks).isBlocked && t.status !== 'completed' && t.status !== 'cancelled';
  }).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                Action Central
              </span>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {tasks.length} Active Work Items
              </span>
              {blockedCount > 0 && (
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> {blockedCount} Blocked
                </span>
              )}
              {overdueCount > 0 && (
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                  {overdueCount} Overdue
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
              Tasks, Filings &amp; Dependency Orders
            </h1>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md transition shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Toolbar: View Mode & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 max-w-full overflow-hidden">
          {/* View Mode Toggle */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shrink-0 self-start">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition text-xs ${
                viewMode === 'list' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition text-xs ${
                viewMode === 'dependencies' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Dependency Chains</span>
            </button>
          </div>

          {/* Filter Scope Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 overflow-x-auto max-w-full text-xs shrink-0">
            <button
              onClick={() => setFilterScope('my')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                filterScope === 'my' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                filterScope === 'all' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Firm-Wide
            </button>
            <button
              onClick={() => setFilterScope('blocked')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap flex items-center gap-1 ${
                filterScope === 'blocked' ? 'bg-amber-700 text-white shadow' : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <Lock className="w-3 h-3" /> Blocked ({blockedCount})
            </button>
            <button
              onClick={() => setFilterScope('overdue')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                filterScope === 'overdue' ? 'bg-rose-900 text-rose-200 shadow' : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              Overdue ({overdueCount})
            </button>
          </div>
        </div>
      </div>

      {/* Dependency Chains Map View */}
      {viewMode === 'dependencies' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <GitBranch className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Execution Order of Operations</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Tasks with defined prerequisites enforce a mandatory order of operations. Dependent tasks remain locked
                until their preceding milestones are marked as completed.
              </p>
            </div>
          </div>

          {matters.map((m) => {
            const matterTaskList = tasks.filter((t) => t.matterId === m.id);
            if (matterTaskList.length === 0) return null;

            return (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-bold">{m.internalReference}</span>
                    <span className="text-slate-300 font-semibold">{m.title}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">{matterTaskList.length} tasks</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matterTaskList.map((t) => {
                    const evalResult = evaluateTaskDependencies(t, tasks);
                    const downstream = getTasksDependentOn(t.id, tasks);
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-3 ${
                          t.status === 'completed'
                            ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                            : evalResult.isBlocked
                            ? 'bg-amber-950/20 border-amber-900/60'
                            : 'bg-slate-800/60 border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                              t.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : evalResult.isBlocked
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {evalResult.isBlocked ? 'Blocked' : t.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Due: {new Date(t.dueAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-200 text-xs">{t.title}</div>
                        </div>

                        {/* Prerequisites indicator */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px]">
                          {evalResult.pendingDependencies.length > 0 && (
                            <div className="p-2 rounded bg-amber-950/40 border border-amber-900/40 text-amber-300 space-y-1">
                              <div className="font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Waiting on {evalResult.pendingDependencies.length} task(s):
                              </div>
                              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-400/90">
                                {evalResult.pendingDependencies.map((dep) => (
                                  <li key={dep.id} className="truncate">
                                    {dep.title} ({dep.status})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {downstream.length > 0 && (
                            <div className="text-slate-400 text-[10px] flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-amber-500" />
                              <span>Prerequisite for {downstream.length} downstream task(s)</span>
                            </div>
                          )}

                          <button
                            onClick={() => setEditingDepTask(t)}
                            className="w-full mt-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition text-center"
                          >
                            Configure Dependencies
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task List Standard View */}
      {viewMode === 'list' && (
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
              const evalResult = evaluateTaskDependencies(t, tasks);
              const downstream = getTasksDependentOn(t.id, tasks);

              return (
                <div
                  key={t.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm min-w-0 max-w-full ${
                    evalResult.isBlocked && t.status !== 'completed'
                      ? 'border-amber-900/60 bg-amber-950/15'
                      : isOverdue
                      ? 'border-rose-900/60 bg-rose-950/20'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0 w-full">
                    <button
                      onClick={() => handleToggleComplete(t)}
                      title={evalResult.isBlocked ? 'Blocked by prerequisite tasks' : 'Mark complete'}
                      className={`p-2 rounded-xl transition mt-0.5 shrink-0 ${
                        t.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : evalResult.isBlocked
                          ? 'bg-amber-950 text-amber-500 border border-amber-800 hover:bg-amber-900'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {evalResult.isBlocked && t.status !== 'completed' ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckSquare className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm break-words max-w-full ${
                            t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {t.title}
                        </span>

                        {/* Dependency Pill */}
                        {evalResult.isBlocked && t.status !== 'completed' && (
                          <span
                            onClick={() => {
                              setBlockedNotice({
                                task: t,
                                attemptedStatus: 'in_progress',
                                reason: 'Prerequisite dependencies must be completed first.',
                                blockingTasks: evalResult.pendingDependencies,
                              });
                            }}
                            className="cursor-pointer text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 hover:bg-amber-900 transition"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Blocked ({evalResult.pendingDependencies.length} unmet)</span>
                          </span>
                        )}

                        {t.dependsOnTaskIds && t.dependsOnTaskIds.length > 0 && !evalResult.isBlocked && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            <span>Clear</span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                            t.priority === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : t.priority === 'high'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {t.status}
                        </span>
                      </div>

                      {t.description && <p className="text-slate-400 text-xs break-words">{t.description}</p>}

                      <div className="flex items-center gap-x-4 gap-y-1 text-slate-400 text-[11px] pt-0.5 flex-wrap min-w-0">
                        {matter && (
                          <button
                            onClick={() => {
                              setSelectedMatterId(matter.id);
                              setActiveWorkspace('matters');
                            }}
                            className="font-mono text-amber-400 hover:underline truncate max-w-full text-left"
                          >
                            {matter.internalReference}: {matter.title}
                          </button>
                        )}
                        <span>
                          Assigned: <strong className="text-slate-300">{assignee?.fullName || 'Staff'}</strong>
                        </span>

                        {downstream.length > 0 && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-amber-400" /> Blocks {downstream.length} task(s)
                          </span>
                        )}

                        <button
                          onClick={() => setEditingDepTask(t)}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <GitBranch className="w-3 h-3" /> Edit Dependencies
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Deadlines Block & Status dropdown */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 text-left sm:text-right">
                    <div className="space-y-0.5 min-w-0">
                      <div className={`text-xs font-mono font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                        Due: {new Date(t.dueAt).toLocaleDateString()}
                      </div>
                      {t.officialDeadlineAt && (
                        <div className="text-[10px] font-mono text-rose-300/80">
                          Cutoff: {new Date(t.officialDeadlineAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                      className={`border rounded-lg px-2.5 py-1 outline-none text-[11px] font-medium shrink-0 ${
                        evalResult.isBlocked && t.status !== 'completed'
                          ? 'bg-amber-950/80 border-amber-800 text-amber-200'
                          : 'bg-slate-950 border-slate-700 text-slate-200'
                      }`}
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
      )}

      {/* Blocked by Dependency Notice Modal */}
      {blockedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 p-4 sm:p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>Task Dependency Protection Enforced</span>
              </div>
              <button
                onClick={() => setBlockedNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-300">
                You cannot update <strong>"{blockedNotice.task.title}"</strong> to{' '}
                <span className="font-mono text-amber-400 font-bold uppercase">
                  {blockedNotice.attemptedStatus.replace('_', ' ')}
                </span>{' '}
                because its prerequisite milestone(s) have not been completed.
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Prerequisites Required First:
                </div>
                <div className="space-y-1.5">
                  {blockedNotice.blockingTasks.map((bt) => {
                    const assignee = users.find((u) => u.id === bt.assignedTo);
                    return (
                      <div
                        key={bt.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200 truncate">{bt.title}</div>
                          <div className="text-slate-400 text-[10px]">
                            Assigned to: {assignee?.fullName || 'Staff'} &bull; Due: {new Date(bt.dueAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-900 uppercase shrink-0">
                          {bt.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-slate-400 text-[11px]">
                To proceed, mark the prerequisite tasks above as completed, or ask a Managing Partner to apply an
                administrative override.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBlockedNotice(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                Understood, Return
              </button>
              {currentUser.role === 'managing_partner' && (
                <button
                  type="button"
                  onClick={() => {
                    updateTask(blockedNotice.task.id, { status: blockedNotice.attemptedStatus }, true);
                    setBlockedNotice(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-medium text-xs flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" /> Partner Override
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Dependencies Modal */}
      {editingDepTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 sm:p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">Configure Task Dependencies</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-xs sm:max-w-sm mt-0.5">{editingDepTask.title}</p>
              </div>
              <button onClick={() => setEditingDepTask(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-700 dark:text-slate-300 text-xs">
                Select tasks that must be completed before <strong>"{editingDepTask.title}"</strong> can be started or
                completed:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
                {tasks
                  .filter((t) => t.matterId === editingDepTask.matterId && t.id !== editingDepTask.id)
                  .map((candidate) => {
                    const isCircular = wouldCreateCircularDependency(editingDepTask.id, candidate.id, tasks);
                    const isChecked = editingDepTask.dependsOnTaskIds?.includes(candidate.id);

                    return (
                      <label
                        key={candidate.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                          isCircular
                            ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800'
                            : isChecked
                            ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            disabled={isCircular}
                            checked={!!isChecked}
                            onChange={(e) => {
                              const currentDeps = editingDepTask.dependsOnTaskIds || [];
                              const newDeps = e.target.checked
                                ? [...currentDeps, candidate.id]
                                : currentDeps.filter((id) => id !== candidate.id);
                              updateTask(editingDepTask.id, { dependsOnTaskIds: newDeps }, true);
                              setEditingDepTask({ ...editingDepTask, dependsOnTaskIds: newDeps });
                            }}
                            className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-200 truncate">{candidate.title}</div>
                            <div className="text-[10px] text-slate-400">
                              Status: {candidate.status} &bull; Due: {new Date(candidate.dueAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {isCircular && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                            Circular Loop
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDepTask(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleCreateTask}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 sm:p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">Create Action Task</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Draft and file Notice of Appointment of Advocates"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Associated Matter</label>
              <select
                value={matterId}
                onChange={(e) => {
                  setMatterId(e.target.value);
                  setSelectedDependencies([]);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono text-xs"
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.internalReference} - {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Task Dependency Selector */}
            {matterTasksForDep.length > 0 && (
              <div>
                <label className="block text-slate-300 mb-1 flex items-center justify-between">
                  <span>Prerequisite Dependencies (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Must complete before start</span>
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  {matterTasksForDep.map((mt) => (
                    <label
                      key={mt.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/80 cursor-pointer text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(mt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDependencies([...selectedDependencies, mt.id]);
                          } else {
                            setSelectedDependencies(selectedDependencies.filter((id) => id !== mt.id));
                          }
                        }}
                        className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 shrink-0"
                      />
                      <span className="truncate text-[11px] min-w-0 flex-1">{mt.title}</span>
                      <span className="text-[9px] font-mono text-slate-400 ml-auto uppercase shrink-0">{mt.status}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
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
