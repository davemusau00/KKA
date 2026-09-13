import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Shield,
  Briefcase,
  Check,
  X,
  Award,
  Filter
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { RoleId, UserProfile, BranchId } from '../../../types';
import { INITIAL_ROLES } from '../../../data/rbacData';
import { runtimeConfig } from '../../../config/runtime';
import { BackendUser, usersApi } from '../../../lib/api/users.api';
import { authApi } from '../../../lib/api/auth.api';
import { BackendBranch, organizationApi } from '../../../lib/api/organization.api';

export const ALL_ROLES_LIST: RoleId[] = [
  'managing_partner',
  'senior_partner',
  'advocate',
  'paralegal',
  'administrator',
  'court_clerk',
  'finance_officer',
  'technical_admin',
];

export const StaffDirectoryTab: React.FC = () => {
  const {
    users,
    branches,
    currentUser,
    setCurrentUser,
    inviteUser,
    toggleUserActive,
    updateUserRoles,
    updateUserBranch,
  } = useApp();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<'all' | string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | RoleId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUserRoles, setEditingUserRoles] = useState<UserProfile | null>(null);

  // Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+254 7');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newPrimaryRole, setNewPrimaryRole] = useState<RoleId>('advocate');
  const [newSecondaryRoles, setNewSecondaryRoles] = useState<RoleId[]>([]);
  const [newHomeBranchId, setNewHomeBranchId] = useState<BranchId>('branch-nairobi');
  const [newBarNumber, setNewBarNumber] = useState('');
  const [serverUsers, setServerUsers] = useState<BackendUser[]>([]);
  const [serverBranches, setServerBranches] = useState<BackendBranch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadServerUsers = async () => {
    if (runtimeConfig.enableDemoMode) return;
    try {
      const [nextUsers, nextBranches] = await Promise.all([usersApi.list(), organizationApi.listBranches()]);
      setServerUsers(nextUsers); setServerBranches(nextBranches);
    }
    catch (cause: any) { setActionError(cause?.message || 'Unable to load the authoritative staff directory.'); }
  };

  useEffect(() => { void loadServerUsers(); }, []);

  const displayedUsers: UserProfile[] = runtimeConfig.enableDemoMode ? users : serverUsers.map((user) => {
    const roles = user.roleKeys as RoleId[];
    return {
      id: user.id, fullName: user.fullName, email: user.email, phone: user.phone || '—', jobTitle: user.jobTitle || 'Firm staff',
      role: roles[0] || 'administrator', roles, homeBranchId: user.homeBranchId || '', isActive: user.status === 'ACTIVE',
    };
  });
  const displayedBranches = runtimeConfig.enableDemoMode ? branches : serverBranches.map((branch) => ({
    id: branch.id as BranchId, name: branch.name, code: branch.code, address: branch.address || '', phone: branch.phone || '', email: branch.email || '', isActive: branch.active
  }));

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return displayedUsers.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.jobTitle.toLowerCase().includes(q) ||
        (u.barNumber && u.barNumber.toLowerCase().includes(q));

      const matchesBranch = branchFilter === 'all' || u.homeBranchId === branchFilter;
      const matchesRole = roleFilter === 'all' || u.role === roleFilter || u.roles.includes(roleFilter);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive);

      return matchesSearch && matchesBranch && matchesRole && matchesStatus;
    });
  }, [displayedUsers, search, branchFilter, roleFilter, statusFilter]);

  // Metrics
  const totalStaff = displayedUsers.length;
  const activeStaff = displayedUsers.filter((u) => u.isActive).length;
  const advocatesCount = displayedUsers.filter((u) => u.roles.includes('advocate') || u.roles.includes('senior_partner') || u.roles.includes('managing_partner')).length;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    const allRoles: RoleId[] = Array.from(new Set([newPrimaryRole, ...newSecondaryRoles]));

    if (runtimeConfig.enableDemoMode) inviteUser({
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      jobTitle: newJobTitle.trim() || INITIAL_ROLES[newPrimaryRole]?.name || 'Legal Staff',
      role: newPrimaryRole,
      roles: allRoles,
      homeBranchId: newHomeBranchId,
      isActive: true,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?auto=format&fit=crop&q=80&w=200`,
      barNumber: newBarNumber.trim() || undefined,
    });

    if (!runtimeConfig.enableDemoMode) {
      setIsSubmitting(true); setActionError(null); setActionMessage(null);
      try {
        const result = await usersApi.invite({ fullName: newFullName.trim(), email: newEmail.trim(), phone: newPhone.trim() || undefined, jobTitle: newJobTitle.trim() || undefined, homeBranchId: newHomeBranchId || undefined, roleKeys: allRoles });
        setActionMessage(result.localInviteToken ? `Invitation persisted. Development-only link: ${window.location.origin}/auth/invite?token=${result.localInviteToken}` : 'Invitation persisted. Email delivery is UNCONFIGURED; no delivery was claimed.');
        await loadServerUsers();
      } catch (cause: any) { setActionError(cause?.message || 'Unable to create the invitation.'); return; }
      finally { setIsSubmitting(false); }
    }

    setNewFullName('');
    setNewEmail('');
    setNewPhone('+254 7');
    setNewJobTitle('');
    setNewBarNumber('');
    setNewSecondaryRoles([]);
    setShowInviteModal(false);
  };

  const handleSaveUserRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserRoles) return;
    if (runtimeConfig.enableDemoMode) updateUserRoles(editingUserRoles.id, editingUserRoles.roles);
    else {
      setIsSubmitting(true); setActionError(null);
      try {
        await usersApi.setRoles(editingUserRoles.id, editingUserRoles.roles);
        await usersApi.setHomeBranch(editingUserRoles.id, editingUserRoles.homeBranchId || null);
        await loadServerUsers();
      }
      catch (cause: any) { setActionError(cause?.message || 'Unable to update roles.'); return; }
      finally { setIsSubmitting(false); }
    }
    setEditingUserRoles(null);
  };

  const updateStatus = async (profile: UserProfile) => {
    if (runtimeConfig.enableDemoMode) { toggleUserActive(profile.id); return; }
    if (serverUsers.find((user) => user.id === profile.id)?.status === 'INVITED') {
      setActionError('Pending invitations cannot be activated until the recipient creates a password.');
      return;
    }
    setIsSubmitting(true); setActionError(null);
    try { await usersApi.setStatus(profile.id, profile.isActive ? 'SUSPENDED' : 'ACTIVE'); await loadServerUsers(); }
    catch (cause: any) { setActionError(cause?.message || 'Unable to update account status.'); }
    finally { setIsSubmitting(false); }
  };

  const resendInvite = async (userId: string) => {
    setIsSubmitting(true); setActionError(null); setActionMessage(null);
    try {
      const result = await usersApi.resendInvite(userId);
      setActionMessage(result.localInviteToken ? `Invitation replaced. Development-only link: ${window.location.origin}/auth/invite?token=${result.localInviteToken}` : 'Invitation replaced. Email delivery is UNCONFIGURED; no delivery was claimed.');
      await loadServerUsers();
    } catch (cause: any) { setActionError(cause?.message || 'Unable to resend the invitation.'); }
    finally { setIsSubmitting(false); }
  };

  const revokeSessions = async (userId: string) => {
    setIsSubmitting(true); setActionError(null); setActionMessage(null);
    try {
      const before = await authApi.inspectUserSessions(userId);
      const result = await authApi.revokeUserSessions(userId);
      setActionMessage(`Revoked ${result.revokedSessions} active server session${result.revokedSessions === 1 ? '' : 's'} (inspection found ${before.activeSessionCount}).`);
    } catch (cause: any) { setActionError(cause?.message || 'Unable to revoke server sessions.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="admin-tab-content">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Staff Directory &amp; User Accounts</span>
          </h2>
          <p className="admin-section-desc">
            Manage advocates, partners, paralegals, and administrative personnel across Nairobi HQ and Mombasa branches.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="admin-btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Staff Member</span>
        </button>
      </div>

      {actionError && <div className="mb-4 rounded-xl border border-rose-900/70 bg-rose-950/30 p-3 text-xs text-rose-200" role="alert">{actionError}</div>}
      {actionMessage && <div className="mb-4 rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-xs text-amber-100" role="status">{actionMessage}</div>}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-100">{totalStaff}</div>
            <div className="text-xs text-slate-400">Total Personnel</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">{activeStaff}</div>
            <div className="text-xs text-slate-400">Active Accounts</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-100">{advocatesCount}</div>
            <div className="text-xs text-slate-400">Practising Advocates</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-100">{displayedBranches.length}</div>
            <div className="text-xs text-slate-400">Registry Branches</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, role, bar number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Branches</option>
            {displayedBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleId | 'all')}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Roles</option>
            {ALL_ROLES_LIST.map((r) => (
              <option key={r} value={r}>
                {INITIAL_ROLES[r]?.name || r}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      {filteredUsers.length === 0 ? (
        <div className="admin-empty-state">
          <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-slate-300">No personnel match your criteria</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((u) => {
            const isSelf = u.id === currentUser.id;
            const isInvitePending = !runtimeConfig.enableDemoMode && serverUsers.find((user) => user.id === u.id)?.status === 'INVITED';
            const branch = displayedBranches.find((b) => b.id === u.homeBranchId);
            const roleDef = INITIAL_ROLES[u.role];

            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl border transition shadow-sm space-y-4 flex flex-col justify-between ${
                  isSelf
                    ? 'bg-amber-950/25 border-amber-600/70 shadow-amber-950/20 ring-1 ring-amber-500/20'
                    : u.isActive
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-rose-950/60 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {runtimeConfig.enableDemoMode ? <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={u.fullName} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-800 text-sm font-semibold text-amber-300" aria-hidden="true">{u.fullName.slice(0, 1).toUpperCase()}</div>}
                      <div className="min-w-0">
                        <div className="font-serif font-bold text-sm text-slate-100 truncate flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {isInvitePending ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">Pending invitation</span>
                          ) : !u.isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-xs truncate">{u.jobTitle}</div>
                        {u.barNumber && (
                          <div className="text-amber-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Award className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>LSK: {u.barNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => void updateStatus(u)}
                      disabled={isInvitePending || isSubmitting}
                      title={isInvitePending ? 'The recipient must accept the invitation first' : u.isActive ? 'Deactivate user' : 'Activate user'}
                      className={`p-1.5 rounded-lg border transition shrink-0 ${
                        u.isActive
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-700'
                          : 'bg-rose-950 border-rose-800 text-rose-300 hover:bg-emerald-950 hover:text-emerald-300'
                      }`}
                    >
                      {u.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Role Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold">
                      Primary: {roleDef?.name || u.role}
                    </span>
                    {u.roles
                      .filter((r) => r !== u.role)
                      .map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          +{r.replace('_', ' ')}
                        </span>
                      ))}
                  </div>

                  {/* Contact & Branch Meta */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-400 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{u.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{branch?.name || 'Unassigned Branch'}</span>
                    </div>
                  </div>
                </div>

                {/* Persona Switch & Role Config */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setEditingUserRoles(u)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition text-xs"
                    title="Edit assigned roles & permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Roles</span>
                  </button>

                  {isInvitePending && <button type="button" onClick={() => void resendInvite(u.id)} disabled={isSubmitting} className="px-2.5 py-1.5 rounded-lg border border-amber-700 bg-amber-950/40 text-amber-200 font-medium text-xs disabled:opacity-60">Resend</button>}

                  {!runtimeConfig.enableDemoMode && !isInvitePending && <button type="button" onClick={() => void revokeSessions(u.id)} disabled={isSubmitting} className="px-2.5 py-1.5 rounded-lg border border-rose-900 bg-rose-950/40 text-rose-200 font-medium text-xs disabled:opacity-60">Revoke sessions</button>}

                  <button
                    onClick={() => setCurrentUser(u)}
                    disabled={isSelf || !runtimeConfig.enableDemoMode}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition text-xs text-center ${
                      isSelf
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40 cursor-default font-semibold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer'
                    }`}
                  >
                    {isSelf ? 'Current Active Persona' : runtimeConfig.enableDemoMode ? 'Switch Persona' : 'Server account'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ MODAL: INVITE STAFF ═══ */}
      {showInviteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Invite New Staff Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="admin-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="admin-field-group">
                <label className="admin-field-label">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Wanjiru Advocate"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="admin-field-group">
                  <label className="admin-field-label">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="g.wanjiru@kklaw.co.ke"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Telephone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="admin-field-group">
                  <label className="admin-field-label">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Litigation Associate"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Bar Number (if Advocate)</label>
                  <input
                    type="text"
                    placeholder="P.105/18293/22"
                    value={newBarNumber}
                    onChange={(e) => setNewBarNumber(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="admin-field-group">
                  <label className="admin-field-label">Primary Role</label>
                  <select
                    value={newPrimaryRole}
                    onChange={(e) => setNewPrimaryRole(e.target.value as RoleId)}
                    className="admin-input"
                  >
                    {ALL_ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {INITIAL_ROLES[r]?.name || r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Assigned Branch</label>
                  <select
                    value={newHomeBranchId}
                    onChange={(e) => setNewHomeBranchId(e.target.value as BranchId)}
                    className="admin-input"
                  >
                    {displayedBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="admin-btn-primary disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving…' : 'Create Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: EDIT USER ROLES ═══ */}
      {editingUserRoles && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  Configure Roles: {editingUserRoles.fullName}
                </h3>
                <span className="text-slate-400 text-xs">{editingUserRoles.jobTitle}</span>
              </div>
              <button
                onClick={() => setEditingUserRoles(null)}
                className="admin-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserRoles} className="space-y-4">
              <div className="admin-field-group">
                <label className="admin-field-label">Primary Role</label>
                <select
                  value={editingUserRoles.role}
                  onChange={(e) => {
                    const newPrimary = e.target.value as RoleId;
                    setEditingUserRoles((prev) =>
                      prev
                        ? {
                            ...prev,
                            role: newPrimary,
                            roles: Array.from(new Set([newPrimary, ...prev.roles])),
                          }
                        : null
                    );
                  }}
                  className="admin-input"
                >
                  {ALL_ROLES_LIST.map((r) => (
                    <option key={r} value={r}>
                      {INITIAL_ROLES[r]?.name || r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">
                  Secondary Roles (Union of Permissions)
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {ALL_ROLES_LIST.map((r) => {
                    const isChecked = editingUserRoles.roles.includes(r);
                    const isPrimary = editingUserRoles.role === r;

                    return (
                      <label
                        key={r}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-amber-950/40 border border-amber-800/60' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isPrimary}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...editingUserRoles.roles, r]
                                : editingUserRoles.roles.filter((role) => role !== r);
                              setEditingUserRoles({ ...editingUserRoles, roles: next });
                            }}
                            className="w-4 h-4 rounded text-amber-600 bg-slate-900 border-slate-700"
                          />
                          <span className="font-medium text-slate-200 text-xs">
                            {INITIAL_ROLES[r]?.name || r}
                          </span>
                        </div>
                        {isPrimary && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                            Primary
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Assigned Home Branch</label>
                <select
                  value={editingUserRoles.homeBranchId}
                  onChange={(e) => {
                    const branchId = e.target.value as BranchId;
                    setEditingUserRoles({
                      ...editingUserRoles,
                      homeBranchId: branchId,
                    });
                    if (runtimeConfig.enableDemoMode) updateUserBranch(editingUserRoles.id, branchId);
                  }}
                  className="admin-input"
                >
                  {displayedBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingUserRoles(null)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                >
                  Save Role Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
