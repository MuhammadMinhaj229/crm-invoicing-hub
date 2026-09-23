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
  content jsonb not null default '{}',
  status text not null default 'draft', -- draft | published
  version int not null default 1,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (page, section_key)
);

create table if not exists public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_sections(id) on delete cascade,
  content jsonb not null,
  version int not null,
  saved_by uuid references auth.users(id),
  saved_at timestamptz not null default now()
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

-- Seed the three ventures (identity only, no business data).
insert into public.organizations (slug, name) values
  ('safar-n-manzil', 'SAFAR N MANZIL'),
  ('safa-fresh', 'SAFA FRESH'),
  ('safa-foods', 'SAFA FOODS')
on conflict (slug) do nothing;
