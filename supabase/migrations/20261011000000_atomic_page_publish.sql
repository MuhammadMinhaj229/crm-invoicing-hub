-- Website engine: atomic publishing with optimistic concurrency.
--
-- Prerequisites:
--   * public.cms_sections has page, section_key, content, draft_content,
--     status, version, updated_at and id columns.
--   * public.cms_revisions has section_id, content and version columns.
--   * cms_sections has a unique constraint on (page, section_key).
--   * Existing RLS policies permit authorized editors/publishers to select,
--     insert/update their CMS row and insert its revision.
--
-- Apply only after confirming the intended Supabase project and its RLS.
-- SECURITY INVOKER is deliberate: this function does not bypass RLS.

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

  if p_content is null
     or jsonb_typeof(p_content) is distinct from 'object'
     or jsonb_typeof(p_content -> 'schemaVersion') is distinct from 'number'
     or p_content ->> 'schemaVersion' is distinct from '1'
     or jsonb_typeof(p_content -> 'blocks') is distinct from 'array'
     or p_content ->> 'page' is distinct from p_page
     or (
       p_content ? 'metadata'
       and (
         jsonb_typeof(p_content -> 'metadata') is distinct from 'object'
         or jsonb_typeof(p_content #> '{metadata,label}') is distinct from 'string'
         or length(btrim(coalesce(p_content #>> '{metadata,label}', ''))) = 0
         or length(p_content #>> '{metadata,label}') > 4000
         or coalesce(p_content #>> '{metadata,path}', '') !~ '^/[A-Za-z0-9/_-]*

  if jsonb_array_length(p_content -> 'blocks') > 150 then
    raise exception 'Page document contains more than 150 blocks.'
      using errcode = '22023';
  end if;

  if pg_column_size(p_content) > 2000000 then
    raise exception 'Page document exceeds the 2 MB limit.'
      using errcode = '22023';
  end if;

  -- Validate the block envelope and layout even when a caller invokes the RPC
  -- directly without passing through the browser-side Zod validator.
  if exists (
    select 1
      from jsonb_array_elements(p_content -> 'blocks') as item(block)
     where jsonb_typeof(item.block) is distinct from 'object'
        or jsonb_typeof(item.block -> 'id') is distinct from 'string'
        or length(btrim(coalesce(item.block ->> 'id', ''))) = 0
        or length(item.block ->> 'id') > 128
        or coalesce(item.block ->> 'type', '') not in (
          'hero', 'cinematicHero', 'careJourney', 'serviceStory', 'trustDossier',
          'proofReturn', 'serviceFilm', 'storyCarousel', 'invoiceExample', 'heading',
          'text', 'image', 'buttons', 'imageText', 'cards', 'faq', 'contactStrip',
          'enquiryForm', 'video', 'spacer', 'divider', 'navigation'
        )
        or jsonb_typeof(item.block -> 'props') is distinct from 'object'
        or jsonb_typeof(item.block -> 'layout') is distinct from 'object'
        or coalesce(item.block #>> '{layout,align}', '') not in ('left', 'center', 'right')
        or coalesce(item.block #>> '{layout,width}', '') not in ('narrow', 'normal', 'full')
        or coalesce(item.block #>> '{layout,background}', '') not in ('none', 'muted', 'card', 'primary', 'accent')
        or jsonb_typeof(item.block #> '{layout,spaceTop}') is distinct from 'number'
        or jsonb_typeof(item.block #> '{layout,spaceBottom}') is distinct from 'number'
        or (case when jsonb_typeof(item.block #> '{layout,spaceTop}') = 'number'
                 then (item.block #>> '{layout,spaceTop}')::numeric else -1 end) < 0
        or (case when jsonb_typeof(item.block #> '{layout,spaceTop}') = 'number'
                 then (item.block #>> '{layout,spaceTop}')::numeric else 7 end) > 6
        or (case when jsonb_typeof(item.block #> '{layout,spaceBottom}') = 'number'
                 then (item.block #>> '{layout,spaceBottom}')::numeric else -1 end) < 0
        or (case when jsonb_typeof(item.block #> '{layout,spaceBottom}') = 'number'
                 then (item.block #>> '{layout,spaceBottom}')::numeric else 7 end) > 6
        or jsonb_typeof(item.block #> '{layout,hideMobile}') is distinct from 'boolean'
        or jsonb_typeof(item.block #> '{layout,hideDesktop}') is distinct from 'boolean'
        or (
          item.block ? 'hidden'
          and jsonb_typeof(item.block -> 'hidden') is distinct from 'boolean'
        )
        or (
          item.block ? 'locked'
          and jsonb_typeof(item.block -> 'locked') is distinct from 'boolean'
        )
  ) then
    raise exception 'Page document contains an unsupported or malformed block.'
      using errcode = '22023';
  end if;

  -- Stable block IDs must be unique within a page document.
  if (
    select count(*) <> count(distinct item.block ->> 'id')
      from jsonb_array_elements(p_content -> 'blocks') as item(block)
  ) then
    raise exception 'Page document contains duplicate block IDs.'
      using errcode = '22023';
  end if;

  -- Defense in depth for URL-bearing properties. The browser-side schema is
  -- not a trust boundary because authenticated users can call PostgREST RPCs
  -- directly without using the visual editor.
  if exists (
    with url_values(key_name, url_json) as (
      select 'href', found.value
        from jsonb_path_query(p_content, '$.**.href') as found(value)
      union all
      select 'src', found.value
        from jsonb_path_query(p_content, '$.**.src') as found(value)
      union all
      select 'image', found.value
        from jsonb_path_query(p_content, '$.**.image') as found(value)
      union all
      select 'url', found.value
        from jsonb_path_query(p_content, '$.**.url') as found(value)
    )
    select 1
      from url_values
     where jsonb_typeof(url_json) is distinct from 'string'
        or not (
          url_json #>> '{}' = ''
          or (
            strpos(url_json #>> '{}', chr(92)) = 0
            and (url_json #>> '{}') !~ '[[:cntrl:]]'
            and (
              (
                key_name = 'href'
                and url_json #>> '{}' in ('whatsapp', 'phone', 'email')
              )
              or (
                key_name = 'href'
                and url_json #>> '{}' ~ '^#[A-Za-z0-9_.:-]*$'
              )
              or (
                left(url_json #>> '{}', 1) = '/'
                and left(url_json #>> '{}', 2) <> '//'
              )
              or (
                (url_json #>> '{}') ~* '^https?://[^[:space:]/?#]+([/?#].*)?$'
                and (url_json #>> '{}') !~* '^https?://[^/]*@'
              )
            )
          )
        )
  ) then
    raise exception 'Page document contains an unsafe link or media URL.'
      using errcode = '22023';
  end if;

  -- Serialize publishing for the same page, including first publication when
  -- no CMS row exists yet. The unique constraint remains a final safeguard.
  perform pg_advisory_xact_lock(hashtextextended(p_page, 1));

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

         or left(coalesce(p_content #>> '{metadata,path}', ''), 2) = '//'
         or jsonb_typeof(p_content #> '{metadata,seo}') is distinct from 'object'
         or jsonb_typeof(p_content #> '{metadata,seo,title}') is distinct from 'string'
         or length(btrim(coalesce(p_content #>> '{metadata,seo,title}', ''))) = 0
         or length(p_content #>> '{metadata,seo,title}') > 500
         or jsonb_typeof(p_content #> '{metadata,seo,description}') is distinct from 'string'
         or length(p_content #>> '{metadata,seo,description}') > 2000
       )
     ) then
    raise exception 'Page document shape, version, page identifier or route metadata is invalid.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_content -> 'blocks') > 150 then
    raise exception 'Page document contains more than 150 blocks.'
      using errcode = '22023';
  end if;

  if pg_column_size(p_content) > 2000000 then
    raise exception 'Page document exceeds the 2 MB limit.'
      using errcode = '22023';
  end if;

  -- Validate the block envelope and layout even when a caller invokes the RPC
  -- directly without passing through the browser-side Zod validator.
  if exists (
    select 1
      from jsonb_array_elements(p_content -> 'blocks') as item(block)
     where jsonb_typeof(item.block) is distinct from 'object'
        or jsonb_typeof(item.block -> 'id') is distinct from 'string'
        or length(btrim(coalesce(item.block ->> 'id', ''))) = 0
        or length(item.block ->> 'id') > 128
        or coalesce(item.block ->> 'type', '') not in (
          'hero', 'cinematicHero', 'careJourney', 'serviceStory', 'trustDossier',
          'proofReturn', 'serviceFilm', 'storyCarousel', 'invoiceExample', 'heading',
          'text', 'image', 'buttons', 'imageText', 'cards', 'faq', 'contactStrip',
          'enquiryForm', 'video', 'spacer', 'divider', 'navigation'
        )
        or jsonb_typeof(item.block -> 'props') is distinct from 'object'
        or jsonb_typeof(item.block -> 'layout') is distinct from 'object'
        or coalesce(item.block #>> '{layout,align}', '') not in ('left', 'center', 'right')
        or coalesce(item.block #>> '{layout,width}', '') not in ('narrow', 'normal', 'full')
        or coalesce(item.block #>> '{layout,background}', '') not in ('none', 'muted', 'card', 'primary', 'accent')
        or jsonb_typeof(item.block #> '{layout,spaceTop}') is distinct from 'number'
        or jsonb_typeof(item.block #> '{layout,spaceBottom}') is distinct from 'number'
        or (case when jsonb_typeof(item.block #> '{layout,spaceTop}') = 'number'
                 then (item.block #>> '{layout,spaceTop}')::numeric else -1 end) < 0
        or (case when jsonb_typeof(item.block #> '{layout,spaceTop}') = 'number'
                 then (item.block #>> '{layout,spaceTop}')::numeric else 7 end) > 6
        or (case when jsonb_typeof(item.block #> '{layout,spaceBottom}') = 'number'
                 then (item.block #>> '{layout,spaceBottom}')::numeric else -1 end) < 0
        or (case when jsonb_typeof(item.block #> '{layout,spaceBottom}') = 'number'
                 then (item.block #>> '{layout,spaceBottom}')::numeric else 7 end) > 6
        or jsonb_typeof(item.block #> '{layout,hideMobile}') is distinct from 'boolean'
        or jsonb_typeof(item.block #> '{layout,hideDesktop}') is distinct from 'boolean'
        or (
          item.block ? 'hidden'
          and jsonb_typeof(item.block -> 'hidden') is distinct from 'boolean'
        )
        or (
          item.block ? 'locked'
          and jsonb_typeof(item.block -> 'locked') is distinct from 'boolean'
        )
  ) then
    raise exception 'Page document contains an unsupported or malformed block.'
      using errcode = '22023';
  end if;

  -- Stable block IDs must be unique within a page document.
  if (
    select count(*) <> count(distinct item.block ->> 'id')
      from jsonb_array_elements(p_content -> 'blocks') as item(block)
  ) then
    raise exception 'Page document contains duplicate block IDs.'
      using errcode = '22023';
  end if;

  -- Defense in depth for URL-bearing properties. The browser-side schema is
  -- not a trust boundary because authenticated users can call PostgREST RPCs
  -- directly without using the visual editor.
  if exists (
    with url_values(key_name, url_json) as (
      select 'href', found.value
        from jsonb_path_query(p_content, '$.**.href') as found(value)
      union all
      select 'src', found.value
        from jsonb_path_query(p_content, '$.**.src') as found(value)
      union all
      select 'image', found.value
        from jsonb_path_query(p_content, '$.**.image') as found(value)
      union all
      select 'url', found.value
        from jsonb_path_query(p_content, '$.**.url') as found(value)
    )
    select 1
      from url_values
     where jsonb_typeof(url_json) is distinct from 'string'
        or not (
          url_json #>> '{}' = ''
          or (
            strpos(url_json #>> '{}', chr(92)) = 0
            and (url_json #>> '{}') !~ '[[:cntrl:]]'
            and (
              (
                key_name = 'href'
                and url_json #>> '{}' in ('whatsapp', 'phone', 'email')
              )
              or (
                key_name = 'href'
                and url_json #>> '{}' ~ '^#[A-Za-z0-9_.:-]*$'
              )
              or (
                left(url_json #>> '{}', 1) = '/'
                and left(url_json #>> '{}', 2) <> '//'
              )
              or (
                (url_json #>> '{}') ~* '^https?://[^[:space:]/?#]+([/?#].*)?$'
                and (url_json #>> '{}') !~* '^https?://[^/]*@'
              )
            )
          )
        )
  ) then
    raise exception 'Page document contains an unsafe link or media URL.'
      using errcode = '22023';
  end if;

  -- Serialize publishing for the same page, including first publication when
  -- no CMS row exists yet. The unique constraint remains a final safeguard.
  perform pg_advisory_xact_lock(hashtextextended(p_page, 1));

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
