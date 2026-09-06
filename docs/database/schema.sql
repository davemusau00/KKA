-- Foundational schema for Kariuki Kagunda & Co. Advocates OS.
-- This is intentionally a starting schema, not the final migration history.
-- Production implementation should split this into ordered migrations.

create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  default_currency text not null default 'KES',
  timezone text not null default 'Africa/Nairobi',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  address text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid unique,
  home_branch_id uuid references branches(id),
  full_name text not null,
  job_title text,
  email text,
  phone text,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  unique (organization_id, code)
);

create table permissions (
  key text primary key,
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table user_roles (
  user_id uuid not null references user_profiles(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table user_branch_memberships (
  user_id uuid not null references user_profiles(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  primary key (user_id, branch_id)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_type text not null check (client_type in ('person','organization')),
  display_name text not null,
  first_name text,
  last_name text,
  legal_name text,
  id_number text,
  phone text,
  alternate_phone text,
  email text,
  postal_address text,
  physical_address text,
  preferred_contact_method text,
  status text not null default 'active',
  notes text,
  created_by uuid references user_profiles(id),
  updated_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_search_idx on clients (organization_id, display_name);
create index clients_phone_idx on clients (organization_id, phone);
create index clients_id_number_idx on clients (organization_id, id_number);

create table practice_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text not null,
  is_active boolean not null default true,
  unique (organization_id, code)
);

create table matter_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  practice_area_id uuid references practice_areas(id),
  name text not null,
  code text not null,
  unique (organization_id, code)
);

create table workflow_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_type_id uuid references matter_types(id),
  name text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table workflow_stage_templates (
  id uuid primary key default gen_random_uuid(),
  workflow_template_id uuid not null references workflow_templates(id) on delete cascade,
  name text not null,
  code text not null,
  position integer not null,
  target_days integer,
  default_role_code text,
  requires_approval boolean not null default false,
  checklist jsonb not null default '[]'::jsonb,
  unique (workflow_template_id, code),
  unique (workflow_template_id, position)
);

create table matters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  internal_reference text,
  title text not null,
  client_id uuid not null references clients(id),
  practice_area_id uuid references practice_areas(id),
  matter_type_id uuid references matter_types(id),
  workflow_template_id uuid references workflow_templates(id),
  originating_branch_id uuid references branches(id),
  responsible_branch_id uuid references branches(id),
  supervising_user_id uuid references user_profiles(id),
  current_stage_instance_id uuid,
  status text not null default 'draft' check (status in ('draft','active','on_hold','closed','archived')),
  priority text not null default 'normal',
  summary text,
  next_action text,
  opened_at timestamptz,
  closed_at timestamptz,
  closure_reason text,
  created_by uuid references user_profiles(id),
  updated_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, internal_reference)
);

create index matters_ref_idx on matters (organization_id, internal_reference);
create index matters_status_idx on matters (organization_id, status);
create index matters_branch_idx on matters (organization_id, responsible_branch_id);

create table matter_stage_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  stage_template_id uuid not null references workflow_stage_templates(id),
  status text not null default 'active',
  owner_user_id uuid references user_profiles(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_notes text,
  created_at timestamptz not null default now()
);

alter table matters
  add constraint matters_current_stage_fk
  foreign key (current_stage_instance_id) references matter_stage_instances(id);

create table matter_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  user_id uuid not null references user_profiles(id),
  stage_id uuid references matter_stage_instances(id),
  role_on_matter text,
  is_primary boolean not null default false,
  assigned_by uuid references user_profiles(id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);

create table stage_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  from_stage_id uuid references matter_stage_instances(id),
  to_stage_id uuid references matter_stage_instances(id),
  from_user_id uuid references user_profiles(id),
  to_user_id uuid references user_profiles(id),
  handoff_notes text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create table matter_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  party_type text not null,
  name text not null,
  organization_name text,
  phone text,
  email text,
  address text,
  role_description text,
  notes text,
  created_at timestamptz not null default now()
);

