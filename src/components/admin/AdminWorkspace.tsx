import React, { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Building2,
  Lock,
  RotateCcw,
  CheckCircle,
  Clock,
  Key,
  Plus,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleId, PermissionKey, UserProfile, Branch, BranchId } from '../../types';
import { ALL_PERMISSIONS, INITIAL_ROLES, RoleDefinition } from '../../data/rbacData';

const ALL_ROLES_LIST: RoleId[] = [
  'managing_partner',
  'senior_partner',
  'advocate',
  'paralegal',
  'administrator',
  'court_clerk',
  'finance_officer',
  'technical_admin',
];

export const AdminWorkspace: React.FC = () => {
  const {
    users,
    branches,
    currentUser,
    setCurrentUser,
    auditLogs,
    matters,
    resetDataToDefault,
    rolePermissionsMap,
    updateRolePermissions,
    updateUserRoles,
    resetRolePermissionsToDefault,
    inviteUser,
    toggleUserActive,
    updateUserBranch,
    createBranch,
    updateBranch,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'matrix' | 'roles' | 'branches' | 'audit'>('staff');

  // Search & Filters
  const [staffSearch, setStaffSearch] = useState('');
  const [staffBranchFilter, setStaffBranchFilter] = useState<'all' | string>('all');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<'all' | string>('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingUserRoles, setEditingUserRoles] = useState<UserProfile | null>(null);

  // New Staff Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+254 7');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newPrimaryRole, setNewPrimaryRole] = useState<RoleId>('advocate');
  const [newSecondaryRoles, setNewSecondaryRoles] = useState<RoleId[]>([]);
  const [newHomeBranchId, setNewHomeBranchId] = useState<BranchId>('branch-nairobi');
  const [newBarNumber, setNewBarNumber] = useState('');

  // New/Edit Branch Form State
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');

  // Filtered staff
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
        u.jobTitle.toLowerCase().includes(staffSearch.toLowerCase());
      const matchesBranch = staffBranchFilter === 'all' || u.homeBranchId === staffBranchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [users, staffSearch, staffBranchFilter]);

  // Categories in permissions
  const permissionCategories = useMemo(() => {
    const cats = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.category)));
    return ['all', ...cats];
  }, []);

  const filteredPermissions = useMemo(() => {
    if (matrixCategoryFilter === 'all') return ALL_PERMISSIONS;
    return ALL_PERMISSIONS.filter((p) => p.category === matrixCategoryFilter);
  }, [matrixCategoryFilter]);

  // Filtered audits
  const filteredAudits = useMemo(() => {
    return auditLogs.filter((log) => {
      const text = `${log.action} ${log.actorUserId} ${JSON.stringify(log.metadata || {})}`.toLowerCase();
      return text.includes(auditSearch.toLowerCase());
    });
  }, [auditLogs, auditSearch]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    const allRoles: RoleId[] = Array.from(new Set([newPrimaryRole, ...newSecondaryRoles]));

    inviteUser({
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

    setNewFullName('');
    setNewEmail('');
    setNewPhone('+254 7');
    setNewJobTitle('');
    setNewBarNumber('');
    setNewSecondaryRoles([]);
    setShowInviteModal(false);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) return;

    if (editingBranch) {
      updateBranch(editingBranch.id, {
        name: branchName.trim(),
        code: branchCode.trim().toUpperCase(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
      });
    } else {
      createBranch({
        name: branchName.trim(),
        code: branchCode.trim().toUpperCase(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        isActive: true,
      });
    }

    setEditingBranch(null);
    setBranchName('');
    setBranchCode('');
    setBranchAddress('');
    setBranchPhone('');
    setBranchEmail('');
    setShowBranchModal(false);
  };

  const openEditBranchModal = (b: Branch) => {
    setEditingBranch(b);
    setBranchName(b.name);
    setBranchCode(b.code);
    setBranchAddress(b.address);
    setBranchPhone(b.phone);
    setBranchEmail(b.email);
    setShowBranchModal(true);
  };

  const handleTogglePermission = (role: RoleId, permission: PermissionKey) => {
    const currentPerms = rolePermissionsMap[role] || [];
    const hasIt = currentPerms.includes(permission);
    const updatedPerms = hasIt
      ? currentPerms.filter((p) => p !== permission)
      : [...currentPerms, permission];
    updateRolePermissions(role, updatedPerms);
  };

  const handleSaveUserRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserRoles) return;
    updateUserRoles(editingUserRoles.id, editingUserRoles.roles);
    setEditingUserRoles(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Firm Administration &amp; Governance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              RBAC Matrix Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Staff Directory, RBAC Permissions &amp; Firm Governance
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Reset all demo state to original Kariuki Kagunda Lawfirm OS seed data?')) {
                resetDataToDefault();
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1 w-fit">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            activeTab === 'staff' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff &amp; Personas ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            activeTab === 'matrix' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role Permission Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            activeTab === 'roles' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Role Assignment</span>
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            activeTab === 'branches' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Firm Branches ({branches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* ═══ TAB 1: STAFF & PERSONAS ═══ */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search staff by name, email, job title..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={staffBranchFilter}
                onChange={(e) => setStaffBranchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow transition shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Staff Member</span>
              </button>
            </div>
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentUser.id;
              const branch = branches.find((b) => b.id === u.homeBranchId);
              const roleDef = INITIAL_ROLES[u.role];

              return (
                <div
                  key={u.id}
                  className={`p-5 rounded-2xl border transition shadow-sm space-y-3 flex flex-col justify-between ${
                    isSelf
                      ? 'bg-amber-950/30 border-amber-600/70 shadow-amber-950/20'
                      : u.isActive
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/60 border-rose-950/60 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                          alt={u.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-serif font-bold text-sm text-slate-100 truncate flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {!u.isActive && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-xs truncate">{u.jobTitle}</div>
                          {u.barNumber && (
                            <div className="text-slate-500 font-mono text-[10px]">
                              LSK: {u.barNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleUserActive(u.id)}
                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                        className={`p-1.5 rounded-lg border transition shrink-0 ${
                          u.isActive
                            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400'
                            : 'bg-rose-950 border-rose-800 text-rose-300'
                        }`}
                      >
                        {u.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Roles Badges */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-semibold">
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

                    {/* Contact & Branch Details */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400 text-xs">
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

                  {/* Persona Switch & Role Edit */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => setEditingUserRoles(u)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition text-xs"
                      title="Edit assigned roles"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Roles</span>
                    </button>

                    <button
                      onClick={() => setCurrentUser(u)}
                      disabled={isSelf}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition text-xs text-center ${
                        isSelf
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40 cursor-default font-semibold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isSelf ? 'Current Active Persona' : 'Switch Persona'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB 2: ROLE PERMISSION MATRIX ═══ */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-slate-400 font-medium whitespace-nowrap">Filter Module:</span>
              {permissionCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMatrixCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap font-medium transition ${
                    matrixCategoryFilter === cat
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (confirm('Reset role permissions for all 8 roles to original defaults?')) {
                  resetRolePermissionsToDefault();
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="p-3.5 min-w-[240px]">Permission Key &amp; Name</th>
                  <th className="p-3.5 min-w-[90px]">Category</th>
                  {ALL_ROLES_LIST.map((r) => {
                    const roleDef = INITIAL_ROLES[r];
                    return (
                      <th key={r} className="p-3.5 text-center min-w-[100px]">
                        <div className="font-bold text-slate-200">
                          {roleDef?.name.replace('Managing Partner (Senior Partner)', 'Senior Partner')}
                        </div>
                        <div className="text-[10px] text-amber-500 lowercase">
                          ({(rolePermissionsMap[r] || []).length} perms)
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredPermissions.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{perm.label}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{perm.description}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{perm.key}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {perm.category}
                      </span>
                    </td>
                    {ALL_ROLES_LIST.map((r) => {
                      const hasPerm = (rolePermissionsMap[r] || []).includes(perm.key);
                      const isSenior = r === 'managing_partner' || r === 'senior_partner';

                      return (
                        <td key={r} className="p-3.5 text-center">
                          <button
                            onClick={() => handleTogglePermission(r, perm.key)}
                            disabled={isSenior}
                            className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition ${
                              hasPerm
                                ? 'bg-amber-600 border-amber-500 text-white'
                                : 'bg-slate-950 border-slate-700 text-transparent hover:border-slate-500'
                            } ${isSenior ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isSenior ? 'Senior partner has comprehensive access' : undefined}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: ROLE ASSIGNMENT ═══ */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="font-serif font-bold text-base text-slate-100">
              Staff Persona &amp; Multi-Role Assignment
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Users inherit the union of all permissions across their assigned roles. Select a primary role and optional secondary roles.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="p-3.5">Staff Member</th>
                  <th className="p-3.5">Primary Role</th>
                  <th className="p-3.5">Assigned Roles (Multi-Role Support)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                            alt={u.fullName}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-slate-100">{u.fullName}</div>
                            <div className="text-slate-400 text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newPrimary = e.target.value as RoleId;
                            const newRoles = Array.from(new Set([newPrimary, ...u.roles]));
                            updateUserRoles(u.id, newRoles);
                          }}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                        >
                          {ALL_ROLES_LIST.map((r) => (
                            <option key={r} value={r}>
                              {INITIAL_ROLES[r]?.name || r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_ROLES_LIST.map((r) => {
                            const isAssigned = u.roles.includes(r);
                            const isPrimary = u.role === r;

                            return (
                              <button
                                key={r}
                                onClick={() => {
                                  if (isPrimary) return; // cannot remove primary role
                                  const nextRoles = isAssigned
                                    ? u.roles.filter((role) => role !== r)
                                    : [...u.roles, r];
                                  updateUserRoles(u.id, nextRoles);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                                  isPrimary
                                    ? 'bg-amber-950 border-amber-700 text-amber-300 font-bold cursor-default'
                                    : isAssigned
                                    ? 'bg-blue-950 border-blue-700 text-blue-300 hover:border-rose-700 hover:text-rose-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                                }`}
                                title={isPrimary ? 'Primary role' : isAssigned ? 'Click to remove role' : 'Click to add role'}
                              >
                                {r.replace('_', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setEditingUserRoles(u)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: BRANCHES ═══ */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-100">
                Firm Office Locations &amp; Branch Registries
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Multi-branch operations with independent registry codes, court jurisdictions, and staff allocations.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBranch(null);
                setBranchName('');
                setBranchCode('');
                setBranchAddress('');
                setBranchPhone('+254 ');
                setBranchEmail('');
                setShowBranchModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((b) => {
              const staffCount = users.filter((u) => u.homeBranchId === b.id).length;
              const mattersCount = matters.filter((m) => m.originatingBranchId === b.id).length;

              return (
                <div
                  key={b.id}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-serif font-bold text-base text-slate-100">{b.name}</div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase font-semibold">
                        Code: {b.code}
                      </span>
                    </div>

                    <button
                      onClick={() => openEditBranchModal(b)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-slate-400 text-xs space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{b.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-center">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-sm font-bold text-slate-100 font-mono">{staffCount}</div>
                      <div className="text-[10px] text-slate-400">Assigned Staff</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-sm font-bold text-amber-400 font-mono">{mattersCount}</div>
                      <div className="text-[10px] text-slate-400">Active Matters</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB 5: AUDIT TRAIL ═══ */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Immutable Audit Trail &amp; Access Log
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Every mutation, stage advancement, approval, and RBAC adjustment is recorded.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredAudits.map((log) => {
              const actor = users.find((u) => u.id === log.actorUserId);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 uppercase text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-slate-400 font-medium">
                        by {actor?.fullName || log.actorUserId}
                      </span>
                    </div>
                    {log.metadata && (
                      <div className="text-slate-500 font-mono text-[10px] mt-0.5 truncate">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-500 font-mono text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MODAL: INVITE STAFF ═══ */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">Invite New Staff Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Wanjiru Advocate"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="g.wanjiru@kklaw.co.ke"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Litigation Associate"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Bar Number (if Advocate)</label>
                  <input
                    type="text"
                    placeholder="P.105/18293/22"
                    value={newBarNumber}
                    onChange={(e) => setNewBarNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Primary Role</label>
                  <select
                    value={newPrimaryRole}
                    onChange={(e) => setNewPrimaryRole(e.target.value as RoleId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  >
                    {ALL_ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {INITIAL_ROLES[r]?.name || r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Assigned Branch</label>
                  <select
                    value={newHomeBranchId}
                    onChange={(e) => setNewHomeBranchId(e.target.value as BranchId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: BRANCH CREATE/EDIT ═══ */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                {editingBranch ? `Edit ${editingBranch.name}` : 'Create New Firm Branch'}
              </h2>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kisumu Branch Office"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Branch Code (3 Letters) *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="KSM"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Mega Plaza, 3rd Floor, Oginga Odinga St, Kisumu"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Telephone</label>
                  <input
                    type="tel"
                    placeholder="+254 57 202 1100"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="kisumu@kklaw.co.ke"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  {editingBranch ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: EDIT USER ROLES ═══ */}
      {editingUserRoles && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                  Configure Roles: {editingUserRoles.fullName}
                </h2>
                <span className="text-slate-500 dark:text-slate-400 text-xs">{editingUserRoles.jobTitle}</span>
              </div>
              <button onClick={() => setEditingUserRoles(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserRoles} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Primary Role</label>
                <select
                  value={editingUserRoles.role}
                  onChange={(e) => {
                    const newPrimary = e.target.value as RoleId;
                    setEditingUserRoles((prev) => (prev ? { ...prev, role: newPrimary, roles: Array.from(new Set([newPrimary, ...prev.roles])) } : null));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
                >
                  {ALL_ROLES_LIST.map((r) => (
                    <option key={r} value={r}>
                      {INITIAL_ROLES[r]?.name || r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">
                  Secondary Roles (Union of Permissions)
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
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
                          <span className="font-medium text-slate-200">
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

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Assigned Home Branch</label>
                <select
                  value={editingUserRoles.homeBranchId}
                  onChange={(e) => {
                    const branchId = e.target.value as BranchId;
                    setEditingUserRoles({
                      ...editingUserRoles,
                      homeBranchId: branchId,
                    });
                    updateUserBranch(editingUserRoles.id, branchId);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUserRoles(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow"
                >
                  Save Roles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
