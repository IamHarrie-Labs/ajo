/**
 * Circles — Anchor program client
 *
 * Wraps the deployed `ajo` program (7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4)
 * so the frontend can call instructions directly from browser wallet extensions.
 *
 * All public functions return the confirmed transaction signature on success,
 * or throw a descriptive Error on failure.
 */

import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import type { ActivityItem, DiscoverPool } from './types';
import IDL from './ajo-idl.json';
import { getWalletProvider } from './magicblock';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  '7Ph9x6WSP51QASW1YuUU5zTYuurmRJhQsifXSj7xT3E4',
);

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
);

const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

const ASSOC_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bNb',
);

const RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// ─── PDA derivations ──────────────────────────────────────────────────────────

/** Pool account PDA — seeds: ["pool", creator, pool_id_le_u64] */
export function poolPda(creator: PublicKey, poolId: BN): PublicKey {
  const idBytes = new Uint8Array(8);
  let n = BigInt(poolId.toString());
  for (let i = 0; i < 8; i++) { idBytes[i] = Number(n & 0xffn); n >>= 8n; }
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), creator.toBytes(), idBytes],
    PROGRAM_ID,
  )[0];
}

/** Pool vault (token account PDA) — seeds: ["vault", pool] */
export function vaultPda(pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), pool.toBytes()],
    PROGRAM_ID,
  )[0];
}

/** MemberReputation PDA — seeds: ["member", wallet] */
export function reputationPda(wallet: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('member'), wallet.toBytes()],
    PROGRAM_ID,
  )[0];
}

/** VotingRecord PDA — seeds: ["vote", pool, target, round_le_u32] */
export function votingRecordPda(
  pool: PublicKey,
  target: PublicKey,
  round: number,
): PublicKey {
  const roundBytes = new Uint8Array(4);
  new DataView(roundBytes.buffer).setUint32(0, round, true);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), pool.toBytes(), target.toBytes(), roundBytes],
    PROGRAM_ID,
  )[0];
}

/** Associated token account address — no external dep needed */
export function ata(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOC_TOKEN_PROGRAM_ID,
  )[0];
}

// ─── Provider / Program ───────────────────────────────────────────────────────

/**
 * Read-only program — no wallet required.
 * Safe to call from any component for account reads (Discover, Profile, etc.).
 */
