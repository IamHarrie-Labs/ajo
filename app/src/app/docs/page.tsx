'use client';

import { useState } from 'react';
import Icon from '../../components/Icon';
import Logo from '../../components/Logo';

/* ─── Section registry ─────────────────────────────────────────────────────── */

type SectionId =
  | 'intro' | 'how-it-works' | 'create' | 'join'
  | 'contribute' | 'payouts' | 'reputation' | 'slashing'
  | 'login' | 'privacy' | 'security' | 'fees'
  | 'contracts' | 'faq';

const NAV: { group: string; items: { id: SectionId; label: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      { id: 'intro',        label: 'What is Circles?' },
      { id: 'how-it-works', label: 'How it works' },
      { id: 'login',        label: 'Signing in' },
    ],
  },
  {
    group: 'Using Circles',
    items: [
      { id: 'create',     label: 'Create a circle' },
      { id: 'join',       label: 'Join a circle' },
      { id: 'contribute', label: 'Contribute' },
      { id: 'payouts',    label: 'Payouts' },
    ],
  },
  {
    group: 'Mechanics',
    items: [
      { id: 'reputation', label: 'Reputation' },
      { id: 'slashing',   label: 'Collateral & slashing' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'privacy',   label: 'Privacy' },
      { id: 'security',  label: 'Security' },
      { id: 'fees',      label: 'Fees' },
      { id: 'contracts', label: 'Smart contracts' },
      { id: 'faq',       label: 'FAQ' },
    ],
  },
];

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function DocsPage() {
  const [theme, setTheme]     = useState<'safe' | 'bold'>('safe');
  const [active, setActive]   = useState<SectionId>('intro');

  const go = (id: SectionId) => setActive(id);

  return (
    <div className={`theme-${theme}`} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* Topbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div className="brand-mark" style={{ width: 28, height: 28, display: 'grid', placeItems: 'center' }}>
            <Logo size={18} />
          </div>
          <span className="brand-name">Circles</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 2 }}>/ Docs</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="seg">
            <button className={theme === 'safe' ? 'on' : ''} onClick={() => setTheme('safe')}>Light</button>
            <button className={theme === 'bold' ? 'on' : ''} onClick={() => setTheme('bold')}>Dark</button>
          </div>
          <a href="/" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            Open app <Icon name="arrow-right" size={12} />
          </a>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', maxWidth: 1160, margin: '0 auto', minHeight: 'calc(100vh - 56px)' }}>

        {/* Sidebar */}
        <aside style={{
          position: 'sticky', top: 56, alignSelf: 'start',
          height: 'calc(100vh - 56px)', overflowY: 'auto',
          padding: '24px 16px 24px 0',
          borderRight: '1px solid var(--line)',
        }}>
          {NAV.map(group => (
            <div key={group.group} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-2)', padding: '0 10px', marginBottom: 6 }}>
                {group.group}
              </div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 10px', borderRadius: 6, fontSize: 13,
                    fontWeight: active === item.id ? 500 : 400,
                    color: active === item.id ? 'var(--ink)' : 'var(--muted)',
                    background: active === item.id ? 'var(--surface-2)' : 'transparent',
                    border: 'none', cursor: 'pointer', marginBottom: 1,
                    transition: 'all 0.1s ease',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content pane */}
        <main style={{ padding: '48px 52px 96px 52px', maxWidth: 740, minHeight: 'calc(100vh - 56px)' }}>
          {active === 'intro'        && <SectionIntro       go={go} />}
          {active === 'how-it-works' && <SectionHowItWorks  go={go} />}
          {active === 'login'        && <SectionLogin        go={go} />}
          {active === 'create'       && <SectionCreate       go={go} />}
          {active === 'join'         && <SectionJoin         go={go} />}
          {active === 'contribute'   && <SectionContribute   go={go} />}
          {active === 'payouts'      && <SectionPayouts      go={go} />}
          {active === 'reputation'   && <SectionReputation   go={go} />}
          {active === 'slashing'     && <SectionSlashing     go={go} />}
          {active === 'privacy'      && <SectionPrivacy      go={go} />}
          {active === 'security'     && <SectionSecurity     go={go} />}
          {active === 'fees'         && <SectionFees         go={go} />}
          {active === 'contracts'    && <SectionContracts    go={go} />}
          {active === 'faq'          && <SectionFAQ          go={go} />}
        </main>
      </div>
    </div>
  );
}

