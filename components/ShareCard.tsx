'use client';

import { useState } from 'react';

/**
 * The share step, from the 2013 spec. Two genuinely different intentions, which
 * is why they are two separate things rather than one "share" button:
 *
 *   1. Tell a friend about the vault — she liked this and passes it on. Growth.
 *   2. Ask a friend to drop a hint — the friend nudges her partner toward the
 *      site. This is the half of the loop that turns a deposited ring into a
 *      paying suitor, and it's the whole reason the vault isn't a dead end.
 *
 * Every share is recorded against her design so you can measure which of the
 * two people actually use.
 */

type Mode = 'idle' | 'friend' | 'hint';

export default function ShareCard({ designId }: { designId?: string | null }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [copied, setCopied] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ringvault.co';

  const friendText = `I just designed my dream engagement ring and put it in a vault. It's oddly satisfying — you pick every detail. ${origin}`;

  const hintText = `Slightly ridiculous favour: I designed my dream ring on The Ring Vault, and it's sitting there waiting. If the subject ever comes up, would you point him at ${origin}/suitors? He answers a couple of questions only he'd know and gets the whole thing. Saves everyone a guess.`;

  function record(kind: string) {
    if (!designId) return;
    // Fire-and-forget is fine here — this is analytics, not a promise to anyone,
    // and the request completes in the browser rather than a frozen function.
    fetch('/api/design/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId, kind })
    }).catch(() => {});
  }

  async function copy(text: string, label: string, kind: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2600);
      record(kind);
    } catch {
      setCopied('nope');
    }
  }

  async function nativeShare(text: string, kind: string) {
    // Mobile: hand off to the OS share sheet, which is where most of this will happen.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'The Ring Vault', text });
        record(kind);
        return true;
      } catch {
        return false; // she cancelled — not an error
      }
    }
    return false;
  }

  if (mode === 'idle') {
    return (
      <div className="review-box" style={{ textAlign: 'left', marginTop: 40 }}>
        <div className="subhead" style={{ marginTop: 0 }}>
          <span className="cap">Before you go</span>
        </div>
        <p className="hint" style={{ textAlign: 'left', margin: '0 0 22px' }}>
          A ring nobody knows about stays a ring nobody knows about.
        </p>

        <div className="opts" style={{ gridTemplateColumns: '1fr' }}>
          <div
            className="opt"
            style={{ textAlign: 'left', padding: '22px 24px' }}
            onClick={() => setMode('hint')}
          >
            <b style={{ fontWeight: 500 }}>Ask a friend to drop a hint</b>
            <div className="msg" style={{ color: 'var(--grey)', marginTop: 8, lineHeight: 1.6 }}>
              She mentions it to him. He never knows it came from you, and you never have to say a
              word.
            </div>
          </div>

          <div
            className="opt"
            style={{ textAlign: 'left', padding: '22px 24px' }}
            onClick={() => setMode('friend')}
          >
            <b style={{ fontWeight: 500 }}>Tell a friend about the vault</b>
            <div className="msg" style={{ color: 'var(--grey)', marginTop: 8, lineHeight: 1.6 }}>
              For anyone who has ever been asked what she wants and struggled to answer precisely.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isHint = mode === 'hint';
  const text = isHint ? hintText : friendText;
  const kind = isHint ? 'share_hint' : 'share_friend';

  return (
    <div className="review-box" style={{ textAlign: 'left', marginTop: 40 }}>
      <div className="subhead" style={{ marginTop: 0 }}>
        <span className="cap">{isHint ? 'Ask a friend' : 'Tell a friend'}</span>
      </div>
      <p className="hint" style={{ textAlign: 'left', margin: '0 0 18px' }}>
        {isHint
          ? 'Send this to whichever friend is closest to him. Change any of it — it should sound like you.'
          : 'Yours to send, or reword entirely.'}
      </p>

      <div
        style={{
          border: '1px solid var(--line)',
          background: 'var(--paper)',
          padding: '20px 22px',
          fontStyle: 'italic',
          lineHeight: 1.7,
          marginBottom: 20
        }}
      >
        {text}
      </div>

      <button
        className="btn"
        style={{ width: '100%' }}
        onClick={async () => {
          const shared = await nativeShare(text, kind);
          if (!shared) copy(text, isHint ? 'Message copied' : 'Copied', kind);
        }}
      >
        {copied === 'nope' ? 'Select it above and copy' : copied ? copied : 'Copy this message'}
      </button>

      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button className="ulink" onClick={() => { setMode('idle'); setCopied(''); }}>
          Back
        </button>
      </div>
    </div>
  );
}
