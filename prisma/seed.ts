import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../packages/database/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for seed");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const permissionKeys = [
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

const roleDefs: Record<string, { name: string; permissions: string[] }> = {
  managing_partner: { name: "Managing Partner", permissions: [...permissionKeys] },
  senior_partner: { name: "Senior Partner", permissions: permissionKeys.filter((p) => !p.startsWith("admin.integrations") && p !== "admin.feature_flags_manage") as string[] },
  advocate: { name: "Advocate", permissions: [
    "module.dashboard","module.matters","module.clients","module.tasks","module.calendar","module.documents","module.comms","module.court","module.approvals","module.knowledge",
    "matter.view","matter.create","matter.edit","matter.update","matter.assign","matter.stage_advance","task.view","task.create","task.edit","task.complete",
    "document.view","document.upload","document.review_submit","document.approve","document.sign","document.file","calendar.manage","court.view","court.proceeding_manage","court.outcome_record","approval.view","knowledge.manage"
  ] },
  paralegal: { name: "Paralegal", permissions: [
    "module.dashboard","module.matters","module.clients","module.tasks","module.calendar","module.documents","module.comms","module.court",
    "matter.view","matter.edit","matter.update","task.view","task.create","task.edit","task.complete","document.view","document.upload","document.review_submit","calendar.manage","court.view"
  ] },
  administrator: { name: "Administrator", permissions: [
    "module.dashboard","module.matters","module.clients","module.tasks","module.calendar","module.documents","module.comms","module.operations","module.admin",
    "matter.view","matter.create","matter.edit","matter.update","task.view","task.create","task.edit","task.complete","document.view","document.upload","calendar.manage","operations.manage","admin.users_manage","admin.branches_manage"
  ] },
  court_clerk: { name: "Court Clerk", permissions: [
    "module.dashboard","module.matters","module.tasks","module.calendar","module.documents","module.court",
    "matter.view","task.view","task.create","task.edit","task.complete","document.view","document.upload","document.file","calendar.manage","court.view","court.proceeding_manage","court.filing_manage","court.service_manage","court.outcome_record"
  ] },
  finance_officer: { name: "Finance Officer", permissions: [
    "module.dashboard","module.matters","module.finance","module.approvals","module.reports",
    "matter.view","finance.view","finance.expense_create","finance.expense_approve","finance.expense_disburse","finance.trust_ledger","finance.billing_manage","finance.journal_post","finance.reconciliation_manage","finance.reports","approval.view","approval.decide","reports.finance.read"
  ] },
  technical_admin: { name: "Technical Administrator", permissions: [...permissionKeys] }
};

