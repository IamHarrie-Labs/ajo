# Idea Context: Ajo

**Status**: Validated  
**Phase**: Build (MVP)  
**Timeline**: Colosseum Frontier 2026 Hackathon (3-4 weeks)

---

## Core Idea

**Ajo**: Trustless rotating savings groups on Solana.

Rotating savings clubs (ajo/susu/tontine) move $50B+ annually but run on WhatsApp + trust. Ajo brings them onchain:
- Smart contract escrow (no fund loss)
- Automated payouts (no operator risk)
- Permanent reputation (on-chain history)
- Vote-based slashing (community enforcement)

**Target Market**: Africa-first (Nigeria use case), globally scalable.

---

## Problem

1. **Trust is the blocker**: When someone defaults, there's no recourse.
2. **Operator risk**: If the organizer vanishes, money vanishes.
3. **No verification**: How do you know contributions are real?
4. **Manual overhead**: Tracking who paid, managing rotations, handling disputes.

## Solution

**Ajo Protocol**:
- Fixed pools (N members, M USDC each)
- Linear rotation (randomized order, verifiable on-chain)
- Auto-escrow (funds locked until payout)
- Voting + slashing (community enforces defaults)
- Reputation system (wallet history visible forever)

---

## MVP Scope (Hackathon)

### Must Have
- [ ] Pool creation (fixed members, fixed amount, duration)
- [ ] Contribution tracking (real-time status)
- [ ] Auto-payouts (when all members pay)
- [ ] Simple voting (majority rules slashing)
- [ ] Reputation system (completion count + defaults)
- [ ] Dashboard + wallet auth

### Nice to Have
- [ ] Referral system
- [ ] Pool marketplace
- [ ] Telegram reminders
- [ ] Leaderboard

### Defer (Post-MVP)
- [ ] Multi-token support
- [ ] Yield farming
- [ ] Credit unlocking
- [ ] USSD/SMS
- [ ] Cross-chain

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Contracts | Anchor (Solana) |
| Frontend | Next.js 14 |
| Wallet | Privy |
| RPC | Helius devnet |
| Testing | LiteSVM + devnet |
| Deploy | Devnet (MVP), mainnet-beta (optional) |

---

## Differentiation

1. **First mover**: No existing rotating savings protocol on Solana
2. **Africa-focused UX**: Phone login (Privy), simple UI, fast tx
3. **Reputation-first**: On-chain history builds trust
4. **Community enforcement**: Voting > centralized moderation

---

## Hackathon Success Criteria

✅ Judges can:
1. Create a pool (3 members, 5 USDC)
2. Members contribute successfully
3. Payout executes automatically
4. Vote system works
5. Reputation visible
6. All on a clean, working dashboard

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Scope creep | Defer features aggressively |
| RPC limits | Use Helius + LiteSVM testing |
| Wallet friction | Privy handles UX |
| Contract bugs | Test on LiteSVM first |

---

## Timeline

**Week 1**: Anchor setup + core contracts  
**Week 2**: Frontend + dashboard  
**Week 3-4**: Testing, polish, demo prep

---

## Resources

- **GitHub**: https://github.com/IamHarrie-Labs/ajo
- **CLAUDE.md**: See project documentation
- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
