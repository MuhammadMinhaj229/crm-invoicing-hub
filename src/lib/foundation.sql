-- SAFAR N MANZIL — Foundation schema
-- Run once in your Supabase project's SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- Creates the core business tables, roles, row-level security and audit log.

create extension if not exists pgcrypto;

-- ---------- Organizations: the three ventures stay separate ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- safar-n-manzil | safa-fresh | safa-foods
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- Roles ----------
do $$ begin
  create type public.app_role as enum
    ('super_admin', 'admin', 'ops_manager', 'sales_agent', 'finance_officer', 'viewer');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_team(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create or replace function public.can_write(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role <> 'viewer'
  )
$$;

-- ---------- CRM core ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  name text not null,
  phone text,
  email text,
  source text not null default 'manual', -- website | whatsapp | instagram | facebook | referral | manual | campaign | api
  source_detail text,
  campaign text,
  service_interest text,
  location text,
  status text not null default 'new', -- new | contacted | qualified | converted | lost
  assigned_to uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  lead_id uuid references public.leads(id),
  name text not null,
  phone text,
  phone_normalized text,
  email text,
  email_normalized text,
  whatsapp text,
  gulf_country text,
  gulf_city text,
  india_address text,
  lifecycle_status text not null default 'customer',
  -- qualified | converted | customer | active | inactive | churn_risk | reactivated | lost
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_phone_normalized_key
  on public.contacts (phone_normalized) where phone_normalized is not null;
create unique index if not exists contacts_email_normalized_key
  on public.contacts (email_normalized) where email_normalized is not null;

create table if not exists public.provider_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique -- ac_repair | legal | healthcare | parcel | grocery | ...
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  category_id uuid references public.provider_categories(id),
  name text not null,
  business_name text,
  phone text,
  whatsapp text,
  email text,
  city text,
  service_areas text[] not null default '{}',
  verification_status text not null default 'pending', -- pending | verified | suspended
  availability text not null default 'available', -- available | busy | offline
  is_primary boolean not null default false,
  rate_card jsonb not null default '{}',
  rating numeric(3,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  contact_id uuid not null references public.contacts(id),
  title text not null,
  description text,

  service_category text,
  status text not null default 'open', -- open | in_progress | waiting | completed | cancelled
  priority text not null default 'normal', -- low | normal | high | urgent
  assigned_provider_id uuid references public.providers(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------- Finance: structured money, never notes ----------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  contact_id uuid not null references public.contacts(id),
  service_request_id uuid references public.service_requests(id),
  invoice_number text not null unique,
  status text not null default 'draft', -- draft | sent | paid | partially_paid | cancelled | refunded
  currency char(3) not null default 'INR',
  subtotal numeric(14,2) not null default 0,
  third_party_cost numeric(14,2) not null default 0,
  safar_fee numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  outstanding numeric(14,2) not null default 0,
  issued_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(14,2) not null,
  line_total numeric(14,2) not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  amount numeric(14,2) not null,
  method text, -- upi | bank_transfer | cash | card
  reference text,
  paid_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  category text not null, -- operating | capital_investment | marketing | salary | other
  description text not null,
  amount numeric(14,2) not null,
  spent_at date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.provider_payables (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id),
  service_request_id uuid references public.service_requests(id),
  amount numeric(14,2) not null,
  status text not null default 'owed', -- owed | paid
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Communication ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id),
  channel text not null default 'whatsapp',
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null, -- inbound | outbound
  body text,
  media_url text,
  external_id text, -- idempotency key from WhatsApp
  sent_at timestamptz not null default now()
);
create unique index if not exists messages_external_id_key
  on public.messages (external_id) where external_id is not null;

-- ---------- CMS ----------
create table if not exists public.cms_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null default 'home',
  section_key text not null, -- hero | services | trust | how_it_works | testimonials | cta | faq | contact | footer
  content jsonb not null default '{}',        -- published content
  draft_content jsonb,                        -- work in progress, not public

  status text not null default 'draft', -- draft | published
  version int not null default 1,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (page, section_key)
);

-- safe to re-run on an existing install
alter table public.cms_sections add column if not exists draft_content jsonb;
alter table public.service_requests add column if not exists description text;



create table if not exists public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_sections(id) on delete cascade,
  content jsonb not null,
  version int not null,
  saved_by uuid references auth.users(id),
  saved_at timestamptz not null default now()
);

