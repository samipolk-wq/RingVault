import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashAnswer, nameKey } from '@/lib/verify';

/**
 * She controls this entirely. Nothing here is required, and turning
 * discoverable off removes her from search immediately.
 * Verification answers arrive in plain text over HTTPS, are hashed here,
 * and the plain values are never written to the database.
 */
export async function POST(req: Request) {
  let body: {
    designId?: string;
    userId?: string;
    discoverable?: boolean;
    fullName?: string;
    dob?: string;
    middle?: string;
    school?: string;
    blockedNames?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const designId = (body.designId || '').trim();
  const userId = (body.userId || '').trim();
  if (!designId || !userId) {
    return NextResponse.json({ error: 'Missing design or user' }, { status: 400 });
  }

  const db = supabaseServer();

  // Confirm this design really belongs to this user before changing anything.
  const { data: owned } = await db
    .from('designs')
    .select('id')
    .eq('id', designId)
    .eq('user_id', userId)
    .limit(1);

  if (!owned || owned.length === 0) {
    return NextResponse.json({ error: 'Not your vault.' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    discoverable: !!body.discoverable
  };

  if (typeof body.fullName === 'string') {
    const fullName = body.fullName.trim().slice(0, 120);
    patch.full_name = fullName || null;
    patch.name_key = fullName ? nameKey(fullName) : null;
  }
  if (typeof body.dob === 'string') patch.verify_dob_hash = body.dob ? hashAnswer(body.dob) : null;
  if (typeof body.middle === 'string') patch.verify_middle_hash = body.middle ? hashAnswer(body.middle) : null;
  if (typeof body.school === 'string') patch.verify_school_hash = body.school ? hashAnswer(body.school) : null;
  if (Array.isArray(body.blockedNames)) {
    patch.blocked_names = body.blockedNames.filter((n) => typeof n === 'string').slice(0, 25);
  }

  const { error } = await db.from('designs').update(patch).eq('id', designId);
  if (error) {
    console.error('discoverability update failed:', error.message);
    return NextResponse.json({ error: 'Could not save those settings.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
