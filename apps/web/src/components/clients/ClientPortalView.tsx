import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Eye,
  MessageSquare,
  Send,
  User,
  Phone,
  Mail,
  Copy,
  Share2,
  Building2,
  Scale,
  DollarSign,
  ChevronRight,
  Gavel,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, LegalDocument } from '../../types';
import { FirmLogo } from '../common/FirmLogo';

interface Props {
  initialClientId?: string;
  onClose?: () => void;
}

export const ClientPortalView: React.FC<Props> = ({ initialClientId, onClose }) => {
  const {
    clients,
    matters,
    calendarEvents,
    documents,
    workflowStages,
    users,
    payments,
    expenses,
    currentUser,
    notify,
  } = useApp();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || clients[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'progress' | 'court_dates' | 'documents' | 'trust_account' | 'inquiries'>('progress');
  const [selectedMatterId, setSelectedMatterId] = useState<string>('');
  const [previewDocument, setPreviewDocument] = useState<LegalDocument | null>(null);
  const [inquiryText, setInquiryText] = useState('');
  const [inquiries, setInquiries] = useState<Array<{ id: string; date: string; message: string; reply?: string }>>([
    {
      id: 'inq-1',
      date: '2026-03-01T10:15:00Z',
      message: 'Hello Advocate Mwangi, I visited Aga Khan Hospital for the follow-up X-Ray yesterday as instructed. When will the supplementary medical report be ready for court?',
      reply: 'Good morning Jane. We have received the receipt from Aga Khan radiology and Dr. Odhiambo is finalizing the addendum quantum report. We will lodge it at Milimani Commercial Court before Thursday.',
    },
  ]);
  const [copiedLink, setCopiedLink] = useState(false);

  const client = clients.find((c) => c.id === selectedClientId) || clients[0];

  // Client's matters
  const clientMatters = matters.filter((m) => m.clientId === client?.id);
  const activeMatter = clientMatters.find((m) => m.id === selectedMatterId) || clientMatters[0];

  // Lead advocate for this matter
  const leadAdvocate = activeMatter
    ? users.find((u) => u.id === activeMatter.supervisingUserId || activeMatter.assignedUserIds.includes(u.id)) || users[0]
    : users[0];

  // Upcoming court dates for this client's matters
  const clientMatterIds = clientMatters.map((m) => m.id);
  const clientCourtDates = calendarEvents
    .filter((e) => e.matterId && clientMatterIds.includes(e.matterId))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Associated safe documents (exclude partner_only)
  const clientDocuments = activeMatter
    ? documents.filter((d) => d.matterId === activeMatter.id && d.confidentialityLevel !== 'partner_only')
    : [];

  // Financial Trust calculations
  const clientPayments = activeMatter ? payments.filter((p) => p.matterId === activeMatter.id) : [];
  const clientDisbursements = activeMatter
    ? expenses.filter((e) => e.matterId === activeMatter.id && (e.status === 'approved' || e.status === 'disbursed'))
    : [];
  const totalDeposited = clientPayments.reduce((s, p) => s + p.amount, 0);
  const totalSpentDisbursements = clientDisbursements.reduce((s, e) => s + e.amount, 0);
  const remainingTrustFunds = totalDeposited - totalSpentDisbursements;

  // Workflow stage calculation
  const currentStageNum = activeMatter?.currentStageId || 1;
  const currentStageDef = workflowStages.find((s) => s.id === currentStageNum) || workflowStages[0];
  const progressPercent = Math.min(100, Math.round((currentStageNum / workflowStages.length) * 100));

  const handleCopyPortalLink = () => {
    navigator.clipboard?.writeText?.(`https://kklaw.co.ke/client-portal/${client?.id}?pin=KKC-${client?.idNumber || '7829'}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    const newInquiry = {
      id: `inq-${Date.now()}`,
      date: new Date().toISOString(),
      message: inquiryText.trim(),
      reply: undefined,
    };
    setInquiries((prev) => [newInquiry, ...prev]);
    setInquiryText('');

    notify(
      leadAdvocate?.id || currentUser.id,
      `New Client Inquiry from ${client?.displayName}`,
      `Client submitted a portal inquiry regarding ${activeMatter?.internalReference || 'matter'}: "${newInquiry.message.slice(0, 80)}..."`,
      'task_mention'
    );
  };

  if (!client) {
    return (
      <div className="p-8 text-center text-slate-400">
        No client records found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Client Portal Simulator Bar & Security Badge */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <FirmLogo size="md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Firm Client Portal
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Client view
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-100 mt-0.5">
              Client Self-Service Portal &bull; {client.displayName}
            </h2>
            <p className="text-xs text-slate-400">
              Safe, transparent visibility into matter milestones, verified court documents, and court calendar dates.
            </p>
          </div>
        </div>

        {/* Client Switcher & Share Tools */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSelectedMatterId('');
              }}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  {c.displayName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopyPortalLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedLink ? 'Copied Link' : 'Copy Access Link'}</span>
          </button>
        </div>
      </div>

      {/* Client Identity Card & Lead Advocate Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Client Reference Profile</div>
          <div className="text-base font-bold text-slate-100">{client.displayName}</div>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>{client.email}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              National ID: {client.idNumber} &bull; Ref: {client.id}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Assigned Lead Advocate</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-sm">
              {leadAdvocate?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">{leadAdvocate?.fullName || 'Senior Advocate'}</div>
              <div className="text-xs text-amber-400">{leadAdvocate?.jobTitle || 'Advocate of High Court'}</div>
              <div className="text-[11px] text-slate-500">LSK Bar Admission &bull; Nairobi HQ</div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 text-xs">
            <a
              href={`tel:${leadAdvocate?.phone || '+254700000000'}`}
              className="flex-1 text-center py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Direct Call
            </a>
            <button
              onClick={() => setActiveTab('inquiries')}
              className="flex-1 py-1 rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 font-medium transition"
            >
              Send Message
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Selected Legal Matter</div>
          {clientMatters.length > 0 ? (
            <div>
              <select
                value={activeMatter?.id || ''}
                onChange={(e) => setSelectedMatterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono outline-none mb-1.5"
              >
                {clientMatters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.internalReference} - {m.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Stage: <strong className="text-amber-400">{currentStageDef?.name || 'Active'}</strong></span>
                <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {progressPercent}% Complete
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">No active matter files registered.</div>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1 w-fit">
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTab === 'progress'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Matter Progress ({progressPercent}%)</span>
        </button>

        <button
          onClick={() => setActiveTab('court_dates')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTab === 'court_dates'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Court Dates ({clientCourtDates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTab === 'documents'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Associated Documents ({clientDocuments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trust_account')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTab === 'trust_account'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Trust Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTab === 'inquiries'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Advocate Inquiries</span>
        </button>
      </div>

      {/* Tab 1: Matter Progress & 19-Stage Roadmap */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Active Stage Spotlight Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-900/60 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Current Legal Status
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono border border-amber-800/60">
                  Stage {currentStageNum} of {workflowStages.length}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Target Timeline: ~{currentStageDef?.targetDurationDays || 14} days
              </span>
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-slate-100">
                {currentStageDef?.name || 'Matter Active'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {currentStageDef?.description ||
                  'Your case is actively being handled by your legal team in accordance with the Kenya Civil Procedure Rules.'}
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Case Milestone Progress</span>
                <span className="font-mono font-bold text-amber-400">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Plain-Language Explanation for Clients */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-200">What does this mean for you right now?</div>
                <p className="text-slate-400 leading-relaxed">
                  Our litigation department has prepared your formal court pleadings and filed them through the Kenya Judiciary E-Filing System. You do not need to attend court today. We will notify you via SMS and WhatsApp as soon as the court issues a hearing date.
                </p>
              </div>
            </div>
          </div>

          {/* Key Milestone Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Key Litigation Milestones &amp; Journey
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workflowStages.slice(0, 9).map((stage) => {
                const isPast = stage.id < currentStageNum;
                const isCurrent = stage.id === currentStageNum;
                const isFuture = stage.id > currentStageNum;

                return (
                  <div
                    key={stage.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-amber-950/30 border-amber-600/80 shadow-md'
                        : isPast
                        ? 'bg-slate-900/60 border-slate-800 opacity-90'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Stage {stage.id}
                      </span>
                      {isPast && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                          Active Now
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-[10px] text-slate-500 font-mono">Upcoming</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-100">{stage.name}</div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{stage.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Upcoming Court Dates & Instructions */}
      {activeTab === 'court_dates' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Scheduled Court Appearances &amp; Mentions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Always arrive 30 minutes before the scheduled time and report to your lead advocate.
              </p>
            </div>
          </div>

          {clientCourtDates.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-semibold text-slate-300">No Court Dates Scheduled Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your advocate will advise once the registry allocates a mention date for pre-trial directions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientCourtDates.map((event) => {
                const eventDate = new Date(event.startAt);
                const isVirtual = !!event.virtualMeetingUrl;

                return (
                  <div
                    key={event.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                          {event.eventType === 'court' ? 'Court Appearance' : 'Conference'}
                        </span>
                        <h4 className="text-base font-semibold text-slate-100 mt-1">{event.title}</h4>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-mono text-sm font-bold text-amber-400">
                          {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {eventDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Venue &amp; Courtroom</span>
                        </div>
                        <div className="text-slate-100 font-semibold">{event.location || 'Milimani Commercial Courts'}</div>
                        <div className="text-slate-400 text-[11px]">{event.notes || 'Courtroom 4, 3rd Floor'}</div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Gavel className="w-3.5 h-3.5 text-amber-400" />
                          <span>Session Mode</span>
                        </div>
                        <div className="text-slate-100 font-semibold">
                          {isVirtual ? 'Virtual Court Session (Microsoft Teams / Zoom)' : 'Physical Courtroom Session'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Advocate in Attendance: {leadAdvocate?.fullName || 'Senior Advocate'}
                        </div>
                      </div>
                    </div>

                    {/* Preparation instructions */}
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs space-y-1.5">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>Client Attendance Instructions</span>
                      </div>
                      <ul className="text-slate-300 text-[11px] list-disc list-inside space-y-0.5">
                        <li>Please arrive at the court station by 8:30 AM to meet Advocate {leadAdvocate?.fullName}.</li>
                        <li>Carry your original National Identity Card (or Passport) and medical clinic cards.</li>
                        <li>Maintain professional attire as required by Kenya Court rules.</li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Associated Safe Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Verified Court &amp; Case Documents
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                View filed pleadings, police abstracts, and certified medical reports associated with your matter.
              </p>
            </div>
          </div>

          {clientDocuments.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-semibold text-slate-300">No Documents Uploaded Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your advocate will publish verified pleadings and medical summaries once processed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {clientDocuments.map((doc) => {
                const latestVersion = doc.versions[doc.versions.length - 1];
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified Document
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 mt-2">{doc.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Type: {doc.documentType} &bull; v{latestVersion?.versionNumber || 1}
                      </p>
                      {latestVersion?.courtFilingRef && (
                        <div className="text-[11px] font-mono text-amber-300/90 mt-1">
                          Judiciary E-Filing Ref: {latestVersion.courtFilingRef}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewDocument(doc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            alert(`Downloading official certified copy: ${doc.title}.pdf`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs flex items-center gap-1 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Document Preview Modal */}
          {previewDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold">
                      {previewDocument.category}
                    </span>
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                      {previewDocument.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPreviewDocument(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-serif text-slate-800 dark:text-slate-300 space-y-4 text-xs leading-relaxed max-h-96 overflow-y-auto">
                  <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3 font-sans">
                    <div className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs">
                      Republic of Kenya &bull; In the High Court of Kenya
                    </div>
                    <div className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
                      Milimani Commercial &amp; Admiralty Division &bull; Case No. {activeMatter?.internalReference}
                    </div>
                  </div>

                  <p className="font-bold text-slate-900 dark:text-slate-200">BETWEEN:</p>
                  <div className="pl-4">
                    <strong>{client.displayName}</strong> .................................................... PLAINTIFF
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-200">- AND -</p>
                  <div className="pl-4">
                    <strong>DIRECTLINE ASSURANCE CO. LTD &amp; ANOR</strong> ................ DEFENDANTS
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-center uppercase">
                      {previewDocument.documentType}
                    </div>
                    <p>
                      1. The Plaintiff is an adult female of sound mind residing within the Republic of Kenya, whose address for service for purposes of this suit is care of Messrs. Kariuki Kagunda &amp; Co. Advocates, Nairobi.
                    </p>
                    <p>
                      2. At all material times to this suit, the 1st Defendant was the registered owner of motor vehicle registration mark KDA 890P which was negligently driven along Waiyaki Way, causing severe injuries and fractures to the Plaintiff.
                    </p>
                    <p>
                      3. REASONS WHEREFORE the Plaintiff prays for judgment against the Defendants jointly and severally for General Damages for Pain and Suffering, Special Damages of KES 185,000, costs of this suit, and interest at court rates.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    <span>E-Filed on: {new Date(previewDocument.createdAt).toLocaleDateString()}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono">Judiciary CTS Barcode: #2026-CTS-8492</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPreviewDocument(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium transition"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Trust Account Ledger */}
      {activeTab === 'trust_account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Total Retainer Deposited</div>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                KES {totalDeposited.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Official M-Pesa / Bank receipts</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Statutory Disbursements Incurred</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                KES {totalSpentDisbursements.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Court filing fees, Doctor P3, Process servers</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60">
              <div className="text-xs text-slate-400">Remaining Client Trust Credit</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                KES {remainingTrustFunds.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-0.5">Held in Advocates Client Account</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono uppercase text-slate-300 font-bold">
              Itemized Disbursement Breakdown
            </h4>
            <div className="space-y-2 text-xs">
              {clientDisbursements.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{d.description}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Category: {d.categoryId} &bull; Paid via: {d.paymentSource}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-amber-400">
                    KES {d.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              {clientDisbursements.length === 0 && (
                <div className="text-xs text-slate-500 py-2">No disbursements debited to this matter yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Direct Advocate Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <form onSubmit={handleSendInquiry} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Ask Your Advocate a Question</span>
            </h4>
            <p className="text-xs text-slate-400">
              Directly contacts Advocate {leadAdvocate?.fullName}. You will receive a response here and via SMS.
            </p>
            <textarea
              rows={3}
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder="Type your question or medical treatment update here..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-amber-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry to Legal Team</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">
              Message History ({inquiries.length})
            </h4>
            {inquiries.map((inq) => (
              <div key={inq.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
                      {client.displayName[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-200">You ({client.displayName})</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(inq.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-8">{inq.message}</p>

                {inq.reply ? (
                  <div className="mt-2 pl-8 pt-2 border-t border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                      <span>Advocate {leadAdvocate?.fullName}</span>
                      <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                        Official Response
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                      {inq.reply}
                    </p>
                  </div>
                ) : (
                  <div className="pl-8 text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>Awaiting Advocate Review &bull; Sent to Nairobi Office</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
