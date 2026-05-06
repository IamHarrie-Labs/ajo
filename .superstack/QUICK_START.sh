#!/bin/bash
# Ajo Quick Start Script
# Run this to set up your development environment

set -e

echo "🚀 Ajo MVP - Quick Start Setup"
echo "================================="
echo ""

# Step 1: Install Anchor if not present
if ! command -v anchor &> /dev/null; then
    echo "📦 Installing Anchor..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install 0.29.0
    avm use 0.29.0
else
    echo "✓ Anchor already installed"
fi

# Step 2: Verify Solana CLI
if ! command -v solana &> /dev/null; then
    echo "⚠️  Solana CLI not found. Install from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi
echo "✓ Solana CLI ready"

# Step 3: Install dependencies
echo "📚 Installing dependencies..."
npm install 2>/dev/null || yarn install 2>/dev/null

# Step 4: Create .env.local if it doesn't exist
if [ ! -f app/.env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp app/.env.local.example app/.env.local
    echo "⚠️  Remember to fill in:"
    echo "   - NEXT_PUBLIC_SOLANA_RPC_URL (get free key from https://helius.xyz/)"
    echo "   - NEXT_PUBLIC_PRIVY_APP_ID (get from https://dashboard.privy.io/)"
fi

# Step 5: Configure Solana devnet
echo "⚙️  Configuring Solana devnet..."
solana config set --url devnet

# Step 6: Show next steps
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get Helius API key: https://helius.xyz/"
echo "2. Get Privy App ID: https://dashboard.privy.io/"
echo "3. Edit app/.env.local with your keys"
echo "4. Run: npm run anchor:build"
echo "5. Run: npm run anchor:test"
echo ""
echo "Ready to build? Use Claude's build-with-claude skill for guided implementation!"
