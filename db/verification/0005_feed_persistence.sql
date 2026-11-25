-- Actual polymatik_app login only, on the verified isolated child. All fixtures roll back.
BEGIN;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='1s';
DO $$
BEGIN
  IF current_database()<>'neondb' OR current_user<>'polymatik_app'
    OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Restricted verification identity required';
  END IF;
  IF (SELECT count(*)<>3 OR NOT bool_and(relrowsecurity AND relforcerowsecurity)
    FROM pg_class WHERE oid IN ('polymatik.feed_batches'::regclass,'polymatik.feed_batch_items'::regclass,'polymatik.feed_dismissals'::regclass)) THEN
    RAISE EXCEPTION 'Missing forced feed policies';
  END IF;
  IF has_table_privilege(current_user,'polymatik.feed_batches','UPDATE,TRUNCATE')
    OR has_table_privilege(current_user,'polymatik.feed_batch_items','UPDATE,DELETE,TRUNCATE')
    OR has_table_privilege(current_user,'polymatik.feed_dismissals','UPDATE,TRUNCATE') THEN
    RAISE EXCEPTION 'Excessive feed privileges';
  END IF;
END $$;

CREATE FUNCTION pg_temp.expect_feed_failure(command text,expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE command;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE=expected THEN RETURN; ELSE RAISE; END IF;
  END;
  RAISE EXCEPTION 'Expected feed rejection did not occur';
END $$;

DO $$
DECLARE alice text:='feed-proof-'||gen_random_uuid()::text;
  bob text:='feed-proof-'||gen_random_uuid()::text;
  a uuid; b uuid; batch_a uuid; batch_b uuid; affected integer;
BEGIN
  PERFORM set_config('polymatik.auth_subject',alice,true);
  INSERT INTO polymatik.users(auth_subject) VALUES(alice) RETURNING id INTO a;
  INSERT INTO polymatik.feed_batches(user_id,fingerprint,policy,basis,limited)
    VALUES(a,repeat('a',64),'subjects-v1','interests',false) RETURNING id INTO batch_a;
  INSERT INTO polymatik.feed_batch_items VALUES(a,batch_a,2,'atoms','Physics');
  INSERT INTO polymatik.feed_dismissals(user_id,content_id) VALUES(a,'atoms') ON CONFLICT DO NOTHING;
  INSERT INTO polymatik.feed_dismissals(user_id,content_id) VALUES(a,'atoms') ON CONFLICT DO NOTHING;
  IF (SELECT count(*) FROM polymatik.feed_dismissals)<>1 THEN RAISE EXCEPTION 'Dismissal not idempotent'; END IF;
  IF EXISTS(SELECT 1 FROM polymatik.feed_batch_items i WHERE NOT EXISTS(
    SELECT 1 FROM polymatik.feed_dismissals d WHERE d.user_id=i.user_id AND d.content_id=i.content_id)) THEN
    RAISE EXCEPTION 'Dismissed item visible in active selection';
  END IF;
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_batch_items VALUES(%L,%L,100,''theory'',NULL)',a,batch_a),'23514');
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_batch_items VALUES(%L,%L,-1,''theory'',NULL)',a,batch_a),'23514');
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_batch_items VALUES(%L,%L,3,''atoms'',NULL)',a,batch_a),'23505');
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_batch_items VALUES(%L,%L,3,''theory'',''Unknown'')',a,batch_a),'23514');
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_dismissals(user_id,content_id) VALUES(%L,''missing-feed-proof'')',a),'23503');

  PERFORM set_config('polymatik.auth_subject',bob,true);
  IF EXISTS(SELECT 1 FROM polymatik.feed_batches) OR EXISTS(SELECT 1 FROM polymatik.feed_batch_items)
    OR EXISTS(SELECT 1 FROM polymatik.feed_dismissals) THEN RAISE EXCEPTION 'Cross-user feed read'; END IF;
  INSERT INTO polymatik.users(auth_subject) VALUES(bob) RETURNING id INTO b;
  INSERT INTO polymatik.feed_batches(user_id,fingerprint,policy,basis,limited)
    VALUES(b,repeat('b',64),'subjects-v1','cold_start',false) RETURNING id INTO batch_b;
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_batch_items VALUES(%L,%L,0,''theory'',NULL)',b,batch_a),'23503');
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_batch_items VALUES(%L,%L,0,''theory'',NULL)',a,batch_a),'42501');
  PERFORM pg_temp.expect_feed_failure(format('INSERT INTO polymatik.feed_dismissals(user_id,content_id) VALUES(%L,''theory'')',a),'42501');
  DELETE FROM polymatik.feed_batches WHERE user_id=a;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Cross-user batch delete'; END IF;
  DELETE FROM polymatik.feed_dismissals WHERE user_id=a;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Cross-user dismissal delete'; END IF;

  PERFORM set_config('polymatik.auth_subject',alice,true);
  IF (SELECT count(*) FROM polymatik.feed_batches)<>1 OR (SELECT count(*) FROM polymatik.feed_batch_items)<>1 THEN
    RAISE EXCEPTION 'Own feed state changed';
  END IF;
  DELETE FROM polymatik.feed_dismissals WHERE user_id=a AND content_id='atoms';
  DELETE FROM polymatik.feed_dismissals WHERE user_id=a AND content_id='atoms';
  IF EXISTS(SELECT 1 FROM polymatik.feed_dismissals) THEN RAISE EXCEPTION 'Own restoration failed'; END IF;
  IF (SELECT position FROM polymatik.feed_batch_items)<>2 THEN RAISE EXCEPTION 'Positions shifted'; END IF;
  DELETE FROM polymatik.feed_batches WHERE user_id=a;
  IF EXISTS(SELECT 1 FROM polymatik.feed_batch_items) THEN RAISE EXCEPTION 'Old batch items not replaced'; END IF;
  INSERT INTO polymatik.feed_batches(user_id,fingerprint,policy,basis,limited,created_at,expires_at)
    VALUES(a,repeat('c',64),'subjects-v1','cold_start',false,now()-interval '26 hours',now()-interval '2 hours');
  IF EXISTS(SELECT 1 FROM polymatik.feed_batches WHERE expires_at>now()) THEN RAISE EXCEPTION 'Expired batch reused'; END IF;
  PERFORM set_config('polymatik.auth_subject','',true);
  IF EXISTS(SELECT 1 FROM polymatik.feed_batches) OR EXISTS(SELECT 1 FROM polymatik.feed_batch_items)
    OR EXISTS(SELECT 1 FROM polymatik.feed_dismissals) THEN RAISE EXCEPTION 'Unsigned feed read'; END IF;
END $$;
ROLLBACK;
