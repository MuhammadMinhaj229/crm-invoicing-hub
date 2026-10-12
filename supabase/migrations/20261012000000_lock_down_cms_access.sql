-- Close the CMS draft disclosure and direct-publication paths.
--
-- The public API must not expose cms_sections directly: row-level security can
-- restrict rows, but it cannot hide draft_content from a reader of a published
-- row. Public reads now use a narrow RPC that returns only the published JSON.
-- Editors may write draft fields only. Publishing/unpublishing and revision
-- creation are performed by narrowly scoped functions that validate
-- app_metadata.cms_role before using elevated privileges.
begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- Keep the thoroughly validated publisher implementation private. The public
-- RPC below is the only client-callable publication entry point.
alter function public.publish_page_document(text, jsonb, integer)
  rename to publish_page_document_internal;
alter function public.publish_page_document_internal(text, jsonb, integer)
  set schema app_private;
revoke all on function app_private.publish_page_document_internal(text, jsonb, integer)
  from public, anon, authenticated;

-- The base table is editor-only. Public visitors use the limited read RPC.
drop policy if exists cms_sections_read_published_or_editor on public.cms_sections;
drop policy if exists cms_sections_read_scope_guard on public.cms_sections;
drop policy if exists cms_sections_editor_read on public.cms_sections;
drop policy if exists cms_sections_editor_read_guard on public.cms_sections;

create policy cms_sections_editor_read on public.cms_sections
  for select to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'cms_role', '') in ('owner', 'admin', 'editor'));

create policy cms_sections_editor_read_guard on public.cms_sections as restrictive
  for select to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'cms_role', '') in ('owner', 'admin', 'editor'));

-- Revision history is written only by the publication functions.
drop policy if exists cms_revisions_editor_insert on public.cms_revisions;
drop policy if exists cms_revisions_editor_insert_guard on public.cms_revisions;

-- Remove table-wide and legacy column-level grants before adding least-privilege
-- grants. The explicit column revokes also clean up grants left by older setups.
revoke all privileges on table public.cms_sections from public, anon, authenticated;
revoke all privileges on table public.cms_revisions from public, anon, authenticated;

revoke select (id, page, section_key, content, draft_content, status, version, updated_at)
  on table public.cms_sections from public, anon, authenticated;
revoke insert (id, page, section_key, content, draft_content, status, version, updated_at)
  on table public.cms_sections from public, anon, authenticated;
revoke update (id, page, section_key, content, draft_content, status, version, updated_at)
  on table public.cms_sections from public, anon, authenticated;

revoke select (id, section_id, content, version, saved_at)
  on table public.cms_revisions from public, anon, authenticated;
revoke insert (id, section_id, content, version, saved_at)
  on table public.cms_revisions from public, anon, authenticated;

-- Editors can inspect CMS state but can only mutate the draft envelope.
grant select on table public.cms_sections to authenticated;
grant insert (page, section_key, draft_content, updated_at)
  on table public.cms_sections to authenticated;
grant update (page, section_key, draft_content, updated_at)
  on table public.cms_sections to authenticated;
grant select on table public.cms_revisions to authenticated;

-- Safe public read: only a published document's content is returned. The
-- draft, revision data, row identifiers and publication metadata never leave
-- this function. The function is deliberately stable and uses no dynamic SQL.
create or replace function public.get_published_page_document(p_page text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select section.content
    from public.cms_sections as section
   where p_page is not null
     and p_page = btrim(p_page)
     and length(p_page) between 1 and 200
     and section.page = p_page
     and section.section_key = '__document'
     and section.status = 'published'
   limit 1;
$function$;

revoke all on function public.get_published_page_document(text) from public, anon, authenticated;
grant execute on function public.get_published_page_document(text) to anon, authenticated;

-- Public publication wrapper. The validated implementation runs privately
-- under the wrapper owner's privileges, but only after explicit authorization
-- from server-controlled Auth app_metadata.
create function public.publish_page_document(
  p_page text,
  p_content jsonb,
  p_expected_version integer
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to publish a page.'
      using errcode = '42501';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'cms_role', '')
       not in ('owner', 'admin', 'editor') then
    raise exception 'This account is not authorized to publish website pages.'
      using errcode = '42501';
  end if;

  return app_private.publish_page_document_internal(
    p_page, p_content, p_expected_version
  );
end;
$function$;

revoke all on function public.publish_page_document(text, jsonb, integer) from public, anon;
grant execute on function public.publish_page_document(text, jsonb, integer) to authenticated;

-- Unpublishing is a versioned transaction too. It appends the last-public
-- content as a revision while taking the page out of public circulation.
create function public.unpublish_page_document(
  p_page text,
  p_expected_version integer
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_section_id public.cms_sections.id%type;
  v_current_version integer;
  v_content jsonb;
  v_status text;
  v_next_version integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to unpublish a page.'
      using errcode = '42501';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'cms_role', '')
       not in ('owner', 'admin', 'editor') then
    raise exception 'This account is not authorized to unpublish website pages.'
      using errcode = '42501';
  end if;

  if p_page is null
     or p_page <> btrim(p_page)
     or length(p_page) = 0
     or length(p_page) > 200 then
    raise exception 'A valid page identifier is required.'
      using errcode = '22023';
  end if;

  if p_expected_version is null or p_expected_version < 0 then
    raise exception 'A non-negative expected version is required.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_page, 1));

  select section.id, coalesce(section.version, 0), section.content, section.status
    into v_section_id, v_current_version, v_content, v_status
    from public.cms_sections as section
   where section.page = p_page
     and section.section_key = '__document'
   for update;

  if not found then
    raise exception 'The page no longer exists. Reload the editor before unpublishing.'
      using errcode = '40001';
  end if;

  if v_current_version <> p_expected_version then
    raise exception 'This page changed since it was loaded. Reload it before unpublishing.'
      using errcode = '40001';
  end if;

  if v_status <> 'published' or v_content is null then
    raise exception 'This page is not currently published.'
      using errcode = '22023';
  end if;

  v_next_version := v_current_version + 1;

  update public.cms_sections
     set status = 'draft',
         version = v_next_version,
         updated_at = now()
   where id = v_section_id;

  insert into public.cms_revisions (section_id, content, version)
  values (v_section_id, v_content, v_next_version);

  return v_next_version;
end;
$function$;

revoke all on function public.unpublish_page_document(text, integer) from public, anon;
grant execute on function public.unpublish_page_document(text, integer) to authenticated;

comment on function public.get_published_page_document(text) is
  'Public-safe CMS read endpoint. Returns only content from a published __document row.';
comment on function public.publish_page_document(text, jsonb, integer) is
  'Authorized transactional page publication with optimistic concurrency and immutable revision creation.';
comment on function public.unpublish_page_document(text, integer) is
  'Authorized versioned unpublication with revision preservation.';

commit;
