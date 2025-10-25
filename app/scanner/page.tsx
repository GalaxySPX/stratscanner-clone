'use client';
import { useRef, useState } from 'react';
import type { ScanFilters, ScanResponse, ScanRow, Timeframe, StratPattern } from '@/lib/types';
import { rowsToCSV, downloadCSV } from '@/lib/csv';

const ALL_TF: Timeframe[] = ['M','W','D','60','30','15','5'];
const PATTERNS: StratPattern[] =
 ['1','2U','2D','3','2-2U','2-2D','3-2U','3-2D','2-1-2U','2-1-2D','1-2U-2U','1-2D-2D'];

export default function ScannerPage() {
  const [filters, setFilters] = useState<ScanFilters>({ timeframes: ['D','60','30'] });
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [asOf, setAsOf] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const acRef = useRef<AbortController | null>(null);

  const runScan = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (acRef.current) acRef.current.abort();
      acRef.current = new AbortController();
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(filters),
        cache: 'no-store',
        signal: acRef.current.signal,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('Scan failed');
      const data: ScanResponse = await res.json();
      setRows(data.rows);
      setAsOf(data.asOf);
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = () => {
    if (!rows.length) return alert('No rows to export.');
    downloadCSV(rowsToCSV(rows), 'strat-scan');
  };

  return (
    <main className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Strat Scanner</h1>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Timeframes</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_TF.map(tf => (
                <button
                  key={tf}
                  className={`px-2 py-1 rounded-md border border-zinc-700 text-xs ${filters.timeframes.includes(tf) ? 'bg-zinc-800' : ''}`}
                  onClick={() =>
                    setFilters(f => f.timeframes.includes(tf)
                      ? { ...f, timeframes: f.timeframes.filter(x => x !== tf) }
                      : { ...f, timeframes: [...f.timeframes, tf] })
                  }
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Pattern</label>
            <select
              className="select mt-1"
              value={filters.pattern || 'any'}
              onChange={e => setFilters(f => ({ ...f, pattern: e.target.value as any }))}
            >
              <option value="any">Any</option>
              {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Price Range</label>
            <div className="flex gap-2 mt-1">
              <input className="input" placeholder="Min"
                value={filters.minPrice ?? ''} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))} />
              <input className="input" placeholder="Max"
                value={filters.maxPrice ?? ''} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Min Volume</label>
            <input className="input mt-1"
              value={filters.minVol ?? 500000}
              onChange={e => setFilters(f => ({ ...f, minVol: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.includeWicks ?? true}
              onChange={e => setFilters(f => ({ ...f, includeWicks: e.target.checked }))}
            />
            Include Wick Conflicts
          </label>

          <input className="input max-w-xs" placeholder="Sector (optional)"
            value={filters.sector ?? ''} onChange={e => setFilters(f => ({ ...f, sector: e.target.value || undefined }))} />

          <button className="btn" onClick={runScan} disabled={busy}>
            {busy ? 'Scanning…' : 'Scan Now'}
          </button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {/* Results */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-zinc-400">
            Results: <span className="text-zinc-200 font-semibold">{rows.length}</span>
          </div>
          <div className="text-xs text-zinc-500">{asOf && `As of: ${new Date(asOf).toLocaleString()}`}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left border-b border-zinc-800 py-2">Symbol</th>
                <th className="text-left border-b border-zinc-800 py-2">Sector</th>
                <th className="text-left border-b border-zinc-800 py-2">TF</th>
                <th className="text-left border-b border-zinc-800 py-2">Pattern</th>
                <th className="text-left border-b border-zinc-800 py-2">Open</th>
                <th className="text-left border-b border-zinc-800 py-2">High</th>
                <th className="text-left border-b border-zinc-800 py-2">Low</th>
                <th className="text-left border-b border-zinc-800 py-2">Close</th>
                <th className="text-left border-b border-zinc-800 py-2">ATR</th>
                <th className="text-left border-b border-zinc-800 py-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} className="hover:bg-zinc-900/70">
                  <td className="py-2">{r.symbol}</td>
                  <td className="py-2">{r.sector}</td>
                  <td className="py-2">{r.tf}</td>
                  <td className="py-2">{r.pattern}</td>
                  <td className="py-2">{r.open}</td>
                  <td className="py-2">{r.high}</td>
                  <td className="py-2">{r.low}</td>
                  <td className="py-2">{r.close}</td>
                  <td className="py-2">{r.atr}</td>
                  <td className="py-2">{r.vol.toLocaleString()}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="py-6 text-zinc-500" colSpan={10}>No data yet — set filters and click “Scan Now”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
