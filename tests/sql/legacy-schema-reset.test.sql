-- Run only after 20261014090000_reset_legacy_public_schema.sql in disposable CI PostgreSQL.
\set ON_ERROR_STOP on

do $test$
declare
  v_rows jsonb;
  v_count bigint;
  v_tables integer;
begin
  if to_regclass('public.legacy_reset_accounts') is not null
     or to_regclass('public.legacy_reset_contacts') is not null
     or to_regclass('public.legacy_reset_contact_view') is not null
     or to_regclass('public.legacy_reset_orphan_seq') is not null then
    raise exception 'Legacy test objects remain in public after reset.';
  end if;

  if to_regtype('public.legacy_reset_role') is not null then
    raise exception 'Legacy enum type remains after reset.';
  end if;

  if to_regprocedure('public.legacy_reset_rpc()') is not null then
    raise exception 'Legacy RPC remains after reset.';
  end if;

  select rows_snapshot, captured_row_count
    into v_rows, v_count
    from safar_private.legacy_reset_archive_20261014
   where table_name = 'legacy_reset_contacts';

  if v_count <> 1 or jsonb_array_length(v_rows) <> 1
     or v_rows #>> '{0,account_id}' <> '1'
     or v_rows #>> '{0,role}' <> 'legacy' then
    raise exception 'The legacy table snapshot did not preserve the sample data.';
  end if;

  if to_regclass('public.cms_sections') is null
     or to_regclass('public.cms_revisions') is null
     or to_regclass('public.cms_published_documents') is null
     or to_regclass('public.cms_site_config') is null
     or to_regclass('public.cms_public_site_config') is null
     or to_regclass('public.cms_site_config_revisions') is null then
    raise exception 'The CMS tables must survive the legacy reset.';
  end if;

  if to_regprocedure('public.get_cms_handshake(integer)') is null
     or to_regprocedure('public.get_published_page_document(text)') is null
     or to_regprocedure('public.publish_page_document(text,jsonb,integer)') is null
     or to_regprocedure('public.save_cms_site_config(jsonb,integer)') is null then
    raise exception 'A required CMS RPC was removed by the legacy reset.';
  end if;

  if has_schema_privilege('anon', 'safar_private', 'USAGE')
     or has_table_privilege('anon', 'safar_private.legacy_reset_archive_20261014', 'SELECT') then
    raise exception 'The legacy archive must not be readable by anonymous clients.';
  end if;

  select count(*) into v_tables
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind in ('r','p','f')
    and c.relname in (
      'cms_sections','cms_revisions','cms_published_documents',
      'cms_site_config','cms_public_site_config','cms_site_config_revisions'
    );

  if v_tables <> 6 then
    raise exception 'Expected exactly six CMS tables in public, found %.', v_tables;
  end if;
end
$test$;

\echo 'PASS: legacy tables, views, functions, sequences and enum types removed; CMS preserved; row snapshot restricted'
