import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const BUCKET = 'ring-photos';
const MAX_BYTES = 4 * 1024 * 1024; // the browser downscales before sending, so this is generous
const MAX_PER_DRAFT = 6;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST — upload one photo against a draft.
 * multipart/form-data: file, draftId, note?
 *
 * Uploads to a private bucket and returns a short-lived signed URL purely so
 * she can see her own thumbnail while designing. The durable, payment-gated
 * URLs are minted separately by the deliverable route.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 });
  }

  const draftId = String(form.get('draftId') || '');
  const note = String(form.get('note') || '').slice(0, 500);
  const file = form.get('file');

  if (!UUID_RE.test(draftId)) {
    return NextResponse.json({ error: 'Invalid draft.' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image was attached.' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: 'Please use a JPEG, PNG, or WebP image.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is too large.' }, { status: 400 });
  }

  const db = supabaseServer();

  // Cap per draft, so one session can't fill the bucket.
  const { count } = await db
    .from('design_photos')
    .select('id', { count: 'exact', head: true })
    .eq('draft_id', draftId);
  if ((count || 0) >= MAX_PER_DRAFT) {
    return NextResponse.json(
      { error: `You can add up to ${MAX_PER_DRAFT} photos.` },
      { status: 400 }
    );
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${draftId}/${crypto.randomUUID()}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (upErr) {
    console.error('photo upload failed:', upErr.message);
    const missingBucket = /bucket/i.test(upErr.message) && /not found|does not exist/i.test(upErr.message);
    return NextResponse.json(
      {
        error: missingBucket
          ? 'Photo storage is not set up yet.'
          : 'Could not save that photo. Please try again.'
      },
      { status: 500 }
    );
  }

  const { data: row, error: insErr } = await db
    .from('design_photos')
    .insert({ draft_id: draftId, storage_path: path, note, sort_order: count || 0 })
    .select('id')
    .limit(1);

  if (insErr || !row?.length) {
    // Don't leave an orphaned file behind if the row failed.
    await db.storage.from(BUCKET).remove([path]);
    console.error('photo row insert failed:', insErr?.message);
    return NextResponse.json({ error: 'Could not save that photo.' }, { status: 500 });
  }

  const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60);

  return NextResponse.json({
    ok: true,
    id: row[0].id,
    previewUrl: signed?.signedUrl || null
  });
}

/**
 * DELETE ?id=…&draftId=…
 * Removing her own photo while she designs. Scoped to the draft, so an id
 * alone is not enough to delete someone else's upload.
 */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const draftId = url.searchParams.get('draftId') || '';
  if (!UUID_RE.test(id) || !UUID_RE.test(draftId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const db = supabaseServer();
  const { data: rows } = await db
    .from('design_photos')
    .select('id, storage_path, design_id')
    .eq('id', id)
    .eq('draft_id', draftId)
    .limit(1);

  if (!rows?.length) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  // Once a photo belongs to a saved ring, it's managed from the vault, not here.
  if (rows[0].design_id) {
    return NextResponse.json({ error: 'That ring is already sealed.' }, { status: 409 });
  }

  await db.storage.from(BUCKET).remove([rows[0].storage_path as string]);
  await db.from('design_photos').delete().eq('id', id);

  return NextResponse.json({ ok: true });
}

/**
 * PATCH — update the note on a photo she's already uploaded.
 * { id, draftId, note }
 */
export async function PATCH(req: Request) {
  let body: { id?: string; draftId?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const id = body.id || '';
  const draftId = body.draftId || '';
  if (!UUID_RE.test(id) || !UUID_RE.test(draftId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const db = supabaseServer();
  const { error } = await db
    .from('design_photos')
    .update({ note: String(body.note || '').slice(0, 500) })
    .eq('id', id)
    .eq('draft_id', draftId)
    .is('design_id', null);

  if (error) return NextResponse.json({ error: 'Could not save that note.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
