import React, { useState } from 'react';
import {
  Key,
  Shield,
  UserCheck,
  Check,
  Edit2,
  X,
  Layers,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { RoleId, UserProfile, PermissionKey } from '../../../types';
import { ALL_PERMISSIONS, INITIAL_ROLES, PermissionDefinition } from '../../../data/rbacData';
import { ALL_ROLES_LIST } from './StaffDirectoryTab';

export const RoleAssignmentTab: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    updateUserRoles,
    rolePermissionsMap,
  } = useApp();

  const [selectedUser, setSelectedUser] = useState<UserProfile>(currentUser);
  const [editingModalUser, setEditingModalUser] = useState<UserProfile | null>(null);

  // Compute effective permissions for selected user (union of all roles)
  const effectivePermissions = React.useMemo(() => {
    const userInList = users.find((u) => u.id === selectedUser.id) || selectedUser;
    const permSet = new Set<PermissionKey>();
    userInList.roles.forEach((r) => {
      const perms = rolePermissionsMap[r] || [];
      perms.forEach((p) => permSet.add(p));
    });
    return Array.from(permSet);
  }, [selectedUser, users, rolePermissionsMap]);

  // Group effective permissions by category
  const permissionsByCategory = React.useMemo(() => {
    const grouped: Record<string, PermissionDefinition[]> = {};
    ALL_PERMISSIONS.forEach((p) => {
      if (effectivePermissions.includes(p.key)) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      }
    });
    return grouped;
  }, [effectivePermissions]);

  const handleSaveModalRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModalUser) return;
    updateUserRoles(editingModalUser.id, editingModalUser.roles);
    if (selectedUser.id === editingModalUser.id) {
      setSelectedUser(editingModalUser);
    }
    setEditingModalUser(null);
  };

  return (
    <div className="admin-tab-content">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            <Key className="w-5 h-5 text-amber-500" />
            <span>Staff Persona &amp; Multi-Role Assignment</span>
          </h2>
          <p className="admin-section-desc">
            Assign primary and secondary roles with automatic permission union calculation, and simulate staff perspectives.
          </p>
        </div>
      </div>

      {/* Persona Simulator & Active User Switcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-600/30 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-bold text-sm text-slate-100">
              Live Persona Simulator &amp; Inspection Bench
            </span>
          </div>
          <span className="text-xs text-amber-400/90 font-mono bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-700/50">
            Active System User: {currentUser.fullName} ({INITIAL_ROLES[currentUser.role]?.name})
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Select any personnel below to inspect their effective permission boundaries across practice modules, or switch active persona to experience the interface through their access rights.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
          {users.map((u) => {
            const isInspecting = selectedUser.id === u.id;
            const isCurrent = currentUser.id === u.id;

            return (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                  isInspecting
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt={u.fullName}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-medium text-xs truncate text-slate-200">
                    {u.fullName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {INITIAL_ROLES[u.role]?.name.split(' ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected User Effective Permissions Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* User Card */}
        <div className="admin-card space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={selectedUser.fullName}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-base text-slate-100 truncate">
                {selectedUser.fullName}
              </h3>
              <div className="text-slate-400 text-xs truncate">{selectedUser.jobTitle}</div>
              <div className="text-amber-400 font-mono text-[11px] mt-0.5">{selectedUser.email}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Primary Role:</span>
              <span className="font-semibold text-amber-400 uppercase font-mono text-[11px]">
                {INITIAL_ROLES[selectedUser.role]?.name || selectedUser.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Secondary Roles:</span>
              <span className="text-slate-200 font-mono text-[11px]">
                {selectedUser.roles.filter((r) => r !== selectedUser.role).length > 0
                  ? selectedUser.roles
                      .filter((r) => r !== selectedUser.role)
                      .map((r) => INITIAL_ROLES[r]?.name || r)
                      .join(', ')
                  : 'None'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Effective Perms:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {effectivePermissions.length} / {ALL_PERMISSIONS.length} capabilities
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <button
              onClick={() => setEditingModalUser(selectedUser)}
              className="flex-1 admin-btn-secondary"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modify Roles</span>
            </button>
            <button
              onClick={() => setCurrentUser(selectedUser)}
              disabled={currentUser.id === selectedUser.id}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                currentUser.id === selectedUser.id
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
              }`}
            >
              {currentUser.id === selectedUser.id ? 'Active Persona' : 'Switch To Persona'}
            </button>
          </div>
        </div>

        {/* Granted Capabilities Breakdown */}
        <div className="lg:col-span-2 admin-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif font-bold text-sm text-slate-100">
                Effective Access Capabilities for {selectedUser.fullName}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {effectivePermissions.length} Granted
            </span>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {Object.keys(permissionsByCategory).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No permissions mapped for current role setup.</p>
            ) : (
              (Object.entries(permissionsByCategory) as [string, PermissionDefinition[]][]).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-amber-500 font-bold tracking-wider">
                    {category} ({perms.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map((p) => (
                      <div
                        key={p.key}
                        className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 text-xs">{p.label}</div>
                          <div className="text-slate-400 text-[10px] truncate">{p.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Staff Roster Table with In-line Role Pickers */}
      <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="p-3.5">Staff Member</th>
              <th className="p-3.5">Primary Role</th>
              <th className="p-3.5">Assigned Secondary Roles</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {users.map((u) => (
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
                            if (isPrimary) return;
                            const nextRoles = isAssigned
                              ? u.roles.filter((role) => role !== r)
                              : [...u.roles, r];
                            updateUserRoles(u.id, nextRoles);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                            isPrimary
                              ? 'bg-amber-950 border-amber-700 text-amber-300 font-bold cursor-default'
                              : isAssigned
                              ? 'bg-blue-950 border-blue-700 text-blue-300 hover:border-rose-700 hover:text-rose-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                          }`}
                          title={isPrimary ? 'Primary Role' : isAssigned ? 'Click to revoke role' : 'Click to assign role'}
                        >
                          {r.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setEditingModalUser(u);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs"
                  >
                    Configure
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Edit Roles */}
      {editingModalUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Configure Roles: {editingModalUser.fullName}</h3>
                <span className="text-slate-400 text-xs">{editingModalUser.jobTitle}</span>
              </div>
              <button
                onClick={() => setEditingModalUser(null)}
                className="admin-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalRoles} className="space-y-4">
              <div className="admin-field-group">
                <label className="admin-field-label">Primary Role</label>
                <select
                  value={editingModalUser.role}
                  onChange={(e) => {
                    const newPrimary = e.target.value as RoleId;
                    setEditingModalUser((prev) =>
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
                  Secondary Roles (Union of Access Permissions)
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {ALL_ROLES_LIST.map((r) => {
                    const isChecked = editingModalUser.roles.includes(r);
                    const isPrimary = editingModalUser.role === r;

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
                                ? [...editingModalUser.roles, r]
                                : editingModalUser.roles.filter((role) => role !== r);
                              setEditingModalUser({ ...editingModalUser, roles: next });
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

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingModalUser(null)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
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