create table court_proceedings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  court_name text,
  station text,
  division text,
  case_number text,
  proceeding_type text,
  filed_at timestamptz,
  status text not null default 'active',
  judicial_officer text,
  opposing_counsel text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index court_case_no_idx on court_proceedings (organization_id, case_number);

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete cascade,
  title text not null,
  deadline_type text,
  official_due_at timestamptz not null,
  source text,
  risk_level text not null default 'normal',
  notes text,
  completed_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete cascade,
  court_proceeding_id uuid references court_proceedings(id) on delete set null,
  title text not null,
  event_type text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  location text,
  virtual_meeting_url text,
  assigned_user_id uuid references user_profiles(id),
  organizer_id uuid references user_profiles(id),
  notes text,
  status text not null default 'scheduled',
  external_google_event_id text,
  sync_state text not null default 'not_synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_start_idx on calendar_events (organization_id, start_at);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete cascade,
  stage_id uuid references matter_stage_instances(id) on delete set null,
  calendar_event_id uuid references calendar_events(id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid references user_profiles(id),
  reviewer_id uuid references user_profiles(id),
  created_by uuid references user_profiles(id),
  priority text not null default 'normal',
  status text not null default 'todo',
  start_at timestamptz,
  due_at timestamptz,
  official_deadline_at timestamptz,
  blocked_reason text,
  completed_at timestamptz,
  is_recurring boolean not null default false,
  recurrence_rule text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assignee_status_idx on tasks (organization_id, assigned_to, status);
create index tasks_due_idx on tasks (organization_id, due_at);

create table task_dependencies (
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table document_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text not null,
  unique (organization_id, code)
);

create table document_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references document_categories(id),
  name text not null,
  code text not null,
  unique (organization_id, code)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete cascade,
  title text not null,
  document_type_id uuid references document_types(id),
  category_id uuid references document_categories(id),
  status text not null default 'draft',
  confidentiality_level text not null default 'internal',
  current_version_id uuid,
  owner_user_id uuid references user_profiles(id),
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size bigint,
  checksum text,
  uploaded_by uuid references user_profiles(id),
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

alter table documents
  add constraint documents_current_version_fk
  foreign key (current_version_id) references document_versions(id);

create table channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id),
  matter_id uuid references matters(id) on delete cascade,
  channel_type text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete cascade,
  parent_message_id uuid references messages(id) on delete cascade,
  sender_user_id uuid not null references user_profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text not null,
  is_active boolean not null default true,
  unique (organization_id, code)
);

create table financial_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id),
  name text not null,
  account_type text not null,
  currency text not null default 'KES',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table expense_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete set null,
  branch_id uuid references branches(id),
  category_id uuid references expense_categories(id),
  amount numeric(18,2) not null check (amount >= 0),
  currency text not null default 'KES',
  description text,
  requested_by uuid references user_profiles(id),
  approved_by uuid references user_profiles(id),
  status text not null default 'draft',
  requested_at timestamptz,
  approved_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete set null,
  branch_id uuid references branches(id),
  category_id uuid references expense_categories(id),
  expense_request_id uuid references expense_requests(id) on delete set null,
  account_id uuid references financial_accounts(id),
  amount numeric(18,2) not null check (amount >= 0),
  currency text not null default 'KES',
  spent_at timestamptz not null,
  description text,
  paid_by_user_id uuid references user_profiles(id),
  payment_source text,
  receipt_document_id uuid references documents(id),
  status text not null default 'recorded',
  created_at timestamptz not null default now()
);

create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete set null,
  account_id uuid not null references financial_accounts(id),
  transaction_type text not null,
  direction text not null check (direction in ('in','out')),
  amount numeric(18,2) not null check (amount >= 0),
  currency text not null default 'KES',
  occurred_at timestamptz not null,
  reference text,
  counterparty text,
  evidence_document_id uuid references documents(id),
  notes text,
  created_at timestamptz not null default now()
);

create table activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete cascade,
  actor_user_id uuid references user_profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_matter_time_idx on activity_events (matter_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table integration_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete cascade,
  provider text not null,
  external_account_id text,
  status text not null default 'connected',
  token_metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table domain_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid references matters(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  actor_user_id uuid references user_profiles(id),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Personal injury extension

create table pi_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  incident_at timestamptz,
  location text,
  incident_type text,
  description text,
  police_station text,
  ob_number text,
  created_at timestamptz not null default now()
);

create table pi_medical_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  provider_name text,
  record_type text,
  requested_at timestamptz,
  received_at timestamptz,
  document_id uuid references documents(id),
  amount numeric(18,2),
  currency text default 'KES',
  notes text,
  created_at timestamptz not null default now()
);

create table filing_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  court_proceeding_id uuid references court_proceedings(id),
  filing_type text,
  submitted_at timestamptz,
  submitted_by uuid references user_profiles(id),
  fee_amount numeric(18,2),
  currency text default 'KES',
  payment_reference text,
  receipt_document_id uuid references documents(id),
  filing_reference text,
  status text not null default 'draft',
  stamped_document_id uuid references documents(id),
  notes text,
  created_at timestamptz not null default now()
);

create table service_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  document_id uuid references documents(id),
  party_id uuid references matter_parties(id),
  service_method text,
  served_at timestamptz,
  served_by text,
  affidavit_document_id uuid references documents(id),
  status text,
  notes text,
  created_at timestamptz not null default now()
);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  offer_amount numeric(18,2),
  currency text default 'KES',
  offer_date date,
  offered_by text,
  status text not null default 'proposed',
  accepted_at timestamptz,
  settlement_amount numeric(18,2),
  settlement_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
