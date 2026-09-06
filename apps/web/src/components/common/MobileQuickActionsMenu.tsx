import React, { useState, useEffect } from 'react';
import {
  Zap,
  Gavel,
  FileText,
  CheckSquare,
  Camera,
  Upload,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileQuickActionsMenu: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    matters,
    currentUser,
    createTask,
    createExpenseRequest,
    recordCourtOutcome,
    calendarEvents,
    uploadDocumentVersion,
    documents,
    notify,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'court_outcome' | 'case_note' | 'task' | 'receipt' | 'document' | 'expense' | null
  >(null);

  const [selectedMatterId, setSelectedMatterId] = useState<string>(matters[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  // 1. Court Outcome
  const [courtEventId, setCourtEventId] = useState<string>('');
  const [courtStatus, setCourtStatus] = useState<'conducted' | 'adjourned' | 'mention_held' | 'judgment_delivered'>('conducted');
  const [courtOutcomeNotes, setCourtOutcomeNotes] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');

  // 2. Case Note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // 3. Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'normal' | 'high' | 'urgent'>('high');

  // 4. Receipt Photo
  const [receiptVendor, setReceiptVendor] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptCategory, setReceiptCategory] = useState<'court_fee' | 'transport' | 'process_server' | 'hospital_fee' | 'photocopy'>('court_fee');
  const [receiptImageCaptured, setReceiptImageCaptured] = useState(false);

  // 5. Document
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'Pleadings' | 'Evidence' | 'Medical' | 'Court Order' | 'Receipt'>('Evidence');

  // 6. Expense
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'court_fee' | 'transport' | 'process_server' | 'other'>('court_fee');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveModal(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleSaveCourtOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatterId) return;
    if (courtEventId) {
      recordCourtOutcome(
        courtEventId,
        courtStatus === 'conducted' ? 'completed' : 'adjourned',
        courtOutcomeNotes,
        nextHearingDate || undefined
      );
    } else {
      notify(
        currentUser.id,
        'Field Court Outcome Recorded',
        `Matter #${selectedMatterId}: ${courtOutcomeNotes}`,
        'system',
        selectedMatterId
      );
    }
    showSuccess('Court outcome logged successfully!');
  };

  const handleSaveCaseNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !selectedMatterId) return;
    notify(
      currentUser.id,
      `Case Note: ${noteTitle}`,
      noteContent,
      'system',
      selectedMatterId
    );
    showSuccess('Field case note saved to matter file!');
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    createTask({
      matterId: selectedMatterId,
      title: taskTitle,
      description: 'Captured via Mobile Quick-Actions in Field',
      assignedTo: currentUser.id,
      createdBy: currentUser.id,
      status: 'todo',
      priority: taskPriority,
      dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : new Date(Date.now() + 86400000 * 2).toISOString(),
    });
    showSuccess('Task created from field!');
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptVendor || !receiptAmount) return;
    createExpenseRequest({
      matterId: selectedMatterId,
      branchId: currentUser.homeBranchId || 'branch-nairobi',
      categoryId: receiptCategory as any,
      amount: parseFloat(receiptAmount) || 0,
      currency: 'KES',
      spentAt: new Date().toISOString(),
      paidByUserId: currentUser.id,
      requestedByUserId: currentUser.id,
      paymentSource: 'Advocate Direct',
      description: `Receipt from ${receiptVendor} (Photo Captured)`,
    });
    showSuccess('Receipt photo & expense logged!');
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !selectedMatterId) return;
    const targetDoc = documents.find((d) => d.matterId === selectedMatterId) || documents[0];
    if (targetDoc) {
      uploadDocumentVersion(
        targetDoc.id,
        {
          name: docName,
          size: 245000,
          mimeType: 'application/pdf',
          changeSummary: 'Uploaded via Field Mobile Quick Action',
        },
        'Uploaded from mobile device in field'
      );
    }
    showSuccess('Document uploaded to file!');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescription || !expenseAmount) return;
    createExpenseRequest({
      matterId: selectedMatterId,
      branchId: currentUser.homeBranchId || 'branch-nairobi',
      categoryId: expenseCategory as any,
      amount: parseFloat(expenseAmount) || 0,
      currency: 'KES',
      spentAt: new Date().toISOString(),
      paidByUserId: currentUser.id,
      requestedByUserId: currentUser.id,
      paymentSource: 'Petty Cash',
      description: expenseDescription,
    });
    showSuccess('Expense request submitted!');
  };

  const matterOptions = matters.map((m) => (
    <option key={m.id} value={m.id}>
      {m.internalReference} - {m.title}
    </option>
  ));

  return (
    <>
      {/* Floating Action Speed-Dial Button (Mobile Only) */}
      <div className="fixed bottom-16 right-4 z-40 md:hidden flex flex-col items-end gap-2">
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <button
              onClick={() => {
                setActiveModal('court_outcome');
              }}
              className="flex items-center gap-2 bg-slate-900 border border-amber-600/80 text-amber-300 text-xs font-semibold px-3 py-2 rounded-xl shadow-xl hover:bg-slate-800"
            >
              <span>Court Outcome</span>
              <Gavel className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={() => {
                setActiveModal('case_note');
              }}
              className="flex items-center gap-2 bg-slate-900 border border-blue-600/80 text-blue-300 text-xs font-semibold px-3 py-2 rounded-xl shadow-xl hover:bg-slate-800"
            >
              <span>Case Note</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => {
                setActiveModal('task');
              }}
              className="flex items-center gap-2 bg-slate-900 border border-emerald-600/80 text-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl shadow-xl hover:bg-slate-800"
            >
              <span>New Task</span>
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => {
                setActiveModal('receipt');
              }}
              className="flex items-center gap-2 bg-slate-900 border border-purple-600/80 text-purple-300 text-xs font-semibold px-3 py-2 rounded-xl shadow-xl hover:bg-slate-800"
            >
              <span>Receipt Photo</span>
              <Camera className="w-4 h-4 text-purple-400" />
            </button>
            <button
              onClick={() => {
                setActiveModal('document');
              }}
              className="flex items-center gap-2 bg-slate-900 border border-cyan-600/80 text-cyan-300 text-xs font-semibold px-3 py-2 rounded-xl shadow-xl hover:bg-slate-800"
            >
              <span>Upload Document</span>
              <Upload className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => {
                setActiveModal('expense');
              }}
              className="flex items-center gap-2 bg-slate-900 border border-rose-600/80 text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl shadow-xl hover:bg-slate-800"
            >
              <span>Log Expense</span>
              <DollarSign className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl border transition-all active:scale-95 ${
            isOpen
              ? 'bg-rose-600 border-rose-400 rotate-45'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-400 shadow-amber-950/60'
          }`}
          title="Field Quick Actions"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
        </button>
      </div>

      {/* Action Modals */}
      {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 sm:p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto text-xs">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-serif font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {activeModal === 'court_outcome' && <Gavel className="w-4 h-4 text-amber-500" />}
                  {activeModal === 'case_note' && <FileText className="w-4 h-4 text-blue-500" />}
                  {activeModal === 'task' && <CheckSquare className="w-4 h-4 text-emerald-500" />}
                  {activeModal === 'receipt' && <Camera className="w-4 h-4 text-purple-500" />}
                  {activeModal === 'document' && <Upload className="w-4 h-4 text-cyan-500" />}
                  {activeModal === 'expense' && <DollarSign className="w-4 h-4 text-rose-500" />}
                  <span>
                    {activeModal === 'court_outcome' && 'Log Court Outcome (Field)'}
                    {activeModal === 'case_note' && 'Add Case / Attendance Note'}
                    {activeModal === 'task' && 'Quick Field Task'}
                    {activeModal === 'receipt' && 'Capture Receipt Photo'}
                    {activeModal === 'document' && 'Upload Field Document'}
                    {activeModal === 'expense' && 'Request Disbursement / Expense'}
                  </span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {successMsg ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{successMsg}</div>
                </div>
              ) : (
                <>
                  {/* Select Matter */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Select Matter</label>
                    <select
                      value={selectedMatterId}
                      onChange={(e) => setSelectedMatterId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono focus:border-amber-500"
                    >
                      {matterOptions}
                    </select>
                  </div>

                  {/* 1. Court Outcome Form */}
                  {activeModal === 'court_outcome' && (
                    <form onSubmit={handleSaveCourtOutcome} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Hearing / Event Type</label>
                        <select
                          value={courtStatus}
                          onChange={(e) => setCourtStatus(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        >
                          <option value="conducted">Hearing Conducted</option>
                          <option value="mention_held">Mention Held</option>
                          <option value="adjourned">Adjourned</option>
                          <option value="judgment_delivered">Judgment Delivered</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Court Orders / Attendance Notes</label>
                        <textarea
                          required
                          rows={3}
                          value={courtOutcomeNotes}
                          onChange={(e) => setCourtOutcomeNotes(e.target.value)}
                          placeholder="Record orders issued, judge comments, costs awarded..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none resize-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Next Date Given by Court</label>
                        <input
                          type="date"
                          value={nextHearingDate}
                          onChange={(e) => setNextHearingDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-sm transition"
                      >
                        Save Court Outcome
                      </button>
                    </form>
                  )}

                  {/* 2. Case Note Form */}
                  {activeModal === 'case_note' && (
                    <form onSubmit={handleSaveCaseNote} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Note Title / Subject</label>
                        <input
                          type="text"
                          required
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="e.g. Client phone call re medical examination"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Note Details</label>
                        <textarea
                          required
                          rows={4}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Detail notes captured during field visit or call..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none resize-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition"
                      >
                        Save Case Note
                      </button>
                    </form>
                  )}

                  {/* 3. Task Form */}
                  {activeModal === 'task' && (
                    <form onSubmit={handleSaveTask} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Task Title</label>
                        <input
                          type="text"
                          required
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="e.g. Collect Police Abstract from Central Station"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priority</label>
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Due Date</label>
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition"
                      >
                        Create Field Task
                      </button>
                    </form>
                  )}

                  {/* 4. Receipt Photo Form */}
                  {activeModal === 'receipt' && (
                    <form onSubmit={handleSaveReceipt} className="space-y-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-dashed border-purple-400 dark:border-purple-500/50 rounded-xl text-center space-y-2">
                        <Camera className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto" />
                        <div className="text-slate-700 dark:text-slate-300 text-xs">
                          {receiptImageCaptured ? '✓ Photo captured (receipt_scan.jpg)' : 'Tap to snap photo of physical receipt'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceiptImageCaptured(true)}
                          className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 transition"
                        >
                          {receiptImageCaptured ? 'Retake Photo' : 'Capture Receipt Photo'}
                        </button>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vendor / Recipient</label>
                        <input
                          type="text"
                          required
                          value={receiptVendor}
                          onChange={(e) => setReceiptVendor(e.target.value)}
                          placeholder="e.g. Judiciary CTS / Kenya Police"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                          <select
                            value={receiptCategory}
                            onChange={(e) => setReceiptCategory(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="court_fee">Court Filing Fee</option>
                            <option value="transport">Transport / Fuel</option>
                            <option value="process_server">Process Server Fee</option>
                            <option value="hospital_fee">Hospital Record Fee</option>
                            <option value="photocopy">Photocopying</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Amount (KES)</label>
                          <input
                            type="number"
                            required
                            value={receiptAmount}
                            onChange={(e) => setReceiptAmount(e.target.value)}
                            placeholder="e.g. 2500"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-sm transition"
                      >
                        Submit Receipt &amp; Expense
                      </button>
                    </form>
                  )}

                  {/* 5. Document Upload Form */}
                  {activeModal === 'document' && (
                    <form onSubmit={handleSaveDocument} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Document Title</label>
                        <input
                          type="text"
                          required
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="e.g. Stamped Police Abstract - Nairobi Central"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                        <select
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        >
                          <option value="Evidence">Evidence / Scene Photo</option>
                          <option value="Medical">Medical Record / P3</option>
                          <option value="Pleadings">Pleading Document</option>
                          <option value="Court Order">Court Order / Ruling</option>
                          <option value="Receipt">Payment Receipt</option>
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-dashed border-cyan-400 dark:border-cyan-500/50 rounded-xl text-center space-y-1">
                        <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
                        <div className="text-slate-700 dark:text-slate-300 text-xs font-mono">Attachment ready (field_doc_scan.pdf)</div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm transition"
                      >
                        Upload Field Document
                      </button>
                    </form>
                  )}

                  {/* 6. Expense Request Form */}
                  {activeModal === 'expense' && (
                    <form onSubmit={handleSaveExpense} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Expense Purpose</label>
                        <input
                          type="text"
                          required
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          placeholder="e.g. Process server transportation to Thika Law Courts"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                          <select
                            value={expenseCategory}
                            onChange={(e) => setExpenseCategory(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="court_fee">Court Fee Requisition</option>
                            <option value="transport">Transport / Mileage</option>
                            <option value="process_server">Process Server Fee</option>
                            <option value="other">Other Field Expense</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Amount (KES)</label>
                          <input
                            type="number"
                            required
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm transition"
                      >
                        Submit Expense Request
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}
    </>
  );
};
