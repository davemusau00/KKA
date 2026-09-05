import { RoleId, PermissionKey, UserProfile } from '../types';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  department: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  defaultPermissions: PermissionKey[];
}

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Modules' | 'Matters' | 'Tasks' | 'Documents' | 'Finance' | 'Administration';
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Modules
  { key: 'module.dashboard', label: 'Dashboard Access', category: 'Modules', description: 'View firm overview, alerts, and operational metrics' },
  { key: 'module.matters', label: 'Matters Workspace', category: 'Modules', description: 'Access legal matters, pleadings, and proceedings' },
  { key: 'module.clients', label: 'Clients Directory & Portal', category: 'Modules', description: 'View client CRM, contacts, and client portal links' },
  { key: 'module.tasks', label: 'Tasks & Filings', category: 'Modules', description: 'Access actionable tasks, dependencies, and deadlines' },
  { key: 'module.calendar', label: 'Court Diary & Calendar', category: 'Modules', description: 'Access court appearances, mentions, and appointments' },
  { key: 'module.documents', label: 'Document Vault', category: 'Modules', description: 'Browse, preview, and manage legal document repository' },
  { key: 'module.comms', label: 'Communications & Chat', category: 'Modules', description: 'Internal matter channels, client messaging, and alerts' },
  { key: 'module.finance', label: 'Finance & Accounts', category: 'Modules', description: 'Billing, fee notes, client trust accounting, and expenses' },
  { key: 'module.reports', label: 'Analytical Reports', category: 'Modules', description: 'Firm throughput, profitability, and compliance reports' },
  { key: 'module.admin', label: 'Firm Administration', category: 'Modules', description: 'Staff directory, branches, and audit log inspection' },
  { key: 'module.settings', label: 'Platform Settings', category: 'Modules', description: 'RBAC matrix, configurable workflows, and firm governance' },
  { key: 'module.integrations', label: 'External Integrations', category: 'Modules', description: 'Judiciary CTS, Google Workspace, M-Pesa Daraja, and SMS' },

  // Matters
  { key: 'matter.view', label: 'View Matters', category: 'Matters', description: 'Read matter files, proceedings, and parties' },
  { key: 'matter.create', label: 'Create Matters', category: 'Matters', description: 'Open new client matter files' },
  { key: 'matter.edit', label: 'Edit Matter Details', category: 'Matters', description: 'Update matter attributes, parties, and court numbers' },
  { key: 'matter.delete', label: 'Delete / Archive Matters', category: 'Matters', description: 'Archive or permanently close legal matter files' },
  { key: 'matter.stage_advance', label: 'Advance Workflow Stage', category: 'Matters', description: 'Transition matter from current stage to subsequent stages' },
  { key: 'matter.settlement_approve', label: 'Approve Settlement', category: 'Matters', description: 'Sign off on damages awards and insurer settlement offers' },

  // Tasks
  { key: 'task.view', label: 'View Tasks', category: 'Tasks', description: 'Inspect tasks, dependencies, and deadlines' },
  { key: 'task.create', label: 'Create Tasks', category: 'Tasks', description: 'Create work items, assign dependencies, and set dates' },
  { key: 'task.edit', label: 'Edit Tasks', category: 'Tasks', description: 'Modify task details, priority, and assignees' },
  { key: 'task.complete', label: 'Complete Tasks', category: 'Tasks', description: 'Mark work items as finished (subject to dependencies)' },
  { key: 'task.delete', label: 'Delete Tasks', category: 'Tasks', description: 'Remove redundant or cancelled tasks' },

  // Documents
  { key: 'document.view', label: 'View Documents', category: 'Documents', description: 'Read and preview stored legal documents and versions' },
  { key: 'document.upload', label: 'Upload Documents', category: 'Documents', description: 'Upload new documents or new version files' },
  { key: 'document.review_submit', label: 'Submit for Review', category: 'Documents', description: 'Submit drafted pleadings to advocate or partner for review' },
  { key: 'document.approve', label: 'Approve Documents', category: 'Documents', description: 'Approve reviewed document versions for signing and filing' },
  { key: 'document.sign', label: 'Digitally Sign Documents', category: 'Documents', description: 'Apply advocate digital signature and LSK certificate stamp' },
  { key: 'document.file', label: 'Record Court Filing', category: 'Documents', description: 'Record Judiciary CTS barcode and filed registry stamp' },
  { key: 'document.revert', label: 'Revert Versions', category: 'Documents', description: 'Rollback document to any previous historical version' },
  { key: 'document.delete', label: 'Delete Documents', category: 'Documents', description: 'Remove documents from the digital vault' },

  // Finance
  { key: 'finance.view', label: 'View Financials', category: 'Finance', description: 'Inspect billing, invoices, and expense claims' },
  { key: 'finance.expense_create', label: 'Submit Expense Request', category: 'Finance', description: 'File disbursement reimbursement and court fee claims' },
  { key: 'finance.expense_approve', label: 'Approve Expense Requests', category: 'Finance', description: 'Authorize disbursement payments and petty cash vouchers' },
  { key: 'finance.expense_disburse', label: 'Disburse Funds', category: 'Finance', description: 'Release payments from Petty Cash or Office Bank Accounts' },
  { key: 'finance.trust_ledger', label: 'Client Trust Accounting', category: 'Finance', description: 'Manage protected client trust funds under LSK rules' },
  { key: 'finance.billing_manage', label: 'Manage Billing & Rates', category: 'Finance', description: 'Configure advocate hourly rates and generate fee notes' },

  // Admin
  { key: 'admin.users_manage', label: 'Manage Staff Users', category: 'Administration', description: 'Create, edit, and deactivate law firm staff members' },
  { key: 'admin.roles_manage', label: 'Manage RBAC & Roles', category: 'Administration', description: 'Assign multi-role profiles and configure permission matrix' },
  { key: 'admin.workflows_manage', label: 'Manage Workflow Engine', category: 'Administration', description: 'Configure practice area workflows, stage gates, and tasks' },
  { key: 'admin.branches_manage', label: 'Manage Firm Branches', category: 'Administration', description: 'Configure physical offices, registry codes, and routing' },
  { key: 'admin.settings_manage', label: 'Manage Firm Settings', category: 'Administration', description: 'Update firm profile, court registries, and financial rules' },
  { key: 'admin.audit_view', label: 'View Audit Trail', category: 'Administration', description: 'Inspect immutable system event logs and access records' },
];

