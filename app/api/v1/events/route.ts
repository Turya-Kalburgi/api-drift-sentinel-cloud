import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

async function sendSlackAlert(webhookUrl: string, event: any) {
  if (!webhookUrl || !event.breaking) return;

  const diffItems = (event.differences || [])
    .map((d: any) => `• *${d.action.toUpperCase()}*: \`${d.code}\` at \`${d.location || 'spec'}\``)
    .join('\n');

  const text = `🚨 *API Drift Sentinel Alert*\n*Repo:* ${event.repository}\n*Ref:* ${event.branch} ${event.prNumber ? `(PR #${event.prNumber})` : ''}\n*Breaking Changes:* ${event.breakingCount}\n\n${diffItems}`;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error('Slack webhook dispatch failed:', err);
  }
}

export async function GET() {
  try {
    await initDb();
    const { rows } = await query(`
      SELECT 
        id, 
        repository, 
        branch, 
        commit_sha as "commitSha", 
        pr_number as "prNumber", 
        breaking, 
        breaking_count as "breakingCount", 
        differences, 
        created_at as "receivedAt"
      FROM sentinel_events
      ORDER BY created_at DESC
      LIMIT 100;
    `);
    return NextResponse.json({ success: true, count: rows.length, events: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const VALID_TOKEN = process.env.SENTINEL_API_KEY || 'sentinel_live_secret123';

    if (token && token !== VALID_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await initDb();

    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const repository = body.repository || 'unknown/repo';
    const branch = body.branch || 'unknown';
    const commitSha = body.commitSha || 'unknown';
    const prNumber = body.prNumber || null;
    const breaking = Boolean(body.breaking);
    const breakingCount = body.breakingCount || (body.differences ? body.differences.length : 0);
    const differences = JSON.stringify(body.differences || []);

    await query(
      `INSERT INTO sentinel_events (id, repository, branch, commit_sha, pr_number, breaking, breaking_count, differences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [id, repository, branch, commitSha, prNumber, breaking, breakingCount, differences]
    );

    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook && breaking) {
      await sendSlackAlert(slackWebhook, {
        repository,
        branch,
        prNumber,
        breaking,
        breakingCount,
        differences: body.differences || [],
      });
    }

    return NextResponse.json({ success: true, eventId: id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
