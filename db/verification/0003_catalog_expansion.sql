-- PREPARED ONLY: run after explicit isolated-branch authorization and migration.
-- Use psql -X -v ON_ERROR_STOP=1. This is not a migration or a publication script.
-- Every fixture, temporary helper and temporary publication rolls back together.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $$ BEGIN
  IF current_database()<>'neondb' OR current_user<>'neondb_owner' THEN
    RAISE EXCEPTION 'Wrong verification database or role';
  END IF;
END $$;

CREATE FUNCTION pg_temp.expect_catalog_failure(command text, expected_state text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE command;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE=expected_state THEN RETURN; END IF;
    RAISE;
  END;
  -- Outside the exception block: unexpected success must never be swallowed.
  RAISE EXCEPTION 'Expected SQLSTATE %, but statement succeeded',expected_state;
END $$;

INSERT INTO polymatik.content_items
  (id,title,source,publisher,kind,topic,canonical_url,description,note,sort_order)
VALUES ('catalog-schema-proof','Schema probe','Local fixture','Polymatik AI',
  'Video','Physics','https://example.org/catalog-schema-proof',
  'Rollback-only database verification fixture.','Not curated content',2147483000);
DO $$
DECLARE value text; row_value polymatik.content_items%ROWTYPE;
BEGIN
  SELECT * INTO STRICT row_value FROM polymatik.content_items WHERE id='catalog-schema-proof';
  IF row_value.visibility<>'hidden' OR row_value.quality_status<>'draft' THEN
    RAISE EXCEPTION 'Unsafe default publication state';
  END IF;
  FOREACH value IN ARRAY ARRAY['Physics','Mathematics','Computing','Biology','Psychology','Philosophy','Sociology'] LOOP
    UPDATE polymatik.content_items SET topic=value WHERE id='catalog-schema-proof';
  END LOOP;
  FOREACH value IN ARRAY ARRAY['Chapter','Interactive','Article','Course','Video','Book'] LOOP
    UPDATE polymatik.content_items SET kind=value WHERE id='catalog-schema-proof';
  END LOOP;
  UPDATE polymatik.content_items SET topic='Physics',secondary_subjects=ARRAY['Biology','Sociology']
    WHERE id='catalog-schema-proof';
END $$;
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET topic='Unknown' WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET kind='Podcast' WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Physics'] WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Biology','Biology'] WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Biology','Psychology','Sociology'] WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY[NULL]::text[] WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY[['Biology']] WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET visibility='public' WHERE id='catalog-schema-proof'$q$,'23514');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET visibility='public',quality_status='reviewed' WHERE id='catalog-schema-proof'$q$,'23514');

INSERT INTO polymatik.resource_covers
  (content_id,version,storage_key,sha256,alt,width,height,master_path,art_provenance)
VALUES ('catalog-schema-proof',1,'resource-covers/catalog-schema-proof/cover-v1.webp',
  repeat('a',64),'Rollback-only cover metadata; no file is uploaded.',1200,800,
  'fixtures/cover.svg','Local verification fixture, not approved art');
DO $$ BEGIN
  IF (SELECT review_status FROM polymatik.resource_covers WHERE content_id='catalog-schema-proof')<>'pending' THEN
    RAISE EXCEPTION 'Unsafe default cover approval state';
  END IF;
END $$;
UPDATE polymatik.content_items SET cover_version=1 WHERE id='catalog-schema-proof';
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.content_items SET visibility='public',quality_status='reviewed' WHERE id='catalog-schema-proof'$q$,'23503');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.resource_covers SET review_status='approved' WHERE content_id='catalog-schema-proof'$q$,'23514');
UPDATE polymatik.resource_covers SET review_status='approved',reviewed_by='rollback-only-schema-probe',reviewed_at=now()
  WHERE content_id='catalog-schema-proof';
UPDATE polymatik.content_items SET visibility='public',quality_status='reviewed' WHERE id='catalog-schema-proof';
DO $$ BEGIN
  IF (SELECT count(*) FROM polymatik.published_resource_covers WHERE content_id='catalog-schema-proof')<>1 THEN
    RAISE EXCEPTION 'Approved selected public cover missing from projection';
  END IF;
