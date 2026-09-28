import { sql } from '@vercel/postgres';

export async function initDb() {
  await sql`
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
  `;
}
