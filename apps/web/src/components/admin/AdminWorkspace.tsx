import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  Landmark,
  Building2,
  Hash,
  Stamp,
  Briefcase,
  FileCheck,
  Receipt,
  Cpu,
  Clock,
  RotateCcw,
  Sparkles,
  Search,
  Sliders,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Import all 12 Admin Studio Tabs
import { StaffDirectoryTab } from './tabs/StaffDirectoryTab';
import { PermissionMatrixTab } from './tabs/PermissionMatrixTab';
import { RoleAssignmentTab } from './tabs/RoleAssignmentTab';
import { FirmProfileTab } from './tabs/FirmProfileTab';
import { BranchesTab } from './tabs/BranchesTab';
import { NumberingSchemesTab } from './tabs/NumberingSchemesTab';
import { FirmMarksStampsTab } from './tabs/FirmMarksStampsTab';
import { PracticeCustomFieldsTab } from './tabs/PracticeCustomFieldsTab';
import { DocumentPoliciesTab } from './tabs/DocumentPoliciesTab';
import { FinancePolicyTab } from './tabs/FinancePolicyTab';
import { SystemOperationsTab } from './tabs/SystemOperationsTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';

export type AdminTabKey =
  | 'staff'
  | 'matrix'
  | 'roles'
  | 'firmProfile'
  | 'branches'
  | 'numbering'
  | 'marksStamps'
  | 'practiceFields'
  | 'documentPolicies'
  | 'financePolicy'
  | 'systemOps'
  | 'audit';

interface TabGroup {
  label: string;
  tabs: {
    key: AdminTabKey;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badge?: string | number;
    description: string;
  }[];
}

export const AdminWorkspace: React.FC = () => {
  const {
    currentUser,
    users,
    branches,
    auditLogs,
    resetDataToDefault,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTabKey>('staff');
  const [tabSearch, setTabSearch] = useState('');

  const tabGroups: TabGroup[] = [
    {
      label: 'Identity & Access',
      tabs: [
        {
          key: 'staff',
          label: 'Staff Directory',
          shortLabel: 'Staff',
          icon: Users,
          badge: users.length,
          description: 'Staff accounts, branch assignments & onboarding',
        },
        {
          key: 'matrix',
          label: 'Permission Matrix',
          shortLabel: 'RBAC Matrix',
          icon: ShieldCheck,
          description: '8 roles × 35+ permissions across 7 categories',
        },
        {
          key: 'roles',
          label: 'Persona & Roles',
          shortLabel: 'Personas',
          icon: Key,
          description: 'Multi-role unions & live persona switcher',
        },
      ],
    },
    {
      label: 'Organization & Registries',
      tabs: [
        {
          key: 'firmProfile',
          label: 'Firm Profile',
          shortLabel: 'Profile',
          icon: Landmark,
          description: 'LSK Firm Reg, KRA PIN, VAT, contact & court rules',
        },
        {
          key: 'branches',
          label: 'Branch Registries',
          shortLabel: 'Branches',
          icon: Building2,
          badge: branches.length,
          description: 'Nairobi HQ, Mombasa branch & jurisdictional offices',
        },
        {
          key: 'numbering',
          label: 'Numbering Schemes',
          shortLabel: 'Sequences',
          icon: Hash,
          description: 'Matter, client, invoice & receipt reference patterns',
        },
      ],
    },
    {
      label: 'Legal Practice & Governance',
      tabs: [
        {
          key: 'marksStamps',
          label: 'Marks, Seals & Stamps',
          shortLabel: 'Firm Marks',
          icon: Stamp,
          description: 'Official seal, operational stamps & execution blocks (Doc 21)',
        },
        {
          key: 'practiceFields',
          label: 'Practice & Custom Fields',
          shortLabel: 'Custom Fields',
          icon: Briefcase,
          description: 'PI, Commercial, Conveyancing & metadata schemas',
        },
        {
          key: 'documentPolicies',
          label: 'Document Policies',
          shortLabel: 'Doc Policies',
          icon: FileCheck,
          description: 'Advocate sign-off, watermarks & 7-yr retention',
        },
      ],
    },
    {
      label: 'Finance & Operations',
      tabs: [
        {
          key: 'financePolicy',
          label: 'Finance & Rate Cards',
          shortLabel: 'Finance',
          icon: Receipt,
          description: '16% VAT, ARO rate cards, trust accounts & Paybill',
        },
        {
          key: 'systemOps',
          label: 'System Ops & Backups',
          shortLabel: 'System Ops',
          icon: Cpu,
          description: 'VPS metrics, DB snapshots & diagnostic bundles (Doc 30)',
        },
        {
          key: 'audit',
          label: 'Audit Trail',
          shortLabel: 'Audit Logs',
          icon: Clock,
          badge: auditLogs.length,
          description: 'Immutable chronological event & security logs',
        },
      ],
    },
  ];

  // Flat list for search filtering
  const allTabs = tabGroups.flatMap((g) => g.tabs);
  const filteredTabs = tabSearch.trim()
    ? allTabs.filter(
        (t) =>
          t.label.toLowerCase().includes(tabSearch.toLowerCase()) ||
          t.description.toLowerCase().includes(tabSearch.toLowerCase())
      )
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>KKA Advocates Configuration Studio</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              12 Governance Domains
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            System Administration, RBAC &amp; Statutory Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Persona: <span className="text-amber-400 font-medium">{currentUser.fullName}</span> ({currentUser.jobTitle})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Reset all demo state to original Kariuki Kagunda Lawfirm OS seed data?')) {
                resetDataToDefault();
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium flex items-center gap-1.5 transition cursor-pointer text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      {/* Domain Navigation Groups */}
      <div className="space-y-3">
        {/* Navigation Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-xl space-y-2">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Administration &amp; Operations Domains
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick find domain..."
                  value={tabSearch}
                  onChange={(e) => setTabSearch(e.target.value)}
                  className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none text-[11px] w-32 sm:w-44"
                />
              </div>
            </div>
          </div>

          {filteredTabs ? (
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/60">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setTabSearch('');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 pt-1">
              {tabGroups.map((group) => (
                <div
                  key={group.label}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5"
                >
                  <div className="text-[10px] font-mono uppercase text-amber-400/80 font-bold px-1 tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.key;

                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                            isActive
                              ? 'bg-amber-600 text-white font-semibold shadow'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-white' : 'text-amber-500'
                              }`}
                            />
                            <span className="truncate text-xs">{tab.label}</span>
                          </div>
                          {tab.badge !== undefined && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="bg-slate-900/40 rounded-2xl">
        {activeTab === 'staff' && <StaffDirectoryTab />}
        {activeTab === 'matrix' && <PermissionMatrixTab />}
        {activeTab === 'roles' && <RoleAssignmentTab />}
        {activeTab === 'firmProfile' && <FirmProfileTab />}
        {activeTab === 'branches' && <BranchesTab />}
        {activeTab === 'numbering' && <NumberingSchemesTab />}
        {activeTab === 'marksStamps' && <FirmMarksStampsTab />}
        {activeTab === 'practiceFields' && <PracticeCustomFieldsTab />}
        {activeTab === 'documentPolicies' && <DocumentPoliciesTab />}
        {activeTab === 'financePolicy' && <FinancePolicyTab />}
        {activeTab === 'systemOps' && <SystemOperationsTab />}
        {activeTab === 'audit' && <AuditLogsTab />}
      </div>
    </div>
  );
};