-- Shared presentation and workspace configuration. Public reads only the
-- non-secret workspace row; only signed-in administrators can change it.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- ---------- Operations ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  title text not null,
  kind text not null default 'general', -- general | follow_up | handoff | churn_check
  priority text not null default 'normal',
  status text not null default 'open', -- open | done | cancelled
  contact_id uuid references public.contacts(id),
  assigned_to uuid references auth.users(id),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- supabase | whatsapp | invoify | social | finance
  status text not null default 'disconnected', -- connected | paused | failed | disconnected
  config jsonb not null default '{}', -- non-secret config only
  last_ok_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Grants ----------
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant select on public.cms_sections to anon;
grant select on public.app_settings to anon;
grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

-- ---------- RLS ----------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.service_requests enable row level security;
alter table public.provider_categories enable row level security;
alter table public.providers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.provider_payables enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.cms_sections enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.tasks enable row level security;
alter table public.integrations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

create policy team_read_organizations on public.organizations for select to authenticated using (true);
create policy team_read_profiles on public.profiles for select to authenticated using (public.is_team(auth.uid()));
create policy team_read_user_roles on public.user_roles for select to authenticated using (public.is_team(auth.uid()));

-- Read for any team member, write for non-viewers, delete for admins.
do $$
declare t text;
begin
  foreach t in array array[
    'leads','contacts','service_requests','provider_categories','providers',
    'invoices','invoice_items','payments','expenses','provider_payables',
    'conversations','messages','tasks','cms_sections','cms_revisions'
  ] loop
    execute format('create policy team_read_%1$s on public.%1$s for select to authenticated using (public.is_team(auth.uid()))', t);
    execute format('create policy team_write_%1$s on public.%1$s for insert to authenticated with check (public.can_write(auth.uid()))', t);
    execute format('create policy team_update_%1$s on public.%1$s for update to authenticated using (public.can_write(auth.uid()))', t);
    execute format('create policy admin_delete_%1$s on public.%1$s for delete to authenticated using (public.has_role(auth.uid(), ''super_admin'') or public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;

create policy admin_integrations on public.integrations for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'admin'));
create policy team_read_audit on public.audit_logs for select to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'admin'));
create policy team_insert_audit on public.audit_logs for insert to authenticated
  with check (public.is_team(auth.uid()));

-- Public website reads only published CMS sections.
create policy public_read_published_cms on public.cms_sections for select to anon
  using (status = 'published');
create policy public_read_workspace_settings on public.app_settings for select to anon
  using (key = 'workspace');
create policy team_read_workspace_settings on public.app_settings for select to authenticated
  using (public.is_team(auth.uid()));
create policy admin_write_workspace_settings on public.app_settings for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'admin'));

-- Seed the three ventures (identity only, no business data).
insert into public.organizations (slug, name) values
  ('safar-n-manzil', 'SAFAR N MANZIL'),
  ('safa-fresh', 'SAFA FRESH'),
  ('safa-foods', 'SAFA FOODS')
on conflict (slug) do nothing;

-- ============================================================
-- VISITOR INTELLIGENCE, IDENTITY AND EVENT BACKBONE
-- Safe to re-run. Adds website tracking and the customer journey.
-- ============================================================

-- Anonymous website visitor. Never holds personal information until
-- the person identifies themselves through a form or a message.
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_key text not null unique,      -- first-party id stored in the browser
  contact_id uuid references public.contacts(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  first_landing_page text,
  first_referrer text,
  first_utm_source text,
  first_utm_medium text,
  first_utm_campaign text,
  session_count integer not null default 0,
  event_count integer not null default 0
);

create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique,
  visitor_key text not null,
  started_at timestamptz not null default now(),
  last_event_at timestamptz not null default now(),
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device text,
  browser text,
  os text,
  language text,
  country text
);

-- One row per meaningful action on the public website.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,        -- client generated; makes retries harmless
  name text not null,                    -- page.viewed | service.viewed | whatsapp.clicked | ...
  visitor_key text not null,
  session_key text,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  route text,
  page_title text,
  properties jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists events_visitor_idx on public.events (visitor_key, occurred_at desc);
create index if not exists events_contact_idx on public.events (contact_id, occurred_at desc);
create index if not exists events_name_idx on public.events (name, occurred_at desc);
create index if not exists visitor_sessions_visitor_idx on public.visitor_sessions (visitor_key, started_at desc);

-- Which anonymous device belongs to which known person, and why we believe it.
create table if not exists public.identity_links (
  id uuid primary key default gen_random_uuid(),
  visitor_key text not null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  signal text not null,                  -- form | whatsapp | phone | email | manual
  confidence text not null default 'confirmed', -- confirmed | probable
  linked_at timestamptz not null default now(),
  unique (visitor_key, contact_id)
);

