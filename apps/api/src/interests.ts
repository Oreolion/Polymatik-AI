import {
  interestUpdate,
  isInterests,
  type Interests,
  type InterestUpdate,
} from '@polymatik/domain-types/interests';

export type InterestsRepository = {
  read(subject: string): Promise<Interests>;
  write(subject: string, value: InterestUpdate): Promise<Interests>;
  reset(subject: string): Promise<Interests>;
};
type Connection = {
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};
const initial = (): Interests => ({ status: 'not_started', subjects: [] });

export function postgresInterests(
  connect: () => Promise<Connection>,
): InterestsRepository {
  async function run(
    subject: string,
    mutation?: InterestUpdate | 'reset',
  ): Promise<Interests> {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(subject))
      throw new Error('Invalid subject.');
    const parsed =
      mutation && mutation !== 'reset' ? interestUpdate(mutation) : null;
    if (mutation && mutation !== 'reset' && !parsed)
      throw new Error('Invalid interests.');
    const client = await connect();
    try {
      await client.query(mutation ? 'BEGIN' : 'BEGIN READ ONLY');
      await client.query("SET LOCAL statement_timeout = '5s'");
      await client.query("SET LOCAL lock_timeout = '1s'");
      await client.query(
        "SELECT set_config('polymatik.auth_subject', $1, true)",
        [subject],
      );
      if (parsed) {
        await client.query(
          'INSERT INTO polymatik.users (auth_subject) VALUES ($1) ON CONFLICT (auth_subject) DO NOTHING',
          [subject],
        );
        const result = await client.query(
          `INSERT INTO polymatik.user_interests (user_id,status,subjects)
          SELECT id,$2,$3::text[] FROM polymatik.users WHERE auth_subject = $1 AND deleted_at IS NULL
          ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, subjects = EXCLUDED.subjects
          RETURNING status,subjects`,
          [subject, parsed.status, parsed.subjects],
        );
        if (result.rows.length !== 1 || !isInterests(result.rows[0]))
          throw new Error('Interests write unavailable.');
      } else if (mutation === 'reset') {
        await client.query(
          `DELETE FROM polymatik.user_interests p USING polymatik.users u
          WHERE p.user_id = u.id AND u.auth_subject = $1 AND u.deleted_at IS NULL`,
          [subject],
        );
      }
      const result = await client.query(
        `SELECT p.status,p.subjects FROM polymatik.user_interests p
        JOIN polymatik.users u ON u.id = p.user_id
        WHERE u.auth_subject = $1 AND u.deleted_at IS NULL LIMIT 2`,
        [subject],
      );
      if (
        result.rows.length > 1 ||
        (result.rows.length === 1 && !isInterests(result.rows[0]))
      )
        throw new Error('Invalid interests result.');
      const value = result.rows[0] ?? initial();
      if (!isInterests(value)) throw new Error('Invalid interests result.');
      await client.query('COMMIT');
      return value;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await client.end();
    }
  }
  return {
    read: (subject) => run(subject),
    write: run,
    reset: (subject) => run(subject, 'reset'),
  };
}

export function workerInterests(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
): InterestsRepository | undefined {
  const mode: unknown = Reflect.get(env, 'CATALOG_BACKEND') ?? 'preview';
  if (mode === 'preview') return undefined;
  return postgresInterests(async () => {
    const binding: unknown = Reflect.get(env, 'HYPERDRIVE');
    const connection: unknown =
      binding && typeof binding === 'object'
        ? Reflect.get(binding, 'connectionString')
        : undefined;
    if (mode !== 'postgres' || typeof connection !== 'string')
      throw new Error('Interests binding unavailable.');
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: connection,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    });
    try {
      await client.connect();
    } catch (error) {
      await client.end().catch(() => {});
      throw error;
    }
    return {
      query: (sql, values) => client.query(sql, values),
      async end() {
        ctx.waitUntil(
          client
            .end()
            .catch(() =>
              console.error(
                JSON.stringify({ event: 'interests_cleanup_failed' }),
              ),
            ),
        );
      },
    };
  });
}
