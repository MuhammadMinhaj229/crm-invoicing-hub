-- Website engine: atomic publishing with optimistic concurrency.
-- Apply after the existing CMS tables and row-level-security policies exist.
-- This function intentionally uses SECURITY INVOKER: existing RLS policies remain
-- the authorization boundary for cms_sections and cms_revisions.

create or replace function public.publish_page_document(
  p_page text,
  p_content jsonb,
  p_expected_version integer
)
returns integer
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_section_id public.cms_sections.id%TYPE;
  v_current_version integer;
  v_next_version integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to publish a page.'
      using errcode = '42501';
  end if;

  if p_page is null or length(btrim(p_page)) = 0 or length(p_page) > 200 then
    raise exception 'A valid page identifier is required.'
      using errcode = '22023';
  end if;

  if p_expected_version is null or p_expected_version < 0 then
    raise exception 'A non-negative expected version is required.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_content) <> 'object'
     or jsonb_typeof(p_content -> 'blocks') <> 'array'
     or p_content ->> 'page' is distinct from p_page then
    raise exception 'Page document shape or page identifier is invalid.'
      using errcode = '22023';
  end if;

  if pg_column_size(p_content) > 2000000 then
    raise exception 'Page document exceeds the 2 MB limit.'
      using errcode = '22023';
  end if;

  select section.id, coalesce(section.version, 0)
    into v_section_id, v_current_version
    from public.cms_sections as section
   where section.page = p_page
     and section.section_key = '__document'
   for update;

  if found then
    if v_current_version <> p_expected_version then
      raise exception 'This page changed since it was loaded. Reload it before publishing.'
        using errcode = '40001';
    end if;

    v_next_version := v_current_version + 1;

    update public.cms_sections
       set content = p_content,
           draft_content = p_content,
           status = 'published',
           version = v_next_version,
           updated_at = now()
     where id = v_section_id;
  else
    if p_expected_version <> 0 then
      raise exception 'The page no longer exists. Reload it before publishing.'
        using errcode = '40001';
    end if;

    v_next_version := 1;

    begin
      insert into public.cms_sections
        (page, section_key, content, draft_content, status, version, updated_at)
      values
        (p_page, '__document', p_content, p_content, 'published', v_next_version, now())
      returning id into v_section_id;
    exception
      when unique_violation then
        raise exception 'Another editor published this page first. Reload it before publishing.'
          using errcode = '40001';
    end;
  end if;

  insert into public.cms_revisions (section_id, content, version)
  values (v_section_id, p_content, v_next_version);

  return v_next_version;
end;
$function$;

revoke all on function public.publish_page_document(text, jsonb, integer) from public;
revoke all on function public.publish_page_document(text, jsonb, integer) from anon;
grant execute on function public.publish_page_document(text, jsonb, integer) to authenticated;
