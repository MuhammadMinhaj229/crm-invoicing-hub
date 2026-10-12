-- Run after publish-page-document.setup.sql and the migration.
\set ON_ERROR_STOP on

set role authenticated;
set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"cms_role":"owner"}}';

select public.publish_page_document(
  'home',
  $json$
  {
    "schemaVersion": 1,
    "page": "home",
    "blocks": [{
      "id": "first-block",
      "type": "text",
      "props": { "text": "First published version" },
      "layout": {
        "align": "left",
        "width": "normal",
        "spaceTop": 3,
        "spaceBottom": 3,
        "background": "none",
        "hideMobile": false,
        "hideDesktop": false
      }
    }]
  }
  $json$::jsonb,
  0
) as first_version
\gset

\if :{?first_version}
\else
  \echo 'FAIL: first publication did not return a version'
  \quit 1
\endif

select case when :first_version = 1 then 'PASS: first publication is version 1'
            else 'FAIL: first publication should be version 1' end as result
\gset
\if :{?result}
  \echo :result
\endif

do $test$
begin
  if (select count(*) from public.cms_sections where page = 'home' and section_key = '__document') <> 1 then
    raise exception 'Expected exactly one shared page row';
  end if;
  if (select version from public.cms_sections where page = 'home' and section_key = '__document') <> 1 then
    raise exception 'Expected the page version to be 1';
  end if;
  if (select count(*) from public.cms_revisions where version = 1) <> 1 then
    raise exception 'Expected one revision for first publication';
  end if;
end
$test$;

select public.publish_page_document(
  'home',
  $json$
  {
    "schemaVersion": 1,
    "page": "home",
    "blocks": [{
      "id": "first-block",
      "type": "text",
      "props": { "text": "Second published version" },
      "layout": {
        "align": "left",
        "width": "normal",
        "spaceTop": 3,
        "spaceBottom": 3,
        "background": "none",
        "hideMobile": false,
        "hideDesktop": false
      }
    }]
  }
  $json$::jsonb,
  1
) as second_version
\gset

do $test$
begin
  if (select version from public.cms_sections where page = 'home' and section_key = '__document') <> 2 then
    raise exception 'Expected the page version to advance to 2';
  end if;
  if (select count(*) from public.cms_revisions where section_id = (select id from public.cms_sections where page = 'home' and section_key = '__document')) <> 2 then
    raise exception 'Expected two immutable revisions';
  end if;
end
$test$;
\echo 'PASS: sequential publication advances version and preserves revisions'

do $test$
begin
  perform public.publish_page_document(
    'home',
    $json$
    {
      "schemaVersion": 1,
      "page": "home",
      "blocks": [{
        "id": "first-block",
        "type": "text",
        "props": { "text": "Stale edit" },
        "layout": {
          "align": "left",
          "width": "normal",
          "spaceTop": 3,
          "spaceBottom": 3,
          "background": "none",
          "hideMobile": false,
          "hideDesktop": false
        }
      }]
    }
    $json$::jsonb,
    1
  );
  raise exception 'Stale publication unexpectedly succeeded';
exception
  when sqlstate '40001' then
    raise notice 'PASS: stale publication rejected';
end
$test$;

do $test$
begin
  perform public.publish_page_document(
    'home',
    $json$
    {
      "schemaVersion": 1,
      "page": "home",
      "blocks": [{
        "id": "button-block",
        "type": "buttons",
        "props": {
          "items": [{
            "id": "button-1",
            "label": "Unsafe",
            "href": "javascript:alert(1)",
            "style": "solid",
            "size": "md"
          }]
        },
        "layout": {
          "align": "left",
          "width": "normal",
          "spaceTop": 3,
          "spaceBottom": 3,
          "background": "none",
          "hideMobile": false,
          "hideDesktop": false
        }
      }]
    }
    $json$::jsonb,
    2
  );
  raise exception 'Unsafe URL unexpectedly succeeded';
exception
  when sqlstate '22023' then
    raise notice 'PASS: unsafe URL rejected by database';
end
$test$;

insert into public.cms_sections (page, section_key, content, draft_content, status, version, updated_at)
values ('private-draft', '__document', null, null, 'draft', 0, now());

reset role;

select case
  when has_function_privilege('anon', 'public.publish_page_document(text,jsonb,integer)', 'execute') then
    'FAIL: anon role unexpectedly has publish privilege'
  else 'PASS: anonymous role cannot invoke the publication RPC'
end as privilege_check
\gset
\echo :privilege_check

set role anon;
set request.jwt.claims = '{"role":"anon","app_metadata":{}}';
do $test$
begin
  if exists (select 1 from public.cms_sections where page = 'private-draft') then
    raise exception 'Anonymous users must not read CMS drafts';
  end if;
  if not exists (select 1 from public.cms_sections where page = 'home' and status = 'published') then
    raise exception 'Anonymous users should read published pages';
  end if;
end
$test$;
reset role;
\echo 'PASS: anonymous readers see published pages, not drafts'

set role authenticated;
set request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';
set request.jwt.claims = '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{}}';
do $test$
begin
  if exists (select 1 from public.cms_sections where page = 'private-draft') then
    raise exception 'Authenticated non-editors must not read drafts';
  end if;
  begin
    insert into public.cms_sections (page, section_key, content, draft_content, status, version, updated_at)
    values ('unauthorized-draft', '__document', null, null, 'draft', 0, now());
    raise exception 'An unapproved user unexpectedly inserted a CMS draft';
  exception when insufficient_privilege then
    null;
  end;
end
$test$;
reset role;
\echo 'PASS: authenticated non-editors cannot read or create drafts'
