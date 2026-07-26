import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { nameKey } from '@/lib/verify';

/**
 * Step 1 of the suitor passage: does a ring exist for this name?
 * Deliberately minimal disclosure — we return only whether a discoverable
 * vault exists and which verification questions she chose to allow.
 * We never return her email, her ring, or any personal detail here.
 */
export async function POST(req: Request) {
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  if (name.length < 3) {
    return NextResponse.json({ error: 'Please enter her full name.' }, { status: 400 });
  }

  const key = nameKey(name);
  const db = supabaseServer();

  const { data, error } = await db
    .from('designs')
    .select('id, verify_dob_hash, verify_middle_hash, verify_school_hash, blocked_names')
    .eq('discoverable', true)
    .eq('name_key', key)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('suitor search failed:', error.message);
    return NextResponse.json({ error: 'Search is unavailable right now.' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ found: false });
  }

  const row = data[0];

  // She can block specific searchers by name — respect that silently.
  const blocked = (row.blocked_names || []).map((n: string) => nameKey(n));
  if (blocked.includes(key)) {
    return NextResponse.json({ found: false });
  }

  const questions: string[] = [];
  if (row.verify_dob_hash) questions.push('dob');
  if (row.verify_middle_hash) questions.push('middle');
  if (row.verify_school_hash) questions.push('school');

  return NextResponse.json({
    found: true,
    designId: row.id,
    questions
  });
}
