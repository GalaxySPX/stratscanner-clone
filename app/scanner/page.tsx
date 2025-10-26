'use client';
import { useState } from 'react';
import type { ScanRow, ScanResponse } from '@/lib/types';
import { rowsToCSV, downloadCSV } from '@/lib/csv';

export default function ScannerPage() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [asOf, setAsOf] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // ---- Run the mock scan (your existing /api/scan endpoint)
  const runScan = async () => {
    try {
      setBusy(true);
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timeframes: ['D','60','30'] }),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Scan failed');
      const data: ScanResponse = await res.json();
      setRows(data.rows || []);
      setAsOf(data.asOf || '');
    } catch (e) {
      alert('Scan failed. Check /api/scan.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Pull latest TradingView webhook signals from /api/tv (GET)
  const loadSignals = async () => {
    const res = await fetch('/api/tv', { cache: 'no-store' });
    if (!res.ok) { alert('Failed to load alerts'); return; }
    const data = await res.json();
    setRows(data.rows || []);
    setAsOf(data.asOf || '');
  };

  // ---- Export current table to CSV
  const exportCSV = () => {
    if (!rows.length) { alert('No rows to export.'); return; }
    downloadCSV(rowsToCSV(rows), 'strat-scan');
  };

  // ---- UI
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Strat Scanner</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-900"
            onClick={runScan}
            disabled={busy}
          >
            {busy ? 'Scanning…' : 'Scan Now'}
          </button>

          <button
            className="px-4 py-2 rounded-md border border-green-700 bg-green-950 text-green-400 font-bold"
            onClick={loadSignals}
          >
            ▶ Load Signals (TV)
          </button>

          <button
            className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-900"
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </div>

        <div className="text-sm text-zinc-400">
          {asOf && <>Last updated: {new Date(asOf).toLocaleString()}</>}
        </div>

        <div className="overflow-x-auto border border-zinc-800 rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-zinc-900/70 text-zinc-300">
              <tr>
                <th className="py-2 px-3 text-left">Symbol</th>
                <th className="py-2 px-3 text-left">Sector</th>
                <th className="py-2 px-3 text-left">TF</th>
                <th className="py-2 px-3 text-left">Pattern</th>
                <th className="py-2 px-3 text-left">Open</th>
                <th className="py-2 px-3 text-left">High</th>
                <th className="py-2 px-3 text-left">Low</th>
                <th className="py-2 px-3 text-left">Close</th>
                <th className="py-2 px-3 text-left">ATR</th>
                <th className="py-2 px-3 text-left">Volume</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-zinc-900/70">
                  <td className="py-2 px-3">{r.symbol}</td>
                  <td className="py-2 px-3">{r.sector}</td>
                  <td className="py-2 px-3">{r.tf}</td>
                  <td className="py-2 px-3">{r.pattern}</td>
                  <td className="py-2 px-3">{r.open}</td>
                  <td className="py-2 px-3">{r.high}</td>
                  <td className="py-2 px-3">{r.low}</td>
                  <td className="py-2 px-3">{r.close}</td>
                  <td className="py-2 px-3">{r.atr}</td>
                  <td className="py-2 px-3">{(r as any).vol?.toLocaleString?.() ?? (r as any).vol}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="py-6 text-zinc-500 text-center" colSpan={10}>
                    No data yet — click <b>“Load Signals (TV)”</b> or “Scan Now”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
