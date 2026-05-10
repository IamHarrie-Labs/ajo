'use client';

import { useState, useEffect } from 'react';
import Icon from './Icon';
import { fmt } from '../lib/data';
import { fetchMemberReputation } from '../lib/anchor-client';
import type { Wallet, Pool, Reputation } from '../lib/types';

interface ProfileProps {
  wallet: Wallet;
  pools?: Pool[];
}

/** Compute a Reputation shape from real pool data + optional on-chain account */
function buildReputation(
  pools: Pool[],
  onchain: { poolsCompleted: number; poolsDefaulted: number; totalContributions: number } | null,
): Reputation {
  const mine      = pools.filter(p => p.youAreIn);
  const completed = onchain?.poolsCompleted ?? mine.filter(p => p.status === 'completed').length;
  const active    = mine.filter(p => p.status === 'active').length;
  const defaults  = onchain?.poolsDefaulted ?? 0;

  const totalContributed = onchain?.totalContributions
    ?? mine.reduce((s, p) => s + (p.yourPaid ? p.contribution : 0), 0);

  // Score: 0 for new users, grows with on-chain activity
  const score = mine.length === 0
    ? 0
    : Math.min(100, Math.max(0, completed * 20 + active * 5 - defaults * 25 + (mine.length > 0 ? 30 : 0)));

  const badges = [
    ...(completed >= 1  ? [{ name: `${completed} pool${completed > 1 ? 's' : ''} completed`, desc: 'Finished a full rotation cycle onchain' }] : []),
    ...(defaults === 0 && mine.length > 0 ? [{ name: 'Clean record', desc: 'No missed contributions' }]  : []),
    ...(mine.length >= 3 ? [{ name: 'Circle member', desc: 'Active in 3 or more savings circles' }]       : []),
  ];

  return {
    score,
    completed,
    active,
    defaults,
    totalContributed,
    totalReceived: 0,
    joinedDate: '',
    badges,
    history: mine.map(p => ({
      pool:   p.name,
      role:   p.onchainPubkey ? 'Member' : 'Member',
      rounds: `${p.currentRound}/${p.rounds}`,
      status: p.status === 'completed' ? 'Completed' : 'Active',
    })),
  };
}

export default function Profile({ wallet, pools = [] }: ProfileProps) {
  const [onchainRep, setOnchainRep] = useState<{ poolsCompleted: number; poolsDefaulted: number; totalContributions: number } | null>(null);
  const [loadingRep, setLoadingRep] = useState(false);

  useEffect(() => {
    if (!wallet.fullAddr) return;
    let cancelled = false;
    setLoadingRep(true);
    fetchMemberReputation(wallet.fullAddr)
      .then(rep  => { if (!cancelled) { setOnchainRep(rep);  setLoadingRep(false); } })
      .catch(()  => { if (!cancelled) setLoadingRep(false); });
    return () => { cancelled = true; };
  }, [wallet.fullAddr]);

  const r       = buildReputation(pools, onchainRep);
  const isNew   = pools.filter(p => p.youAreIn).length === 0;
  const standing = r.score >= 80 ? 'Excellent standing'
                 : r.score >= 50 ? 'Good standing'
                 : r.score  > 0  ? 'Building reputation'
                 :                  'New member';

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Reputation</div>
          <div className="page-sub">On-chain history for {wallet.addr || '—'}</div>
        </div>
        <div className="row gap-8">
          <button
            className="btn"
            onClick={() => wallet.fullAddr && navigator.clipboard.writeText(wallet.fullAddr)}
          >
            <Icon name="copy" size={13} /> Copy address
          </button>
          {wallet.fullAddr && (
            <a
              className="btn"
              href={`https://explorer.solana.com/address/${wallet.fullAddr}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="arrow-up-right" size={13} /> View on explorer
            </a>
          )}
        </div>
      </div>

      {/* ── Score card ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row gap-24" style={{ alignItems: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: `conic-gradient(var(--accent) 0% ${r.score}%, var(--surface-2) ${r.score}% 100%)`,
            display: 'grid', placeItems: 'center', position: 'relative', flexShrink: 0,
          }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                {loadingRep
                  ? <div className="shimmer" style={{ width: 40, height: 32, borderRadius: 6, margin: '0 auto' }} />
                  : <>
                      <div className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>{r.score}</div>
                      <div className="text-xs text-muted">/ 100</div>
                    </>
                }
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="row gap-10" style={{ marginBottom: 4 }}>
              {isNew
                ? <span className="badge no-dot">NEW MEMBER</span>
                : r.score >= 80
                  ? <span className="badge good no-dot">TRUSTED</span>
                  : <span className="badge no-dot">BUILDING</span>
              }
              {onchainRep && (
                <span className="badge no-dot" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.2)' }}>
                  <Icon name="shield" size={9} /> VERIFIED ONCHAIN
                </span>
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{standing}</div>
            <div className="text-sm text-muted" style={{ marginTop: 4, maxWidth: 480 }}>
              {isNew
                ? 'Your reputation starts at zero and grows every time you complete a pool on time. Join or create your first circle to start.'
                : 'Reputation is computed from completed pools, on-time contributions, and slash vote history — all verifiable on Solana devnet.'
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="stat-label">Pools completed</div>
          <div className="stat-value">{r.completed}</div>
          <div className="stat-delta">{r.completed === 0 ? 'None yet' : 'On-chain verified'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Active pools</div>
          <div className="stat-value">{r.active}</div>
          <div className="stat-delta">Currently in</div>
        </div>
        <div className="stat">
          <div className="stat-label">Defaults</div>
          <div className="stat-value">{r.defaults}</div>
          <div className="stat-delta up">{r.defaults === 0 ? 'Clean record' : 'On-chain record'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total contributed</div>
          <div className="stat-value">{fmt(r.totalContributed, 0)}</div>
          <div className="stat-delta">USDC lifetime</div>
        </div>
      </div>

      {isNew ? (
        /* ── New member call-to-action ── */
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px dashed var(--line-strong)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
            <Icon name="shield" size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No on-chain history yet</div>
            <div className="text-sm text-muted" style={{ maxWidth: 340, margin: '0 auto' }}>
              Join or create a savings pool. Every contribution you make — and every payout you receive — is recorded on Solana and builds your reputation score here.
            </div>
          </div>
        </div>
      ) : (
        /* ── History + badges ── */
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title">Pool history</div></div>
            <table className="table">
              <thead>
                <tr>
                  <th>Pool</th>
                  <th>Role</th>
                  <th>Rounds</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {r.history.map((h, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 12 }}>{h.pool}</td>
                    <td className="text-muted">{h.role}</td>
                    <td className="mono">{h.rounds}</td>
                    <td style={{ textAlign: 'right' }}>
                      {h.status === 'Completed'
                        ? <span className="badge good no-dot">COMPLETED</span>
                        : <span className="badge no-dot">ACTIVE</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Badges</div></div>
            {r.badges.length === 0 ? (
              <div className="text-sm text-muted" style={{ padding: '16px 0' }}>
                Complete your first pool to earn badges.
              </div>
            ) : (
              <div className="col gap-12">
                {r.badges.map((b, i) => (
                  <div key={i} className="row gap-12" style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="shield" size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.name}</div>
                      <div className="text-xs text-muted">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
