'use client';

import { useRef, useState } from 'react';

export type DraftPhoto = {
  id: string;
  previewUrl: string | null;
  note: string;
  uploading?: boolean;
};

/**
 * The photo book. She uploads reference images and says what she likes about
 * each one — "this band, but not the halo" tells a jeweler far more than the
 * picture alone.
 *
 * Images are downscaled in the browser before upload. Phone photos are often
 * 5–8MB, which would exceed the serverless request limit; resizing to 2000px
 * keeps them well under it, makes uploads fast on a phone connection, and
 * loses nothing a jeweler would care about.
 */
const MAX_PHOTOS = 6;
const MAX_EDGE = 2000;

async function downscale(file: File): Promise<Blob> {
  // Anything already small and web-safe can go as-is.
  if (file.size < 700_000 && file.type === 'image/jpeg') return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // e.g. HEIC in a browser that can't decode it

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.86)
  );
  return blob && blob.size < file.size ? blob : file;
}

export default function PhotoBook({
  draftId,
  photos,
  setPhotos
}: {
  draftId: string;
  photos: DraftPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<DraftPhoto[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setErr('');
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setErr(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setBusy(true);
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const blob = await downscale(file);
        const form = new FormData();
        form.append('file', blob, 'photo.jpg');
        form.append('draftId', draftId);

        const res = await fetch('/api/design/photo', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed.');

        setPhotos((prev) => [
          ...prev,
          { id: data.id, previewUrl: data.previewUrl, note: '' }
        ]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not add that photo.');
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function remove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/design/photo?id=${id}&draftId=${draftId}`, { method: 'DELETE' });
    } catch {
      /* the row is gone from her view either way; a stray file is harmless */
    }
  }

  function setNote(id: string, note: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
  }

  return (
    <>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gap: 16, marginBottom: 22 }}>
          {photos.map((p) => (
            <div
              key={p.id}
              style={{
                border: '1px solid var(--line)',
                background: '#fff',
                padding: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start'
              }}
            >
              {p.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.previewUrl}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    background: 'var(--champagne)',
                    flexShrink: 0
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea
                  className="writein"
                  style={{ minHeight: 64, margin: 0 }}
                  placeholder="What do you like about this one? The band, the setting, the whole thing…"
                  value={p.note}
                  onChange={(e) => setNote(p.id, e.target.value)}
                />
                <button
                  className="ulink"
                  style={{ marginTop: 10, fontSize: 9.5 }}
                  onClick={() => remove(p.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length < MAX_PHOTOS && (
        <div
          onClick={() => !busy && inputRef.current?.click()}
          style={{
            border: '1px dashed var(--line)',
            padding: '38px 20px',
            textAlign: 'center',
            cursor: busy ? 'default' : 'pointer',
            background: '#fff'
          }}
        >
          <div className="cap" style={{ color: 'var(--gold-deep)' }}>
            {busy ? 'Adding…' : photos.length ? 'Add another' : 'Choose photos'}
          </div>
          <p className="hint" style={{ margin: '12px 0 0' }}>
            Screenshots, saved pins, a photo of your grandmother&apos;s ring — anything at all.
          </p>
        </div>
      )}

      {err && <div className="msg err">{err}</div>}
      <div className="msg" style={{ color: 'var(--grey)' }}>
        Private until you decide otherwise · Up to {MAX_PHOTOS} photos
      </div>
    </>
  );
}
