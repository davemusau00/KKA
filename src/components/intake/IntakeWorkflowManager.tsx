import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  AlertOctagon,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Car,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IntakeLead, IntakePartyInput, ConflictCheckRecord, IntakeKycRetainer } from '../../types';

export const IntakeWorkflowManager: React.FC = () => {
  const {
    intakes,
    createIntakeLead,
    updateIntakeLead,
    runConflictSearch,
    recordConflictClearance,
    updateIntakeKycRetainer,
    convertIntakeWithWorkflow,
    setSelectedMatterId,
    setActiveWorkspace,
    currentUser,
    users,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisposition, setFilterDisposition] = useState<string>('all');
  const [selectedIntake, setSelectedIntake] = useState<IntakeLead | null>(null);

  // Modal controls
  const [showNewIntakeModal, setShowNewIntakeModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showKycRetainerModal, setShowKycRetainerModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // New Intake Form State
  const [formData, setFormData] = useState<{
    clientName: string;
    phone: string;
    email: string;
    nationalId: string;
    incidentDate: string;
    incidentLocation: string;
    practiceArea: string;
    source: string;
    briefDescription: string;
    potentialParties: IntakePartyInput[];
  }>({
    clientName: '',
    phone: '+254 7',
    email: '',
    nationalId: '',
    incidentDate: new Date().toISOString().slice(0, 10),
    incidentLocation: 'Nairobi Area',
    practiceArea: 'Personal Injury',
    source: 'Direct Referral',
    briefDescription: '',
    potentialParties: [],
  });

  // Potential Party temporary sub-form
  const [partyForm, setPartyForm] = useState<IntakePartyInput>({
    id: '',
    name: '',
    role: 'defendant',
    idOrRegNumber: '',
    phone: '',
    insuranceCompany: '',
    policyOrClaimNumber: '',
    notes: '',
  });

  // Conflict Review Form State
  const [clearanceNotes, setClearanceNotes] = useState('');
  const [overrideApproved, setOverrideApproved] = useState(false);

  // Conversion Staffing Options
  const [convertSupervisingId, setConvertSupervisingId] = useState('usr-partner');
  const [convertStageOwnerId, setConvertStageOwnerId] = useState(currentUser.id);
  const [convertClerkId, setConvertClerkId] = useState('usr-clerk');
  const [convertFinanceId, setConvertFinanceId] = useState('usr-finance');
  const [convertInitialAction, setConvertInitialAction] = useState('Execute Warrant to Act & dispatch clerk for certified police abstract.');

  const filteredIntakes = intakes.filter((lead) => {
    if (filterDisposition !== 'all' && lead.disposition !== filterDisposition) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.clientName.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.briefDescription.toLowerCase().includes(q) ||
      (lead.nationalId && lead.nationalId.includes(q))
    );
  });

  const handleAddPotentialParty = () => {
    if (!partyForm.name.trim()) return;
    const newP: IntakePartyInput = {
      ...partyForm,
      id: `pt-tmp-${Date.now()}`,
    };
    setFormData((prev) => ({
      ...prev,
      potentialParties: [...prev.potentialParties, newP],
    }));
    setPartyForm({
      id: '',
      name: '',
      role: 'defendant',
      idOrRegNumber: '',
      phone: '',
      insuranceCompany: '',
      policyOrClaimNumber: '',
      notes: '',
    });
  };

  const handleRemovePotentialParty = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      potentialParties: prev.potentialParties.filter((p) => p.id !== id),
    }));
  };

  const handleCreateIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) return;

    const newLead = createIntakeLead({
      clientName: formData.clientName,
      phone: formData.phone,
      email: formData.email || `${formData.clientName.toLowerCase().replace(/\s+/g, '.')}@client.ke`,
      nationalId: formData.nationalId,
      incidentDate: formData.incidentDate,
      incidentLocation: formData.incidentLocation,
      practiceArea: formData.practiceArea,
      source: formData.source,
      briefDescription: formData.briefDescription,
      assignedIntakeOwnerId: currentUser.id,
      potentialParties: formData.potentialParties,
      kycRetainer: {
        idDocumentType: 'National ID',
        idNumber: formData.nationalId,
        idVerified: false,
        kycDocuments: [],
        warrantToActSigned: false,
        retainerAgreementSigned: false,
        retainerAgreedAmount: 50000,
        retainerDepositPaid: false,
        termsAccepted: false,
        partnerApproval: 'pending',
      },
    });

    setShowNewIntakeModal(false);
    setSelectedIntake(newLead);
    // Reset form
    setFormData({
      clientName: '',
      phone: '+254 7',
      email: '',
      nationalId: '',
      incidentDate: new Date().toISOString().slice(0, 10),
      incidentLocation: 'Nairobi Area',
      practiceArea: 'Personal Injury',
      source: 'Direct Referral',
      briefDescription: '',
      potentialParties: [],
    });
  };

  const handleRunLiveConflict = (intake: IntakeLead) => {
    const candidateParties: IntakePartyInput[] = [
      {
        id: 'client-search',
        name: intake.clientName,
        role: 'plaintiff',
        idOrRegNumber: intake.nationalId,
        phone: intake.phone,
      },
      ...(intake.potentialParties || []),
    ];
    const check = runConflictSearch(intake.id, undefined, candidateParties);
    setSelectedIntake({ ...intake, conflictCheck: check });
    setShowConflictModal(true);
  };

  const handleClearConflict = (status: 'clear' | 'overridden_approved') => {
    if (!selectedIntake) return;
    recordConflictClearance(selectedIntake.id, status, clearanceNotes, currentUser.id);
    updateIntakeLead(selectedIntake.id, {
      disposition: status === 'clear' ? 'conflict_cleared' : 'conflict_cleared',
    });
    setSelectedIntake((prev) =>
      prev
        ? {
            ...prev,
            disposition: 'conflict_cleared',
            conflictCheck: {
              ...(prev.conflictCheck || {
                id: `conf-${Date.now()}`,
                checkedByUserId: currentUser.id,
                checkedAt: new Date().toISOString(),
                partiesSearched: [prev.clientName],
                matchesFound: [],
              }),
              status,
              clearanceNotes,
              clearedByPartnerId: currentUser.id,
              clearedAt: new Date().toISOString(),
            },
          }
        : null
    );
    setShowConflictModal(false);
    setClearanceNotes('');
  };

  const handleDeclineIntake = (intakeId: string, reason: string) => {
    updateIntakeLead(intakeId, {
      disposition: 'declined',
      notes: `Declined on ${new Date().toISOString().slice(0, 10)}: ${reason}`,
    });
    if (selectedIntake?.id === intakeId) {
      setSelectedIntake((prev) => (prev ? { ...prev, disposition: 'declined' } : null));
    }
  };

  const handleConvertWithWorkflowAction = () => {
    if (!selectedIntake) return;
    const newMatter = convertIntakeWithWorkflow(selectedIntake.id, {
      supervisingUserId: convertSupervisingId,
      stageOwnerId: convertStageOwnerId,
      courtClerkId: convertClerkId,
      financeContactId: convertFinanceId,
      initialAction: convertInitialAction,
    });
    setShowConvertModal(false);
    setSelectedIntake(null);
    setSelectedMatterId(newMatter.id);
    setActiveWorkspace('matters');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Intake Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">New Inquiries</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {intakes.filter((i) => i.disposition === 'inquiry' || i.disposition === 'new').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Pending conflict evaluation</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Conflict Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {intakes.filter((i) => i.conflictCheck?.status === 'possible_match' || i.conflictCheck?.status === 'conflict_detected').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Matches flagged for clearance</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">KYC &amp; Retainer</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {intakes.filter((i) => i.disposition === 'conflict_cleared' || i.disposition === 'kyc_pending').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Warrant &amp; ID execution</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Ready to Open</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-400">
            {intakes.filter((i) => i.kycRetainer?.partnerApproval === 'approved' && i.disposition !== 'converted').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Approved for Matter Ref</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Converted</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-300">
            {intakes.filter((i) => i.disposition === 'converted').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active PI Matters running</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by claimant, phone, ID, or incident..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            {['all', 'inquiry', 'conflict_cleared', 'converted', 'declined'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterDisposition(tab)}
                className={`px-3 py-1.5 rounded-md capitalize font-medium transition ${
                  filterDisposition === tab
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNewIntakeModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Intake Interview</span>
          </button>
        </div>
      </div>

      {/* Intake Pipeline Master List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
            <Briefcase className="w-4 h-4 text-amber-500" />
            <span>Intake &amp; Conflict Clearance Pipeline ({filteredIntakes.length})</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any row to inspect parties, run conflict scan, verify KYC, or execute Retainer
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredIntakes.map((intake) => {
            const conflict = intake.conflictCheck;
            const kyc = intake.kycRetainer;
            const isConverted = intake.disposition === 'converted';

            return (
              <div
                key={intake.id}
                onClick={() => setSelectedIntake(intake)}
                className={`p-4 hover:bg-slate-800/60 transition cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  selectedIntake?.id === intake.id ? 'bg-slate-800/80 border-l-4 border-l-amber-500' : ''
                }`}
              >
                {/* Left: Lead Info */}
                <div className="flex items-start gap-3.5 max-w-xl">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-amber-400 border border-slate-700 flex-shrink-0">
                    {intake.clientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{intake.clientName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        ID: {intake.nationalId || 'Pending'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        {intake.practiceArea}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {intake.briefDescription || 'No incident summary recorded.'}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {intake.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Incident: {intake.incidentDate}
                      </span>
                      <span>
                        Source: <strong className="text-slate-300">{intake.source}</strong>
                      </span>
                      <span>
                        Parties Captured: <strong className="text-amber-400 font-mono">{(intake.potentialParties?.length || 0) + 1}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Operational Status Badges & Quick Action */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
                  {/* Conflict Badge */}
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] uppercase text-slate-500 font-medium">Conflict Scan</span>
                    {!conflict ? (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        Not Checked
                      </span>
                    ) : conflict.status === 'clear' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Cleared
                      </span>
                    ) : conflict.status === 'overridden_approved' ? (
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px] flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        Partner Approved
                      </span>
                    ) : conflict.status === 'conflict_detected' ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[10px] flex items-center gap-1 font-semibold">
                        <AlertOctagon className="w-3 h-3" />
                        Adverse Match
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {conflict.matchesFound.length} Match(es)
                      </span>
                    )}
                  </div>

                  {/* Retainer / Warrant Badge */}
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] uppercase text-slate-500 font-medium">Retainer &amp; KYC</span>
                    {kyc?.warrantToActSigned && kyc?.retainerAgreementSigned ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        Executed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        Pending Signing
                      </span>
                    )}
                  </div>

                  {/* Disposition Button */}
                  {isConverted ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (intake.convertedMatterId) {
                          setSelectedMatterId(intake.convertedMatterId);
                          setActiveWorkspace('matters');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono font-medium rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition"
                    >
                      <span>View Matter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : intake.disposition === 'declined' ? (
                    <span className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[11px] font-semibold">
                      Declined
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIntake(intake);
                        setShowConvertModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow transition"
                    >
                      <span>Open Matter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredIntakes.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No intake records match your search query.
            </div>
          )}
        </div>
      </div>

      {/* Selected Intake Detail Drawer / Modal */}
      {selectedIntake && !showConflictModal && !showKycRetainerModal && !showConvertModal && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-amber-500 tracking-wider">
                  Intake Detail &amp; Assessment
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Ref: {selectedIntake.id}
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-100 mt-1">
                {selectedIntake.clientName}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleRunLiveConflict(selectedIntake)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Conflict Search Engine</span>
              </button>

              <button
                onClick={() => setShowKycRetainerModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>KYC &amp; Retainer Checklist</span>
              </button>

              {selectedIntake.disposition !== 'converted' && selectedIntake.disposition !== 'declined' && (
                <>
                  <button
                    onClick={() => handleDeclineIntake(selectedIntake.id, 'Decline after partner conflict / merits review')}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-medium border border-rose-800/60 transition"
                  >
                    Decline Lead
                  </button>
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1"
                  >
                    <span>Proceed to Open Matter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Intake Detail Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Client & Incident Information */}
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Claimant Information</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-200 font-mono">{selectedIntake.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-200">{selectedIntake.email || 'None'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">National ID:</span>
                  <span className="text-slate-200 font-mono">{selectedIntake.nationalId || 'Not Captured'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Incident Date:</span>
                  <span className="text-slate-200">{selectedIntake.incidentDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-200">{selectedIntake.incidentLocation || 'N/A'}</span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Brief Description:</span>
                  <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                    {selectedIntake.briefDescription || 'No narrative recorded.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Captured Potential Parties (Adverse & Insurers) */}
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Potential Parties ({selectedIntake.potentialParties?.length || 0})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {/* Claimant himself */}
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">{selectedIntake.clientName}</span>
                    <span className="text-[10px] text-blue-400 block font-mono">Role: Claimant / Plaintiff</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-950 text-blue-300 text-[10px] rounded">Claimant</span>
                </div>

                {selectedIntake.potentialParties?.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        {p.idOrRegNumber && (
                          <span className="text-[10px] font-mono text-amber-400">({p.idOrRegNumber})</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono capitalize">
                        Role: {p.role.replace('_', ' ')}
                      </span>
                      {p.insuranceCompany && (
                        <span className="text-[10px] text-slate-500 block">
                          Insurer: {p.insuranceCompany} {p.policyOrClaimNumber ? `(Pol: ${p.policyOrClaimNumber})` : ''}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded font-mono uppercase ${
                      p.role === 'defendant' ? 'bg-rose-950 text-rose-300' : p.role === 'insurer' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {p.role}
                    </span>
                  </div>
                ))}

                {(!selectedIntake.potentialParties || selectedIntake.potentialParties.length === 0) && (
                  <div className="text-[11px] text-slate-500 py-4 text-center">
                    No adverse parties or insurers added yet. Click &quot;Conflict Search Engine&quot; to scan and add defendants.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Governance & Clearance Audit */}
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clearance &amp; Warrant Status</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Conflict Check:</span>
                    <span className="font-semibold capitalize text-slate-200">
                      {selectedIntake.conflictCheck?.status.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                  {selectedIntake.conflictCheck?.clearedAt && (
                    <div className="text-[10px] text-slate-500">
                      Cleared on {selectedIntake.conflictCheck.clearedAt.slice(0, 10)} by Partner
                    </div>
                  )}
                  {selectedIntake.conflictCheck?.clearanceNotes && (
                    <div className="text-[10px] text-slate-400 italic">
                      &quot;{selectedIntake.conflictCheck.clearanceNotes}&quot;
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Warrant to Act:</span>
                    <span className={`font-semibold ${selectedIntake.kycRetainer?.warrantToActSigned ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {selectedIntake.kycRetainer?.warrantToActSigned ? 'Signed & Executed' : 'Not Signed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fee Retainer:</span>
                    <span className={`font-semibold ${selectedIntake.kycRetainer?.retainerAgreementSigned ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {selectedIntake.kycRetainer?.retainerAgreementSigned ? 'Signed (KES 50,000)' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Partner Approval:</span>
                    <span className="font-semibold text-amber-400 uppercase font-mono text-[10px]">
                      {selectedIntake.kycRetainer?.partnerApproval || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: New Intake Interview Form */}
      {showNewIntakeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amber-700 dark:text-amber-500 font-bold">
                  Stage 1: Intake &amp; Inquiry
                </span>
                <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                  New Prospective Personal Injury Intake
                </h2>
              </div>
              <button
                onClick={() => setShowNewIntakeModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-mono p-1 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIntakeSubmit} className="space-y-6 text-xs">
              {/* Claimant Personal Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                  <span>1. Prospective Client Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g. John Mwangi Kimani"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">National ID / Passport *</label>
                    <input
                      type="text"
                      required
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      placeholder="e.g. 29384712"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Phone Number (M-Pesa registered) *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. j.mwangi@example.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. Incident &amp; Accident Facts</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Accident / Incident Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Accident Location</label>
                    <input
                      type="text"
                      value={formData.incidentLocation}
                      onChange={(e) => setFormData({ ...formData, incidentLocation: e.target.value })}
                      placeholder="e.g. Mombasa Road near Sameer Park"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Brief Description of Circumstances</label>
                  <textarea
                    rows={2}
                    value={formData.briefDescription}
                    onChange={(e) => setFormData({ ...formData, briefDescription: e.target.value })}
                    placeholder="Pedestrian crossing near junction struck by motor vehicle KBZ 881L..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Potential Parties Capture */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    <span>3. Adverse Parties, Vehicles &amp; Insurers (For Conflict Scan)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Capturing these triggers automatic conflict check
                  </span>
                </div>

                {/* Sub-form to add party */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Entity / Driver Name</label>
                      <input
                        type="text"
                        value={partyForm.name}
                        onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })}
                        placeholder="e.g. Swift Shuttle SACCO"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Role</label>
                      <select
                        value={partyForm.role}
                        onChange={(e) => setPartyForm({ ...partyForm, role: e.target.value as IntakePartyInput['role'] })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                      >
                        <option value="defendant">Defendant (Registered Owner / Driver)</option>
                        <option value="insurer">Insurance Company</option>
                        <option value="witness">Eyewitness</option>
                        <option value="opposing_counsel">Opposing Advocate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Vehicle Reg / Policy No</label>
                      <input
                        type="text"
                        value={partyForm.idOrRegNumber}
                        onChange={(e) => setPartyForm({ ...partyForm, idOrRegNumber: e.target.value })}
                        placeholder="e.g. KBZ 881L"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Insurer Name (if known)</label>
                      <input
                        type="text"
                        value={partyForm.insuranceCompany}
                        onChange={(e) => setPartyForm({ ...partyForm, insuranceCompany: e.target.value })}
                        placeholder="e.g. Directline Assurance"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Contact Phone</label>
                      <input
                        type="text"
                        value={partyForm.phone}
                        onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })}
                        placeholder="e.g. +254 700 000000"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddPotentialParty}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                    >
                      + Add Party to Conflict Queue
                    </button>
                  </div>
                </div>

                {/* List of captured parties */}
                {formData.potentialParties.length > 0 && (
                  <div className="space-y-1.5">
                    {formData.potentialParties.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({p.role})</span>
                          {p.idOrRegNumber && (
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">[{p.idOrRegNumber}]</span>
                          )}
                          {p.insuranceCompany && (
                            <span className="text-[10px] text-slate-500">Insurer: {p.insuranceCompany}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePotentialParty(p.id)}
                          className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewIntakeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition"
                >
                  Save Intake &amp; Run Conflict Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Conflict Search & Partner Clearance Modal */}
      {showConflictModal && selectedIntake && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amber-700 dark:text-amber-500 font-bold">
                  Conflict of Interest Evaluation Engine
                </span>
                <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                  Search &amp; Audit Results for {selectedIntake.clientName}
                </h2>
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary Banner */}
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                selectedIntake.conflictCheck?.status === 'clear'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : selectedIntake.conflictCheck?.status === 'conflict_detected'
                  ? 'bg-rose-950/50 border-rose-800 text-rose-200'
                  : 'bg-amber-950/40 border-amber-800 text-amber-200'
              }`}>
                {selectedIntake.conflictCheck?.status === 'clear' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {selectedIntake.conflictCheck?.status === 'clear'
                      ? 'No Conflicts of Interest Detected'
                      : selectedIntake.conflictCheck?.status === 'conflict_detected'
                      ? 'Critical Adverse Conflict Flagged'
                      : 'Possible Conflict Matches Identified'}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Searched {selectedIntake.conflictCheck?.partiesSearched.length || 1} candidate entities against firm clients, adverse defendants, vehicle registrations, and active litigation records.
                  </div>
                </div>
              </div>

              {/* Matched Entities Ledger */}
              <div className="space-y-2">
                <h4 className="font-mono font-bold uppercase text-slate-400 text-[11px]">
                  Scanned Entity Matches ({selectedIntake.conflictCheck?.matchesFound.length || 0})
                </h4>

                {selectedIntake.conflictCheck?.matchesFound && selectedIntake.conflictCheck.matchesFound.length > 0 ? (
                  <div className="space-y-2">
                    {selectedIntake.conflictCheck.matchesFound.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                          m.severity === 'critical'
                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                            : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">
                            Party Searched: &quot;{m.partyName}&quot;
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold ${
                            m.severity === 'critical' ? 'bg-rose-900 text-rose-100' : 'bg-amber-900 text-amber-100'
                          }`}>
                            {m.matchType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {m.details}
                        </div>
                        {m.matchedMatterRef && (
                          <div className="text-[10px] font-mono text-amber-400">
                            Matter Ref: {m.matchedMatterRef} &bull; {m.matchedMatterTitle}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-center">
                    ✓ Clean search. No matching adverse parties or active client conflicts.
                  </div>
                )}
              </div>

              {/* Clearance Notes & Partner Decision */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <h4 className="font-mono font-bold uppercase text-slate-700 dark:text-slate-300 text-[11px]">
                  Partner Conflict Clearance &amp; Override Audit
                </h4>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                    Clearance Notes / Partner Written Justification
                  </label>
                  <textarea
                    rows={2}
                    value={clearanceNotes}
                    onChange={(e) => setClearanceNotes(e.target.value)}
                    placeholder="e.g. Checked matter KKC/PI/2026/00412; Directline is named as insurer but distinct policyholder and vehicle. No conflict."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleDeclineIntake(selectedIntake.id, 'Declined due to unresolvable conflict with existing client/matter')}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-lg font-medium border border-rose-300 dark:border-rose-800 transition"
                  >
                    Decline Lead (Conflict Found)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowConflictModal(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleClearConflict('clear')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow transition"
                    >
                      Approve &amp; Clear Conflict
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: KYC & Retainer Checklist Modal */}
      {showKycRetainerModal && selectedIntake && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amber-700 dark:text-amber-500 font-bold">
                  Eligibility, KYC &amp; Retainer
                </span>
                <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                  Advocate-Client Retainer Checklist
                </h2>
              </div>
              <button
                onClick={() => setShowKycRetainerModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Checklist Items */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
                  <input
                    type="checkbox"
                    checked={selectedIntake.kycRetainer?.idVerified || false}
                    onChange={(e) =>
                      updateIntakeKycRetainer(selectedIntake.id, { idVerified: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                      1. National ID / Passport Verified &amp; Certified
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                      Physical ID inspected or certified copy uploaded to document vault.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
                  <input
                    type="checkbox"
                    checked={selectedIntake.kycRetainer?.warrantToActSigned || false}
                    onChange={(e) =>
                      updateIntakeKycRetainer(selectedIntake.id, { warrantToActSigned: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                      2. Warrant to Act Executed by Client
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Authorizes Kariuki Kagunda &amp; Co. Advocates to represent claimant in all court proceedings.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
                  <input
                    type="checkbox"
                    checked={selectedIntake.kycRetainer?.retainerAgreementSigned || false}
                    onChange={(e) =>
                      updateIntakeKycRetainer(selectedIntake.id, { retainerAgreementSigned: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                      3. Advocate-Client Fee Retainer Agreement Signed
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard Advocates Remuneration Order terms or agreed contingency/retainer structure.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition">
                  <input
                    type="checkbox"
                    checked={selectedIntake.kycRetainer?.retainerDepositPaid || false}
                    onChange={(e) =>
                      updateIntakeKycRetainer(selectedIntake.id, { retainerDepositPaid: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                      4. Initial Retainer Deposit / Disbursement Commitment Received
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Covers police abstract fee, P3 doctor certification, and CTS filing fees.
                    </span>
                  </div>
                </label>
              </div>

              {/* Partner Approval */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Partner Matter Approval:</span>
                  <select
                    value={selectedIntake.kycRetainer?.partnerApproval || 'pending'}
                    onChange={(e) =>
                      updateIntakeKycRetainer(selectedIntake.id, {
                        partnerApproval: e.target.value as IntakeKycRetainer['partnerApproval'],
                      })
                    }
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-amber-700 dark:text-amber-400 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="pending">Pending Partner Review</option>
                    <option value="approved">Approved to Open Matter</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowKycRetainerModal(false)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition"
                >
                  Save &amp; Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Convert to Matter & Automated Provisioning */}
      {showConvertModal && selectedIntake && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amber-700 dark:text-amber-500 font-bold">
                  Stage 2: Matter Formalization
                </span>
                <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                  Open Matter &amp; Initialize Operational Workflows
                </h2>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary of Generated Structure */}
              <div className="p-4 bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="font-mono text-amber-800 dark:text-amber-400 font-bold">
                  ⚡ Auto-Generated Matter Structure:
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                  <li>Client account created for <strong>{selectedIntake.clientName}</strong></li>
                  <li>Matter Reference generated (e.g. <strong>KKC/PI/2026/00428</strong>)</li>
                  <li>Communication channel <strong>#KKC-PI-2026-...-general</strong> established</li>
                  <li>Incident &amp; Evidence register seeded with OB Number and facts</li>
                  <li>Medical Case initialized (P3 Form, Injury register, Medicolegal requests)</li>
                  <li>Liability &amp; Quantum ledger opened</li>
                  <li>Initial Stage 2 action tasks assigned to Stage Owner &amp; Court Clerk</li>
                </ul>
              </div>

              {/* Staffing Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Supervising Partner *</label>
                  <select
                    value={convertSupervisingId}
                    onChange={(e) => setConvertSupervisingId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roles[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Current Stage Lead / Worker *</label>
                  <select
                    value={convertStageOwnerId}
                    onChange={(e) => setConvertStageOwnerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roles[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Assigned Court Clerk *</label>
                  <select
                    value={convertClerkId}
                    onChange={(e) => setConvertClerkId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {users.filter((u) => u.roles.includes('court_clerk') || u.roles.includes('administrator')).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roles[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Finance Officer *</label>
                  <select
                    value={convertFinanceId}
                    onChange={(e) => setConvertFinanceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {users.filter((u) => u.roles.includes('finance_officer') || u.roles.includes('managing_partner')).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roles[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Initial Stage 2 Priority Action</label>
                <input
                  type="text"
                  value={convertInitialAction}
                  onChange={(e) => setConvertInitialAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConvertWithWorkflowAction}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Conversion &amp; Open Matter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
