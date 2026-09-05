import React, { useState, useEffect } from 'react';
import { X, Briefcase, User, CheckSquare, Calendar, DollarSign, UserPlus, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuickCreateModal: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isQuickCreateOpen,
    setIsQuickCreateOpen,
    createMatter,
    createClient,
    createTask,
    createCalendarEvent,
    createExpenseRequest,
    matters,
    users,
    currentUser,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'matter' | 'task' | 'court' | 'expense' | 'client'>('matter');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  // 1. Matter
  const [mTitle, setMTitle] = useState('');
  const [mClientName, setMClientName] = useState('');
  const [mClientPhone, setMClientPhone] = useState('');
  const [mClientIdNumber, setMClientIdNumber] = useState('');
  const [mSummary, setMSummary] = useState('');
  const [mPriority, setMPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  // 2. Task
  const [tTitle, setTTitle] = useState('');
  const [tMatterId, setTMatterId] = useState(matters[0]?.id || '');
  const [tAssignee, setTAssignee] = useState(currentUser.id);
  const [tDueAt, setTDueAt] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [tOfficialDeadline, setTOfficialDeadline] = useState('');
  const [tPriority, setTPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [tDescription, setTDescription] = useState('');

  // 3. Court Event
  const [cTitle, setCTitle] = useState('');
  const [cMatterId, setCMatterId] = useState(matters[0]?.id || '');
  const [cDate, setCDate] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
  const [cTime, setCTime] = useState('09:00');
  const [cLocation, setCLocation] = useState("Milimani Chief Magistrate's Commercial Court");
  const [cAssignee, setCAssignee] = useState(currentUser.id);
  const [cNotes, setCNotes] = useState('');

  // 4. Expense
  const [eMatterId, setEMatterId] = useState(matters[0]?.id || '');
  const [eAmount, setEAmount] = useState('2500');
  const [eCategory, setECategory] = useState<any>('process_server');
  const [eDescription, setEDescription] = useState('Process server facilitation fee for personal service');
  const [ePaymentSource, setEPaymentSource] = useState<'Petty Cash' | 'Office Bank Account'>('Petty Cash');

  // 5. Client
  const [cliName, setCliName] = useState('');
  const [cliPhone, setCliPhone] = useState('');
  const [cliIdNum, setCliIdNum] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliAddress, setCliAddress] = useState('');

  if (!isQuickCreateOpen) return null;

  const handleCreateMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mClientName.trim() || !mClientPhone.trim()) {
      setError('Client Name and Phone number are required.');
      return;
    }
    const newMatter = createMatter({
      title: mTitle.trim() || `${mClientName} v. Registered Owner & Driver`,
      clientDisplayName: mClientName,
      clientPhone: mClientPhone,
      clientNationalId: mClientIdNumber || 'Pending ID',
      summary: mSummary || 'Newly opened personal injury claim file.',
      priority: mPriority,
      originatingBranchId: currentUser.homeBranchId,
      responsibleBranchId: currentUser.homeBranchId,
      supervisingUserId: currentUser.id,
    });
    setSuccessMessage(`Matter ${newMatter.internalReference} successfully created!`);
    setTimeout(() => {
      setIsQuickCreateOpen(false);
      setSelectedMatterId(newMatter.id);
      setActiveWorkspace('matters');
    }, 600);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) {
      setError('Task title is required.');
      return;
    }
    createTask({
      title: tTitle,
      matterId: tMatterId || undefined,
      assignedTo: tAssignee,
      createdBy: currentUser.id,
      priority: tPriority,
      status: 'todo',
      dueAt: `${tDueAt}T17:00:00Z`,
      officialDeadlineAt: tOfficialDeadline ? `${tOfficialDeadline}T17:00:00Z` : undefined,
      description: tDescription,
    });
    setSuccessMessage('Task successfully diarized!');
    setTimeout(() => {
      setIsQuickCreateOpen(false);
      setActiveWorkspace('tasks');
    }, 600);
  };

  const handleCreateCourtEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) {
      setError('Event title is required.');
      return;
    }
    createCalendarEvent({
      matterId: cMatterId || undefined,
      title: cTitle,
      eventType: 'court',
      startAt: `${cDate}T${cTime}:00Z`,
      endAt: `${cDate}T12:00:00Z`,
      location: cLocation,
      assignedUserId: cAssignee,
      organizerId: currentUser.id,
      courtStatus: 'scheduled',
      notes: cNotes,
    });
    setSuccessMessage('Court date successfully diarized in calendar!');
    setTimeout(() => {
      setIsQuickCreateOpen(false);
      setActiveWorkspace('calendar');
    }, 600);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(eAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Please provide a valid expense amount in KES.');
      return;
    }
    createExpenseRequest({
      matterId: eMatterId || undefined,
      branchId: currentUser.homeBranchId,
      categoryId: eCategory,
      amount: amountVal,
      currency: 'KES',
      spentAt: new Date().toISOString(),
      description: eDescription,
      paidByUserId: currentUser.id,
      paymentSource: ePaymentSource,
    });
    setSuccessMessage('Expense request submitted for partner approval!');
    setTimeout(() => {
      setIsQuickCreateOpen(false);
      setActiveWorkspace('finance');
    }, 600);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliName.trim() || !cliPhone.trim()) {
      setError('Client Name and Phone number are required.');
      return;
    }
    createClient({
      clientType: 'person',
      displayName: cliName,
      phone: cliPhone,
      idNumber: cliIdNum || 'Pending',
      email: cliEmail || `${cliName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      physicalAddress: cliAddress,
      preferredContactMethod: 'phone',
      status: 'active',
    });
    setSuccessMessage('Client profile saved!');
    setTimeout(() => {
      setIsQuickCreateOpen(false);
      setActiveWorkspace('clients');
    }, 600);
  };

  if (!isQuickCreateOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Quick Create</span>
            </h2>
            <p className="text-xs text-slate-400">Add an operational record directly linked to the firm</p>
          </div>
          <button
            onClick={() => setIsQuickCreateOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-3 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => { setActiveTab('matter'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'matter' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> New Matter
          </button>
          <button
            onClick={() => { setActiveTab('task'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'task' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> Task / Deadline
          </button>
          <button
            onClick={() => { setActiveTab('court'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'court' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Court Date
          </button>
          <button
            onClick={() => { setActiveTab('expense'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'expense' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Expense
          </button>
          <button
            onClick={() => { setActiveTab('client'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'client' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Client
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <span>✓ {successMessage}</span>
            </div>
          )}

          {/* New Matter Form */}
          {activeTab === 'matter' && (
            <form onSubmit={handleCreateMatter} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Mwangi Kinyanjui"
                    value={mClientName}
                    onChange={(e) => setMClientName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Client Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+254 7XX XXX XXX"
                    value={mClientPhone}
                    onChange={(e) => setMClientPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">National ID / Passport No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 29384756"
                    value={mClientIdNumber}
                    onChange={(e) => setMClientIdNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Matter Priority</label>
                  <select
                    value={mPriority}
                    onChange={(e) => setMPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical / Urgent</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Matter Title / Cause</label>
                <input
                  type="text"
                  placeholder="e.g. John Mwangi v. Super Metro SACCO & Another"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Summary & Accident Facts</label>
                <textarea
                  rows={3}
                  placeholder="Brief details of incident date, vehicle registration, police abstract, and injuries..."
                  value={mSummary}
                  onChange={(e) => setMSummary(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition flex items-center gap-1.5 shadow-lg shadow-amber-900/20"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Open & Activate Matter
                </button>
              </div>
            </form>
          )}

          {/* New Task Form */}
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. File Affidavit of Service at Milimani Registry"
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Related Matter</label>
                  <select
                    value={tMatterId}
                    onChange={(e) => setTMatterId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- General Firm Task --</option>
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.internalReference} - {m.title.substring(0, 32)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Staff</label>
                  <select
                    value={tAssignee}
                    onChange={(e) => setTAssignee(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Internal Target Due Date</label>
                  <input
                    type="date"
                    value={tDueAt}
                    onChange={(e) => setTDueAt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Official Statutory/Court Deadline <span className="text-slate-500">(Immutable)</span>
                  </label>
                  <input
                    type="date"
                    value={tOfficialDeadline}
                    onChange={(e) => setTOfficialDeadline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Specific preparation or filing instructions..."
                  value={tDescription}
                  onChange={(e) => setTDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Save Task
                </button>
              </div>
            </form>
          )}

          {/* New Court Hearing Form */}
          {activeTab === 'court' && (
            <form onSubmit={handleCreateCourtEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Hearing Title / Nature *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hearing of Formal Proof / Interlocutory Application"
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Related Matter</label>
                  <select
                    value={cMatterId}
                    onChange={(e) => setCMatterId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.internalReference} - {m.title.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lead Advocate</label>
                  <select
                    value={cAssignee}
                    onChange={(e) => setCAssignee(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    {users.filter((u) => u.role === 'advocate' || u.role === 'senior_partner').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Court Date</label>
                  <input
                    type="date"
                    required
                    value={cDate}
                    onChange={(e) => setCDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Court Sitting Time</label>
                  <input
                    type="time"
                    required
                    value={cTime}
                    onChange={(e) => setCTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Court Station & Room</label>
                <input
                  type="text"
                  placeholder="e.g. Milimani Commercial Court, Court 4 / Virtual Teams link"
                  value={cLocation}
                  onChange={(e) => setCLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Advocate Briefing Notes</label>
                <textarea
                  rows={2}
                  placeholder="Exhibits to carry, witness attendance status, judge specific directions..."
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" /> Diarize Court Date
                </button>
              </div>
            </form>
          )}

          {/* New Expense Form */}
          {activeTab === 'expense' && (
            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    step="50"
                    placeholder="2500"
                    value={eAmount}
                    onChange={(e) => setEAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expense Category</label>
                  <select
                    value={eCategory}
                    onChange={(e) => setECategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="process_server">Process Server Service</option>
                    <option value="filing_fees">Judiciary E-Filing Fees</option>
                    <option value="court_fees">Court Assessment Fees</option>
                    <option value="medical_report_fees">Medical Report Specialist Fee</option>
                    <option value="police_abstract_fee">Police Abstract Stamp Fee</option>
                    <option value="transport_fare">Transport & Fare</option>
                    <option value="printing_copying">Printing & Trial Bundles</option>
                    <option value="witness_facilitation">Witness Facilitation</option>
                    <option value="office_supplies">Office Supplies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Related Matter</label>
                  <select
                    value={eMatterId}
                    onChange={(e) => setEMatterId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- General Firm Overhead --</option>
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.internalReference} - {m.title.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Requisition Source</label>
                  <select
                    value={ePaymentSource}
                    onChange={(e) => setEPaymentSource(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="Petty Cash">Branch Petty Cash</option>
                    <option value="Office Bank Account">Office Bank Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the payee, purpose of expenditure, and expected return receipt..."
                  value={eDescription}
                  onChange={(e) => setEDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Submit Requisition
                </button>
              </div>
            </form>
          )}

          {/* New Client Form */}
          {activeTab === 'client' && (
            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lucy Muthoni Gathoni"
                    value={cliName}
                    onChange={(e) => setCliName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Primary Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+254 7XX XXX XXX"
                    value={cliPhone}
                    onChange={(e) => setCliPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">National ID Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 29384756"
                    value={cliIdNum}
                    onChange={(e) => setCliIdNum(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={cliEmail}
                    onChange={(e) => setCliEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Physical / Postal Residence</label>
                <input
                  type="text"
                  placeholder="e.g. Ruiru, Kiambu / P.O. Box 102 Nairobi"
                  value={cliAddress}
                  onChange={(e) => setCliAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" /> Save Client Record
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
