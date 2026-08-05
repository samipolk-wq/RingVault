export const metadata = {
  title: 'Privacy Policy — The Ring Vault',
  description: 'What we collect, why, and what we never do with it.'
};

const P = { margin: '0 0 18px', lineHeight: 1.7 } as const;
const H = { fontSize: 22, fontWeight: 400, margin: '44px 0 16px' } as const;

export default function Privacy() {
  return (
    <div className="shell" style={{ maxWidth: 700 }}>
      <div className="wtop">
        <span className="cap dim">Last updated August 2026</span>
        <span className="cap">Privacy</span>
      </div>

      <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 300, marginBottom: 26 }}>
        Privacy <em>Policy</em>
      </h1>

      <p style={{ ...P, fontSize: 19 }}>
        You are telling us what you want your engagement ring to look like, before anyone has
        proposed. That is unusually personal information, and this page explains exactly what
        happens to it.
      </p>

      <h2 style={H}>The short version</h2>
      <p style={P}>
        Your ring design is private by default. Nobody can find you unless you choose to be
        findable. Nobody can see your design unless they answer questions you set and pay for it.
        We do not sell your information, we do not advertise to you, and we do not share your
        design with jewelers, retailers, or anyone else.
      </p>

      <h2 style={H}>What we collect</h2>
      <p style={P}>
        <b>Your ring design</b> — the stones, cuts, metals, settings, sizes, inscription and
        proposal preferences you select, plus any notes you write and photographs you upload.
      </p>
      <p style={P}>
        <b>Your email address</b> — so you can return to your vault, and so we can send you the
        messages described below.
      </p>
      <p style={P}>
        <b>Verification answers</b> — if you choose to be findable, we ask for your full name and
        at least two of: your date of birth, your middle name, and your high school. Your name is
        stored as text, because it has to be searchable. <b>The answers are not.</b> We store only
        a one-way cryptographic hash of each one, which means we can check whether someone&apos;s
        guess matches without ever being able to read the answer ourselves. If our database were
        stolen tomorrow, those answers would not be in it.
      </p>
      <p style={P}>
        <b>If you are a suitor</b> — your email address, and a record of your searches, attempts
        and purchases.
      </p>
      <p style={P}>
        <b>Technical information</b> — IP addresses attached to failed verification attempts, so we
        can stop somebody guessing their way into your vault.
      </p>

      <h2 style={H}>What being &ldquo;findable&rdquo; actually means</h2>
      <p style={P}>
        This is the part worth reading twice. If you make your vault findable, then someone who
        searches your full name will learn that a vault exists in that name. They will not see your
        design, your photographs, your notes, or anything else — but they will know you have made
        one.
      </p>
      <p style={P}>
        That is a real disclosure. It reveals that you are anticipating a proposal, to anybody who
        thinks to look. Only choose to be findable if you are comfortable with that, and you can
        switch it off at any time from your vault.
      </p>

      <h2 style={H}>What we send you</h2>
      <p style={P}>
        A confirmation when you place a ring in the vault. Sign-in links when you ask for one. And,
        depending on the notification setting you choose, messages about activity on your vault —
        including whether someone failed your verification questions. You control that setting, and
        one option is complete silence.
      </p>
      <p style={P}>We do not send marketing email.</p>

      <h2 style={H}>Who else touches your information</h2>
      <p style={P}>
        We use a small number of service providers, and only for the purpose described:
      </p>
      <p style={P}>
        <b>Supabase</b> stores our database and photographs. <b>Netlify</b> hosts the site.{' '}
        <b>Stripe</b> processes payments — we never see or store card numbers. <b>Resend</b> sends
        our email. Each holds your information under its own privacy terms, and none is permitted to
        use it for their own purposes.
      </p>

      <h2 style={H}>Photographs</h2>
      <p style={P}>
        Photographs you upload are stored privately. They are never publicly accessible, and links
        to them are generated only for someone who has paid to unlock your design, and expire.
      </p>

      <h2 style={H}>How long we keep it</h2>
      <p style={P}>
        Your design stays in the vault until you delete it. Photographs uploaded during a design
        you never completed are removed after a short period. Payment records are retained as long
        as tax and accounting rules require.
      </p>

      <h2 style={H}>Your choices</h2>
      <p style={P}>
        You can change or delete your ring at any time, switch findability off, change what we
        email you, and ask us to delete your account entirely. To do the last one, write to{' '}
        <b>hello@ringvault.co</b> and we will remove your design, your photographs, your
        verification hashes and your email address.
      </p>
      <p style={P}>
        If you are in California, the EU, or the UK, you have additional statutory rights over your
        personal information, including rights of access and deletion. Write to the same address
        and we will honour them.
      </p>

      <h2 style={H}>Children</h2>
      <p style={P}>
        The Ring Vault is for adults. Do not use it if you are under 18.
      </p>

      <h2 style={H}>Changes</h2>
      <p style={P}>
        If we change this policy in a way that materially affects what happens to your information,
        we will email you rather than quietly updating this page.
      </p>

      <h2 style={H}>Contact</h2>
      <p style={P}>
        <b>hello@ringvault.co</b>
      </p>

      <p className="msg" style={{ color: 'var(--grey)', marginTop: 50 }}>
        <a className="ulink" href="/">Return home</a>
      </p>
    </div>
  );
}
