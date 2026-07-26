export default function Home() {
  return (
    <div className="shell" style={{ textAlign: 'center', paddingTop: 100 }}>
      <div className="cap">The Ring Vault</div>
      <h1 style={{ fontSize: 'clamp(38px, 5vw, 56px)', fontWeight: 300, margin: '26px 0 8px', lineHeight: 1.15 }}>
        They buy the ring.<br />But you wear it.<br /><em>Forever.</em>
      </h1>
      <p className="hint" style={{ maxWidth: 460, margin: '22px auto 44px' }}>
        Design your dream engagement ring — stone, cut, band, setting. We keep it safe in the
        vault until they&apos;re ready to propose, so they buy exactly the right ring.
      </p>
      <a className="btn" href="/design">Design Your Ring</a>
      <p className="msg" style={{ color: 'var(--grey)', marginTop: 22 }}>
        Free to design · Always private
      </p>
      <p style={{ marginTop: 34 }}>
        <a className="ulink" href="/enter">Already have a ring in the vault?</a>
      </p>
    </div>
  );
}
