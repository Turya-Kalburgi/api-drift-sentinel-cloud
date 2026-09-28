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
    <main className="min-h-screen bg-[#060607] text-[#D1D1D6] font-sans antialiased relative selection:bg-white/10 selection:text-white">
      {/* Editorial Starlight Ambient Top Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 35% at 50% -10%, rgba(220, 220, 235, 0.18), transparent 70%),
            radial-gradient(circle 1px at 20% 30%, rgba(255,255,255,0.4), transparent),
            radial-gradient(circle 1px at 80% 20%, rgba(255,255,255,0.3), transparent),
            radial-gradient(circle 1px at 50% 60%, rgba(255,255,255,0.25), transparent)
          `
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-14 space-y-12 z-10">
        
        {/* Header with Editorial Typography */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#9A9A9E] uppercase">
                SYSTEM AUDIT · v1.2
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white italic">
              API Drift <span className="not-italic font-sans font-light tracking-wide text-[#E5E5EA]">Sentinel</span>
            </h1>
            <p className="text-xs font-mono text-[#8E8E93] max-w-lg leading-relaxed tracking-tight">
              AUTONOMOUS CONTRACT RECONCILIATION · BREAKING DRIFT SUPPRESSION · NON-DESTRUCTIVE REMEDIATION
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-mono uppercase tracking-widest bg-gradient-to-b from-[#FFFFFF] to-[#C7C7CC] hover:from-[#F2F2F7] hover:to-[#AEAEB2] text-[#000000] px-5 py-2.5 rounded shadow-lg shadow-white/5 font-semibold transition active:scale-95"
            >
              Connect Repo
            </button>
            <button
              onClick={fetchEvents}
              className="text-xs font-mono tracking-wider bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[#AEAEB2] px-4 py-2.5 rounded transition"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Minimalist Silver-Tiered Metric Strips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
          <div className="bg-[#09090b] p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E8E93]">Total Audits</span>
            <div className="text-3xl font-light font-sans text-white tracking-tight">{stats.total}</div>
          </div>
          <div className="bg-[#09090b] p-5 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/80 to-transparent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400/80">Drifts Blocked</span>
            <div className="text-3xl font-light font-sans text-white tracking-tight">{stats.breaking}</div>
          </div>
          <div className="bg-[#09090b] p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C7C7CC]">Remediations</span>
            <div className="text-3xl font-light font-sans text-[#E5E5EA] tracking-tight">{stats.totalRemediations}</div>
          </div>
          <div className="bg-[#09090b] p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E8E93]">Monitored Services</span>
            <div className="text-3xl font-light font-sans text-white tracking-tight">{stats.uniqueRepos}</div>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-1">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search repository or ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 text-xs font-mono text-[#F2F2F7] placeholder-[#636366] rounded px-3.5 py-2.5 focus:outline-none focus:border-white/30 transition"
            />
          </div>
          <button
            onClick={() => setFilterBreakingOnly(!filterBreakingOnly)}
            className={`text-xs font-mono tracking-wider uppercase px-4 py-2.5 rounded border transition ${
              filterBreakingOnly
                ? 'bg-red-950/40 border-red-500/40 text-red-300'
                : 'bg-white/[0.02] border-white/10 text-[#8E8E93] hover:text-white'
            }`}
          >
            {filterBreakingOnly ? '• Breaking Only' : '• All Activity'}
          </button>
        </div>

        {/* Incident Stream */}
        <section className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em] text-[#636366]">
            <span>Audit Journal</span>
            <span>{filteredEvents.length} Entries</span>
          </div>

          {loading ? (
            <div className="text-center py-20 text-xs font-mono text-[#636366]">
              SYNCHRONIZING AUDIT REGISTRY...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-16 border border-white/10 rounded-lg text-center text-xs font-mono text-[#636366]">
              NO CORRESPONDING INCIDENTS RECORDED
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-[#0A0A0C] border border-white/10 rounded-lg p-6 space-y-4 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span
                        className={`text-[9px] font-mono font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded border ${
                          evt.breaking
                            ? 'bg-red-950/30 border-red-500/30 text-red-400'
                            : 'bg-white/[0.04] border-white/10 text-[#C7C7CC]'
                        }`}
                      >
                        {evt.breaking ? 'BREAKING' : 'VALIDATED'}
                      </span>
                      <span className="font-sans font-medium text-sm text-[#F2F2F7]">
                        {evt.repository}
                      </span>
                      <span className="text-xs font-mono text-[#636366]">
                        {evt.branch}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#636366] flex items-center gap-3">
                      <span>PR #{evt.prNumber || '—'}</span>
                      <span>·</span>
                      <span>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {evt.differences && evt.differences.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {evt.differences.map((d, idx) => (
                        <div
                          key={idx}
                          className="bg-black/50 border border-white/[0.06] rounded p-4 text-xs space-y-2 font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] uppercase tracking-widest text-red-400/90 font-bold">
                              [{d.action}]
                            </span>
                            <span className="text-[#E5E5EA]">{d.code}</span>
                          </div>

                          {d.location && (
                            <div className="text-[#8E8E93] text-[11px]">
                              <span className="text-[#636366]">TARGET: </span>
                              {d.location}
                            </div>
                          )}

                          {d.remediation && (
                            <div className="bg-white/[0.03] border-l-2 border-[#C7C7CC] p-3 rounded-r mt-3 text-xs leading-relaxed font-sans text-[#D1D1D6]">
                              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#AEAEB2] block mb-1">
                                Safe Deprecation Guidance
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

      {/* Connect Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B0B0E] border border-white/20 rounded-lg max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white font-bold">
                Deploy Governance Pipeline
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8E8E93] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-sans text-[#AEAEB2] leading-relaxed">
              Drop this workflow definition into <code className="text-white font-mono">.github/workflows/sentinel.yml</code> to guard your pull requests and broadcast audit telemetry.
            </p>
            <div className="relative">
              <pre className="bg-black border border-white/10 rounded p-4 text-xs font-mono text-[#D1D1D6] overflow-x-auto leading-relaxed">
                {workflowSnippet}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono px-3 py-1.5 rounded transition"
              >
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs font-mono uppercase tracking-widest bg-white text-black font-bold px-5 py-2.5 rounded transition"
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
