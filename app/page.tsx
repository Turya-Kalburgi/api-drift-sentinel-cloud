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
    <main className="min-h-screen bg-[#0A0A0A] text-[#B7B4AE] font-sans antialiased selection:bg-[#726E68]/30 selection:text-white">
      <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#33312F] pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B7B4AE] animate-pulse"></span>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                API Drift Sentinel
                <span className="text-[11px] font-mono font-medium bg-[#33312F] text-[#B7B4AE] border border-[#726E68]/50 px-2 py-0.5 rounded">
                  v1.2 Cloud
                </span>
              </h1>
            </div>
            <p className="text-xs text-[#726E68]">
              Automated contract drift monitoring with backward-compatible remediation guidance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold bg-[#B7B4AE] hover:bg-[#d0cdc7] text-[#0A0A0A] px-3.5 py-2 rounded shadow-sm transition active:scale-95"
            >
              + Connect Repository
            </button>
            <button
              onClick={fetchEvents}
              className="text-xs bg-[#33312F] hover:bg-[#3d3a37] border border-[#726E68]/40 text-[#B7B4AE] px-3 py-2 rounded transition"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-[#33312F] rounded-lg p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#726E68] font-semibold">Total Events</span>
            <div className="text-2xl font-bold font-mono text-white">{stats.total}</div>
          </div>
          <div className="bg-[#371E1E]/30 border border-[#371E1E] rounded-lg p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#c78282] font-semibold">Breaking Blocked</span>
            <div className="text-2xl font-bold font-mono text-[#e08b8b]">{stats.breaking}</div>
          </div>
          <div className="bg-[#141414] border border-[#33312F] rounded-lg p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#726E68] font-semibold">Remediations</span>
            <div className="text-2xl font-bold font-mono text-[#B7B4AE]">{stats.totalRemediations}</div>
          </div>
          <div className="bg-[#141414] border border-[#33312F] rounded-lg p-4 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#726E68] font-semibold">Monitored Repos</span>
            <div className="text-2xl font-bold font-mono text-[#B7B4AE]">{stats.uniqueRepos}</div>
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
              className="w-full bg-[#141414] border border-[#33312F] text-xs text-[#B7B4AE] placeholder-[#726E68] rounded px-3 py-2 focus:outline-none focus:border-[#726E68] transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterBreakingOnly(!filterBreakingOnly)}
              className={`text-xs px-3 py-2 rounded border transition ${
                filterBreakingOnly
                  ? 'bg-[#371E1E] border-[#c78282]/50 text-[#e08b8b]'
                  : 'bg-[#141414] border-[#33312F] text-[#726E68] hover:text-[#B7B4AE]'
              }`}
            >
              {filterBreakingOnly ? 'Showing Breaking Only' : 'Show All Events'}
            </button>
          </div>
        </div>

        {/* Incident Stream */}
        <section className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-[#726E68] font-mono">
              Loading persistent governance audit store...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 border border-dashed border-[#33312F] rounded-lg text-center text-xs text-[#726E68]">
              No matching drift incidents found.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-5 rounded-lg border transition ${
                    evt.breaking
                      ? 'bg-[#141414] border-[#371E1E]'
                      : 'bg-[#141414] border-[#33312F]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 pb-3 border-b border-[#33312F]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded ${
                          evt.breaking
                            ? 'bg-[#371E1E] text-[#e08b8b] border border-[#371E1E]'
                            : 'bg-[#33312F] text-[#B7B4AE] border border-[#726E68]/40'
                        }`}
                      >
                        {evt.breaking ? `🚨 ${evt.breakingCount} BREAKING DRIFT` : '✅ PASSING'}
                      </span>
                      <span className="font-semibold text-sm text-white">{evt.repository}</span>
                      <span className="text-xs font-mono text-[#726E68] bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#33312F]">
                        {evt.branch}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#726E68] font-mono">
                      <span>PR #{evt.prNumber || 'N/A'}</span>
                      <span>·</span>
                      <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {evt.differences && evt.differences.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {evt.differences.map((d, idx) => (
                        <div
                          key={idx}
                          className="bg-[#0A0A0A] border border-[#33312F] rounded p-3 text-xs space-y-2 font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="uppercase text-[10px] font-bold tracking-wider bg-[#371E1E] text-[#e08b8b] px-1.5 py-0.5 rounded border border-[#371E1E]">
                              {d.action}
                            </span>
                            <span className="text-[#B7B4AE]">{d.code}</span>
                          </div>

                          {d.location && (
                            <div className="text-[#726E68] text-[11px]">
                              <span className="font-sans text-[#726E68]">Target: </span>{d.location}
                            </div>
                          )}

                          {d.remediation && (
                            <div className="text-[#B7B4AE] font-sans bg-[#33312F]/40 border border-[#726E68]/30 p-2.5 rounded mt-2 text-[11px] leading-relaxed">
                              <span className="font-semibold text-white">💡 Suggested Migration: </span>
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
        <div className="fixed inset-0 bg-[#0A0A0A]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#33312F] rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#33312F] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Connect a Repository</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#726E68] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#726E68] leading-relaxed">
              Add this workflow to your repository at <code className="text-[#B7B4AE] font-mono">.github/workflows/sentinel.yml</code>. It will guard your PRs and stream audit metrics directly to this dashboard.
            </p>
            <div className="relative">
              <pre className="bg-[#0A0A0A] border border-[#33312F] rounded p-3.5 text-xs font-mono text-[#B7B4AE] overflow-x-auto leading-relaxed">
                {workflowSnippet}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2.5 right-2.5 bg-[#33312F] hover:bg-[#3d3a37] text-white border border-[#726E68]/40 text-xs px-2.5 py-1 rounded transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs bg-[#B7B4AE] hover:bg-white text-[#0A0A0A] px-4 py-2 rounded font-medium transition"
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
