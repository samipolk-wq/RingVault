'use client';

import { useState } from 'react';

type Stage = 'intro' | 'search' | 'notfound' | 'verify' | 'failed' | 'unlock';

export default function SuitorsPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [name, setName] = useState('');
  const [designId, setDesignId] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [dob, setDob] = useState('');
  const [middle, setMiddle] = useState('');
  const [school, setSchool] = useState('');
  const [suitorEmail, setSuitorEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [promptChoice, setPromptChoice] = useState('direct');

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/suitor/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed.');
      if (data.found) {
        setDesignId(data.designId);
        setQuestions(data.questions || []);
        setStage('verify');
      } else {
        setStage('notfound');
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/suitor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId, suitorEmail, dob, middle, school })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      if (data.verified) {
        setToken(data.token);
        setStage('unlock');
      } else {
        setStage('failed');
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function sendLead() {
    setBusy(true);
    await fetch('/api/suitor/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suitorEmail, searchedName: name, promptChoice })
    });
    setLeadSent(true);
    setBusy(false);
  }

  return (
    <div className="shell" style={{ maxWidth: 640 }}>
      <div style={{ textAlign: 'center', marginBottom: 46 }}>
        <div className="cap">For Suitors</div>
        <h1 style={{ fontSize: 'clamp(30px,3.8vw,42px)', fontWeight: 300, margin: '20px 0 0' }}>
          {stage === 'intro' && <>So, you&apos;re thinking <em>of proposing.</em></>}
          {stage === 'search' && <>Is their ring <em>in the vault?</em></>}
          {stage === 'verify' && <>Let us make certain <em>it&apos;s them.</em></>}
          {stage === 'unlock' && <>We&apos;ve <em>found them.</em></>}
          {stage === 'notfound' && <>Not here — <em>yet.</em></>}
          {stage === 'failed' && <>That didn&apos;t <em>match.</em></>}
        </h1>
      </div>

      {stage === 'intro' && (
        <div className="review-box">
          <p style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--gold-deep)', marginBottom: 18 }}>
            It&apos;s wonderful that you came here.
          </p>
          <p className="hint" style={{ textAlign: 'left', margin: '0 0 30px' }}>
            The ring needs to be <i>just right</i> — and with luck, they&apos;ve already designed
            theirs and placed it in the vault. Let&apos;s find out. Don&apos;t know much about
            jewelry? Not to worry. We&apos;ll help you every step of the way.
          </p>
          <button className="btn" onClick={() => setStage('search')}>Begin</button>
        </div>
      )}

      {stage === 'search' && (
        <form className="review-box gate" onSubmit={search}>
          <div className="subhead" style={{ marginTop: 0 }}><span className="cap">Their Full Name</span></div>
          <input type="text" required placeholder="Julia Martin" value={name}
                 onChange={(e) => setName(e.target.value)} />
          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Searching…' : 'Search the Vault'}
          </button>
          {err && <div className="msg err">{err}</div>}
          <div className="msg" style={{ color: 'var(--grey)' }}>
            Only vaults whose owner chose to be discoverable can be found.
          </div>
        </form>
      )}

      {stage === 'verify' && (
        <form className="review-box gate" onSubmit={verify}>
          <div style={{
            border: '1px solid var(--gold)', background: 'var(--champagne)',
            padding: '16px 20px', marginBottom: 26, fontStyle: 'italic',
            color: 'var(--gold-deep)', textAlign: 'center'
          }}>
            Good news — a ring is waiting under that name.
          </div>

          <p className="hint" style={{ textAlign: 'left', margin: '0 0 22px' }}>
            They chose these questions to confirm it&apos;s really you asking.
          </p>

          {questions.includes('dob') && (
            <>
              <div className="subhead" style={{ marginTop: 0 }}><span className="cap dim">Their Date of Birth</span></div>
              <input type="text" placeholder="MM / DD / YYYY" value={dob} onChange={(e) => setDob(e.target.value)} />
            </>
          )}
          {questions.includes('middle') && (
            <>
              <div className="subhead"><span className="cap dim">Their Middle Name</span></div>
              <input type="text" placeholder="Middle name" value={middle} onChange={(e) => setMiddle(e.target.value)} />
            </>
          )}
          {questions.includes('school') && (
            <>
              <div className="subhead"><span className="cap dim">Their High School</span></div>
              <input type="text" placeholder="High school" value={school} onChange={(e) => setSchool(e.target.value)} />
            </>
          )}

          <div className="subhead"><span className="cap dim">Your Email</span></div>
          <input type="email" required placeholder="you@email.com" value={suitorEmail}
                 onChange={(e) => setSuitorEmail(e.target.value)} />

          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
          {err && <div className="msg err">{err}</div>}
        </form>
      )}

      {stage === 'failed' && (
        <div className="review-box">
          <p className="hint" style={{ textAlign: 'left', margin: '0 0 26px' }}>
            Those answers didn&apos;t match what they gave us. For their privacy we can&apos;t say
            which one — but you&apos;re welcome to try again.
          </p>
          <button className="btn" onClick={() => { setStage('verify'); setErr(''); }}>Try Again</button>
        </div>
      )}

      {stage === 'unlock' && (
        <div className="review-box">
          <p className="hint" style={{ textAlign: 'left', margin: '0 0 24px' }}>
            Verified. Their complete ring — every preference, their note to you, and a
            jeweler-ready document — is one step away.
          </p>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--line)',
            padding: '22px 2px', margin: '0 0 8px'
          }}>
            <span style={{ fontSize: 20 }}>Their Perfect Ring</span>
            <span style={{ fontSize: 20 }}>$19.99</span>
          </div>
          <p className="msg" style={{ color: 'var(--grey)', marginBottom: 26 }}>
            Full specification · Their inspiration notes · Jeweler-ready document · Local jeweler introductions
          </p>
          <a className="btn" href={`/deliverable?token=${token}`}>Continue</a>
        </div>
      )}

      {stage === 'notfound' && (
        <div className="review-box">
          {!leadSent ? (
            <>
              <p className="hint" style={{ textAlign: 'left', margin: '0 0 22px' }}>
                No vault under that name — either they haven&apos;t designed a ring yet, or they
                chose to stay private. We have a few discreet ways to help, without them ever
                knowing you asked:
              </p>
              {[
                ['direct', 'Invite them directly, by email'],
                ['advertise', "Let them encounter an advertisement — never mentioning you"],
                ['friend', 'Whisper a hint to a friend of theirs'],
                ['none', 'Nothing for now — just tell me when they register']
              ].map(([val, label]) => (
                <label key={val} className="radio-row" style={{ display: 'block', padding: '15px 20px', border: '1px solid var(--line)', marginBottom: 9, cursor: 'pointer' }}>
                  <input type="radio" name="prompt" value={val} checked={promptChoice === val}
                         onChange={() => setPromptChoice(val as string)} style={{ marginRight: 12 }} />
                  {label}
                </label>
              ))}
              <div className="subhead"><span className="cap dim">Your email — we&apos;ll write the moment they register</span></div>
              <input type="email" required placeholder="you@email.com" value={suitorEmail}
                     onChange={(e) => setSuitorEmail(e.target.value)}
                     style={{ width: '100%', padding: 14, border: '1px solid var(--ink)', marginBottom: 14, fontFamily: 'inherit', fontSize: 17 }} />
              <button className="btn" onClick={sendLead} disabled={busy || !suitorEmail}>
                {busy ? 'Saving…' : 'Notify Me'}
              </button>
            </>
          ) : (
            <p className="hint" style={{ textAlign: 'left', margin: 0 }}>
              Done. We&apos;ll be in touch the moment there&apos;s a ring to find — and we&apos;ll
              be discreet about it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
