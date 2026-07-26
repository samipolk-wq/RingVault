'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Design = {
  id: string;
  email: string;
  selections: Record<string, string>;
  note: string | null;
  created_at: string;
};

export default function VaultPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setEmail(session.user.email ?? null);

    const { data } = await sb
      .from('designs')
      .select('id,email,selections,note,created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length) {
      setDesign(data[0] as Design);
      setNote((data[0] as Design).note ?? '');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveNote() {
    if (!design) return;
    setSaveState('saving');
    const sb = supabaseBrowser();
    await sb.from('designs').update({ note }).eq('id', design.id);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2200);
  }

  async function signOut() {
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="shell" style={{ textAlign: 'center', paddingTop: 140 }}>
        <p className="hint">Opening your vault…</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="shell" style={{ textAlign: 'center', paddingTop: 130, maxWidth: 560 }}>
        <div className="cap">Your Vault</div>
        <h1 style={{ fontSize: 38, fontWeight: 300, margin: '22px 0 14px' }}>
          The vault is <em>locked.</em>
        </h1>
        <p className="hint" style={{ maxWidth: 400, margin: '0 auto 36px' }}>
          Enter your email and we&apos;ll send a private link to open it.
        </p>
        <a className="btn" href="/enter">Enter the Vault</a>
      </div>
    );
  }

  const rows = design ? Object.entries(design.selections) : [];

  return (
    <div className="shell" style={{ maxWidth: 760 }}>
      <div className="wtop">
        <span className="cap dim">{email}</span>
        <button className="ulink" onClick={signOut} style={{ borderColor: 'var(--line)' }}>
          Close the Vault
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <div className="cap">The Ring Vault</div>
        <h1 style={{ fontSize: 'clamp(34px,4.4vw,46px)', fontWeight: 300, margin: '20px 0 12px' }}>
          Safe <em>&amp; sound.</em>
        </h1>
        <p className="hint" style={{ margin: 0 }}>
          It&apos;s entirely normal to visit your ring.
        </p>
      </div>

      {!design && (
        <div className="review-box" style={{ textAlign: 'center' }}>
          <p className="hint" style={{ margin: '0 0 26px' }}>
            Your vault is empty — no ring inside it yet.
          </p>
          <a className="btn" href="/design">Design Your Ring</a>
        </div>
      )}

      {design && (
        <>
          <div className="review-box">
            <div className="subhead" style={{ marginTop: 0 }}>
              <span className="cap">Your Perfect Ring</span>
            </div>
            <ul>
              {rows.map(([k, v]) => (
                <li key={k}><span>{k}</span><b>{v}</b></li>
              ))}
            </ul>
            <div style={{ marginTop: 26, textAlign: 'right' }}>
              <a className="ulink" href="/design">Refine My Ring</a>
            </div>
          </div>

          <div className="review-box">
            <div className="subhead" style={{ marginTop: 0 }}>
              <span className="cap">A Note to Your Suitor</span>
            </div>
            <textarea
              className="writein"
              style={{ minHeight: 96, marginBottom: 14 }}
              placeholder="Write something they'll read the moment they open your vault…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn" onClick={saveNote} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save Note'}
            </button>
          </div>

          <div className="review-box">
            <div className="subhead" style={{ marginTop: 0 }}>
              <span className="cap">Deposited</span>
            </div>
            <ul>
              <li>
                <span>In the vault since</span>
                <b>{new Date(design.created_at).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}</b>
              </li>
              <li><span>Suitor status</span><b>No withdrawals… yet</b></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
