CREATE SCHEMA IF NOT EXISTS polymatik;

CREATE TABLE polymatik.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE CHECK (length(auth_subject) BETWEEN 1 AND 128),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Reviewed link metadata only; no copied source text, embeddings or Auth tables.
CREATE TABLE polymatik.content_items (
  id text PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9-]{0,47}$'),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 240),
  source text NOT NULL CHECK (length(source) BETWEEN 1 AND 200),
  publisher text NOT NULL CHECK (length(publisher) BETWEEN 1 AND 200),
  kind text NOT NULL CHECK (kind IN ('Chapter', 'Interactive', 'Article', 'Course')),
  topic text NOT NULL CHECK (topic IN ('Physics', 'Mathematics', 'Computing')),
  canonical_url text NOT NULL UNIQUE CHECK (canonical_url ~ '^https://' AND length(canonical_url) <= 2048),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 1000),
  note text NOT NULL CHECK (length(note) BETWEEN 1 AND 200),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden')),
  license_status text NOT NULL DEFAULT 'link_metadata_only' CHECK (license_status = 'link_metadata_only'),
  quality_status text NOT NULL DEFAULT 'reviewed' CHECK (quality_status IN ('reviewed', 'withdrawn')),
  sort_order integer NOT NULL UNIQUE CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE polymatik.saved_items (
  user_id uuid NOT NULL REFERENCES polymatik.users(id),
  content_id text NOT NULL REFERENCES polymatik.content_items(id),
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

ALTER TABLE polymatik.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymatik.users FORCE ROW LEVEL SECURITY;
CREATE POLICY own_user ON polymatik.users
  USING (auth_subject = current_setting('polymatik.auth_subject', true) AND deleted_at IS NULL)
  WITH CHECK (auth_subject = current_setting('polymatik.auth_subject', true));

ALTER TABLE polymatik.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymatik.saved_items FORCE ROW LEVEL SECURITY;
CREATE POLICY own_saves ON polymatik.saved_items
  USING (user_id IN (SELECT id FROM polymatik.users))
  WITH CHECK (user_id IN (SELECT id FROM polymatik.users));