const stages = [
  { n:1, code:"INTAKE", name:"Intake & Matter Opening", days:2, roles:["administrator","paralegal"], tasks:["Complete intake review","Confirm conflict clearance","Confirm KYC/retainer"], docs:["Client Identification","Retainer / Warrant to Act"] },
  { n:2, code:"INITIAL_RECORDS", name:"Initial Records & Notices", days:5, roles:["paralegal"], tasks:["Request police and incident records","Identify insurer and adverse parties"], docs:["Police Abstract"] },
  { n:3, code:"EVIDENCE", name:"Incident & Evidence Collection", days:14, roles:["paralegal","advocate"], tasks:["Complete incident evidence checklist","Obtain witness details"], docs:["Police Abstract","Scene / Vehicle Evidence"] },
  { n:4, code:"MEDICAL", name:"Medical Documentation", days:21, roles:["paralegal","advocate"], tasks:["Request treatment records","Obtain medical report"], docs:["Treatment Notes","Medical Report"] },
  { n:5, code:"LIABILITY_QUANTUM", name:"Liability & Quantum Assessment", days:7, roles:["advocate"], tasks:["Assess liability","Prepare quantum schedule"], docs:[] },
  { n:6, code:"DEMAND_NEGOTIATION", name:"Demand, Notice & Negotiation", days:30, roles:["advocate"], tasks:["Issue demand/notice","Track insurer response","Record negotiation position"], docs:["Demand / Statutory Notice"] },
  { n:7, code:"AUTHORITY_LITIGATE", name:"Authority to Litigate", days:5, roles:["advocate","senior_partner"], tasks:["Obtain client litigation authority","Partner review"], docs:["Authority to Litigate"], approval:true },
  { n:8, code:"PLEADINGS", name:"Pleadings Drafting & Review", days:10, roles:["advocate"], tasks:["Draft pleadings bundle","Submit for review"], docs:["Plaint","Verifying Affidavit","Witness Statement","List of Documents"] },
  { n:9, code:"FILING", name:"Court Filing", days:3, roles:["court_clerk","advocate"], tasks:["Prepare filing package","Record filing assessment and receipt","Upload stamped copies"], docs:["Filed Pleadings"] },
  { n:10, code:"SERVICE", name:"Summons & Service", days:14, roles:["court_clerk","paralegal"], tasks:["Extract/prepare summons","Assign service","Obtain affidavit of service"], docs:["Summons","Affidavit of Service"] },
  { n:11, code:"DEFENCE_CLOSE", name:"Defence / Pleadings Close", days:21, roles:["advocate"], tasks:["Review defence","Identify reply/amendment needs","Confirm pleadings close"], docs:["Defence"] },
  { n:12, code:"PRETRIAL", name:"Pre-Trial Compliance", days:21, roles:["advocate","paralegal"], tasks:["Complete pre-trial compliance checklist","Prepare bundles and issues"], docs:["Trial Bundle"] },
  { n:13, code:"HEARING_PREP", name:"Hearing Preparation", days:14, roles:["advocate","paralegal"], tasks:["Prepare hearing brief","Confirm witnesses","Confirm originals and exhibits"], docs:["Hearing Brief"] },
  { n:14, code:"HEARING", name:"Hearing", days:1, roles:["advocate"], tasks:["Attend hearing","Record court outcome and directions"], docs:[] },
  { n:15, code:"SUBMISSIONS", name:"Submissions", days:14, roles:["advocate"], tasks:["Draft submissions","Review authorities","File/serve submissions"], docs:["Written Submissions"] },
  { n:16, code:"JUDGMENT", name:"Judgment & Decree", days:30, roles:["advocate","court_clerk"], tasks:["Record judgment","Extract decree/certificate as required"], docs:["Judgment"] },
  { n:17, code:"RECOVERY", name:"Recovery / Execution", days:60, roles:["advocate","finance_officer"], tasks:["Issue payment demand","Track recovery/execution actions"], docs:["Decree"] },
  { n:18, code:"SETTLEMENT", name:"Settlement & Client Distribution", days:10, roles:["advocate","finance_officer","senior_partner"], tasks:["Confirm funds received","Prepare settlement statement","Approve deductions and client payout"], docs:["Settlement Statement"], approval:true },
  { n:19, code:"CLOSURE", name:"Closure & Archive", days:5, roles:["advocate","administrator"], tasks:["Complete closure checklist","Confirm finance reconciliation","Archive matter"], docs:["Closing Note"], approval:true }
];

const settingDefs = [
  ["firm.timezone","General","Firm timezone","Primary timezone for firm operations","STRING",["FIRM"],"Africa/Nairobi",false,false],
  ["firm.locale","General","Locale","Default locale","STRING",["FIRM"],"en-KE",false,false],
  ["numbering.matter.pattern","Numbering","Matter number pattern","Pattern tokens: {firm}, {branch}, {practice}, {year}, {seq:N}","STRING",["FIRM","BRANCH","PRACTICE_AREA","MATTER_TYPE"],"{firm}/{practice}/{year}/{seq:5}",true,true],
  ["numbering.client.pattern","Numbering","Client number pattern","Client number pattern","STRING",["FIRM","BRANCH"],"CL/{year}/{seq:5}",true,true],
  ["documents.max_upload_bytes","Documents","Maximum upload bytes","Maximum permitted single-file size","NUMBER",["FIRM","BRANCH"],52428800,false,false],
  ["documents.draft_watermark.enabled","Documents","Draft watermark","Watermark draft versions","BOOLEAN",["FIRM","PRACTICE_AREA","MATTER_TYPE"],true,false,false],
  ["documents.draft_watermark.text","Documents","Draft watermark text","Text for draft watermark","STRING",["FIRM"],"DRAFT - PRIVILEGED & CONFIDENTIAL - KARIUKI KAGUNDA & CO.",false,false],
  ["documents.retention.years","Documents","Default retention years","Default archival retention before review","NUMBER",["FIRM","PRACTICE_AREA","MATTER_TYPE"],7,true,true],
  ["calendar.court.default_edit_policy","Calendar","Court event edit policy","Default drag/reschedule policy for court dates","ENUM",["FIRM","PRACTICE_AREA"],"REASON_REQUIRED",true,true],
  ["calendar.deadline.official_edit_policy","Calendar","Official deadline edit policy","Official deadlines must not silently move","ENUM",["FIRM"],"LOCKED",true,true],
  ["calendar.default_reminders","Calendar","Default reminders","Default reminder offsets in minutes","JSON",["FIRM","PRACTICE_AREA","MATTER_TYPE"],[10080,4320,1440,120],false,false],
  ["security.session_ttl_seconds","Security","Session TTL","Authenticated session duration","NUMBER",["FIRM","ROLE"],28800,true,true],
  ["security.mark_application_reauth","Security","Re-authenticate before signature/seal","Require elevated confirmation before applying protected marks","BOOLEAN",["FIRM","ROLE"],true,true,true],
  ["finance.base_currency","Finance","Base currency","Default accounting currency","STRING",["FIRM","LEGAL_ENTITY"],"KES",true,true],
  ["finance.petty_cash.approval_threshold","Finance","Petty cash approval threshold","Amount above which approval is mandatory","NUMBER",["FIRM","BRANCH"],25000,true,true],
  ["mail.default_sender_identity","Communications","Default sender identity","Sender identity ID or key","STRING",["FIRM","BRANCH","PRACTICE_AREA"],null,true,true],
  ["notifications.quiet_hours","Notifications","Quiet hours","Non-critical delivery quiet hours","JSON",["FIRM","ROLE","USER"],{"enabled":false,"start":"21:00","end":"06:00"},false,false],
  ["marks.default_firm_seal","Firm Marks","Default firm seal","Firm mark asset ID used when policy allows","ASSET",["FIRM","BRANCH"],null,true,true],
  ["marks.execution.default_preset","Firm Marks","Default execution placement","Placement preset ID","STRING",["FIRM","DOCUMENT_TEMPLATE"],null,true,true]
] as const;