export const INITIAL_ROLES: Record<RoleId, RoleDefinition> = {
  managing_partner: {
    id: 'managing_partner',
    name: 'Managing Partner',
    description: 'Senior partner with supreme executive, judicial, and financial authority across all firm operations, settlements, and staff.',
    department: 'Executive Governance',
    color: 'amber',
    badgeBg: 'bg-amber-950/60 border border-amber-700/80',
    badgeText: 'text-amber-300',
    defaultPermissions: ALL_PERMISSIONS.map((p) => p.key), // Full comprehensive access
  },
  senior_partner: {
    id: 'senior_partner',
    name: 'Managing Partner (Senior Partner)',
    description: 'Senior partner alias with supreme executive authority.',
    department: 'Executive Governance',
    color: 'amber',
    badgeBg: 'bg-amber-950/60 border border-amber-700/80',
    badgeText: 'text-amber-300',
    defaultPermissions: ALL_PERMISSIONS.map((p) => p.key),
  },
  advocate: {
    id: 'advocate',
    name: 'Advocate',
    description: 'Qualified legal practitioner handling litigation, drafting pleadings, appearing in court, trial briefs, and client representation.',
    department: 'Litigation & Legal Practice',
    color: 'blue',
    badgeBg: 'bg-blue-950/60 border border-blue-700/80',
    badgeText: 'text-blue-300',
    defaultPermissions: [
      'module.dashboard',
      'module.matters',
      'module.clients',
      'module.tasks',
      'module.calendar',
      'module.documents',
      'module.comms',
      'module.reports',
      'matter.view',
      'matter.create',
      'matter.edit',
      'matter.stage_advance',
      'task.view',
      'task.create',
      'task.edit',
      'task.complete',
      'document.view',
      'document.upload',
      'document.review_submit',
      'document.approve',
      'document.sign',
      'document.revert',
      'finance.expense_create',
    ],
  },
  paralegal: {
    id: 'paralegal',
    name: 'Paralegal',
    description: 'Legal support specialist handling evidence extraction, police reports, medical examinations, client interviews, and filing prep.',
    department: 'Legal Operations',
    color: 'teal',
    badgeBg: 'bg-teal-950/60 border border-teal-700/80',
    badgeText: 'text-teal-300',
    defaultPermissions: [
      'module.dashboard',
      'module.matters',
      'module.clients',
      'module.tasks',
      'module.calendar',
      'module.documents',
      'module.comms',
      'matter.view',
      'task.view',
      'task.create',
      'task.edit',
      'task.complete',
      'document.view',
      'document.upload',
      'document.review_submit',
      'finance.expense_create',
    ],
  },
  administrator: {
    id: 'administrator',
    name: 'Administrator',
    description: 'Practice administrator orchestrating branch logistics, operational workflows, staff scheduling, client intake, and firm compliance.',
    department: 'Practice Administration',
    color: 'purple',
    badgeBg: 'bg-purple-950/60 border border-purple-700/80',
    badgeText: 'text-purple-300',
    defaultPermissions: [
      'module.dashboard',
      'module.matters',
      'module.clients',
      'module.tasks',
      'module.calendar',
      'module.documents',
      'module.comms',
      'module.reports',
      'module.admin',
      'module.settings',
      'matter.view',
      'matter.create',
      'matter.edit',
      'task.view',
      'task.create',
      'task.edit',
      'task.complete',
      'document.view',
      'document.upload',
      'admin.users_manage',
      'admin.branches_manage',
      'admin.settings_manage',
      'admin.audit_view',
      'finance.expense_create',
    ],
  },
  court_clerk: {
    id: 'court_clerk',
    name: 'Court Clerk',
    description: 'Registry and court specialist responsible for e-filing via Judiciary portal, summons extraction, process service, and court diary notes.',
    department: 'Court Registry & Service',
    color: 'emerald',
    badgeBg: 'bg-emerald-950/60 border border-emerald-700/80',
    badgeText: 'text-emerald-300',
    defaultPermissions: [
      'module.dashboard',
      'module.matters',
      'module.tasks',
      'module.calendar',
      'module.documents',
      'module.comms',
      'matter.view',
      'task.view',
      'task.complete',
      'task.create',
      'document.view',
      'document.upload',
      'document.file',
      'finance.expense_create',
    ],
  },
  finance_officer: {
    id: 'finance_officer',
    name: 'Finance Officer',
    description: 'Financial controller managing fee notes, advocate-client disbursements, KCB Client Trust Accounts, expense vetting, and M-Pesa reconciliations.',
    department: 'Finance & Accounts',
    color: 'green',
    badgeBg: 'bg-green-950/60 border border-green-700/80',
    badgeText: 'text-green-300',
    defaultPermissions: [
      'module.dashboard',
      'module.matters',
      'module.clients',
      'module.finance',
      'module.reports',
      'module.comms',
      'matter.view',
      'task.view',
      'task.complete',
      'document.view',
      'document.upload',
      'finance.view',
      'finance.expense_create',
      'finance.expense_approve',
      'finance.expense_disburse',
      'finance.trust_ledger',
      'finance.billing_manage',
    ],
  },
  technical_admin: {
    id: 'technical_admin',
    name: 'Technical Administrator',
    description: 'Systems architect managing platform settings, RBAC role permissions, configurable workflow engines, API integrations, and security logs.',
    department: 'IT & Legal Technology',
    color: 'rose',
    badgeBg: 'bg-rose-950/60 border border-rose-700/80',
    badgeText: 'text-rose-300',
    defaultPermissions: [
      'module.dashboard',
      'module.admin',
      'module.settings',
      'module.integrations',
      'module.documents',
      'document.view',
      'admin.users_manage',
      'admin.roles_manage',
      'admin.workflows_manage',
      'admin.branches_manage',
      'admin.settings_manage',
      'admin.audit_view',
      'finance.view',
    ],
  },
};

