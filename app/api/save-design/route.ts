import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashAnswer, nameKey } from '@/lib/verify';
import { sendDepositConfirmation } from '@/lib/notify';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: {
    email?: string;
    selections?: Record<string, string>;
    note?: string;
    userId?: string;
    // Discoverability, chosen during the design flow rather than on a later visit.
    discoverable?: boolean;
    fullName?: string;
    dob?: string;
    middle?: string;
    school?: string;
    notifyMode?: string;
    draftId?: string;
    photoNotes?: { id?: string; note?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const selections = body.selections || {};
  const note = (body.note || '').slice(0, 2000);
  const userId = typeof body.userId === 'string' ? body.userId : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (typeof selections !== 'object' || Array.isArray(selections)) {
    return NextResponse.json({ error: 'Invalid selections' }, { status: 400 });
  }
  if (JSON.stringify(selections).length > 20_000) {
    return NextResponse.json({ error: 'Selections too large' }, { status: 400 });
  }

  const db = supabaseServer();
  const row: Record<string, unknown> = { email, selections, note };
  if (userId) row.user_id = userId;

  const MODES = ['everything', 'discreet', 'nothing'];
  row.notify_mode = MODES.includes(String(body.notifyMode)) ? body.notifyMode : 'discreet';

  // --- Discoverability, decided at creation ---
  // Answers are hashed here, server-side, with VERIFY_SALT. The plain text is
  // never written to the database and never leaves this function.
  const wantsDiscoverable = body.discoverable === true;
  if (wantsDiscoverable) {
    const fullName = (body.fullName || '').trim();
    const answers = {
      dob: (body.dob || '').trim(),
      middle: (body.middle || '').trim(),
      school: (body.school || '').trim()
    };
    const provided = Object.values(answers).filter(Boolean).length;

    if (fullName.split(/\s+/).filter(Boolean).length < 2) {
      return NextResponse.json(
        { error: 'To be findable, please give your first and last name.' },
        { status: 400 }
      );
    }
    if (provided < 2) {
      return NextResponse.json(
        { error: 'To be findable, please answer at least two of the three questions.' },
        { status: 400 }
      );
    }

    row.discoverable = true;
    row.full_name = fullName;
    row.name_key = nameKey(fullName);
    row.verify_dob_hash = answers.dob ? hashAnswer(answers.dob) : null;
    row.verify_middle_hash = answers.middle ? hashAnswer(answers.middle) : null;
    row.verify_school_hash = answers.school ? hashAnswer(answers.school) : null;
  } else {
    row.discoverable = false;
  }

  // Returning the id so the confirmation email can reference this design.
  const { data, error } = await db.from('designs').insert(row).select('id').limit(1);

  if (error || !data || !data.length) {
    console.error('save-design insert failed:', error?.message);
    return NextResponse.json({ error: 'Could not save your ring. Please try again.' }, { status: 500 });
  }

  const designId = data[0].id as string;

  // Claim any photos uploaded during this session and save their notes.
  // Deliberately after the design insert and non-fatal: a photo problem must
  // never lose her ring, which is the thing she actually spent time on.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const draftId = String(body.draftId || '');
  if (UUID_RE.test(draftId)) {
    try {
      for (const p of body.photoNotes || []) {
        if (!p?.id || !UUID_RE.test(p.id)) continue;
        await db
          .from('design_photos')
          .update({ note: String(p.note || '').slice(0, 500) })
          .eq('id', p.id)
          .eq('draft_id', draftId)
          .is('design_id', null);
      }
      const { error: claimErr } = await db
        .from('design_photos')
        .update({ design_id: designId })
        .eq('draft_id', draftId)
        .is('design_id', null);
      if (claimErr) console.error('photo claim failed:', claimErr.message);
    } catch (e) {
      console.error('photo claim threw:', e);
    }
  }

  // The confirmation email the success screen already promises. Not awaited into
  // the response: a mail problem must never make her think the save failed.
  void sendDepositConfirmation(designId, email);

  return NextResponse.json({ ok: true, id: designId, discoverable: wantsDiscoverable });
}
