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
    <main className="min-h-screen bg-[#2C2929] text-[#DCD7D4] font-sans antialiased relative">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#DCD7D4]/20 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[#70000E] border border-[#F5F4F2]/40 animate-pulse"></span>
              <h1 className="text-2xl font-black tracking-tight text-[#F5F4F2] flex items-center gap-3">
                API Drift Sentinel
                <span className="text-xs font-mono font-bold bg-[#030303] text-[#C3B79D] border border-[#C3B79D]/40 px-2.5 py-0.5 rounded">
                  v1.2 Cloud
                </span>
              </h1>
            </div>
            <p className="text-xs font-medium text-[#DCD7D4]/70">
              Enterprise OpenAPI contract protection, schema drift blocking, and backward-compatible remediation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-bold uppercase tracking-wider bg-[#C3B79D] hover:bg-[#d8cbb1] text-[#030303] px-4 py-2.5 rounded shadow transition active:scale-95"
            >
              + Connect Repository
            </button>
            <button
              onClick={fetchEvents}
              className="text-xs font-semibold bg-[#030303] hover:bg-[#1a1818] border border-[#DCD7D4]/30 text-[#F5F4F2] px-4 py-2.5 rounded transition"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#030303]/90 border border-[#DCD7D4]/25 rounded-lg p-5 space-y-1 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-[#DCD7D4]/60 font-bold">Total Audits</span>
            <div className="text-3xl font-extrabold font-mono text-[#F5F4F2]">{stats.total}</div>
          </div>
          <div className="bg-[#70000E] border border-[#70000E] rounded-lg p-5 space-y-1 shadow-lg shadow-[#70000E]/20">
            <span className="text-[11px] uppercase tracking-wider text-[#F5F4F2]/80 font-bold">Breaking Drifts</span>
            <div className="text-3xl font-extrabold font-mono text-[#F5F4F2]">{stats.breaking}</div>
          </div>
          <div className="bg-[#030303]/90 border border-[#DCD7D4]/25 rounded-lg p-5 space-y-1 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-[#C3B79D] font-bold">Remediations</span>
            <div className="text-3xl font-extrabold font-mono text-[#C3B79D]">{stats.totalRemediations}</div>
          </div>
          <div className="bg-[#030303]/90 border border-[#DCD7D4]/25 rounded-lg p-5 space-y-1 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-[#DCD7D4]/60 font-bold">Monitored Repos</span>
            <div className="text-3xl font-extrabold font-mono text-[#F5F4F2]">{stats.uniqueRepos}</div>
          </div>
        </div>

        {/* Controls / Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search repository or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#030303] border border-[#DCD7D4]/30 text-xs text-[#F5F4F2] placeholder-[#DCD7D4]/40 rounded px-3.5 py-2.5 focus:outline-none focus:border-[#C3B79D] transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterBreakingOnly(!filterBreakingOnly)}
              className={`text-xs font-semibold px-4 py-2.5 rounded border transition ${
                filterBreakingOnly
                  ? 'bg-[#70000E] border-[#70000E] text-[#F5F4F2]'
                  : 'bg-[#030303] border-[#DCD7D4]/30 text-[#DCD7D4] hover:text-[#F5F4F2]'
              }`}
            >
              {filterBreakingOnly ? 'Showing Breaking Only' : 'Show All Events'}
            </button>
          </div>
        </div>

        {/* Incident Stream */}
        <section className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-[#DCD7D4]/60 font-mono">
              Loading persistent governance audit store...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-[#DCD7D4]/20 rounded-lg text-center text-xs text-[#DCD7D4]/60">
              No matching drift incidents found.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-6 rounded-lg border transition ${
                    evt.breaking
                      ? 'bg-[#030303] border-l-4 border-l-[#70000E] border-[#DCD7D4]/20 shadow-md'
                      : 'bg-[#030303] border-l-4 border-l-[#C3B79D] border-[#DCD7D4]/20'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 pb-3 border-b border-[#DCD7D4]/15">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-black tracking-wider uppercase rounded ${
                          evt.breaking
                            ? 'bg-[#70000E] text-[#F5F4F2]'
                            : 'bg-[#C3B79D] text-[#030303]'
                        }`}
                      >
                        {evt.breaking ? `🚨 ${evt.breakingCount} BREAKING DRIFT` : '✅ PASSING'}
                      </span>
                      <span className="font-bold text-base text-[#F5F4F2]">{evt.repository}</span>
                      <span className="text-xs font-mono text-[#DCD7D4]/80 bg-[#2C2929] px-2 py-0.5 rounded border border-[#DCD7D4]/20">
                        {evt.branch}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#DCD7D4]/70 font-mono">
                      <span className="font-semibold text-[#F5F4F2]">PR #{evt.prNumber || 'N/A'}</span>
                      <span>·</span>
                      <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {evt.differences && evt.differences.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {evt.differences.map((d, idx) => (
                        <div
                          key={idx}
                          className="bg-[#2C2929] border border-[#DCD7D4]/25 rounded-md p-4 text-xs space-y-2 font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="uppercase text-[10px] font-black tracking-widest bg-[#70000E] text-[#F5F4F2] px-2 py-0.5 rounded">
                              {d.action}
                            </span>
                            <span className="text-[#F5F4F2] font-semibold">{d.code}</span>
                          </div>

                          {d.location && (
                            <div className="text-[#DCD7D4]/80 text-[11px]">
                              <span className="font-sans font-bold text-[#DCD7D4]">Target: </span>{d.location}
                            </div>
                          )}

                          {d.remediation && (
                            <div className="text-[#030303] font-sans bg-[#C3B79D] p-3 rounded mt-2.5 text-xs leading-relaxed font-medium shadow-sm">
                              <span className="font-black uppercase tracking-wider block mb-1">
                                💡 Suggested Migration
                              </span>
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
        <div className="fixed inset-0 bg-[#030303]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#2C2929] border border-[#DCD7D4]/30 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#DCD7D4]/20 pb-3">
              <h3 className="text-xs font-black text-[#F5F4F2] uppercase tracking-wider">Connect a Repository</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#DCD7D4] hover:text-[#F5F4F2] text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#DCD7D4]/80 leading-relaxed">
              Add this workflow to your repository at <code className="text-[#C3B79D] font-mono">.github/workflows/sentinel.yml</code>. It will guard your PRs and stream audit metrics directly to this dashboard.
            </p>
            <div className="relative">
              <pre className="bg-[#030303] border border-[#DCD7D4]/25 rounded p-3.5 text-xs font-mono text-[#F5F4F2] overflow-x-auto leading-relaxed">
                {workflowSnippet}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2.5 right-2.5 bg-[#2C2929] hover:bg-[#3d3838] text-[#F5F4F2] border border-[#DCD7D4]/30 text-xs px-2.5 py-1 rounded transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs font-bold uppercase tracking-wider bg-[#C3B79D] hover:bg-[#d8cbb1] text-[#030303] px-4 py-2 rounded transition"
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
