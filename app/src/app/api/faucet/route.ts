/**
 * /api/faucet  — Devnet USDC faucet (demo mode)
 *
 * In demo mode (no FAUCET_MINT_AUTHORITY_KEY), returns a synthetic success
 * so the UI can update the displayed balance without a real on-chain tx.
 *
 * For real minting you would need a custom devnet USDC mint whose authority
 * key is stored in FAUCET_MINT_AUTHORITY_KEY.  The real minting path is
 * intentionally stubbed so the build has zero extra dependencies.
 *
 * POST body: { wallet: "<base58 pubkey>" }
 * Response:  { sig: string; amount: number; demo?: boolean } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

const AMOUNT_USDC = 100;

export async function POST(req: NextRequest) {
  try {
    const { wallet } = (await req.json()) as { wallet?: string };
    if (!wallet) {
      return NextResponse.json({ error: 'wallet address required' }, { status: 400 });
    }

    // Validate the address
    try { new PublicKey(wallet); } catch {
      return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
    }

    // If a mint-authority key is configured, real minting would go here.
    // For the hackathon MVP we return a demo success — the UI balance updates
    // locally; the user can get real devnet USDC from https://faucet.circle.com/
    return NextResponse.json({
      sig:   `demo-faucet-${Date.now()}`,
      amount: AMOUNT_USDC,
      demo:  true,
      note:  'UI balance updated. For real devnet USDC visit https://faucet.circle.com/',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Faucet error';
    console.error('[faucet]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
