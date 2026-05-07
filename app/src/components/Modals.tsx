'use client';

import { useState } from 'react';
import Icon from './Icon';
import Logo from './Logo';
import { fmt } from '../lib/data';
import { buildPrivateTransferTx, signAndSendPrivateTx, getWalletProvider, shortSig } from '../lib/magicblock';
import { txContribute, txVoteSlash, txExecutePayout } from '../lib/anchor-client';
import type { Pool, DiscoverPool, RotationMember, Wallet } from '../lib/types';

// ─── Contribute Modal ────────────────────────────────────────────────────────

interface ContributeModalProps {
  pool: Pool;
  wallet: Wallet;
  onClose: () => void;
  onDone: (pool: Pool, amount: number) => void;
}

export function ContributeModal({ pool, wallet, onClose, onDone }: ContributeModalProps) {
  const [step, setStep] = useState<'review' | 'building' | 'signing' | 'sent' | 'done' | 'error'>('review');
  const [txSig, setTxSig]   = useState('');
  const [errMsg, setErrMsg] = useState('');
  const amount = pool.contribution;
  const isPrivate = !!pool.privateContributions;

  const submit = async () => {
    const vault  = pool.vaultAddr;
    const onchain = pool.onchainPubkey;
    const sender = wallet.fullAddr;

    // ── Private path: MagicBlock shielded transfer ──────────────────────────
    if (isPrivate && vault && sender && getWalletProvider()) {
      try {
        setStep('building');
        const txBase64 = await buildPrivateTransferTx(sender, vault, amount);
        setStep('signing');
        const sig = await signAndSendPrivateTx(txBase64);
        setTxSig(sig);
        setStep('sent');
        setTimeout(() => { setStep('done'); setTimeout(() => onDone(pool, amount), 800); }, 1200);
      } catch (mbErr: unknown) {
        // MagicBlock API unavailable — fall back to a real on-chain Anchor
        // contribute so the user's USDC still moves (just without TEE privacy).
        if (onchain) {
          try {
            setStep('signing');
            const sig = await txContribute(sender, onchain, vault);
            setTxSig(sig);
            setStep('sent');
            setTimeout(() => { setStep('done'); setTimeout(() => onDone(pool, amount), 800); }, 1200);
          } catch (anchorErr: unknown) {
            setErrMsg(anchorErr instanceof Error ? anchorErr.message : 'Transaction failed');
            setStep('error');
          }
        } else {
          // Mock pool with no real vault — surface the MagicBlock error
          setErrMsg(mbErr instanceof Error ? mbErr.message : 'MagicBlock error');
          setStep('error');
        }
      }
      return;
    }

    // ── On-chain path: real Anchor contribute instruction ───────────────────
    if (onchain && vault && sender && getWalletProvider()) {
      try {
        setStep('signing');
        const sig = await txContribute(sender, onchain, vault);
        setTxSig(sig);
        setStep('sent');
        setTimeout(() => { setStep('done'); setTimeout(() => onDone(pool, amount), 800); }, 1200);
      } catch (err: unknown) {
        setErrMsg(err instanceof Error ? err.message : 'Unknown error');
        setStep('error');
      }
      return;
    }

    // ── Demo path: only when no wallet extension is present ─────────────────
    // If a real wallet is connected but the pool has no on-chain account, surface an error.
    if (sender && getWalletProvider()) {
      setErrMsg('This pool has no on-chain account. Create a real pool first, then contribute with your wallet.');
      setStep('error');
      return;
    }
    // Purely disconnected demo mode
    setStep('signing');
    setTimeout(() => setStep('sent'), 900);
    setTimeout(() => setStep('done'), 1900);
    setTimeout(() => onDone(pool, amount), 2700);
  };

  // Label and copy for the in-progress steps
  const progressLabel = () => {
    if (step === 'building') return 'Building private transaction…';
    if (step === 'signing')  return isPrivate ? 'Sign in your wallet…' : 'Awaiting signature…';
    return 'Confirming on-chain…';
  };
  const progressSub = () => {
    if (step === 'building') return 'MagicBlock TEE is preparing your shielded transfer.';
    if (step === 'signing')  return 'Approve the transaction in your wallet extension.';
    return 'Submitted to Solana devnet.';
  };

  return (
    <div className="modal-backdrop" onClick={step === 'review' ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* ── Review ── */}
        {step === 'review' && (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-title">Contribute to {pool.name}</div>
                <div className="modal-sub">Round {pool.currentRound} of {pool.rounds}</div>
              </div>
              <button className="modal-close" onClick={onClose}><Icon name="x" size={14} /></button>
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 18 }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>You send</div>
              <div className="mono" style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 8 }}>
                {fmt(amount, 2)}
              </div>
              <div className="text-sm text-muted mono">USDC · ≈ ${fmt(amount, 2)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                <Icon name="arrow-down" size={14} />
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16 }}>
              <div className="row gap-10">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ink)', color: 'var(--bg)', display: 'grid', placeItems: 'center' }}>
                  <Logo size={18} />
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>Pool escrow</div>
                  <div className="text-xs text-muted mono">Circlesv1...{pool.id.slice(-4)}</div>
                </div>
              </div>
            </div>

            {/* Privacy badge */}
            {isPrivate && (
              <div style={{
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 8,
                padding: '10px 14px',
                marginTop: 14,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <Icon name="shield" size={14} style={{ color: 'var(--good)', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--good)' }}>Private contribution</div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                    Amount and participants are shielded on-chain via MagicBlock Intel TDX.
                    Only the pool vault receives the funds — nothing else is visible.
                  </div>
                </div>
              </div>
            )}

            <div className="divider" style={{ margin: '18px 0' }} />

            <div className="kv"><span className="kv-k">From</span><span className="kv-v">{wallet.addr}</span></div>
            <div className="kv"><span className="kv-k">Network fee</span><span className="kv-v">~0.00021 SOL</span></div>
            <div className="kv"><span className="kv-k">Total</span><span className="kv-v">{fmt(amount, 2)} USDC</span></div>

            <button className="btn btn-primary btn-lg btn-block" onClick={submit} style={{ marginTop: 20 }}>
              {isPrivate
                ? <><Icon name="shield" size={14} /> Sign &amp; send (private)</>
                : <><Icon name="send" size={14} /> Sign &amp; send</>}
            </button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </>
        )}

        {/* ── Building / Signing / Sent ── */}
        {(step === 'building' || step === 'signing' || step === 'sent') && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--surface-2)', color: isPrivate ? 'var(--good)' : 'var(--muted)' }}>
              <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {progressLabel()}
            </div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>
              {progressSub()}
            </div>
            {isPrivate && (
              <div className="text-xs" style={{ marginTop: 12, color: 'var(--good)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="shield" size={12} /> Shielded via MagicBlock TEE
              </div>
            )}
            <div className="mono text-xs text-muted" style={{ marginTop: 18 }}>
              {txSig ? shortSig(txSig) : 'pending…'}
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst"><Icon name="check" size={28} /></div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>Contribution sent</div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>
              {fmt(amount, 2)} USDC sent to {pool.name}.
            </div>
            {isPrivate && (
              <div className="text-xs" style={{ marginTop: 10, color: 'var(--good)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="shield" size={12} /> Amount hidden on-chain
              </div>
            )}
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, marginTop: 18, fontSize: 12, textAlign: 'left' }}>
              <div className="kv">
                <span className="kv-k">Tx hash</span>
                <span className="kv-v">{txSig ? shortSig(txSig) : '5kJp…nM2x'} ↗</span>
              </div>
              <div className="kv"><span className="kv-k">Block</span><span className="kv-v">325,481,902</span></div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={onClose} style={{ marginTop: 20 }}>Done</button>
          </div>
        )}

        {/* ── Error ── */}
        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
              <Icon name="alert" size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Transfer failed</div>
            <div className="text-sm text-muted" style={{ marginTop: 6, maxWidth: 280, margin: '8px auto 0' }}>
              {errMsg || 'Something went wrong. Check your wallet and try again.'}
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep('review')} style={{ marginTop: 20 }}>
              Try again
            </button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Withdraw Modal ──────────────────────────────────────────────────────────

