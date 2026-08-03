export default function Home() {
  return (
    <div className="shell" style={{ textAlign: 'center', paddingTop: 100 }}>
      <div className="cap">The Ring Vault</div>
      <h1 style={{ fontSize: 'clamp(38px, 5vw, 56px)', fontWeight: 300, margin: '26px 0 8px', lineHeight: 1.15 }}>
        You&apos;ll wear it every day<br />for the rest of your life.<br /><em>So be bold. Say what you truly want.</em>
      </h1>
      <p className="hint" style={{ maxWidth: 460, margin: '22px auto 44px' }}>
        Design it yourself — the stone, the cut, the band, the words hidden inside. Every detail
        exactly as you want it. We keep it in the vault until they come looking.
      </p>
      <a className="btn" href="/design">Design Your Ring</a>
      <p className="msg" style={{ color: 'var(--grey)', marginTop: 22 }}>
        Free · Private · Nobody sees it until you decide
      </p>
      <p style={{ marginTop: 34 }}>
        <a className="ulink" href="/enter">Already have a ring in the vault?</a>
      </p>
    </div>
  );
}
