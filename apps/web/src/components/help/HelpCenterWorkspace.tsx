import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Play,
  Briefcase,
  Users,
  Scale,
  DollarSign,
  Settings,
  Shield,
  Terminal,
  FileText,
  Calendar,
  Layers,
  AlertTriangle,
  FolderLock,
  MessageSquare,
  Building,
  GraduationCap,
  HardDrive,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi, type OnboardingState } from '../../lib/api/auth.api';
import {
  type TourTrackKey,
  TOUR_TRACK_METADATA,
  TOUR_TRACKS,
} from '../onboarding/GuidedTourEngine';

interface ManualChapter {
  chapterNumber: number;
  title: string;
  workspace: string;
  who: string;
  needs: string;
  steps: string[];
  saved: string;
  evidence: string;
  pitfalls: string;
  deepLink: string;
}

const manualChapters: ManualChapter[] = [
  {
    chapterNumber: 1,
    title: 'Getting Started & Firm Architecture',
    workspace: 'dashboard',
    who: 'Every authenticated advocate, paralegal, clerk, and administrator.',
    needs: 'Live authenticated user session, branch context assignment (Nairobi HQ or Mombasa Branch), and server-issued role permissions.',
    steps: [
      'Authenticate with your firm email and secure password or SSO credential.',
      'Inspect your active branch filter in the header bar; verify access boundaries for your assigned physical office.',
      'Review your active role capabilities and assigned matters on the Executive Dashboard.',
      'Use the Universal Search Bar (⌘K) to quickly open matters, court records, or directory contacts.',
      'Check notifications bell for live updates on assignments, filings, and financial approvals.',
    ],
    saved: 'User onboarding state, last active workspace, session tokens with device user-agent audit.',
    evidence: 'Session logs, audit events for authentication and branch switching; permissions cannot be modified locally.',
    pitfalls: 'Attempting to switch roles in production; expecting browser storage to act as firm record without server write confirmation.',
    deepLink: '/dashboard',
  },
  {
    chapterNumber: 2,
    title: 'Client Intake, Conflicts & KYC Verification',
    workspace: 'clients',
    who: 'Advocates, Paralegals, Intake Coordinators, and Front Desk Staff.',
    needs: 'Prospective client details, national ID/passport/registration number, adverse party names, and incident facts.',
    steps: [
      'Register prospective client inquiry in the Intake register.',
      'Execute automated conflict search across active clients, counterparties, witnesses, and matter parties.',
      'Obtain compliance officer sign-off if clearance is required.',
      'Upload verified KYC documentation (PIN certificate, National ID, Proof of Address).',
      'Execute client engagement and retainer agreement.',
      'Convert qualified intake into authoritative client & matter record with sequential reference.',
    ],
    saved: 'IntakeLead, ConflictCheckRecord, IntakeKycRetainer, immutable timeline history, converted Client and Matter.',
    evidence: 'Conflict search hit list with SHA-256 integrity hash, KYC verification timestamp, partner retainer approval.',
    pitfalls: 'Creating a legal matter prior to conflict clearance; treating unverified phone leads as retained clients.',
    deepLink: '/clients',
  },
  {
    chapterNumber: 3,
    title: 'Matter Management & Workflow Lifecycle',
    workspace: 'matters',
    who: 'Lead Advocates, Assigned Associates, and Managing Partners.',
    needs: 'Authoritative matter record and assigned practice area workflow (e.g. Kenya Personal Injury High Court / Subordinate Court).',
    steps: [
      'Select matter from the Central Legal Matters Register.',
      'Review active stage (Incident Facts, Medicals, Liability, Pleadings, Filing, Service, Pre-Trial, Hearing, Judgment, Recovery, Settlement, Closure).',
      'Verify stage gating rules and mandatory checklist items.',
      'Request or execute formal stage handoff with supervisor sign-off.',
      'Advance stage instance to trigger next workflow automation.',
    ],
    saved: 'Matter, WorkflowStageInstance, StageHandoff, stage transition audit log.',
    evidence: 'Explicit supervisor sign-off, gate checklist completion flags, stage transition audit event with actor ID.',
    pitfalls: 'Manually editing status tags without completing stage prerequisite checklist; bypassing partner sign-off on closure.',
    deepLink: '/matters',
  },
  {
    chapterNumber: 4,
    title: 'Tasks, Deadlines & Work Delegation',
    workspace: 'tasks',
    who: 'All firm staff, litigation teams, supervisors, and assigning advocates.',
    needs: 'Target matter reference, clear deliverable description, due date/time, and assigned staff member.',
    steps: [
      'Create task linked to matter or general firm operations.',
      'Define task dependencies (blocking tasks that must complete first).',
      'Attach statutory deadline if court-mandated.',
      'Update progress through Todo → In Progress → Review → Completed.',
      'Supervisor inspects deliverable and confirms completion.',
    ],
    saved: 'Task, Deadline, dependency edges, deadline calculation metadata, completion audit.',
    evidence: 'Completion timestamp, blocker evaluation audit, statutory deadline calendar sync confirmation.',
    pitfalls: 'Marking dependent tasks complete before prerequisites are finished; ignoring court deadline calculation flags (calendar vs business days).',
    deepLink: '/tasks',
  },
  {
    chapterNumber: 5,
    title: 'Court Diary, Filings & Service of Process',
    workspace: 'court',
    who: 'Court Clerks, Litigation Advocates, and Process Servers.',
    needs: 'Active litigation matter, court station (e.g. Milimani High Court), case number, and court proceeding record.',
    steps: [
      'Schedule court appearances and registry mentions in Court Diary.',
      'Assemble Judiciary CTS e-filing packages with barcode tracking.',
      'Dispatch documents to Process Service Queue.',
      'Log personal service attempts with affidavit evidence and GPS confirmation.',
      'Record court outcome once (triggering automatic next appearance, court-ordered deadline, drafting task, and client notification).',
    ],
    saved: 'CalendarEvent, CourtFilingPackage, ServiceQueueItem, OutcomeRecord, LegalDeadline.',
    evidence: 'CTS filing fee receipt number, stamped e-filing barcode, commissioner-sworn Affidavit of Service, single-transaction outcome audit.',
    pitfalls: 'Representing a document as filed without CTS receipt; recording an adjourned outcome without scheduling the next appearance date.',
    deepLink: '/court',
  },
  {
    chapterNumber: 6,
    title: 'Hearing Preparation, Briefs & Pre-Trial Compliance',
    workspace: 'matters',
    who: 'Trial Advocates, Supervising Partners, and Litigation Paralegals.',
    needs: 'Matter set for hearing or pre-trial conference, completed pleadings bundle.',
    steps: [
      'Open Hearing Preparation Workspace on the litigation matter.',
      'Verify Order 11 Pre-Trial Compliance checklist (witness statements exchanged, agreed issues framed, exhibits marked).',
      'Assemble Hearing Brief with trial chronology, legal submissions, and judicial authorities.',
      'Assign lead advocate and pupil/roving assistant.',
      'Conduct mock cross-examination review and witness preparation.',
    ],
    saved: 'HearingBriefData, PreTrialComplianceData, trial preparation audit trail.',
    evidence: 'Signed Pre-Trial Conference Order, indexed trial bundle with exhibit tabs.',
    pitfalls: 'Entering trial without confirmed witness attendance or without certified medical expert presence.',
    deepLink: '/matters',
  },
  {
    chapterNumber: 7,
    title: 'Controlled Documents, Versioning & Approvals',
    workspace: 'documents',
    who: 'Drafting Associates, Document Reviewers, and Partner Approvers.',
    needs: 'Matter reference, document category (Pleading, Agreement, Letter, Court Order), and initial draft or uploaded file.',
    steps: [
      'Create draft or upload document version 1 into Document Studio.',
      'Submit document version for supervisor review.',
      'Inspect revisions, suggestions, and diff view.',
      'Approve version or request revisions with comments.',
      'Lock approved version as immutable source.',
    ],
    saved: 'LegalDocument, DocumentVersion (immutable history with SHA-256 hash), review comments, approval sign-off.',
    evidence: 'Authoritative version tree, reviewer cryptographic ID, immutable file store URL.',
    pitfalls: 'Overwriting existing file versions instead of creating new version increment; filing unapproved draft versions in court.',
    deepLink: '/documents',
  },
  {
    chapterNumber: 8,
    title: 'Controlled Artwork, Signatures & Execution',
    workspace: 'documents',
    who: 'Authorized Partners, Managing Advocates, and Registered Signatories.',
    needs: 'Approved document version in locked state, authorized partner signature profile, and official firm stamp asset.',
    steps: [
      'Open Document Studio on approved version.',
      'Select digital execution tool.',
      'Choose registered firm mark (Physical Seal, Advocate Stamped Signature, Certified True Copy).',
      'Position mark coordinates with visual bounding box.',
      'Apply cryptographic execution stamp to generate a new derived executed version.',
    ],
    saved: 'Derived DocumentVersion with execution metadata, AuditEvent with IP, timestamp, and signature ID.',
    evidence: 'Visible cryptographic audit block at bottom of document, immutable storage hash, non-repudiation audit record.',
    pitfalls: 'Attempting to edit or crop document after signature application; sharing signature credentials between advocates.',
    deepLink: '/documents',
  },
  {
    chapterNumber: 9,
    title: 'Client Communications, Channels & Mentions',
    workspace: 'comms',
    who: 'All firm staff and designated client relationship advocates.',
    needs: 'Active matter or internal topic channel, team members assigned.',
    steps: [
      'Open matter channel or direct staff thread.',
      'Draft message with @mentions to trigger immediate notification.',
      'Attach referenced legal documents or court filings.',
      'Convert critical action items directly from chat message into assigned task with one click.',
    ],
    saved: 'ChannelMessage, CommunicationChannel, read markers, message-to-task conversion link.',
    evidence: 'Server-persisted delivery timestamps, audit log for message conversion into formal task.',
    pitfalls: 'Discussing confidential client matter details in public channels; assuming unread notifications will be received without acknowledgment.',
    deepLink: '/comms',
  },
  {
    chapterNumber: 10,
    title: 'Fee Notes, Invoicing & Billing Workflows',
    workspace: 'finance',
    who: 'Billing Advocates, Finance Officers, and Managing Partners.',
    needs: 'Billable time entries, disbursements ledger, and fee agreement terms (Advocates Remuneration Order or Agreed Fixed Fee).',
    steps: [
      'Open Finance & Billing workspace.',
      'Select matter and aggregate unbilled time entries and disbursements.',
      'Draft formal Fee Note with itemized professional fees, disbursements, and VAT (16%).',
      'Submit to partner for review and authorization.',
      'Issue Fee Note to client with payment terms.',
      'Apply client trust funds or record payment receipts upon settlement.',
    ],
    saved: 'FeeNote, FeeNoteItem, PaymentReceipt, billing audit log.',
    evidence: 'Authoritative fee note number, partner authorization timestamp, tax invoice reference.',
    pitfalls: 'Billing client for unverified third-party expenses without supporting voucher; issuing fee notes without partner sign-off.',
    deepLink: '/finance',
  },
  {
    chapterNumber: 11,
    title: 'Client Trust Accounts & Financial Operations',
    workspace: 'finance',
    who: 'Chief Financial Officer, Senior Partner, and Trust Accountant.',
    needs: 'Approved transaction request, valid trust bank account, and client authorization or court decree.',
    steps: [
      'Ensure strict segregation between Client Trust Account and Office Operating Account.',
      'Record client funds received into trust ledger.',
      'Post balanced double-entry journal (Debit Client Bank, Credit Client Trust Liability).',
      'Process disbursements only against verified credit balances.',
      'Perform monthly three-way bank reconciliation against bank statement.',
      'Lock closed financial periods to prevent back-dated alterations.',
    ],
    saved: 'GeneralLedgerEntry, JournalEntry, BankReconciliation, period lock flag.',
    evidence: 'Bank deposit slip, client authority letter, balanced journal voucher, reconciliation certificate signed by managing partner.',
    pitfalls: 'Commingling client trust funds with firm office accounts; disbursing funds exceeding client credit balance; altering transactions in locked periods.',
    deepLink: '/finance',
  },
  {
    chapterNumber: 12,
    title: 'Settlement Distribution & Matter Closure',
    workspace: 'matters',
    who: 'Lead Advocate, Managing Partner, and Head of Finance.',
    needs: 'Judgment award or signed settlement agreement, and gross recovery funds deposited into client trust account.',
    steps: [
      'Open Settlement Distribution Workspace on matter.',
      'Fetch authoritative ledger settlement position.',
      'Calculate statutory deductions: professional fees, VAT, litigation disbursements, medical expert lien, third-party subrogation.',
      'Verify net client recovery.',
      'Obtain dual-partner authorization.',
      'Execute disbursement via M-Pesa B2C, Bank Wire, or RTGS.',
      'Complete 7-point Matter Closure Audit (zero trust balance, all pleadings archived, client feedback received).',
      'Move matter to Closed.',
    ],
    saved: 'SettlementDistributionData, MatterClosureAuditData, payout ledger entries, final matter closure certificate.',
    evidence: 'Client signed release & discharge voucher, bank transfer confirmation code, zero trust balance audit certificate.',
    pitfalls: 'Closing a matter with outstanding trust balance; releasing settlement funds before insurer cheque or EFT has cleared.',
    deepLink: '/matters',
  },
  {
    chapterNumber: 13,
    title: 'People, Leave & Human Resources',
    workspace: 'operations',
    who: 'HR Manager, Department Heads, and All Staff Members.',
    needs: 'Active employee profile, leave balance allowance, and approved department supervisor.',
    steps: [
      'Navigate to Operations → People & Leave.',
      'Submit leave application specifying leave type (Annual, Sick, Compassionate, Study), dates, and covering colleague.',
      'Department head reviews staffing coverage and approves or declines.',
      'Record CPD units, performance appraisals, and professional certifications.',
    ],
    saved: 'LeaveRequest, StaffProfile, PerformanceAppraisal, CpdRecord, HR audit logs.',
    evidence: 'Supervisor approval timestamp, medical certificate for sick leave, Law Society of Kenya CPD certificate.',
    pitfalls: 'Taking leave without covering advocate handover on active court hearings; approving overlapping leave for sole department advocates.',
    deepLink: '/operations',
  },
  {
    chapterNumber: 14,
    title: 'Procurement, Purchasing & Asset Custody',
    workspace: 'operations',
    who: 'Procurement Officer, Operations Director, and Asset Custodians.',
    needs: 'Approved branch budget, qualified vendor directory profile, and requisition justification.',
    steps: [
      'Raise Purchase Requisition in Operations → Procurement.',
      'Multi-level approval (Office Manager → Finance Director).',
      'Generate official Purchase Order with unique serial number.',
      'Receive delivery and upload Goods Received Note (GRN) with vendor invoice.',
      'Tag hardware or equipment into Asset Custody register.',
      'Assign asset serial number to staff member with custody receipt acknowledgment.',
    ],
    saved: 'PurchaseRequisition, PurchaseOrder, GoodsReceivedNote, AssetCustodyRecord.',
    evidence: 'Signed delivery note, asset custody sign-off document, matched invoice and PO.',
    pitfalls: 'Accepting delivered goods without inspecting GRN quantity match; reallocating company laptops without updating asset custody register.',
    deepLink: '/operations',
  },
  {
    chapterNumber: 15,
    title: 'Internal Projects, Meetings & Action Items',
    workspace: 'operations',
    who: 'Operations Committee, Managing Partners, and Project Leads.',
    needs: 'Internal project charter or recurring meeting series schedule.',
    steps: [
      'Setup internal project with milestones, target completion dates, and allocated budget.',
      'Schedule recurring meeting series (Weekly Partners Conference, Monthly Litigation Review) with automated 90-day rolling occurrence generation.',
      'Record meeting minutes, attendee presence, and board decisions.',
      'Convert action items directly into assigned tasks with due dates.',
      'Track project financial health: Budget vs Committed vs Actual vs Forecast.',
    ],
    saved: 'InternalProject, MeetingSeries, Meeting, MeetingMinutes, MeetingDecision, project financial metrics.',
    evidence: 'Signed meeting minutes, task completion audit, financial commitment logs.',
    pitfalls: 'Recording minutes without recording formal decisions; allowing projects to exceed budget without partner approval.',
    deepLink: '/operations',
  },
  {
    chapterNumber: 16,
    title: 'Knowledge Base, Precedents & System Administration',
    workspace: 'knowledge',
    who: 'Knowledge Managers, Research Advocates, and Technical System Administrators.',
    needs: 'Standardized firm legal precedent, case digest, practice policy, or system configuration access.',
    steps: [
      'Draft knowledge item (Precedent, Case Summary, Practice Note, Checklist, Regulatory Guideline).',
      'Submit for senior research review.',
      'Publish to firm-wide knowledge registry with practice area tags and keyword index.',
      'For system administrators: manage RBAC permission assignments, inspect immutable audit ledger, monitor BullMQ background job queues, and verify encrypted daily backup snapshots.',
    ],
    saved: 'KnowledgeArticle, PrecedentTemplate, BackupSnapshot, AuditTrail.',
    evidence: 'Knowledge publication review sign-off, system health status verification, database backup checksum.',
    pitfalls: 'Publishing unvetted legal precedent templates without citation review; deleting audit logs (prevented by immutable write-only architecture).',
    deepLink: '/knowledge',
  },
];

