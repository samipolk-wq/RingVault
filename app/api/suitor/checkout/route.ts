import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { stripe, unlockPriceCents, siteOrigin, formatPrice } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * Step 3: take the money.
 *
 * Fits the existing flow exactly: /api/suitor/verify already creates the
 * pending unlock row and hands its access_token to the browser, so checkout
 * takes that token and nothing else. No new identifiers, no second lookup key.
 *
 * The token alone is not access — /api/suitor/deliverable still refuses to
 * release anything until status is 'paid', and only the Stripe webhook can set
 * that. So a suitor holding a token before paying has exactly nothing.
 */
export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = (body.token || '').trim();
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const db = supabaseServer();

  const { data: unlocks, error } = await db
    .from('unlocks')
    .select('id, design_id, suitor_email, status')
    .eq('access_token', token)
    .limit(1);

  if (error || !unlocks || unlocks.length === 0) {
    return NextResponse.json({ error: 'That link is not valid.' }, { status: 404 });
  }

  const unlock = unlocks[0];

  // Already paid: send them straight to what they bought rather than charging twice.
  if (unlock.status === 'paid') {
    return NextResponse.json({ alreadyPaid: true, url: `/deliverable?token=${token}` });
  }
  if (unlock.status === 'refunded') {
    return NextResponse.json({ error: 'This unlock was refunded.' }, { status: 409 });
  }

  const { data: designs } = await db
    .from('designs')
    .select('full_name')
    .eq('id', unlock.design_id)
    .limit(1);
  const firstName = String(designs?.[0]?.full_name || '').trim().split(/\s+/)[0] || 'their';

  const amount = unlockPriceCents();
  const origin = siteOrigin(req.headers.get('origin'));

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      ...(unlock.suitor_email ? { customer_email: unlock.suitor_email as string } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: 'The Ring Vault — Their Perfect Ring',
              description: `${firstName}'s complete ring design: stone, cut, band, setting, inscription, their note to you, and a jeweler-ready document.`
            }
          }
        }
      ],
      metadata: { unlock_id: unlock.id as string, access_token: token },
      success_url: `${origin}/deliverable?token=${token}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/suitors?canceled=1`
    });

    // Record the intended amount and session so the webhook and any later
    // reconciliation agree on what was owed.
    await db
      .from('unlocks')
      .update({ amount_cents: amount, stripe_session_id: session.id })
      .eq('id', unlock.id);

    return NextResponse.json({ url: session.url, price: formatPrice(amount) });
  } catch (e) {
    console.error('checkout failed:', e);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
