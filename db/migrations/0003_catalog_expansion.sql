-- PREPARED ONLY. Execute through the reviewed transactional runner, never startup.
-- No catalog import, publication, account-row update or asset upload.
-- Applied 0001 and 0002 remain immutable. All new constraint names are explicit.

-- Locate the one legacy single-column CHECK by catalog identity rather than
-- depending on PostgreSQL's generated names. Unexpected drift aborts the runner.
DO $$
DECLARE
  target record;
  checks text[];
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('content_items','kind'), ('content_items','topic'),
    ('content_items','quality_status'), ('user_interests','subjects')
  ) AS targets(table_name,column_name)
  LOOP
    SELECT array_agg(c.conname::text ORDER BY c.conname) INTO checks
    FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid
    WHERE c.conrelid=format('polymatik.%I',target.table_name)::regclass
      AND c.contype='c' AND a.attname=target.column_name
      AND c.conkey=ARRAY[a.attnum];
    IF cardinality(checks) IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION 'Unexpected legacy CHECK layout; no migration applied';
    END IF;
    EXECUTE format('ALTER TABLE polymatik.%I DROP CONSTRAINT %I',target.table_name,checks[1]);
  END LOOP;
END $$;

ALTER TABLE polymatik.content_items
  ALTER COLUMN visibility SET DEFAULT 'hidden',
  ALTER COLUMN quality_status SET DEFAULT 'draft',
  ADD CONSTRAINT catalog_kind_v3 CHECK (kind IN ('Chapter', 'Interactive', 'Article', 'Course', 'Video', 'Book')),
  ADD CONSTRAINT catalog_topic_v3 CHECK (topic IN ('Physics', 'Mathematics', 'Computing', 'Biology', 'Psychology', 'Philosophy', 'Sociology')),
  ADD CONSTRAINT catalog_quality_v3 CHECK (quality_status IN ('draft', 'under_review', 'reviewed', 'withdrawn')),
  ADD COLUMN secondary_subjects text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD CONSTRAINT catalog_secondary_v3 CHECK (
    cardinality(secondary_subjects) BETWEEN 0 AND 2
    AND NOT (topic = ANY(secondary_subjects))
    AND secondary_subjects = array_remove(ARRAY[
      CASE WHEN 'Physics' = ANY(secondary_subjects) THEN 'Physics' END,
      CASE WHEN 'Mathematics' = ANY(secondary_subjects) THEN 'Mathematics' END,
      CASE WHEN 'Computing' = ANY(secondary_subjects) THEN 'Computing' END,
      CASE WHEN 'Biology' = ANY(secondary_subjects) THEN 'Biology' END,
      CASE WHEN 'Psychology' = ANY(secondary_subjects) THEN 'Psychology' END,
      CASE WHEN 'Philosophy' = ANY(secondary_subjects) THEN 'Philosophy' END,
      CASE WHEN 'Sociology' = ANY(secondary_subjects) THEN 'Sociology' END
    ],NULL)
  );

-- Keep the existing selected/skipped cardinality rule (maximum three choices).
-- Widen only its canonical taxonomy; existing rows/order remain valid.
ALTER TABLE polymatik.user_interests
  ADD CONSTRAINT interests_subjects_v3 CHECK (subjects = array_remove(ARRAY[
    CASE WHEN 'Physics' = ANY(subjects) THEN 'Physics' END,
    CASE WHEN 'Mathematics' = ANY(subjects) THEN 'Mathematics' END,
    CASE WHEN 'Computing' = ANY(subjects) THEN 'Computing' END,
    CASE WHEN 'Biology' = ANY(subjects) THEN 'Biology' END,
    CASE WHEN 'Psychology' = ANY(subjects) THEN 'Psychology' END,
    CASE WHEN 'Philosophy' = ANY(subjects) THEN 'Philosophy' END,
    CASE WHEN 'Sociology' = ANY(subjects) THEN 'Sociology' END
  ],NULL));

