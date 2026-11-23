-- PREPARED: 0004 only through the explicit isolated-development runner.
-- Widen three CHECK constraints; preserve rows, policies, grants and publication.
-- Validate the exact normalized 0003 definitions before replacing them.
CREATE TEMP TABLE taxonomy_v3_expected (
  topic text, secondary_subjects text[], subjects text[],
  CONSTRAINT expected_topic CHECK (topic IN ('Physics', 'Mathematics', 'Computing', 'Biology', 'Psychology', 'Philosophy', 'Sociology')),
  CONSTRAINT expected_secondary CHECK (cardinality(secondary_subjects) BETWEEN 0 AND 2
    AND NOT (topic = ANY(secondary_subjects))
    AND secondary_subjects = array_remove(ARRAY[
    CASE WHEN 'Physics' = ANY(secondary_subjects) THEN 'Physics' END,
    CASE WHEN 'Mathematics' = ANY(secondary_subjects) THEN 'Mathematics' END,
    CASE WHEN 'Computing' = ANY(secondary_subjects) THEN 'Computing' END,
    CASE WHEN 'Biology' = ANY(secondary_subjects) THEN 'Biology' END,
    CASE WHEN 'Psychology' = ANY(secondary_subjects) THEN 'Psychology' END,
    CASE WHEN 'Philosophy' = ANY(secondary_subjects) THEN 'Philosophy' END,
    CASE WHEN 'Sociology' = ANY(secondary_subjects) THEN 'Sociology' END
  ],NULL)),
  CONSTRAINT expected_interests CHECK (subjects = array_remove(ARRAY[
    CASE WHEN 'Physics' = ANY(subjects) THEN 'Physics' END,
    CASE WHEN 'Mathematics' = ANY(subjects) THEN 'Mathematics' END,
    CASE WHEN 'Computing' = ANY(subjects) THEN 'Computing' END,
    CASE WHEN 'Biology' = ANY(subjects) THEN 'Biology' END,
    CASE WHEN 'Psychology' = ANY(subjects) THEN 'Psychology' END,
    CASE WHEN 'Philosophy' = ANY(subjects) THEN 'Philosophy' END,
    CASE WHEN 'Sociology' = ANY(subjects) THEN 'Sociology' END
  ],NULL))
) ON COMMIT DROP;

DO $$
DECLARE item record; actual pg_constraint%ROWTYPE; expected text;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('polymatik.content_items','catalog_topic_v3','expected_topic'),
    ('polymatik.content_items','catalog_secondary_v3','expected_secondary'),
    ('polymatik.user_interests','interests_subjects_v3','expected_interests')
  ) AS checks(table_name,actual_name,expected_name) LOOP
    SELECT * INTO actual FROM pg_constraint
      WHERE conrelid=item.table_name::regclass AND conname=item.actual_name;
    SELECT pg_get_constraintdef(oid,false) INTO expected FROM pg_constraint
      WHERE conrelid='pg_temp.taxonomy_v3_expected'::regclass AND conname=item.expected_name;
    IF actual.oid IS NULL OR actual.contype<>'c' OR NOT actual.convalidated
      OR pg_get_constraintdef(actual.oid,false) IS DISTINCT FROM expected THEN
      RAISE EXCEPTION 'Taxonomy baseline constraint drift; no migration applied';
    END IF;
  END LOOP;
END $$;
DROP TABLE pg_temp.taxonomy_v3_expected;

ALTER TABLE polymatik.content_items
  DROP CONSTRAINT catalog_topic_v3,
  DROP CONSTRAINT catalog_secondary_v3,
  ADD CONSTRAINT catalog_topic_v4 CHECK (topic IN ('Physics', 'Mathematics', 'Computing', 'Biology', 'Psychology', 'Philosophy', 'Sociology', 'Chemistry', 'Art', 'Metaphysics', 'Politics', 'History', 'Literature', 'Economics')),
  ADD CONSTRAINT catalog_secondary_v4 CHECK (cardinality(secondary_subjects) BETWEEN 0 AND 2
    AND NOT (topic = ANY(secondary_subjects))
    AND secondary_subjects = array_remove(ARRAY[
    CASE WHEN 'Physics' = ANY(secondary_subjects) THEN 'Physics' END,
    CASE WHEN 'Mathematics' = ANY(secondary_subjects) THEN 'Mathematics' END,
    CASE WHEN 'Computing' = ANY(secondary_subjects) THEN 'Computing' END,
    CASE WHEN 'Biology' = ANY(secondary_subjects) THEN 'Biology' END,
    CASE WHEN 'Psychology' = ANY(secondary_subjects) THEN 'Psychology' END,
    CASE WHEN 'Philosophy' = ANY(secondary_subjects) THEN 'Philosophy' END,
    CASE WHEN 'Sociology' = ANY(secondary_subjects) THEN 'Sociology' END,
    CASE WHEN 'Chemistry' = ANY(secondary_subjects) THEN 'Chemistry' END,
    CASE WHEN 'Art' = ANY(secondary_subjects) THEN 'Art' END,
    CASE WHEN 'Metaphysics' = ANY(secondary_subjects) THEN 'Metaphysics' END,
    CASE WHEN 'Politics' = ANY(secondary_subjects) THEN 'Politics' END,
    CASE WHEN 'History' = ANY(secondary_subjects) THEN 'History' END,
    CASE WHEN 'Literature' = ANY(secondary_subjects) THEN 'Literature' END,
    CASE WHEN 'Economics' = ANY(secondary_subjects) THEN 'Economics' END
  ],NULL));

-- The existing selected/skipped cardinality CHECK remains unchanged.
ALTER TABLE polymatik.user_interests
  DROP CONSTRAINT interests_subjects_v3,
  ADD CONSTRAINT interests_subjects_v4 CHECK (subjects = array_remove(ARRAY[
    CASE WHEN 'Physics' = ANY(subjects) THEN 'Physics' END,
    CASE WHEN 'Mathematics' = ANY(subjects) THEN 'Mathematics' END,
    CASE WHEN 'Computing' = ANY(subjects) THEN 'Computing' END,
    CASE WHEN 'Biology' = ANY(subjects) THEN 'Biology' END,
    CASE WHEN 'Psychology' = ANY(subjects) THEN 'Psychology' END,
    CASE WHEN 'Philosophy' = ANY(subjects) THEN 'Philosophy' END,
    CASE WHEN 'Sociology' = ANY(subjects) THEN 'Sociology' END,
    CASE WHEN 'Chemistry' = ANY(subjects) THEN 'Chemistry' END,
    CASE WHEN 'Art' = ANY(subjects) THEN 'Art' END,
    CASE WHEN 'Metaphysics' = ANY(subjects) THEN 'Metaphysics' END,
    CASE WHEN 'Politics' = ANY(subjects) THEN 'Politics' END,
    CASE WHEN 'History' = ANY(subjects) THEN 'History' END,
    CASE WHEN 'Literature' = ANY(subjects) THEN 'Literature' END,
    CASE WHEN 'Economics' = ANY(subjects) THEN 'Economics' END
  ],NULL));
