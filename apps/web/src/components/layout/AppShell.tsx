import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CheckSquare,
  Calendar,
  FileText,
  MessageSquare,
  DollarSign,
  BarChart3,
  ShieldAlert,
  Settings2,
  Search,
  Plus,
  Wifi,
  WifiOff,
  Bell,
  Building2,
  ChevronDown,
  Menu,
  X,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  Sun,
  Scale,
  CheckCircle2,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { QuickCreateModal } from '../common/QuickCreateModal';
import { OfflineSyncCenterModal } from '../common/OfflineSyncCenterModal';
import { GlobalTimeTracker } from '../common/GlobalTimeTracker';
import { MobileQuickActionsMenu } from '../common/MobileQuickActionsMenu';
import { ConnectionStatusBadge } from '../common/ConnectionStatusBadge';
import { BranchId } from '../../types';

interface Props {
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ children }) => {
  const {
    activeWorkspace,
    setActiveWorkspace,
    setSelectedMatterId,
    currentUser,
    setCurrentUser,
    currentBranchFilter,
    setCurrentBranchFilter,
    branches,
    users,
    isOnline,
    mutationQueue,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setIsSearchOpen,
    setIsQuickCreateOpen,
    setIsSyncCenterOpen,
    tasks,
    matters,
    expenses,
    intakes,
    calendarEvents,
    documents,
    stageHandoffs,
    hasUserPermission,
    effectivePermissions,
    theme,
    toggleTheme,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Compute live badges
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;
  const overdueTaskCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueAt) < new Date()
  ).length;
  const pendingExpenseCount = expenses.filter((e) => e.status === 'submitted').length;
  const activeMatterCount = matters.filter((m) => m.status === 'active').length;
  const newIntakeCount = intakes.filter((i) => i.disposition === 'new' || i.disposition === 'under_review').length;

  const pendingCourtOutcomeCount = calendarEvents.filter(
    (e) =>
      e.eventType === 'court' &&
      new Date(e.startAt) < new Date() &&
      ((e.courtStatus || 'scheduled') === 'scheduled' || e.courtStatus === 'attended')
  ).length;

  const pendingDocReviewCount = documents.reduce(
    (acc, d) => acc + d.versions.filter((v) => v.status === 'in_review').length,
    0
  );
  const pendingHandoffCount = stageHandoffs.filter((h) => !h.acknowledgedAt).length;
  const pendingClosureCount = matters.filter((m) => m.currentStageId === 19 && m.status === 'active').length;
  const totalApprovalsCount = pendingExpenseCount + pendingDocReviewCount + pendingHandoffCount + pendingClosureCount;

  const allNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
    { id: 'matters', label: 'Matters', icon: Briefcase, badge: activeMatterCount, permission: 'module.matters' as const },
    { id: 'clients', label: 'Clients & Intake', icon: Users, badge: newIntakeCount > 0 ? `${newIntakeCount} leads` : undefined, permission: 'module.clients' as const },
    { id: 'tasks', label: 'Tasks & Deadlines', icon: CheckSquare, badge: overdueTaskCount > 0 ? overdueTaskCount : undefined, badgeColor: 'bg-rose-600', permission: 'module.tasks' as const },
    { id: 'court', label: 'Court Operations', icon: Scale, badge: pendingCourtOutcomeCount > 0 ? `${pendingCourtOutcomeCount} due` : undefined, badgeColor: 'bg-amber-600', permission: 'module.calendar' as const },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle2, badge: totalApprovalsCount > 0 ? totalApprovalsCount : undefined, badgeColor: 'bg-purple-600', permission: null },
    { id: 'calendar', label: 'Firm Calendar', icon: Calendar, permission: 'module.calendar' as const },
    { id: 'documents', label: 'Documents', icon: FileText, permission: 'module.documents' as const },
    { id: 'comms', label: 'Communications', icon: MessageSquare, permission: 'module.comms' as const },
    { id: 'finance', label: 'Finance & Accounts', icon: DollarSign, badge: pendingExpenseCount > 0 ? pendingExpenseCount : undefined, badgeColor: 'bg-amber-600', permission: 'finance.view' as const },
    { id: 'reports', label: 'Reports & Stalled', icon: BarChart3, permission: 'module.reports' as const },
    { id: 'admin', label: 'Admin & Staff', icon: Shield, permission: 'module.admin' as const },
    { id: 'integrations', label: 'Integrations', icon: Settings2, permission: 'module.admin' as const },
  ];

  // Filter navigation items based on current user's effective permissions
  const navigationItems = allNavigationItems.filter(
    (item) => !item.permission || hasUserPermission(item.permission)
  );

  const handleNavClick = (id: string) => {
    setActiveWorkspace(id);
    if (id !== 'matters') {
      setSelectedMatterId(null);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-full overflow-x-hidden">
      {/* Backdrop overlay for closing open dropdown popovers */}
      {(isNotifOpen || isUserDropdownOpen) && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
          onClick={() => {
            setIsNotifOpen(false);
            setIsUserDropdownOpen(false);
          }}
        />
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-4 max-w-full">
        {/* Left: Branding & Mobile Menu toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-md shadow-amber-900/30 font-serif font-bold text-xs sm:text-sm tracking-wider border border-amber-500/40 group-hover:scale-105 transition-transform shrink-0">
              KKC
            </div>
            <div className="hidden sm:block">
              <div className="text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                Kariuki Kagunda &amp; Co.
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold tracking-wider uppercase">
                Advocates OS &bull; Kenya
              </div>
            </div>
          </div>
        </div>

        {/* Center: Branch Context Selector & Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl justify-end md:justify-center min-w-0">
          {/* Branch Filter Selector */}
          <div className="relative hidden lg:flex items-center">
            <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 absolute left-2.5 pointer-events-none" />
            <select
              value={currentBranchFilter}
              onChange={(e) => setCurrentBranchFilter(e.target.value as 'all' | BranchId)}
              className="bg-slate-50 dark:bg-slate-800/90 text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 rounded-lg pl-8 pr-7 py-1.5 focus:border-amber-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Branches (HQ &amp; Mombasa)</option>
              <option value="branch-nairobi">Nairobi Branch (HQ)</option>
              <option value="branch-two">Mombasa Branch</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Global Search Bar (full on sm+, icon button on mobile) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all flex-1 max-w-xs shadow-inner min-w-0"
            title="Search matters, court numbers, clients (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Search matters, court nos...</span>
            <kbd className="hidden md:inline-block ml-auto text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-amber-600 dark:text-amber-400 shrink-0"
            title="Search matters, clients, court nos"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Action, Offline Indicator, Notifications, Persona Switcher */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Global Billable Time Tracker */}
          <GlobalTimeTracker />

          {/* Quick Create + Button */}
          <button
            onClick={() => setIsQuickCreateOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg shadow-md shadow-amber-950/40 transition-all active:scale-95 shrink-0"
            title="Quick Create Record"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Quick Create</span>
          </button>

          {/* Real Backend Connection Badge */}
          <ConnectionStatusBadge />

          {/* Network & Offline Status Button */}
          <button
            onClick={() => setIsSyncCenterOpen(true)}
            title={isOnline ? 'Online (Click to open Sync Center)' : 'Offline mode active'}
            className={`p-1.5 rounded-lg border flex items-center gap-1 text-xs transition shrink-0 ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {mutationQueue.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-1 rounded-full">
                {mutationQueue.length}
              </span>
            )}
          </button>

          {/* Theme Switcher Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition shrink-0"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Notification Bell with Dropdown */}
          <div className="relative z-50">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition relative shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Center Popover */}
            {isNotifOpen && (
              <div className="fixed inset-x-2 top-14 max-w-sm mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
                  <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" /> Notifications
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.matterId) {
                            setSelectedMatterId(n.matterId);
                            setActiveWorkspace('matters');
                          } else if (n.actionUrl) {
                            setActiveWorkspace(n.actionUrl.replace('/', ''));
                          }
                          setIsNotifOpen(false);
                        }}
                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start gap-2.5 ${
                          !n.isRead ? 'bg-amber-50/50 dark:bg-slate-800/30' : 'opacity-75'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.urgency === 'critical'
                              ? 'bg-rose-500'
                              : n.urgency === 'urgent'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-slate-200">{n.title}</div>
                          <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{n.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Persona / Staff Role Switcher */}
          <div className="relative z-50">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 transition"
              title="Switch user role / persona for testing"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-6 h-6 rounded-lg object-cover border border-amber-500/50"
              />
              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-mono font-medium">
                  {currentUser.jobTitle.split(' ')[0]}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            </button>

            {/* Persona Switcher Dropdown */}
            {isUserDropdownOpen && (
              <div className="fixed inset-x-2 top-14 max-w-xs mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:max-w-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <div className="font-semibold text-slate-900 dark:text-slate-200">Test Role Personas</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Switch user context to verify RBAC &amp; workflows</div>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/50">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition ${
                        u.id === currentUser.id ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                      <div className="truncate flex-1">
                        <div className="font-semibold truncate">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.jobTitle}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(u.roles && u.roles.length > 0 ? u.roles : [u.role]).map((r) => (
                            <span key={r} className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400 border border-slate-200 dark:border-slate-700 uppercase">
                              {r.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex flex-col w-60 lg:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 shrink-0 select-none">
          <div className="p-3 flex-1 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-1.5">
              Law Firm Operations
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-amber-900/60 text-white'
                          : item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Branch</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentBranchFilter === 'all'
                    ? 'Both Branches'
                    : branches.find((b) => b.id === currentBranchFilter)?.name || 'Branch'}
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm">
            <div className="w-72 bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-serif font-bold text-amber-700 dark:text-amber-400 text-sm">
                    Kariuki Kagunda Advocates
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Branch selector on mobile */}
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">
                    Branch Context:
                  </label>
                  <select
                    value={currentBranchFilter}
                    onChange={(e) => setCurrentBranchFilter(e.target.value as 'all' | BranchId)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="all">All Branches</option>
                    <option value="branch-nairobi">Nairobi Branch (HQ)</option>
                    <option value="branch-two">Mombasa Branch</option>
                  </select>
                </div>

                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeWorkspace === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                          isActive
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Logged in as: <strong className="text-slate-800 dark:text-slate-200">{currentUser.fullName}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col min-w-0 max-w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] shrink-0">
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center gap-1 ${
            activeWorkspace === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => handleNavClick('matters')}
          className={`flex flex-col items-center gap-1 relative ${
            activeWorkspace === 'matters' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Matters</span>
          {activeMatterCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => handleNavClick('tasks')}
          className={`flex flex-col items-center gap-1 relative ${
            activeWorkspace === 'tasks' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
          {overdueTaskCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
        <button
          onClick={() => handleNavClick('calendar')}
          className={`flex flex-col items-center gap-1 ${
            activeWorkspace === 'calendar' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Modals & Mobile Quick Actions */}
      <GlobalSearchModal />
      <QuickCreateModal />
      <OfflineSyncCenterModal />
      <MobileQuickActionsMenu />
    </div>
  );
};
