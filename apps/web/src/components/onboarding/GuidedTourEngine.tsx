import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Shield,
  Briefcase,
  Scale,
  DollarSign,
  Users,
  Settings,
  Terminal,
} from 'lucide-react';
import { authApi } from '../../lib/api/auth.api';

export type TourTrackKey =
  | 'core'
  | 'advocate'
  | 'paralegal'
  | 'clerk'
  | 'finance'
  | 'admin'
  | 'partner'
  | 'tech';

export interface TourStep {
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  workspace?: string;
  actionPrompt?: string;
}

export const TOUR_TRACK_METADATA: Record<
  TourTrackKey,
  { label: string; description: string; icon: React.FC<{ className?: string }> }
> = {
  core: { label: 'Core OS Tour', description: 'Essential navigation, search, and workspace basics', icon: Compass },
  advocate: { label: 'Advocate Tour', description: 'Litigation matters, court appearances, and case management', icon: Briefcase },
  paralegal: { label: 'Paralegal Tour', description: 'Intake workflows, task dependencies, and document preparation', icon: Users },
  clerk: { label: 'Court Clerk Tour', description: 'CTS filing packages, process service, and court outcomes', icon: Scale },
  finance: { label: 'Finance Tour', description: 'Client trust ledger, disbursements, and reconciliation', icon: DollarSign },
  admin: { label: 'Administrator Tour', description: 'User roles, permissions, branches, and system settings', icon: Settings },
  partner: { label: 'Managing Partner Tour', description: 'Firm-wide oversight, partner approvals, and risk auditing', icon: Shield },
  tech: { label: 'Technical Admin Tour', description: 'Audit trails, worker queues, and operational integrity', icon: Terminal },
};

