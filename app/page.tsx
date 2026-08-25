const css = `.hero{display:grid;grid-template-columns:1fr;gap:44px;align-items:center;max-width:1180px;margin:0 auto;padding:60px 26px 40px}.hero-copy{text-align:center}.hero-you{border-bottom:2px solid var(--gold);padding-bottom:2px}.hero-lede{font-size:clamp(19px,2.1vw,23px);line-height:1.55;color:var(--ink);margin:22px 0 0;max-width:430px}.hero-copy .hero-lede{margin-left:auto;margin-right:auto}.hero-turn{font-style:italic;color:var(--gold-deep);margin-top:10px}.hero-how{font-family:var(--font-sans),sans-serif;font-weight:300;font-size:13.5px;line-height:1.7;color:var(--grey);margin:30px 0 0;max-width:400px}.hero-copy .hero-how{margin-left:auto;margin-right:auto}.hero-art{position:relative;justify-self:center;width:100%;max-width:530px}.hero-art::before{content:'';position:absolute;inset:18px -18px -18px 18px;background:var(--champagne);z-index:0}.hero-art img{position:relative;z-index:1;display:block;width:100%;height:auto;border:1px solid var(--line)}@media(min-width:900px){.hero{grid-template-columns:0.92fr 1.08fr;gap:64px;padding:90px 40px 64px}.hero-copy{text-align:left}.hero-copy .hero-lede,.hero-copy .hero-how{margin-left:0;margin-right:0}}`;

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="hero">
        <div className="hero-copy">
          <div className="cap">The Ring Vault</div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 300, margin: '22px 0 0', lineHeight: 1.1 }}>
            <span className="hero-you">Your</span> engagement ring.
          </h1>
          <p className="hero-lede">You&apos;ll wear it forever, but someone else buys it.</p>
          <p className="hero-lede hero-turn">Let them know what you truly want.</p>
          <p className="hero-how">Answer ten questions about the ring you actually want — the stone, the cut, the words hidden inside. It waits in the vault until they come looking.</p>
          <p style={{ marginTop: 32 }}><a className="btn" href="/design">Tell Them What You Want</a></p>
          <p className="msg" style={{ color: 'var(--grey)', marginTop: 22 }}>Free · Private · Nobody sees it until you decide</p>
          <p style={{ marginTop: 28 }}><a className="ulink" href="/enter">Already have a ring in the vault?</a></p>
          <p style={{ marginTop: 20 }}><a className="ulink" href="/suitors">Looking for someone&apos;s ring?</a></p>
        </div>
        <div className="hero-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero.jpg" alt="A classic four-prong solitaire engagement ring with a large round diamond on a thin band" width={1254} height={1254} loading="eager" />
        </div>
      </div>
    </>
  );
}
