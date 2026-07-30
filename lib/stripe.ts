import Stripe from 'stripe';

/**
 * Server-only Stripe client. Never import from a client component.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * The unlock price, in cents. One source of truth for the UI, the Checkout
 * Session, and the stored unlock amount, so they can never drift apart.
 *
 * $49.99 is the default in code rather than only in the environment: if the
 * env var is missing or malformed on a deploy, the site falls back to the real
 * price instead of quietly charging something else.
 */
const DEFAULT_UNLOCK_PRICE_CENTS = 4999;

export function unlockPriceCents(): number {
  const raw = process.env.NEXT_PUBLIC_UNLOCK_PRICE_CENTS;
  if (raw === undefined || raw === '') return DEFAULT_UNLOCK_PRICE_CENTS;
  const v = Number(raw);
  return Number.isInteger(v) && v >= 50 && v <= 50000 ? v : DEFAULT_UNLOCK_PRICE_CENTS;
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Site origin for Stripe redirect URLs. */
export function siteOrigin(reqOrigin?: string | null): string {
  return process.env.NEXT_PUBLIC_SITE_URL || reqOrigin || 'http://localhost:3000';
}