-- Anything we are not sure about waits here for a human decision.
create table if not exists public.identity_review_queue (
  id uuid primary key default gen_random_uuid(),
  visitor_key text,
  candidate_contact_id uuid references public.contacts(id) on delete cascade,
  reason text not null,
  payload jsonb not null default '{}',
  status text not null default 'open',   -- open | merged | dismissed
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

-- ---------- Marketing attribution ----------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  name text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text unique,
  channel text,
  started_on date,
  ended_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.attribution_touches (
  id uuid primary key default gen_random_uuid(),
  visitor_key text,
  contact_id uuid references public.contacts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  touch_type text not null,              -- first | latest | conversion
  source text,
  medium text,
  campaign text,
  landing_page text,
  occurred_at timestamptz not null default now()
);

-- ---------- Lead history, scoring and feedback ----------
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null,                    -- status_changed | assigned | note | scored | contacted
  detail text,
  from_value text,
  to_value text,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.leads add column if not exists visitor_key text;
alter table public.leads add column if not exists score integer not null default 0;
alter table public.leads add column if not exists score_updated_at timestamptz;
alter table public.leads add column if not exists contact_id uuid references public.contacts(id) on delete set null;
alter table public.leads add column if not exists consent_marketing boolean not null default false;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  contact_id uuid references public.contacts(id) on delete cascade,
  service_request_id uuid references public.service_requests(id) on delete set null,
  rating integer check (rating between 1 and 5),
  comment text,
  channel text not null default 'website',
  status text not null default 'received', -- received | reviewed | actioned
  created_at timestamptz not null default now()
);

-- ---------- Channels, automation and reliability ----------
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                -- instagram | facebook | google_business | linkedin | youtube
  account_label text not null,
  external_id text,
  status text not null default 'disconnected',
  config jsonb not null default '{}',    -- non-secret config only
  last_ok_at timestamptz,
  created_at timestamptz not null default now(),
  unique (platform, account_label)
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_event text not null,
  conditions jsonb not null default '[]',
  actions jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references public.automations(id) on delete cascade,
  event_key text,
  status text not null,                  -- success | skipped | failed
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text,
  event_type text,
  payload jsonb not null default '{}',
  processing_status text not null default 'received', -- received | processed | failed
  error text,
  retry_count integer not null default 0,
  received_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                    -- high_priority_lead | sla_breach | automation_failed | integration_down
  title text not null,
  body text,
  entity text,
  entity_id uuid,
  severity text not null default 'info', -- info | warning | critical
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Single place for services, prices, areas, hours, FAQs and policies.
create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  category text not null,                -- service | price | area | hours | faq | policy | offer | brand
  code text,
  title text not null,
  body text,
  amount numeric(14,2),
  currency text not null default 'INR',
  metadata jsonb not null default '{}',
  is_public boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (category, code)
);

-- ---------- Grants ----------
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- The public website may only ADD its own tracking rows and enquiries.
grant insert on public.visitors to anon;
grant insert, update on public.visitor_sessions to anon;
grant insert on public.events to anon;
grant insert on public.leads to anon;
grant insert on public.feedback to anon;
grant select on public.knowledge_entries to anon;