const guides = [
  { title: 'Open a new personal injury matter', body: 'Start in Clients & Intake. Complete conflict clearance and KYC, then convert the qualified intake into a matter. The server creates the authoritative matter number and workflow.' },
  { title: 'Record a court outcome', body: 'Open Court Operations or the calendar court event. Record the outcome once. The server can create the next hearing, court-directed deadline, preparation task and matter next action in one transaction.' },
  { title: 'Work with controlled documents', body: 'Use Documents to create or upload matter documents. New versions remain immutable. Firm artwork and signatures are applied to a new version rather than overwriting the source.' },
  { title: 'Request leave', body: 'Open Operations → People & Leave. Submit the date range and chargeable days. HR users see the firm leave register and can approve or reject submitted requests.' },
  { title: 'Raise a purchase requisition', body: 'Open Operations → Procurement. Select the branch and vendor, enter the business purpose and amount, then submit. Approval, purchase-order creation and receipt are separate audited states.' },
  { title: 'Assign a laptop or other asset', body: 'Open Operations → Asset Custody. Choose an in-stock asset and assign it to a staff member. Returning the asset closes the custody record and moves it back to stock.' },
  { title: 'Capture meeting decisions', body: 'Open Operations → Projects & Meetings. Select the meeting, save minutes, record decisions and convert assigned actions with due dates into tasks.' },
  { title: 'Publish internal know-how', body: 'Open Knowledge. Create a draft procedure, precedent, case note or policy. Move it to review, then publish it once the summary is complete.' },
];

