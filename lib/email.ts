/**
 * Email delivery. Resend in production; console in dev when no key is set,
 * so the whole notification flow can be exercised locally without sending
 * real mail. Swapping providers means editing only this file.
 */

export type SendResult = { ok: true } | { ok: false; error: string };

export function fromAddress(): string {
  return process.env.EMAIL_FROM || 'The Ring Vault <hello@ringvault.co>';
}

export function replyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Dev fallback: log instead of sending.
    console.log('\n--- EMAIL (not sent, RESEND_API_KEY unset) ---');
    console.log(`To: ${opts.to}\nSubject: ${opts.subject}\n\n${opts.text}\n`);
    return { ok: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(replyToAddress() ? { reply_to: replyToAddress() } : {})
      })
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}
