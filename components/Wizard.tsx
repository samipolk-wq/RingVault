'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { STEPS, CONNOISSEUR_DETAILS } from '@/lib/taxonomy';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import PhotoBook, { type DraftPhoto } from '@/components/PhotoBook';
import ShareCard from '@/components/ShareCard';

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
  // Stable id for this design session, so photos uploaded before the ring is
  // saved can be claimed by it afterwards.
  const [draftId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-000000000000'
  );
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  // null until she chooses — this is a required question, not a default.
  const [findable, setFindable] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [middle, setMiddle] = useState('');
  const [school, setSchool] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
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
    if (photos.length) rows.push(['Photos', `${photos.length} attached`]);
    return rows;
  }, [selections, minCt, dreamCt, details, photos]);

  const answersGiven = [dob, middle, school].filter((a) => a.trim()).length;
  const nameLooksComplete = fullName.trim().split(/\s+/).filter(Boolean).length >= 2;
  const readyToSeal =
    findable === false || (findable === true && nameLooksComplete && answersGiven >= 2);

  async function save() {
    if (findable === null) {
      setStatus('error');
      setErrMsg('Please choose whether someone can find your ring.');
      return;
    }
    if (findable && !readyToSeal) {
      setStatus('error');
      setErrMsg('To be findable, add your full name and answer at least two questions.');
      return;
    }
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
          draftId,
          photoNotes: photos.map((p) => ({ id: p.id, note: p.note })),
          discoverable: findable === true,
          fullName: findable ? fullName.trim() : '',
          dob: findable ? dob.trim() : '',
          middle: findable ? middle.trim() : '',
          school: findable ? school.trim() : '',
          selections: Object.fromEntries(reviewRows)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      if (data.id) setSavedId(data.id as string);
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
          Your ring is in the vault, under {email}. Open it any time to visit, change your mind
          about any detail, or leave a note — we&apos;ll send a private link, no password needed.
          {findable === false
            ? ' Right now nobody can find it. You can make yourself findable whenever you\u2019re ready.'
            : ' You can now be found by name — and only by someone who can answer your questions.'}
        </p>
        <a className="btn" href="/enter">Open My Vault</a>
        &nbsp;&nbsp;&nbsp;
        <a className="ulink" href="/">Return Home</a>

        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <ShareCard designId={savedId} />
        </div>
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

          {current.photos ? (
            <PhotoBook draftId={draftId} photos={photos} setPhotos={setPhotos} />
          ) : current.slider ? (
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

          <div className="review-box">
            <div className="subhead" style={{ marginTop: 0 }}>
              <span className="cap">Who can find this?</span>
            </div>
            <p className="hint" style={{ textAlign: 'left', margin: '0 0 22px' }}>
              Your ring is no use to anyone if nobody can reach it. Choose now — you can change
              this whenever you like.
            </p>

            <div className="opts" style={{ gridTemplateColumns: '1fr' }}>
              <div
                className={`opt${findable === true ? ' sel' : ''}`}
                style={{ textAlign: 'left', padding: '22px 24px' }}
                onClick={() => { setFindable(true); setStatus('idle'); setErrMsg(''); }}
                role="radio"
                aria-checked={findable === true}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFindable(true)}
              >
                <b style={{ fontWeight: 500 }}>Someone who can answer my questions</b>
                <div className="msg" style={{ color: 'var(--grey)', marginTop: 8, lineHeight: 1.6 }}>
                  Your name becomes searchable. Anyone who finds you learns only that a vault
                  exists — never what&apos;s inside. To open it they answer your questions, and
                  they pay.
                </div>
              </div>

              <div
                className={`opt${findable === false ? ' sel' : ''}`}
                style={{ textAlign: 'left', padding: '22px 24px' }}
                onClick={() => { setFindable(false); setStatus('idle'); setErrMsg(''); }}
                role="radio"
                aria-checked={findable === false}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFindable(false)}
              >
                <b style={{ fontWeight: 500 }}>No one, for now</b>
                <div className="msg" style={{ color: 'var(--grey)', marginTop: 8, lineHeight: 1.6 }}>
                  Sealed completely. Not searchable, not openable — yours alone until you say
                  otherwise.
                </div>
              </div>
            </div>

            {findable === true && (
              <>
                <div className="subhead">
                  <span className="cap dim">Your name, as they&apos;d search it</span>
                </div>
                <input
                  className="writein"
                  placeholder="First and last name…"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <div className="subhead">
                  <span className="cap dim">Two questions only they would know</span>
                </div>
                <p className="hint" style={{ textAlign: 'left', margin: '0 0 8px' }}>
                  Answer at least two. Whoever opens your vault must get every one you set exactly
                  right — so the more you fill in, the harder it is.
                </p>
                <input className="writein" placeholder="Your date of birth (MM/DD/YYYY)…" value={dob} onChange={(e) => setDob(e.target.value)} />
                <input className="writein" placeholder="Your middle name…" value={middle} onChange={(e) => setMiddle(e.target.value)} />
                <input className="writein" placeholder="Your high school…" value={school} onChange={(e) => setSchool(e.target.value)} />
                <div className="msg" style={{ color: 'var(--grey)' }}>
                  We store these scrambled, never as text. Even we can&apos;t read them back.
                </div>
              </>
            )}
          </div>

          <div className="review-box gate">
            <div className="subhead" style={{ marginTop: 0 }}><span className="cap">Seal It</span></div>
            <input
              type="email"
              placeholder="Your email…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="btn"
              style={{ width: '100%' }}
              onClick={save}
              disabled={status === 'saving' || findable === null || !readyToSeal}
            >
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
