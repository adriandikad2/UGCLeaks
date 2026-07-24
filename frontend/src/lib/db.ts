import { Pool } from 'pg';

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured. Set the Supabase Postgres connection string in the deployment environment.');
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
