'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type DraftPhoto = {
  id: string;
  previewUrl: string | null;
  note: string;
};

/**
 * The photo book. Three ways in, because this is how people actually gather
 * ring photos: paste from the clipboard (Pinterest, Instagram, a screenshot),
 * drag a file in, or browse.
 *
 * Images are downscaled in the browser first. Phone photos run 5-8MB, which
 * exceeds the serverless request limit; 2000px keeps them well under it and
 * loses nothing a jeweler would notice.
 */
const MAX_PHOTOS = 6;
const MAX_EDGE = 2000;

async function downscale(file: Blob): Promise<Blob> {
  if (file.size < 700_000 && file.type === 'image/jpeg') return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

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
  const [dragging, setDragging] = useState(false);
  const [justAdded, setJustAdded] = useState(0);

  // Ref mirror so the paste listener always sees the current count without
  // being torn down and rebuilt on every upload.
  const countRef = useRef(photos.length);
  countRef.current = photos.length;

  const addImages = useCallback(
    async (incoming: Blob[]) => {
      if (!incoming.length) return;
      setErr('');
      const room = MAX_PHOTOS - countRef.current;
      if (room <= 0) {
        setErr('You can add up to ' + MAX_PHOTOS + ' photos.');
        return;
      }

      setBusy(true);
      let added = 0;
      for (const raw of incoming.slice(0, room)) {
        try {
          const blob = await downscale(raw);
          const form = new FormData();
          form.append('file', blob, 'photo.jpg');
          form.append('draftId', draftId);

          const res = await fetch('/api/design/photo', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed.');

          setPhotos((prev) => [...prev, { id: data.id, previewUrl: data.previewUrl, note: '' }]);
          countRef.current += 1;
          added += 1;
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Could not add that photo.');
        }
      }
      setBusy(false);
      if (added) {
        setJustAdded(added);
        setTimeout(() => setJustAdded(0), 2600);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [draftId, setPhotos]
  );

  // --- paste anywhere on the step ---
  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const cd = e.clipboardData;
      if (!cd) return;

      const images: Blob[] = [];
      for (const item of Array.from(cd.items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) images.push(f);
        }
      }

      if (images.length) {
        e.preventDefault();
        await addImages(images);
        return;
      }

      // Copying an image from a website sometimes puts only its address on the
      // clipboard, not the image itself. Say so plainly rather than appearing
      // to ignore the paste.
      const text = cd.getData('text/plain')?.trim();
      if (text && /^https?:\/\/\S+$/i.test(text)) {
        setErr(
          'That copied a link rather than the picture. Right-click the image and choose "Copy image", or take a screenshot and paste that.'
        );
      }
    }

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [addImages]);

  async function remove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    countRef.current = Math.max(0, countRef.current - 1);
    try {
      await fetch('/api/design/photo?id=' + id + '&draftId=' + draftId, { method: 'DELETE' });
    } catch {
      /* removed from her view regardless; a stray file is harmless */
    }
  }

  function setNote(id: string, note: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
  }

  const pasteKey =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
      ? '\u2318V'
      : 'Ctrl+V';

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
                <div style={{ width: 96, height: 96, background: 'var(--champagne)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea
                  className="writein"
                  style={{ minHeight: 64, margin: 0 }}
                  placeholder="What do you like about this one? The band, the setting, the whole thing…"
                  value={p.note}
                  onChange={(e) => setNote(p.id, e.target.value)}
                />
                <button className="ulink" style={{ marginTop: 10, fontSize: 9.5 }} onClick={() => remove(p.id)}>
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
        onChange={(e) => addImages(Array.from(e.target.files || []))}
      />

      {photos.length < MAX_PHOTOS && (
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
            if (files.length) addImages(files);
          }}
          style={{
            border: '1px dashed ' + (dragging ? 'var(--gold-deep)' : 'var(--line)'),
            background: dragging ? 'var(--champagne)' : '#fff',
            padding: '38px 20px',
            textAlign: 'center',
            cursor: busy ? 'default' : 'pointer',
            transition: 'background 0.2s, border-color 0.2s'
          }}
        >
          <div className="cap" style={{ color: 'var(--gold-deep)' }}>
            {busy
              ? 'Adding…'
              : dragging
                ? 'Drop it here'
                : photos.length
                  ? 'Paste, drop, or browse for another'
                  : 'Paste a photo, drop one here, or browse'}
          </div>
          <p className="hint" style={{ margin: '12px 0 0' }}>
            Copy any picture and press{' '}
            <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{pasteKey}</b>. Screenshots, saved
            pins, a photo of your grandmother&apos;s ring — anything at all.
          </p>
        </div>
      )}

      {justAdded > 0 && (
        <div className="msg ok">
          {justAdded === 1 ? 'Photo added.' : justAdded + ' photos added.'} Tell us what you like
          about {justAdded === 1 ? 'it' : 'them'} above.
        </div>
      )}
      {err && <div className="msg err">{err}</div>}
      <div className="msg" style={{ color: 'var(--grey)' }}>
        Private until you decide otherwise · Up to {MAX_PHOTOS} photos
      </div>
    </>
  );
}
