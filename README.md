# Ajo — Global Rotating Savings, Onchain

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945ff)](https://solana.com)
[![Token](https://img.shields.io/badge/Token-USDC-2775ca)](https://www.circle.com/usdc)
[![Status](https://img.shields.io/badge/Status-In%20Development-f59e0b)](https://github.com/IamHarrie-Labs/ajo)
[![Hackathon](https://img.shields.io/badge/Hackathon-Colosseum%20Frontier%202026-c8421a)](https://colosseum.org/frontier)

---

## What is Ajo?

Rotating savings clubs have existed for centuries across every culture on earth — called **ajo** in Nigeria, **tontine** in West Africa and France, **hui** in China, **chit funds** in India, **tandas** in Latin America. An estimated **$50 billion+** moves through these informal networks every year.

The problem: they run on trust, WhatsApp groups, and paper ledgers. When someone defaults, there is no recourse. When the organizer disappears, the money disappears too.

**Ajo brings rotating savings onchain.** A trustless smart contract holds contributions in escrow, enforces round deadlines, and automatically distributes the pot to each member in turn. No middleman. No missing funds. Permanent record on Solana.

---

## How It Works

1. **Create a circle** — set contribution amount (USDC), number of members (2–12), round frequency (weekly / biweekly / monthly)
2. **Invite members** — share a link; members join with their Solflare or Phantom wallet
3. **Contribute each round** — one-click USDC deposit before the round deadline
4. **Receive your payout** — when all members contribute, the pot auto-releases to the designated member for that round
5. **Repeat** until every member has received once — circle complete

---

## Why Solana

- Near-zero fees (~$0.001/tx) — critical when contribution amounts are small ($5–$50)
- Sub-second finality — members see confirmation instantly
- USDC native on Solana — no bridging, no wrapping
- Accessible globally — works anywhere with a Solflare or Phantom wallet

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Blockchain | Solana Mainnet |
| Smart Contract | Anchor (Rust) |
| Token | USDC (SPL) |
| Wallet | Solflare (primary), Phantom (fallback) |
| RPC | Quicknode |
| Frontend | Next.js + Tailwind CSS |
| Deploy | Vercel |

---

## Features

- Create and manage multiple savings circles simultaneously
- Flexible round frequency: weekly, biweekly, monthly
- Payout order: randomized on creation or voted by members
- Contribution status dashboard — see who has paid each round
- Grace period + admin controls for late contributors
- Full transaction history linked to Solana Explorer
- Mobile-responsive — works on phone browsers
- Friendly error messages — no raw blockchain errors shown to users

---

## Edge Cases Handled

| Scenario | Resolution |
|----------|-----------|
| Member misses deadline | 48h grace period → admin can vote to pause or exclude; unclaimed funds roll to next round |
| Member wants to leave | Can only leave between rounds with admin approval; payout slot transfers to reserve |
| Circle not full | Circle stays in `Pending` state until minimum members join |

---

## The Problem We Saw Firsthand

This project started from watching rotating savings circles operate in Nigeria — collecting contributions in cash, tracking via WhatsApp, resolving disputes through social pressure alone. Circles collapse when a trusted organizer moves away or a member defaults with no accountability.

The same problem exists in Filipino *paluwagan*, Mexican *tandas*, Korean *gye*, and countless other communities worldwide. The mechanism is brilliant. The infrastructure is broken. We're fixing the infrastructure.

---

## Project Status

- [x] Concept validated
- [x] Architecture designed (Anchor PDA escrow + SPL token CPI)
- [ ] Anchor program — in development (deploying via Solana Playground)
- [ ] Frontend scaffold — Next.js + wallet adapter
- [ ] Devnet testing
- [ ] Mainnet deployment
- [ ] Live URL (Vercel)

**Hackathon deadline:** May 11, 2026

---

## Hackathon Tracks

Submitted to **Colosseum Frontier 2026**:
- Main track (Grand Champion — $30k)
- Public Goods Award ($10k)
- Superteam Agentic Engineering Grant

---

## Team

[@StarkIndustries](https://x.com/StarkIndustries) — Builder — Nigeria  
GitHub: [IamHarrie-Labs](https://github.com/IamHarrie-Labs)

---

## License

MIT
