'use client';

import { useEffect, useState } from 'react';

type Deliverable = {
  paid: boolean;
  name: string | null;
  selections: Record<string, string>;
  note: string | null;
  depositedAt: string;
};

export default function DeliverablePage() {
  const [data, setData] = useState<Deliverable | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'unpaid' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setState('error'); setMsg('This link is missing its key.'); return; }
    (async () => {
      const res = await fetch(`/api/suitor/deliverable?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (res.status === 402) { setState('unpaid'); return; }
      if (!res.ok) { setState('error'); setMsg(json.error || 'That link is not valid.'); return; }
      setData(json);
      setState('ok');
    })();
  }, []);

  if (state === 'loading') {
    return <div className="shell" style={{ textAlign: 'center', paddingTop: 140 }}><p className="hint">Opening…</p></div>;
  }

  if (state === 'unpaid') {
    return (
      <div className="shell" style={{ maxWidth: 560, textAlign: 'center', paddingTop: 120 }}>
        <div className="cap">Almost There</div>
        <h1 style={{ fontSize: 36, fontWeight: 300, margin: '20px 0 14px' }}>One step <em>remains.</em></h1>
        <p className="hint" style={{ maxWidth: 400, margin: '0 auto 30px' }}>
          This ring is still sealed. Complete the payment and it opens immediately — and stays
          open, at this same link, for good.
        </p>
        <a className="btn" href="/suitors">Continue to Payment</a>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return (
      <div className="shell" style={{ maxWidth: 520, textAlign: 'center', paddingTop: 130 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, marginBottom: 14 }}>That link isn&apos;t valid.</h1>
        <p className="hint">{msg}</p>
      </div>
    );
  }

  const rows = Object.entries(data.selections || {});
  const first = (data.name || 'Their').split(' ')[0];

  return (
    <div className="shell" style={{ maxWidth: 700 }}>
      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <p style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--gold-deep)' }}>
          With our compliments — their perfect ring.
        </p>
      </div>

      <div style={{ border: '1px solid var(--gold)', background: '#fff', padding: '46px 42px' }}>
        <h2 style={{
          textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 400,
          fontSize: 11, letterSpacing: '.4em', textTransform: 'uppercase'
        }}>
          {first}&apos;s Perfect Ring
        </h2>
        <div style={{ width: 40, height: 1, background: 'var(--gold)', margin: '20px auto 26px' }} />

        <ul style={{ listStyle: 'none' }}>
          {rows.map(([k, v]) => (
            <li key={k} style={{
              padding: '10px 0', borderBottom: '1px solid var(--champagne)',
              display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 16.5
            }}>
              <span style={{ color: 'var(--grey)', fontStyle: 'italic' }}>{k}</span>
              <b style={{ fontWeight: 500, textAlign: 'right' }}>{v}</b>
            </li>
          ))}
        </ul>

        {data.note && (
          <div style={{
            borderLeft: '1px solid var(--gold)', padding: '6px 0 6px 24px',
            marginTop: 26, fontStyle: 'italic', fontSize: 17, lineHeight: 1.85
          }}>
            {data.note}
            <br />
            <b style={{ fontStyle: 'normal', fontWeight: 500, fontSize: 14 }}>
              — their note, written for you
            </b>
          </div>
        )}

        <p style={{
          textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 9,
          letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--grey)', marginTop: 30
        }}>
          In the vault since {new Date(data.depositedAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 34 }}>
        <button className="btn ghost" onClick={() => window.print()}>Print for Your Jeweler</button>
        &nbsp;&nbsp;
        <a className="btn" href="/jewelers">Find a Local Jeweler</a>
      </div>
    </div>
  );
}
