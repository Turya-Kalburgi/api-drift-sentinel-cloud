import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'events.json');

function getStoredEvents() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEvents(events: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
}

export async function GET() {
  const events = getStoredEvents();
  return NextResponse.json({ success: true, count: events.length, events });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    const VALID_TOKEN = process.env.SENTINEL_API_KEY || 'sentinel_live_secret123';

    if (token && token !== VALID_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await req.json();

    const eventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      repository: body.repository || 'unknown/repo',
      branch: body.branch || 'unknown',
      commitSha: body.commitSha || 'unknown',
      prNumber: body.prNumber || null,
      breaking: Boolean(body.breaking),
      breakingCount: body.breakingCount || (body.differences ? body.differences.length : 0),
      differences: body.differences || [],
      receivedAt: new Date().toISOString(),
    };

    const currentEvents = getStoredEvents();
    currentEvents.unshift(eventRecord);
    saveEvents(currentEvents.slice(0, 100));

    return NextResponse.json({ success: true, eventId: eventRecord.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
