import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Check,
  Search,
  Lock,
  Info,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { RoleId, PermissionKey } from '../../../types';
import { ALL_PERMISSIONS, INITIAL_ROLES } from '../../../data/rbacData';
import { ALL_ROLES_LIST } from './StaffDirectoryTab';

export const PermissionMatrixTab: React.FC = () => {
  const {
    rolePermissionsMap,
    updateRolePermissions,
    resetRolePermissionsToDefault,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Categories extracted from ALL_PERMISSIONS
  const permissionCategories = useMemo(() => {
    const cats = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.category)));
    return ['all', ...cats];
  }, []);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return ALL_PERMISSIONS.filter((p) => {
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, search]);

  const handleTogglePermission = (role: RoleId, permission: PermissionKey) => {
    const currentPerms = rolePermissionsMap[role] || [];
    const hasIt = currentPerms.includes(permission);
    const updatedPerms = hasIt
      ? currentPerms.filter((p) => p !== permission)
      : [...currentPerms, permission];
    updateRolePermissions(role, updatedPerms);
  };

  return (
    <div className="admin-tab-content">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h2>
          <p className="admin-section-desc">
            Define granular permissions across 8 organizational tiers and {ALL_PERMISSIONS.length} operational capabilities.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset role permissions for all 8 roles to original firm statutory defaults?')) {
              resetRolePermissionsToDefault();
            }
          }}
          className="admin-btn-secondary text-rose-400 hover:text-rose-300 border-rose-900/50 hover:bg-rose-950/40"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Roles to Defaults</span>
        </button>
      </div>

      {/* Role Permission Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
        {ALL_ROLES_LIST.map((r) => {
          const roleDef = INITIAL_ROLES[r];
          const grantedCount = (rolePermissionsMap[r] || []).length;
          const percentage = Math.round((grantedCount / ALL_PERMISSIONS.length) * 100);

          return (
            <div
              key={r}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-[11px] text-slate-200 truncate" title={roleDef?.name}>
                  {roleDef?.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-amber-500 font-mono mt-0.5">
                  {grantedCount} / {ALL_PERMISSIONS.length}
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-slate-400 font-medium text-xs whitespace-nowrap mr-1">
            Category:
          </span>
          {permissionCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs capitalize whitespace-nowrap font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter permission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>
      </div>

      {/* RBAC Matrix Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="p-3.5 min-w-[280px]">Capability &amp; Permission Key</th>
              <th className="p-3.5 min-w-[100px]">Module</th>
              {ALL_ROLES_LIST.map((r) => {
                const roleDef = INITIAL_ROLES[r];
                return (
                  <th key={r} className="p-3 text-center min-w-[105px]">
                    <div className="font-bold text-slate-200 truncate">
                      {roleDef?.name.replace('Managing Partner (Senior Partner)', 'Senior Partner')}
                    </div>
                    <div className="text-[10px] text-amber-500 lowercase font-normal">
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
                    <td key={r} className="p-3 text-center">
                      <button
                        onClick={() => handleTogglePermission(r, perm.key)}
                        disabled={isSenior}
                        className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition ${
                          hasPerm
                            ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-700 text-transparent hover:border-slate-500'
                        } ${isSenior ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={
                          isSenior
                            ? 'Senior Partner holds permanent statutory authority'
                            : hasPerm
                            ? 'Click to revoke permission'
                            : 'Click to grant permission'
                        }
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
  );
};
