# Ajo — Onchain Rotating Savings

## What is Ajo?

Rotating savings clubs (ajo/susu/tontine/hui/tandas) have existed for centuries across every culture. An estimated **$50 billion+** moves through these informal networks annually. The problem: they run on trust, WhatsApp, and paper ledgers. When someone defaults, there's no recourse. When the organizer vanishes, so does the money.

**Ajo brings rotating savings onchain.** A trustless smart contract holds contributions in escrow, enforces deadlines, and automatically distributes the pot to each member in turn.

**Target**: Africa-first, but globally applicable.

---

## Hackathon MVP Scope (3-4 weeks)

### ✅ MUST HAVE (core product)

1. **Pool Creation & Management**
   - Fixed USDC pools only
   - Fixed member count & contribution amount per round
   - Simple admin controls (create, withdraw)

2. **Rotation & Auto Payouts**
   - Linear rotation order (randomized at pool creation)
   - Auto-execute payouts when all members contribute
   - On-chain escrow handling (no fund loss)

3. **Payment & Status Tracking**
   - Members deposit contributions to current round
   - Real-time contribution status (who paid, who hasn't)
   - Flag missing members for voting

4. **On-Chain Reputation System**
   - Completion count (pools successfully finished)
   - Default record (missed contributions)
   - Display on pool card + leaderboard

5. **Simple Voting**
   - Vote to slash defaulters (recover from collateral)
   - Simple majority rules
   - One vote = one member

6. **Dashboard + Wallet Auth**
   - My pools (created + joined)
   - Active round status + countdown
   - Contribute button
   - Wallet auth: Privy (phone number login, best UX for Africa)

### 🟡 HIGH-IMPACT ADD-ONS (if time permits)

- Referral code system (tracked on-chain)
- Pool marketplace discovery (browse by amount/duration)
- Telegram bot for reminders (before due date)
- "Next payout date" highlight in UI

### 🔴 DEFER (post-hackathon)

- Multi-token support (USDT, SOL)
- Yield farming on idle funds
- Credit unlocking system
- USSD/SMS integration
- Cross-chain expansion

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| **Smart Contracts** | Anchor (Rust) | Native Solana, best developer experience, perfect for pools + voting |
| **Frontend** | Next.js 14 + TypeScript | Fast iteration, built-in API routes, TailwindCSS |
| **Wallet Integration** | Privy | Best UX for Africa (phone number login), social recovery |
| **RPC** | Helius (devnet) | Free tier, reliable, no quota issues |
| **Testing** | LiteSVM + web3-js | Fast local testing, no network latency |
| **Database** | On-chain + optional DB | Pool metadata on-chain; Discord/Supabase for activity feed if needed |
| **Deployment** | Solana Devnet | Launch here; mainnet-beta for final demo |

---

## Project Structure

```
ajo/
├── programs/
│   └── ajo/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   │   ├── create_pool.rs
│       │   │   ├── contribute.rs
│       │   │   ├── vote_slash.rs
│       │   │   └── execute_payout.rs
│       │   └── state/
│       │       ├── pool.rs
│       │       ├── member.rs
│       │       └── voting.rs
│       ├── Cargo.toml
│       └── tests/
├── app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── pools/ (Pool pages)
│   │   │   └── create/ (Create pool form)
│   │   └── components/
│   │       ├── PoolCard.tsx
│   │       ├── ContributeForm.tsx
│   │       ├── VotingPanel.tsx
│   │       └── ReputationLeaderboard.tsx
│   ├── package.json
│   └── next.config.js
├── .superstack/
│   ├── build-context.md (stack decisions)
│   └── idea-context.md (hackathon scope)
├── CLAUDE.md (this file)
└── README.md
```

---

## Smart Contract Architecture

### Core State

**Pool**:
```
- id: pubkey (unique pool identifier)
- creator: pubkey
- members: vec<pubkey> (rotation order)
- contribution_amount: u64 (USDC lamports)
- current_round: u32
- current_recipient_idx: u32
- pool_vault: pubkey (escrow account)
- created_at: i64
- status: Active | Completed | Defaulted
```

**Member**:
```
- wallet: pubkey
- pools_joined: u32
- pools_completed: u32
- defaults: u32 (times defaulted)
- collateral_staked: u64 (for this pool)
```

**VotingRecord**:
```
- pool: pubkey
- target_member: pubkey
- vote_count: u32
- threshold: u32 (majority)
- executed: bool
```

### Key Instructions

1. `create_pool(members[], amount, duration)` → Initialize pool, randomize order
2. `contribute(pool, amount)` → Deposit to current round
3. `execute_payout(pool)` → Trigger payout when ready
4. `vote_slash(pool, member)` → Vote to slash defaulter
5. `claim_slashed_funds(pool)` → Distribute from slashing to non-defaulters

---

## Frontend Architecture

### Pages

- **Dashboard** (`/`): My pools + quick stats
- **Pool Detail** (`/pools/[id]`): Full round status, member list, contribute form
- **Create Pool** (`/create`): Form to initialize new pool
- **Leaderboard** (`/reputation`): Top members by completion rate

### Key Components

- `PoolCard`: Show pool status, next payout, members
- `ContributeForm`: Input amount, confirm, sign tx
- `VotingPanel`: Show voting options, vote on defaulter
- `ReputationLeaderboard`: Sort by completion count + defaults
- `WalletConnect`: Privy integration with fallback to Unified Wallet

---

## Hackathon Success Criteria

✅ **Judges can**:
1. Create a pool with 3 members, 5 USDC each
2. All members contribute successfully
3. First member receives payout automatically
4. Next round starts, members can see status
5. Vote system works (vote to slash a defaulter)
6. Reputation shows on wallet profile
7. See all this on a clean dashboard

✅ **Technical**:
- Smart contracts deployed on devnet + verified
- IDL generated and synced with frontend
- All instructions working + tested
- No funds lost in escrow

---

## Build Phases

### Phase 1: Core Contracts (Week 1)
- [ ] Pool creation & randomization
- [ ] Contribution tracking
- [ ] Payout automation
- [ ] Vote + slashing logic

### Phase 2: Frontend (Week 2)
- [ ] Dashboard layout
- [ ] Pool detail page
- [ ] Contribute form
- [ ] Wallet auth (Privy)

### Phase 3: Polish (Week 3-4)
- [ ] Reputation display
- [ ] Leaderboard
- [ ] Error handling
- [ ] Testing on devnet

---

## Resources & Links

- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Privy Docs**: https://docs.privy.io/
- **Helius RPC**: https://helius.xyz/
- **TailwindCSS**: https://tailwindcss.com/

---

## Notes for Claude

- **Focus on MVP**: Don't over-engineer. Simple is better.
- **Devnet first**: Test all instructions on devnet before considering mainnet.
- **Reputation matters**: The on-chain reputation system is what makes people trust this. Get it right.
- **Collateral is optional**: For MVP, voting + slashing is enough. Add collateral staking in Phase 2 if time.
- **Africa-first UX**: Phone number login (Privy), simple language, fast tx confirmation.
- **Testnet funds**: Use devnet USDC; Helius faucet for SOL.

---

## Skills to Install

- `build-with-claude`: Guided step-by-step MVP implementation
- `debug-program`: Anchor contract debugging
- `deploy-to-mainnet`: Later phase (mainnet-beta rollout)

---

## Contact & Questions

- **GitHub**: https://github.com/IamHarrie-Labs/ajo
- **Hackathon**: Colosseum Frontier 2026
- **Status**: MVP scaffolding complete, ready to build