/* ─── Shared layout components ─────────────────────────────────────────────── */

type GoFn = (id: SectionId) => void;

function PageTitle({ label, tag }: { label: string; tag?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {tag && (
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {tag}
        </span>
      )}
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', margin: '8px 0 0', lineHeight: 1.2, color: 'var(--ink)' }}>
        {label}
      </h1>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)', margin: '0 0 18px', opacity: 0.9 }}>{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '36px 0 12px', color: 'var(--ink)' }}>{children}</h2>;
}

function Callout({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const config = {
    info: { bg: 'var(--accent-soft)', border: 'var(--accent)', icon: 'info' },
    warn: { bg: 'var(--warn-soft)',   border: 'var(--warn)',   icon: 'alert' },
    tip:  { bg: 'var(--surface-2)',   border: 'var(--line-strong)', icon: 'zap' },
  }[type];
  return (
    <div style={{ background: config.bg, borderLeft: `3px solid ${config.border}`, borderRadius: '0 8px 8px 0', padding: '12px 16px', margin: '20px 0', fontSize: 14, lineHeight: 1.65, display: 'flex', gap: 10, color: 'var(--ink)' }}>
      <Icon name={config.icon} size={15} style={{ flexShrink: 0, marginTop: 2 } as any} />
      <div>{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--ink)' }}>
      {children}
    </code>
  );
}

function MonoBlock({ children }: { children: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, wordBreak: 'break-all', color: 'var(--ink)', margin: '16px 0' }}>
      {children}
    </div>
  );
}

function NextLink({ label, id, go }: { label: string; id: SectionId; go: GoFn }) {
  return (
    <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={() => go(id)} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
        {label} <Icon name="arrow-right" size={12} />
      </button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ink)', color: 'var(--bg)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{n}</div>
        <div style={{ width: 1, flex: 1, background: 'var(--line)', marginTop: 4 }} />
      </div>
      <div style={{ paddingTop: 4, paddingBottom: 4 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)' }}>{children}</div>
      </div>
    </div>
  );
}

function CheckItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 16, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon name="check" size={11} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)' }}>{children}</div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', fontSize: 14.5, fontWeight: 500, color: 'var(--ink)', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <span>{q}</span>
        <Icon name={open ? 'x' : 'plus'} size={13} />
      </button>
      {open && <div style={{ paddingTop: 10, fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{a}</div>}
    </div>
  );
}

/* ─── Section: Intro ────────────────────────────────────────────────────────── */

function SectionIntro({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="What is Circles?" tag="Getting started" />

      <P>
        Rotating savings clubs have existed for centuries. West Africans call them <em>ajo</em> or <em>esusu</em>.
        Ghanaians call them <em>susu</em>. The Caribbean, South Asia, Latin America, and East Asia all have their
        own versions. The mechanics are the same everywhere: a group of people pool a fixed amount each cycle,
        one person receives the full pot, and the rotation continues until everyone has had a turn.
      </P>
      <P>
        It works. The problem is what happens when it doesn't. Someone ghosts after receiving their payout.
        The organiser disappears with the funds. There's no contract, no recourse, and no way to verify
        whether contributions were actually made. Circles replaces the social pressure holding these
        groups together with a smart contract on Solana.
      </P>
      <P>
        The contract holds contributions in escrow, enforces the rotation order, and sends payouts
        automatically. If a member defaults, the group votes to slash their collateral. Everything
        is recorded onchain — permanently and publicly.
      </P>

      <Callout type="tip">
        Circles is on devnet right now. That means test money, not real funds. The app behaves
        exactly as it will on mainnet — it's a safe place to learn how things work.
      </Callout>

      <H2>A quick example</H2>
      <P>
        Eight people each put in 100 USDC per month. Every month one person receives the full 800 USDC pot.
        After eight months everyone has contributed 800 USDC and received 800 USDC once. The net cost is zero.
        The benefit is access to a lump sum you would otherwise take eight months to save alone.
      </P>

      <NextLink label="How it works" id="how-it-works" go={go} />
    </>
  );
}

