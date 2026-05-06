# Ajo Hackathon MVP - Setup Guide

## Prerequisites

- **Node.js**: v18+ (for frontend + CLI tools)
- **Rust**: Latest (for Anchor contracts)
- **Solana CLI**: Latest version
- **Anchor**: 0.29.0

### Quick Install (macOS/Linux)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

### Verify Installation

```bash
solana --version  # Should be 1.18.0+
anchor --version  # Should be 0.29.0
rustc --version   # Should be latest
node --version    # Should be 18+
```

---

## Project Setup

### 1. Install Dependencies

```bash
# From project root
yarn install
```

### 2. Configure Solana Devnet Wallet

```bash
# Generate new keypair (or use existing)
solana-keygen new

# Set default RPC to devnet
solana config set --url devnet

# Airdrop 5 SOL for testing
solana airdrop 5
```

### 3. Configure Environment Variables

Create `.env.local` in the `app/` directory:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

**Get Helius API Key**: https://helius.xyz/ (free tier includes devnet)  
**Get Privy App ID**: https://dashboard.privy.io/ (create free account)

---

## Development Workflow

### Terminal 1: Build & Deploy Smart Contracts

```bash
# Build Anchor program
yarn anchor:build

# Run tests
yarn anchor:test

# Deploy to devnet
yarn anchor:deploy

# After deployment, copy program ID to:
# - app/.env.local
# - programs/ajo/src/lib.rs (declare_id! macro)
```

### Terminal 2: Run Frontend

```bash
# From project root
yarn workspace ajo-app dev

# Open http://localhost:3000
```

---

## Project Structure Quick Reference

```
ajo/
├── programs/ajo/          # Anchor smart contracts
│   ├── src/
│   │   ├── lib.rs         # Main program entry
│   │   ├── instructions/  # IX handlers (create_pool, contribute, etc.)
│   │   └── state/         # On-chain state (Pool, Member, Voting)
│   └── Cargo.toml
├── app/                   # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages (layout, dashboard, etc.)
│   │   ├── components/    # React components
│   │   └── lib/           # Solana helpers
│   └── package.json
├── CLAUDE.md              # Project context for Claude
├── SETUP.md               # This file
└── README.md              # Product overview
```

---

## Common Commands

```bash
# Smart Contracts
yarn anchor:build          # Compile Anchor program
yarn anchor:test           # Run contract tests
yarn anchor:deploy         # Deploy to devnet

# Frontend
yarn workspace ajo-app dev # Start dev server
yarn workspace ajo-app build # Build for production

# Utilities
solana balance             # Check wallet balance
solana airdrop 5           # Get devnet SOL
solana account [PUBKEY]    # Inspect account state
```

---

## Next Steps

1. ✅ **Setup complete**
2. → Run `yarn anchor:build` to compile contracts
3. → Run `yarn anchor:test` to verify test framework
4. → Use Claude `build-with-claude` skill for guided implementation
5. → Implement Phase 1 (contracts) then Phase 2 (frontend)

---

## Troubleshooting

### "Anchor not found"
```bash
avm use 0.29.0
```

### "RPC rate limited"
Get free Helius API key or use local testing with LiteSVM

### "Wallet balance zero"
```bash
solana airdrop 5
solana balance
```

### Port 3000 already in use
```bash
yarn workspace ajo-app dev -- -p 3001
```

---

## Resources

- [Anchor Book](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Privy Docs](https://docs.privy.io/)

---

Ready to build? Run `yarn anchor:build` next!