/**
 * Computes the mathematical UNION of all permissions for a user's assigned roles.
 */
export function getEffectivePermissions(user: UserProfile, roleOverrideMap?: Record<RoleId, PermissionKey[]>): Set<PermissionKey> {
  const permissions = new Set<PermissionKey>();
  
  // Ensure we check user.roles array or fall back to primary user.role
  const userRoles: RoleId[] = Array.isArray(user.roles) && user.roles.length > 0 
    ? user.roles 
    : [user.role];

  for (const roleId of userRoles) {
    // Check if custom permission map is provided (from settings), else fallback to default
    const rolePermissions = roleOverrideMap?.[roleId] || INITIAL_ROLES[roleId]?.defaultPermissions || [];
    for (const perm of rolePermissions) {
      permissions.add(perm);
    }
  }

  // Handle legacy permission key aliases
  if (permissions.has('matter.view')) {
    permissions.add('matter.read');
  }
  if (permissions.has('matter.edit')) {
    permissions.add('matter.update');
  }
  if (permissions.has('document.view')) {
    permissions.add('document.read');
  }
  if (permissions.has('finance.view')) {
    permissions.add('finance.client_money.read');
  }
  if (permissions.has('module.calendar')) {
    permissions.add('calendar.manage');
  }
  if (permissions.has('admin.users_manage')) {
    permissions.add('admin.users.manage');
  }
  if (permissions.has('module.reports')) {
    permissions.add('reports.firm.read');
  }

  return permissions;
}

/**
 * Checks if a user has a specific permission via role union.
 */
export function hasPermission(user: UserProfile, permission: PermissionKey, roleOverrideMap?: Record<RoleId, PermissionKey[]>): boolean {
  // Managing partner / senior partner has universal bypass
  if (user.roles?.includes('managing_partner') || user.roles?.includes('senior_partner') || user.role === 'managing_partner' || user.role === 'senior_partner') {
    return true;
  }
  const effective = getEffectivePermissions(user, roleOverrideMap);
  return effective.has(permission);
}

/**
 * Checks if a user has any of the specified permissions.
 */
export function hasAnyPermission(user: UserProfile, permissions: PermissionKey[], roleOverrideMap?: Record<RoleId, PermissionKey[]>): boolean {
  if (user.roles?.includes('managing_partner') || user.roles?.includes('senior_partner') || user.role === 'managing_partner' || user.role === 'senior_partner') {
    return true;
  }
  const effective = getEffectivePermissions(user, roleOverrideMap);
  return permissions.some((p) => effective.has(p));
}

/**
 * Checks if a user has all of the specified permissions.
 */
export function hasAllPermissions(user: UserProfile, permissions: PermissionKey[], roleOverrideMap?: Record<RoleId, PermissionKey[]>): boolean {
  if (user.roles?.includes('managing_partner') || user.roles?.includes('senior_partner') || user.role === 'managing_partner' || user.role === 'senior_partner') {
    return true;
  }
  const effective = getEffectivePermissions(user, roleOverrideMap);
  return permissions.every((p) => effective.has(p));
}
