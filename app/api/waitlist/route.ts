import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; placement?: string; audience?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const placement = (body.placement || 'unknown').slice(0, 40);
  const audience = body.audience === 'suitor' ? 'suitor' : 'designer';

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const db = supabaseServer();
  const { error } = await db.from('waitlist').insert({ email, placement, audience });
  if (error) {
    console.error('waitlist insert failed:', error.message);
    return NextResponse.json({ error: 'Could not sign you up. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
