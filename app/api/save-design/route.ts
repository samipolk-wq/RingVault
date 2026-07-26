import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; selections?: Record<string, string>; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const selections = body.selections || {};
  const note = (body.note || '').slice(0, 2000);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (typeof selections !== 'object' || Array.isArray(selections)) {
    return NextResponse.json({ error: 'Invalid selections' }, { status: 400 });
  }
  // Cap selections payload size defensively.
  if (JSON.stringify(selections).length > 20_000) {
    return NextResponse.json({ error: 'Selections too large' }, { status: 400 });
  }

  const db = supabaseServer();
  const { error } = await db.from('designs').insert({ email, selections, note });
  if (error) {
    console.error('save-design insert failed:', error.message);
    return NextResponse.json({ error: 'Could not save your ring. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