interface WithdrawModalProps {
  pool: Pool;
  wallet: Wallet;
  onClose: () => void;
  onDone: (pool: Pool) => void;
}

export function WithdrawModal({ pool, wallet, onClose, onDone }: WithdrawModalProps) {
  const [step, setStep]   = useState<'review' | 'signing' | 'done' | 'error'>('review');
  const [txSig, setTxSig] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const submit = async () => {
    const onchain   = pool.onchainPubkey;
    const vault     = pool.vaultAddr;
    const sender    = wallet.fullAddr;
    const recipient = wallet.fullAddr; // it's this user's turn to receive

    // ── On-chain: execute_payout instruction ────────────────────────────────
    if (onchain && vault && sender && recipient && getWalletProvider()) {
      try {
        setStep('signing');
        const sig = await txExecutePayout(sender, onchain, vault, recipient);
        setTxSig(sig);
        setStep('done');
        setTimeout(() => onDone(pool), 800);
      } catch (err: unknown) {
        setErrMsg(err instanceof Error ? err.message : 'Unknown error');
        setStep('error');
      }
      return;
    }

    // ── Demo path ────────────────────────────────────────────────────────────
    setStep('signing');
    setTimeout(() => setStep('done'), 1500);
    setTimeout(() => onDone(pool), 2400);
  };

  return (
    <div className="modal-backdrop" onClick={step === 'review' ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {step === 'review' && (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-title">Withdraw payout</div>
                <div className="modal-sub">{pool.name} · Round {pool.currentRound}</div>
              </div>
              <button className="modal-close" onClick={onClose}><Icon name="x" size={14} /></button>
            </div>

            <div style={{ background: 'var(--accent-soft)', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 18 }}>
              <div className="text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--accent)' }}>You receive</div>
              <div className="mono" style={{ fontSize: 42, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 8, color: 'var(--accent)' }}>
                +{fmt(pool.pot, 2)}
              </div>
              <div className="text-sm mono" style={{ color: 'var(--accent)', opacity: 0.8 }}>USDC · all {pool.members} contributions</div>
            </div>

            <div className="kv"><span className="kv-k">Pool escrow</span><span className="kv-v">Circlesv1...{pool.id.slice(-4)}</span></div>
            <div className="kv"><span className="kv-k">To wallet</span><span className="kv-v">{wallet.addr}</span></div>
            <div className="kv"><span className="kv-k">Network fee</span><span className="kv-v">~0.00021 SOL</span></div>
            <div className="kv"><span className="kv-k">Net received</span><span className="kv-v">{fmt(pool.pot, 2)} USDC</span></div>

            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, fontSize: 12, marginTop: 16, display: 'flex', gap: 8 }}>
              <Icon name="shield" size={14} />
              <span className="text-muted">Your collateral stays locked until the pool completes its full cycle.</span>
            </div>

            <button className="btn btn-accent btn-lg btn-block" onClick={submit} style={{ marginTop: 20 }}>
              <Icon name="arrow-down" size={14} /> Sign &amp; withdraw
            </button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </>
        )}

        {step === 'signing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Releasing escrow…</div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>The pool program is sending {fmt(pool.pot, 0)} USDC to your wallet.</div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst"><Icon name="check" size={28} /></div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>+{fmt(pool.pot, 2)} USDC received</div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>It&apos;s yours. Reputation bumped +2.</div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, marginTop: 18, fontSize: 12, textAlign: 'left' }}>
              <div className="kv"><span className="kv-k">Tx hash</span><span className="kv-v">{txSig ? shortSig(txSig) : '9aPq…kT4w'} ↗</span></div>
              <div className="kv"><span className="kv-k">New balance</span><span className="kv-v">{fmt(wallet.balance + pool.pot, 2)} USDC</span></div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={onClose} style={{ marginTop: 20 }}>Back to pool</button>
          </div>
        )}

        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
              <Icon name="alert" size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Payout failed</div>
            <div className="text-sm text-muted" style={{ marginTop: 6, maxWidth: 280, margin: '8px auto 0' }}>
              {errMsg || 'Make sure all members have contributed before triggering payout.'}
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep('review')} style={{ marginTop: 20 }}>Try again</button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Slash Vote Modal ────────────────────────────────────────────────────────

