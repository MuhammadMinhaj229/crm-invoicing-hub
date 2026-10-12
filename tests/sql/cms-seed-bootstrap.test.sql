-- Run after all CMS migrations in the disposable CI PostgreSQL database.
\set ON_ERROR_STOP on

set role anon;
set request.jwt.claims = '{"role":"anon","app_metadata":{}}';
do $test$
declare
  v_status jsonb;
begin
  v_status := public.get_cms_handshake(1);
  if v_status ->> 'status' <> 'seed_required' then
    raise exception 'A fresh database should handshake as seed_required, got %', v_status ->> 'status';
  end if;
  if public.get_public_site_config() is not null then
    raise exception 'Public settings should be absent before bootstrap';
  end if;
  if has_table_privilege('anon', 'public.cms_site_config', 'SELECT') then
    raise exception 'Anonymous users must not query site configuration storage directly';
  end if;
  if has_table_privilege('anon', 'public.cms_sections', 'SELECT') then
    raise exception 'Anonymous users must not query CMS storage directly';
  end if;
  if not has_table_privilege('anon', 'public.cms_published_documents', 'SELECT') then
    raise exception 'Anonymous users should read the public published-document projection';
  end if;
  if has_function_privilege('anon', 'public.bootstrap_cms_seed(text,text,jsonb,jsonb)', 'EXECUTE') then
    raise exception 'Anonymous users must not invoke the seed bootstrap RPC';
  end if;
end
$test$;
reset role;
\echo 'PASS: unseeded database handshake and bootstrap privilege boundary'

set role service_role;
set request.jwt.claims = '{"role":"service_role","app_metadata":{}}';
do $test$
declare
  v_result jsonb;
  v_retry jsonb;
  v_config jsonb;
begin
  v_result := public.bootstrap_cms_seed(
    'schema-1/content-1',
    repeat('a', 64),
    '{"site":{"brand":{"name":"SAFAR N MANZIL"}},"theme":{"light":{"primary":"#f97316"}}}'::jsonb,
    '[
      {
        "page":"home",
        "document":{
          "schemaVersion":1,
          "page":"home",
          "metadata":{
            "label":"Home",
            "path":"/",
            "seo":{"title":"Seeded home","description":"A test seed document."}
          },
          "blocks":[{
            "id":"seed-block",
            "type":"text",
            "props":{"text":"Seeded home content"},
            "layout":{
              "align":"left",
              "width":"normal",
              "spaceTop":3,
              "spaceBottom":3,
              "background":"none",
              "hideMobile":false,
              "hideDesktop":false
            }
          }]
        }
      }
    ]'::jsonb
  );

  if v_result ->> 'status' <> 'initialized'
     or (v_result ->> 'published_pages')::integer <> 1 then
    raise exception 'Initial bootstrap returned an unexpected response: %', v_result;
  end if;

  v_retry := public.bootstrap_cms_seed(
    'schema-1/content-1',
    repeat('a', 64),
    '{"site":{"brand":{"name":"SAFAR N MANZIL"}},"theme":{"light":{"primary":"#f97316"}}}'::jsonb,
    '[
      {
        "page":"home",
        "document":{
          "schemaVersion":1,
          "page":"home",
          "metadata":{
            "label":"Home",
            "path":"/",
            "seo":{"title":"Seeded home","description":"A test seed document."}
          },
          "blocks":[{
            "id":"seed-block",
            "type":"text",
            "props":{"text":"Seeded home content"},
            "layout":{
              "align":"left",
              "width":"normal",
              "spaceTop":3,
              "spaceBottom":3,
              "background":"none",
              "hideMobile":false,
              "hideDesktop":false
            }
          }]
        }
      }
    ]'::jsonb
  );

  if v_retry ->> 'status' <> 'already_initialized' then
    raise exception 'Same-checksum bootstrap should be idempotent, got %', v_retry;
  end if;

  begin
    perform public.bootstrap_cms_seed(
      'schema-1/content-2',
      repeat('b', 64),
      '{"site":{"brand":{"name":"Modified"}},"theme":{"light":{}}}'::jsonb,
      '[]'::jsonb
    );
    raise exception 'A changed seed unexpectedly overwrote the initialized CMS';
  exception
    when sqlstate '55000' then
      null;
  end;

  select public.get_public_site_config() into v_config;
  if v_config #>> '{content,site,brand,name}' <> 'SAFAR N MANZIL' then
    raise exception 'The public site config was unexpectedly overwritten';
  end if;
end
$test$;
reset role;
\echo 'PASS: trusted bootstrap is atomic, idempotent and does not overwrite edits'

set role anon;
set request.jwt.claims = '{"role":"anon","app_metadata":{}}';
do $test$
declare
  v_status jsonb;
  v_config jsonb;
  v_home jsonb;
begin
  v_status := public.get_cms_handshake(1);
  if v_status ->> 'status' <> 'ready' or v_status ->> 'ok' <> 'true' then
    raise exception 'Bootstrapped database should handshake as ready, got %', v_status;
  end if;
  if (v_status ->> 'schema_version')::integer <> 4 then
    raise exception 'Unexpected CMS schema version: %', v_status ->> 'schema_version';
  end if;
  if (v_status ->> 'published_page_count')::integer <> 1 then
    raise exception 'Expected one published page, got %', v_status ->> 'published_page_count';
  end if;
  if public.get_cms_handshake(999) ->> 'status' <> 'protocol_mismatch' then
    raise exception 'Unsupported client protocol must be reported';
  end if;

  v_config := public.get_public_site_config();
  if v_config #>> '{content,site,brand,name}' <> 'SAFAR N MANZIL' then
    raise exception 'Public site config RPC did not return the seeded brand';
  end if;
  v_home := public.get_published_page_document('home');
  if v_home #>> '{blocks,0,props,text}' <> 'Seeded home content' then
    raise exception 'Published home document is not queryable through the safe RPC';
  end if;
  if (select count(*) from public.cms_published_documents where page = 'home') <> 1 then
    raise exception 'Bootstrap must create the public published-document projection';
  end if;
  if public.get_published_site_manifest() #>> '{0,metadata,path}' <> '/' then
    raise exception 'Public route manifest should contain the seeded home route';
  end if;
end
$test$;
reset role;
\echo 'PASS: website/editor handshake and published document RPC after bootstrap'

-- This SQL file runs in a disposable integration database before the
-- publication-specific suite; reset only the fixture data between suites.
truncate table
  public.cms_site_config_revisions,
  public.cms_site_config,
  public.cms_published_documents,
  public.cms_revisions,
  public.cms_sections
restart identity cascade;
\echo 'PASS: bootstrap fixture cleared for publication integration tests'
