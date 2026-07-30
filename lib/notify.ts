import { supabaseServer } from '@/lib/supabaseServer';
import { sendEmail } from '@/lib/email';
import { buildEmail } from '@/lib/emails/templates';
import { siteOrigin, unlockPriceCents, formatPrice } from '@/lib/stripe';
import { nameKey } from '@/lib/verify';

/**
 * The notification process.
 *
 * Two stages, always: record what happened, then decide who hears about it.
 * Recording is unconditional (she can always see her own vault activity);
 * emailing is gated by the preference she set when she deposited.
 *
 * Delivery uses an outbox: queue first, then send. A dead email provider can
 * never fail a Stripe webhook or lose a payment, and a webhook replay can
 * never send the same message twice (dedupe_key is uniquely indexed).
 */

export type EventKind = 'verify_failed' | 'verify_passed' | 'unlock_paid' | 'unlock_refunded';
export type NotifyMode = 'everything' | 'discreet' | 'nothing';

/**
 * Which events reach her, per mode.
 *  everything — all of it, names included.
 *  discreet   — only what touches her privacy. A stranger failing her
 *               questions is a security signal; an unlock is a spoiler.
 *  nothing    — silence.
 */
const REACHES_HER: Record<NotifyMode, EventKind[]> = {
  everything: ['verify_failed', 'verify_passed', 'unlock_paid'],
  discreet: ['verify_failed'],
  nothing: []
};

function origin(): string {
  return siteOrigin();
}

