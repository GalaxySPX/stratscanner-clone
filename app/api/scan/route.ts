import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Ephemeral memory store (OK for dev; use DB/Redis for production)
const g = global as any;
g._signals = g._signals ?? [] as any[];

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key || key !== process.env.TV_WEBHOOK_KEY) return bad('unauthorized', 401);

  let payload: any;
  try { payload = await req.json(); } catch { return bad('invalid json', 400); }

  if (!payload?.symbol || !payload?.tf || !payload?.time) return bad('missing fields', 400);

  const row = {
    symbol: String(payload.symbol),
    sector: payload.sector ?? 'N/A',
    tf: String(payload.tf),
    pattern: String(payload.pattern ?? 'NA'),
    open: Number(payload.open ?? 0),
    high: Number(payload.high ?? 0),
    low:  Number(payload.low  ?? 0),
    close:Number(payload.close?? 0),
    atr:  Number(payload.atr   ?? 0),
    vol:  Number(payload.volume?? 0),
    time: String(payload.time)
  };

  g._signals.unshift(row);
  if (g._signals.length > 1000) g._signals.length = 1000;

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const rows = (global as any)._signals ?? [];
  return NextResponse.json({ rows, asOf: new Date().toISOString() });
}
