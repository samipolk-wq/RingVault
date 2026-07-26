import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Step 4: the jeweler-ready deliverable, gated by a paid unlock token.
 * Until Stripe is wired, set ALLOW_UNPAID_PREVIEW=true in Netlify to preview
 * the flow end-to-end without taking money.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const db = supabaseServer();
  const { data: unlocks, error } = await db
    .from('unlocks')
    .select('id, design_id, status')
    .eq('access_token', token)
    .limit(1);

  if (error || !unlocks || unlocks.length === 0) {
    return NextResponse.json({ error: 'That link is not valid.' }, { status: 404 });
  }

  const unlock = unlocks[0];
  const previewOK = process.env.ALLOW_UNPAID_PREVIEW === 'true';
  if (unlock.status !== 'paid' && !previewOK) {
    return NextResponse.json({ error: 'payment_required', paid: false }, { status: 402 });
  }

  const { data: designs } = await db
    .from('designs')
    .select('full_name, selections, note, created_at')
    .eq('id', unlock.design_id)
    .limit(1);

  if (!designs || designs.length === 0) {
    return NextResponse.json({ error: 'That vault could not be found.' }, { status: 404 });
  }

  const d = designs[0];
  return NextResponse.json({
    paid: unlock.status === 'paid' || previewOK,
    name: d.full_name,
    selections: d.selections,
    note: d.note,
    depositedAt: d.created_at
  });
}
