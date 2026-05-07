/**
 * MagicBlock Private Payments
 *
 * Contributions to private circles go through MagicBlock's Private Ephemeral
 * Rollup. The API builds a Solana transaction that wraps the SPL transfer
 * inside an Intel TDX hardware enclave, hiding the amount, sender, and
 * recipient on-chain.
 *
 * Docs: https://docs.magicblock.gg/private-payments
 * API:  POST https://payments.magicblock.app/v1/spl/transfer
 */

// Circle's devnet USDC (6 decimals)
export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

const MAGICBLOCK_API = 'https://payments.magicblock.app/v1';

const RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// ─── API types ───────────────────────────────────────────────────────────────

interface PrivateTransferBody {
  from: string;
  to: string;
  mint: string;
  amount: number;     // USDC in base units (6 decimals)
  visibility: 'private' | 'public';
}

interface PrivateTransferResponse {
  transactionBase64: string;
}

// ─── Build transaction ────────────────────────────────────────────────────────

/**
 * Ask MagicBlock to build a private SPL-token transfer transaction.
 * Returns the transaction as a base64 string; the caller must sign it.
 *
 * @param from       Sender's wallet pubkey (base58)
 * @param to         Recipient / vault pubkey (base58)
 * @param amountUsdc Amount in whole USDC (e.g. 100 → 100_000_000 base units)
 */
export async function buildPrivateTransferTx(
  from: string,
  to: string,
  amountUsdc: number,
): Promise<string> {
  const amountLamports = Math.round(amountUsdc * 1_000_000);

  const body: PrivateTransferBody = {
    from,
    to,
    mint: USDC_MINT,
    amount: amountLamports,
    visibility: 'private',
  };

  const res = await fetch(`${MAGICBLOCK_API}/spl/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status));
    throw new Error(`MagicBlock API error (${res.status}): ${text}`);
  }

  const data: PrivateTransferResponse = await res.json();

  if (!data?.transactionBase64) {
    throw new Error('MagicBlock returned no transaction');
  }

  return data.transactionBase64;
}

// ─── Wallet detection ─────────────────────────────────────────────────────────

type WalletProvider = {
  signAndSendTransaction?: (tx: unknown) => Promise<{ signature: string }>;
  signTransaction?: (tx: unknown) => Promise<{ serialize: () => Uint8Array }>;
};

/**
 * Returns the connected wallet extension provider, or null if no wallet
 * is installed OR the user hasn't approved the connection yet.
 *
 * We now check `isConnected` so we don't hand back a provider that would
 * reject signing (and therefore silently fall through to the demo path).
 */
export function getWalletProvider(): WalletProvider | null {
  if (typeof window === 'undefined') return null;
  type Ext = Record<string, unknown>;
  const w = window as unknown as Ext;

  // Phantom (new injection or legacy window.solana)
  const phantom = (w['phantom'] as Ext | undefined)?.['solana'] as Ext | undefined;
  if (phantom?.['isPhantom'] && phantom?.['isConnected']) return phantom as WalletProvider;

  // Solflare
  const sf = w['solflare'] as Ext | undefined;
  if (sf?.['isSolflare'] && sf?.['isConnected']) return sf as WalletProvider;

  // Backpack
  const bp = (w['backpack'] as Ext | undefined)?.['solana'] as Ext | undefined;
  if (bp?.['isConnected']) return bp as WalletProvider;

  // Fallback: legacy window.solana (older Phantom)
  const sol = w['solana'] as Ext | undefined;
  if (sol?.['isConnected'] && (sol?.['signTransaction'] || sol?.['signAndSendTransaction']))
    return sol as WalletProvider;

  return null;
}

// ─── Sign and submit ──────────────────────────────────────────────────────────

/**
 * Deserialise the MagicBlock transaction, sign it with the user's connected
 * wallet extension, submit it to Solana, and wait for confirmation.
 *
 * Returns the transaction signature on success.
 */
export async function signAndSendPrivateTx(transactionBase64: string): Promise<string> {
  // Dynamic import keeps @solana/web3.js out of the initial bundle
  const { Transaction, Connection } = await import('@solana/web3.js');

  const provider = getWalletProvider();
  if (!provider) {
    throw new Error('No wallet extension found. Install Phantom, Solflare, or Backpack.');
  }

  // base64 → Uint8Array without relying on Node's Buffer
  const txBytes = Uint8Array.from(atob(transactionBase64), c => c.charCodeAt(0));
  const transaction = Transaction.from(txBytes);

  // Prefer the one-shot signAndSendTransaction if available
  if (typeof provider.signAndSendTransaction === 'function') {
    const { signature } = await provider.signAndSendTransaction(transaction);
    const connection = new Connection(RPC, 'confirmed');
    await connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }

  // Fall back to sign → serialize → sendRawTransaction
  if (typeof provider.signTransaction === 'function') {
    const signed = await provider.signTransaction(transaction);
    const connection = new Connection(RPC, 'confirmed');
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  }

  throw new Error('Connected wallet does not support transaction signing.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Truncate a Solana signature for display (e.g. "5kJp...nM2x") */
export function shortSig(sig: string): string {
  return sig.length > 16 ? `${sig.slice(0, 4)}…${sig.slice(-4)}` : sig;
}