export const TOUR_TRACKS: Record<TourTrackKey, TourStep[]> = {
  core: [
    {
      targetSelector: '[data-tour="search-bar"]',
      badge: 'Global Search',
      title: 'Universal Firm Search (⌘K)',
      description: 'Search instantly across client files, court case numbers, legal documents, tasks, and directory contacts from anywhere in the OS.',
      actionPrompt: 'Press ⌘K or click the search box at any time.',
    },
    {
      targetSelector: '[data-tour="quick-create"]',
      badge: 'Quick Action',
      title: 'One-Click Record Creation',
      description: 'Quickly initiate a new legal intake lead, create a task, log billable time, or schedule an appearance without leaving your current workspace.',
    },
    {
      targetSelector: '[data-tour="nav-matters"]',
      badge: 'Matter Architecture',
      title: 'Central Legal Matters Register',
      description: 'The primary operating spine. Every matter maintains an authoritative stage instance, assigned team, statutory deadlines, and audit history.',
      workspace: 'matters',
    },
    {
      targetSelector: '[data-tour="notifications-bell"]',
      badge: 'Real-Time Alerts',
      title: 'Notification & Activity Center',
      description: 'Live alerts for court date assignments, client messages, workflow handoffs, and partner financial approvals.',
    },
    {
      targetSelector: '[data-tour="branch-context"]',
      badge: 'Multi-Branch Governance',
      title: 'HQ & Branch Filtering',
      description: 'Switch between Nairobi Headquarters, Mombasa Branch, or firm-wide view. Access rules respect assigned physical offices.',
    },
  ],
  advocate: [
    {
      targetSelector: '[data-tour="nav-matters"]',
      badge: 'Active Caseload',
      title: 'Your Matters & Workflow Stages',
      description: 'Review case progression through Kenya Civil Procedure stages: pleadings drafting, court filing, hearing preparation, and decree execution.',
      workspace: 'matters',
    },
    {
      targetSelector: '[data-tour="nav-tasks"]',
      badge: 'Actionable Deadlines',
      title: 'Dependency-Guarded Tasks',
      description: 'Tasks follow legal prerequisites. Critical drafting tasks cannot be marked complete without required prior court filings.',
      workspace: 'tasks',
    },
    {
      targetSelector: '[data-tour="nav-court"]',
      badge: 'Litigation Diary',
      title: 'Court Diary & Case Tracking',
      description: 'Track upcoming mentions, hearings, and rulings. Record court orders once to trigger automated calendar propagation and client SMS.',
      workspace: 'court',
    },
    {
      targetSelector: '[data-tour="nav-documents"]',
      badge: 'Controlled Artwork',
      title: 'Document Studio & Firm Execution',
      description: 'Generate versioned legal pleadings, apply controlled digital firm stamps and approved partner signatures to immutable PDFs.',
      workspace: 'documents',
    },
  ],
  paralegal: [
    {
      targetSelector: '[data-tour="nav-clients"]',
      badge: 'Client Intake',
      title: 'Prospective Leads & Conflict Clearance',
      description: 'Record intake inquiries, clear conflict of interest against existing firm counterparties, and verify client KYC before matter creation.',
      workspace: 'clients',
    },
    {
      targetSelector: '[data-tour="nav-tasks"]',
      badge: 'Workflow Support',
      title: 'Task Execution & Dependencies',
      description: 'View tasks delegated by supervising advocates, manage task dependencies, and update completion status.',
      workspace: 'tasks',
    },
    {
      targetSelector: '[data-tour="nav-documents"]',
      badge: 'Evidence Bundling',
      title: 'Document Assembly & Uploads',
      description: 'Upload certified court pleadings, witness statements, police abstracts, and medical reports with automated SHA-256 integrity hashes.',
      workspace: 'documents',
    },
  ],
  clerk: [
    {
      targetSelector: '[data-tour="nav-court"]',
      badge: 'CTS E-Filing',
      title: 'Judiciary CTS Filing Queue',
      description: 'Manage filing packages ready for Judiciary CTS submission, record CTS barcode references, and upload stamped filed pleadings.',
      workspace: 'court',
    },
    {
      targetSelector: '[data-tour="nav-court"]',
      badge: 'Process Service',
      title: 'Process Service Queue & Returns',
      description: 'Log personal service attempts on defendants, upload signed affidavits of service, and mark service returned or evaded.',
      workspace: 'court',
    },
    {
      targetSelector: '[data-tour="nav-calendar"]',
      badge: 'Court Diary',
      title: 'Daily Court Session Management',
      description: 'Monitor registry call-overs, mention dates, and magistrate assignments across Milimani and regional court stations.',
      workspace: 'calendar',
    },
  ],
  finance: [
    {
      targetSelector: '[data-tour="nav-finance"]',
      badge: 'Client Trust Ledger',
      title: 'Strict Fund Separation',
      description: 'Client funds and firm office revenues remain strictly isolated. Every transaction is balanced and sequentially numbered.',
      workspace: 'finance',
    },
    {
      targetSelector: '[data-tour="nav-approvals"]',
      badge: 'Disbursements',
      title: 'Expense & Requisition Approvals',
      description: 'Two-tier verification for third-party litigation disbursements, court fees, and operational purchase orders.',
      workspace: 'approvals',
    },
    {
      targetSelector: '[data-tour="nav-finance"]',
      badge: 'Reconciliation',
      title: 'Bank Statement Reconciliation',
      description: 'Match ledger receipts and payments against live bank statements. Closed reconciliation periods prevent retrospective adjustments.',
      workspace: 'finance',
    },
  ],
  admin: [
    {
      targetSelector: '[data-tour="nav-admin"]',
      badge: 'Staff Administration',
      title: 'User Governance & Onboarding',
      description: 'Invite new advocates and support staff, assign branch allocations, and inspect active device sessions.',
      workspace: 'admin',
    },
    {
      targetSelector: '[data-tour="nav-integrations"]',
      badge: 'External Services',
      title: 'Telecom & Payment Connectors',
      description: 'Configure Africa’s Talking SMS credentials, Daraja M-Pesa client receipts, SMTP relay, and cloud document storage.',
      workspace: 'integrations',
    },
    {
      targetSelector: '[data-tour="nav-operations"]',
      badge: 'Firm Operations',
      title: 'Internal Projects, Assets & Procurement',
      description: 'Oversee corporate projects, asset custody, vendor purchase orders, and firm committee meetings.',
      workspace: 'operations',
    },
  ],
  partner: [
    {
      targetSelector: '[data-tour="nav-dashboard"]',
      badge: 'Executive Oversight',
      title: 'High-Level Firm KPI Radar',
      description: 'Review active caseload, WIP velocity, client funds held, overdue statutory deadlines, and pending partner authorizations.',
      workspace: 'dashboard',
    },
    {
      targetSelector: '[data-tour="nav-reports"]',
      badge: 'Practice Analytics',
      title: 'Ledger-Backed Financial Reports',
      description: 'Fee notes issued, collections ratio, advocate billable hours, and matter settlement position analytics.',
      workspace: 'reports',
    },
    {
      targetSelector: '[data-tour="nav-finance"]',
      badge: 'Settlement Distribution',
      title: 'Settlement Position Sign-off',
      description: 'Inspect authoritative net recovery distributions before releasing client trust funds.',
      workspace: 'finance',
    },
  ],
  tech: [
    {
      targetSelector: '[data-tour="nav-integrations"]',
      badge: 'System Architecture',
      title: 'Health & Integration Monitoring',
      description: 'Verify background BullMQ queue workers, Redis connection state, and encrypted backup schedules.',
      workspace: 'integrations',
    },
    {
      targetSelector: '[data-tour="nav-admin"]',
      badge: 'Audit Trail',
      title: 'Immutable Event Ledger',
      description: 'Review non-repudiable audit events recording actor user ID, firm ID, IP, and entity snapshot for every state mutation.',
      workspace: 'admin',
    },
  ],
};

