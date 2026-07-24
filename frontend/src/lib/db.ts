import { Pool, types } from 'pg';
import { getCloudflareContext } from '@opennextjs/cloudflare';

types.setTypeParser(1114, (stringValue) => {
  return stringValue ? `${stringValue.replace(' ', 'T')}Z` : null;
});

function getDbConfig() {
  let connectionString: string | undefined;
  let isHyperdrive = false;

  try {
    const { env } = getCloudflareContext();
    const hyperdrive = (env as { HYPERDRIVE?: { connectionString?: string } }).HYPERDRIVE;
    if (hyperdrive?.connectionString) {
      connectionString = hyperdrive.connectionString;
      isHyperdrive = true;
    }
  } catch {
    // Cloudflare context unavailable (e.g. during local build / dev)
  }

  if (!connectionString) {
    connectionString = process.env.DATABASE_URL;
  }

  if (!connectionString) {
    throw new Error(
      'No database connection configured. Bind HYPERDRIVE in Cloudflare or set DATABASE_URL locally.'
    );
  }

  return { connectionString, isHyperdrive };
}

export function getDb() {
  const { connectionString, isHyperdrive } = getDbConfig();

  return new Pool({
    connectionString,
    ssl: isHyperdrive ? undefined : { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
  });
}

// Proxy that generates a fresh pool per request context
const db = new Proxy({} as Pool, {
  get(_target, property: string | symbol) {
    const activePool = getDb();
    const value = activePool[property as keyof Pool];
    return typeof value === 'function' ? value.bind(activePool) : value;
  },
});

export default db;