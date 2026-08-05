import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = new Set(['share_hint', 'share_friend']);

/**
 * POST { designId, kind }
 *
 * Records that she chose to share, so you can measure which of the two share
 * intentions people actually use — asking a friend to hint, or simply passing
 * the site on. Recorded into vault_events, which already exists.
 *
 * Deliberately does not notify her, and never appears in her activity feed as
 * something that happened *to* her: this is her own action.
 */
export async function POST(req: Request) {
  let body: { designId?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const designId = body.designId || '';
  const kind = body.kind || '';
  if (!UUID_RE.test(designId) || !KINDS.has(kind)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const db = supabaseServer();
    await db.from('vault_events').insert({ design_id: designId, kind });
  } catch (e) {
    // Analytics must never break the confirmation screen.
    console.error('share record failed:', e);
  }

  return NextResponse.json({ ok: true });
}
