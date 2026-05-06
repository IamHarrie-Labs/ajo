# Build Context: Ajo MVP (Hackathon Phase)

**Phase**: 2 (Build)  
**Status**: Scaffolding complete, ready for implementation  
**Timeline**: 3-4 weeks (hackathon)  
**Target**: Devnet MVP with working contracts + dashboard

---

## Stack Decisions

### Smart Contracts
- **Framework**: Anchor (Rust)
- **Chain**: Solana Devnet (launch), Devnet (test), optional mainnet-beta for demo
- **Key Libraries**:
  - `anchor-lang`: Smart contract framework
  - `spl-token`: USDC handling
  - `clockwork`: Optional for cron payouts (deferred to Phase 2)

**Why Anchor**: Native Solana DX, excellent type safety, IDL auto-generation for frontend.

### Frontend
- **Framework**: Next.js 14 (TypeScript)
- **UI**: TailwindCSS + shadcn/ui (optional)
- **Wallet**: Privy (primary) + Unified Wallet Adapter (fallback)
- **Libraries**:
  - `@solana/web3.js`: Solana RPC
  - `@anchor-lang/anchor`: IDL + instruction parsing
  - `@privy-io/react-auth`: Wallet + auth

**Why Next.js**: Fast iteration, built-in API routes, SSR for pool metadata.  
**Why Privy**: Best UX for Africa (phone login), social recovery, no seed phrase friction.

### Testing
- **Unit Tests**: LiteSVM (fast local testing without RPC)
- **Integration Tests**: Devnet (real chain state)
- **Frontend**: Jest + React Testing Library (optional for MVP)

### Deployment
- **Smart Contracts**: Devnet (Phase 1), optional mainnet-beta (Phase 3)
- **Frontend**: Vercel (or self-hosted)
- **RPC**: Helius (free tier, devnet)

### Database (Optional for MVP)
- **On-Chain**: Pool state, member reputation, voting records
- **Off-Chain**: Optional Supabase/Firebase for activity feed + leaderboard caching

---

## Architecture Decision

**Integrate vs. Build**: BUILD
- No existing rotating savings protocol on Solana
- Building is faster than integrating (no external protocol risk)
- Scope is well-defined (pools, voting, payouts)

---

## Build Status

```json
{
  "mvp_complete": false,
  "tests_passing": false,
  "devnet_deployed": false,
  "estimated_completion": "3-4 weeks",
  "next_phase": "build-with-claude"
}
```

---

## Project Structure

```
ajo/
├── programs/
│   └── ajo/                    # Anchor smart contracts
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   │   ├── mod.rs
│       │   │   ├── create_pool.rs
│       │   │   ├── contribute.rs
│       │   │   ├── execute_payout.rs
│       │   │   └── vote_slash.rs
│       │   └── state/
│       │       ├── mod.rs
│       │       ├── pool.rs
│       │       ├── member.rs
│       │       └── voting.rs
│       ├── Cargo.toml
│       └── tests/
│           └── integration_tests.rs
├── app/                        # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── pools/
│   │   │   │   └── [id]/page.tsx
│   │   │   └── create/page.tsx
│   │   ├── components/
│   │   │   ├── PoolCard.tsx
│   │   │   ├── ContributeForm.tsx
│   │   │   ├── VotingPanel.tsx
│   │   │   └── WalletConnect.tsx
│   │   └── lib/
│   │       └── solana.ts       # Web3 helpers
│   ├── package.json
│   └── next.config.js
├── .superstack/
│   ├── build-context.md        # This file
│   └── idea-context.md
├── CLAUDE.md                   # Project documentation
└── README.md
```

---

## Skills to Install

1. **build-with-claude**: Guided step-by-step implementation
   - Use after scaffold to build Phase 1 (contracts)
   - Then Phase 2 (frontend)

2. **debug-program**: Anchor debugging
   - Use when contract tests fail
   - For instruction parsing issues

3. **deploy-to-mainnet**: Mainnet deployment (Phase 3+)
   - Not needed for MVP, but bookmark for after demo

---

## Configuration

### Anchor.toml
```toml
[toolchain]
anchor_version = "0.29.0"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet]
ajo = "JAjO11111111111111111111111111111111111111111"  # TBD after deploy
```

### .env.local (Frontend)
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

---

## Development Workflow

1. **Day 1-2**: Anchor setup + contract skeleton
2. **Day 3-5**: Implement core instructions (create, contribute, payout)
3. **Day 6-7**: Voting + slashing logic
4. **Day 8-10**: Frontend setup + dashboard
5. **Day 11-14**: Integrate contracts + forms
6. **Day 15+**: Testing, polish, deploy

---

## Success Metrics

- ✅ All 5 core instructions working on devnet
- ✅ Dashboard displays active pools
- ✅ Members can contribute + see status
- ✅ Voting works + slashing executes
- ✅ Reputation visible on leaderboard
- ✅ No funds lost in escrow
- ✅ Devnet demo ready for judges

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Anchor version conflicts | Slow setup | Pin to 0.29.0 early |
| RPC rate limits | Blocked testing | Use Helius free tier + local testing |
| Wallet integration delays | Slow frontend | Start with simple web3.js, add Privy later |
| Contract bugs in voting | Critical | Test voting + slashing on LiteSVM first |
| Time overrun | Incomplete MVP | Cut features early (defer marketplace, email bot) |

---

## Next Steps

1. ✅ Scaffold complete (CLAUDE.md + this file)
2. → Run `build-with-claude` to implement Phase 1 (contracts)
3. → Implement Phase 2 (frontend) guided by build skill
4. → Deploy to devnet + test
5. → Polish for hackathon demo

---

**Last Updated**: 2026-05-02  
**Hacker**: IamHarrie  
**Hackathon**: Colosseum Frontier 2026
