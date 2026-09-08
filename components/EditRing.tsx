'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { STEPS } from '@/lib/taxonomy';

type Ring = { id: string; selections: Record<string, string>; note: string | null };
const groups = STEPS.flatMap(step => step.groups || []);

export default function EditRingPage() {
  const [ring, setRing] = useState<Ring | null>(null);
  const [owner, setOwner] = useState('');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const id = new URLSearchParams(window.location.search).get('id');
        if (!id) throw new Error('Open your vault and choose Refine My Ring to edit a saved ring.');
        const sb = supabaseBrowser();
        const { data: { user }, error: authError } = await sb.auth.getUser();
        if (authError || !user) throw new Error('Please sign in, then open this ring from your vault.');
        const { data, error: readError } = await sb.from('designs')
          .select('id,selections,note').eq('id', id).eq('user_id', user.id).limit(1);
        if (readError) throw new Error('Could not load your ring. Please try again.');
        if (!data?.length) throw new Error('This ring is not available in your account.');
        if (!active) return;
        const saved = data[0] as Ring;
        setRing(saved); setOwner(user.id); setSelections(saved.selections || {});
        setNote(saved.note || ''); setState('ready');
      } catch (e) {
        if (active) { setError(e instanceof Error ? e.message : 'Could not load your ring.'); setState('error'); }
      }
    })();
    return () => { active = false; };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ring || state === 'saving') return;
    setState('saving'); setError('');
    try {
      const sb = supabaseBrowser();
      const { data: { user }, error: authError } = await sb.auth.getUser();
      if (authError || user?.id !== owner) throw new Error('Your sign-in changed. Reopen the ring from your vault.');
      // Update the same record. RLS and the owner filter both enforce ownership.
      // Photos, privacy settings and existing buyer links remain attached to it.
      const { data, error: saveError } = await sb.from('designs')
        .update({ selections, note }).eq('id', ring.id).eq('user_id', owner).select('id');
      if (saveError || data?.length !== 1) throw new Error('Your changes were not saved. Please try again.');
      setState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your changes.'); setState('ready');
    }
  }

  if (state === 'loading') return <div className="shell"><p role="status">Opening your saved ring…</p></div>;
  if (!ring) return <div className="shell"><h1>Open your vault first</h1><p role="alert">{error}</p><a className="btn" href="/vault">Open My Vault</a></div>;

  const fields = Array.from(new Set([...groups.map(g => g.field), 'Min Carat', 'Dream Carat', 'Connoisseur Details', ...Object.keys(selections)]))
    .filter(field => field !== 'Photos');
  return (
    <div className="shell" style={{ maxWidth: 760 }}>
      <a className="ulink" href="/vault">Back to My Vault</a>
      <h1 style={{ fontWeight: 300, margin: '28px 0 16px' }}>Refine <em>your ring.</em></h1>
      <p className="hint" style={{ textAlign: 'left' }}>Your saved choices are below. Change any detail, then save. Anyone with an active paid unlock will see your updated choices when they reopen the ring.</p>
      <form onSubmit={save}>
        <fieldset disabled={state === 'saving'} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="review-box">
            {fields.map((field, index) => {
              const options = groups.find(g => g.field === field)?.opts || [];
              return <div key={field} style={{ marginBottom: 22 }}>
                <label htmlFor={`choice-${index}`} className="cap">{field}</label>
                <input id={`choice-${index}`} className="writein" list={`options-${index}`} value={selections[field] || ''} maxLength={1000}
                  placeholder={field.includes('Carat') ? 'For example, 1.5 ct' : 'Choose or write your preference'}
                  onChange={e => { setSelections(s => ({ ...s, [field]: e.target.value })); setState('ready'); }} />
                {!!options.length && <datalist id={`options-${index}`}>{options.map(o => <option value={o.label} key={o.label} />)}</datalist>}
              </div>;
            })}
            {selections.Photos && <p className="hint" style={{ textAlign: 'left' }}>Saved photos: {selections.Photos}. Your photos stay attached when you save these changes.</p>}
          </div>
          <div className="review-box">
            <label className="cap" htmlFor="ring-note">A Note to Your Suitor</label>
            <textarea id="ring-note" className="writein" maxLength={2000} value={note} onChange={e => { setNote(e.target.value); setState('ready'); }} />
          </div>
          <button className="btn" type="submit">{state === 'saving' ? 'Saving…' : 'Save My Changes'}</button>
        </fieldset>
        {state === 'saved' && <p role="status">Your changes are saved. <a className="ulink" href="/vault">View My Ring</a></p>}
        {error && <p className="msg err" role="alert">{error}</p>}
      </form>
    </div>
  );
}
