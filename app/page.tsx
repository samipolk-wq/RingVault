const css = `.hero{display:grid;grid-template-columns:1fr;gap:44px;align-items:center;max-width:1180px;margin:0 auto;padding:60px 26px 40px}.hero-copy{text-align:center}.hero-art{position:relative;justify-self:center;width:100%;max-width:530px}.hero-art::before{content:'';position:absolute;inset:18px -18px -18px 18px;background:var(--champagne);z-index:0}.hero-art img{position:relative;z-index:1;display:block;width:100%;height:auto;border:1px solid var(--line)}@media(min-width:900px){.hero{grid-template-columns:0.92fr 1.08fr;gap:64px;padding:90px 40px 64px}.hero-copy{text-align:left}.hero-copy .hint{text-align:left;margin-left:0}}`;

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="hero">
        <div className="hero-copy">
          <div className="cap">The Ring Vault</div>
          <h1 style={{ fontSize: 'clamp(34px, 4.6vw, 54px)', fontWeight: 300, margin: '24px 0 8px', lineHeight: 1.14 }}>
            You&apos;ll wear it every day<br />for the rest of your life.<br />
            <em>So be bold. Say what you truly want.</em>
          </h1>
          <p className="hint" style={{ maxWidth: 440, margin: '22px 0 40px' }}>
            Design it yourself — the stone, the cut, the band, the words hidden inside. Every detail exactly as you want it. We keep it in the vault until they come looking.
          </p>
          <a className="btn" href="/design">Design Your Ring</a>
          <p className="msg" style={{ color: 'var(--grey)', marginTop: 22 }}>Free · Private · Nobody sees it until you decide</p>
          <p style={{ marginTop: 30 }}><a className="ulink" href="/enter">Already have a ring in the vault?</a></p>
        </div>
        <div className="hero-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero.jpg" alt="A classic four-prong solitaire engagement ring with a large round diamond on a thin band" width={1254} height={1254} loading="eager" />
        </div>
      </div>
    </>
  );
}