/* ─── Section: How it works ─────────────────────────────────────────────────── */

function SectionHowItWorks({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="How it works" tag="Getting started" />
      <P>Every circle follows the same lifecycle, from creation to the final payout.</P>

      <Step n={1} title="Someone creates a circle">
        They set the contribution amount, member count, and cycle length — weekly, biweekly, or monthly.
        The circle can be private (invite-only) or listed publicly in the Discover section.
      </Step>
      <Step n={2} title="Members join and lock collateral">
        Each person joining locks one round of USDC as collateral. It stays in the smart contract
        until the circle completes, at which point it's automatically returned. If someone defaults,
        that collateral covers the gap.
      </Step>
      <Step n={3} title="Rotation order is set onchain">
        When the circle fills, the contract uses onchain randomness to set the payout order.
        Nobody — not even the creator — can influence who goes first.
      </Step>
      <Step n={4} title="Rounds run automatically">
        Each round, all members contribute. When every contribution is confirmed, the contract
        sends the full pot to the round's recipient. No manual trigger needed.
      </Step>
      <Step n={5} title="Circle ends, collateral returns">
        After the final round, all collateral is automatically sent back. Reputation scores update.
        The full circle history is readable on Solana Explorer.
      </Step>

      <NextLink label="Signing in" id="login" go={go} />
    </>
  );
}

/* ─── Section: Login ────────────────────────────────────────────────────────── */