const faq = [
  ['Why does a button sometimes disappear?', 'Most screens are capability-driven. The server permissions assigned to your roles determine which modules and actions you can use.'],
  ['Can I work when the API is unavailable?', 'Normal operating mode treats the server as authoritative. The system should show an unavailable state rather than pretending local browser data was saved.'],
  ['Where do court deadlines come from?', 'Deadlines can be entered manually or created from a court outcome. Each persisted deadline keeps its calculation metadata and revision history.'],
  ['Does applying a signature alter the source document?', 'No. Controlled marks and visual signatures create a new immutable document version and an audit event.'],
  ['What is the difference between a requisition and a purchase order?', 'A requisition asks the firm to approve a purchase. An approved requisition can become a purchase order, which is then separately received.'],
  ['Where should reusable legal research live?', 'Use the Knowledge workspace for procedures, case notes, precedents, checklists and policies. Matter-specific evidence should remain on the matter/document record.'],
];

export const HelpCenterWorkspace: React.FC = () => {
  const { currentUser, setActiveWorkspace, startTour } = useApp();
  const [query, setQuery] = useState('');
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [savingGuide, setSavingGuide] = useState<number | null>(null);
  const [progressError, setProgressError] = useState('');
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        let state = await authApi.onboarding();
        if (!state.manualViewedAt) state = (await authApi.updateOnboarding({ action: 'VIEW_MANUAL' })).state;
        if (active) setOnboarding(state);
      } catch {
        if (active) setProgressError('Help progress is unavailable. Checklist changes will not be saved.');
      } finally {
        if (active) setLoadingProgress(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filteredGuides = useMemo(() => guides.filter((guide) => `${guide.title} ${guide.body}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredFaq = useMemo(() => faq.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredChapters = useMemo(() => manualChapters.filter((chapter) =>
    `${chapter.title} ${chapter.who} ${chapter.needs} ${chapter.steps.join(' ')} ${chapter.saved} ${chapter.evidence} ${chapter.pitfalls}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  const completed = useMemo(() => new Set(onboarding?.completedSteps ?? []), [onboarding]);
  const completedGuideCount = useMemo(() => guides.filter((_guide, index) => completed.has(`HELP_${index}`)).length, [completed]);

  const markGuideComplete = async (index: number) => {
    if (!onboarding || completed.has(`HELP_${index}`)) return;
    setSavingGuide(index);
    setProgressError('');
    try {
      const result = await authApi.updateOnboarding({ action: 'COMPLETE_STEP', stepKey: `HELP_${index}` });
      setOnboarding(result.state);
    } catch {
      setProgressError('Help progress could not be saved. No completion was recorded.');
    } finally {
      setSavingGuide(null);
    }
  };

  const userRoleKey = currentUser.role || (currentUser.roles && currentUser.roles[0]) || 'advocate';
  const roleRecommendationMap: Record<string, TourTrackKey> = {
    advocate: 'advocate',
    senior_partner: 'partner',
    managing_partner: 'partner',
    paralegal: 'paralegal',
    court_clerk: 'clerk',
    accountant: 'finance',
    finance_director: 'finance',
    office_admin: 'admin',
    admin: 'admin',
    system_administrator: 'tech',
  };
  const recommendedTrack = roleRecommendationMap[userRoleKey] || 'core';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8 text-slate-100 font-sans">
      {/* Header Banner */}
      <header className="rounded-3xl border border-amber-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400 shrink-0">
              <CircleHelp className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-500">
                KKA Legal OS Documentation & Onboarding
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-white">
                Help Center & Operational Manual
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                Comprehensive operational guidance, role-guided tour tracks, and standard operating procedures for {currentUser.fullName}.
                Every procedure is evidence-backed and strictly aligned with the firm’s authoritative server spine.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => startTour('core')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-950/50 transition active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Start Core Tour</span>
            </button>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 shadow-inner">
          <Search className="h-5 w-5 text-amber-500 shrink-0" />
          <input
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 16 manual chapters, role tours, procedures, and FAQs…"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Guided Tour Engine Launchpad (8 Tracks) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Interactive Guided Tours (8 Role Tracks)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your role track to begin a step-by-step interactive walk-through highlighting target workspaces, navigation spines, and governance rules.
            </p>
          </div>
          <span className="text-xs text-amber-500/80 font-mono">
            {Object.keys(TOUR_TRACK_METADATA).length} Tracks Available
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(TOUR_TRACK_METADATA) as TourTrackKey[]).map((trackKey) => {
            const meta = TOUR_TRACK_METADATA[trackKey];
            const stepsCount = TOUR_TRACKS[trackKey]?.length || 0;
            const Icon = meta.icon;
            const isRecommended = trackKey === recommendedTrack;

            return (
              <div
                key={trackKey}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  isRecommended
                    ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-slate-900/90 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow">
                    Recommended
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {stepsCount} steps
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100">{meta.label}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {meta.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono capitalize">
                    {trackKey} track
                  </span>
                  <button
                    type="button"
                    onClick={() => startTour(trackKey)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
                  >
                    <span>Launch</span>
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 16-Chapter KKA OS User Manual */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white">
                16-Chapter KKA OS User Manual & Standard Procedures
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                The authoritative operational handbook for the law firm. Each chapter specifies authorized personnel, prerequisites,
                step-by-step procedures, server-persisted records, audit requirements, common pitfalls, and deep-link pathways.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono self-end sm:self-auto">
            Showing {filteredChapters.length} of {manualChapters.length} Chapters
          </div>
        </div>

        <div className="space-y-3">
          {filteredChapters.map((chapter) => {
            const isExpanded = expandedChapter === chapter.chapterNumber;
            return (
              <div
                key={chapter.chapterNumber}
                className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                  isExpanded
                    ? 'border-amber-600/50 bg-slate-950/80 shadow-md'
                    : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.chapterNumber)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-slate-800/80 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                      {chapter.chapterNumber < 10 ? `0${chapter.chapterNumber}` : chapter.chapterNumber}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-sm text-slate-100 truncate">
                        {chapter.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        Target: {chapter.who}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                      {chapter.workspace}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-amber-400' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-800/60 space-y-4 text-xs leading-relaxed text-slate-300">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                        <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-400" /> Authorized Roles
                        </div>
                        <p className="text-slate-400">{chapter.who}</p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                        <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Required Prerequisites
                        </div>
                        <p className="text-slate-400">{chapter.needs}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="font-semibold text-slate-200 mb-2.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" /> Step-by-Step Procedure
                      </div>
                      <ol className="space-y-1.5 list-decimal list-inside text-slate-300">
                        {chapter.steps.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            <span className="text-slate-300">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                        <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Persistence & State Mutations
                        </div>
                        <p className="text-slate-400">{chapter.saved}</p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                        <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Evidence & Audit Requirement
                        </div>
                        <p className="text-slate-400">{chapter.evidence}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-900/40 bg-rose-950/15 p-3 text-rose-200">
                      <div className="font-semibold mb-1 flex items-center gap-1.5 text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Common Pitfalls & Forbidden Actions
                      </div>
                      <p className="text-xs text-rose-200/90">{chapter.pitfalls}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Target Workspace: {chapter.workspace}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveWorkspace(chapter.workspace)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-950/30 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition"
                      >
                        <span>Open {chapter.workspace === 'help' ? 'Help Center' : `${chapter.workspace} Workspace`}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredChapters.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No manual chapter matches your query "{query}".
            </div>
          )}
        </div>
      </section>

      {/* Bottom Split: Operational Progress Checklist & Rules of the OS */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Interactive Checklist */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-100">Operational Checklist & Understanding</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark tasks as understood. Your progress is recorded server-side against your user onboarding state.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/40">
              {loadingProgress ? '…' : `${completedGuideCount}/${guides.length}`}
            </span>
          </div>

          {progressError && (
            <p role="status" className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 text-xs text-amber-200">
              {progressError}
            </p>
          )}

          <div className="space-y-2">
            {filteredGuides.map((guide) => {
              const originalIndex = guides.indexOf(guide);
              const done = completed.has(`HELP_${originalIndex}`);
              return (
                <button
                  key={guide.title}
                  disabled={loadingProgress || savingGuide === originalIndex || done || !onboarding}
                  onClick={() => void markGuideComplete(originalIndex)}
                  className={`w-full rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed ${
                    done
                      ? 'border-emerald-800/60 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <div>
                      <div className="font-semibold text-xs text-slate-100">
                        {guide.title}
                        {savingGuide === originalIndex ? ' · Saving…' : ''}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                        {guide.body}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rules of the OS & FAQ */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-100">Three Rules of the OS</h3>
            </div>
            <ol className="space-y-2 text-xs leading-relaxed text-slate-400">
              <li className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                <span className="font-semibold text-slate-200 block mb-0.5">1. Server-confirmed means saved.</span>
                If the API rejects a mutation, the UI will not claim success. Local browser state is never authoritative.
              </li>
              <li className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                <span className="font-semibold text-slate-200 block mb-0.5">2. Matter access follows the server.</span>
                Search, documents, tasks and court records respect your server-issued role and branch boundaries.
              </li>
              <li className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                <span className="font-semibold text-slate-200 block mb-0.5">3. Evidence beats labels.</span>
                Filed, paid, served, signed and reconciled states require the corresponding persisted documentary evidence.
              </li>
            </ol>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-100">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-2">
              {filteredFaq.map(([question, answer]) => (
                <details key={question} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                    {question}
                  </summary>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
