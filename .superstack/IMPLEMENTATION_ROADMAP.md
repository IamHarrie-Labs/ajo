# Ajo MVP Implementation Roadmap

**Timeline**: 3-4 weeks (hackathon)  
**Target**: Working devnet MVP with judges demo

---

## Phase 1: Smart Contracts (Week 1)

### Goal
All 5 core instructions working + tested on LiteSVM

### Tasks

#### 1.1 Pool Creation (`create_pool`)
- [ ] Initialize Pool account with:
  - Member list (no duplicates, creator included)
  - Contribution amount (USDC lamports)
  - Duration (days)
  - Randomized rotation order
- [ ] Create token vault account (escrow)
- [ ] Store pool ID, creation timestamp
- [ ] Test: Create pool with 3 members, verify state

#### 1.2 Contribution Tracking (`contribute`)
- [ ] Verify caller is pool member
- [ ] Transfer USDC from member wallet → pool vault
- [ ] Update contribution tracking (who paid this round)
- [ ] Check if all members contributed → trigger payout auto-call
- [ ] Test: Member contributes, verify balance transferred

#### 1.3 Auto Payouts (`execute_payout`)
- [ ] Verify all members have contributed
- [ ] Get current recipient (from rotation order)
- [ ] Transfer full pool amount to recipient
- [ ] Advance rotation index
- [ ] Reset contribution tracking for next round
- [ ] Increment pool round counter
- [ ] Test: All contribute → payout executes to correct recipient

#### 1.4 Voting + Slashing (`vote_slash`, `claim_slashed_funds`)
- [ ] Record vote against defaulter
- [ ] Check majority threshold (50%+ of members)
- [ ] If threshold reached → slash collateral
- [ ] Distribute slashed funds equally to non-defaulters
- [ ] Test: Vote to slash, funds distributed correctly

#### 1.5 Reputation System
- [ ] Track per-wallet: pools_completed, pools_joined, defaults
- [ ] Create MemberAccount to store reputation
- [ ] Increment completion count after pool finishes
- [ ] Increment default count if member missed payment
- [ ] Test: Complete pool → reputation updated

#### 1.6 Contract Testing
- [ ] Unit tests for each instruction (LiteSVM)
- [ ] Integration tests for multi-round flow
- [ ] Test error cases (non-member, wrong amount, etc.)
- [ ] Run: `anchor test`
- [ ] All tests passing ✓

---

## Phase 2: Frontend (Week 2)

### Goal
Dashboard + pool management UI connected to contracts

### Tasks

#### 2.1 Wallet Integration
- [ ] Integrate Privy for phone login
- [ ] Add wallet selection UI (Privy + Phantom fallback)
- [ ] Store user wallet address in React context
- [ ] Fetch user's reputation score on-chain
- [ ] Test: Login → wallet connected → address displayed

#### 2.2 Dashboard Page
- [ ] Display "My Pools" (created + joined)
- [ ] Show active pools with current round status
- [ ] Show pool stats: members, contribution amount, next payout date
- [ ] Display user's reputation score
- [ ] Add "Create Pool" button
- [ ] Test: Login → See all user's pools

#### 2.3 Create Pool Form
- [ ] Input: members (list of wallets)
- [ ] Input: contribution amount
- [ ] Input: duration (days)
- [ ] Button: Create pool
- [ ] Call `create_pool` instruction
- [ ] Confirm transaction → show pool created
- [ ] Test: Create pool → confirm on devnet explorer

