import { Pool } from 'pg';

let connectionString = 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || '';

// Strip any sslmode query params that conflict with custom ssl config
if (connectionString.includes('?')) {
  connectionString = connectionString.split('?')[0];
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS sentinel_events (
      id VARCHAR(64) PRIMARY KEY,
      repository VARCHAR(255) NOT NULL,
      branch VARCHAR(255) NOT NULL,
      commit_sha VARCHAR(64) NOT NULL,
      pr_number INTEGER,
      breaking BOOLEAN NOT NULL,
      breaking_count INTEGER NOT NULL DEFAULT 0,
      differences JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
