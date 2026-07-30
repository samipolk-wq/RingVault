import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordEvent, sendUnlockDeliverable } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/**
 * The only thing in the system allowed to mark an unlock 'paid'.
 *
 * Signature-verified against STRIPE_WEBHOOK_SECRET, so nobody can unlock a
 * vault by posting a fake event at this endpoint.
 *
 * Stripe dashboard → Developers → Webhooks → Add endpoint:
 *   https://<your-site>/api/stripe/webhook
 *   events: checkout.session.completed,
 *           checkout.session.async_payment_succeeded,
 *           charge.refunded
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  const payload = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, sig || '', secret);
  } catch (e) {
    console.error('webhook signature verification failed:', e);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const db = supabaseServer();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const unlockId = session.metadata?.unlock_id;
        if (session.payment_status !== 'paid' || !unlockId) break;

        const { data: updated } = await db
          .from('unlocks')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id
          })
          .eq('id', unlockId)
          .neq('status', 'refunded')
          .select('id, design_id, suitor_email');

        if (updated?.length) {
          // His deliverable link always. Her alert only if she asked for it.
          // Both deduped, so a Stripe replay cannot double-send.
          await sendUnlockDeliverable(unlockId);
          await recordEvent({
            designId: updated[0].design_id as string,
            kind: 'unlock_paid',
            actorEmail: (updated[0].suitor_email as string) || null,
            dedupeKey: `unlock_paid:${unlockId}`
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const pi =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!pi) break;

        const sessions = await stripe().checkout.sessions.list({ payment_intent: pi, limit: 1 });
        const unlockId = sessions.data[0]?.metadata?.unlock_id;
        if (!unlockId) break;

        // Re-seal the vault. /api/suitor/deliverable stops serving immediately.
        const { data: refunded } = await db
          .from('unlocks')
          .update({ status: 'refunded' })
          .eq('id', unlockId)
          .select('design_id');

        if (refunded?.length) {
          await recordEvent({
            designId: refunded[0].design_id as string,
            kind: 'unlock_refunded',
            dedupeKey: `unlock_refunded:${unlockId}`
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('webhook handler failed:', e);
    // 500 so Stripe retries — every update above is idempotent.
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }
}
