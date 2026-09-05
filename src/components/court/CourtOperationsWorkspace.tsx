import React, { useState } from 'react';
import {
  Scale,
  Calendar,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ArrowUpRight,
  Filter,
  UserCheck,
  Building,
  MapPin,
  ExternalLink,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CourtFilingPackage, ServiceQueueItem } from '../../types';

export const CourtOperationsWorkspace: React.FC = () => {
  const {
    courtFilingPackages,
    serviceQueue,
    calendarEvents,
    matters,
    setSelectedMatterId,
    setActiveWorkspace,
    updateCourtFilingPackage,
    updateServiceQueueItem,
    addServiceAttempt,
    propagateCourtOutcomeDetailed,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'appearances' | 'filing' | 'service' | 'outcomes'>('appearances');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiling, setSelectedFiling] = useState<CourtFilingPackage | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceQueueItem | null>(null);

  // Outcome Quick Logger Modal State
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [outcomeForm, setOutcomeForm] = useState({
    matterId: matters[0]?.id || '',
    outcomeType: 'mention_held' as any,
    ordersSummary: '',
    nextDate: '',
    directions: '',
    costsAwardedKes: 0,
    sendSms: true,
  });

  // Filtered court hearings from calendar
  const courtHearings = calendarEvents.filter(
    (e) => e.eventType === 'hearing' || e.eventType === 'mention' || e.eventType === 'ruling' || e.eventType === 'judgment'
  );

  const pendingFilings = courtFilingPackages.filter((f) => f.status === 'pending_upload' || f.status === 'assessment_issued');
  const pendingServices = serviceQueue.filter((s) => s.serviceStatus !== 'served_effective');

  const handleLogOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeForm.matterId || !outcomeForm.ordersSummary) return;

    propagateCourtOutcomeDetailed(outcomeForm.matterId, {
      outcomeType: outcomeForm.outcomeType,
      ordersSummary: outcomeForm.ordersSummary,
      nextDate: outcomeForm.nextDate || undefined,
      directions: outcomeForm.directions || undefined,
      costsAwardedKes: Number(outcomeForm.costsAwardedKes) || undefined,
      sendSms: outcomeForm.sendSms,
    });

    setIsOutcomeModalOpen(false);
    setOutcomeForm({
      matterId: matters[0]?.id || '',
      outcomeType: 'mention_held',
      ordersSummary: '',
      nextDate: '',
      directions: '',
      costsAwardedKes: 0,
      sendSms: true,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-xs tracking-wider">
              Litigation Registry
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
              Judiciary CTS Integration Ready
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Court Operations &amp; Registry Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Unified management for Judiciary e-filing packages, process server dispatch, and instant court outcome propagation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOutcomeModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition"
          >
            <Scale className="w-4 h-4" />
            <span>+ Log Court Outcome</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('appearances')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'appearances'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Court Cause List &amp; Appearances</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-mono text-xs">
            {courtHearings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('filing')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'filing'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>E-Filing Queue</span>
          {pendingFilings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono text-xs">
              {pendingFilings.length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'service'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Process Service &amp; Returns</span>
          {pendingServices.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono text-xs">
              {pendingServices.length} Active
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Cause List & Appearances */}
      {activeTab === 'appearances' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-mono text-slate-400 uppercase">Upcoming Mentions &amp; Hearings</div>
              <div className="text-2xl font-serif font-bold text-slate-100 mt-1">{courtHearings.length}</div>
              <div className="text-xs text-amber-400 mt-1 font-mono">Milimani &amp; Mombasa Law Courts</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-mono text-slate-400 uppercase">Awaiting Formal Orders/Rulings</div>
              <div className="text-2xl font-serif font-bold text-slate-100 mt-1">2</div>
              <div className="text-xs text-emerald-400 mt-1 font-mono">Orders extractable from CTS</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-mono text-slate-400 uppercase">Virtual Courtroom Links</div>
              <div className="text-2xl font-serif font-bold text-slate-100 mt-1">4 Active</div>
              <div className="text-xs text-blue-400 mt-1 font-mono">MS Teams / Google Meet Live</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-serif font-bold text-slate-100 text-base">
                Scheduled Court Appearances
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real-time Firm Diary Sync</span>
            </div>

            <div className="divide-y divide-slate-800">
              {courtHearings.map((ev) => {
                const matter = matters.find((m) => m.id === ev.matterId);
                return (
                  <div
                    key={ev.id}
                    className="p-4 hover:bg-slate-850 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {ev.eventType}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(ev.startDate).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          at {ev.startTime}
                        </span>
                        {ev.location && (
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {ev.location}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-slate-100 text-sm">{ev.title}</h4>
                      {matter && (
                        <p className="text-xs text-slate-400 font-mono">
                          {matter.matterNumber} &bull; {matter.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {matter && (
                        <button
                          onClick={() => {
                            setSelectedMatterId(matter.id);
                            setActiveWorkspace('matters');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                        >
                          <span>Open Matter</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setOutcomeForm((prev) => ({
                            ...prev,
                            matterId: ev.matterId || matters[0]?.id || '',
                            ordersSummary: `Court held ${ev.title}. `,
                          }));
                          setIsOutcomeModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Record Outcome
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: E-Filing Queue */}
      {activeTab === 'filing' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-slate-100 text-base">
                  Judiciary CTS E-Filing Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Track plaint submissions, invoice assessments, and receipt stamping with the registry.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {courtFilingPackages.map((pkg) => {
                const matter = matters.find((m) => m.id === pkg.matterId);
                return (
                  <div
                    key={pkg.id}
                    className="p-4 hover:bg-slate-850 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{pkg.caseNumber}</span>
                        <span className="text-xs text-slate-400">&bull; {pkg.courtStation}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {pkg.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="font-medium text-slate-200 text-sm">{pkg.filingType}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        CTS Inv: {pkg.ctsInvoiceNumber || 'Pending'} &bull; Fee:{' '}
                        {pkg.filingFeeKes ? `KES ${pkg.filingFeeKes.toLocaleString()}` : 'Pending Assessment'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pkg.status !== 'accepted_sealed' && (
                        <button
                          onClick={() =>
                            updateCourtFilingPackage(pkg.id, {
                              status: 'accepted_sealed',
                              ctsTrackingNumber: `CTS-SEAL-${Date.now().toString().slice(-5)}`,
                              completedAt: new Date().toISOString(),
                            })
                          }
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Sealed</span>
                        </button>
                      )}

                      {matter && (
                        <button
                          onClick={() => {
                            setSelectedMatterId(matter.id);
                            setActiveWorkspace('matters');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                        >
                          View Matter
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Process Service */}
      {activeTab === 'service' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-slate-100 text-base">
                  Process Server Dispatch &amp; Affidavits of Service
                </h3>
                <p className="text-xs text-slate-400">
                  Manage licensed process server dispatch, multiple service attempts, and sworn affidavits.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {serviceQueue.map((srv) => {
                const matter = matters.find((m) => m.id === srv.matterId);
                return (
                  <div
                    key={srv.id}
                    className="p-4 hover:bg-slate-850 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {srv.targetPartyName} ({srv.partyRole})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800">
                          {srv.serviceMethod.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">&bull; {srv.serviceStatus.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Assigned: <strong className="text-slate-100">{srv.assignedProcessServerName}</strong> ({srv.processServerPhone})
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {srv.targetAddress}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {srv.serviceStatus !== 'served_effective' && (
                        <button
                          onClick={() => {
                            addServiceAttempt(srv.id, {
                              attemptNo: (srv.attempts?.length || 0) + 1,
                              date: new Date().toISOString(),
                              outcome: 'Served upon managing director at registered office.',
                              notes: 'Received and endorsed with company rubber stamp.',
                            });
                            updateServiceQueueItem(srv.id, {
                              serviceStatus: 'served_effective',
                              servedAt: new Date().toISOString(),
                              affidavitOfServiceStatus: 'sworn_commissioner',
                            });
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Endorse Effective Service</span>
                        </button>
                      )}

                      {matter && (
                        <button
                          onClick={() => {
                            setSelectedMatterId(matter.id);
                            setActiveWorkspace('matters');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                        >
                          View Matter
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Court Outcome Modal */}
      {isOutcomeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-100 text-base">
                  Instant Court Outcome Propagation
                </h3>
                <p className="text-slate-400 text-xs">
                  Updates matter status, syncs firm diary, creates follow-up tasks, and alerts client via SMS.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogOutcome} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Matter *</label>
                <select
                  value={outcomeForm.matterId}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, matterId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matterNumber}: {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Outcome Event Type</label>
                  <select
                    value={outcomeForm.outcomeType}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="mention_held">Mention Held</option>
                    <option value="directions_given">Directions Given</option>
                    <option value="hearing_conducted">Hearing Conducted</option>
                    <option value="ruling_delivered">Ruling Delivered</option>
                    <option value="judgment_delivered">Judgment Delivered</option>
                    <option value="adjourned">Adjourned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Next Court Date</label>
                  <input
                    type="date"
                    value={outcomeForm.nextDate}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, nextDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Court Orders &amp; Summary *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Plaint admitted. Defendant granted 14 days to file Statement of Defense. Mention on 24th Oct for pre-trial conference."
                  value={outcomeForm.ordersSummary}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, ordersSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Costs Awarded (KES)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={outcomeForm.costsAwardedKes || ''}
                    onChange={(e) => setOutcomeForm({ ...outcomeForm, costsAwardedKes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={outcomeForm.sendSms}
                      onChange={(e) => setOutcomeForm({ ...outcomeForm, sendSms: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-amber-600 focus:ring-0"
                    />
                    <span>Auto-send SMS to Client</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOutcomeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-lg"
                >
                  Propagate Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
