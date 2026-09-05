import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, IntakeLead } from '../../types';
import { ClientPortalView } from './ClientPortalView';

export const ClientsWorkspace: React.FC = () => {
  const {
    clients,
    intakes,
    matters,
    createClient,
    convertIntakeToMatter,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'intake' | 'client_portal'>('clients');
  const [selectedPortalClientId, setSelectedPortalClientId] = useState<string>('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'person' | 'organization'>('person');
  const [newClientPhone, setNewClientPhone] = useState('+254 7');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientIdNumber, setNewClientIdNumber] = useState('');

  // Intake Conversion Modal
  const [selectedIntake, setSelectedIntake] = useState<IntakeLead | null>(null);

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.idNumber && c.idNumber.includes(q))
    );
  });

  const filteredIntakes = intakes.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.clientName.toLowerCase().includes(q) ||
      i.briefDescription.toLowerCase().includes(q)
    );
  });

  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    createClient({
      clientType: newClientType,
      displayName: newClientName,
      phone: newClientPhone,
      email: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@client.ke`,
      idNumber: newClientIdNumber || 'A/C PENDING',
      physicalAddress: 'Nairobi, Kenya',
      preferredContactMethod: 'phone',
      status: 'active',
      notes: 'Onboarded via Clients Directory',
    });

    setShowNewClientModal(false);
    setNewClientName('');
    setNewClientPhone('+254 7');
    setNewClientEmail('');
    setNewClientIdNumber('');
  };

  const handleConvertIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntake) return;

    convertIntakeToMatter(selectedIntake.id);
    setSelectedIntake(null);
    setActiveWorkspace('matters');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Directory &amp; Intake
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {clients.length} Retained Clients &bull; {intakes.filter((i) => i.disposition !== 'converted').length} Inquiries
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Client Portfolio &amp; Conflict Clearance
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Client Onboarding</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'clients'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Client Directory ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'intake'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prospective Leads &amp; Inquiries ({intakes.filter((i) => i.disposition !== 'converted').length})
          </button>
          <button
            onClick={() => setActiveTab('client_portal')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'client_portal'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Client Self-Service Portal</span>
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, phone, national ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-amber-500 text-xs"
          />
        </div>
      </div>

      {/* TAB 1: CLIENTS DIRECTORY */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientMatters = matters.filter((m) => m.clientId === client.id);

            return (
              <div
                key={client.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                      {client.clientType}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Client
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-100">{client.displayName}</h3>

                  <div className="space-y-1 text-slate-400 text-xs">
                    {client.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.idNumber && (
                      <div className="font-mono text-[11px] text-slate-500">
                        National ID / Reg: {client.idNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Matters List */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">
                    Associated Matters ({clientMatters.length})
                  </div>
                  {clientMatters.length === 0 ? (
                    <div className="text-slate-500 italic text-[11px]">No active litigation files.</div>
                  ) : (
                    <div className="space-y-1">
                      {clientMatters.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMatterId(m.id);
                            setActiveWorkspace('matters');
                          }}
                          className="p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-[11px] transition"
                        >
                          <span className="font-mono text-amber-400 font-bold">{m.internalReference}</span>
                          <span className="truncate max-w-[140px] text-slate-300">{m.title}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Portal Quick Action */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedPortalClientId(client.id);
                      setActiveTab('client_portal');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/30 text-amber-300 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Open Client Portal View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: INTAKE & PROSPECTIVE LEADS */}
      {activeTab === 'intake' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold text-slate-100">Intake Triage &amp; Conflict Clearance</div>
                <div className="text-slate-400 text-[11px]">
                  Prospective inquiries undergo conflict checking against past matters and opposing parties.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredIntakes.map((intake) => (
              <div
                key={intake.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">{intake.clientName}</h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase">
                      {intake.disposition.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Received: {new Date(intake.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-slate-400 text-xs">
                    📞 {intake.phone} &bull; ✉️ {intake.email || 'N/A'} &bull; Source: {intake.source}
                  </div>

                  <p className="text-slate-300 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    &ldquo;{intake.briefDescription}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1">
                      ✓ Conflict Cleared (No Adverse Parties Found)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {intake.disposition === 'converted' ? (
                    <span className="text-slate-400 text-xs font-mono">Converted to Matter</span>
                  ) : (
                    <button
                      onClick={() => setSelectedIntake(intake)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition flex items-center gap-1.5 shadow"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Convert to Matter</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLIENT SELF-SERVICE PORTAL */}
      {activeTab === 'client_portal' && (
        <ClientPortalView initialClientId={selectedPortalClientId || clients[0]?.id} />
      )}

      {/* MODAL: ONBOARD NEW CLIENT */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateClientSubmit} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-100">
                Register New Client Profile
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                KYC &amp; Onboarding
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Client Classification</label>
                <select
                  value={newClientType}
                  onChange={(e) => setNewClientType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                >
                  <option value="person">Individual (Natural Person)</option>
                  <option value="organization">Corporate / Entity</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">National ID / Reg No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24891230"
                  value={newClientIdNumber}
                  onChange={(e) => setNewClientIdNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Full Name / Legal Entity Name</label>
              <input
                type="text"
                required
                placeholder="e.g. David Mutiso Kilonzo"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Primary Phone (M-Pesa / SMS)</label>
                <input
                  type="text"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. client@gmail.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow"
              >
                Create Client File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONVERT INTAKE LEAD TO MATTER */}
      {selectedIntake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleConvertIntake} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-100">
                Promote Lead to Active Litigation Matter
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                Conflict Cleared
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-200">{selectedIntake.clientName}</div>
              <div className="text-slate-400 text-xs">{selectedIntake.phone}</div>
              <p className="text-slate-400 text-xs italic pt-1">&ldquo;{selectedIntake.briefDescription}&rdquo;</p>
            </div>

            <p className="text-xs text-slate-300">
              Converting will auto-generate an internal reference number (e.g. <code>KKC/PI/2026/00428</code>), create a primary client file, and initiate Stage 1 (Client Onboarding &amp; Retainer).
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedIntake(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Confirm &amp; Open Matter</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
