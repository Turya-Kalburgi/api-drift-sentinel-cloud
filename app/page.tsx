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
    <main className="min-h-screen bg-[#141517] text-[#c9c5be] font-sans antialiased relative overflow-hidden">
      {/* Architectural subtle ambient background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(164, 147, 128, 0.18) 0%, transparent 65%),
            linear-gradient(to right, rgba(92, 87, 81, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(92, 87, 81, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 36px 36px, 36px 36px'
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-8 z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#3c3a37]/80 pb-6 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#a49380] animate-pulse"></span>
              <h1 className="text-xl font-bold tracking-tight text-[#f2efe9] flex items-center gap-2.5">
                API Drift Sentinel
                <span className="text-[11px] font-mono font-medium bg-[#242323] text-[#a49380] border border-[#5c5751]/60 px-2 py-0.5 rounded">
                  v1.2 Cloud
                </span>
              </h1>
            </div>
            <p className="text-xs text-[#8f8a82]">
              Architectural API governance, schema drift blocking, and backward-compatible remediation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold bg-[#a49380] hover:bg-[#b8a996] text-[#141517] px-4 py-2 rounded shadow transition active:scale-95"
            >
              + Connect Repository
            </button>
            <button
              onClick={fetchEvents}
              className="text-xs bg-[#242323] hover:bg-[#302e2e] border border-[#5c5751]/60 text-[#c9c5be] px-3.5 py-2 rounded transition"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1f2022]/90 border border-[#3c3a37] rounded-lg p-4 space-y-1 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#8f8a82] font-semibold">Total Audits</span>
            <div className="text-2xl font-bold font-mono text-[#f2efe9]">{stats.total}</div>
          </div>
          <div className="bg-[#2c1d1d]/80 border border-[#5a2c2c] rounded-lg p-4 space-y-1 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#d99898] font-semibold">Breaking Drifts</span>
            <div className="text-2xl font-bold font-mono text-[#f0a8a8]">{stats.breaking}</div>
          </div>
          <div className="bg-[#1f2022]/90 border border-[#3c3a37] rounded-lg p-4 space-y-1 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#8f8a82] font-semibold">Remediations</span>
            <div className="text-2xl font-bold font-mono text-[#a49380]">{stats.totalRemediations}</div>
          </div>
          <div className="bg-[#1f2022]/90 border border-[#3c3a37] rounded-lg p-4 space-y-1 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-[#8f8a82] font-semibold">Monitored Repos</span>
            <div className="text-2xl font-bold font-mono text-[#f2efe9]">{stats.uniqueRepos}</div>
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
              className="w-full bg-[#1b1c1e] border border-[#3c3a37] text-xs text-[#f2efe9] placeholder-[#736e67] rounded px-3.5 py-2.5 focus:outline-none focus:border-[#a49380] transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterBreakingOnly(!filterBreakingOnly)}
              className={`text-xs px-3.5 py-2.5 rounded border transition ${
                filterBreakingOnly
                  ? 'bg-[#3b2222] border-[#8a4242] text-[#f0a8a8]'
                  : 'bg-[#1b1c1e] border-[#3c3a37] text-[#8f8a82] hover:text-[#f2efe9]'
              }`}
            >
              {filterBreakingOnly ? 'Showing Breaking Only' : 'Show All Events'}
            </button>
          </div>
        </div>

        {/* Incident Stream */}
        <section className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-[#8f8a82] font-mono">
              Loading persistent governance audit store...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 border border-dashed border-[#3c3a37] rounded-lg text-center text-xs text-[#8f8a82]">
              No matching drift incidents found.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-5 rounded-lg border backdrop-blur transition ${
                    evt.breaking
                      ? 'bg-[#1f1a1a]/90 border-[#5a2c2c]/80 hover:border-[#7a3b3b]'
                      : 'bg-[#1b1c1e]/90 border-[#3c3a37]/80 hover:border-[#5c5751]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 pb-3 border-b border-[#3c3a37]/70">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded ${
                          evt.breaking
                            ? 'bg-[#3b2222] text-[#f0a8a8] border border-[#5a2c2c]'
                            : 'bg-[#242323] text-[#a49380] border border-[#5c5751]/60'
                        }`}
                      >
                        {evt.breaking ? `🚨 ${evt.breakingCount} BREAKING DRIFT` : '✅ PASSING'}
                      </span>
                      <span className="font-semibold text-sm text-[#f2efe9]">{evt.repository}</span>
                      <span className="text-xs font-mono text-[#8f8a82] bg-[#141517] px-2 py-0.5 rounded border border-[#3c3a37]">
                        {evt.branch}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8f8a82] font-mono">
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
                          className="bg-[#141517]/95 border border-[#3c3a37] rounded p-3 text-xs space-y-2 font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="uppercase text-[10px] font-bold tracking-wider bg-[#3b2222] text-[#f0a8a8] px-1.5 py-0.5 rounded border border-[#5a2c2c]">
                              {d.action}
                            </span>
                            <span className="text-[#f2efe9]">{d.code}</span>
                          </div>

                          {d.location && (
                            <div className="text-[#8f8a82] text-[11px]">
                              <span className="font-sans text-[#736e67]">Target: </span>{d.location}
                            </div>
                          )}

                          {d.remediation && (
                            <div className="text-[#d8d3cb] font-sans bg-[#262422] border border-[#5c5751]/50 p-2.5 rounded mt-2 text-[11px] leading-relaxed">
                              <span className="font-semibold text-[#a49380]">💡 Suggested Migration: </span>
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
        <div className="fixed inset-0 bg-[#0e0e0f]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b1c1e] border border-[#3c3a37] rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#3c3a37] pb-3">
              <h3 className="text-xs font-bold text-[#f2efe9] uppercase tracking-wider">Connect a Repository</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8f8a82] hover:text-[#f2efe9] text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#8f8a82] leading-relaxed">
              Add this workflow to your repository at <code className="text-[#a49380] font-mono">.github/workflows/sentinel.yml</code>. It will guard your PRs and stream audit metrics directly to this dashboard.
            </p>
            <div className="relative">
              <pre className="bg-[#141517] border border-[#3c3a37] rounded p-3.5 text-xs font-mono text-[#c9c5be] overflow-x-auto leading-relaxed">
                {workflowSnippet}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2.5 right-2.5 bg-[#242323] hover:bg-[#302e2e] text-[#f2efe9] border border-[#5c5751]/60 text-xs px-2.5 py-1 rounded transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs bg-[#a49380] hover:bg-[#b8a996] text-[#141517] px-4 py-2 rounded font-medium transition"
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