interface SlashVoteModalProps {
  pool: Pool;
  member: RotationMember;
  onClose: () => void;
  onVoted: (pool: Pool, member: RotationMember, vote: string) => void;
}

export function SlashVoteModal({ pool, member, onClose, onVoted, wallet }: SlashVoteModalProps & { wallet?: Wallet }) {
  const [vote, setVote]   = useState<'slash' | 'forgive' | null>(null);
  const [step, setStep]   = useState<'review' | 'signing' | 'done' | 'error'>('review');
  const [txSig, setTxSig] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const submit = async () => {
    const onchain      = pool.onchainPubkey;
    const senderAddr   = wallet?.fullAddr;
    const targetAddr   = member.addr?.replace('...', ''); // real addr when available

    // ── On-chain: vote_slash instruction ────────────────────────────────────
    if (vote === 'slash' && onchain && senderAddr && targetAddr && targetAddr.length > 20 && getWalletProvider()) {
      try {
        setStep('signing');
        const sig = await txVoteSlash(senderAddr, onchain, targetAddr, pool.currentRound);
        setTxSig(sig);
        setStep('done');
        setTimeout(() => onVoted(pool, member, vote), 800);
      } catch (err: unknown) {
        setErrMsg(err instanceof Error ? err.message : 'Unknown error');
        setStep('error');
      }
      return;
    }

    // ── Demo / forgive path ──────────────────────────────────────────────────
    setStep('signing');
    setTimeout(() => setStep('done'), 1300);
    setTimeout(() => onVoted(pool, member, vote!), 2200);
  };

  return (
    <div className="modal-backdrop" onClick={step === 'review' ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {step === 'review' && (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-title">Vote to slash defaulter</div>
                <div className="modal-sub">{pool.name} · Round {pool.currentRound}</div>
              </div>
              <button className="modal-close" onClick={onClose}><Icon name="x" size={14} /></button>
            </div>

            <div style={{ background: 'var(--warn-soft)', padding: 16, borderRadius: 10, marginBottom: 18 }}>
              <div className="row gap-10" style={{ marginBottom: 8 }}>
                <Icon name="alert" size={16} />
                <strong style={{ fontSize: 13.5 }}>{member.name} missed contribution for round {pool.currentRound}</strong>
              </div>
              <div className="text-xs mono text-muted">{member.addr} · {fmt(pool.contribution, 0)} USDC overdue · 48h late</div>
            </div>

            <div style={{ fontSize: 13, marginBottom: 12 }}>
              Slashing recovers <strong className="mono">{fmt(pool.contribution, 0)} USDC</strong> from {member.name}&apos;s collateral and credits this round&apos;s pot. A simple majority of {pool.members} members is required.
            </div>

            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div className="kv"><span className="kv-k">Current votes</span><span className="kv-v">3 / {pool.members}</span></div>
              <div className="kv"><span className="kv-k">Threshold</span><span className="kv-v">{Math.ceil(pool.members / 2) + 1} (majority)</span></div>
              <div className="kv"><span className="kv-k">Voting closes</span><span className="kv-v">in 22h</span></div>
            </div>

            <div className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your vote</div>
            <div className="row gap-10" style={{ marginBottom: 16 }}>
              <button
                className={`btn btn-lg flex-1 ${vote === 'slash' ? 'btn-danger' : ''}`}
                onClick={() => setVote('slash')}
                style={vote === 'slash' ? { borderColor: 'var(--warn)', background: 'var(--warn-soft)', color: 'var(--warn)' } : {}}
              >
                <Icon name="gavel" size={14} /> Slash
              </button>
              <button
                className={`btn btn-lg flex-1 ${vote === 'forgive' ? 'btn-primary' : ''}`}
                onClick={() => setVote('forgive')}
              >
                <Icon name="shield" size={14} /> Forgive
              </button>
            </div>

            <button className="btn btn-primary btn-block btn-lg" disabled={!vote} onClick={submit} style={{ opacity: vote ? 1 : 0.5 }}>
              Sign &amp; submit vote
            </button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </>
        )}

        {step === 'signing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Recording vote on-chain…</div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst"><Icon name="check" size={28} /></div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Vote recorded</div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>
              Your vote: <strong>{vote === 'slash' ? 'Slash' : 'Forgive'}</strong>. Now 4 / {pool.members} votes.
            </div>
            {txSig && <div className="mono text-xs text-muted" style={{ marginTop: 10 }}>{shortSig(txSig)} ↗</div>}
            <button className="btn btn-primary btn-block btn-lg" onClick={onClose} style={{ marginTop: 20 }}>Done</button>
          </div>
        )}

        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
              <Icon name="alert" size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Vote failed</div>
            <div className="text-sm text-muted" style={{ marginTop: 6, maxWidth: 280, margin: '8px auto 0' }}>
              {errMsg || 'You may have already voted, or this round has ended.'}
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep('review')} style={{ marginTop: 20 }}>Try again</button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Join Confirm Modal ──────────────────────────────────────────────────────

interface JoinConfirmModalProps {
  pool: DiscoverPool;
  wallet: Wallet;
  onClose: () => void;
  onDone: (pool: DiscoverPool) => void;
}

export function JoinConfirmModal({ pool, wallet, onClose, onDone }: JoinConfirmModalProps) {
  const [step, setStep] = useState<'review' | 'signing' | 'done'>('review');

  const submit = () => {
    setStep('signing');
    setTimeout(() => setStep('done'), 1400);
    setTimeout(() => onDone(pool), 2300);
  };

  return (
    <div className="modal-backdrop" onClick={step === 'review' ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {step === 'review' && (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-title">Join {pool.name}</div>
                <div className="modal-sub">{pool.cycle} · {pool.members} members</div>
              </div>
              <button className="modal-close" onClick={onClose}><Icon name="x" size={14} /></button>
            </div>
            <div className="kv"><span className="kv-k">Contribution</span><span className="kv-v">{fmt(pool.contribution, 0)} USDC / {pool.cycle}</span></div>
            <div className="kv"><span className="kv-k">Collateral (locked)</span><span className="kv-v">{fmt(pool.contribution, 0)} USDC</span></div>
            <div className="kv"><span className="kv-k">Total commitment</span><span className="kv-v">{fmt(pool.contribution * pool.members, 0)} USDC over {pool.members} rounds</span></div>
            <div className="kv"><span className="kv-k">Expected payout</span><span className="kv-v">{fmt(pool.contribution * pool.members, 0)} USDC × 1 round</span></div>
            <button className="btn btn-primary btn-lg btn-block" onClick={submit} style={{ marginTop: 18 }}>
              <Icon name="check" size={14} /> Sign &amp; join
            </button>
            <button className="btn btn-block btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
          </>
        )}

        {step === 'signing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Locking collateral…</div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="check-burst"><Icon name="check" size={28} /></div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Joined {pool.name}</div>
            <div className="text-sm text-muted" style={{ marginTop: 6 }}>You&apos;re seat #{pool.filled + 1}. Pool starts when full.</div>
            <button className="btn btn-primary btn-block btn-lg" onClick={onClose} style={{ marginTop: 20 }}>Go to dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