/** A magic link into her vault, so email links need no password. */
async function vaultUrl(email: string): Promise<string> {
  const fallback = `${origin()}/enter`;
  try {
    const sb = supabaseServer();
    const { data, error } = await sb.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin()}/vault` }
    });
    if (error || !data?.properties?.action_link) return fallback;
    return data.properties.action_link;
  } catch {
    return fallback;
  }
}

/** Queue one email. Returns the row id, or null if it was a duplicate. */
export async function queue(opts: {
  template: string;
  toEmail: string;
  payload?: Record<string, unknown>;
  designId?: string | null;
  unlockId?: string | null;
  leadId?: string | null;
  dedupeKey?: string;
}): Promise<string | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('notifications')
    .insert({
      template: opts.template,
      to_email: opts.toEmail.trim().toLowerCase(),
      payload: opts.payload || {},
      design_id: opts.designId || null,
      unlock_id: opts.unlockId || null,
      lead_id: opts.leadId || null,
      dedupe_key: opts.dedupeKey || null
    })
    .select('id')
    .single();

  if (error) {
    // 23505 = unique violation on dedupe_key: already queued, nothing to do.
    if ((error as { code?: string }).code === '23505') return null;
    throw error;
  }
  return data?.id ?? null;
}

/** Attempt delivery of a single queued row. Never throws. */
export async function deliver(id: string): Promise<void> {
  const sb = supabaseServer();
  try {
    const { data: row } = await sb
      .from('notifications')
      .select('id, template, to_email, payload, status, attempts')
      .eq('id', id)
      .single();
    if (!row || row.status !== 'pending') return;

    const built = buildEmail(row.template as string, {
      ...(row.payload as Record<string, unknown>),
      toEmail: row.to_email
    });
    if (!built) {
      await sb
        .from('notifications')
        .update({ status: 'failed', last_error: `unknown template: ${row.template}` })
        .eq('id', id);
      return;
    }

    const res = await sendEmail({
      to: row.to_email as string,
      subject: built.subject,
      html: built.html,
      text: built.text
    });

    const attempts = (row.attempts as number) + 1;
    if (res.ok) {
      await sb
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString(), attempts })
        .eq('id', id);
    } else {
      await sb
        .from('notifications')
        .update({
          status: attempts >= 5 ? 'failed' : 'pending',
          attempts,
          last_error: res.error
        })
        .eq('id', id);
    }
  } catch (e) {
    console.error('deliver', id, e);
  }
}

/** Queue then immediately attempt delivery, without ever throwing upward. */
export async function queueAndSend(opts: Parameters<typeof queue>[0]): Promise<void> {
  try {
    const id = await queue(opts);
    if (id) await deliver(id);
  } catch (e) {
    console.error('queueAndSend', opts.template, e);
  }
}

/**
 * Record a vault event and notify her if her preference allows it.
 * Call this from the suitor routes and the Stripe webhook.
 */
export async function recordEvent(opts: {
  designId: string;
  kind: EventKind;
  actorName?: string | null;
  actorEmail?: string | null;
  dedupeKey?: string;
}): Promise<void> {
  const sb = supabaseServer();

  try {
    await sb.from('vault_events').insert({
      design_id: opts.designId,
      kind: opts.kind,
      actor_name: opts.actorName || null,
      actor_email: opts.actorEmail || null
    });
  } catch (e) {
    console.error('recordEvent insert', e);
  }

  try {
    const { data: design } = await sb
      .from('designs')
      .select('email, notify_mode')
      .eq('id', opts.designId)
      .single();
    if (!design?.email) return;

    const mode = ((design.notify_mode as NotifyMode) || 'discreet');
    if (!REACHES_HER[mode]?.includes(opts.kind)) return;

    await queueAndSend({
      template: opts.kind,
      toEmail: design.email as string,
      designId: opts.designId,
      dedupeKey: opts.dedupeKey,
      payload: {
        actorName: opts.actorName || null,
        actorEmail: opts.actorEmail || null,
        vaultUrl: await vaultUrl(design.email as string)
      }
    });
  } catch (e) {
    console.error('recordEvent notify', e);
  }
}

/** To her, on deposit. Transactional — carries the link back into her vault. */
export async function sendDepositConfirmation(designId: string, email: string): Promise<void> {
  await queueAndSend({
    template: 'deposit_confirmed',
    toEmail: email,
    designId,
    dedupeKey: `deposit:${designId}`,
    payload: { vaultUrl: await vaultUrl(email) }
  });
}

/** To the suitor, on payment. Transactional — his permanent copy. */
export async function sendUnlockDeliverable(unlockId: string): Promise<void> {
  const sb = supabaseServer();
  const { data: unlock } = await sb
    .from('unlocks')
    .select('id, suitor_email, access_token, amount_cents, design_id')
    .eq('id', unlockId)
    .single();
  if (!unlock) return;

  const { data: design } = await sb
    .from('designs')
    .select('full_name')
    .eq('id', unlock.design_id)
    .single();

  const herFirstName = String(design?.full_name || '').trim().split(/\s+/)[0] || 'Her';

  await queueAndSend({
    template: 'unlock_deliverable',
    toEmail: unlock.suitor_email as string,
    designId: unlock.design_id as string,
    unlockId: unlock.id as string,
    dedupeKey: `deliverable:${unlock.id}`,
    payload: {
      herFirstName,
      unlockUrl: `${origin()}/deliverable?token=${unlock.access_token}`,
      priceLabel: formatPrice((unlock.amount_cents as number) || unlockPriceCents())
    }
  });
}

/**
 * The growth loop: when she becomes discoverable, tell the suitors who
 * searched her name too early and asked to be told. Fires once per lead,
 * and only if she left lead alerts on.
 */
export async function notifyWaitingLeads(designId: string): Promise<number> {
  const sb = supabaseServer();

  const { data: design } = await sb
    .from('designs')
    .select('full_name, name_key, discoverable, allow_lead_alerts')
    .eq('id', designId)
    .single();
  if (!design?.discoverable || !design.allow_lead_alerts || !design.name_key) return 0;

  const key = design.name_key as string;
  const { data: leads } = await sb
    .from('suitor_leads')
    .select('id, suitor_email, searched_name, searched_name_key')
    .eq('searched_name_key', key)
    .eq('prompt_choice', 'advertise')
    .is('notified_at', null)
    .not('suitor_email', 'is', null)
    .limit(25);

  if (!leads?.length) return 0;

  let sent = 0;
  for (const lead of leads) {
    await queueAndSend({
      template: 'lead_she_deposited',
      toEmail: lead.suitor_email as string,
      designId,
      leadId: lead.id as string,
      dedupeKey: `lead:${lead.id}`,
      payload: {
        searchedName: lead.searched_name || design.full_name,
        suitorUrl: `${origin()}/suitors`
      }
    });
    await sb.from('suitor_leads').update({ notified_at: new Date().toISOString() }).eq('id', lead.id);
    sent += 1;
  }
  return sent;
}

/** Retry queue — drained on a schedule. */
export async function drainPending(limit = 25): Promise<{ attempted: number }> {
  const sb = supabaseServer();
  const { data: rows } = await sb
    .from('notifications')
    .select('id')
    .eq('status', 'pending')
    .lt('attempts', 5)
    .order('created_at', { ascending: true })
    .limit(limit);

  for (const r of rows || []) await deliver(r.id as string);
  return { attempted: rows?.length || 0 };
}

export { nameKey };
