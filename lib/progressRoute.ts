import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const STEPS = new Set(['stoneType','stoneShape','photoBook','stoneQuality','stoneSize','style','band','setting','inscription','proposal','review','saved']);
export async function POST(req: Request) {
  const reply = (status: number) => new NextResponse(null, {status, headers:{'Cache-Control':'no-store'}});
  const publicUrl = (process.env.CONTEXT === 'deploy-preview' ? process.env.DEPLOY_PRIME_URL : undefined)
    || process.env.NEXT_PUBLIC_SITE_URL || req.url;
  if (req.headers.get('origin') !== new URL(publicUrl).origin) return reply(403);
  // Bound streamed bytes too: Content-Length is not trusted.
  let raw = '';
  const reader = req.body?.getReader();
  if (!reader) return reply(400);
  try {
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512) { await reader.cancel(); return reply(413); }
      raw += decoder.decode(value, {stream:true});
    }
    raw += decoder.decode();
    const body = JSON.parse(raw);
    if (!body || Object.keys(body).sort().join(',') !== 'session,step' ||
        typeof body.session !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.session) ||
        typeof body.step !== 'string' || !STEPS.has(body.step)) return reply(400);
    const {data,error} = await supabaseServer().rpc('record_flow_progress', {
      p_session: body.session, p_step: body.step,
      p_environment: process.env.CONTEXT === 'production' ? 'production' : 'preview'
    });
    return reply(error ? 503 : data ? 204 : 429);
  } catch { return reply(400); }
}
