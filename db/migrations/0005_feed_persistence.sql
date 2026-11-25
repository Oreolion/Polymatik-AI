-- Additive, explicit development rollout only. No existing records are rewritten.
CREATE TABLE polymatik.feed_batches (
  user_id uuid PRIMARY KEY REFERENCES polymatik.users(id),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  policy text NOT NULL CHECK (policy = 'subjects-v1'),
  basis text NOT NULL CHECK (basis IN ('interests','cold_start','no_matches')),
  limited boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '24 hours'),
  UNIQUE (user_id,id)
);

CREATE TABLE polymatik.feed_batch_items (
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 0 AND 99),
  content_id text NOT NULL REFERENCES polymatik.content_items(id),
  reason_subject text CHECK (reason_subject IN (
    'Physics','Mathematics','Computing','Biology','Psychology','Philosophy','Sociology',
    'Chemistry','Art','Metaphysics','Politics','History','Literature','Economics')),
  PRIMARY KEY (user_id,position),
  UNIQUE (user_id,content_id),
  FOREIGN KEY (user_id,batch_id) REFERENCES polymatik.feed_batches(user_id,id) ON DELETE CASCADE
);

CREATE TABLE polymatik.feed_dismissals (
  user_id uuid NOT NULL REFERENCES polymatik.users(id),
  content_id text NOT NULL REFERENCES polymatik.content_items(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,content_id)
);

ALTER TABLE polymatik.feed_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymatik.feed_batches FORCE ROW LEVEL SECURITY;
CREATE POLICY own_feed_batches ON polymatik.feed_batches
  USING (user_id IN (SELECT id FROM polymatik.users))
  WITH CHECK (user_id IN (SELECT id FROM polymatik.users));
ALTER TABLE polymatik.feed_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymatik.feed_batch_items FORCE ROW LEVEL SECURITY;
CREATE POLICY own_feed_batch_items ON polymatik.feed_batch_items
  USING (user_id IN (SELECT id FROM polymatik.users))
  WITH CHECK (user_id IN (SELECT id FROM polymatik.users));
ALTER TABLE polymatik.feed_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymatik.feed_dismissals FORCE ROW LEVEL SECURITY;
CREATE POLICY own_feed_dismissals ON polymatik.feed_dismissals
  USING (user_id IN (SELECT id FROM polymatik.users))
  WITH CHECK (user_id IN (SELECT id FROM polymatik.users));

REVOKE ALL ON polymatik.feed_batches,polymatik.feed_batch_items,polymatik.feed_dismissals FROM PUBLIC;
-- Grants are explicit, new-table only; never add elevated memberships or users UPDATE.
GRANT SELECT,INSERT,DELETE ON polymatik.feed_batches,polymatik.feed_dismissals TO polymatik_app;
GRANT SELECT,INSERT ON polymatik.feed_batch_items TO polymatik_app;
