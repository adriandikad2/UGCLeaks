import { Pool } from 'pg';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let pool: Pool | undefined;

function getConnectionString(): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const hyperdrive = (env as { HYPERDRIVE?: { connectionString?: string } }).HYPERDRIVE;
    if (hyperdrive?.connectionString) {
      return hyperdrive.connectionString;
    }
  } catch {
    // Cloudflare context is unavailable during local Next.js development.
  }

  return process.env.DATABASE_URL;
}

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error('No database connection is configured. Bind HYPERDRIVE in Cloudflare or set DATABASE_URL locally.');
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Pool error:', err);
  });

  pool.on('connect', () => {
    console.log('Connected to database');
  });

  return pool;
}

// Keep the existing pool.query(...) API while deferring env access until a request runs.
const lazyPool = new Proxy({} as Pool, {
  get(_target, property: string | symbol) {
    const activePool = getPool();
    const value = activePool[property as keyof Pool];
    return typeof value === 'function' ? value.bind(activePool) : value;
  },
});

export default lazyPool;
