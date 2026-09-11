import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'gv_db',
  user: process.env.POSTGRES_USER || 'gv_user',
  password: process.env.POSTGRES_PASSWORD || 'changeme',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => console.error('pg pool error:', err));
