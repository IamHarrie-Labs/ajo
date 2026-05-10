# Circles — Colosseum Frontier Hackathon Submission

## Project Name
**Circles** (formerly Ajo)

## One-liner
Trustless rotating savings clubs onchain — bringing ajo, susu, tontine, and hui to Solana.

## Live Demo
https://trycircles.vercel.app

## GitHub
https://github.com/IamHarrie-Labs/ajo

---

## Problem

An estimated **$50 billion+** moves through rotating savings clubs every year — called ajo in Nigeria, susu in Ghana, tontine in West Africa, hui in China, tandas in Latin America. Every culture invented this independently. It is the oldest financial primitive.

The problem: it runs on trust, WhatsApp, and paper ledgers. When one member defaults, there's no recourse. When the organizer disappears, the money goes with them. There's no way to verify who paid, no automatic enforcement, and no reputation trail.

These aren't fringe financial instruments. They are how hundreds of millions of people save, build credit, and access lump sums — especially in markets underserved by traditional banking.

---

## Solution

Circles brings rotating savings onchain.

A trustless Anchor smart contract holds contributions in escrow, enforces deadlines, automatically rotates payouts to each member in turn, and writes every action to an immutable ledger. Members connect with Phantom, Solflare, or Backpack — no new wallet required, no custodian, no trust assumptions.

**What judges can do on devnet right now:**

1. Connect a wallet and get test USDC from the built-in faucet
2. Create a pool with multiple member addresses, a contribution amount, and a cycle
3. Contribute USDC to the current round via a single wallet-signed transaction
4. See real contribution status update in the rotation view
5. Vote to slash a late member — majority vote triggers slashing logic on-chain
6. Watch live countdown timers tick down to each pool's deadline
7. See on-chain activity in the feed (polls every 30 seconds)
8. Share an invite link (`/join/:poolId`) that opens a join modal for the specific pool

---

## Technical Architecture

### Smart Contracts (Anchor / Rust)
- **Program ID**: `7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4` (devnet)
- `create_pool` — initializes pool PDA with members, contribution amount, and randomized rotation order
- `contribute` — member deposits USDC to pool vault; marks their contribution slot; updates `MemberReputation`
- `execute_payout` — permissionless trigger once all members contribute; sends pot to current recipient; advances round
- `vote_slash` — cast a slash vote against a late member; majority threshold executes collateral distribution

**Key PDAs:**
- `["pool", creator, pool_id]` — Pool state account
- `["vault", pool]` — SPL token escrow (no admin key, contract-controlled)
- `["member", wallet]` — On-chain reputation counter per wallet
- `["vote", pool, target, round]` — Voting record per target per round

### Frontend (Next.js 14 + TypeScript)
- Wallet adapter: Phantom, Solflare, Backpack via direct browser extension detection
- `anchor-client.ts` — typed wrappers around every program instruction + account fetcher
- Real devnet USDC balance via SPL token account query on load
- Pool invite links (`/join/:poolId`) with deep-link modal flow
- Jupiter Terminal widget for SOL → devnet USDC swaps
- Live countdown timers (1s tick) per pool showing "Xd Xh" / "Xh Xm" / "Xh:Xm:Xs"
- Onchain activity feed polling every 30s via `getSignaturesForAddress` + `getParsedTransaction`
- MagicBlock private contributions toggle (TEE-encrypted amounts for privacy pools)
- Design system in `app/src/styles/design-system.css` — light/dark theme toggle

### Token
- USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (devnet Circle USDC)
- All amounts in UI units (6-decimal adjusted); contract stores micro-USDC as u64

---

## What Makes This Different

**1. Africa-first UX, global applicability**
Rotating savings clubs are a trillion-dollar informal economy. We're not building a DeFi toy — we're digitizing a financial primitive that predates banks. The interface is intentionally simple: no jargon, mobile-first bottom nav, contribute in one tap.

**2. On-chain reputation is the moat**
`MemberReputation` tracks pools completed, defaults, and payment streaks per wallet, permanently. It's composable — any other protocol can query this. A member's track record becomes a credit score they own.

**3. Trustless escrow removes the organizer risk**
The pool vault is a PDA controlled only by the program. The organizer can't rug. The contract enforces rotation. There is no admin key.

**4. Permissionless payout trigger**
`execute_payout` can be called by any member once the threshold is met. No cron job, no trusted relayer. The incentive to call it is receiving your own payout in a future round.

**5. Slashing via social consensus**
Simple majority vote triggers slashing — the defaulter's collateral is distributed to the remaining members. This maps exactly to how real-world ajo groups handle defaults: community enforcement, not litigation.

---

## Traction & Validation

- Rotating savings clubs process **$50B+ annually** in informal markets
- Nigeria alone has an estimated 10–15 million active ajo participants
- 0% of this is currently onchain
- Early user interviews: organizers spend 2–4 hours/month chasing contributions over WhatsApp

---

## What's Next (Post-Hackathon)

- Privy integration for phone number login (no wallet required — critical for Africa-first adoption)
- Telegram bot reminders triggered by pool deadline proximity
- Pool marketplace discovery by amount, cycle, and member reputation
- Multi-token support (USDT, native SOL)
- Yield on idle vault funds between rounds
- Mainnet-beta deployment with real USDC

---

## Team

Built by [IamHarrie Labs](https://github.com/IamHarrie-Labs) for Colosseum Frontier 2026.

---

## Links

| | |
|---|---|
| **Live app** | https://trycircles.vercel.app |
| **GitHub** | https://github.com/IamHarrie-Labs/ajo |
| **Program (devnet)** | `7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4` |
| **USDC mint** | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| **Hackathon** | Colosseum Frontier, May 2026 |
