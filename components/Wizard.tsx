'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { STEPS, CONNOISSEUR_DETAILS } from '@/lib/taxonomy';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Selections = Record<string, string>;

const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [minCt, setMinCt] = useState(1);
  const [dreamCt, setDreamCt] = useState(2);
  const [details, setDetails] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // If she's already signed in, prefill her email and link the design to her account.
  useEffect(() => {
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          if (session.user.email) setEmail(session.user.email);
        }
      } catch {
        /* auth not configured yet — anonymous save still works */
      }
    })();
  }, []);

  const total = STEPS.length;
  const atReview = step === total;
  const current = STEPS[step];

  const setSel = (field: string, value: string) => {
    if (!value) return;
    setSelections((s) => ({ ...s, [field]: value }));
  };

  const reviewRows = useMemo(() => {
    const rows: [string, string][] = Object.entries(selections);
    rows.push(['Min Carat', `${minCt} ct`], ['Dream Carat', `${dreamCt} ct`]);
    if (details.length) rows.push(['Connoisseur Details', details.join(', ')]);
    return rows;
  }, [selections, minCt, dreamCt, details]);

  async function save() {
    setStatus('saving');
    setErrMsg('');
    try {
      const res = await fetch('/api/save-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          note,
          userId,
          selections: Object.fromEntries(reviewRows)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('saved');
    } catch (e: unknown) {
      setStatus('error');
      setErrMsg(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  if (status === 'saved') {
    return (
      <div className="shell" style={{ textAlign: 'center', paddingTop: 120 }}>
        <div className="cap">The Ring Vault</div>
        <h2 style={{ fontSize: 40, fontWeight: 300, margin: '24px 0 18px' }}>
          Safe <em>&amp; sound.</em>
        </h2>
        <p className="hint" style={{ maxWidth: 440, margin: '0 auto 40px' }}>
          Your ring is in the vault, under {email}. Open your vault any time to visit it, refine
          it, or leave a note — we&apos;ll send a private link, no password needed.
        </p>
        <a className="btn" href="/enter">Open My Vault</a>
        &nbsp;&nbsp;&nbsp;
        <a className="ulink" href="/">Return Home</a>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="wtop">
        <span className="cap dim">
          {atReview ? 'Review' : `Step ${String(step + 1).padStart(2, '0')} — ${String(total).padStart(2, '0')}`}
        </span>
        <span className="cap">Your Specification</span>
      </div>

      <div className="progress">
        {STEPS.map((s, i) => (
          <div key={s.key} className={i <= step ? 'done' : ''} />
        ))}
      </div>

      {!atReview && current && (
        <div className="wstep">
          <h2 dangerouslySetInnerHTML={{ __html: current.title }} />
          <p className="hint">{current.hint}</p>

          {current.slider ? (
            <>
              <div className="slider-wrap">
                <div className="subhead"><span className="cap dim">The number you won&apos;t go below</span></div>
                <input
                  type="range" min={0.25} max={5} step={0.25} value={minCt}
                  onChange={(e) => setMinCt(Number(e.target.value))}
                />
                <div className="carat-val">{minCt} carats</div>
                <div className="subhead"><span className="cap dim">The number you actually want</span></div>
                <input
                  type="range" min={0.25} max={8} step={0.25} value={dreamCt}
                  onChange={(e) => setDreamCt(Number(e.target.value))}
                />
                <div className="carat-val">{dreamCt} carats</div>
                <p className="carat-note">
                  No one has ever regretted being specific. Put down the number you mean — not the
                  one you think is polite.
                </p>
              </div>
              <div className="subhead"><span className="cap dim">The connoisseur&apos;s details — skip freely</span></div>
              <div className="opts">
                {CONNOISSEUR_DETAILS.map((d) => (
                  <div
                    key={d}
                    className={`opt${details.includes(d) ? ' sel' : ''}`}
                    onClick={() =>
                      setDetails((cur) =>
                        cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
                      )
                    }
                  >
                    {d}
                  </div>
                ))}
              </div>
            </>
          ) : (
            current.groups?.map((g) => (
              <div key={g.field}>
                <div className="subhead"><span className="cap dim">{g.sub}</span></div>
                <div className="opts">
                  {g.opts.map((o) => (
                    <div
                      key={o.label}
                      className={`opt${selections[g.field] === o.label ? ' sel' : ''}`}
                      onClick={() => setSel(g.field, o.label)}
                    >
                      <Icon name={o.icon} />
                      {o.label}
                    </div>
                  ))}
                </div>
                {g.writeIn && (
                  <input
                    className="writein"
                    placeholder={g.writeIn}
                    onBlur={(e) => setSel(g.field, e.target.value.trim())}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {atReview && (
        <div className="wstep">
          <h2>Place your ring <em>into the vault</em></h2>
          <p className="hint">Read it back. If anything on this list is a compromise, change it now.</p>

          <div className="review-box">
            <div className="subhead" style={{ marginTop: 0 }}><span className="cap">Your Specification</span></div>
            <ul>
              {reviewRows.map(([k, v]) => (
                <li key={k}><span>{k}</span><b>{v}</b></li>
              ))}
            </ul>
          </div>

          <div className="review-box">
            <div className="subhead" style={{ marginTop: 0 }}><span className="cap">In Your Own Words</span></div>
            <textarea
              className="writein"
              style={{ minHeight: 90, marginBottom: 0 }}
              placeholder="Anything you want them to know — why this stone, what you were thinking, or nothing to do with rings at all…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="review-box gate">
            <div className="subhead" style={{ marginTop: 0 }}><span className="cap">Seal It</span></div>
            <input
              type="email"
              placeholder="Your email…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" style={{ width: '100%' }} onClick={save} disabled={status === 'saving'}>
              {status === 'saving' ? 'Sealing…' : 'Place in The Ring Vault'}
            </button>
            {status === 'error' && <div className="msg err">{errMsg}</div>}
            <div className="msg" style={{ color: 'var(--grey)' }}>
              Free · Private · Change any of it, any time you like
            </div>
          </div>
        </div>
      )}

      <div className="wnav">
        <button
          className="ulink"
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        {!atReview && (
          <button className="btn" onClick={() => setStep((s) => s + 1)}>
            {step === total - 1 ? 'Review My Ring' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
