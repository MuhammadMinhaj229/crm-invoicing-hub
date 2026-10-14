-- Safar Studio: retire the former CRM/inbox/automation schema after the CMS is installed.
-- This is intentionally destructive in public, but keeps a restricted JSON snapshot
-- of removed table rows/column metadata in safar_private for short-term recovery.
-- Supabase-managed schemas and extension-owned objects are preserved.
begin;

do $preflight$
declare
  v_table text;
  v_required text[] := array[
    'cms_sections',
    'cms_revisions',
    'cms_published_documents',
    'cms_site_config',
    'cms_public_site_config',
    'cms_site_config_revisions'
  ];
begin
  foreach v_table in array v_required loop
    if to_regclass(format('public.%I', v_table)) is null then
      raise exception 'Safar Studio CMS is not fully installed: public.% is missing. Apply the four CMS migrations before this reset.', v_table
        using errcode = '55000';
    end if;
  end loop;
end
$preflight$;

create schema if not exists safar_private;
revoke all on schema safar_private from public, anon, authenticated;

create table if not exists safar_private.legacy_reset_archive_20261014 (
  table_name text primary key,
  captured_at timestamptz not null default now(),
  captured_row_count bigint not null,
  columns_snapshot jsonb not null,
  rows_snapshot jsonb not null
);
alter table safar_private.legacy_reset_archive_20261014 enable row level security;
revoke all on table safar_private.legacy_reset_archive_20261014 from public, anon, authenticated, service_role;

-- Preserve the actual rows and column metadata before deleting old public tables.
-- The archive is deliberately private and is not exposed through PostgREST.
do $archive$
declare
  v_rel record;
  v_rows jsonb;
  v_columns jsonb;
  v_row_count bigint;
begin
  for v_rel in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname not in (
        'cms_sections',
        'cms_revisions',
        'cms_published_documents',
        'cms_site_config',
        'cms_public_site_config',
        'cms_site_config_revisions'
      )
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_class'::regclass
          and d.objid = c.oid
          and d.refclassid = 'pg_extension'::regclass
          and d.deptype = 'e'
      )
    order by c.relname
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(source_row)), ''[]''::jsonb) from public.%I as source_row',
      v_rel.relname
    ) into v_rows;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'ordinal', column_info.ordinal_position,
          'name', column_info.column_name,
          'data_type', column_info.data_type,
          'udt_schema', column_info.udt_schema,
          'udt_name', column_info.udt_name,
          'nullable', column_info.is_nullable,
          'default', column_info.column_default
        )
        order by column_info.ordinal_position
      ),
      '[]'::jsonb
    )
    into v_columns
    from information_schema.columns as column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = v_rel.relname;

    v_row_count := jsonb_array_length(v_rows);

    insert into safar_private.legacy_reset_archive_20261014
      (table_name, captured_row_count, columns_snapshot, rows_snapshot)
    values
      (v_rel.relname, v_row_count, v_columns, v_rows)
    on conflict (table_name) do nothing;
  end loop;
end
$archive$;

-- Remove only the old app's profile-creation hook. Auth itself and auth.users remain.
do $auth_cleanup$
declare
  v_trigger record;
begin
  if to_regclass('auth.users') is not null then
    for v_trigger in
      select trigger_info.tgname
      from pg_trigger as trigger_info
      join pg_class as trigger_table on trigger_table.oid = trigger_info.tgrelid
      join pg_namespace as trigger_schema on trigger_schema.oid = trigger_table.relnamespace
      join pg_proc as trigger_function on trigger_function.oid = trigger_info.tgfoid
      join pg_namespace as function_schema on function_schema.oid = trigger_function.pronamespace
      where not trigger_info.tgisinternal
        and trigger_schema.nspname = 'auth'
        and trigger_table.relname = 'users'
        and function_schema.nspname = 'public'
        and trigger_function.proname = 'handle_new_user'
    loop
      execute format('drop trigger if exists %I on auth.users', v_trigger.tgname);
    end loop;
  end if;
end
$auth_cleanup$;

-- Views derived from the retired CRM schema must not survive as broken objects.
do $views$
declare
  v_rel record;
begin
  for v_rel in
    select c.relkind, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('v', 'm')
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_class'::regclass
          and d.objid = c.oid
          and d.refclassid = 'pg_extension'::regclass
          and d.deptype = 'e'
      )
  loop
    if v_rel.relkind = 'm' then
      execute format('drop materialized view if exists public.%I cascade', v_rel.relname);
    else
      execute format('drop view if exists public.%I cascade', v_rel.relname);
    end if;
  end loop;