#### 2.4 Pool Detail Page
- [ ] Show pool info: members, rotation order, current round
- [ ] Show contribution status (who paid, who hasn't)
- [ ] Display next recipient (highlighted)
- [ ] "Contribute" button + form
- [ ] "Vote to Slash" panel (if applicable)
- [ ] Test: See pool detail → see member contributions

#### 2.5 Contribute Form
- [ ] Show contribution amount required
- [ ] Sign transaction (using wallet)
- [ ] Call `contribute` instruction
- [ ] Show confirmation + balance update
- [ ] Test: Contribute → funds appear in vault

#### 2.6 Voting Panel
- [ ] Show members who defaulted
- [ ] Vote button for each defaulter
- [ ] Call `vote_slash` instruction
- [ ] Show vote count vs. threshold
- [ ] Claim button after slashing (if applicable)
- [ ] Test: Vote → vote recorded → threshold reached → slash executes

#### 2.7 Leaderboard
- [ ] Fetch top reputation scores on-chain
- [ ] Display: wallet, completion count, defaults, score
- [ ] Sort by score descending
- [ ] Test: See top members by reputation

---

## Phase 3: Polish & Demo (Week 3-4)

### Goal
Production-ready devnet MVP for hackathon judges

### Tasks

#### 3.1 Error Handling
- [ ] Graceful error messages (insufficient balance, not a member, etc.)
- [ ] Transaction failure handling + retry
- [ ] Network timeout handling
- [ ] Test: Trigger various errors → see user-friendly messages

#### 3.2 UI Polish
- [ ] Responsive design (mobile-first for Africa focus)
- [ ] Loading states (contribution in progress, etc.)
- [ ] Confirmation modals before irreversible actions
- [ ] Success/failure toast notifications
- [ ] Test: Mobile view looks good, all interactions feel smooth

#### 3.3 Testing on Devnet
- [ ] Deploy contracts to devnet
- [ ] Fund test wallets with devnet USDC
- [ ] Create test pools with multiple members
- [ ] Full end-to-end flow: create → contribute → vote → payout
- [ ] Verify reputation updates correctly
- [ ] Test: Full flow works devnet → no funds lost

#### 3.4 Demo Preparation
- [ ] Create demo script (5 min walkthrough)
- [ ] Pre-fund 3 test wallets with SOL + USDC
- [ ] Create sample pool ready for demo
- [ ] Document judges' actions:
  1. Create new pool (3 members, 5 USDC)
  2. Members contribute successfully
  3. Payout executes automatically
  4. Vote to slash a defaulter
  5. See reputation leaderboard
- [ ] Test: Run full demo 3× without errors

#### 3.5 Final Checks
- [ ] All instructions working on devnet ✓
- [ ] No funds lost in escrow ✓
- [ ] Reputation system accurate ✓
- [ ] UI responsive + error handling ✓
- [ ] Ready for judge demo ✓

---

## Milestone Checklist

### End of Week 1
- [ ] `anchor build` succeeds
- [ ] `anchor test` all passing
- [ ] All 5 instructions implemented + tested
- [ ] Can call instructions manually via CLI

### End of Week 2
- [ ] Frontend builds without errors
- [ ] Wallet auth working (Privy login)
- [ ] Can create pool from UI
- [ ] Can contribute from UI
- [ ] Can vote from UI

### End of Week 3-4
- [ ] Full E2E flow works on devnet
- [ ] Demo script ready
- [ ] UI looks polished on mobile
- [ ] Judges can complete full flow in 5 min
- [ ] SHIP IT 🚀

---

## Key Decisions

### Why these instructions?
- **create_pool**: Requires pool initialization, randomization, escrow setup
- **contribute**: Core user action, checks for auto-payout trigger
- **execute_payout**: Automation (later: can add cron via Clockwork)
- **vote_slash**: Trust mechanism (critical for Africa use case)
- **claim_slashed_funds**: Incentive for participation (safety net)

### Why Reputation?
- On-chain proof of trustworthiness
- Wallet history visible forever
- Differentiates from WhatsApp-based pools
- Enables future credit layer (Phase 2)

### Why Privy?
- Best UX for Africa (phone login, no seed phrase)
- Social recovery (family members can help)
- Fallback to Phantom for power users

---

## Tips for Success

1. **Build incrementally**: Get `create_pool` working first, then `contribute`, etc.
2. **Test early**: Use LiteSVM for instant feedback before devnet.
3. **Defer visuals**: MVP = functional, not beautiful. Polish last.
4. **Document as you go**: Future-you will thank present-you.
5. **Demo often**: Show judges the feature as soon as it's working.

---

## Resources

- Anchor Docs: https://www.anchor-lang.com/
- Solana Cookbook: https://solanacookbook.com/
- Web3.js: https://solana-labs.github.io/solana-web3.js/
- Privy: https://docs.privy.io/
- LiteSVM: Local testing without RPC

---

**Ready?** Run `build-with-claude` to get started on Phase 1!