function makeReadOnlyProgram(): Program {
  const connection = new Connection(RPC, 'confirmed');
  // Use the program ID as a dummy pubkey — only ever used for reads, never signs.
  const dummyWallet = {
    publicKey: PROGRAM_ID,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
  return new Program(IDL as any, provider);
}

function makeProgram(walletFullAddr: string): Program {
  const windowProvider = getWalletProvider();
  if (!windowProvider) throw new Error('No wallet connected. Install Phantom, Solflare, or Backpack.');

  const publicKey = new PublicKey(walletFullAddr);
  const connection = new Connection(RPC, 'confirmed');

  // Minimal Anchor wallet interface backed by the browser extension
  const anchorWallet = {
    publicKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signTransaction: async (tx: any) => {
      if (typeof windowProvider.signTransaction !== 'function') {
        throw new Error('Wallet does not support transaction signing');
      }
      return windowProvider.signTransaction(tx);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signAllTransactions: async (txs: any[]) =>
      Promise.all(txs.map(tx => anchorWallet.signTransaction(tx))),
  };

  const provider = new AnchorProvider(connection, anchorWallet as any, {
    commitment: 'confirmed',
  });

  // Program constructor for Anchor 0.30.x — ID comes from IDL.address
  return new Program(IDL as any, provider);
}

// ─── USDC balance ─────────────────────────────────────────────────────────────

/**
 * Returns the wallet's devnet USDC balance in UI units (6-decimal adjusted).
 * Returns 0 if the token account doesn't exist yet or any error occurs.
 */
export async function fetchUsdcBalance(walletAddress: string): Promise<number> {
  try {
    const connection = new Connection(RPC, 'confirmed');
    const owner = new PublicKey(walletAddress);
    const tokenAccount = ata(USDC_MINT, owner);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return balance.value.uiAmount ?? 0;
  } catch {
    return 0;
  }
}

// ─── Fetch a single pool by pubkey (used for invite links) ────────────────────

/**
 * Fetches one pool account by its public key.
 * Requires a connected wallet to build the Anchor program.
 */
export async function fetchPoolByPubkey(
  poolPubkey: string,
  walletAddr: string,
): Promise<OnchainPool | null> {
  try {
    const program = makeProgram(walletAddr);
    const account = await (program.account as any).pool.fetch(new PublicKey(poolPubkey));
    return {
      pubkey:               poolPubkey,
      poolId:               account.poolId.toString(),
      creator:              account.creator.toBase58(),
      members:              account.members.map((m: PublicKey) => m.toBase58()),
      contributionAmount:   account.contributionAmount.toNumber() / 1_000_000,
      currentRound:         account.currentRound,
      currentRecipientIdx:  account.currentRecipientIdx,
      poolVault:            account.poolVault.toBase58(),
      status:               Object.keys(account.status)[0] as 'Active' | 'Completed' | 'Defaulted',
      contributionsThisRound: account.contributionsThisRound,
      defaultedMembers:     account.defaultedMembers.map((m: PublicKey) => m.toBase58()),
    };
  } catch {
    return null;
  }
}

// ─── On-chain pool data ────────────────────────────────────────────────────────

export interface OnchainPool {
  pubkey: string;
  poolId: string;
  creator: string;
  members: string[];
  contributionAmount: number;   // whole USDC
  currentRound: number;
  currentRecipientIdx: number;
  poolVault: string;
  status: 'Active' | 'Completed' | 'Defaulted';
  contributionsThisRound: boolean[];
  defaultedMembers: string[];
}

/**
 * Fetch all pools where `walletFullAddr` is a member.
 */
export async function fetchMyPools(walletFullAddr: string): Promise<OnchainPool[]> {
  const program  = makeProgram(walletFullAddr);
  const myPubkey = new PublicKey(walletFullAddr);

  const allAccounts = await (program.account as any).pool.all();

  return allAccounts
    .filter((a: any) =>
      a.account.members.some((m: PublicKey) => m.equals(myPubkey)),
    )
    .map((a: any): OnchainPool => ({
      pubkey:               a.publicKey.toBase58(),
      poolId:               a.account.poolId.toString(),
      creator:              a.account.creator.toBase58(),
      members:              a.account.members.map((m: PublicKey) => m.toBase58()),
      contributionAmount:   a.account.contributionAmount.toNumber() / 1_000_000,
      currentRound:         a.account.currentRound,
      currentRecipientIdx:  a.account.currentRecipientIdx,
      poolVault:            a.account.poolVault.toBase58(),
      status:               Object.keys(a.account.status)[0] as 'Active' | 'Completed' | 'Defaulted',
      contributionsThisRound: a.account.contributionsThisRound,
      defaultedMembers:     a.account.defaultedMembers.map((m: PublicKey) => m.toBase58()),
    }));
}

// ─── Instructions ─────────────────────────────────────────────────────────────

export interface CreatePoolResult {
  sig: string;
  poolPubkey: string;
  vaultPubkey: string;
  poolId: string;
}

/**
 * Deploy a new pool on-chain.
 *
 * @param walletFullAddr  Creator's base58 pubkey
 * @param memberAddresses Array of member base58 pubkeys (must include creator)
 * @param contributionUsdc Contribution per round in whole USDC (e.g. 100)
 * @param durationDays    Informational only; contract stores it but doesn't enforce
 */
export async function txCreatePool(
  walletFullAddr: string,
  memberAddresses: string[],
  contributionUsdc: number,
  durationDays = 30,
): Promise<CreatePoolResult> {
  const program = makeProgram(walletFullAddr);
  const creator = new PublicKey(walletFullAddr);
  const poolId  = new BN(Date.now());

  const pool  = poolPda(creator, poolId);
  const vault = vaultPda(pool);
  const members           = memberAddresses.map(a => new PublicKey(a));
  const contributionAmount = new BN(Math.round(contributionUsdc * 1_000_000));

  const sig = await program.methods
    .createPool(poolId, members, contributionAmount, durationDays)
    .accounts({
      creator,
      pool,
      poolVault: vault,
      usdcMint:      USDC_MINT,
      tokenProgram:  TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent:          SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return {
    sig,
    poolPubkey:  pool.toBase58(),
    vaultPubkey: vault.toBase58(),
    poolId:      poolId.toString(),
  };
}

/**
 * Contribute USDC for the current round.
 *
 * @param walletFullAddr Member's base58 pubkey (signer)
 * @param poolPubkey     On-chain Pool account address
 * @param vaultPubkey    Pool vault token account address (stored in Pool.pool_vault)
 */
export async function txContribute(
  walletFullAddr: string,
  poolPubkey: string,
  vaultPubkey: string,
): Promise<string> {
  const program = makeProgram(walletFullAddr);
  const member  = new PublicKey(walletFullAddr);
  const pool    = new PublicKey(poolPubkey);
  const vault   = new PublicKey(vaultPubkey);

  const memberTokenAccount = ata(USDC_MINT, member);
  const memberReputation   = reputationPda(member);

  const sig = await program.methods
    .contribute()
    .accounts({
      member,
      pool,
      memberTokenAccount,
      poolVault:        vault,
      memberReputation,
      tokenProgram:     TOKEN_PROGRAM_ID,
      systemProgram:    SystemProgram.programId,
      rent:             SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return sig;
}

/**
 * Cast a slash vote against a late member.
 *
 * @param walletFullAddr   Voter's base58 pubkey (signer)
 * @param poolPubkey       On-chain Pool account address
 * @param targetMemberAddr Defaulting member's base58 pubkey
 * @param currentRound     Pool's current_round value (for PDA seed)
 */
export async function txVoteSlash(
  walletFullAddr: string,
  poolPubkey: string,
  targetMemberAddr: string,
  currentRound: number,
): Promise<string> {
  const program = makeProgram(walletFullAddr);
  const voter        = new PublicKey(walletFullAddr);
  const pool         = new PublicKey(poolPubkey);
  const targetMember = new PublicKey(targetMemberAddr);

  const votingRecord     = votingRecordPda(pool, targetMember, currentRound);
  const targetReputation = reputationPda(targetMember);

  const sig = await program.methods
    .voteSlash(targetMember)
    .accounts({
      voter,
      pool,
      votingRecord,
      targetReputation,
      systemProgram: SystemProgram.programId,
      rent:          SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return sig;
}

/**
 * Trigger payout once all members have contributed in the current round.
 *
 * @param walletFullAddr      Any member's pubkey — anyone can call this
 * @param poolPubkey          On-chain Pool account address
 * @param vaultPubkey         Pool vault address
 * @param recipientPubkey     Current round recipient
 */
export async function txExecutePayout(
  walletFullAddr: string,
  poolPubkey: string,
  vaultPubkey: string,
  recipientPubkey: string,
): Promise<string> {
  const program   = makeProgram(walletFullAddr);
  const caller    = new PublicKey(walletFullAddr);
  const pool      = new PublicKey(poolPubkey);
  const vault     = new PublicKey(vaultPubkey);
  const recipient = new PublicKey(recipientPubkey);

  const recipientTokenAccount = ata(USDC_MINT, recipient);
  const recipientReputation   = reputationPda(recipient);

  const sig = await program.methods
    .executePayout()
    .accounts({
      caller,
      pool,
      poolVault:            vault,
      recipientTokenAccount,
      recipientReputation,
      tokenProgram:         TOKEN_PROGRAM_ID,
      systemProgram:        SystemProgram.programId,
      rent:                 SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return sig;
}

// ─── Fetch all pools (Discover page — no wallet required) ────────────────────

/**
 * Returns every pool deployed by the Circles program on devnet.
 * Maps to the DiscoverPool UI shape; excludes already-completed pools.
 * Optionally pass the current wallet address to exclude pools the user is in.
 */
export async function fetchAllPools(currentWallet?: string): Promise<DiscoverPool[]> {
  try {
    const program = makeReadOnlyProgram();
    const allAccounts = await (program.account as any).pool.all();
    return allAccounts
      .filter((a: any) => {
        const statusKey = Object.keys(a.account.status)[0];
        if (statusKey === 'Completed') return false;
        if (currentWallet) {
          const members: string[] = a.account.members.map((m: PublicKey) => m.toBase58());
          if (members.includes(currentWallet)) return false;
        }
        return true;
      })
      .map((a: any): DiscoverPool => {
        const pubkey: string = a.publicKey.toBase58();
        const members: string[] = a.account.members.map((m: PublicKey) => m.toBase58());
        const contribution = a.account.contributionAmount.toNumber() / 1_000_000;
        const statusKey = Object.keys(a.account.status)[0] as string;
        return {
          id:           pubkey,
          name:         `Pool ${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`,
          contribution,
          members:      members.length,
          filled:       members.length,
          cycle:        'monthly',
          repAvg:       100,
          tags:         [statusKey === 'Active' ? 'Active' : 'Recruiting'],
        };
      });
  } catch {
    return [];
  }
}

// ─── Fetch member reputation account ─────────────────────────────────────────

export interface OnchainReputation {
  poolsCompleted: number;
  poolsDefaulted: number;
  totalContributions: number; // whole USDC
}

/**
 * Fetch the on-chain MemberReputation PDA for a wallet.
 * Returns null if the account doesn't exist yet (new user with no history).
 */
export async function fetchMemberReputation(
  walletAddr: string,
): Promise<OnchainReputation | null> {
  try {
    const program = makeReadOnlyProgram();
    const pda     = reputationPda(new PublicKey(walletAddr));
    const account = await (program.account as any).memberReputation.fetch(pda);
    return {
      poolsCompleted:     account.poolsCompleted   ?? 0,
      poolsDefaulted:     account.poolsDefaulted   ?? 0,
      totalContributions: (account.totalContributions?.toNumber() ?? 0) / 1_000_000,
    };
  } catch {
    return null; // new user — reputation account initialised on first pool completion
  }
}

// ─── Onchain activity feed ────────────────────────────────────────────────────

function ageStr(blockTime: number | null | undefined): string {
  const ageS = Math.floor(Date.now() / 1000) - (blockTime ?? Math.floor(Date.now() / 1000));
  if (ageS < 60)    return 'just now';
  if (ageS < 3600)  return `${Math.floor(ageS / 60)}m ago`;
  if (ageS < 86400) return `${Math.floor(ageS / 3600)}h ago`;
  return `${Math.floor(ageS / 86400)}d ago`;
}

/**
 * Fetch recent on-chain activity for `walletFullAddr` involving the Circles program.
 * Polls up to 15 recent transactions; returns [] if the wallet has no program history.
 * Falls back to [] on any network error so callers can stay on mock data.
 *
 * @param poolPubkeys  Optional list of known pool pubkeys to label activities.
 */
export async function fetchOnchainActivity(
  walletFullAddr: string,
  poolPubkeys: string[] = [],
): Promise<ActivityItem[]> {
  try {
    const connection = new Connection(RPC, 'confirmed');
    const wallet     = new PublicKey(walletFullAddr);

    const sigs = await connection.getSignaturesForAddress(wallet, { limit: 20 });
    if (sigs.length === 0) return [];

    const txResults = await Promise.allSettled(
      sigs.slice(0, 15).map(s =>
        connection.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 }),
      ),
    );

    const items: ActivityItem[] = [];

    for (let i = 0; i < txResults.length; i++) {
      const res = txResults[i];
      if (res.status !== 'fulfilled' || !res.value) continue;
      const tx  = res.value;
      const sig = sigs[i];

      const accountKeys = tx.transaction.message.accountKeys;
      const involvesProgram = accountKeys.some(k => k.pubkey.toBase58() === PROGRAM_ID.toBase58());
      if (!involvesProgram) continue;

      const logStr = (tx.meta?.logMessages ?? []).join(' ');

      let kind: ActivityItem['kind'] = 'joined';
      let text = 'Transaction';
      let amount = '';

      if (logStr.includes('Instruction: Contribute')) {
        kind   = 'paid';
        text   = 'Contribution sent';
        amount = '-USDC';
      } else if (logStr.includes('Instruction: ExecutePayout')) {
        kind   = 'received';
        text   = 'Round payout received';
        amount = '+USDC';
      } else if (logStr.includes('Instruction: CreatePool')) {
        kind = 'joined';
        text = 'Pool created';
      } else if (logStr.includes('Instruction: VoteSlash')) {
        kind = 'flagged';
        text = 'Slash vote cast';
      }

      const matchedPool = poolPubkeys.find(pk =>
        accountKeys.some(k => k.pubkey.toBase58() === pk),
      );

      items.push({
        id:     sig.signature.slice(0, 8),
        kind,
        text,
        pool:   matchedPool ? `Pool ${matchedPool.slice(0, 6)}` : 'Circles',
        amount,
        time:   ageStr(sig.blockTime),
        addr:   sig.signature,
      });
    }

    return items;
  } catch {
    return [];
  }
}
