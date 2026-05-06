'use client';

import { useState } from 'react';
import Icon from './Icon';
import { fmt } from '../lib/data';
import type { Pool, RotationMember } from '../lib/types';

interface PoolDetailProps {
  pool: Pool;
  onContribute: (pool: Pool) => void;
  onWithdraw: (pool: Pool) => void;
  onSlashVote: (pool: Pool, member: RotationMember) => void;
  onBack: () => void;
}

export default function PoolDetail({ pool, onContribute, onWithdraw, onSlashVote, onBack }: PoolDetailProps) {
  const [tab, setTab] = useState<'rotation' | 'members' | 'history' | 'rules'>('rotation');
  const youRow = pool.rotation.find(r => r.isYou);
  const currentRow = pool.rotation.find(r => r.idx === pool.currentRound);
  const yourTurn = youRow && youRow.idx === pool.currentRound;
  const lateRow = pool.rotation.find(r => r.late);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <button className="btn-ghost text-sm" onClick={onBack} style={{ marginBottom: 10, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <div className="row gap-10">
            <div className="page-title">{pool.name}</div>
            {pool.status === 'active'
              ? <span className="badge good no-dot">ACTIVE</span>
              : <span className="badge no-dot">RECRUITING</span>}
            {pool.privateContributions && (
              <span className="badge no-dot" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--good)', borderColor: 'rgba(34,197,94,0.25)' }}>
                <Icon name="shield" size={10} /> PRIVATE
              </span>
            )}
          </div>
          <div className="page-sub">{pool.description}</div>
        </div>
        <div className="row gap-8">
          {yourTurn && pool.contributedThisRound === pool.members && (
            <button className="btn btn-accent btn-lg" onClick={() => onWithdraw(pool)}>
              <Icon name="arrow-down" size={14} /> Withdraw {fmt(pool.pot, 0)} USDC
            </button>
          )}
          {!youRow?.paidThisRound && pool.status === 'active' && (
            <button className="btn btn-primary btn-lg" onClick={() => onContribute(pool)}>
              <Icon name="send" size={14} /> Contribute {fmt(pool.contribution, 0)}
            </button>
          )}
          {lateRow && (
            <button className="btn btn-danger" onClick={() => onSlashVote(pool, lateRow)}>
              <Icon name="gavel" size={14} /> Vote to slash
            </button>
          )}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="stat-label">Round</div>
          <div className="stat-value">
            {pool.currentRound}<span style={{ color: 'var(--muted)', fontSize: 18 }}>/{pool.rounds}</span>
          </div>
          <div className="stat-delta">{pool.cycle} cycle</div>
        </div>
        <div className="stat">
          <div className="stat-label">This round pot</div>
          <div className="stat-value">{fmt(pool.pot, 0)}</div>
          <div className="stat-delta">USDC</div>
        </div>
        <div className="stat">
          <div className="stat-label">Paid this round</div>
          <div className="stat-value">
            {pool.contributedThisRound}<span style={{ color: 'var(--muted)', fontSize: 18 }}>/{pool.members}</span>
          </div>
          <div className="stat-delta">{currentRow ? `→ ${currentRow.name}` : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Next payout</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {new Date(pool.nextPayout).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="stat-delta">in 4 days</div>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={tab === 'rotation' ? 'on' : ''} onClick={() => setTab('rotation')}>Rotation</button>
        <button className={tab === 'members'  ? 'on' : ''} onClick={() => setTab('members')}>Members</button>
        <button className={tab === 'history'  ? 'on' : ''} onClick={() => setTab('history')}>Round history</button>
        <button className={tab === 'rules'    ? 'on' : ''} onClick={() => setTab('rules')}>Rules</button>
      </div>

      {tab === 'rotation' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Rotation order</div>
            <div className="text-xs text-muted mono">Randomized at pool creation · {pool.contributedThisRound}/{pool.members} contributed</div>
          </div>
          <div className="rotation">
            {pool.rotation.map(r => {
              const isCurrent = r.idx === pool.currentRound;
              const isDone = r.idx < pool.currentRound;
              const cls = r.late ? 'late' : isCurrent ? 'current' : isDone ? 'done' : '';
              return (
                <div key={r.idx} className={`rotation-row ${cls}`}>
                  <div className="rotation-idx">
                    {r.late ? <Icon name="alert" size={12} /> : isDone ? <Icon name="check" size={12} /> : r.idx}
                  </div>
                  <div>
                    <div className="rotation-name">
                      {r.name}
                      {r.isYou && <span className="pill" style={{ marginLeft: 8 }}>YOU</span>}
                      {isCurrent && <span className="pill" style={{ marginLeft: 6, background: 'var(--accent-soft)', color: 'var(--accent)' }}>RECEIVING</span>}
                      {r.late && <span className="pill" style={{ marginLeft: 6, background: 'var(--warn-soft)', color: 'var(--warn)' }}>LATE</span>}
                    </div>
                    <div className="rotation-addr">{r.addr}</div>
                  </div>
                  <div className="rotation-amount" style={{ color: r.paidThisRound ? 'var(--good)' : 'var(--muted)' }}>
                    {r.paidThisRound
                      ? <span className="row gap-6"><Icon name="check" size={12} /> Paid round {pool.currentRound}</span>
                      : r.late ? 'Missed' : 'Pending'}
                  </div>
                  <div className="rotation-amount mono" style={{ minWidth: 80, textAlign: 'right' }}>
                    {fmt(pool.contribution, 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Members ({pool.members})</div></div>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Wallet</th>
                <th>Reputation</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pool.rotation.map(r => (
                <tr key={r.idx}>
                  <td>
                    <div className="row gap-10">
                      <div className="avatar">{r.name[0]}</div>
                      {r.name}
                      {r.isYou && <span className="pill">YOU</span>}
                    </div>
                  </td>
                  <td className="mono text-sm text-muted">{r.addr}</td>
                  <td className="mono">{90 - r.idx * 2 + (r.late ? -10 : 0)}</td>
                  <td className="text-muted text-sm">Mar 2026</td>
                  <td style={{ textAlign: 'right' }}>
                    {r.late
                      ? <span className="badge warn no-dot">LATE</span>
                      : <span className="badge good no-dot">GOOD</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Round history</div></div>
          <table className="table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Recipient</th>
                <th>Pot</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Settled</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: pool.currentRound }).map((_, i) => {
                const r = pool.rotation[i];
                return (
                  <tr key={i}>
                    <td className="mono">#{i + 1}</td>
                    <td>{r?.name || '—'}</td>
                    <td className="mono">{fmt(pool.pot, 0)} USDC</td>
                    <td>
                      {i + 1 < pool.currentRound
                        ? <span className="badge good no-dot">SETTLED</span>
                        : <span className="badge no-dot">IN PROGRESS</span>}
                    </td>
                    <td style={{ textAlign: 'right' }} className="text-muted text-sm">
                      {i + 1 < pool.currentRound ? `Apr ${10 + i}, 2026` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rules' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Pool rules</div></div>
          <div className="col gap-12">
            <div className="kv"><span className="kv-k">Contribution</span><span className="kv-v">{fmt(pool.contribution, 0)} USDC / {pool.cycle.replace('ly', '')}</span></div>
            <div className="kv"><span className="kv-k">Members</span><span className="kv-v">{pool.members}</span></div>
            <div className="kv"><span className="kv-k">Total rounds</span><span className="kv-v">{pool.rounds}</span></div>
            <div className="kv"><span className="kv-k">Pot per round</span><span className="kv-v">{fmt(pool.pot, 0)} USDC</span></div>
            <div className="kv"><span className="kv-k">Collateral</span><span className="kv-v">{fmt(pool.contribution, 0)} USDC (refundable)</span></div>
            <div className="kv"><span className="kv-k">Slash threshold</span><span className="kv-v">Simple majority</span></div>
            <div className="kv"><span className="kv-k">Rotation order</span><span className="kv-v">Randomized (VRF)</span></div>
            <div className="kv">
              <span className="kv-k">Privacy</span>
              <span className="kv-v" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {pool.privateContributions
                  ? <><Icon name="shield" size={12} /><span style={{ color: 'var(--good)' }}>MagicBlock TEE (amounts hidden)</span></>
                  : 'Public onchain'}
              </span>
            </div>
            <div className="kv"><span className="kv-k">Program</span><span className="kv-v">Circlesv1...kHJq</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
