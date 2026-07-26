import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashAnswer, hashesMatch } from '@/lib/verify';

/**
 * Step 2: confirm he knows her. Answers are hashed and compared against the
 * hashes she stored — the plain answers never touch our database.
 * On success we create a pending unlock and return its token; the deliverable
 * stays sealed until that unlock is marked paid.
 */
export async function POST(req: Request) {
  let body: {
    designId?: string;
    suitorEmail?: string;
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
  const { data, error } = await db
    .from('designs')
    .select('id, verify_dob_hash, verify_middle_hash, verify_school_hash')
    .eq('id', designId)
    .eq('discoverable', true)
    .limit(1);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'That vault could not be found.' }, { status: 404 });
  }

  const row = data[0];

  // Every question she enabled must match. All-or-nothing: no partial credit.
  const checks: boolean[] = [];
  if (row.verify_dob_hash) checks.push(hashesMatch(hashAnswer(body.dob || ''), row.verify_dob_hash));
  if (row.verify_middle_hash) checks.push(hashesMatch(hashAnswer(body.middle || ''), row.verify_middle_hash));
  if (row.verify_school_hash) checks.push(hashesMatch(hashAnswer(body.school || ''), row.verify_school_hash));

  if (checks.length === 0 || checks.some((ok) => !ok)) {
    // Vague on purpose: never reveal which answer was wrong.
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

  return NextResponse.json({ verified: true, token: unlock[0].access_token });
}
