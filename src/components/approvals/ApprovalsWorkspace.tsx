import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Scale,
  ArrowRight,
  Filter,
  Search,
  AlertTriangle,
  UserCheck,
  Building2,
  ShieldCheck,
  FileCheck,
  Send,
  Eye,
  Check,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseRecord, LegalDocument, StageHandoff } from '../../types';

type ApprovalTab = 'all' | 'finance' | 'documents' | 'settlements' | 'handoffs' | 'closures';

export const ApprovalsWorkspace: React.FC = () => {
  const {
    expenses,
    approveExpense,
    disburseExpense,
    documents,
    approveDocumentVersion,
    rejectDocumentVersion,
    signDocumentVersion,
    stageHandoffs,
    acknowledgeHandoff,
    claimNegotiations,
    approveSettlementOffer,
    closureAudits,
    finalizeMatterClosureWizard,
    matters,
    users,
    currentUser,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ApprovalTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectDocModal, setRejectDocModal] = useState<{ docId: string; verId: string; docTitle: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [disburseModal, setDisburseModal] = useState<ExpenseRecord | null>(null);
  const [paymentSource, setPaymentSource] = useState<'Petty Cash' | 'Office Bank Account'>('Office Bank Account');

  // Pending items computation
  const pendingExpenses = expenses.filter((e) => e.status === 'submitted');
  
  const pendingDocs: { doc: LegalDocument; version: any }[] = [];
  documents.forEach((doc) => {
    doc.versions.forEach((v) => {
      if (v.status === 'in_review') {
        pendingDocs.push({ doc, version: v });
      }
    });
  });

  const pendingSettlements = Object.entries(claimNegotiations)
    .filter(([_, data]) => data.settlementApproval && !data.settlementApproval.partnerApproved && data.settlementApproval.recommendedAmount > 0)
    .map(([matterId, data]) => ({ matterId, data }));

  const pendingHandoffs = stageHandoffs.filter((h) => !h.acknowledgedAt);

  const pendingClosures = matters
    .filter((m) => m.currentStageId === 19 && m.status === 'active')
    .map((m) => ({
      matter: m,
      audit: closureAudits[m.id],
    }));

  const totalPendingCount =
    pendingExpenses.length +
    pendingDocs.length +
    pendingSettlements.length +
    pendingHandoffs.length +
    pendingClosures.length;

  const totalExpenseAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getMatter = (matterId?: string) => (matterId ? matters.find((m) => m.id === matterId) : undefined);
  const getUser = (userId?: string) => (userId ? users.find((u) => u.id === userId) : undefined);

  const handleDisburseConfirm = () => {
    if (!disburseModal) return;
    disburseExpense(disburseModal.id, paymentSource);
    setDisburseModal(null);
  };

  const handleRejectDocConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectDocModal || !rejectReason.trim()) return;
    rejectDocumentVersion(rejectDocModal.docId, rejectDocModal.verId, rejectReason);
    setRejectDocModal(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Centralized Approvals Inbox</h1>
              <p className="text-xs text-slate-400">
                Senior counsel, partner, and finance authorization queue
              </p>
            </div>
          </div>
        </div>

        {/* Global badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {totalPendingCount} Action Items Required
          </span>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('finance')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'finance'
              ? 'bg-amber-950/20 border-amber-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pending Requisitions</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-100">{pendingExpenses.length}</div>
          <div className="text-[11px] text-amber-400 mt-0.5">KES {totalExpenseAmount.toLocaleString()} total</div>
        </div>

        <div
          onClick={() => setActiveTab('documents')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'documents'
              ? 'bg-blue-950/20 border-blue-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Document Reviews</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-100">{pendingDocs.length}</div>
          <div className="text-[11px] text-blue-400 mt-0.5">Pleadings awaiting signoff</div>
        </div>

        <div
          onClick={() => setActiveTab('settlements')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'settlements'
              ? 'bg-emerald-950/20 border-emerald-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Settlement Authorities</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-100">{pendingSettlements.length}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Insurer offer sign-offs</div>
        </div>

        <div
          onClick={() => setActiveTab('handoffs')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'handoffs'
              ? 'bg-purple-950/20 border-purple-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Stage Handoffs</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-100">{pendingHandoffs.length}</div>
          <div className="text-[11px] text-purple-400 mt-0.5">Responsibility acceptances</div>
        </div>

        <div
          onClick={() => setActiveTab('closures')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === 'closures'
              ? 'bg-indigo-950/20 border-indigo-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">File Closures</span>
            <Archive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-100">{pendingClosures.length}</div>
          <div className="text-[11px] text-indigo-400 mt-0.5">Stage 19 final archive signoffs</div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Items', count: totalPendingCount },
            { id: 'finance', label: 'Disbursements & Fees', count: pendingExpenses.length },
            { id: 'documents', label: 'Pleadings & Verifications', count: pendingDocs.length },
            { id: 'settlements', label: 'Settlement Offers', count: pendingSettlements.length },
            { id: 'handoffs', label: 'Matter Handoffs', count: pendingHandoffs.length },
            { id: 'closures', label: 'File Closures', count: pendingClosures.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ApprovalTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by description or matter..."
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {/* ─── 1. FINANCIAL REQUISITIONS ─── */}
        {(activeTab === 'all' || activeTab === 'finance') && pendingExpenses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Financial Requisitions ({pendingExpenses.length})
              </span>
            </div>

            <div className="grid gap-3">
              {pendingExpenses
                .filter((e) =>
                  searchQuery ? e.description.toLowerCase().includes(searchQuery.toLowerCase()) : true
                )
                .map((exp) => {
                  const matter = getMatter(exp.matterId);
                  const requester = getUser(exp.requestedByUserId);

                  return (
                    <div
                      key={exp.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-amber-900/30 hover:border-amber-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                            Requisition
                          </span>
                          <span className="text-base font-bold text-slate-100">
                            KES {exp.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">· {exp.categoryId.replace(/_/g, ' ')}</span>
                        </div>

                        <div className="text-sm text-slate-200 font-medium">{exp.description}</div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {matter && (
                            <button
                              onClick={() => {
                                setSelectedMatterId(matter.id);
                                setActiveWorkspace('matters');
                              }}
                              className="font-mono text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <FileText className="w-3 h-3" />
                              {matter.internalReference} — {matter.title}
                            </button>
                          )}
                          {requester && <span>Requested by: <strong className="text-slate-300">{requester.fullName}</strong></span>}
                          <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveExpense(exp.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setDisburseModal(exp)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Approve & Disburse
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── 2. DOCUMENT REVIEWS ─── */}
        {(activeTab === 'all' || activeTab === 'documents') && pendingDocs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Documents Awaiting Verification & Review ({pendingDocs.length})
              </span>
            </div>

            <div className="grid gap-3">
              {pendingDocs
                .filter(({ doc }) =>
                  searchQuery ? doc.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
                )
                .map(({ doc, version }) => {
                  const matter = getMatter(doc.matterId);
                  const author = getUser(version.uploadedBy);

                  return (
                    <div
                      key={version.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-blue-900/30 hover:border-blue-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                            v{version.versionNumber} IN REVIEW
                          </span>
                          <span className="text-sm font-bold text-slate-100">{doc.title}</span>
                          <span className="text-xs text-slate-400 font-mono text-[10px]">
                            {doc.category.toUpperCase()}
                          </span>
                        </div>

                        {version.notes && (
                          <div className="text-xs text-slate-300 italic bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
                            "{version.notes}"
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {matter && (
                            <button
                              onClick={() => {
                                setSelectedMatterId(matter.id);
                                setActiveWorkspace('matters');
                              }}
                              className="font-mono text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <FileText className="w-3 h-3" />
                              {matter.internalReference} — {matter.title}
                            </button>
                          )}
                          {author && <span>Drafted by: <strong className="text-slate-300">{author.fullName}</strong></span>}
                          <span>Submitted: {new Date(version.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveDocumentVersion(doc.id, version.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => signDocumentVersion(doc.id, version.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Sign & Seal
                        </button>
                        <button
                          onClick={() => setRejectDocModal({ docId: doc.id, verId: version.id, docTitle: doc.title })}
                          className="px-3 py-1.5 bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 rounded-lg text-xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── 3. SETTLEMENT OFFERS ─── */}
        {(activeTab === 'all' || activeTab === 'settlements') && pendingSettlements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Settlement Authority Queue ({pendingSettlements.length})
              </span>
            </div>

            <div className="grid gap-3">
              {pendingSettlements.map(({ matterId, data }) => {
                const matter = getMatter(matterId);
                const approval = data.settlementApproval;

                return (
                  <div
                    key={matterId}
                    className="p-4 rounded-2xl bg-slate-900 border border-emerald-900/30 hover:border-emerald-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          SETTLEMENT PROPOSAL
                        </span>
                        <span className="text-base font-bold text-slate-100">
                          KES {approval.recommendedAmount.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {data.insurer.name} · Policy #{data.insurer.policyNumber || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            approval.clientAuthorized
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-900/40 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {approval.clientAuthorized ? '✓ Client Authorized' : '⚠ Awaiting Client Consent'}
                        </span>
                        <span className="text-slate-400 text-xs">
                          Discharge Voucher: {approval.dischargeVoucherSigned ? 'Signed' : 'Pending Signature'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {matter && (
                          <button
                            onClick={() => {
                              setSelectedMatterId(matter.id);
                              setActiveWorkspace('matters');
                            }}
                            className="font-mono text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <FileText className="w-3 h-3" />
                            {matter.internalReference} — {matter.title}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          approveSettlementOffer(matterId, approval.recommendedAmount, approval.clientAuthorized, true)
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Partner Authorize Offer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── 4. STAGE HANDOFFS ─── */}
        {(activeTab === 'all' || activeTab === 'handoffs') && pendingHandoffs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                Stage Transition Handoffs ({pendingHandoffs.length})
              </span>
            </div>

            <div className="grid gap-3">
              {pendingHandoffs.map((handoff) => {
                const matter = getMatter(handoff.matterId);
                const fromUser = getUser(handoff.fromUserId);
                const toUser = getUser(handoff.toUserId);

                return (
                  <div
                    key={handoff.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-purple-900/30 hover:border-purple-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          STAGE {handoff.fromStageId} → {handoff.toStageId} HANDOFF
                        </span>
                        <span className="text-xs text-slate-300">
                          Transferred: {new Date(handoff.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {handoff.handoffNotes && (
                        <div className="text-xs text-slate-200 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                          "{handoff.handoffNotes}"
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        {matter && (
                          <button
                            onClick={() => {
                              setSelectedMatterId(matter.id);
                              setActiveWorkspace('matters');
                            }}
                            className="font-mono text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <FileText className="w-3 h-3" />
                            {matter.internalReference} — {matter.title}
                          </button>
                        )}
                        <span>From: <strong className="text-slate-300">{fromUser?.fullName || 'Counsel'}</strong></span>
                        <span>Assigned To: <strong className="text-purple-300">{toUser?.fullName || 'Assigned Staff'}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => acknowledgeHandoff(handoff.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Acknowledge & Take Ownership
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalPendingCount === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">Approvals Inbox is Clear</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All financial disbursements, pleadings verifications, settlement offers, and handoffs have been authorized.
            </p>
          </div>
        )}
      </div>

      {/* ─── DISBURSEMENT MODAL ─── */}
      {disburseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Authorize Disbursement
              </h3>
              <button
                onClick={() => setDisburseModal(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-mono">Amount to Disburse</div>
                <div className="text-xl font-bold text-slate-100">KES {disburseModal.amount.toLocaleString()}</div>
                <div className="text-slate-400">{disburseModal.description}</div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Debit Payment Source</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Office Bank Account', 'Petty Cash'] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setPaymentSource(source)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                        paymentSource === source
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDisburseModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburseConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Disbursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT DOCUMENT MODAL ─── */}
      {rejectDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectDocConfirm}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Request Document Amendments
              </h3>
              <button
                type="button"
                onClick={() => setRejectDocModal(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-slate-400">
                Document: <strong className="text-slate-200">{rejectDocModal.docTitle}</strong>
              </p>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Required Amendments / Feedback *</label>
                <textarea
                  rows={4}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please correct paragraph 4 regarding the date of the accident and attach the verified police report..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectDocModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                Send Amendments Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
