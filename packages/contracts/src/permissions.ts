export const permissionKeys = [
  "website.view", "website.edit", "website.review", "website.publish", "website.media", "website.settings", "website.leads.view", "website.leads.manage",
  "module.dashboard", "module.matters", "module.clients", "module.tasks", "module.calendar", "module.documents",
  "module.comms", "module.finance", "module.reports", "module.admin", "module.integrations", "module.settings",
  "module.court", "module.approvals", "module.operations", "module.knowledge",
  "matter.view", "matter.create", "matter.edit", "matter.update", "matter.delete", "matter.assign", "matter.stage_advance",
  "matter.settlement_approve", "matter.close", "matter.restricted_view", "matter.access_manage",
  "task.view", "task.create", "task.edit", "task.complete", "task.delete", "task.override_dependency",
  "document.view", "document.upload", "document.review_submit", "document.approve", "document.sign", "document.file",
  "document.revert", "document.delete", "document.restricted_view", "document.mark_apply", "document.mark_manage",
  "calendar.manage", "calendar.reschedule_controlled", "calendar.override_locked",
  "court.view", "court.proceeding_manage", "court.filing_manage", "court.service_manage", "court.outcome_record",
  "finance.view", "finance.expense_create", "finance.expense_approve", "finance.expense_disburse", "finance.trust_ledger",
  "finance.billing_manage", "finance.journal_post", "finance.reconciliation_manage", "finance.reports",
  "approval.view", "approval.decide", "approval.delegate",
  "admin.users_manage", "admin.roles_manage", "admin.workflows_manage", "admin.branches_manage", "admin.settings_manage",
  "admin.audit_view", "admin.integrations_manage", "admin.numbering_manage", "admin.feature_flags_manage",
  "reports.firm.read", "reports.branch.read", "reports.finance.read", "reports.workflow.read",
  "operations.manage", "hr.manage", "procurement.manage", "assets.manage", "knowledge.manage", "integrations.manage"
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
