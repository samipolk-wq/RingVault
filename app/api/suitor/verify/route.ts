import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashAnswer, hashesMatch } from '@/lib/verify';
import { recordEvent } from '@/lib/notify';
import { normalizeAnswer } from '@/lib/verify';

/**
 * Step 2: confirm he knows her. Answers are hashed and compared against the
 * hashes she stored — the plain answers never touch our database.
 * On success we create a pending unlock and return its token; the deliverable
 * stays sealed until that unlock is marked paid.
 *
 * Rate limited. Her questions are low-entropy by design — a date of birth is
 * roughly 36,000 possibilities — so without a cap the answers are guessable by
 * anyone patient enough to script it. Failures are counted per vault, per
 * suitor email and per IP, over a rolling 24 hours.
 */
const MAX_FAILURES_PER_DAY = 5;
export async function POST(req: Request) {
  let body: {
    designId?: string;
    suitorEmail?: string;
    suitorName?: string;
    dob?: string;
    middle?: string;
    school?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const designId = (body.designId || '').trim();
  const suitorEmail = (body.suitorEmail || '').trim().toLowerCase();
  if (!designId) return NextResponse.json({ error: 'Missing design' }, { status: 400 });

  const db = supabaseServer();
  const ip = (req.headers.get('x-nf-client-connection-ip') ||
              (req.headers.get('x-forwarded-for') || '').split(',')[0] || '').trim() || null;

  // --- rate limit: count recent FAILURES only, so a legitimate suitor who
  // --- succeeds is never penalised for a typo earlier in the evening.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  {
    const ors = [`suitor_email.eq.${suitorEmail}`];
    if (ip) ors.push(`ip.eq.${ip}`);
    const { count } = await db
      .from('verify_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('design_id', designId)
      .eq('success', false)
      .gte('created_at', since)
      .or(ors.join(','));

    if ((count || 0) >= MAX_FAILURES_PER_DAY) {
      // Deliberately does not say how many attempts remain or when the window
      // resets — that information only helps someone scripting this.
      return NextResponse.json(
        {
          verified: false,
          rateLimited: true,
          message: 'Too many attempts on this vault. Please try again tomorrow.'
        },
        { status: 429 }
      );
    }
  }

  const { data, error } = await db
    .from('designs')
    .select('id, verify_dob_hash, verify_middle_hash, verify_school_hash, blocked_names, full_name')
    .eq('id', designId)
    .eq('discoverable', true)
    .limit(1);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'That vault could not be found.' }, { status: 404 });
  }

  const row = data[0];

  // Her block list, checked here rather than at search time — search doesn't
  // know who is asking, only who is being looked for. A blocked suitor gets
  // exactly the same response as a wrong answer, so the block never announces
  // itself.
  const blocked: string[] = ((row.blocked_names as string[]) || [])
    .map((n) => normalizeAnswer(n))
    .filter(Boolean);
  const suitorKeys = [
    normalizeAnswer((body.suitorName as string) || ''),
    normalizeAnswer(suitorEmail.split('@')[0] || '')
  ].filter(Boolean);
  const isBlocked = blocked.length > 0 && suitorKeys.some((k) => blocked.includes(k));

  // Every question she enabled must match. All-or-nothing: no partial credit.
  const checks: boolean[] = [];
  if (row.verify_dob_hash) checks.push(hashesMatch(hashAnswer(body.dob || ''), row.verify_dob_hash));
  if (row.verify_middle_hash) checks.push(hashesMatch(hashAnswer(body.middle || ''), row.verify_middle_hash));
  if (row.verify_school_hash) checks.push(hashesMatch(hashAnswer(body.school || ''), row.verify_school_hash));

  if (isBlocked || checks.length === 0 || checks.some((ok) => !ok)) {
    await db.from('verify_attempts').insert({
      design_id: designId,
      suitor_email: suitorEmail || null,
      ip,
      success: false
    });
    // Tell her someone tried, if she asked to be told. Fire-and-forget so a
    // mail problem can never turn a failed guess into a 500.
    void recordEvent({ designId, kind: 'verify_failed', actorEmail: suitorEmail || null });
    // Vague on purpose: never reveal which answer was wrong — or that she
    // blocked this person.
    return NextResponse.json({ verified: false }, { status: 200 });
  }

  const { data: unlock, error: insErr } = await db
    .from('unlocks')
    .insert({ design_id: designId, suitor_email: suitorEmail, status: 'pending' })
    .select('access_token')
    .limit(1);

  if (insErr || !unlock || !unlock.length) {
    console.error('unlock insert failed:', insErr?.message);
    return NextResponse.json({ error: 'Could not begin the unlock.' }, { status: 500 });
  }

  await db.from('verify_attempts').insert({
    design_id: designId,
    suitor_email: suitorEmail || null,
    ip,
    success: true
  });

  void recordEvent({ designId, kind: 'verify_passed', actorEmail: suitorEmail || null });

  return NextResponse.json({ verified: true, token: unlock[0].access_token });
}
