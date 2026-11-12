-- Run using the exact rehearsal branch command in docs/39.
-- PostgreSQL cannot establish the Neon branch identity from the database name.
-- Catalog metadata only: no credentials, user rows or object definitions.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '3s';
SET LOCAL search_path = pg_catalog;

DO $$
BEGIN
  IF current_database() <> 'polymatik_rehearsal'
     OR current_user <> 'neondb_owner'
     OR session_user <> 'neondb_owner' THEN
    RAISE EXCEPTION 'Unexpected database or role; diagnostic stopped';
  END IF;
END;
$$;

SELECT jsonb_pretty(jsonb_build_object(
  'captured_at', statement_timestamp(),
  'database', current_database(),
  'session_role', session_user,
  'effective_role', current_user,
  'server_version', current_setting('server_version'),
  'read_only', current_setting('transaction_read_only'),
  'database_owner', pg_get_userbyid(d.datdba),
  'database_acl', d.datacl::text,
  'roles', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'name', r.rolname,
      'login', r.rolcanlogin,
      'superuser', r.rolsuper,
      'inherit', r.rolinherit,
      'connect', has_database_privilege(r.oid, d.oid, 'CONNECT'),
      'create', has_database_privilege(r.oid, d.oid, 'CREATE'),
      'temporary', has_database_privilege(r.oid, d.oid, 'TEMPORARY')
    ) ORDER BY r.rolname), '[]'::jsonb)
    FROM pg_roles AS r
    WHERE r.rolname !~ '^pg_'
  ),
  'memberships', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'member', pg_get_userbyid(m.member),
      'role', pg_get_userbyid(m.roleid),
      'grantor', pg_get_userbyid(m.grantor),
      'admin_option', m.admin_option,
      'inherit_option', m.inherit_option,
      'set_option', m.set_option
    ) ORDER BY m.member, m.roleid), '[]'::jsonb)
    FROM pg_auth_members AS m
  ),
  'schemas', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'name', n.nspname,
      'owner', pg_get_userbyid(n.nspowner),
      'acl', n.nspacl::text
    ) ORDER BY n.nspname), '[]'::jsonb)
    FROM pg_namespace AS n
    WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
  ),
  'auth_relations', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'name', c.relname,
      'kind', c.relkind,
      'owner', pg_get_userbyid(c.relowner)
    ) ORDER BY c.relname), '[]'::jsonb)
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'neon_auth'
  ),
  'auth_routine_count', (
    SELECT count(*) FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'neon_auth'
  )
)) AS diagnostics
FROM pg_database AS d
WHERE d.datname = current_database();

ROLLBACK;
