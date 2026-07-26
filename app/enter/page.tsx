'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function EnterPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setErr('');
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/vault` }
      });
      if (error) throw error;
      setState('sent');
    } catch (e: unknown) {
      setState('error');
      setErr(e instanceof Error ? e.message : 'Could not send the link.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="shell" style={{ textAlign: 'center', paddingTop: 120, maxWidth: 620 }}>
        <div className="cap">The Ring Vault</div>
        <h1 style={{ fontSize: 42, fontWeight: 300, margin: '24px 0 16px' }}>
          Check your <em>email.</em>
        </h1>
        <p className="hint" style={{ maxWidth: 420, margin: '0 auto' }}>
          We&apos;ve sent a private link to {email}. Open it and your vault will unlock — no
          password to remember, ever.
        </p>
      </div>
    );
  }

  return (
    <div className="shell" style={{ maxWidth: 560, paddingTop: 110 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="cap">Your Vault</div>
        <h1 style={{ fontSize: 40, fontWeight: 300, margin: '22px 0 14px' }}>
          Enter the <em>vault.</em>
        </h1>
        <p className="hint" style={{ maxWidth: 420, margin: '0 auto 40px' }}>
          Enter your email and we&apos;ll send a private link. No passwords — your ring stays
          yours alone.
        </p>
      </div>

      <form onSubmit={send} className="review-box gate">
        <div className="subhead" style={{ marginTop: 0 }}><span className="cap">Email</span></div>
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" style={{ width: '100%' }} type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send My Private Link'}
        </button>
        {state === 'error' && <div className="msg err">{err}</div>}
        <div className="msg" style={{ color: 'var(--grey)' }}>
          Free · Private · Yours to change anytime
        </div>
      </form>
    </div>
  );
}
