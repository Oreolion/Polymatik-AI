-- Additive product data only. Auth schemas and migration 0001 are untouched.
CREATE TABLE polymatik.user_interests (
  user_id uuid PRIMARY KEY REFERENCES polymatik.users(id),
  status text NOT NULL CHECK (status IN ('selected', 'skipped')),
  subjects text[] NOT NULL,
  CHECK ((status = 'skipped' AND cardinality(subjects) = 0)
    OR (status = 'selected' AND cardinality(subjects) BETWEEN 1 AND 3)),
  -- Canonical order also rules out duplicates, NULLs, unknowns and extra dimensions.
  CHECK (subjects = array_remove(ARRAY[
    CASE WHEN 'Physics' = ANY(subjects) THEN 'Physics' END,
    CASE WHEN 'Mathematics' = ANY(subjects) THEN 'Mathematics' END,
    CASE WHEN 'Computing' = ANY(subjects) THEN 'Computing' END
  ], NULL))
);

ALTER TABLE polymatik.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymatik.user_interests FORCE ROW LEVEL SECURITY;
CREATE POLICY own_interests ON polymatik.user_interests
  USING (user_id IN (SELECT id FROM polymatik.users))
  WITH CHECK (user_id IN (SELECT id FROM polymatik.users));