end
$views$;

-- Drop old app RPCs/helpers. CMS RPCs, extension functions, and functions used by
-- any remaining non-public trigger are explicitly preserved.
do $functions$
declare
  v_fn record;
  v_object_kind text;
  v_signature text;
begin
  for v_fn in
    select p.oid, p.prokind, p.proname, pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind in ('f', 'p')
      and p.proname not in (
        'get_published_page_document',
        'publish_page_document',
        'unpublish_page_document',
        'bootstrap_cms_seed',
        'get_published_site_manifest',
        'get_public_site_config',
        'get_cms_handshake',
        'save_cms_site_config'
      )
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.refclassid = 'pg_extension'::regclass
          and d.deptype = 'e'
      )
      and not exists (
        select 1
        from pg_trigger as trigger_info
        join pg_class as trigger_table on trigger_table.oid = trigger_info.tgrelid
        join pg_namespace as trigger_schema on trigger_schema.oid = trigger_table.relnamespace
        where not trigger_info.tgisinternal
          and trigger_info.tgfoid = p.oid
          and trigger_schema.nspname <> 'public'
      )
  loop
    v_object_kind := case when v_fn.prokind = 'p' then 'PROCEDURE' else 'FUNCTION' end;
    v_signature := format('public.%I(%s)', v_fn.proname, v_fn.identity_args);
    execute format('drop %s if exists %s cascade', v_object_kind, v_signature);
  end loop;
end
$functions$;

-- Drop the former CRM/business tables; the six CMS tables remain canonical.
do $tables$
declare
  v_rel record;
begin
  for v_rel in
    select c.relkind, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'f')
      and c.relname not in (
        'cms_sections',
        'cms_revisions',
        'cms_published_documents',
        'cms_site_config',
        'cms_public_site_config',
        'cms_site_config_revisions'
      )
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_class'::regclass
          and d.objid = c.oid
          and d.refclassid = 'pg_extension'::regclass
          and d.deptype = 'e'
      )
  loop
    if v_rel.relkind = 'f' then
      execute format('drop foreign table if exists public.%I cascade', v_rel.relname);
    else
      execute format('drop table if exists public.%I cascade', v_rel.relname);
    end if;
  end loop;
end
$tables$;

-- Remove orphaned legacy sequences while preserving CMS-owned identity sequences.
do $sequences$
declare
  v_seq record;
begin
  for v_seq in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'S'
      and not exists (
        select 1
        from pg_depend ext_dep
        where ext_dep.classid = 'pg_class'::regclass
          and ext_dep.objid = c.oid
          and ext_dep.refclassid = 'pg_extension'::regclass
          and ext_dep.deptype = 'e'
      )
      and not exists (
        select 1
        from pg_depend ownership
        join pg_class owning_table on owning_table.oid = ownership.refobjid
        where ownership.classid = 'pg_class'::regclass
          and ownership.objid = c.oid
          and ownership.refclassid = 'pg_class'::regclass
          and ownership.deptype in ('a', 'i')
          and owning_table.relname in (
            'cms_sections',
            'cms_revisions',
            'cms_published_documents',
            'cms_site_config',
            'cms_public_site_config',
            'cms_site_config_revisions'
          )
      )
  loop
    execute format('drop sequence if exists public.%I cascade', v_seq.relname);
  end loop;
end
$sequences$;

-- Old enum/domain types are not part of the CMS content model.
do $types$
declare
  v_type record;
begin
  for v_type in
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype in ('e', 'd')
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_type'::regclass
          and d.objid = t.oid
          and d.refclassid = 'pg_extension'::regclass
          and d.deptype = 'e'
      )
  loop
    execute format('drop type if exists public.%I cascade', v_type.typname);
  end loop;
end
$types$;

-- Fail the whole transaction if any non-CMS public table was missed.
do $verification$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'f')
      and c.relname not in (
        'cms_sections',
        'cms_revisions',
        'cms_published_documents',
        'cms_site_config',
        'cms_public_site_config',
        'cms_site_config_revisions'
      )
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_class'::regclass
          and d.objid = c.oid
          and d.refclassid = 'pg_extension'::regclass
          and d.deptype = 'e'
      )
  ) then
    raise exception 'Legacy public tables remain after the Safar Studio schema reset.';
  end if;
end
$verification$;

comment on table safar_private.legacy_reset_archive_20261014 is
  'Restricted snapshot of former public app table rows and column metadata captured before the Safar Studio CMS reset. Keep until rollout verification and backup reconciliation are complete.';

commit;
