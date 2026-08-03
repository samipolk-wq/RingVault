import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { stripe } from '@/lib/stripe';
import { sendUnlockDeliverable, recordEvent } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/**
 * Step 4: the jeweler-ready deliverable, gated by a paid unlock token.
 *
 * Two independent ways an unlock becomes 'paid':
 *   1. The Stripe webhook (authoritative, handles refunds, works while nobody
 *      is looking at the page).
 *   2. The reconciliation below — if the row still says pending, we ask Stripe
 *      directly about the session. This covers the webhook arriving late, and
 *      means the happy path works before a webhook is configured at all.
 *
 * Both go through Stripe's API, so payment is still verified server-side by
 * Stripe itself. Neither trusts anything the browser says.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const db = supabaseServer();
  const { data: unlocks, error } = await db
    .from('unlocks')
    .select('id, design_id, status, stripe_session_id, suitor_email')
    .eq('access_token', token)
    .limit(1);

  if (error || !unlocks || unlocks.length === 0) {
    return NextResponse.json({ error: 'That link is not valid.' }, { status: 404 });
  }

  const unlock = unlocks[0];
  const previewOK = process.env.ALLOW_UNPAID_PREVIEW === 'true';
  let status = unlock.status as string;

  // Reconcile against Stripe when the row is still pending. Refunded rows are
  // left alone: a refund must never be undone by a stale session lookup.
  if (status === 'pending' && unlock.stripe_session_id) {
    try {
      const session = await stripe().checkout.sessions.retrieve(
        unlock.stripe_session_id as string
      );
      if (session.payment_status === 'paid' && session.metadata?.unlock_id === unlock.id) {
        const { data: updated } = await db
          .from('unlocks')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', unlock.id)
          .eq('status', 'pending')          // don't clobber a concurrent webhook
          .select('id');

        status = 'paid';

        // First writer sends the emails, so the webhook and this path can't
        // both notify. The dedupe keys make a double-send impossible anyway.
        if (updated?.length) {
          await sendUnlockDeliverable(unlock.id as string);
          await recordEvent({
            designId: unlock.design_id as string,
            kind: 'unlock_paid',
            actorEmail: (unlock.suitor_email as string) || null,
            dedupeKey: `unlock_paid:${unlock.id}`
          });
        }
      }
    } catch (e) {
      console.error('stripe reconciliation failed:', e);
      // Fall through: still sealed, suitor sees the payment prompt.
    }
  }

  if (status !== 'paid' && !previewOK) {
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

  // Her photo book. Signed URLs are minted here and only here — the bucket is
  // private, so an expired or absent link reveals nothing. Generated after the
  // paid check above, so an unpaid request never produces a usable URL.
  let photos: { url: string; note: string | null }[] = [];
  try {
    const { data: photoRows } = await db
      .from('design_photos')
      .select('storage_path, note, sort_order')
      .eq('design_id', unlock.design_id)
      .order('sort_order', { ascending: true });

    for (const row of photoRows || []) {
      const { data: signed } = await db.storage
        .from('ring-photos')
        .createSignedUrl(row.storage_path as string, 60 * 60 * 24 * 7);
      if (signed?.signedUrl) {
        photos.push({ url: signed.signedUrl, note: (row.note as string) || null });
      }
    }
  } catch (e) {
    console.error('photo signing failed:', e);
    // The specification is the deliverable; photos are a bonus. Never fail the
    // whole page because storage had a bad moment.
  }

  return NextResponse.json({
    photos,
    paid: status === 'paid' || previewOK,
    name: d.full_name,
    selections: d.selections,
    note: d.note,
    depositedAt: d.created_at
  });
}
