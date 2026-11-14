-- Development only: run with the exact Neon branch/database command in docs/43.
-- Reviewed privilege extension; never run automatically from CI or server startup.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
DO $$
BEGIN
  IF current_database() <> 'neondb' OR current_user <> 'neondb_owner' THEN
    RAISE EXCEPTION 'Wrong setup database or role; no privilege change applied';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles r WHERE r.rolname = 'polymatik_app'
      AND r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolbypassrls
      AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication
      AND NOT EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member = r.oid)
  ) OR EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'polymatik' AND c.relname IN ('users','saved_items')
      AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity)
  ) OR to_regclass('polymatik.saved_items') IS NULL
    OR to_regclass('polymatik.users') IS NULL THEN
    RAISE EXCEPTION 'Restricted role and forced row security are required';
  END IF;
END $$;
GRANT DELETE ON polymatik.saved_items TO polymatik_app;
COMMIT;