END $$;
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.resource_covers SET review_status='withdrawn' WHERE content_id='catalog-schema-proof'$q$,'23503');
SELECT pg_temp.expect_catalog_failure($q$UPDATE polymatik.resource_covers SET sha256=repeat('b',64) WHERE content_id='catalog-schema-proof'$q$,'P0001');
SELECT pg_temp.expect_catalog_failure($q$DELETE FROM polymatik.resource_covers WHERE content_id='catalog-schema-proof'$q$,'23503');

INSERT INTO polymatik.resource_aliases(alias_id,content_id,reason)
  VALUES ('catalog-schema-alias','catalog-schema-proof','Rollback-only alias');
SELECT pg_temp.expect_catalog_failure($q$INSERT INTO polymatik.resource_aliases VALUES ('atoms','catalog-schema-proof','Collision probe')$q$,'P0001');
SELECT pg_temp.expect_catalog_failure($q$INSERT INTO polymatik.resource_aliases VALUES ('catalog-schema-chain','catalog-schema-alias','Chain probe')$q$,'23503');
SELECT pg_temp.expect_catalog_failure($q$INSERT INTO polymatik.content_items
  (id,title,source,publisher,kind,topic,canonical_url,description,note,sort_order)
  VALUES ('catalog-schema-alias','Collision','Fixture','Fixture','Book','Biology',
    'https://example.org/catalog-schema-alias','Collision probe','Fixture',2147483001)$q$,'P0001');
UPDATE polymatik.content_items SET visibility='hidden' WHERE id='catalog-schema-proof';
UPDATE polymatik.resource_covers SET review_status='withdrawn' WHERE content_id='catalog-schema-proof';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM polymatik.published_resource_covers WHERE content_id='catalog-schema-proof')
    OR EXISTS (SELECT 1 FROM polymatik.published_resource_aliases WHERE alias_id='catalog-schema-alias') THEN
    RAISE EXCEPTION 'Hidden resource metadata exposed through projections';
  END IF;
END $$;

DO $$
DECLARE probe_user uuid;
BEGIN
  PERFORM set_config('polymatik.auth_subject','catalog-schema-' || gen_random_uuid()::text,true);
  INSERT INTO polymatik.users(auth_subject) VALUES (current_setting('polymatik.auth_subject')) RETURNING id INTO probe_user;
  INSERT INTO polymatik.user_interests VALUES (probe_user,'selected',ARRAY['Biology','Philosophy','Sociology']);
  PERFORM pg_temp.expect_catalog_failure(format(
    'UPDATE polymatik.user_interests SET subjects=ARRAY[''Physics'',''Biology'',''Psychology'',''Sociology''] WHERE user_id=%L',probe_user),'23514');
  PERFORM pg_temp.expect_catalog_failure(format(
    'UPDATE polymatik.user_interests SET subjects=ARRAY[''Biology'',''Biology''] WHERE user_id=%L',probe_user),'23514');
END $$;

DO $$
DECLARE relation text;
BEGIN
  FOREACH relation IN ARRAY ARRAY['catalog_editorial','catalog_source_runs','resource_aliases','resource_covers'] LOOP
    IF has_table_privilege('polymatik_app','polymatik.' || relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') THEN
      RAISE EXCEPTION 'Application role has access to private editorial relation';
    END IF;
  END LOOP;
  IF has_table_privilege('polymatik_app','polymatik.content_items','INSERT,UPDATE,DELETE,TRUNCATE')
    OR NOT has_table_privilege('polymatik_app','polymatik.published_resource_covers','SELECT')
    OR NOT has_table_privilege('polymatik_app','polymatik.published_resource_aliases','SELECT')
    OR (SELECT count(*)<>3 OR NOT bool_and(c.relrowsecurity AND c.relforcerowsecurity)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='polymatik' AND c.relname IN ('users','saved_items','user_interests')) THEN
    RAISE EXCEPTION 'Application privilege or private row-security regression';
  END IF;
END $$;
SELECT 'Schema constraint/projection/privilege rehearsal passed; all fixtures will roll back.' AS result;
ROLLBACK;
