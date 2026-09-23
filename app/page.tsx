'use client';

import { useEffect, useState } from 'react';

interface SentinelEvent {
  id: string;
  repository: string;
  branch: string;
  commitSha: string;
  prNumber: number | null;
  breaking: boolean;
  breakingCount: number;
  differences: Array<{ action: string; code: string; location?: string }>;
  receivedAt: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<SentinelEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/v1/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalRuns = events.length;
  const breakingAlerts = events.filter((e) => e.breaking).length;
  const passingRuns = totalRuns - breakingAlerts;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight">API Drift Sentinel Cloud</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">Cross-repo OpenAPI contract governance & drift telemetry</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono text-slate-400">
            <span>Key:</span>
            <span className="text-emerald-400 font-semibold">sentinel_live_secret123</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-xs uppercase font-medium text-slate-400">Total Checks</div>
            <div className="text-3xl font-bold mt-2 text-white">{totalRuns}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-xs uppercase font-medium text-emerald-400">Contracts Passing</div>
            <div className="text-3xl font-bold mt-2 text-emerald-400">{passingRuns}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-xs uppercase font-medium text-red-400">Breaking Changes Blocked</div>
            <div className="text-3xl font-bold mt-2 text-red-400">{breakingAlerts}</div>
          </div>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-sm tracking-wide">Live Contract Event Stream</h2>
            <span className="text-xs text-slate-500 font-mono">Polls every 3s</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading telemetry...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-base font-medium text-slate-300 mb-1">No telemetry events yet</p>
              <p className="text-xs">Post an event or trigger the GitHub Action with your token to see live data.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {events.map((evt) => (
                <div key={evt.id} className="p-6 hover:bg-slate-850/50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold font-mono ${
                          evt.breaking
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {evt.breaking ? 'BREAKING DRIFT' : 'CONTRACT VALID'}
                      </span>
                      <span className="font-semibold text-sm">{evt.repository}</span>
                      {evt.prNumber && (
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          PR #{evt.prNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(evt.receivedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono mb-2">
                    Ref: {evt.branch} | SHA: {evt.commitSha.substring(0, 7)}
                  </div>

                  {evt.breaking && evt.differences.length > 0 && (
                    <div className="mt-3 bg-slate-950/80 rounded-lg p-3 border border-red-950/40">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800 text-left">
                            <th className="pb-1">Action</th>
                            <th className="pb-1">Code</th>
                            <th className="pb-1">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {evt.differences.map((diff, i) => (
                            <tr key={i} className="text-slate-300">
                              <td className="py-1 text-red-400 font-bold uppercase">{diff.action}</td>
                              <td className="py-1">{diff.code}</td>
                              <td className="py-1 text-slate-400">{diff.location || 'root'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