-- ---------- Row level security ----------
do $$
declare t text;
begin
  foreach t in array array[
    'visitors','visitor_sessions','events','identity_links','identity_review_queue',
    'campaigns','attribution_touches','lead_events','feedback','social_accounts',
    'automations','automation_runs','webhook_events','notifications','knowledge_entries'
  ] loop
    execute format('alter table public.%1$s enable row level security', t);
    begin
      execute format('create policy team_read_%1$s on public.%1$s for select to authenticated using (public.is_team(auth.uid()))', t);
      execute format('create policy team_write_%1$s on public.%1$s for insert to authenticated with check (public.can_write(auth.uid()))', t);
      execute format('create policy team_update_%1$s on public.%1$s for update to authenticated using (public.can_write(auth.uid()))', t);
      execute format('create policy admin_delete_%1$s on public.%1$s for delete to authenticated using (public.has_role(auth.uid(), ''super_admin'') or public.has_role(auth.uid(), ''admin''))', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

do $$
begin
  create policy public_insert_visitors on public.visitors for insert to anon with check (true);
  create policy public_insert_sessions on public.visitor_sessions for insert to anon with check (true);
  create policy public_update_sessions on public.visitor_sessions for update to anon using (true) with check (true);
  create policy public_insert_events on public.events for insert to anon with check (contact_id is null and lead_id is null);
  create policy public_insert_leads on public.leads for insert to anon with check (source = 'website');
  create policy public_insert_feedback on public.feedback for insert to anon with check (true);
  create policy public_read_knowledge on public.knowledge_entries for select to anon using (is_public);
exception when duplicate_object then null;
end $$;

-- ============================================================
-- Phase D — Conversations, integrations, social and automation
-- Additive only. Safe to run again.
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null,                    -- whatsapp | instagram | facebook | email | web
  account_id text,                          -- which connected account/number
  external_id text,                         -- chat id at the provider
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  display_name text,
  phone text,
  status text not null default 'open',      -- open | pending | closed
  assigned_to uuid,
  tags text[] not null default '{}',
  service_interest text,
  unread_count integer not null default 0,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_id)
);
create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);
create index if not exists conversations_contact_idx on public.conversations (contact_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  channel text not null,
  external_id text,
  body text,
  media_url text,
  media_type text,
  status text not null default 'sent',      -- queued | sent | delivered | read | failed
  error text,
  author text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (channel, external_id)
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, sent_at);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  channel text not null default 'whatsapp',
  body text not null,
  updated_at timestamptz not null default now()
);

-- Non-secret integration state. Secrets stay in server environment variables.
create table if not exists public.integrations (
  key text primary key,                     -- whatsapp_evolution | whatsapp_meta | instagram | facebook | gbp | linkedin | youtube
  label text not null,
  status text not null default 'not_connected', -- not_connected | connected | error
  config jsonb not null default '{}',
  last_checked_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  account_key text,
  body text not null,
  media_url text,
  scheduled_for timestamptz,
  status text not null default 'draft',     -- draft | scheduled | published | failed
  external_id text,
  error text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.leads add column if not exists score_reasons jsonb not null default '[]';
alter table public.leads add column if not exists last_scored_at timestamptz;

-- Upgrade older installs that already had simpler conversation tables.
alter table public.conversations add column if not exists account_id text;
alter table public.conversations add column if not exists external_id text;
alter table public.conversations add column if not exists lead_id uuid references public.leads(id) on delete set null;
alter table public.conversations add column if not exists display_name text;
alter table public.conversations add column if not exists phone text;
alter table public.conversations add column if not exists status text not null default 'open';
alter table public.conversations add column if not exists assigned_to uuid;
alter table public.conversations add column if not exists tags text[] not null default '{}';
alter table public.conversations add column if not exists service_interest text;
alter table public.conversations add column if not exists unread_count integer not null default 0;
alter table public.conversations add column if not exists last_message_at timestamptz;
alter table public.conversations add column if not exists updated_at timestamptz not null default now();
create unique index if not exists conversations_channel_external_key
  on public.conversations (channel, external_id) where external_id is not null;

alter table public.messages add column if not exists channel text not null default 'whatsapp';
alter table public.messages add column if not exists media_type text;
alter table public.messages add column if not exists status text not null default 'sent';
alter table public.messages add column if not exists error text;
alter table public.messages add column if not exists author text;
alter table public.messages add column if not exists created_at timestamptz not null default now();
update public.messages set direction = 'in' where direction = 'inbound';
update public.messages set direction = 'out' where direction = 'outbound';

alter table public.integrations add column if not exists label text;
alter table public.integrations add column if not exists last_checked_at timestamptz;
alter table public.integrations add column if not exists last_error text;
update public.integrations set label = coalesce(label, key);

do $$
declare t text;
begin
  foreach t in array array['conversations','messages','message_templates','integrations','social_posts'] loop
    execute format('alter table public.%1$s enable row level security', t);
    begin
      execute format('create policy team_read_%1$s on public.%1$s for select to authenticated using (public.is_team(auth.uid()))', t);
      execute format('create policy team_write_%1$s on public.%1$s for insert to authenticated with check (public.can_write(auth.uid()))', t);
      execute format('create policy team_update_%1$s on public.%1$s for update to authenticated using (public.can_write(auth.uid()))', t);
      execute format('create policy admin_delete_%1$s on public.%1$s for delete to authenticated using (public.has_role(auth.uid(), ''super_admin'') or public.has_role(auth.uid(), ''admin''))', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

grant select, insert, update, delete on public.conversations, public.messages,
  public.message_templates, public.integrations, public.social_posts to authenticated;
grant all on public.conversations, public.messages, public.message_templates,
  public.integrations, public.social_posts to service_role;
