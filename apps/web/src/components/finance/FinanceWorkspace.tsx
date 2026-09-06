import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Printer,
  Search,
  Filter,
  Receipt,
  Scale,
  CheckCircle2,
  Eye,
  CreditCard,
  Send,
  X,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, ExpenseRecord, FeeNote, FeeNoteItem, FeeNoteStatus } from '../../types';

export const FinanceWorkspace: React.FC = () => {
  const {
    expenses,
    payments,
    matters,
    clients,
    users,
    currentUser,
    approveExpense,
    createExpenseRequest,
    setSelectedMatterId,
    setActiveWorkspace,
    timeEntries,
    feeNotes,
    createFeeNote,
    updateFeeNoteStatus,
    applyTrustFundsToFeeNote,
    recordPaymentReceipt,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'fee_notes' | 'matter_ledger' | 'requisitions' | 'client_ledger' | 'billable_time'>('fee_notes');
  const [showNewRequisitionModal, setShowNewRequisitionModal] = useState(false);
  const [showFeeNoteModal, setShowFeeNoteModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [previewFeeNote, setPreviewFeeNote] = useState<FeeNote | null>(null);

  // Filter & Search states
  const [feeNoteStatusFilter, setFeeNoteStatusFilter] = useState<string>('all');
  const [feeNoteSearch, setFeeNoteSearch] = useState('');
  const [selectedMatterForLedger, setSelectedMatterForLedger] = useState<string>(matters[0]?.id || '');

  // New Requisition Form State
  const [reqMatterId, setReqMatterId] = useState(matters[0]?.id || '');
  const [reqAmount, setReqAmount] = useState('4500');
  const [reqCategory, setReqCategory] = useState<ExpenseCategory>('court_fees');
  const [reqDescription, setReqDescription] = useState('');
  const [reqPaymentSource, setReqPaymentSource] = useState<'Petty Cash' | 'Office Bank Account' | 'Advocate Direct' | 'M-Pesa Till'>('Petty Cash');

  // New Deposit Form State
  const [depMatterId, setDepMatterId] = useState(matters[0]?.id || '');
  const [depAmount, setDepAmount] = useState('50000');
  const [depPayer, setDepPayer] = useState('');
  const [depMethod, setDepMethod] = useState<'M-Pesa' | 'Bank Transfer' | 'Cash' | 'Cheque'>('M-Pesa');
  const [depRef, setDepRef] = useState('');
  const [depDisbAlloc, setDepDisbAlloc] = useState('40000');
  const [depDesc, setDepDesc] = useState('Retainer deposit towards case disbursements and specialist medical examination fees');

  // New Fee Note Form State
  const [fnMatterId, setFnMatterId] = useState(matters[0]?.id || '');
  const [fnSignatoryId, setFnSignatoryId] = useState('usr-partner');
  const [fnAroScale, setFnAroScale] = useState('Advocates (Remuneration) Order - Schedule 6 (Civil Litigation)');
  const [fnInstructionFee, setFnInstructionFee] = useState('65000');
  const [fnInstructionFeeDesc, setFnInstructionFeeDesc] = useState('Instruction Fee: Taking instructions, opening matter file, conflict check, and pre-litigation correspondence per ARO Schedule 6');
  const [selectedTimeEntryIds, setSelectedTimeEntryIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [fnApplyTrustFunds, setFnApplyTrustFunds] = useState(true);
  const [fnTrustAmountToApply, setFnTrustAmountToApply] = useState('');
  const [fnNotes, setFnNotes] = useState('Interim fee note rendered for professional legal services and disbursements.');

  // Metrics
  const pendingExpenses = expenses.filter((e) => e.status === 'submitted');
  const totalApprovedExpenses = expenses
    .filter((e) => e.status === 'approved' || e.status === 'disbursed' || e.status === 'reconciled')
    .reduce((s, e) => s + e.amount, 0);
  const totalClientFunds = payments.reduce((s, p) => s + p.amount, 0);
  const totalTrustRetainersApplied = feeNotes.reduce((s, fn) => s + fn.trustFundsApplied, 0);
  const clientTrustBalance = totalClientFunds - totalApprovedExpenses - totalTrustRetainersApplied;

  const totalInvoiced = feeNotes.reduce((s, fn) => s + fn.grossTotal, 0);
  const totalOutstandingReceivables = feeNotes
    .filter((fn) => fn.status === 'issued' || fn.status === 'partially_paid' || fn.status === 'settled_from_trust')
    .reduce((s, fn) => s + fn.netBalanceDue, 0);
  const totalVatCollected = feeNotes.reduce((s, fn) => s + fn.vatAmount, 0);

  // Helper to calculate available trust balance for any specific matter
  const getMatterTrustBalance = (mId: string) => {
    const received = payments.filter((p) => p.matterId === mId).reduce((s, p) => s + p.amount, 0);
    const spent = expenses
      .filter((e) => e.matterId === mId && (e.status === 'approved' || e.status === 'disbursed' || e.status === 'reconciled'))
      .reduce((s, e) => s + e.amount, 0);
    const applied = feeNotes.filter((fn) => fn.matterId === mId).reduce((s, fn) => s + fn.trustFundsApplied, 0);
    return Math.max(0, received - spent - applied);
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDescription.trim()) return;

    createExpenseRequest({
      matterId: reqMatterId,
      branchId: currentUser.homeBranchId,
      categoryId: reqCategory,
      amount: parseFloat(reqAmount) || 0,
      currency: 'KES',
      paymentSource: reqPaymentSource,
      paidByUserId: currentUser.id,
      requestedByUserId: currentUser.id,
      description: reqDescription,
      spentAt: new Date().toISOString(),
    });

    setShowNewRequisitionModal(false);
    setReqDescription('');
  };

  const handleRecordDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMatter = matters.find((m) => m.id === depMatterId);
    const targetClient = clients.find((c) => c.id === targetMatter?.clientId);
    const amountVal = parseFloat(depAmount) || 0;
    const disbAllocVal = parseFloat(depDisbAlloc) || 0;
    const feeAllocVal = Math.max(0, amountVal - disbAllocVal);

    recordPaymentReceipt({
      matterId: depMatterId,
      clientId: targetClient?.id || targetMatter?.clientId,
      amount: amountVal,
      currency: 'KES',
      receivedAt: new Date().toISOString(),
      payerName: depPayer.trim() || targetClient?.displayName || 'Client',
      paymentMethod: depMethod,
      referenceNumber: depRef.trim() || `MP${Date.now().toString().slice(-8).toUpperCase()}`,
      accountId: 'acc-client-kcb',
      description: depDesc,
      allocatedToDisbursements: disbAllocVal,
      allocatedToFees: feeAllocVal,
    });

    setShowDepositModal(false);
    setDepPayer('');
    setDepRef('');
  };

  const openFeeNoteGeneratorForMatter = (targetMatterId: string) => {
    setFnMatterId(targetMatterId);
    const unbilledForMatter = timeEntries.filter((t) => t.matterId === targetMatterId && !t.isBilled).map((t) => t.id);
    setSelectedTimeEntryIds(unbilledForMatter);
    const disbForMatter = expenses
      .filter((e) => e.matterId === targetMatterId && (e.status === 'approved' || e.status === 'disbursed' || e.status === 'reconciled'))
      .map((e) => e.id);
    setSelectedExpenseIds(disbForMatter);

    const availableTrust = getMatterTrustBalance(targetMatterId);
    setFnTrustAmountToApply(availableTrust > 0 ? String(availableTrust) : '0');
    setShowFeeNoteModal(true);
  };

  const handleCreateFeeNote = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMatter = matters.find((m) => m.id === fnMatterId);
    if (!targetMatter) return;

    const items: FeeNoteItem[] = [];

    // Custom Instruction Fee
    const instFeeVal = parseFloat(fnInstructionFee) || 0;
    if (instFeeVal > 0) {
      items.push({
        id: `fni-${Date.now()}-inst`,
        description: fnInstructionFeeDesc,
        category: 'professional_fee',
        amount: instFeeVal,
        taxable: true,
      });
    }

    // Selected Time Entries
    selectedTimeEntryIds.forEach((tId) => {
      const entry = timeEntries.find((t) => t.id === tId);
      if (entry) {
        items.push({
          id: `fni-${Date.now()}-${entry.id}`,
          description: `${entry.activityType}: ${entry.notes} (${(entry.durationSeconds / 3600).toFixed(1)} hrs @ KES ${entry.hourlyRate.toLocaleString()}/hr)`,
          category: 'professional_fee',
          amount: entry.totalAmount,
          taxable: true,
          timeEntryId: entry.id,
        });
      }
    });

    // Selected Disbursements
    selectedExpenseIds.forEach((eId) => {
      const exp = expenses.find((e) => e.id === eId);
      if (exp) {
        items.push({
          id: `fni-${Date.now()}-${exp.id}`,
          description: `Disbursement: ${exp.description} (${exp.categoryId.replace('_', ' ')})`,
          category: 'disbursement',
          amount: exp.amount,
          taxable: false,
          expenseId: exp.id,
        });
      }
    });

    const profFeesSubtotal = items
      .filter((i) => i.category === 'professional_fee')
      .reduce((s, i) => s + i.amount, 0);
    const disbSubtotal = items
      .filter((i) => i.category === 'disbursement')
      .reduce((s, i) => s + i.amount, 0);
    const vatRate = 0.16;
    const vatAmount = Math.round(profFeesSubtotal * vatRate);
    const grossTotal = profFeesSubtotal + vatAmount + disbSubtotal;

    const trustApplied = fnApplyTrustFunds ? Math.min(grossTotal, parseFloat(fnTrustAmountToApply) || 0) : 0;
    const netBalanceDue = Math.max(0, grossTotal - trustApplied);
    const status: FeeNoteStatus = netBalanceDue === 0 ? 'settled_from_trust' : 'issued';

    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 86400000);

    const newFn = createFeeNote({
      matterId: fnMatterId,
      clientId: targetMatter.clientId,
      issuedDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      status,
      items,
      professionalFeesSubtotal: profFeesSubtotal,
      disbursementsSubtotal: disbSubtotal,
      vatRate,
      vatAmount,
      grossTotal,
      trustFundsApplied: trustApplied,
      netBalanceDue,
      notes: fnNotes,
      aroScaleReference: fnAroScale,
      signatoryAdvocateId: fnSignatoryId,
    });

    setShowFeeNoteModal(false);
    setPreviewFeeNote(newFn);
  };

  // Filtered Fee Notes
  const filteredFeeNotes = feeNotes.filter((fn) => {
    if (feeNoteStatusFilter !== 'all' && fn.status !== feeNoteStatusFilter) return false;
    if (feeNoteSearch.trim()) {
      const q = feeNoteSearch.toLowerCase();
      const matter = matters.find((m) => m.id === fn.matterId);
      const client = clients.find((c) => c.id === fn.clientId);
      const matchNum = fn.feeNoteNumber.toLowerCase().includes(q);
      const matchMatter = matter?.internalReference.toLowerCase().includes(q) || matter?.title.toLowerCase().includes(q);
      const matchClient = client?.displayName.toLowerCase().includes(q);
      return matchNum || matchMatter || matchClient;
    }
    return true;
  });

  // Selected matter for ledger statement
  const currentLedgerMatter = matters.find((m) => m.id === selectedMatterForLedger) || matters[0];
  const ledgerClient = clients.find((c) => c.id === currentLedgerMatter?.clientId);
  const matterPayments = payments.filter((p) => p.matterId === currentLedgerMatter?.id);
  const matterExpenses = expenses.filter(
    (e) => e.matterId === currentLedgerMatter?.id && (e.status === 'approved' || e.status === 'disbursed' || e.status === 'reconciled')
  );
  const matterFeeNotes = feeNotes.filter((fn) => fn.matterId === currentLedgerMatter?.id);

  // Compile unified chronological ledger entries
  interface LedgerEntry {
    id: string;
    date: string;
    type: 'deposit' | 'disbursement' | 'fee_note' | 'trust_transfer';
    reference: string;
    description: string;
    account: 'Client Trust Account (NCBA 7041)' | 'Office Operating (Stanbic 9920)';
    debit: number; // money going out or fee owed
    credit: number; // money received
  }

  const ledgerEntries: LedgerEntry[] = [];

  matterPayments.forEach((p) => {
    ledgerEntries.push({
      id: `ledg-p-${p.id}`,
      date: p.receivedAt,
      type: 'deposit',
      reference: p.referenceNumber || 'M-Pesa / Bank',
      description: `Client Trust Deposit: ${p.description}`,
      account: 'Client Trust Account (NCBA 7041)',
      debit: 0,
      credit: p.amount,
    });
  });

  matterExpenses.forEach((e) => {
    ledgerEntries.push({
      id: `ledg-e-${e.id}`,
      date: e.spentAt,
      type: 'disbursement',
      reference: `Disb-${e.categoryId}`,
      description: `Disbursement Paid: ${e.description}`,
      account: 'Client Trust Account (NCBA 7041)',
      debit: e.amount,
      credit: 0,
    });
  });

  matterFeeNotes.forEach((fn) => {
    ledgerEntries.push({
      id: `ledg-fn-${fn.id}`,
      date: fn.issuedDate,
      type: 'fee_note',
      reference: fn.feeNoteNumber,
      description: `Advocate-Client Fee Note Rendered (Prof Fees + 16% VAT + Disb)`,
      account: 'Office Operating (Stanbic 9920)',
      debit: fn.grossTotal,
      credit: 0,
    });

    if (fn.trustFundsApplied > 0) {
      ledgerEntries.push({
        id: `ledg-tf-${fn.id}`,
        date: fn.issuedDate,
        type: 'trust_transfer',
        reference: `Trf-${fn.feeNoteNumber}`,
        description: `Statutory Trust Transfer: Client Trust Float applied against ${fn.feeNoteNumber}`,
        account: 'Client Trust Account (NCBA 7041)',
        debit: fn.trustFundsApplied,
        credit: 0,
      });
    }
  });

  // Sort chronological
  ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute running trust balance
  let runningTrustFloat = 0;
  const ledgerWithBalance = ledgerEntries.map((entry) => {
    if (entry.account.includes('Client Trust')) {
      if (entry.credit > 0) runningTrustFloat += entry.credit;
      if (entry.debit > 0) runningTrustFloat -= entry.debit;
    }
    return {
      ...entry,
      runningBalance: runningTrustFloat,
    };
  });

  const matterTotalDeposits = matterPayments.reduce((s, p) => s + p.amount, 0);
  const matterTotalDisbursements = matterExpenses.reduce((s, e) => s + e.amount, 0);
  const matterTotalTrustApplied = matterFeeNotes.reduce((s, f) => s + f.trustFundsApplied, 0);
  const currentMatterNetTrust = Math.max(0, matterTotalDeposits - matterTotalDisbursements - matterTotalTrustApplied);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Advocates Accounts Rules &bull; Kenya (Cap 16)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Strict Client Trust Separation Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 mt-1">
            Financials, Client Ledgers &amp; Fee Notes
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              openFeeNoteGeneratorForMatter(matters[0]?.id || '');
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Fee Note</span>
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Record Client Deposit</span>
          </button>
          <button
            onClick={() => setShowNewRequisitionModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Requisition</span>
          </button>
        </div>
      </div>

      {/* Account Balances Summary (Strict separation mandate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-800/60 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Client Trust Float</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
              NCBA A/C 7041
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            KES {clientTrustBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Fiduciary client deposits held under the Advocates (Accounts) Rules.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Office Revenue</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Stanbic A/C 9920
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200">
            KES {totalInvoiced.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Total legal fees &amp; taxed costs billed YTD across all matters.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-800/60 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Client Receivables</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">
              Outstanding
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            KES {totalOutstandingReceivables.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Unsettled fee note balances due from clients.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-rose-800/60 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Pending Requisitions</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400">
              {pendingExpenses.length} Awaiting
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            KES {pendingExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Court fees &amp; process server disbursements awaiting approval.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar w-fit">
        <button
          onClick={() => setActiveTab('fee_notes')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'fee_notes' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Fee Notes &amp; Invoices ({feeNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('matter_ledger')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'matter_ledger' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Matter Ledger &amp; Statements
        </button>
        <button
          onClick={() => setActiveTab('requisitions')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'requisitions' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Disbursements &amp; Requisitions ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('client_ledger')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'client_ledger' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Client Trust Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('billable_time')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === 'billable_time' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Billable Professional Fees ({timeEntries.length})
        </button>
      </div>

      {/* TAB 1: FEE NOTES & INVOICES */}
      {activeTab === 'fee_notes' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={feeNoteSearch}
                onChange={(e) => setFeeNoteSearch(e.target.value)}
                placeholder="Search by Fee Note No, Matter Ref, or Client Name..."
                className="w-full bg-transparent text-slate-200 placeholder-slate-500 outline-none text-xs"
              />
              {feeNoteSearch && (
                <button onClick={() => setFeeNoteSearch('')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              <select
                value={feeNoteStatusFilter}
                onChange={(e) => setFeeNoteStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none"
              >
                <option value="all">All Fee Notes</option>
                <option value="draft">Drafts</option>
                <option value="issued">Issued / Awaiting Settlement</option>
                <option value="settled_from_trust">Settled from Trust Float</option>
                <option value="paid">Paid in Full</option>
              </select>
            </div>
          </div>

          {/* Fee Notes List */}
          <div className="space-y-3">
            {filteredFeeNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                No fee notes match the selected criteria. Click <strong>New Fee Note</strong> to prepare an Advocate-Client Bill.
              </div>
            ) : (
              filteredFeeNotes.map((fn) => {
                const matter = matters.find((m) => m.id === fn.matterId);
                const client = clients.find((c) => c.id === fn.clientId);
                const availableTrust = matter ? getMatterTrustBalance(matter.id) : 0;

                return (
                  <div
                    key={fn.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold text-amber-400">
                          {fn.feeNoteNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                            fn.status === 'paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : fn.status === 'settled_from_trust'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : fn.status === 'issued'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {fn.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Issued: {new Date(fn.issuedDate).toLocaleDateString()} &bull; Due: {new Date(fn.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-300 text-xs flex-wrap">
                        {matter && (
                          <button
                            onClick={() => {
                              setSelectedMatterId(matter.id);
                              setActiveWorkspace('matters');
                            }}
                            className="font-mono font-bold text-amber-400 hover:underline"
                          >
                            {matter.internalReference}
                          </button>
                        )}
                        <span>Client: <strong className="text-slate-200">{client?.displayName || 'Client'}</strong></span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-400 italic">{fn.aroScaleReference || 'ARO Schedule 6'}</span>
                      </div>

                      {/* Financial Breakdown Badges */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-wrap">
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded">
                          Prof Fees: <strong>KES {fn.professionalFeesSubtotal.toLocaleString()}</strong>
                        </span>
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded">
                          16% VAT: <strong>KES {fn.vatAmount.toLocaleString()}</strong>
                        </span>
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded">
                          Disbursements: <strong>KES {fn.disbursementsSubtotal.toLocaleString()}</strong>
                        </span>
                        {fn.trustFundsApplied > 0 && (
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
                            Trust Retainer Applied: <strong>-KES {fn.trustFundsApplied.toLocaleString()}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Block */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Balance Due</div>
                        <div className={`font-mono text-lg font-bold ${fn.netBalanceDue === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          KES {fn.netBalanceDue.toLocaleString()}
                        </div>
                        {fn.netBalanceDue > 0 && availableTrust > 0 && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Available Float: KES {availableTrust.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewFeeNote(fn)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View / Print Bill</span>
                        </button>

                        {fn.status === 'issued' && availableTrust > 0 && (
                          <button
                            onClick={() => {
                              const amtToApply = Math.min(fn.netBalanceDue, availableTrust);
                              applyTrustFundsToFeeNote(fn.id, amtToApply);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium shadow transition"
                            title="Apply available client trust deposit against this fee note"
                          >
                            Apply Trust Float
                          </button>
                        )}

                        {fn.status === 'issued' && fn.netBalanceDue > 0 && (
                          <button
                            onClick={() => updateFeeNoteStatus(fn.id, 'paid')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow transition"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MATTER LEDGER & STATEMENTS */}
      {activeTab === 'matter_ledger' && (
        <div className="space-y-6">
          {/* Matter Selector Header */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Select Matter File For Statement of Account:</label>
                <select
                  value={selectedMatterForLedger}
                  onChange={(e) => setSelectedMatterForLedger(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-100 text-xs outline-none font-mono min-w-[320px]"
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.internalReference} - {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openFeeNoteGeneratorForMatter(currentLedgerMatter.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Fee Note</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {/* Matter Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Total Client Deposits</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  KES {matterTotalDeposits.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Disbursements Incurred</div>
                <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                  KES {matterTotalDisbursements.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Fee Notes Settled from Trust</div>
                <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
                  KES {matterTotalTrustApplied.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-900/40">
                <div className="text-[11px] text-slate-400">Net Client Trust Holding</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                  KES {currentMatterNetTrust.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Statement of Account Table */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-100">
                  Advocate-Client Running Statement of Account
                </h3>
                <p className="text-slate-400 text-xs">
                  Matter: {currentLedgerMatter.internalReference} &bull; Client: {ledgerClient?.displayName || 'Client'} &bull; Branch: {currentLedgerMatter.originatingBranchId === 'branch-nairobi' ? 'Nairobi HQ' : 'Mombasa'}
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                Advocates Accounts Rules Cap 16
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference / Trans No</th>
                    <th className="py-2.5 px-3">Description &amp; Particulars</th>
                    <th className="py-2.5 px-3 text-right">Debit (KES)</th>
                    <th className="py-2.5 px-3 text-right">Credit (KES)</th>
                    <th className="py-2.5 px-3 text-right">Trust Float (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {ledgerWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        No financial movements recorded for this matter yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerWithBalance.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                              item.type === 'deposit'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : item.type === 'disbursement'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : item.type === 'fee_note'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {item.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-bold whitespace-nowrap">
                          {item.reference}
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-sans max-w-sm">
                          {item.description}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-400 font-bold whitespace-nowrap">
                          {item.debit > 0 ? `KES ${item.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                          {item.credit > 0 ? `KES ${item.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold whitespace-nowrap bg-slate-950/40">
                          KES {item.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Advocates Accounts Rules Compliance Seal */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-slate-200">
                  Advocates (Accounts) Rules Fiduciary Compliance Certificate
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  We certify that the above ledger statement is true and accurate, reflecting all receipts and disbursements in compliance with the Advocates (Accounts) Rules, 1966 and Section 83 of the Advocates Act (Cap 16, Laws of Kenya). Client trust funds are strictly segregated in NCBA Bank Client Account No. 7041 and protected from office operational claims.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISBURSEMENT REQUISITIONS */}
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
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                        exp.status === 'approved' || exp.status === 'disbursed' || exp.status === 'reconciled'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : exp.status === 'submitted'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
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

      {/* TAB 4: CLIENT TRUST RECEIPTS */}
      {activeTab === 'client_ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Client Trust Receipts Ledger</h3>
              <p className="text-slate-400 text-xs">
                All client funds received in the statutory Client Holding Account (NCBA Bank A/C 7041 / M-Pesa Paybill 522123).
              </p>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Client Deposit</span>
            </button>
          </div>

          <div className="space-y-3">
            {payments.map((p) => {
              const matter = matters.find((m) => m.id === p.matterId);
              const client = clients.find((c) => c.id === p.clientId);

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-emerald-400 font-bold text-base">
                        + KES {p.amount.toLocaleString()}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {p.paymentMethod} &bull; {p.referenceNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                        NCBA Client A/C 7041
                      </span>
                    </div>

                    <div className="text-slate-200 font-medium text-xs">
                      Payer: <strong className="text-amber-400">{p.payerName}</strong> &bull; {p.description}
                    </div>

                    {matter && (
                      <div className="text-slate-400 text-xs font-mono">
                        Matter: {matter.internalReference} - {matter.title}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                      <span>Allocated to Disbursements: KES {p.allocatedToDisbursements.toLocaleString()}</span>
                      <span>&bull;</span>
                      <span>Allocated to Fees Retainer: KES {p.allocatedToFees.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right text-slate-500 font-mono text-[11px] shrink-0 self-end sm:self-center">
                    Received: {new Date(p.receivedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BILLABLE TIME & PROFESSIONAL FEES */}
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
                      View Matter
                    </button>
                    {!entry.isBilled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (matter) {
                            openFeeNoteGeneratorForMatter(matter.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Bill in Fee Note</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE NEW FEE NOTE */}
      {showFeeNoteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateFeeNote}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 shrink-0 bg-slate-50 dark:bg-slate-950/80">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                  Generate Advocate-Client Fee Note &amp; Bill
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Advocates Act (Cap 16) &bull; Advocates (Remuneration) Order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFeeNoteModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
              {/* Matter Selection */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Matter File Reference</label>
                <select
                  value={fnMatterId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setFnMatterId(mId);
                    const unbilled = timeEntries.filter((t) => t.matterId === mId && !t.isBilled).map((t) => t.id);
                    setSelectedTimeEntryIds(unbilled);
                    const disb = expenses
                      .filter((exp) => exp.matterId === mId && (exp.status === 'approved' || exp.status === 'disbursed' || exp.status === 'reconciled'))
                      .map((exp) => exp.id);
                    setSelectedExpenseIds(disb);
                    const avail = getMatterTrustBalance(mId);
                    setFnTrustAmountToApply(avail > 0 ? String(avail) : '0');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.internalReference} - {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">ARO Remuneration Scale</label>
                  <input
                    type="text"
                    value={fnAroScale}
                    onChange={(e) => setFnAroScale(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Signatory Advocate</label>
                  <select
                    value={fnSignatoryId}
                    onChange={(e) => setFnSignatoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
                  >
                    {users.filter((u) => u.role === 'senior_partner' || u.role === 'advocate').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instruction Fee Row */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                  <span>Instruction Fee (ARO Schedule 6)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Subject to 16% VAT</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={fnInstructionFee}
                    onChange={(e) => setFnInstructionFee(e.target.value)}
                    placeholder="Amount (KES)"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none text-xs"
                  />
                  <input
                    type="text"
                    value={fnInstructionFeeDesc}
                    onChange={(e) => setFnInstructionFeeDesc(e.target.value)}
                    placeholder="Instruction particulars description..."
                    className="sm:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Unbilled Time Entries Checklist */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Include Unbilled Professional Time ({timeEntries.filter((t) => t.matterId === fnMatterId && !t.isBilled).length} Available)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  {timeEntries.filter((t) => t.matterId === fnMatterId && !t.isBilled).length === 0 ? (
                    <div className="text-slate-500 py-2 text-center text-xs">No unbilled time entries found for this matter.</div>
                  ) : (
                    timeEntries
                      .filter((t) => t.matterId === fnMatterId && !t.isBilled)
                      .map((entry) => {
                        const isChecked = selectedTimeEntryIds.includes(entry.id);
                        return (
                          <label
                            key={entry.id}
                            className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition text-xs ${
                              isChecked
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-slate-900 dark:text-slate-100'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTimeEntryIds((prev) => [...prev, entry.id]);
                                  } else {
                                    setSelectedTimeEntryIds((prev) => prev.filter((id) => id !== entry.id));
                                  }
                                }}
                                className="accent-amber-600 rounded"
                              />
                              <span className="truncate">{entry.activityType}: {entry.notes}</span>
                            </div>
                            <span className="font-mono font-bold shrink-0 ml-2">KES {entry.totalAmount.toLocaleString()}</span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Disbursements Checklist */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Include Approved / Paid Disbursements ({expenses.filter((exp) => exp.matterId === fnMatterId && (exp.status === 'approved' || exp.status === 'disbursed' || exp.status === 'reconciled')).length} Available)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  {expenses.filter((exp) => exp.matterId === fnMatterId && (exp.status === 'approved' || exp.status === 'disbursed' || exp.status === 'reconciled')).length === 0 ? (
                    <div className="text-slate-500 py-2 text-center text-xs">No approved disbursements found for this matter.</div>
                  ) : (
                    expenses
                      .filter((exp) => exp.matterId === fnMatterId && (exp.status === 'approved' || exp.status === 'disbursed' || exp.status === 'reconciled'))
                      .map((exp) => {
                        const isChecked = selectedExpenseIds.includes(exp.id);
                        return (
                          <label
                            key={exp.id}
                            className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition text-xs ${
                              isChecked
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 text-slate-900 dark:text-slate-100'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedExpenseIds((prev) => [...prev, exp.id]);
                                  } else {
                                    setSelectedExpenseIds((prev) => prev.filter((id) => id !== exp.id));
                                  }
                                }}
                                className="accent-emerald-600 rounded"
                              />
                              <span className="truncate">{exp.description}</span>
                            </div>
                            <span className="font-mono font-bold shrink-0 ml-2">KES {exp.amount.toLocaleString()}</span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Trust Funds Retainer Deduction Block */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fnApplyTrustFunds}
                      onChange={(e) => setFnApplyTrustFunds(e.target.checked)}
                      className="accent-emerald-600 rounded"
                    />
                    <span>Apply Available Client Trust Float (Advocates Accounts Rules Sec 13)</span>
                  </label>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    Available: KES {getMatterTrustBalance(fnMatterId).toLocaleString()}
                  </span>
                </div>
                {fnApplyTrustFunds && (
                  <input
                    type="number"
                    value={fnTrustAmountToApply}
                    onChange={(e) => setFnTrustAmountToApply(e.target.value)}
                    placeholder="Trust amount to deduct (KES)"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono outline-none text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Narrative &amp; Bill Notes</label>
                <textarea
                  rows={2}
                  value={fnNotes}
                  onChange={(e) => setFnNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs resize-none"
                />
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0">
              <button
                type="button"
                onClick={() => setShowFeeNoteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow transition"
              >
                Issue &amp; Seal Fee Note
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* MODAL 2: PREVIEW / PRINT AUTHENTIC KENYAN ADVOCATE FEE NOTE */}
      {previewFeeNote && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            {/* Action Bar - Fixed / Sticky at top */}
            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">{previewFeeNote.feeNoteNumber}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                  {previewFeeNote.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setPreviewFeeNote(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Advocate Bill Layout - Scrollable Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {/* Firm Letterhead */}
              <div className="text-center border-b-2 border-slate-200 dark:border-slate-700 pb-5 space-y-1">
                <h2 className="text-lg sm:text-xl font-serif font-black tracking-wide text-slate-900 dark:text-amber-400 uppercase">
                  Kariuki Kagunda &amp; Associates
                </h2>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                  Advocates &bull; Commissioners for Oaths &bull; Notaries Public
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  5th Floor, View Park Towers, Uhuru Highway, Nairobi &bull; TSS Towers, 3rd Floor, Mombasa
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Tel: +254 20 221 4450 / +254 722 100 200 &bull; Email: billing@kklaw.co.ke &bull; KRA PIN: P051234567Z
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider underline">
                  Advocate-Client Fee Note &amp; Bill of Costs
                </h3>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                  Drawn under Section 45 of the Advocates Act (Cap 16) &amp; {previewFeeNote.aroScaleReference || 'ARO Schedule 6 (Civil Litigation)'}
                </div>
              </div>

              {/* Bill Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Client / Payee:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {clients.find((c) => c.id === previewFeeNote.clientId)?.displayName || 'Client'}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] block mt-1">
                    Matter: {matters.find((m) => m.id === previewFeeNote.matterId)?.title}
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold text-[11px] block">
                    Ref: {matters.find((m) => m.id === previewFeeNote.matterId)?.internalReference}
                  </span>
                </div>
                <div className="sm:text-right space-y-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Fee Note No: </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{previewFeeNote.feeNoteNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Date of Issue: </span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">{new Date(previewFeeNote.issuedDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Payment Due Date: </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{new Date(previewFeeNote.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Schedule */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                  Itemized Particulars of Professional Services &amp; Disbursements
                </h4>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewFeeNote.items.map((item, idx) => (
                    <div key={item.id} className="py-2.5 flex items-start justify-between gap-4">
                      <div className="space-y-0.5 flex-1">
                        <div className="text-slate-900 dark:text-slate-200 font-medium text-xs">
                          {idx + 1}. {item.description}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.category === 'professional_fee' ? 'Professional Legal Service (Taxable @ 16%)' : 'Reimbursable Court / Witness Disbursement (Exempt from VAT)'}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0 text-xs">
                        KES {item.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Tax Calculation Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Professional Legal Fees Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">KES {previewFeeNote.professionalFeesSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>16% Value Added Tax (VAT Act, 2013):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">KES {previewFeeNote.vatAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Reimbursable Disbursements Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">KES {previewFeeNote.disbursementsSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-sm">
                  <span>Gross Total Amount Rendered:</span>
                  <span>KES {previewFeeNote.grossTotal.toLocaleString()}</span>
                </div>
                {previewFeeNote.trustFundsApplied > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span>Less: Retainer Applied from Client Trust A/C 7041:</span>
                    <span>- KES {previewFeeNote.trustFundsApplied.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-900 dark:text-amber-400 font-bold text-base border-t-2 border-slate-300 dark:border-slate-800 pt-2">
                  <span>Net Balance Payable by Client:</span>
                  <span className="font-black text-lg text-slate-900 dark:text-amber-400">KES {previewFeeNote.netBalanceDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Statutory Notice & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-300 block">Settlement Instructions:</span>
                  <div>Bank: <strong className="text-slate-800 dark:text-slate-200">Stanbic Bank Kenya</strong></div>
                  <div>Branch: <strong className="text-slate-800 dark:text-slate-200">Kenyatta Avenue</strong></div>
                  <div>Account: <strong className="text-slate-800 dark:text-slate-200">010029381920 (Office Operating)</strong></div>
                  <div>M-Pesa Paybill: <strong className="text-slate-800 dark:text-slate-200">522123</strong> &bull; Acc: <strong className="text-slate-800 dark:text-slate-200">{previewFeeNote.feeNoteNumber}</strong></div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-300 block">Statutory Section 48 Notice:</span>
                  <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
                    Under Section 48 of the Advocates Act (Cap 16), interest at the rate of 14% per annum will be charged on all fees and disbursements remaining unpaid after thirty (30) days from the delivery of this bill.
                  </p>
                </div>
              </div>

              {/* Advocate Signature Block */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Drawn, Signed &amp; Delivered:</div>
                  <div className="font-serif font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">
                    {users.find((u) => u.id === previewFeeNote.signatoryAdvocateId)?.fullName || 'Kariuki Kagunda, SC'}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Senior Managing Partner &bull; Advocate of the High Court of Kenya
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block p-2.5 border-2 border-amber-700/60 dark:border-amber-600/40 bg-amber-50/50 dark:bg-transparent rounded-xl text-amber-800 dark:text-amber-400 font-mono text-[10px] uppercase font-bold text-center shadow-sm">
                    Kariuki Kagunda &amp; Associates<br />
                    Official Firm Seal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: RECORD CLIENT TRUST DEPOSIT */}
      {showDepositModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleRecordDeposit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                  Record Client Trust Deposit
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Statutory Holding in NCBA Bank Client Account No. 7041
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Matter Reference</label>
              <select
                value={depMatterId}
                onChange={(e) => setDepMatterId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono text-xs"
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
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Amount Received (KES)</label>
                <input
                  type="number"
                  required
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Payment Method</label>
                <select
                  value={depMethod}
                  onChange={(e) => setDepMethod(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
                >
                  <option value="M-Pesa">M-Pesa Paybill</option>
                  <option value="Bank Transfer">NCBA Bank Transfer / RTGS</option>
                  <option value="Cash">Cash at Cashier</option>
                  <option value="Cheque">Bankers Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Payer / Remitter Name</label>
                <input
                  type="text"
                  value={depPayer}
                  onChange={(e) => setDepPayer(e.target.value)}
                  placeholder="Client or Insurance Payee"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Transaction / Slip Ref</label>
                <input
                  type="text"
                  value={depRef}
                  onChange={(e) => setDepRef(e.target.value)}
                  placeholder="e.g. QHB882910X"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Portion Earmarked for Disbursements (KES)</label>
              <input
                type="number"
                value={depDisbAlloc}
                onChange={(e) => setDepDisbAlloc(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Receipt Description</label>
              <textarea
                rows={2}
                value={depDesc}
                onChange={(e) => setDepDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow transition"
              >
                Record Trust Deposit
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* MODAL 4: NEW REQUISITION MODAL */}
      {showNewRequisitionModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateRequisition} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl text-xs">
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
              Submit Payment / Expense Requisition
            </h3>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Matter File Reference</label>
              <select
                value={reqMatterId}
                onChange={(e) => setReqMatterId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono text-xs"
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
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Amount (KES)</label>
                <input
                  type="number"
                  required
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Disbursement Category</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
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
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Payment Method / Source</label>
              <select
                value={reqPaymentSource}
                onChange={(e) => setReqPaymentSource(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none text-xs"
              >
                <option value="Petty Cash">Branch Petty Cash Float</option>
                <option value="Office Bank Account">Office Operating Bank Account</option>
                <option value="Advocate Direct">Advocate Direct Out-of-Pocket</option>
                <option value="M-Pesa Till">M-Pesa Till / Paybill</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Detailed Description &amp; Justification</label>
              <textarea
                rows={3}
                required
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                placeholder="State the payee, recipient, and necessity for litigation proceedings..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewRequisitionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium shadow transition"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};
