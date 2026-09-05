import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, ExpenseRecord } from '../../types';

export const FinanceWorkspace: React.FC = () => {
  const {
    expenses,
    payments,
    matters,
    users,
    currentUser,
    approveExpense,
    createExpenseRequest,
    setSelectedMatterId,
    setActiveWorkspace,
    timeEntries,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'requisitions' | 'client_ledger' | 'billable_time'>('requisitions');
  const [showNewRequisitionModal, setShowNewRequisitionModal] = useState(false);

  // New Requisition Form State
  const [matterId, setMatterId] = useState(matters[0]?.id || '');
  const [amount, setAmount] = useState('4500');
  const [category, setCategory] = useState<ExpenseCategory>('court_fees');
  const [description, setDescription] = useState('');
  const [paymentSource, setPaymentSource] = useState<'Petty Cash' | 'Office Bank Account' | 'Advocate Direct' | 'M-Pesa Till'>('Petty Cash');

  // Metrics
  const pendingExpenses = expenses.filter((e) => e.status === 'submitted');
  const totalApprovedExpenses = expenses
    .filter((e) => e.status === 'approved' || e.status === 'disbursed')
    .reduce((s, e) => s + e.amount, 0);
  const totalClientFunds = payments.reduce((s, p) => s + p.amount, 0);
  const clientTrustBalance = totalClientFunds - totalApprovedExpenses;

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    createExpenseRequest({
      matterId,
      branchId: currentUser.homeBranchId,
      categoryId: category,
      amount: parseFloat(amount) || 0,
      currency: 'KES',
      paymentSource,
      paidByUserId: currentUser.id,
      requestedByUserId: currentUser.id,
      description,
      spentAt: new Date().toISOString(),
    });

    setShowNewRequisitionModal(false);
    setDescription('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Advocates Accounts Rules &bull; Kenya
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Strict Client/Office Separation Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Financials, Client Trust &amp; Disbursements
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewRequisitionModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* Account Balances Summary (Strict separation mandate) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-800/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Client Trust Account</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
              NCBA A/C 7041
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            KES {clientTrustBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Fiduciary client funds held on trust under the Advocates (Accounts) Rules.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Office Operating Account</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Stanbic A/C 9920
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200">
            KES 1,840,000
          </div>
          <p className="text-[11px] text-slate-500">
            Firm revenue, earned advocate fees, payroll and operational overheads.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-800/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Pending Requisitions</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">
              {pendingExpenses.length} Awaiting
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            KES {pendingExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Requisitions requiring partner sign-off before cashier disbursement.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex w-fit">
        <button
          onClick={() => setActiveTab('requisitions')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'requisitions' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Disbursement Requisitions ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('client_ledger')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'client_ledger' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Client Deposits &amp; Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('billable_time')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'billable_time' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Billable Professional Fees ({timeEntries.length})
        </button>
      </div>

      {/* Requisitions List */}
      {activeTab === 'requisitions' && (
        <div className="space-y-3">
          {expenses.map((exp) => {
            const matter = matters.find((m) => m.id === exp.matterId);
            const requester = users.find((u) => u.id === (exp.requestedByUserId || exp.paidByUserId));

            return (
              <div
                key={exp.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-amber-400">
                      KES {exp.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {exp.categoryId.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      exp.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : exp.status === 'submitted'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {exp.status}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-slate-100">{exp.description}</div>

                  <div className="text-slate-400 text-xs flex items-center gap-4 flex-wrap">
                    {matter && (
                      <button
                        onClick={() => {
                          setSelectedMatterId(matter.id);
                          setActiveWorkspace('matters');
                        }}
                        className="font-mono text-amber-400 hover:underline"
                      >
                        {matter.internalReference}
                      </button>
                    )}
                    <span>Payment Source: <strong className="text-slate-300">{exp.paymentSource.replace('_', ' ')}</strong></span>
                    <span>Requested by: {requester?.fullName || 'Staff'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {exp.status === 'submitted' && (currentUser.role === 'senior_partner' || currentUser.role === 'finance_officer') ? (
                    <button
                      onClick={() => approveExpense(exp.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Requisition</span>
                    </button>
                  ) : exp.status === 'submitted' ? (
                    <span className="text-amber-400 italic text-[11px]">
                      Awaiting Senior Partner Approval
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Approved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Payments Ledger */}
      {activeTab === 'client_ledger' && (
        <div className="space-y-3">
          {payments.map((p) => {
            const matter = matters.find((m) => m.id === p.matterId);

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      + KES {p.amount.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {p.paymentMethod} &bull; {p.referenceNumber}
                    </span>
                  </div>
                  {matter && (
                    <div className="text-slate-300 text-xs mt-1 font-mono">
                      Matter: {matter.internalReference} - {matter.title}
                    </div>
                  )}
                </div>
                <div className="text-right text-slate-500 font-mono text-[11px]">
                  {new Date(p.receivedAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Billable Time & Professional Fees Ledger */}
      {activeTab === 'billable_time' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Total Tracked Time</div>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {(timeEntries.reduce((s, t) => s + t.durationSeconds, 0) / 3600).toFixed(1)} Hours
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{timeEntries.length} Recorded Sessions</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-900/40">
              <div className="text-xs text-slate-400">Unbilled Professional Fees</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                KES {timeEntries.filter((t) => !t.isBilled).reduce((s, t) => s + t.totalAmount, 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-500/80 mt-0.5">Ready for Client Fee Note</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/40">
              <div className="text-xs text-slate-400">Total Fee Production</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                KES {timeEntries.reduce((s, t) => s + t.totalAmount, 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-0.5">Advocates Remuneration Order</div>
            </div>
          </div>

          <div className="space-y-3">
            {timeEntries.map((entry) => {
              const matter = matters.find((m) => m.id === entry.matterId);
              const lawyer = users.find((u) => u.id === entry.lawyerUserId);
              const durationHours = (entry.durationSeconds / 3600).toFixed(2);

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-amber-400">
                        KES {entry.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {entry.activityType}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          entry.isBilled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {entry.isBilled ? 'Billed' : 'Unbilled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{entry.notes}</p>

                    {matter && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Matter: {matter.internalReference}</span>
                        <span>&bull;</span>
                        <span className="text-slate-300">{matter.title}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500">
                      Logged by: <strong className="text-slate-400">{lawyer?.fullName || 'Advocate'}</strong> &bull;{' '}
                      Rate: KES {entry.hourlyRate.toLocaleString()}/hr &bull; Duration: {durationHours} hrs ({(entry.durationSeconds / 60).toFixed(0)} mins)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (matter) {
                          setSelectedMatterId(matter.id);
                          setActiveWorkspace('matters');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    >
                      View Matter File
                    </button>
                    {!entry.isBilled && (
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Interim Fee Note Draft prepared for ${matter?.internalReference || 'Matter'}: KES ${entry.totalAmount.toLocaleString()} (${entry.activityType}). Sent to Managing Partner for sealing.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow transition"
                      >
                        Generate Fee Note
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
      {showNewRequisitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateRequisition} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-100">
              Submit Payment / Expense Requisition
            </h3>

            <div>
              <label className="block text-slate-300 mb-1">Matter File Reference</label>
              <select
                value={matterId}
                onChange={(e) => setMatterId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono"
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.internalReference} - {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Disbursement Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                >
                  <option value="court_fees">Judiciary Court Filing Fee</option>
                  <option value="medical_report_fees">Medical Examination / P3 Fee</option>
                  <option value="process_server">Process Server Service Fee</option>
                  <option value="police_abstract_fee">Police Abstract Certification</option>
                  <option value="transport_fare">Clerk Transport &amp; Mileage</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Payment Method / Source</label>
              <select
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
              >
                <option value="Petty Cash">Branch Petty Cash Float</option>
                <option value="Office Bank Account">Office Operating Bank Account</option>
                <option value="Advocate Direct">Advocate Direct Out-of-Pocket</option>
                <option value="M-Pesa Till">M-Pesa Till / Paybill</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Detailed Description &amp; Justification</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State the payee, recipient, and necessity for litigation proceedings..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRequisitionModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
