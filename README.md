# Circles — Rotating Savings, Onchain

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945ff)](https://solana.com)
[![Token](https://img.shields.io/badge/Token-USDC-2775ca)](https://www.circle.com/usdc)
[![Live on Devnet](https://img.shields.io/badge/Status-Live%20on%20Devnet-22c55e)](https://trycircles.vercel.app)
[![Hackathon](https://img.shields.io/badge/Hackathon-Colosseum%20Frontier%202026-c8421a)](https://colosseum.org/frontier)

**Live:** https://trycircles.vercel.app  
**Program ID (devnet):** `7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4`

---

## What is Circles?

Rotating savings clubs have existed for centuries across every culture on earth — called **ajo** in Nigeria, **susu** in Ghana, **tontine** in West Africa, **hui** in China, **chit funds** in India, **tandas** in Latin America. An estimated **$50 billion+** moves through these informal networks every year.

The problem: they run on trust, WhatsApp groups, and paper ledgers. When someone defaults, there is no recourse. When the organizer disappears, the money disappears too.

**Circles brings rotating savings onchain.** A trustless Anchor program holds contributions in escrow, enforces round deadlines, and automatically distributes the pot to each member in turn. No middleman. No missing funds. Permanent record on Solana.

---

## How It Works

1. **Create a circle** — set contribution amount (USDC), add member wallet addresses, pick a cycle
2. **Invite members** — share a `/join/:poolId` link; members open a join modal directly
3. **Contribute each round** — one-click USDC deposit, wallet-signed transaction
4. **Payout auto-executes** — when all members contribute, the pot releases to the current round's recipient; next round begins
5. **Repeat** until every member has received once — circle complete

---

## What Judges Can Do Right Now (Devnet)

1. Visit https://trycircles.vercel.app and connect Phantom, Solflare, or Backpack
2. Use the built-in faucet to get test USDC
3. Swap SOL → USDC via the Jupiter widget
4. Create a pool with any member addresses and a contribution amount
5. Contribute to the current round (real on-chain tx)
6. Watch the live countdown timer tick down to the round deadline
7. Vote to slash a late member — majority threshold executes on-chain
8. Share a `/join/:poolId` invite link that opens the join modal
9. Check on-chain reputation stats on the Profile page
10. View all on-chain activity in the live feed (polls every 30s)

---

## Why Solana

- Near-zero fees (~$0.001/tx) — critical when contribution amounts are small ($5–$50)
- Sub-second finality — members see confirmation immediately
- USDC native on Solana — no bridging or wrapping
- Accessible globally — works anywhere with Phantom, Solflare, or Backpack

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Blockchain | Solana (devnet) |
| Smart Contract | Anchor 0.30.1 (Rust) |
| Token | USDC SPL (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`) |
| Wallet | Phantom, Solflare, Backpack |
| RPC | Helius (devnet) |
| Frontend | Next.js 14 + TypeScript |
| Swap | Jupiter Terminal (SOL → USDC) |
| Deploy | Vercel |

---

## Smart Contract

**Program ID:** `7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4`

### Instructions
- `create_pool` — initializes pool PDA with members, contribution amount, and rotation order
- `contribute` — member deposits USDC to pool vault; marks contribution slot; updates `MemberReputation`
- `execute_payout` — permissionless trigger once all members contribute; sends pot to current recipient; advances round
- `vote_slash` — cast a slash vote against a late member; majority executes collateral distribution

### Key PDAs
- `["pool", creator, pool_id]` — Pool state
- `["vault", pool]` — SPL token escrow (program-controlled, no admin key)
- `["member", wallet]` — On-chain reputation counter per wallet
- `["vote", pool, target, round]` — Voting record per target per round

---

## On-Chain Reputation

Every wallet accumulates a `MemberReputation` account tracking:
- Pools completed
- Defaults recorded
- Payment streaks

This is composable — any other protocol can query a wallet's track record. A member's history becomes a credit score they own permanently.

---

## Features

- [x] Wallet connect — Phantom / Solflare / Backpack, session persists on refresh
- [x] Real devnet USDC balance on connect
- [x] Built-in USDC faucet (100 USDC test tokens)
- [x] Jupiter swap widget (SOL → devnet USDC)
- [x] Create pool — on-chain tx with member list and contribution amount
- [x] Contribute to current round — wallet-signed USDC transfer
- [x] Execute payout — permissionless, triggers when all members contribute
- [x] Vote to slash — majority vote triggers slashing on-chain
- [x] Live countdown timers per pool (1s tick)
- [x] On-chain activity feed — polls every 30s via `getSignaturesForAddress`
- [x] Pool invite links — `/join/:poolId` deep links with join modal
- [x] On-chain reputation display (Profile page)
- [x] Discover page — browse all active non-completed pools on-chain
- [x] Mobile-responsive — bottom nav, full mobile layout
- [x] Light / dark theme toggle
- [x] MagicBlock private contributions toggle (TEE-encrypted amounts)

---

## What's Next

- Privy phone number login (SMS OTP — no wallet required, critical for Africa-first UX)
- Telegram bot reminders before round deadlines
- Pool marketplace with reputation-filtered discovery
- Multi-token support (USDT, native SOL)
- Yield on idle vault funds between rounds
- Mainnet-beta deployment

---

## Project Structure

```
ajo/
├── programs/ajo/src/        # Anchor program (Rust)
│   ├── lib.rs
│   ├── instructions/        # create_pool, contribute, execute_payout, vote_slash
│   └── state/               # Pool, Member, VotingRecord
├── app/src/
│   ├── app/page.tsx         # Root SPA, wallet auth, routing
│   ├── components/          # Dashboard, PoolDetail, Discover, Profile, Landing…
│   ├── lib/anchor-client.ts # All Anchor calls + activity fetcher
│   └── styles/              # Design system (CSS variables, dark/light themes)
└── SUBMISSION.md            # Hackathon submission writeup
```

---

## Team

[@IamHarrie](https://x.com/IamHarrie) — Builder  
GitHub: [IamHarrie-Labs](https://github.com/IamHarrie-Labs)

---

## License

MIT