interface GuidedTourEngineProps {
  track: TourTrackKey;
  onClose: () => void;
  onOpenWorkspace: (workspace: string) => void;
}

export const GuidedTourEngine: React.FC<GuidedTourEngineProps> = ({ track, onClose, onOpenWorkspace }) => {
  const steps = TOUR_TRACKS[track] || TOUR_TRACKS.core;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [saving, setSaving] = useState(false);

  const step = steps[currentStepIndex] || steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  // Track target element bounding rectangle
  useEffect(() => {
    const updateTarget = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget);
    const interval = setInterval(updateTarget, 400);

    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget);
      clearInterval(interval);
    };
  }, [step.targetSelector]);

  const handleNext = async () => {
    if (isLast) {
      setSaving(true);
      try {
        await authApi.updateOnboarding({ action: 'COMPLETE_TOUR', stepKey: `TOUR_${track.toUpperCase()}` });
      } catch {
        // Continue even if offline
      } finally {
        setSaving(false);
        onClose();
      }
      return;
    }

    const nextIndex = currentStepIndex + 1;
    const nextStep = steps[nextIndex];
    if (nextStep.workspace) {
      onOpenWorkspace(nextStep.workspace);
    }
    setCurrentStepIndex(nextIndex);
  };

  const handleBack = () => {
    if (isFirst) return;
    const prevIndex = currentStepIndex - 1;
    const prevStep = steps[prevIndex];
    if (prevStep.workspace) {
      onOpenWorkspace(prevStep.workspace);
    }
    setCurrentStepIndex(prevIndex);
  };

  const handleOpenWorkspace = () => {
    if (step.workspace) {
      onOpenWorkspace(step.workspace);
    }
  };

  const metadata = TOUR_TRACK_METADATA[track] || TOUR_TRACK_METADATA.core;
  const Icon = metadata.icon;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Semi-transparent Backdrop with Cutout Effect */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1.5px] pointer-events-auto transition-opacity" />

      {/* Target Element Highlight Box */}
      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="rounded-xl border-2 border-amber-400 bg-amber-400/10 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse pointer-events-none transition-all duration-300 z-[101]"
        />
      )}

      {/* Floating Tour Popover Card */}
      <div className="absolute inset-x-4 bottom-6 sm:bottom-auto sm:inset-x-auto sm:right-10 sm:top-20 max-w-md w-full pointer-events-auto z-[102] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-slate-900 border border-amber-600/40 rounded-2xl shadow-2xl p-5 space-y-4 text-slate-100 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-amber-500">
                  {metadata.label} &bull; Step {currentStepIndex + 1} of {steps.length}
                </span>
                <h3 className="font-serif font-bold text-base text-slate-100">{step.title}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Badge & Description */}
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 font-mono text-[10px] font-bold uppercase">
              {step.badge}
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
            {step.actionPrompt && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{step.actionPrompt}</span>
              </div>
            )}
          </div>

          {/* Quick Workspace Switch Prompt if on different screen */}
          {step.workspace && (
            <button
              onClick={handleOpenWorkspace}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-between border border-slate-700 transition"
            >
              <span>Go to {step.workspace.toUpperCase()} Workspace</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-5 bg-amber-400'
                      : idx < currentStepIndex
                      ? 'w-2 bg-emerald-500'
                      : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saving ? 'Completing…' : 'Complete Tour'}</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
