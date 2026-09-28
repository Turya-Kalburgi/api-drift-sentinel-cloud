'use client';

import { useEffect, useState, useMemo } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBreakingOnly, setFilterBreakingOnly] = useState(false);

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

  const stats = useMemo(() => {
    const total = events.length;
    const breaking = events.filter((e) => e.breaking).length;
    const uniqueRepos = new Set(events.map((e) => e.repository)).size;
    const totalRemediations = events.reduce((acc, curr) => {
      return acc + (curr.differences ? curr.differences.filter((d) => d.remediation).length : 0);
    }, 0);

    return { total, breaking, uniqueRepos, totalRemediations };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.branch.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBreakingOnly ? e.breaking : true;
      return matchesSearch && matchesFilter;
    });
  }, [events, searchTerm, filterBreakingOnly]);

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))]"></div>

      <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                API Drift Sentinel
                <span className="text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  v1.2 Cloud
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous contract drift prevention, pull request governance, and backward-compatible remediation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-3.5 py-2 rounded-lg shadow-sm transition transform active:scale-95"
            >
              + Connect Repository
            </button>
            <button
              onClick={fetchEvents}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 px-3 py-2 rounded-lg transition"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur rounded-xl p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Total Events</span>
            <div className="text-2xl font-bold font-mono text-white">{stats.total}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur rounded-xl p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-rose-400 font-medium">Breaking Blocked</span>
            <div className="text-2xl font-bold font-mono text-rose-400">{stats.breaking}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur rounded-xl p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium">Remediations</span>
            <div className="text-2xl font-bold font-mono text-amber-300">{stats.totalRemediations}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur rounded-xl p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-medium">Monitored Repos</span>
            <div className="text-2xl font-bold font-mono text-indigo-300">{stats.uniqueRepos}</div>
          </div>
        </div>

        {/* Controls / Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Filter by repository or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterBreakingOnly(!filterBreakingOnly)}
              className={`text-xs px-3 py-2 rounded-lg border transition ${
                filterBreakingOnly
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filterBreakingOnly ? 'Showing Breaking Only' : 'Show All Events'}
            </button>
          </div>
        </div>

        {/* Incident Stream */}
        <section className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500 font-mono">
              Loading persistent governance audit store...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
              No matching drift incidents found.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-5 rounded-xl border backdrop-blur-sm transition ${
                    evt.breaking
                      ? 'bg-rose-950/10 border-rose-900/40 hover:border-rose-800/60'
                      : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 pb-3 border-b border-slate-800/50">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full ${
                          evt.breaking
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {evt.breaking ? `🚨 ${evt.breakingCount} BREAKING DRIFT` : '✅ PASSING'}
                      </span>
                      <span className="font-semibold text-sm text-slate-100">{evt.repository}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        {evt.branch}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>PR #{evt.prNumber || 'N/A'}</span>
                      <span>·</span>
                      <span className="text-slate-500">{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {evt.differences && evt.differences.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {evt.differences.map((d, idx) => (
                        <div
                          key={idx}
                          className="bg-[#0b0e14] border border-slate-800/70 rounded-lg p-3.5 text-xs space-y-2 font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="uppercase text-[10px] font-bold tracking-wider bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60">
                              {d.action}
                            </span>
                            <span className="text-rose-200">{d.code}</span>
                          </div>

                          {d.location && (
                            <div className="text-slate-400 text-[11px]">
                              <span className="text-slate-500 font-sans">Location: </span>
                              {d.location}
                            </div>
                          )}

                          {d.remediation && (
                            <div className="text-amber-200/90 font-sans bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-md mt-2 text-[11px] leading-relaxed">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Connect a Repository</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add this workflow to your repository at <code className="text-emerald-400 font-mono">.github/workflows/sentinel.yml</code>. It will guard your PRs and stream audit metrics directly to this dashboard.
            </p>
            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800/90 rounded-lg p-3.5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
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
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition"
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
