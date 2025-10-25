import { NextResponse } from 'next/server';
import type { ScanResponse, ScanRow, Timeframe, StratPattern } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const SECTORS = ['Tech','Energy','Financials','Healthcare','Industrials'];
const PATTERNS: StratPattern[] =
 ['1','2U','2D','3','2-2U','2-2D','3-2U','3-2D','2-1-2U','2-1-2D','1-2U-2U','1-2D-2D'];
const TFS: Timeframe[] = ['D','60','30','15','5'];

function rand(min:number,max:number){return Math.round((Math.random()*(max-min)+min)*100)/100}
function pick<T>(arr:T[]):T{return arr[Math.floor(Math.random()*arr.length)]}
function genSymbol(){
  const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({length: 3+Math.floor(Math.random()*2)},()=>a[Math.floor(Math.random()*a.length)]).join('');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { timeframes = TFS, minPrice=1, maxPrice=500, minVol=200000, sector, pattern } = body ?? {};
    const rows: ScanRow[] = Array.from({length: 120}).map(()=> {
      const o = rand(minPrice, maxPrice), h = o + rand(0,5), l = Math.max(0, o - rand(0,5)), c = rand(l,h);
      return {
        symbol: genSymbol(), sector: sector || pick(SECTORS),
        tf: pick(timeframes),
        pattern: (pattern && pattern !== 'any') ? pattern : pick(PATTERNS),
        open: o, high: h, low: l, close: c, atr: rand(0.2, 8),
        vol: Math.max(minVol, Math.floor(Math.random()*5_000_000)),
      };
    });
    const resp: ScanResponse = { rows, asOf: new Date().toISOString() };
    return new NextResponse(JSON.stringify(resp), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store, no-cache, must-revalidate, max-age=0' }
    });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
