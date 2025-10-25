import type { ScanRow } from '@/lib/types';

function escapeCSV(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

export function rowsToCSV(rows: ScanRow[]): string {
  const header = ['Symbol','Sector','Timeframe','Pattern','Open','High','Low','Close','ATR','Volume'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      escapeCSV(r.symbol), escapeCSV(r.sector), escapeCSV(r.tf), escapeCSV(r.pattern),
      escapeCSV(r.open), escapeCSV(r.high), escapeCSV(r.low), escapeCSV(r.close),
      escapeCSV(r.atr), escapeCSV(r.vol)
    ].join(','));
  }
  return '\uFEFF' + lines.join('\r\n'); // Excel-friendly
}

export function downloadCSV(csv: string, baseName='strat-scan') {
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const filename = `${baseName}-${ts}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
