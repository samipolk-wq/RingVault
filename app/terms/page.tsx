export const metadata = {
  title: 'Terms of Service — The Ring Vault',
  description: 'The agreement between you and The Ring Vault.'
};

const P = { margin: '0 0 18px', lineHeight: 1.7 } as const;
const H = { fontSize: 22, fontWeight: 400, margin: '44px 0 16px' } as const;

export default function Terms() {
  return (
    <div className="shell" style={{ maxWidth: 700 }}>
      <div className="wtop">
        <span className="cap dim">Last updated August 2026</span>
        <span className="cap">Terms</span>
      </div>

      <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 300, marginBottom: 26 }}>
        Terms of <em>Service</em>
      </h1>

      <p style={{ ...P, fontSize: 19 }}>
        By using The Ring Vault you agree to what follows. We have tried to write it in plain
        language rather than the usual fog.
      </p>

      <h2 style={H}>What this service is</h2>
      <p style={P}>
        The Ring Vault lets you record the engagement ring you want, keep it private, and — if you
        choose — allow someone who can verify who they are to purchase access to that record.
      </p>
      <p style={P}>
        We do not sell rings. We do not make rings. We are not a jeweler, an appraiser, or a broker.
        What a suitor buys is a document describing what you said you wanted. What happens next is
        between them and whichever jeweler they take it to.
      </p>

      <h2 style={H}>You must be 18</h2>
      <p style={P}>
        This service is for adults only. If you are under 18, do not use it.
      </p>

      <h2 style={H}>Verification has limits, and you should understand them</h2>
      <p style={P}>
        If you make your vault findable, you choose the questions someone must answer to unlock your
        design. We check their answers against yours and refuse anyone who gets them wrong. We limit
        how many times anyone may try.
      </p>
      <p style={P}>
        But we cannot confirm that a person is who they claim to be. Somebody who genuinely knows
        your date of birth, middle name and high school will pass — and that may include people you
        would not have chosen. Choose questions accordingly, and remember that the answers most
        easily discovered are the least protective.
      </p>
      <p style={P}>
        You may block specific people, you may switch findability off at any time, and you may
        delete your design entirely.
      </p>

      <h2 style={H}>Photographs you upload</h2>
      <p style={P}>
        You are responsible for the images you add. By uploading one you confirm you have the right
        to do so, and you grant us permission to store it and to show it to someone who has
        purchased access to your design — and to nobody else.
      </p>
      <p style={P}>
        Many ring photographs found online belong to jewelers or photographers. Using one as a
        private reference is ordinary practice; we mention it only so you know we do not check
        provenance, and we may remove any image on the request of its owner.
      </p>

      <h2 style={H}>What suitors may and may not do</h2>
      <p style={P}>
        If you purchase access to a design, it is for the purpose of buying that person a ring. You
        may share it with a jeweler. You may not publish it, sell it, or pass it to anyone else.
      </p>
      <p style={P}>
        Do not attempt to unlock a vault belonging to someone whose partner you are not. Do not
        attempt to guess answers systematically. We monitor for this and will close accounts that do
        it.
      </p>

      <h2 style={H}>Payment</h2>
      <p style={P}>
        Unlocking a design costs $49.99, charged once, through Stripe. Searching is free. Designing
        a ring is free and always will be.
      </p>
      <p style={P}>
        See our <a className="ulink" href="/refunds">refund policy</a> for when we will return your
        money.
      </p>

      <h2 style={H}>Things we do not promise</h2>
      <p style={P}>
        That anyone will search for you. That anyone will propose. That a jeweler can make exactly
        what you described, or at a price anyone expects. That the person who unlocks your design is
        the person you hoped would. That the service will be available without interruption.
      </p>
      <p style={P}>
        The service is provided as it is. To the extent the law allows, we are not liable for
        indirect or consequential losses, and our total liability to you is limited to what you have
        paid us.
      </p>

      <h2 style={H}>Ending it</h2>
      <p style={P}>
        You may delete your design and close your account whenever you like. We may suspend accounts
        that break these terms, attempt to breach someone&apos;s vault, or use the service to
        harass.
      </p>

      <h2 style={H}>Governing law</h2>
      <p style={P}>
        These terms are governed by the laws of the State of California.
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
