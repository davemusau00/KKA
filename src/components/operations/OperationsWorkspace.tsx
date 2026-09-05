import React, { useState } from 'react';
import {
  Briefcase,
  Layers,
  PackageCheck,
  Building,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Laptop,
  Printer,
  Shield,
  FileSpreadsheet,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OperationsWorkspace: React.FC = () => {
  const { branches, expenses, users } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'procurement' | 'assets'>('projects');

  // Firm internal projects
  const [internalProjects, setInternalProjects] = useState([
    {
      id: 'proj-1',
      name: 'Judiciary CTS E-Filing System Upgrade',
      leader: 'Silas Ndung’u (Court Clerk)',
      budgetKes: 150000,
      spentKes: 95000,
      status: 'in_progress',
      deadline: '2026-09-30',
      description: 'Upgrading firm biometric tokens and CTS high-speed scanner hardware.',
    },
    {
      id: 'proj-2',
      name: 'Mombasa Branch Office Expansion',
      leader: 'Brenda Wambui (Senior Partner)',
      budgetKes: 800000,
      spentKes: 620000,
      status: 'in_progress',
      deadline: '2026-10-15',
      description: 'Fitting 4 new partner chambers and client conference suite in Mombasa.',
    },
    {
      id: 'proj-3',
      name: 'LSK Continuous Professional Development (CPD) Q3',
      leader: 'Anthony Kariuki, SC',
      budgetKes: 200000,
      spentKes: 180000,
      status: 'completed',
      deadline: '2026-08-31',
      description: 'Firm-wide litigation and medicolegal trial advocacy seminar.',
    },
  ]);

  // Asset registry
  const [assets, setAssets] = useState([
    {
      id: 'ast-1',
      tag: 'KKC-IT-001',
      name: 'Dell Precision 3660 Server (Primary DB & Vault)',
      branch: 'Nairobi HQ',
      valueKes: 450000,
      assignedTo: 'Firm Infrastructure',
      status: 'active',
      purchaseDate: '2024-06-15',
    },
    {
      id: 'ast-2',
      tag: 'KKC-IT-008',
      name: 'Kyocera TASKalfa 4053ci Heavy Duty Scanner/Printer',
      branch: 'Nairobi HQ',
      valueKes: 380000,
      assignedTo: 'Litigation Registry',
      status: 'active',
      purchaseDate: '2024-08-10',
    },
    {
      id: 'ast-3',
      tag: 'KKC-IT-014',
      name: 'HP EliteBook 840 G10 (Partner Laptop)',
      branch: 'Mombasa Branch',
      valueKes: 220000,
      assignedTo: 'Brenda Wambui',
      status: 'active',
      purchaseDate: '2025-01-20',
    },
  ]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-xs tracking-wider">
              Firm Administration
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
              Nairobi &bull; Mombasa
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Internal Operations &amp; Assets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Internal firm projects, asset tracking, procurement requisitions, and office management.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('projects')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'projects'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Firm Projects ({internalProjects.length})
        </button>
        <button
          onClick={() => setActiveSubTab('assets')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'assets'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Fixed Asset Registry ({assets.length})
        </button>
      </div>

      {/* Subtab 1: Projects */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {internalProjects.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                      p.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {p.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Due {p.deadline}</span>
                </div>

                <h3 className="font-serif font-bold text-slate-100 text-base">{p.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Lead:</span>
                    <span className="text-slate-200 font-medium">{p.leader}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Spent / Budget:</span>
                    <span className="text-amber-400 font-bold">
                      KES {p.spentKes.toLocaleString()} / KES {p.budgetKes.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (p.spentKes / p.budgetKes) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Assets */}
      {activeSubTab === 'assets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-slate-100 text-base">
              Firm Fixed Asset Inventory
            </h3>
            <span className="text-xs font-mono text-slate-400">Total Value: KES 1,050,000</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Custodian</th>
                  <th className="p-3 text-right">Value (KES)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-850 transition">
                    <td className="p-3 font-mono font-bold text-amber-400">{a.tag}</td>
                    <td className="p-3 font-medium text-slate-200">{a.name}</td>
                    <td className="p-3 text-slate-300">{a.branch}</td>
                    <td className="p-3 text-slate-300">{a.assignedTo}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      KES {a.valueKes.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
