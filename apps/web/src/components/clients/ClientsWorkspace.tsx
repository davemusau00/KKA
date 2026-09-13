import React, { useEffect, useState } from 'react';
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
  X,
  ExternalLink,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, IntakeLead } from '../../types';
import { ClientPortalView } from './ClientPortalView';
import { IntakeWorkflowManager } from '../intake/IntakeWorkflowManager';
import { DirectoryWorkspace } from '../directory/DirectoryWorkspace';
import { parseWorkspaceLocation, navigateToResource } from '../../lib/routing/workspaceRoutes';

export const ClientsWorkspace: React.FC = () => {
  const {
    clients,
    intakes,
    matters,
    createClient,
    updateClient,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'intake' | 'directory' | 'client_portal'>('intake');
  const [selectedPortalClientId, setSelectedPortalClientId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  useEffect(() => {
    const applyDetailRoute = () => {
      const route = parseWorkspaceLocation(window.location.pathname, window.location.search);
      if (route.workspace === 'clients' && route.resourceType === 'client' && route.resourceId) {
        setSelectedClientId(route.resourceId);
        setActiveTab('clients');
      } else if (route.workspace === 'clients' && !route.resourceId) {
        setSelectedClientId(null);
      }
    };
    applyDetailRoute();
    window.addEventListener('popstate', applyDetailRoute);
    return () => window.removeEventListener('popstate', applyDetailRoute);
  }, []);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    navigateToResource({ workspace: 'clients', resourceType: 'client', resourceId: clientId });
  };

  const handleCloseClientDetail = () => {
    setSelectedClientId(null);
    navigateToResource({ workspace: 'clients' });
  };

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'person' | 'organization'>('person');
  const [newClientPhone, setNewClientPhone] = useState('+254 7');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientIdNumber, setNewClientIdNumber] = useState('');

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
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Third-Party Directory</span>
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
                    {client.kycStatus === 'verified' || !client.kycStatus ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
                      </span>
                    ) : client.kycStatus === 'pending' ? (
                      <button
                        onClick={() =>
                          updateClient(client.id, {
                            kycStatus: 'verified',
                            kycVerifiedAt: new Date().toISOString(),
                          })
                        }
                        className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/60 hover:bg-amber-900/80 px-2 py-0.5 rounded-full border border-amber-800 transition"
                        title="Click to mark KYC verified"
                      >
                        <AlertTriangle className="w-3 h-3" /> KYC Pending (Verify)
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          updateClient(client.id, {
                            kycStatus: 'verified',
                            kycVerifiedAt: new Date().toISOString(),
                          })
                        }
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 font-medium bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-full transition"
                      >
                        <ShieldCheck className="w-3 h-3" /> Verify KYC
                      </button>
                    )}
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

                {/* Client Actions */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleSelectClient(client.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Record</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPortalClientId(client.id);
                      setActiveTab('client_portal');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/30 text-amber-300 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                    title="Open Client Portal View"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: INTAKE & PROSPECTIVE LEADS */}
      {activeTab === 'intake' && (
        <IntakeWorkflowManager />
      )}

      {/* TAB 3: THIRD-PARTY REUSABLE DIRECTORY */}
      {activeTab === 'directory' && (
        <DirectoryWorkspace />
      )}

      {/* TAB 4: CLIENT SELF-SERVICE PORTAL */}
      {activeTab === 'client_portal' && (
        <ClientPortalView initialClientId={selectedPortalClientId || clients[0]?.id} />
      )}

      {/* MODAL: ONBOARD NEW CLIENT */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateClientSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                Register New Client Profile
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-transparent">
                KYC &amp; Onboarding
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Client Classification</label>
                <select
                  value={newClientType}
                  onChange={(e) => setNewClientType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="person">Individual (Natural Person)</option>
                  <option value="organization">Corporate / Entity</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">National ID / Reg No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24891230"
                  value={newClientIdNumber}
                  onChange={(e) => setNewClientIdNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
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
      {/* Focused Client Detail Modal for URL Deep-Linking */}
      {selectedClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {(() => {
              const selectedClient = clients.find((c) => c.id === selectedClientId);
              if (!selectedClient) {
                return (
                  <div className="text-center py-8 space-y-4">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                    <h3 className="text-lg font-serif font-bold text-slate-100">Client Record Not Found</h3>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      The requested client ID <code className="font-mono text-amber-400">{selectedClientId}</code> does not exist or your account does not have permission to view it.
                    </p>
                    <button
                      onClick={handleCloseClientDetail}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold text-xs"
                    >
                      Return to Directory
                    </button>
                  </div>
                );
              }

              const clientMatters = matters.filter((m) => m.clientId === selectedClient.id);

              return (
                <>
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          {selectedClient.clientType}
                        </span>
                        {selectedClient.kycStatus === 'verified' || !selectedClient.kycStatus ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                            <ShieldCheck className="w-3 h-3" /> KYC Verified
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              updateClient(selectedClient.id, {
                                kycStatus: 'verified',
                                kycVerifiedAt: new Date().toISOString(),
                              })
                            }
                            className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/60 hover:bg-amber-900/80 px-2 py-0.5 rounded-full border border-amber-800 transition"
                          >
                            <AlertTriangle className="w-3 h-3" /> Verify KYC Now
                          </button>
                        )}
                      </div>
                      <h2 className="text-xl font-serif font-bold text-slate-100 mt-1">{selectedClient.displayName}</h2>
                      <p className="text-xs text-slate-400 font-mono">Client ID: {selectedClient.id}</p>
                    </div>
                    <button
                      onClick={handleCloseClientDetail}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Contact Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">Phone Number</span>
                      <div className="flex items-center gap-2 text-slate-200 text-xs mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>{selectedClient.phone || 'None provided'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">Email Address</span>
                      <div className="flex items-center gap-2 text-slate-200 text-xs mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>{selectedClient.email || 'None provided'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">National ID / Registration</span>
                      <div className="text-slate-200 font-mono text-xs mt-0.5">
                        {selectedClient.idNumber || 'Not recorded'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">Physical Address</span>
                      <div className="text-slate-200 text-xs mt-0.5">
                        {selectedClient.physicalAddress || 'Nairobi, Kenya'}
                      </div>
                    </div>
                  </div>

                  {/* Associated Matters */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono font-bold uppercase text-xs text-slate-300 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        <span>Active Matters &amp; Files ({clientMatters.length})</span>
                      </h4>
                    </div>

                    {clientMatters.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                        No active litigation or advisory files linked to this client.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientMatters.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMatterId(m.id);
                              setActiveWorkspace('matters');
                              navigateToResource({ workspace: 'matters', matterId: m.id });
                            }}
                            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-600/50 cursor-pointer flex items-center justify-between transition group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-amber-400 font-bold text-xs">{m.internalReference}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                                  {m.caseType || 'Personal Injury'}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-slate-200 mt-1">{m.title}</div>
                              {m.nextAction && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Next Action: <span className="text-amber-300">{m.nextAction}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-400 transition text-xs">
                              <span>Open File</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedPortalClientId(selectedClient.id);
                        setActiveTab('client_portal');
                        handleCloseClientDetail();
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 font-semibold text-xs flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Launch Client Portal View</span>
                    </button>
                    <button
                      onClick={handleCloseClientDetail}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
                    >
                      Done
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
