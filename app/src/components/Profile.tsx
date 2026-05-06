'use client';

import Icon from './Icon';
import { fmt, POOLIT_REPUTATION } from '../lib/data';
import type { Wallet } from '../lib/types';

interface ProfileProps {
  wallet: Wallet;
}

export default function Profile({ wallet }: ProfileProps) {
  const r = POOLIT_REPUTATION;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Reputation</div>
          <div className="page-sub">On-chain history for {wallet.addr}</div>
        </div>
        <div className="row gap-8">
          <button className="btn"><Icon name="copy" size={13} /> Copy address</button>
          <button className="btn"><Icon name="arrow-up-right" size={13} /> View on explorer</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row gap-24" style={{ alignItems: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: `conic-gradient(var(--accent) 0% ${r.score}%, var(--surface-2) ${r.score}% 100%)`,
            display: 'grid', placeItems: 'center', position: 'relative',
          }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>{r.score}</div>
                <div className="text-xs text-muted">/ 100</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="row gap-10" style={{ marginBottom: 4 }}>
              <span className="badge good no-dot">TRUSTED</span>
              <span className="text-xs text-muted mono">Joined {r.joinedDate}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Excellent standing</div>
            <div className="text-sm text-muted" style={{ marginTop: 4, maxWidth: 480 }}>
              Reputation is computed on-chain from completed pools, on-time contributions, and slash votes. Higher scores get into higher-stake pools.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="stat-label">Pools completed</div>
          <div className="stat-value">{r.completed}</div>
          <div className="stat-delta up">+1 this quarter</div>
        </div>
        <div className="stat">
          <div className="stat-label">Active pools</div>
          <div className="stat-value">{r.active}</div>
          <div className="stat-delta">Currently in</div>
        </div>
        <div className="stat">
          <div className="stat-label">Defaults</div>
          <div className="stat-value">{r.defaults}</div>
          <div className="stat-delta up">Clean record</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total contributed</div>
          <div className="stat-value">{fmt(r.totalContributed, 0)}</div>
          <div className="stat-delta">USDC lifetime</div>
        </div>
      </div>

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
                  <td>{h.pool}</td>
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
          <div className="col gap-12">
            {r.badges.map((b, i) => (
              <div key={i} className="row gap-12" style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="shield" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.name}</div>
                  <div className="text-xs text-muted">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