async function main() {
  const firm = await prisma.firm.upsert({
    where: { id: "kka-firm" },
    create: { id: "kka-firm", name: "Kariuki Kagunda & Co. Advocates", shortName: "KKA", timezone: "Africa/Nairobi", locale: "en-KE", currency: "KES" },
    update: { name: "Kariuki Kagunda & Co. Advocates", shortName: "KKA" }
  });

  const entity = await prisma.legalEntity.upsert({
    where: { id: "kka-entity-main" },
    create: { id: "kka-entity-main", firmId: firm.id, name: "Kariuki Kagunda & Co. Advocates", defaultCurrency: "KES" },
    update: {}
  });

  const nairobi = await prisma.branch.upsert({
    where: { firmId_code: { firmId: firm.id, code: "NRB" } },
    create: { firmId: firm.id, legalEntityId: entity.id, name: "Nairobi Branch", code: "NRB", timezone: "Africa/Nairobi", numberingPrefix: "NRB" },
    update: { legalEntityId: entity.id, name: "Nairobi Branch", active: true }
  });
  await prisma.branch.upsert({
    where: { firmId_code: { firmId: firm.id, code: "B02" } },
    create: { firmId: firm.id, legalEntityId: entity.id, name: "Branch Two", code: "B02", timezone: "Africa/Nairobi", numberingPrefix: "B02" },
    update: { legalEntityId: entity.id, active: true }
  });

  for (const key of permissionKeys) {
    await prisma.permission.upsert({ where: { key }, create: { key, category: key.split(".")[0], description: key }, update: {} });
  }

  const permissionRows = await prisma.permission.findMany({ where: { key: { in: [...permissionKeys] } } });
  const permissionByKey = new Map(permissionRows.map((p) => [p.key, p.id]));
  const roleByKey = new Map<string,string>();
  for (const [key, def] of Object.entries(roleDefs)) {
    const role = await prisma.role.upsert({
      where: { firmId_key: { firmId: firm.id, key } },
      create: { firmId: firm.id, key, name: def.name, system: true, active: true },
      update: { name: def.name, active: true }
    });
    roleByKey.set(key, role.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const ids = def.permissions.map((p) => permissionByKey.get(p)).filter(Boolean) as string[];
    if (ids.length) await prisma.rolePermission.createMany({ data: ids.map((permissionId) => ({ roleId: role.id, permissionId })), skipDuplicates: true });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 14) throw new Error("SEED_ADMIN_PASSWORD must be at least 14 characters");
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      create: { firmId: firm.id, homeBranchId: nairobi.id, email: adminEmail, fullName: process.env.SEED_ADMIN_NAME || "System Administrator", jobTitle: "Technical Administrator", status: "ACTIVE", passwordHash },
      update: { firmId: firm.id, homeBranchId: nairobi.id, status: "ACTIVE", passwordHash }
    });
    const roleId = roleByKey.get("technical_admin")!;
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId } }, create: { userId: user.id, roleId }, update: {} });
    await prisma.userBranch.upsert({ where: { userId_branchId: { userId: user.id, branchId: nairobi.id } }, create: { userId: user.id, branchId: nairobi.id }, update: {} });
    console.log(`Seeded admin ${adminEmail}`);
  } else {
    console.warn("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set; no login user was created.");
  }

  for (const [key, category, label, description, valueType, allowedScopes, defaultValue, requiresApproval, requiresReason, sensitive] of settingDefs as any[]) {
    await prisma.settingDefinition.upsert({
      where: { key },
      create: {
        key, category, label, description, valueType,
        allowedScopes,
        defaultValue: defaultValue === null ? undefined : defaultValue,
        requiresApproval: Boolean(requiresApproval), requiresReason: Boolean(requiresReason),
        sensitivity: sensitive ? "CONFIDENTIAL" : "INTERNAL"
      },
      update: { category, label, description, allowedScopes, requiresApproval: Boolean(requiresApproval), requiresReason: Boolean(requiresReason) }
    });
  }

  const workflow = await prisma.workflowTemplate.upsert({
    where: { firmId_practiceArea_matterType_name: { firmId: firm.id, practiceArea: "Personal Injury", matterType: "Road Traffic Accident", name: "Personal Injury - Road Traffic Accident" } },
    create: { firmId: firm.id, name: "Personal Injury - Road Traffic Accident", practiceArea: "Personal Injury", matterType: "Road Traffic Accident", description: "Canonical 19-stage KKA personal injury litigation workflow" },
    update: { active: true }
  });
  const version = await prisma.workflowVersion.upsert({
    where: { templateId_version: { templateId: workflow.id, version: 1 } },
    create: { templateId: workflow.id, version: 1, status: "PUBLISHED", effectiveFrom: new Date("2026-01-01T00:00:00+03:00"), publishedAt: new Date() },
    update: { status: "PUBLISHED" }
  });
  for (const s of stages) {
    const next = stages.find((x) => x.n === s.n + 1);
    await prisma.workflowStage.upsert({
      where: { workflowVersionId_stageNumber: { workflowVersionId: version.id, stageNumber: s.n } },
      create: {
        workflowVersionId: version.id, stageNumber: s.n, code: s.code, name: s.name,
        targetDurationDays: s.days, responsibleRoleKeys: s.roles,
        requiresApproval: Boolean((s as any).approval), approvalRoleKey: (s as any).approval ? "senior_partner" : null,
        allowedNextStageCodes: next ? [next.code] : [], requiredTaskTitles: s.tasks, requiredDocumentTypes: s.docs,
        checklistItems: s.tasks.map((t) => `Confirm: ${t}`),
        autoCreateTasks: s.tasks.map((title, i) => ({ title, role: s.roles[0], dueInDays: Math.max(1, Math.min(s.days, i + 2)), priority: s.n >= 14 ? "HIGH" : "MEDIUM" }))
      },
      update: {
        code: s.code, name: s.name, targetDurationDays: s.days, responsibleRoleKeys: s.roles,
        requiresApproval: Boolean((s as any).approval), approvalRoleKey: (s as any).approval ? "senior_partner" : null,
        allowedNextStageCodes: next ? [next.code] : [], requiredTaskTitles: s.tasks, requiredDocumentTypes: s.docs,
        checklistItems: s.tasks.map((t) => `Confirm: ${t}`)
      }
    });
  }

  const accounts = [
    ["1000","Office Bank","ASSET","OFFICE"],
    ["1010","Petty Cash","ASSET","PETTY_CASH"],
    ["1020","M-Pesa / Mobile Money","ASSET","MOBILE_MONEY"],
    ["1100","Client Trust Bank","ASSET","CLIENT"],
    ["2100","Client Funds Liability","LIABILITY","CLIENT"],
    ["4000","Professional Fees Income","INCOME","OFFICE"],
    ["4100","Disbursement Recoveries","INCOME","OFFICE"],
    ["5000","Matter Disbursements","EXPENSE","OFFICE"],
    ["5100","Office Operating Expenses","EXPENSE","OFFICE"]
  ] as const;
  for (const [code,name,accountClass,fundType] of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { firmId_code: { firmId: firm.id, code } },
      create: { firmId: firm.id, code, name, accountClass, fundType, currency: "KES", active: true },
      update: { name, accountClass, fundType, active: true }
    });
  }

  await prisma.numberSequence.upsert({
    where: { firmId_branchId_entityType_year: { firmId: firm.id, branchId: "__GLOBAL__", entityType: "MATTER", year: 0 } },
    create: { firmId: firm.id, branchId: "__GLOBAL__", entityType: "MATTER", year: 0, pattern: "{firm}/{practice}/{year}/{seq:5}" },
    update: { pattern: "{firm}/{practice}/{year}/{seq:5}" }
  });

  console.log("KKA backend seed complete.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
