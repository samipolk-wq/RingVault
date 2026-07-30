/**
 * Email templates. Each takes a payload and returns subject + html + text.
 * Styling is inlined (email clients strip <style>) and deliberately restrained:
 * the champagne palette, the serif logotype, one action per message.
 */

const PAPER = '#fdfcf9';
const INK = '#26221a';
const GREY = '#847d6f';
const LINE = '#e9e3d4';
const GOLD = '#8c7244';

function shell(body: string, footer?: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${PAPER};">
<div style="max-width:520px;margin:0 auto;padding:48px 28px;font-family:Georgia,'Times New Roman',serif;color:${INK};">
  <div style="text-align:center;padding-bottom:34px;border-bottom:1px solid ${LINE};">
    <span style="font-size:15px;letter-spacing:0.42em;text-transform:uppercase;color:${INK};">The Ring Vault</span>
  </div>
  <div style="padding:38px 0;font-size:17px;line-height:1.65;">${body}</div>
  <div style="padding-top:26px;border-top:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:${GREY};">
    ${footer || 'You are receiving this because you have a ring in the vault.'}
  </div>
</div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<div style="text-align:center;padding:34px 0 10px;">
    <a href="${href}" style="display:inline-block;background:${INK};color:${PAPER};text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;padding:17px 36px;">${label}</a>
  </div>`;
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type Built = { subject: string; html: string; text: string };
type Payload = Record<string, unknown>;

const UNSUB = (email: string) =>
  `Don't want these? Reply with "stop" and we'll remove ${esc(email)}.`;

export const TEMPLATES: Record<string, (p: Payload) => Built> = {
  /**
   * To her, on deposit. Transactional — sends regardless of preference,
   * because it carries the link she needs to get back in.
   */
  deposit_confirmed: (p) => {
    const link = esc(p.vaultUrl);
    return {
      subject: 'Your ring is in the vault',
      html: shell(
        `<p style="margin:0 0 18px;">Your ring is safe.</p>
         <p style="margin:0 0 18px;color:${GREY};">Every detail you chose — the stone, the cut, the band, the setting, the words inside — is sealed in the vault under this email address. Nothing is public, and nobody can see it unless you decide to be found.</p>
         <p style="margin:0;color:${GREY};">Open your vault any time to visit it, change your mind about a detail, or decide who can find you.</p>
         ${button(link, 'Open My Vault')}
         <p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${GREY};text-align:center;">This link signs you in — no password to remember.</p>`
      ),
      text: `Your ring is safe.\n\nEvery detail you chose is sealed in the vault under this email address. Nothing is public, and nobody can see it unless you decide to be found.\n\nOpen your vault: ${p.vaultUrl}\n\nThis link signs you in — no password to remember.`
    };
  },

  /**
   * To her, when someone fails her verification questions.
   * Sent in 'everything' and 'discreet' modes: it's a privacy event, not a
   * spoiler, so even the surprise-preserving setting gets it.
   */
  verify_failed: (p) => ({
    subject: 'Someone tried to open your vault',
    html: shell(
      `<p style="margin:0 0 18px;">Someone searched for you and couldn&rsquo;t answer your questions.</p>
       <p style="margin:0 0 18px;color:${GREY};">They entered the name <b style="color:${INK};">${esc(p.actorName) || 'no name'}</b>${p.actorEmail ? ` and the email <b style="color:${INK};">${esc(p.actorEmail)}</b>` : ''}. Your design stayed sealed — they saw nothing.</p>
       <p style="margin:0;color:${GREY};">If this wasn&rsquo;t someone you&rsquo;d want opening your vault, you can add them to your block list or hide your vault entirely.</p>
       ${button(esc(p.vaultUrl), 'Review My Settings')}`
    ),
    text: `Someone searched for you and couldn't answer your questions.\n\nThey entered the name ${p.actorName || 'no name'}${p.actorEmail ? ` and the email ${p.actorEmail}` : ''}. Your design stayed sealed — they saw nothing.\n\nIf this wasn't someone you'd want opening your vault, you can block them or hide your vault: ${p.vaultUrl}`
  }),

  /**
   * To her, when someone passes verification. Spoiler territory —
   * 'everything' mode only.
   */
  verify_passed: (p) => ({
    subject: 'Someone answered your questions',
    html: shell(
      `<p style="margin:0 0 18px;">${esc(p.actorName) || 'Someone'} answered your questions correctly.</p>
       <p style="margin:0 0 18px;color:${GREY};">You asked us to tell you everything, so: they&rsquo;re at the door of your vault${p.actorEmail ? `, using the email <b style="color:${INK};">${esc(p.actorEmail)}</b>` : ''}.</p>
       <p style="margin:0;color:${GREY};">If you&rsquo;d rather stop hearing about this and let the rest be a surprise, you can change that in your vault.</p>
       ${button(esc(p.vaultUrl), 'Open My Vault')}`
    ),
    text: `${p.actorName || 'Someone'} answered your questions correctly.\n\nYou asked us to tell you everything, so: they're at the door of your vault${p.actorEmail ? `, using the email ${p.actorEmail}` : ''}.\n\nTo stop hearing about this and let the rest be a surprise, change your setting: ${p.vaultUrl}`
  }),

  /**
   * To her, when a vault is unlocked. The biggest spoiler there is —
   * 'everything' mode only.
   */
  unlock_paid: (p) => ({
    subject: 'Your ring has been unlocked',
    html: shell(
      `<p style="margin:0 0 18px;">${esc(p.actorName) || 'Someone'} unlocked your ring.</p>
       <p style="margin:0 0 18px;color:${GREY};">They now have your full design — every detail, exactly as you chose it — to take to a jeweler.</p>
       <p style="margin:0;color:${GREY};">You asked to be told everything. We&rsquo;ll say nothing more.</p>`
    ),
    text: `${p.actorName || 'Someone'} unlocked your ring.\n\nThey now have your full design — every detail, exactly as you chose it — to take to a jeweler.\n\nYou asked to be told everything. We'll say nothing more.`
  }),

  /**
   * To the suitor, on payment. Transactional: this link is his only
   * permanent copy of the deliverable.
   */
  unlock_deliverable: (p) => ({
    subject: `${esc(p.herFirstName) || 'Her'}'s ring — unlocked`,
    html: shell(
      `<p style="margin:0 0 18px;">Here it is.</p>
       <p style="margin:0 0 18px;color:${GREY};">${esc(p.herFirstName) || 'She'} designed this herself — the stone, the cut, the band, the setting, the words inside. Take it to any jeweler and they will know exactly what to make.</p>
       ${button(esc(p.unlockUrl), 'Open Her Design')}
       <p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${GREY};text-align:center;">Keep this link private. It doesn&rsquo;t expire.</p>`,
      `A receipt for ${esc(p.priceLabel)} was sent separately by Stripe. Questions? Just reply to this email.`
    ),
    text: `Here it is.\n\n${p.herFirstName || 'She'} designed this herself — the stone, the cut, the band, the setting, the words inside. Take it to any jeweler and they will know exactly what to make.\n\nOpen her design: ${p.unlockUrl}\n\nKeep this link private. It doesn't expire.\n\nA receipt for ${p.priceLabel} was sent separately by Stripe.`
  }),

  /**
   * To a suitor who searched too early, once she deposits.
   * The growth loop from the original spec.
   */
  lead_she_deposited: (p) => ({
    subject: 'She designed her ring',
    html: shell(
      `<p style="margin:0 0 18px;">You searched for ${esc(p.searchedName)} a while ago. There was nothing to find.</p>
       <p style="margin:0 0 18px;color:${GREY};">There is now. Her ring is in the vault — every detail chosen by her.</p>
       <p style="margin:0;color:${GREY};">Answer a few questions only her partner would know, and it&rsquo;s yours to take to a jeweler.</p>
       ${button(esc(p.suitorUrl), 'Open the Vault')}`,
      `You asked us to tell you when this happened. ${UNSUB(String(p.toEmail || ''))}`
    ),
    text: `You searched for ${p.searchedName} a while ago. There was nothing to find.\n\nThere is now. Her ring is in the vault — every detail chosen by her.\n\nAnswer a few questions only her partner would know, and it's yours to take to a jeweler: ${p.suitorUrl}\n\nYou asked us to tell you when this happened.`
  })
};

export function buildEmail(template: string, payload: Payload): Built | null {
  const fn = TEMPLATES[template];
  return fn ? fn(payload) : null;
}