function SectionLogin({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Signing in" tag="Getting started" />
      <P>Two ways to get into the app.</P>

      <H2>Phone number</H2>
      <P>
        Enter your phone number, get an SMS code, and you're in. A Solana wallet is generated for you
        behind the scenes — stored behind a passkey on your device. You never see a seed phrase.
        This is the recommended option for most users and for anyone in your circle who has never used crypto.
      </P>

      <H2>Connect a wallet</H2>
      <P>
        If you already have a Solana wallet, choose it from the list in the sign-in screen. The app
        checks which wallets are installed in your browser and shows a "Detected" badge next to any
        that are ready to connect.
      </P>
      <P>
        Clicking a wallet that isn't installed opens its download page. Come back once it's set up.
      </P>

      <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
        {[
          { name: 'Phantom',  url: 'https://phantom.app',     note: 'Most widely used Solana wallet' },
          { name: 'Solflare', url: 'https://solflare.com',    note: 'Full-featured, supports staking' },
          { name: 'Backpack', url: 'https://backpack.app',    note: 'Built by Coral XYZ' },
          { name: 'Ledger',   url: 'https://ledger.com',      note: 'Hardware wallet — extra security' },
        ].map(w => (
          <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{w.note}</div>
            </div>
            <a href={w.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
              Install ↗
            </a>
          </div>
        ))}
      </div>

      <Callout type="info">
        Both login methods connect to the same onchain state. Phone login generates a real Solana wallet.
        Your circles, USDC, and reputation live onchain regardless of how you signed in.
      </Callout>

      <NextLink label="Create a circle" id="create" go={go} />
    </>
  );
}

/* ─── Section: Create ───────────────────────────────────────────────────────── */

function SectionCreate({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Create a circle" tag="Using Circles" />
      <P>Go to Create pool in the sidebar. Fill in four fields and submit.</P>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        {[
          { field: 'Name',         desc: 'Something your members will recognise.' },
          { field: 'Contribution', desc: 'How much each person pays per round, in USDC.' },
          { field: 'Members',      desc: 'How many people will be in the circle.' },
          { field: 'Cycle',        desc: 'Weekly, biweekly, or monthly.' },
        ].map((r, i) => (
          <div key={r.field} style={{ display: 'flex', gap: 16, padding: '13px 16px', borderBottom: i < 3 ? '1px solid var(--line)' : undefined }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--accent)', width: 100, flexShrink: 0, paddingTop: 1 }}>{r.field}</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <P>
        Once you submit, a Solana transaction is sent to deploy the circle. From that moment it exists
        onchain. You can share the invite link directly, or make the circle public so people can
        find it in Discover.
      </P>

      <Callout type="info">
        You are also a member of the circle you create. Your payout position is set by the same
        randomness as everyone else's. Creators don't get to pick first.
      </Callout>

      <NextLink label="Join a circle" id="join" go={go} />
    </>
  );
}

/* ─── Section: Join ─────────────────────────────────────────────────────────── */

function SectionJoin({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Join a circle" tag="Using Circles" />
      <P>You can join through an invite link or through the Discover section.</P>

      <P>
        Either way, joining requires two wallet approvals: a small network fee to register your
        membership onchain, and a collateral deposit of one round's contribution amount. The
        collateral is locked in the contract and returned automatically when the circle ends.
      </P>

      <Callout type="warn">
        Check the terms before joining. The contribution amount and cycle length are fixed at
        creation. Once the circle is active, they can't change.
      </Callout>

      <H2>What "Recruiting" means</H2>
      <P>
        A circle in Recruiting status hasn't filled yet. You can join, and once it hits the member
        target the rotation order is set and rounds begin automatically. If it never fills within
        the recruitment window, it's cancelled and all collateral is returned.
      </P>

      <NextLink label="Contributing" id="contribute" go={go} />
    </>
  );
}

/* ─── Section: Contribute ───────────────────────────────────────────────────── */

function SectionContribute({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Contribute" tag="Using Circles" />
      <P>
        At the start of each round, all members contribute. The app shows a countdown and marks
        your status clearly — paid or pending.
      </P>
      <P>
        Hit the Contribute button on the circle card. Review the amount, approve the transaction
        in your wallet, done. Solana confirms in under a second. Your status flips to paid
        immediately.
      </P>

      <Callout type="info">
        Contributions go directly to the onchain vault. Circles never holds your funds. Only the
        contract can move them, and only to send them to the designated round recipient.
      </Callout>

      <H2>If you miss the deadline</H2>
      <P>
        There's a grace period after the contribution deadline. If you still haven't paid, other
        members can call a slash vote. If it passes, your collateral covers the contribution and
        you're removed from the circle. Your reputation takes the hit.
      </P>

      <NextLink label="Payouts" id="payouts" go={go} />
    </>
  );
}

/* ─── Section: Payouts ──────────────────────────────────────────────────────── */

function SectionPayouts({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Payouts" tag="Using Circles" />
      <P>
        When every member in a round has contributed, the contract sends the full pot to the current
        round's recipient automatically. This happens in the same Solana transaction — there's no
        delay and no manual action needed.
      </P>
      <P>
        The recipient sees the USDC in their wallet almost immediately. A notification appears in
        the app. The circle advances to the next round.
      </P>

      <Callout type="tip">
        You can see every payout on Solana Explorer using the transaction hash. The full history
        of a circle — every contribution, every payout, every vote — is permanently readable.
      </Callout>

      <H2>If not everyone has contributed</H2>
      <P>
        The contract waits. It won't release the pot until the round is complete. If someone misses
        the deadline, the group can vote to slash their collateral and unlock the payout. See
        the Collateral and slashing section for how that works.
      </P>

      <NextLink label="Reputation" id="reputation" go={go} />
    </>
  );
}

/* ─── Section: Reputation ───────────────────────────────────────────────────── */

function SectionReputation({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Reputation" tag="Mechanics" />
      <P>
        Every wallet has a reputation score from 0 to 100. It reflects your full contribution
        history across all circles you've ever joined on Circles.
      </P>

      <H2>What moves your score up</H2>
      <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--ink)', margin: '0 0 18px' }}>
        <li>Completing a circle without missing a payment</li>
        <li>Paying before the deadline each round</li>
        <li>Hosting a circle that runs to completion</li>
      </ul>

      <H2>What moves your score down</H2>
      <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--ink)', margin: '0 0 18px' }}>
        <li>Missing a contribution and getting slashed</li>
        <li>Being removed from a circle for defaulting</li>
      </ul>

      <P>
        Reputation is stored onchain and public. Higher-score members get access to higher-stake
        circles. A single default can take months to recover from — that's intentional. The point
        is that your wallet's history means something.
      </P>

      <Callout type="warn">
        Reputation is tied to your wallet address. A new wallet starts with no history.
        If you lose access to a wallet with a high reputation score, that history can't be transferred.
      </Callout>

      <NextLink label="Collateral and slashing" id="slashing" go={go} />
    </>
  );
}

/* ─── Section: Slashing ─────────────────────────────────────────────────────── */

function SectionSlashing({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Collateral and slashing" tag="Mechanics" />
      <P>
        When you join a circle, you lock one round of USDC as collateral in the smart contract.
        It sits there until the circle completes, then returns to your wallet automatically.
        Its only job is to protect other members if you default.
      </P>

      <H2>When a slash vote happens</H2>
      <P>
        If a member misses their contribution and the grace period expires, any other member can
        start a slash vote. All members vote — slash or forgive.
      </P>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>Majority votes to slash</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>
            The defaulter's collateral covers their missed contribution. The pot releases on schedule.
            The defaulter is removed from the circle and their reputation is penalised.
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>Majority votes to forgive</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>
            The defaulter gets more time and keeps their collateral for now. The group takes the risk
            together. This is rare but possible if the group trusts the person.
          </div>
        </div>
      </div>

      <Callout type="warn">
        Slash votes are recorded onchain and cannot be reversed. Once a vote passes, the collateral
        is taken and the member is removed.
      </Callout>

      <NextLink label="Privacy" id="privacy" go={go} />
    </>
  );
}

/* ─── Section: Privacy ──────────────────────────────────────────────────────── */

function SectionPrivacy({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Privacy" tag="Reference" />
      <P>
        Circles is built on Solana, which is a public blockchain. That means the following
        are visible to anyone with a block explorer:
      </P>
      <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--ink)', margin: '0 0 18px' }}>
        <li>All wallet addresses in every circle</li>
        <li>All contribution amounts and timestamps</li>
        <li>All payout recipients and amounts</li>
        <li>All slash votes and results</li>
        <li>All reputation scores</li>
      </ul>
      <P>
        This isn't an oversight — it's what makes the trustless escrow work. Members can verify
        every transaction independently, without relying on Circles as a company to tell them
        what happened.
      </P>

      <H2>What Circles doesn't see</H2>
      <P>
        If you use phone login, your number is used only for the one-time SMS code. We don't
        store it, we don't link it to your wallet address, and we don't share it with anyone.
        Once you're signed in, everything runs onchain.
      </P>

      <H2>Private circles</H2>
      <P>
        Private circles are on the roadmap. The planned approach encrypts the member list
        client-side so only people with the invite link can see who's in the circle. Contribution
        amounts would remain publicly auditable — the contract needs them. Full ZK privacy for
        amounts via MagicBlock's private payment layer is also in progress.
      </P>

      <Callout type="warn">
        Don't join a Circles circle if you can't share your wallet address with your circle members.
        Your full transaction history is public on Solana.
      </Callout>

      <NextLink label="Security" id="security" go={go} />
    </>
  );
}

/* ─── Section: Security ─────────────────────────────────────────────────────── */

function SectionSecurity({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Security" tag="Reference" />

      <CheckItem title="No custody">
        Circles never holds your funds. Contributions go directly to a program-owned vault on Solana.
        The Circles team cannot access, move, or spend them under any circumstances. Only the
        contract logic can release them — to the designated round recipient.
      </CheckItem>

      <CheckItem title="Open source">
        Every line of code that handles your money is publicly readable on GitHub. You don't have
        to trust our description of how it works.
      </CheckItem>

      <CheckItem title="No admin keys">
        Once a circle is live, nobody can override the rules. Slash decisions require a member
        majority vote. There's no emergency withdrawal and no way for Circles as a company to
        intervene in an active circle.
      </CheckItem>

      <CheckItem title="Security audit scheduled">
        An audit by Halborn is scheduled for Q3 2026. Until it's complete, we recommend keeping
        circles under 500 USDC per round. Devnet is safe at any amount — test money only.
      </CheckItem>

      <CheckItem title="Immutable rotation">
        The payout order is set by onchain randomness the moment the circle fills. It can't be
        changed afterward, by anyone.
      </CheckItem>

      <NextLink label="Fees" id="fees" go={go} />
    </>
  );
}

/* ─── Section: Fees ─────────────────────────────────────────────────────────── */

function SectionFees({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Fees" tag="Reference" />
      <P>Circles charges no platform fee during devnet.</P>
      <P>
        The only costs are Solana network fees, which run between $0.0001 and $0.001 per transaction.
        Those go to Solana validators, not to us.
      </P>

      <H2>When you pay a network fee</H2>
      <ul style={{ paddingLeft: 20, lineHeight: 2.2, color: 'var(--ink)', margin: '0 0 18px' }}>
        <li>Creating a circle</li>
        <li>Joining a circle (plus the collateral deposit, which is returned)</li>
        <li>Making a contribution each round</li>
        <li>Withdrawing a payout</li>
        <li>Submitting a slash vote</li>
      </ul>

      <Callout type="info">
        On mainnet, Circles plans to charge a small protocol fee on payouts — less than 0.5%.
        Nothing is finalised and this will be announced publicly before launch.
      </Callout>

      <NextLink label="Smart contracts" id="contracts" go={go} />
    </>
  );
}

/* ─── Section: Contracts ────────────────────────────────────────────────────── */

function SectionContracts({ go }: { go: GoFn }) {
  return (
    <>
      <PageTitle label="Smart contracts" tag="Reference" />
      <P>
        The Circles program is an Anchor smart contract deployed on Solana devnet.
      </P>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Program address — devnet</div>
        <MonoBlock>7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4</MonoBlock>
      </div>

      <H2>Instructions</H2>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        {[
          { name: 'create_pool',        desc: 'Deploy a new circle with its vault and initial parameters.' },
          { name: 'contribute',         desc: 'Send USDC from your token account to the pool vault for the current round.' },
          { name: 'execute_payout',     desc: 'Release the pot to the round recipient. Triggered automatically when all contributions are in.' },
          { name: 'vote_slash',         desc: 'Cast a slash or forgive vote against a member who has missed their contribution.' },
          { name: 'claim_slashed_funds',desc: 'Distribute slashed collateral to cover the defaulter\'s gap and unblock the round.' },
        ].map((r, i, arr) => (
          <div key={r.name} style={{ display: 'flex', gap: 16, padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : undefined }}>
            <Code>{r.name}</Code>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', paddingTop: 2 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <P>
        The IDL is in <Code>target/idl/ajo.json</Code> in the repository. If you're building on top
        of Circles, use it with Anchor or <Code>@coral-xyz/anchor</Code> to call instructions directly.
      </P>

      <NextLink label="FAQ" id="faq" go={go} />
    </>
  );
}

/* ─── Section: FAQ ──────────────────────────────────────────────────────────── */

function SectionFAQ({ go: _go }: { go: GoFn }) {
  const items = [
    {
      q: 'Can I be in more than one circle at the same time?',
      a: 'Yes. Your reputation score applies across all of them.',
    },
    {
      q: 'What if the circle never fills?',
      a: "If a circle doesn't reach its member target before the recruitment window closes, it's cancelled automatically. All collateral is returned. No one loses money.",
    },
    {
      q: 'Can the contribution amount change after the circle starts?',
      a: "No. It's fixed at creation. Everyone knows exactly what they're signing up for.",
    },
    {
      q: 'What if I lose access to my wallet?',
      a: 'Phone login users can recover using their phone number and the passkey on their device. Wallet users depend on their wallet provider — keep your seed phrase safe.',
    },
    {
      q: 'Can I invite people who have never used crypto?',
      a: 'Yes. Phone number login is designed for exactly this. Your members sign up with a number, not a seed phrase.',
    },
    {
      q: 'Does this work outside Africa?',
      a: 'Anywhere. The rotating savings model is global. Phone login works with any international number.',
    },
    {
      q: 'When is mainnet?',
      a: "After the Halborn audit completes and is reviewed, which is scheduled for Q3 2026. Follow us on Twitter or Discord for updates.",
    },
    {
      q: 'How do I report a bug?',
      a: 'Open an issue on GitHub or message us in Discord. We read everything.',
    },
  ];

  return (
    <>
      <PageTitle label="FAQ" tag="Reference" />
      {items.map((item, i) => (
        <FAQItem key={i} q={item.q} a={item.a} />
      ))}
      <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          Still stuck? <a href="#" style={{ color: 'var(--accent)' }}>Join the Discord</a> or{' '}
          <a href="https://github.com/IamHarrie-Labs/ajo" style={{ color: 'var(--accent)' }} target="_blank" rel="noreferrer">open an issue on GitHub</a>.
        </div>
      </div>
    </>
  );
}
