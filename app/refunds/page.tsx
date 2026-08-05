export const metadata = {
  title: 'Refund Policy — The Ring Vault',
  description: 'When we return your money, and how to ask.'
};

const P = { margin: '0 0 18px', lineHeight: 1.7 } as const;
const H = { fontSize: 22, fontWeight: 400, margin: '44px 0 16px' } as const;

export default function Refunds() {
  return (
    <div className="shell" style={{ maxWidth: 700 }}>
      <div className="wtop">
        <span className="cap dim">Last updated August 2026</span>
        <span className="cap">Refunds</span>
      </div>

      <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 300, marginBottom: 26 }}>
        Refund <em>Policy</em>
      </h1>

      <p style={{ ...P, fontSize: 19 }}>
        Unlocking a design costs $49.99 and is delivered immediately, which makes refunds awkward in
        the usual way digital goods are. Here is our position, plainly.
      </p>

      <h2 style={H}>We will refund you if</h2>
      <p style={P}>
        <b>Something broke.</b> You paid and the design never appeared, or the link never worked, or
        the photographs were missing. Write to us and we will either fix it or refund you — your
        choice.
      </p>
      <p style={P}>
        <b>You were charged twice</b> for the same vault. Always refunded.
      </p>
      <p style={P}>
        <b>The design is effectively empty.</b> If someone placed a ring in the vault with almost
        nothing filled in and you paid to see it, that is not what we sold you. Tell us and we will
        refund you.
      </p>
      <p style={P}>
        <b>You paid within the last 48 hours and haven&apos;t opened the design.</b> If you changed
        your mind and never looked, we will refund you and re-seal the vault.
      </p>

      <h2 style={H}>We will not refund you if</h2>
      <p style={P}>
        <b>You have seen the design and simply did not like what you found.</b> The specification is
        what she asked for. We are not able to unsee it on your behalf.
      </p>
      <p style={P}>
        <b>The proposal did not go as you hoped</b>, or the relationship ended, or you decided not to
        buy a ring after all. We understand these are genuinely difficult circumstances, and they are
        outside what this $49.99 covers.
      </p>
      <p style={P}>
        <b>A jeweler quoted more than you expected</b>, or told you the design was impractical. We
        record what she wants; we do not price it or vouch for its feasibility.
      </p>
      <p style={P}>
        <b>You unlocked the wrong person&apos;s vault</b> because you knew enough to pass their
        verification. Do not do this.
      </p>

      <h2 style={H}>If she removes her design after you paid</h2>
      <p style={P}>
        She may delete or change her ring at any time — that is her right, and it does not entitle
        you to a refund, because what you bought was access to what she had recorded at the time you
        bought it. If she deletes it before you have opened it, write to us and we will refund you.
      </p>

      <h2 style={H}>What happens when we refund</h2>
      <p style={P}>
        The vault is re-sealed automatically and your link stops working. Money returns to the
        original card, typically within five to ten business days depending on your bank.
      </p>

      <h2 style={H}>How to ask</h2>
      <p style={P}>
        Email <b>hello@ringvault.co</b> with the email address you used to pay. You do not need to
        justify yourself at length. We would rather refund a borderline case than argue with you
        about it.
      </p>

      <p className="msg" style={{ color: 'var(--grey)', marginTop: 50 }}>
        <a className="ulink" href="/">Return home</a>
      </p>
    </div>
  );
}
