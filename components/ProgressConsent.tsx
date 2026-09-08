'use client';
import { useEffect, useState } from 'react';

const KEY = 'ringvault-progress-v1';
export default function ProgressConsent({step}: {step: string}) {
  const [session, setSession] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (saved?.id && saved?.expires > Date.now()) setSession(saved.id);
      else sessionStorage.removeItem(KEY);
    } catch { /* Optional measurement never blocks the questionnaire. */ }
  }, []);
  useEffect(() => {
    if (!session) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (saved?.expires <= Date.now()) { setSession(null); sessionStorage.removeItem(KEY); return; }
    } catch {}
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    void fetch('/api/progress', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({session,step}), signal: controller.signal
    }).catch(() => {}).finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [session,step]);
  function choose(enabled: boolean) {
    if (!enabled) {
      setSession(null);
      try { sessionStorage.removeItem(KEY); } catch {}
      return;
    }
    const id = crypto.randomUUID();
    setSession(id);
    try { sessionStorage.setItem(KEY, JSON.stringify({id,expires:Date.now()+86400000})); } catch {}
  }
  return <label style={{display:'flex',gap:10,alignItems:'flex-start',fontSize:13,lineHeight:1.6,margin:'24px 0'}}>
    <input type="checkbox" checked={!!session} onChange={e=>choose(e.target.checked)} style={{marginTop:5}} />
    <span>Help improve Ring Vault by sharing which steps I visit. Optional; no ring choices, photos, names or emails are included. Uncheck to stop future tracking. <a href="/privacy">Privacy details</a></span>
  </label>;
}
