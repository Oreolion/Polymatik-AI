-- Explicitly approved development target only. All probe rows/helpers roll back.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='15s';
DO $$ BEGIN
  IF current_database()<>'neondb' OR current_user<>'neondb_owner' THEN
    RAISE EXCEPTION 'Wrong taxonomy verification identity';
  END IF;
END $$;
CREATE FUNCTION pg_temp.expect_taxonomy_failure(command text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE command;
  EXCEPTION WHEN check_violation THEN RETURN;
  END;
  RAISE EXCEPTION 'Expected SQLSTATE 23514; statement succeeded';
END $$;

INSERT INTO polymatik.content_items
  (id,title,source,publisher,kind,topic,canonical_url,description,note,sort_order)
VALUES ('taxonomy-schema-proof','Taxonomy probe','Local fixture','Polymatik AI',
  'Article','Chemistry','https://example.org/taxonomy-schema-proof',
  'Rollback-only verification fixture.','Not curated content',2147483002);
DO $$
DECLARE subject text; item polymatik.content_items%ROWTYPE; probe_user uuid;
BEGIN
  SELECT * INTO STRICT item FROM polymatik.content_items WHERE id='taxonomy-schema-proof';
  IF item.visibility<>'hidden' OR item.quality_status<>'draft' THEN
    RAISE EXCEPTION 'Unsafe default publication state';
  END IF;
  FOREACH subject IN ARRAY ARRAY['Physics','Mathematics','Computing','Biology','Psychology','Philosophy','Sociology',
    'Chemistry','Art','Metaphysics','Politics','History','Literature','Economics'] LOOP
    UPDATE polymatik.content_items SET topic=subject,secondary_subjects='{}' WHERE id='taxonomy-schema-proof';
  END LOOP;
  UPDATE polymatik.content_items SET topic='Chemistry',secondary_subjects=ARRAY['Art','Metaphysics'] WHERE id='taxonomy-schema-proof';
  PERFORM set_config('polymatik.auth_subject','taxonomy-schema-'||gen_random_uuid()::text,true);
  INSERT INTO polymatik.users(auth_subject) VALUES(current_setting('polymatik.auth_subject')) RETURNING id INTO probe_user;
  INSERT INTO polymatik.user_interests VALUES(probe_user,'selected',ARRAY['Chemistry','Art','Politics']);
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=ARRAY[''Art'',''Chemistry''] WHERE user_id=%L',probe_user));
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=ARRAY[''Chemistry'',''Art'',''Politics'',''Economics''] WHERE user_id=%L',probe_user));
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=ARRAY[''Chemistry'',''Chemistry''] WHERE user_id=%L',probe_user));
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=ARRAY[NULL]::text[] WHERE user_id=%L',probe_user));
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=ARRAY[[''Chemistry'']] WHERE user_id=%L',probe_user));
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=array_fill(''Chemistry''::text,ARRAY[1],ARRAY[0]) WHERE user_id=%L',probe_user));
  PERFORM pg_temp.expect_taxonomy_failure(format('UPDATE polymatik.user_interests SET subjects=ARRAY[''Unknown''] WHERE user_id=%L',probe_user));
END $$;
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET topic='Unknown' WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Chemistry'] WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Art','Art'] WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Art','Politics','Economics'] WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY['Economics','Art'] WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY[NULL]::text[] WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=ARRAY[['Art']] WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET secondary_subjects=array_fill('Art'::text,ARRAY[1],ARRAY[0]) WHERE id='taxonomy-schema-proof'$q$);
SELECT pg_temp.expect_taxonomy_failure($q$UPDATE polymatik.content_items SET visibility='public',quality_status='reviewed' WHERE id='taxonomy-schema-proof'$q$);
ROLLBACK;
