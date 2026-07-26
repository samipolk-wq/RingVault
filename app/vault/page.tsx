'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Design = {
  id: string;
  email: string;
  selections: Record<string, string>;
  note: string | null;
  created_at: string;
  discoverable: boolean;
  full_name: string | null;
};

export default function VaultPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [userId, setUserId] = useState<string | null>(null);

  // Discoverability (all opt-in)
  const [discoverable, setDiscoverable] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [middle, setMiddle] = useState('');
  const [school, setSchool] = useState('');
  const [discState, setDiscState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setEmail(session.user.email ?? null);
    setUserId(session.user.id);

    const { data } = await sb
      .from('designs')
      .select('id,email,selections,note,created_at,discoverable,full_name')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length) {
      const d = data[0] as Design;
      setDesign(d);
      setNote(d.note ?? '');
      setDiscoverable(!!d.discoverable);
      setFullName(d.full_name ?? '');
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

  async function saveDiscoverability() {
    if (!design || !userId) return;
    setDiscState('saving');
    await fetch('/api/discoverability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designId: design.id, userId, discoverable,
        fullName, dob, middle, school
      })
    });
    // Clear the plain answers from memory once hashed server-side.
    setDob(''); setMiddle(''); setSchool('');
    setDiscState('saved');
    setTimeout(() => setDiscState('idle'), 2400);
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
              <span className="cap">Who Can Find It</span>
            </div>
            <p className="hint" style={{ textAlign: 'left', margin: '0 0 20px' }}>
              Your vault is private by default. Turn this on only if you want your partner to be
              able to find your ring by name — and choose which questions confirm it&apos;s really
              them asking. We store your answers as one-way codes, never as readable text.
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, cursor: 'pointer' }}>
              <input type="checkbox" checked={discoverable}
                     onChange={(e) => setDiscoverable(e.target.checked)}
                     style={{ accentColor: 'var(--gold)', width: 18, height: 18 }} />
              <span style={{ fontSize: 17 }}>Let my partner find my ring by name</span>
            </label>

            {discoverable && (
              <>
                <div className="subhead"><span className="cap dim">Your Full Name</span></div>
                <input className="writein" style={{ marginBottom: 8 }} placeholder="Julia Martin"
                       value={fullName} onChange={(e) => setFullName(e.target.value)} />

                <div className="subhead"><span className="cap dim">Confirmation questions — fill any you like</span></div>
                <input className="writein" style={{ marginBottom: 8 }} placeholder="Your date of birth (MM / DD / YYYY)"
                       value={dob} onChange={(e) => setDob(e.target.value)} />
                <input className="writein" style={{ marginBottom: 8 }} placeholder="Your middle name"
                       value={middle} onChange={(e) => setMiddle(e.target.value)} />
                <input className="writein" style={{ marginBottom: 8 }} placeholder="Your high school"
                       value={school} onChange={(e) => setSchool(e.target.value)} />
                <p className="msg" style={{ color: 'var(--grey)', marginBottom: 18 }}>
                  Leave blank to keep any question you&apos;d rather not answer. At least one is
                  needed for anyone to unlock your ring.
                </p>
              </>
            )}

            <button className="btn" onClick={saveDiscoverability} disabled={discState === 'saving'}>
              {discState === 'saving' ? 'Saving…' : discState === 'saved' ? 'Saved ✓' : 'Save Privacy Settings'}
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
              <li><span>Discoverable</span><b>{discoverable ? 'Yes — by name' : 'No — fully private'}</b></li>
              <li><span>Suitor status</span><b>No withdrawals… yet</b></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
