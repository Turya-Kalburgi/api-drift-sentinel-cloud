'use client';

import { useEffect, useState } from 'react';

interface Difference {
  action: string;
  code: string;
  location?: string;
  remediation?: string;
}

interface SentinelEvent {
  id: string;
  repository: string;
  branch: string;
  commitSha: string;
  prNumber: number | null;
  breaking: boolean;
  breakingCount: number;
  differences: Difference[];
  receivedAt: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<SentinelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const workflowSnippet = `name: API Drift Sentinel
on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - 'openapi.json'

jobs:
  governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run API Drift Sentinel
        uses: Turya-Kalburgi/api-drift-sentinel@v1.2.0
        with:
          base-spec: 'openapi.yaml'
          head-spec: 'openapi.yaml'
          fail-on-breaking: 'true'
          github-token: \${{ secrets.GITHUB_TOKEN }}
          sentinel-endpoint: 'https://api-drift-sentinel-cloud.vercel.app/api/v1/events'
          sentinel-token: 'sentinel_live_secret123'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workflowSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/v1/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-2xl font-bold tracking-tight">API Drift Sentinel Cloud</h1>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700">Governance & Remediation</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Automated contract drift monitoring with backward-compatible remediation guidance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-md shadow-sm transition"
            >
              + Connect Repository
            </button>
            <button 
              onClick={fetchEvents}
              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-md transition"
            >
              Refresh Stream
            </button>
          </div>
        </header>

        {/* Audit Stream */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold tracking-wide text-slate-200">Incident & Drift Stream</h2>
            <span className="text-xs text-slate-500 font-mono">{events.length} total events recorded</span>
          </div>
          
          {loading ? (
            <div className="text-sm text-slate-500">Connecting to persistent audit store...</div>
          ) : events.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center text-slate-500">
              No API drift events recorded yet. Connect a repository CI action to begin monitoring.
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((evt) => (
                <div 
                  key={evt.id} 
                  className={`p-5 rounded-lg border transition ${
                    evt.breaking 
                      ? 'bg-rose-950/20 border-rose-900/60' 
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        evt.breaking ? 'bg-rose-600/20 text-rose-400 border border-rose-600/40' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
                      }`}>
                        {evt.breaking ? `🚨 ${evt.breakingCount} BREAKING DRIFT` : '✅ PASSING'}
                      </span>
                      <span className="font-semibold text-sm text-slate-200">{evt.repository}</span>
                      <span className="text-xs text-slate-400 font-mono">({evt.branch})</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(evt.receivedAt).toLocaleTimeString()} · PR #{evt.prNumber || 'N/A'}
                    </div>
                  </div>

                  {evt.differences && evt.differences.length > 0 && (
                    <div className="space-y-3 mt-4 pt-3 border-t border-slate-800/80">
                      {evt.differences.map((d, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded p-3 text-xs space-y-1.5 font-mono">
                          <div className="flex items-center gap-2 text-rose-300">
                            <span className="uppercase font-bold text-[10px] bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                              {d.action}
                            </span>
                            <span>{d.code}</span>
                          </div>
                          {d.location && (
                            <div className="text-slate-400">
                              <span className="text-slate-500 font-sans">Target: </span>{d.location}
                            </div>
                          )}
                          {d.remediation && (
                            <div className="text-amber-200/90 font-sans bg-amber-950/30 border border-amber-900/40 p-2.5 rounded mt-2">
                              <span className="font-semibold text-amber-400">💡 Suggested Migration: </span>
                              {d.remediation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Connect Repository Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Connect a Repository</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Add this workflow to your repository at <code className="text-emerald-400 font-mono">.github/workflows/sentinel.yml</code>. It will guard your PRs and stream audit metrics directly to this dashboard.
            </p>
            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-slate-300 overflow-x-auto">
                {workflowSnippet}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2.5 right-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
