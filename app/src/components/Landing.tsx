'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';
import Logo from './Logo';

interface LandingProps {
  onConnect: (kind: 'phone' | 'wallet', address?: string) => void;
  onLogout?: () => void;
  theme: string;
  onThemeToggle: (v: string) => void;
  walletAddr?: string;
  invitePoolId?: string | null;
}

export default function Landing({ onConnect, onLogout, theme, onThemeToggle, walletAddr, invitePoolId }: LandingProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'phone' | 'wallet'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState<'input' | 'otp' | 'connecting'>('input');
  // Wallet already approved in the browser extension (detected on mount)
  const [detectedAddr, setDetectedAddr] = useState<string | null>(null);

  // Detect which wallet is currently connected in the extension.
  // Only runs on mount when the parent hasn't told us the wallet state.
  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined') return;
      const w = window as any;
      const phantom = w.phantom?.solana ?? w.solana;
      if (phantom?.isPhantom && phantom.isConnected && phantom.publicKey) {
        setDetectedAddr(phantom.publicKey.toString()); return;
      }
      const solflare = w.solflare;
      if (solflare?.isSolflare && solflare.isConnected && solflare.publicKey) {
        setDetectedAddr(solflare.publicKey.toString()); return;
      }
      const backpack = w.backpack?.solana ?? (w as any).xnft?.solana;
      if (backpack?.isConnected && backpack.publicKey) {
        setDetectedAddr(backpack.publicKey.toString());
      }
    };
    check();
  }, []);

  // When the parent explicitly signals logout (walletAddr === ''), clear any
  // stale detectedAddr so Landing doesn't show the wallet as still connected.
  useEffect(() => {
    if (walletAddr === '') setDetectedAddr(null);
  }, [walletAddr]);

  // walletAddr === ''        → parent said "logged out" — show nothing
  // walletAddr === 'abc...'  → parent said "connected" — show that
  // walletAddr === undefined → parent doesn't know yet — fall back to extension detection
  const connectedAddr = walletAddr === '' ? null : (walletAddr || detectedAddr);

  /**
   * Build a sign-in message that proves wallet ownership.
   * The nonce prevents replay attacks; time is informational.
   */
  const buildSignInMessage = (pubkey: string): Uint8Array => {
    const nonce = Math.random().toString(36).slice(2, 10).toUpperCase();
    return new TextEncoder().encode(
      `Sign in to Circles\nWallet: ${pubkey}\nNonce: ${nonce}\nTime: ${new Date().toISOString()}`
    );
  };

  /**
   * Enter the app using the wallet shown in the nav bar.
   * Always shows the extension approval popup (no silent reconnect).
   * Requires a signed message to prove the user controls the wallet.
   */
  const enterWithDetectedWallet = async () => {
    if (!connectedAddr) return;
    setAuthStep('connecting');
    const w = window as any;
    try {
      const phantom = w.phantom?.solana ?? w.solana;
      if (phantom?.isPhantom) {
        // Regular connect — always shows the wallet popup
        const resp = await phantom.connect();
        const pubkey = resp.publicKey.toString();
        await phantom.signMessage(buildSignInMessage(pubkey), 'utf8');
        onConnect('wallet', pubkey);
        return;
      }
      const solflare = w.solflare;
      if (solflare?.isSolflare) {
        await solflare.connect();
        const pubkey = solflare.publicKey?.toString() ?? connectedAddr;
        await solflare.signMessage(buildSignInMessage(pubkey));
        onConnect('wallet', pubkey);
        return;
      }
      const backpack = w.backpack?.solana ?? w.xnft?.solana;
      if (backpack) {
        const resp = await backpack.connect();
        const pubkey = resp.publicKey?.toString() ?? connectedAddr;
        await backpack.signMessage(buildSignInMessage(pubkey), 'utf8');
        onConnect('wallet', pubkey);
        return;
      }
    } catch {
      // User rejected — open the connect modal instead
      setAuthMode('wallet');
      setAuthStep('input');
      setAuthOpen(true);
      return;
    }
    // Absolute fallback (no extension found)
    setAuthMode('wallet');
    setAuthStep('input');
    setAuthOpen(true);
  };

  const startConnect = (kind: 'phone' | 'wallet') => {
    setAuthMode(kind);
    setAuthStep('input');
    setAuthOpen(true);
  };

  // SMS auth is not yet live — switch user to wallet connect instead
  const handlePhoneNext = () => {
    setAuthMode('wallet');
    setAuthStep('input');
  };
  const handleOtpSubmit = () => { setAuthStep('connecting'); setTimeout(() => onConnect('phone'), 1100); };

  // Real wallet connection: open the browser extension wallet directly.
  // We call window.phantom / window.solflare / window.backpack depending on
  // which adapter the user picked. If the wallet is not installed, we open
  // its installation page. On successful connect we call onConnect('wallet').
  const handleWalletConnect = async (walletName: string) => {
    setAuthStep('connecting');

    try {
      let publicKey: string | null = null;
      let adapter: any = null;

      if (walletName === 'Phantom') {
        const phantom = (window as any).phantom?.solana ?? (window as any).solana;
        if (!phantom?.isPhantom) { window.open('https://phantom.app', '_blank'); setAuthStep('input'); return; }
        const resp = await phantom.connect();
        publicKey = resp.publicKey.toString();
        adapter = phantom;

      } else if (walletName === 'Solflare') {
        const solflare = (window as any).solflare;
        if (!solflare?.isSolflare) { window.open('https://solflare.com', '_blank'); setAuthStep('input'); return; }
        await solflare.connect();
        publicKey = solflare.publicKey?.toString() ?? null;
        adapter = solflare;

      } else if (walletName === 'Backpack') {
        const backpack = (window as any).backpack?.solana ?? (window as any).xnft?.solana;
        if (!backpack) { window.open('https://www.backpack.app', '_blank'); setAuthStep('input'); return; }
        const resp = await backpack.connect();
        publicKey = resp.publicKey?.toString() ?? null;
        adapter = backpack;

      } else if (walletName === 'OKX') {
        const okx = (window as any).okxwallet?.solana;
        if (!okx) { window.open('https://www.okx.com/web3', '_blank'); setAuthStep('input'); return; }
        const resp = await okx.connect();
        publicKey = resp.publicKey.toString();
        adapter = okx;

      } else if (walletName === 'Bitget') {
        const bitget = (window as any).bitkeep?.solana ?? (window as any).bgwallet?.solana;
        if (!bitget) { window.open('https://web3.bitget.com', '_blank'); setAuthStep('input'); return; }
        const resp = await bitget.connect();
        publicKey = resp.publicKey.toString();
        adapter = bitget;

      } else if (walletName === 'Trust') {
        const trust = (window as any).trustwallet?.solana;
        if (!trust) { window.open('https://trustwallet.com', '_blank'); setAuthStep('input'); return; }
        const resp = await trust.connect();
        publicKey = resp.publicKey?.toString() ?? null;
        adapter = trust;

      } else if (walletName === 'Ledger') {
        alert('Connect your Ledger via Phantom or Solflare using the Ledger hardware wallet option.');
        setAuthStep('input');
        return;
      }

      if (publicKey && adapter) {
        // Require a signature to prove the user controls this wallet
        const msg = buildSignInMessage(publicKey);
        await adapter.signMessage(msg, 'utf8');
        onConnect('wallet', publicKey);
      } else {
        setAuthStep('input');
      }
    } catch {
      // User rejected the connection or signing
      setAuthStep('input');
    }
  };

  // Disconnect: clears localStorage, resets local detected state, tells parent
  const handleDisconnect = () => {
    localStorage.removeItem('circles_wallet');
    setDetectedAddr(null);
    // Also tell the extension to drop its session
    try {
      const w = window as any;
      const phantom = w.phantom?.solana ?? w.solana;
      if (phantom?.isPhantom) phantom.disconnect?.();
      const solflare = w.solflare;
      if (solflare?.isSolflare) solflare.disconnect?.();
      const backpack = w.backpack?.solana ?? w.xnft?.solana;
      if (backpack) backpack.disconnect?.();
    } catch { /* ignore */ }
    onLogout?.();
  };

  // Detect which wallets are installed in the browser
  const detectWallets = () => {
    if (typeof window === 'undefined') return {
      phantom: false, solflare: false, backpack: false,
      okx: false, bitget: false, trust: false,
    };
    const w = window as any;
    return {
      phantom:  !!(w.phantom?.solana?.isPhantom || w.solana?.isPhantom),
      solflare: !!(w.solflare?.isSolflare),
      backpack: !!(w.backpack?.solana || w.xnft?.solana),
      // OKX exposes window.okxwallet.solana on their Solana provider
      okx:    !!(w.okxwallet?.solana),
      // Bitget (formerly BitKeep) exposes window.bitkeep.solana
      bitget: !!(w.bitkeep?.solana || w.bgwallet?.solana),
      // Trust Wallet exposes window.trustwallet.solana
      trust:  !!(w.trustwallet?.solana || w.solana?.isTrust),
    };
  };

  return (
    <div className="lp">
      {/* Invite pool banner */}
      {invitePoolId && (
        <div className="lp-invite-banner">
          <Icon name="users" size={15} />
          <span>You&apos;ve been invited to join a Circles savings pool</span>
          {connectedAddr ? (
            <button className="btn btn-primary btn-sm" onClick={enterWithDetectedWallet}>
              Enter app to join <Icon name="arrow-right" size={12} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => startConnect('wallet')}>
              Connect wallet to join <Icon name="arrow-right" size={12} />
            </button>
          )}
        </div>
      )}

      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="row gap-10">
            <div className="brand-mark">
              <Logo size={18} />
            </div>
            <div className="brand-name">Circles</div>
            <span className="brand-net" style={{ marginLeft: 6 }}>devnet</span>
          </div>
          <nav className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#trust">Trust</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="row gap-8">
            {/* Single icon theme toggle */}
            <button
              className="btn btn-sm btn-icon"
              onClick={() => onThemeToggle(theme === 'safe' ? 'bold' : 'safe')}
              title={theme === 'safe' ? 'Switch to dark mode' : 'Switch to light mode'}
              style={{ width: 32, height: 32, padding: 0, display: 'grid', placeItems: 'center' }}
            >
              <Icon name={theme === 'safe' ? 'moon' : 'sun'} size={15} />
            </button>
            {connectedAddr ? (
              /* Wallet already connected — show pill + enter + disconnect */
              <>
                <span className="badge good no-dot mono" style={{ fontSize: 11 }}>
                  {connectedAddr.slice(0, 4)}…{connectedAddr.slice(-4)}
                </span>
                <button className="btn btn-primary btn-sm" onClick={enterWithDetectedWallet}>
                  Enter app <Icon name="arrow-right" size={12} />
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handleDisconnect}
                  title="Disconnect wallet"
                  style={{ width: 32, height: 32, padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <Icon name="logout" size={14} />
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => startConnect('wallet')}>
                Open app <Icon name="arrow-right" size={12} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="lp-main">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <div className="landing-eyebrow">
                <span className="dot" />
                <span>Live on Solana devnet · Open for testing</span>
              </div>
              <h1 className="lp-h1">
                Rotating savings,<br />
                <span className="lp-h1-em">onchain and on time.</span>
              </h1>
              <p className="lp-sub">
                Circles brings the trusted ajo and susu savings model onchain. Pool USDC with people you
                trust, contribute each round, and receive your payout when it&apos;s your turn. Defaulters
                lose their collateral by member vote. No chasing, no spreadsheets, no broken promises.
              </p>
              <div className="lp-cta">
                {connectedAddr ? (
                  <button className="btn btn-primary btn-lg" onClick={enterWithDetectedWallet}>
                    <Icon name="check" size={14} /> Wallet connected · Enter app
                  </button>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={() => startConnect('wallet')}>
                    Open the app <Icon name="arrow-right" size={14} />
                  </button>
                )}
                <a href="/docs" className="btn btn-lg" style={{ textDecoration: 'none' }}>
                  <Icon name="book" size={14} /> Read the docs
                </a>
              </div>
              <div className="lp-trust-row">
                <span className="text-xs text-muted mono">LIVE ON SOLANA DEVNET · OPEN FOR TESTING</span>
              </div>
            </div>

            <div className="lp-hero-visual">
              <HeroPoolCard />
              <FloatingTxCard />
              <FloatingRepCard />
            </div>
          </div>

          {/* Stats strip — real numbers will appear here once mainnet launches */}
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="lp-section">
          <div className="lp-section-head">
            <span className="lp-eyebrow">How it works</span>
            <h2 className="lp-h2">A circle of trust, settled in seconds.</h2>
            <p className="lp-section-sub">Four steps. Same model your grandmother used. Now enforced by code.</p>
          </div>
          <div className="lp-how-grid">
            {[
              { n: '01', t: 'Form your circle',     d: 'Set the contribution, member count, and cycle. Invite friends or list publicly. Rotation order is randomized onchain at the start.', icon: 'users' },
              { n: '02', t: 'Lock collateral',       d: "Each member locks one round of USDC as collateral when they join. It refunds at the end — or covers a missed payment if they default.", icon: 'lock' },
              { n: '03', t: 'Contribute and rotate', d: 'Every cycle, all members contribute. The full pot goes to one member in order. The smart contract executes — no admin needed.', icon: 'send' },
              { n: '04', t: 'Build reputation',      d: 'Timely contributions raise your score. Higher scores get into higher stake circles. One bad pool leaves a permanent mark on your wallet.', icon: 'shield' },
            ].map((s, i) => (
              <div key={i} className="lp-how-card">
                <div className="lp-how-num mono">{s.n}</div>
                <div className="lp-how-icon"><Icon name={s.icon} size={18} /></div>
                <div className="lp-how-title">{s.t}</div>
                <div className="lp-how-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="lp-section lp-section-alt">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Built for the way you save</span>
            <h2 className="lp-h2">Everything a circle needs.<br />Nothing it doesn&apos;t.</h2>
          </div>
          <div className="lp-features-grid">
            <div className="lp-feat lp-feat-hero">
              <div className="lp-feat-tag mono">CORE</div>
              <div className="lp-feat-title">USDC pools, fixed terms</div>
              <div className="lp-feat-desc">
                Pick your contribution, member count and cycle once. The smart contract handles escrow, payouts, and refunds automatically.
              </div>
              <FeatureMockPool />
            </div>
            {[
              { icon: 'phone',    title: 'Phone number login',   desc: 'No seed phrases. Sign up with an SMS code. Your key lives behind a passkey — only you can use it.' },
              { icon: 'gavel',   title: 'Slash by majority vote', desc: "If a member misses a contribution, the rest can vote to slash their collateral. The pot is made whole automatically." },
              { icon: 'shield',  title: 'Onchain reputation',    desc: 'Every completed pool, every timely contribution, and every default is recorded against your wallet. Forever.' },
              { icon: 'globe',   title: 'Discover marketplace',  desc: 'Browse public circles by reputation, contribution size and cycle. Join in two clicks.' },
              { icon: 'sparkle', title: 'Fair rotation order',   desc: "Order is set by verifiable randomness when the pool fills. Nobody — including the host — can pre-pick their position." },
              { icon: 'trending', title: 'Instant settlement',    desc: 'Solana fees cost fractions of a cent. Payouts land before the round ends.' },
            ].map((f, i) => (
              <div key={i} className="lp-feat">
                <div className="lp-feat-icon"><Icon name={f.icon} size={18} /></div>
                <div className="lp-feat-title">{f.title}</div>
                <div className="lp-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className="lp-section">
          <div className="lp-trust-grid">
            <div>
              <span className="lp-eyebrow">Why Circles is safe</span>
              <h2 className="lp-h2">Trust, but enforce.</h2>
              <p className="lp-section-sub" style={{ maxWidth: 480 }}>
                Traditional ajo runs on social pressure. That works — until it doesn&apos;t. Circles keeps the
                social model and adds the part that money needs: enforcement.
              </p>
              <div className="lp-trust-points">
                {[
                  { t: 'No custody escrow',    d: "Funds sit in an Anchor program — not a company wallet. We can't touch them." },
                  { t: 'Open source contracts', d: 'Read every line on GitHub. Programs are immutable once deployed to mainnet.' },
                  { t: 'Open for stress testing', d: 'Devnet is live and public. Try every instruction — create pools, contribute, slash, withdraw — before mainnet launches.' },
                  { t: 'No admin keys',        d: 'No upgrade path that bypasses members. Slash decisions require a majority vote onchain.' },
                ].map((p, i) => (
                  <div key={i} className="lp-trust-point">
                    <div className="lp-trust-check"><Icon name="check" size={13} /></div>
                    <div>
                      <div className="lp-trust-point-t">{p.t}</div>
                      <div className="lp-trust-point-d">{p.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <CodePreview />
          </div>
        </section>

        {/* Testimonials removed — will be added once real users are onboarded */}

        {/* FAQ */}
        <section id="faq" className="lp-section">
          <div className="lp-faq-grid">
            <div>
              <span className="lp-eyebrow">FAQ</span>
              <h2 className="lp-h2">Questions, answered.</h2>
              <p className="lp-section-sub">Still curious? <a href="/docs">Read the docs</a> or <a href="#">join Discord</a>.</p>
            </div>
            <div className="lp-faq-list">
              {[
                { q: 'What is an ajo or susu?', a: 'A rotating savings circle: members contribute the same amount each cycle and take turns receiving the full pot. Common across West Africa, the Caribbean, and South Asia for centuries. Circles brings it onchain so the rules are enforced automatically.' },
                { q: 'Do I need crypto experience?',   a: 'No. You can sign up with a phone number and we generate a wallet for you. USDC is a stablecoin pegged 1:1 to the US dollar — no price swings to worry about.' },
                { q: 'What if someone misses a payment?', a: "Other members can call a slash vote. With a simple majority, the defaulter's collateral covers the missed contribution and they are removed from the circle." },
                { q: 'How is rotation order decided?', a: 'When the circle fills, an onchain randomness call sets the order. Nobody — including the pool creator — can influence it after that.' },
                { q: 'What does it cost?',              a: 'Circles charges no platform fees during devnet. Solana network fees are typically under $0.001 per transaction.' },
                { q: 'Can I leave a circle early?',     a: "Not while it is active — that is the whole point of a circle. Once the full cycle completes, your collateral is automatically refunded to your wallet." },
              ].map((f, i) => <FAQItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />)}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="lp-section">
          <div className="lp-cta-card">
            <h2 className="lp-h2" style={{ margin: 0 }}>Start your first circle.</h2>
            <p className="lp-section-sub" style={{ maxWidth: 460 }}>
              No fees on devnet. Sign up in 30 seconds. Bring your circle, or join an open one.
            </p>
            <div className="lp-cta">
              {connectedAddr ? (
                <button className="btn btn-primary btn-lg" onClick={enterWithDetectedWallet}>
                  <Icon name="check" size={14} /> Wallet connected · Enter app
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={() => startConnect('wallet')}>
                  Open the app <Icon name="arrow-right" size={14} />
                </button>
              )}
              <a href="/docs" className="btn btn-lg" style={{ textDecoration: 'none' }}>
                <Icon name="book" size={14} /> Read the docs
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="row gap-10" style={{ marginBottom: 12 }}>
              <div className="brand-mark" style={{ width: 28, height: 28 }}>
                <Logo size={18} />
              </div>
              <div className="brand-name">Circles</div>
            </div>
            <div className="text-xs text-muted" style={{ maxWidth: 280, lineHeight: 1.5 }}>
              Rotating savings, onchain. Built on Solana. Made with 🌍 for circles everywhere.
            </div>
          </div>
          <div className="lp-footer-cols">
            <div>
              <div className="lp-footer-h">Product</div>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#trust">Security</a>
              <a href="#">Roadmap</a>
            </div>
            <div>
              <div className="lp-footer-h">Resources</div>
              <a href="/docs">Docs</a>
              <a href="#">Smart contracts</a>
              <a href="/docs">Program IDL</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <div className="lp-footer-h">Community</div>
              <a href="#">Discord</a>
              <a href="#">Twitter / X</a>
              <a href="#">Telegram</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span className="text-xs text-muted mono">© 2026 Circles Labs</span>
          <span className="text-xs text-muted mono">Devnet · v0.1.0 · Do not use mainnet funds</span>
        </div>
      </footer>

      {authOpen && (
        <AuthModal
          mode={authMode}
          step={authStep}
          phone={phone} setPhone={setPhone}
          otp={otp} setOtp={setOtp}
          onClose={() => { setAuthOpen(false); setAuthStep('input'); }}
          onSwitchMode={m => { setAuthMode(m); setAuthStep('input'); }}
          onPhoneNext={handlePhoneNext}
          onOtpSubmit={handleOtpSubmit}
          onWalletConnect={handleWalletConnect}
          detectWallets={detectWallets}
        />
      )}
    </div>
  );
}

// ─── Hero visuals ─────────────────────────────────────────────────────────────

function HeroPoolCard() {
  const [round, setRound] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setRound(r => (r % 5) + 1), 2400);
    return () => clearInterval(t);
  }, []);
  const rows = [
    { idx: 1, name: '7xKX...4hQp', addr: '7xKX...4hQp' },
    { idx: 2, name: '9bNm...2fLj', addr: '9bNm...2fLj' },
    { idx: 3, name: 'Bs8q...vN3w', addr: 'Bs8q...vN3w' },
    { idx: 4, name: 'Cz1y...mP9k', addr: 'Cz1y...mP9k' },
    { idx: 5, name: '5dEr...8wXy', addr: '5dEr...8wXy', isYou: true },
  ];
  return (
    <div className="lp-hero-card lp-card-main">
      <div className="row-between" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>7Ph9…3E4 Pool</div>
          <div className="text-xs text-muted mono" style={{ marginTop: 2 }}>Round {round} of 5 · monthly</div>
        </div>
        <span className="badge good no-dot">ACTIVE</span>
      </div>
      {rows.map(r => {
        const state = r.idx < round ? 'done' : r.idx === round ? 'active' : 'queued';
        return (
          <div key={r.idx} className="lv-row">
            <div className="lv-row-left">
              <div className={`lv-stamp ${state === 'done' ? 'done' : ''} ${state === 'active' ? 'active' : ''}`}>
                {state === 'done' ? <Icon name="check" size={13} /> : r.idx}
              </div>
              <div>
                <div className="lv-name">{r.name} {'isYou' in r && r.isYou && <span className="pill" style={{ marginLeft: 6 }}>YOU</span>}</div>
                <div className="lv-meta">{r.addr}</div>
              </div>
            </div>
            <div className="lv-amt">{state === 'active' ? '800.00' : state === 'done' ? '+800.00' : '—'}</div>
          </div>
        );
      })}
      <div style={{ marginTop: 14, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12 }}>
        <div className="row-between">
          <span className="text-muted">Pot this round</span>
          <span className="mono">800.00 USDC</span>
        </div>
      </div>
    </div>
  );
}

function FloatingTxCard() {
  return (
    <div className="lp-float lp-float-tx">
      <div className="row gap-10" style={{ marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
          <Icon name="arrow-down" size={14} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Round payout received</div>
          <div className="text-xs text-muted mono">7Ph9…3E4 · Round 2</div>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: 'var(--good)' }}>+800.00 USDC</div>
    </div>
  );
}

function FloatingRepCard() {
  return (
    <div className="lp-float lp-float-rep">
      <div className="row gap-10" style={{ alignItems: 'center' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'conic-gradient(var(--accent) 0% 80%, var(--surface-2) 80% 100%)', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
            <Icon name="shield" size={13} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Reputation score</div>
          <div className="text-xs text-muted">Computed onchain</div>
        </div>
      </div>
    </div>
  );
}

function FeatureMockPool() {
  return (
    <div className="lp-feat-mock">
      {[
        { l: 'Contribution', v: '100 USDC' },
        { l: 'Members',      v: '8 / 8' },
        { l: 'Cycle',        v: 'Monthly' },
        { l: 'Pot',          v: '800 USDC' },
      ].map((r, i) => (
        <div key={i} className="lp-feat-mock-row">
          <span className="text-muted text-xs">{r.l}</span>
          <span className="mono text-sm">{r.v}</span>
        </div>
      ))}
      <div className="lp-feat-mock-bar"><div style={{ width: '65%' }} /></div>
    </div>
  );
}

function CodePreview() {
  return (
    <div className="lp-code">
      <div className="lp-code-bar">
        <div className="lp-code-dots"><span /><span /><span /></div>
        <div className="text-xs text-muted mono">circles.rs · Anchor</div>
      </div>
      <pre className="lp-code-body"><code>{`#[program]
pub mod circles {
  pub fn contribute(ctx: Context<Pay>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    require!(pool.round_open, Err::Closed);

    transfer(ctx.accounts.into(), pool.amount)?;
    pool.contributions[pool.round] += 1;

    if pool.contributions[pool.round]
        == pool.members.len() {
      payout(pool)?;     // auto-execute
    }
    Ok(())
  }
}`}</code></pre>
    </div>
  );
}

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`lp-faq-item ${open ? 'open' : ''}`}>
      <button className="lp-faq-q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <Icon name={open ? 'x' : 'plus'} size={14} />
      </button>
      {open && <div className="lp-faq-a">{a}</div>}
    </div>
  );
}

// ─── Official wallet icons from @solana/wallet-adapter-wallets ───────────────
// These are the exact base64-encoded SVGs shipped by each wallet's own adapter.

const PHANTOM_ICON  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPg==';
const SOLFLARE_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg==';
const LEDGER_ICON   = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzUgMzUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZiI+PHBhdGggZD0ibTIzLjU4OCAwaC0xNnYyMS41ODNoMjEuNnYtMTZhNS41ODUgNS41ODUgMCAwIDAgLTUuNi01LjU4M3oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUuNzM5KSIvPjxwYXRoIGQ9Im04LjM0MiAwaC0yLjc1N2E1LjU4NSA1LjU4NSAwIDAgMCAtNS41ODUgNS41ODV2Mi43NTdoOC4zNDJ6Ii8+PHBhdGggZD0ibTAgNy41OWg4LjM0MnY4LjM0MmgtOC4zNDJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDUuNzM5KSIvPjxwYXRoIGQ9Im0xNS4xOCAyMy40NTFoMi43NTdhNS41ODUgNS41ODUgMCAwIDAgNS41ODUtNS42di0yLjY3MWgtOC4zNDJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMS40NzggMTEuNDc4KSIvPjxwYXRoIGQ9Im03LjU5IDE1LjE4aDguMzQydjguMzQyaC04LjM0MnoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUuNzM5IDExLjQ3OCkiLz48cGF0aCBkPSJtMCAxNS4xOHYyLjc1N2E1LjU4NSA1LjU4NSAwIDAgMCA1LjU4NSA1LjU4NWgyLjc1N3YtOC4zNDJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDExLjQ3OCkiLz48L2c+PC9zdmc+';

// Backpack doesn't ship in @solana/wallet-adapter-wallets; this is their official
// SVG mark from the Backpack GitHub brand assets.
const BACKPACK_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjRTMzRTNGIi8+PHBhdGggZD0iTTE2IDZDMTMuMjQgNiAxMSA4LjI0IDExIDExdjFIOXYxMmgxNFYxMmgtMnYtMWMwLTIuNzYtMi4yNC01LTUtNXptMCAyYzEuNjYgMCAzIDEuMzQgMyAzdjFoLTZ2LTFjMC0xLjY2IDEuMzQtMyAzLTN6bS0xIDhIN3YyaDJ2LTJoMTR2Mmgydi0yaC0yeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';

// OKX Wallet — black background, four-square grid mark (their official logo pattern)
const OKX_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iOSIgeT0iOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjE4IiB5PSI5IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iOSIgeT0iMTgiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIxOCIgeT0iMTgiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';

// Bitget Wallet — teal background, white B letterform
const BITGET_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjMDBCOEM4Ii8+PHBhdGggZD0iTTEwIDhoNy41YzIuNSAwIDQuNSAxLjUgNC41IDQgMCAxLjItLjUgMi4yLTEuNCAyLjkgMS4yLjcgMiAxLjkgMiAzLjMgMCAyLjctMiA0LjMtNC45IDQuM0gxMFY4em0zIDUuNWg0Yy45IDAgMS41LS41IDEuNS0xLjQgMC0uOC0uNi0xLjQtMS41LTEuNGgtNHYyLjh6bTAgNS43aDQuMmMxIDAgMS43LS42IDEuNy0xLjYgMC0uOS0uNy0xLjUtMS43LTEuNUgxM3YzLjF6IiBmaWxsPSIjZmZmIi8+PC9zdmc+';

// Trust Wallet — blue background, white shield with checkmark
const TRUST_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjMzM3NUJCIi8+PHBhdGggZD0iTTE2IDZsOSAzLjV2OC41YzAgNC43LTMuOCA4LjItOSAxMC01LjItMS44LTktNS4zLTktMTBWOS41TDE2IDZ6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTE2IDlsNiAyLjR2NmMwIDMuMi0yLjYgNS42LTYgNi44LTMuNC0xLjItNi0zLjYtNi02Ljh2LTZsNi0yLjR6IiBmaWxsPSIjMzM3NUJCIi8+PHBhdGggZD0iTTEzLjUgMTYuNWwyIDIgMy41LTMuNSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+PC9zdmc+';

// ─── Auth Modal ───────────────────────────────────────────────────────────────

interface AuthModalProps {
  mode: 'phone' | 'wallet';
  step: 'input' | 'otp' | 'connecting';
  phone: string; setPhone: (v: string) => void;
  otp: string; setOtp: (v: string) => void;
  onClose: () => void;
  onSwitchMode: (m: 'phone' | 'wallet') => void;
  onPhoneNext: () => void;
  onOtpSubmit: () => void;
  onWalletConnect: (walletName: string) => void;
  detectWallets: () => { phantom: boolean; solflare: boolean; backpack: boolean; okx: boolean; bitget: boolean; trust: boolean };
}

function AuthModal({
  mode, step, phone, setPhone, otp, setOtp,
  onClose, onSwitchMode, onPhoneNext, onOtpSubmit, onWalletConnect, detectWallets,
}: AuthModalProps) {
  const detected = detectWallets();

  const wallets = [
    {
      name: 'Phantom',
      icon: PHANTOM_ICON,
      detected: detected.phantom,
      installUrl: 'https://phantom.app',
    },
    {
      name: 'Solflare',
      icon: SOLFLARE_ICON,
      detected: detected.solflare,
      installUrl: 'https://solflare.com',
    },
    {
      name: 'Backpack',
      icon: BACKPACK_ICON,
      detected: detected.backpack,
      installUrl: 'https://www.backpack.app',
    },
    {
      name: 'OKX',
      icon: OKX_ICON,
      detected: detected.okx,
      installUrl: 'https://www.okx.com/web3',
    },
    {
      name: 'Bitget',
      icon: BITGET_ICON,
      detected: detected.bitget,
      installUrl: 'https://web3.bitget.com',
    },
    {
      name: 'Trust',
      icon: TRUST_ICON,
      detected: detected.trust,
      installUrl: 'https://trustwallet.com',
    },
    {
      name: 'Ledger',
      icon: LEDGER_ICON,
      detected: false,
      installUrl: 'https://www.ledger.com',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={step === 'connecting' ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        {step !== 'connecting' && (
          <div className="modal-head">
            <div>
              <div className="modal-title">{mode === 'phone' ? 'Sign in with phone' : 'Connect your wallet'}</div>
              <div className="modal-sub">{mode === 'phone' ? "We'll text you a 6-digit code" : 'Pick the wallet installed in your browser'}</div>
            </div>
            <button className="modal-close" onClick={onClose} style={{ color: 'var(--ink)' }}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {step === 'input' && mode === 'phone' && (
          <>
            <div style={{
              padding: '16px',
              background: 'var(--surface-2)',
              borderRadius: 10,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <Icon name="phone" size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>Phone login coming soon</div>
                <div className="text-sm text-muted">
                  SMS authentication with embedded wallets is on the roadmap. For now, connect any Solana wallet — it takes under a minute.
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 16 }}
              onClick={onPhoneNext}
            >
              <Icon name="wallet" size={14} /> Connect a wallet instead
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="field">
              <label className="field-label">Enter the 6-digit code</label>
              <input
                className="input mono"
                autoFocus
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ fontSize: 22, letterSpacing: '0.4em', textAlign: 'center' }}
              />
              <div className="field-hint">Sent to {phone}. <a href="#" onClick={e => e.preventDefault()}>Resend</a></div>
            </div>
            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 16 }}
              onClick={onOtpSubmit}
              disabled={otp.length < 4}
            >
              Verify and continue
            </button>
          </>
        )}

        {step === 'input' && mode === 'wallet' && (
          <>
            <div className="col gap-8">
              {wallets.map(w => (
                <button
                  key={w.name}
                  className="lp-wallet-btn"
                  onClick={() => onWalletConnect(w.name)}
                  style={{ color: 'var(--ink)' }}
                >
                  {/* Official wallet icons from each wallet's adapter package */}
                  <img
                    src={w.icon}
                    alt={w.name}
                    width={32}
                    height={32}
                    style={{ borderRadius: 8, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1, textAlign: 'left' }}>
                    {w.name}
                  </span>
                  {w.detected
                    ? <span className="badge good no-dot">Detected</span>
                    : <span className="text-xs text-muted">Install →</span>
                  }
                  <Icon name="chevron-right" size={15} />
                </button>
              ))}
            </div>
            <div className="h-rule">or</div>
            <button className="btn btn-block" onClick={() => onSwitchMode('phone')} style={{ color: 'var(--ink)' }}>
              <Icon name="phone" size={15} /> Continue with phone
            </button>
          </>
        )}

        {step === 'connecting' && (
          <div style={{ textAlign: 'center', padding: '36px 0 16px' }}>
            <div className="check-burst" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {mode === 'phone' ? 'Creating your wallet…' : 'Waiting for wallet…'}
            </div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>
              {mode === 'phone' ? 'This takes about a second.' : 'Approve the connection in your wallet app.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
