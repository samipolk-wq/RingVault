export const metadata = { title: 'Find a Jeweler — The Ring Vault' };

export default function JewelersPage() {
  return (
    <div className="shell" style={{ maxWidth: 620, textAlign: 'center' }}>
      <div className="cap">The Atelier Network</div>
      <h1 style={{ fontSize: 'clamp(30px,3.6vw,40px)', fontWeight: 300, margin: '20px 0 16px' }}>
        Bring it to <em>life.</em>
      </h1>
      <p className="hint" style={{ maxWidth: 420, margin: '0 auto 40px' }}>
        Take the printed specification to any jeweler you trust — it contains everything they
        need. We&apos;re assembling a network of vetted jewelers who know The Ring Vault and will
        quote from it directly. Introductions open with our launch.
      </p>
      <a className="btn" href="/">Return Home</a>
    </div>
  );
}
