import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/** "She's not here — yet." Capture the suitor so we can tell him when she registers. */
export async function POST(req: Request) {
  let body: { suitorEmail?: string; searchedName?: string; promptChoice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const suitor_email = (body.suitorEmail || '').trim().toLowerCase();
  const searched_name = (body.searchedName || '').trim().slice(0, 120);
  const choice = ['direct', 'advertise', 'friend', 'none'].includes(body.promptChoice || '')
    ? body.promptChoice
    : 'none';

  const db = supabaseServer();
  const { error } = await db
    .from('suitor_leads')
    .insert({ suitor_email, searched_name, prompt_choice: choice });

  if (error) {
    console.error('suitor lead insert failed:', error.message);
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
