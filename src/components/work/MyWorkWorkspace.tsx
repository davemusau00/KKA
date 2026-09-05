import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FileCheck2,
  Hourglass,
  CheckCircle2,
  Calendar,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  Filter,
  Search,
  Plus,
  Bell,
  Sparkles,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Deadline, LegalDocument } from '../../types';

export const MyWorkWorkspace: React.FC = () => {
  const {
    currentUser,
    tasks,
    deadlines,
    documents,
    matters,
    notifications,
    updateTask,
    completeTask,
    setSelectedMatterId,
    setActiveWorkspace,
    setIsQuickCreateOpen,
    approveDocumentVersion,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'approvals' | 'reviews' | 'waiting' | 'notifications'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'due_today' | 'overdue' | 'high_priority'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // My assigned tasks
  const myTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isAssigned = t.assigneeUserId === currentUser.id || !t.assigneeUserId;
      const isNotDone = t.status !== 'completed' && t.status !== 'cancelled';
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!isAssigned || !isNotDone || !matchesSearch) return false;

      const dueDate = new Date(t.dueAt);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const isPast = dueDate < new Date();
      const isToday = dueDate.toDateString() === new Date().toDateString();

      if (taskFilter === 'overdue') return isPast;
      if (taskFilter === 'due_today') return isToday;
      if (taskFilter === 'high_priority') return t.priority === 'urgent' || t.priority === 'high';
      return true;
    });
  }, [tasks, currentUser.id, searchQuery, taskFilter]);

  // My deadlines
  const myDeadlines = useMemo(() => {
    return deadlines.filter((d) => !d.isCompleted && (d.responsibleUserId === currentUser.id || !d.responsibleUserId));
  }, [deadlines, currentUser.id]);

  // Documents awaiting review / approval
  const pendingDocumentReviews = useMemo(() => {
    return documents.filter((doc) => {
      const activeVer = doc.versions.find((v) => v.versionNumber === doc.currentVersionNumber);
      return activeVer && (activeVer.reviewStatus === 'under_review' || activeVer.reviewStatus === 'draft');
    });
  }, [documents]);

  // Waiting items across matters (Awaiting external responses: Insurer, Police, Doctor, Court)
  const waitingItems = useMemo(() => {
    const items: { id: string; matterId: string; matterTitle: string; stage: string; waitingOn: string; daysPending: number; category: string }[] = [];
    
    matters.forEach((m) => {
      if (m.status === 'active') {
        if (m.currentStageId === 3) {
          items.push({
            id: `wait-${m.id}-med`,
            matterId: m.id,
            matterTitle: `${m.title} (${m.fileNumber})`,
            stage: 'Medical Assessment',
            waitingOn: 'Awaiting Orthopedic & Surgeon P3 Report from Dr. Patel',
            daysPending: 14,
            category: 'Medical',
          });
        } else if (m.currentStageId === 5) {
          items.push({
            id: `wait-${m.id}-sec10`,
            matterId: m.id,
            matterTitle: `${m.title} (${m.fileNumber})`,
            stage: 'Section 10 Statutory Demand',
            waitingOn: 'Statutory 30-Day Response Window for Directline Assurance',
            daysPending: 18,
            category: 'Insurer',
          });
        } else if (m.currentStageId === 9) {
          items.push({
            id: `wait-${m.id}-serv`,
            matterId: m.id,
            matterTitle: `${m.title} (${m.fileNumber})`,
            stage: 'Service of Summons',
            waitingOn: 'Affidavit of Service from Mwenda Process Servers',
            daysPending: 5,
            category: 'Process Server',
          });
        } else if (m.currentStageId === 15) {
          items.push({
            id: `wait-${m.id}-recov`,
            matterId: m.id,
            matterTitle: `${m.title} (${m.fileNumber})`,
            stage: 'Execution / Recovery',
            waitingOn: 'Warrants of Attachment Proclamation by Keysian Auctioneers',
            daysPending: 9,
            category: 'Auctioneer',
          });
        }
      }
    });
    return items;
  }, [matters]);

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
  };

  const handleNavigateToMatter = (matterId: string) => {
    setSelectedMatterId(matterId);
    setActiveWorkspace('matters');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Welcome & Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-xs tracking-wider">
              Operational Queue
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
              {currentUser.fullName} ({currentUser.jobTitle})
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">My Work & Immediate Actions</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time hub for assigned litigation tasks, stage approvals, document verifications, and external dependencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQuickCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => { setActiveTab('tasks'); setTaskFilter('overdue'); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'tasks' && taskFilter === 'overdue'
              ? 'bg-rose-950/30 border-rose-600 text-rose-200'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {tasks.filter((t) => t.status !== 'completed' && new Date(t.dueAt) < new Date()).length}
          </p>
        </div>

        <div
          onClick={() => { setActiveTab('tasks'); setTaskFilter('due_today'); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'tasks' && taskFilter === 'due_today'
              ? 'bg-amber-950/30 border-amber-600 text-amber-200'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Due Today</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {tasks.filter((t) => t.status !== 'completed' && new Date(t.dueAt).toDateString() === new Date().toDateString()).length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('reviews')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'reviews'
              ? 'bg-cyan-950/30 border-cyan-600 text-cyan-200'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Doc Reviews</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {pendingDocumentReviews.length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('waiting')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'waiting'
              ? 'bg-purple-950/30 border-purple-600 text-purple-200'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Waiting On External</span>
            <Hourglass className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {waitingItems.length}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'tasks'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>My Tasks ({myTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'reviews'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Document Reviews ({pendingDocumentReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('waiting')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'waiting'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Hourglass className="w-4 h-4" />
            <span>Waiting Items ({waitingItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'notifications'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts ({notifications.filter((n) => !n.isRead).length})</span>
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div className="flex items-center gap-2">
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Pending</option>
              <option value="overdue">Overdue</option>
              <option value="due_today">Due Today</option>
              <option value="high_priority">Urgent / High Priority</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {myTasks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-serif font-bold text-white">All Caught Up!</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
                You have no pending tasks matching this filter. Good job maintaining Kenya PI statutory workflows.
              </p>
            </div>
          ) : (
            myTasks.map((task) => {
              const linkedMatter = matters.find((m) => m.id === task.matterId);
              const isOverdue = new Date(task.dueAt) < new Date();
              return (
                <div
                  key={task.id}
                  className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="mt-0.5 w-5 h-5 rounded-md border border-slate-600 hover:border-amber-500 flex items-center justify-center text-transparent hover:text-amber-400 transition-all"
                      title="Mark task completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-white text-base">{task.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : task.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-xs font-mono font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-slate-400 text-sm mt-1">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Due: {new Date(task.dueAt).toLocaleDateString()}
                        </span>
                        {linkedMatter && (
                          <button
                            onClick={() => handleNavigateToMatter(linkedMatter.id)}
                            className="flex items-center gap-1 text-amber-400 hover:underline"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            {linkedMatter.fileNumber} - {linkedMatter.title}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-lg transition-all"
                    >
                      Complete
                    </button>
                    {linkedMatter && (
                      <button
                        onClick={() => handleNavigateToMatter(linkedMatter.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                      >
                        <span>Matter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Document Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {pendingDocumentReviews.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <FileCheck2 className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-serif font-bold text-white">No Pending Document Reviews</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
                All drafted Pleadings, Affidavits, and Section 10 Notices are approved.
              </p>
            </div>
          ) : (
            pendingDocumentReviews.map((doc) => {
              const currentVer = doc.versions.find((v) => v.versionNumber === doc.currentVersionNumber);
              const linkedMatter = matters.find((m) => m.id === doc.matterId);
              return (
                <div
                  key={doc.id}
                  className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-base">{doc.title}</h4>
                        <span className="px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 font-mono text-xs font-bold">
                          v{doc.currentVersionNumber}.0
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 font-mono text-xs font-bold uppercase">
                          {currentVer?.reviewStatus || 'under_review'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        Category: <span className="font-mono text-slate-300 capitalize">{doc.category}</span> • Uploaded by {currentVer?.uploadedByUserId || 'Advocate'}
                      </p>
                      {linkedMatter && (
                        <div className="mt-2 text-xs text-slate-400">
                          Linked Matter: <span className="font-mono text-amber-400">{linkedMatter.fileNumber}</span> ({linkedMatter.title})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        if (currentVer) {
                          approveDocumentVersion(doc.id, currentVer.id, 'Approved via My Work Queue');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-all"
                    >
                      Approve & Sign
                    </button>
                    {linkedMatter && (
                      <button
                        onClick={() => handleNavigateToMatter(linkedMatter.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Waiting Items Tab */}
      {activeTab === 'waiting' && (
        <div className="space-y-3">
          {waitingItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-400">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-base">{item.waitingOn}</h4>
                    <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-mono text-xs font-bold">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    Matter: <span className="font-semibold text-slate-300">{item.matterTitle}</span> • Stage: <span className="text-amber-400 font-mono">{item.stage}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Pending for {item.daysPending} business days
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => handleNavigateToMatter(item.matterId)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                >
                  <span>Open Matter</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                notif.isRead
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                  : 'bg-slate-900 border-indigo-900/60 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-950/50 text-indigo-400 border border-indigo-800">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{notif.title}</h4>
                  <p className="text-slate-400 text-sm mt-0.5">{notif.message}</p>
                  <span className="text-xs font-mono text-slate-500 mt-1 block">
                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {notif.matterId && (
                <button
                  onClick={() => handleNavigateToMatter(notif.matterId!)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-semibold rounded-lg"
                >
                  View
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