-- Editorial evidence and source-rights claims are not public recommendations.
CREATE TABLE polymatik.catalog_editorial (
  content_id text PRIMARY KEY REFERENCES polymatik.content_items(id),
  observed_format text NOT NULL CHECK (length(btrim(observed_format)) BETWEEN 1 AND 200),
  rights_status text NOT NULL CHECK (rights_status IN ('needs_recheck','restricted','explicit_permission_verified','unknown')),
  difficulty text CHECK (difficulty IN ('foundational','intermediate','advanced')),
  quality_score smallint CHECK (quality_score BETWEEN 0 AND 100),
  source_review_note text NOT NULL CHECK (length(btrim(source_review_note)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE polymatik.catalog_source_runs (
  content_id text NOT NULL REFERENCES polymatik.content_items(id),
  source_run text NOT NULL CHECK (source_run IN ('preview','run_01','run_02')),
  source_id text NOT NULL CHECK (source_id ~ '^[a-z][a-z0-9-]{0,47}$'),
  PRIMARY KEY (content_id,source_run),
  UNIQUE (source_run,source_id)
);
CREATE TABLE polymatik.resource_aliases (
  alias_id text PRIMARY KEY CHECK (alias_id ~ '^[a-z][a-z0-9-]{0,47}$'),
  content_id text NOT NULL REFERENCES polymatik.content_items(id),
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
  CHECK (alias_id <> content_id)
);

CREATE TABLE polymatik.resource_covers (
  content_id text NOT NULL REFERENCES polymatik.content_items(id),
  version integer NOT NULL CHECK (version BETWEEN 1 AND 999999),
  storage_key text NOT NULL UNIQUE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  alt text NOT NULL CHECK (length(btrim(alt)) BETWEEN 1 AND 300),
  width integer NOT NULL CHECK (width BETWEEN 1 AND 8192),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 8192 AND width*2=height*3),
  media_type text NOT NULL DEFAULT 'image/webp' CHECK (media_type='image/webp'),
  master_path text NOT NULL CHECK (length(master_path) BETWEEN 1 AND 500),
  art_provenance text NOT NULL CHECK (length(btrim(art_provenance)) BETWEEN 1 AND 2000),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','withdrawn')),
  reviewed_by text CHECK (length(btrim(reviewed_by)) BETWEEN 1 AND 128),
  reviewed_at timestamptz,
  PRIMARY KEY (content_id,version),
  UNIQUE (content_id,version,review_status),
  CHECK (storage_key='resource-covers/' || content_id || '/cover-v' || version::text || '.webp'),
  CHECK ((review_status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
    OR (review_status<>'pending' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

ALTER TABLE polymatik.content_items
  ADD COLUMN cover_version integer,
  ADD COLUMN cover_status_required text GENERATED ALWAYS AS (
    CASE WHEN visibility='public' AND cover_version IS NOT NULL THEN 'approved'::text END
  ) STORED,
  ADD CONSTRAINT catalog_selected_cover_v3 FOREIGN KEY (id, cover_version)
    REFERENCES polymatik.resource_covers(content_id, version),
  -- Cross-table approval is a real FK, not a CHECK calling a lookup function.
  -- Changing/deleting a published cover's approval fails until it is unlinked.
  ADD CONSTRAINT catalog_approved_cover_v3 FOREIGN KEY (id, cover_version, cover_status_required)
    REFERENCES polymatik.resource_covers(content_id, version, review_status),
  ADD CONSTRAINT catalog_publication_v3 CHECK (visibility='hidden' OR (
    quality_status='reviewed' AND (
      id IN ('atoms', 'theory', 'browser', 'semester') OR cover_version IS NOT NULL
    )
  ));

-- A cover version identifies immutable bytes/presentation. Corrections create
-- a new version; only review fields may change without changing the version.
CREATE FUNCTION polymatik.guard_cover_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, polymatik AS $$
BEGIN
  IF ROW(NEW.content_id,NEW.version,NEW.storage_key,NEW.sha256,NEW.alt,NEW.width,NEW.height,NEW.media_type,NEW.master_path,NEW.art_provenance)
    IS DISTINCT FROM ROW(OLD.content_id,OLD.version,OLD.storage_key,OLD.sha256,OLD.alt,OLD.width,OLD.height,OLD.media_type,OLD.master_path,OLD.art_provenance) THEN
    RAISE EXCEPTION 'Cover versions are immutable; create a new version';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER immutable_cover_version BEFORE UPDATE ON polymatik.resource_covers
  FOR EACH ROW EXECUTE FUNCTION polymatik.guard_cover_version();

-- Canonical IDs and aliases share a serialized identity namespace. These are
-- operator-only writes. READ COMMITTED gives each lookup a fresh snapshot after
-- taking the lock; other isolation modes fail rather than admit a shadow ID.
CREATE FUNCTION polymatik.guard_catalog_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, polymatik AS $$
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'Catalog identity writes require read committed isolation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('polymatik.catalog.identities'));
  IF TG_TABLE_NAME='content_items' THEN
    IF TG_OP='UPDATE' THEN
      IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Canonical IDs are immutable';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM polymatik.resource_aliases WHERE alias_id=NEW.id) THEN
      RAISE EXCEPTION 'Canonical identity conflicts with an alias';
    END IF;
  ELSE
    IF TG_OP='UPDATE' THEN
      IF ROW(NEW.alias_id,NEW.content_id) IS DISTINCT FROM ROW(OLD.alias_id,OLD.content_id) THEN
        RAISE EXCEPTION 'Alias identities are immutable';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM polymatik.content_items WHERE id=NEW.alias_id) THEN
      RAISE EXCEPTION 'Alias conflicts with a canonical identity';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER canonical_identity_guard BEFORE INSERT OR UPDATE OF id ON polymatik.content_items
  FOR EACH ROW EXECUTE FUNCTION polymatik.guard_catalog_identity();
CREATE TRIGGER alias_identity_guard BEFORE INSERT OR UPDATE ON polymatik.resource_aliases
  FOR EACH ROW EXECUTE FUNCTION polymatik.guard_catalog_identity();

-- Only explicit public projections are readable by the request-handling role.
-- Security-barrier views intentionally use the view owner's base privileges.
REVOKE ALL ON TABLE polymatik.catalog_editorial, polymatik.catalog_source_runs,
  polymatik.resource_aliases, polymatik.resource_covers FROM PUBLIC, polymatik_app;
REVOKE ALL ON FUNCTION polymatik.guard_cover_version(), polymatik.guard_catalog_identity() FROM PUBLIC;

CREATE VIEW polymatik.published_resource_covers WITH (security_barrier = true) AS
  SELECT c.content_id,c.version,c.storage_key,c.sha256,c.alt,c.width,c.height,c.media_type
  FROM polymatik.resource_covers c JOIN polymatik.content_items i
    ON i.id=c.content_id AND i.cover_version=c.version
  WHERE i.visibility='public' AND i.quality_status='reviewed' AND c.review_status = 'approved';
CREATE VIEW polymatik.published_resource_aliases WITH (security_barrier = true) AS
  SELECT a.alias_id,a.content_id FROM polymatik.resource_aliases a
  JOIN polymatik.content_items i ON i.id=a.content_id
  WHERE i.visibility='public' AND i.quality_status='reviewed';
GRANT SELECT ON polymatik.published_resource_covers, polymatik.published_resource_aliases TO polymatik_app;
