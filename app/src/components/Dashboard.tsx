'use client';

import { useState } from 'react';
import Icon from './Icon';
import { fmt, POOLIT_POOLS, POOLIT_ACTIVITY, POOLIT_REPUTATION } from '../lib/data';
import type { Pool, ActivityItem } from '../lib/types';

interface DashboardProps {
  onNavigate: (r: string) => void;
  onContribute: (pool: Pool) => void;
  wallet: { addr: string; balance: number };
  /** Live pools — passed from page.tsx so real onchain data overrides mock data */
  pools?: Pool[];
  onGetUsdc?: () => void;
  fetchingPools?: boolean;
}

export default function Dashboard({ onNavigate, onContribute, wallet, pools: poolsProp, onGetUsdc, fetchingPools }: DashboardProps) {
  const myPools = (poolsProp ?? POOLIT_POOLS).filter(p => p.youAreIn);
  const activity = POOLIT_ACTIVITY;
  const totalPooled = myPools.reduce((s, p) => s + p.contribution * p.contributedThisRound, 0);
  const nextDue = myPools.find(p => !p.yourPaid);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Active rounds: {myPools.filter(p => p.status === 'active').length} · Next payout in 4d</div>
        </div>
        <div className="row gap-8">
          <button className="btn" onClick={() => onNavigate('discover')}>
            <Icon name="compass" size={14} /> Discover
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('create')}>
            <Icon name="plus" size={14} /> New pool
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="stat-label">Wallet balance</div>
          <div className="stat-value">{fmt(wallet.balance)}</div>
          <div className="stat-delta up" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span><Icon name="trending" size={11} /> USDC · devnet</span>
            {onGetUsdc && (
              <button
                className="btn btn-sm"
                onClick={e => { e.stopPropagation(); onGetUsdc(); }}
                style={{ fontSize: 10, padding: '2px 8px', height: 20, lineHeight: 1 }}
              >
                + Get test USDC
              </button>
            )}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Active pools</div>
          <div className="stat-value">{myPools.filter(p => p.status === 'active').length}</div>
          <div className="stat-delta up">+1 this month</div>
        </div>
        <div className="stat">
          <div className="stat-label">Locked in pools</div>
          <div className="stat-value">{fmt(totalPooled)}</div>
          <div className="stat-delta">Across {myPools.length} circles</div>
        </div>
        <div className="stat">
          <div className="stat-label">Reputation</div>
          <div className="stat-value">{POOLIT_REPUTATION.score}</div>
          <div className="stat-delta up"><Icon name="shield" size={11} /> Trusted</div>
        </div>
      </div>

      {nextDue && (
        <div className="card" style={{ marginBottom: 24, background: 'var(--surface-2)' }}>
          <div className="row-between">
            <div>
              <div className="text-xs text-muted mono" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Action required</div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Contribute {fmt(nextDue.contribution)} USDC to {nextDue.name}
              </div>
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                Round {nextDue.currentRound} of {nextDue.rounds} · {nextDue.contributedThisRound} of {nextDue.members} members paid
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => onContribute(nextDue)}>
              <Icon name="send" size={14} /> Contribute now
            </button>
          </div>
        </div>
      )}

      <div className="row-between" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>My pools</div>
        <div className="seg">
          <button className="on">All</button>
          <button>Active</button>
          <button>Recruiting</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {fetchingPools
          ? <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 24, color: 'var(--muted)', fontSize: 13 }}>
              <div className="shimmer" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
              Loading on-chain pools…
            </div>
          : myPools.map(p => <PoolCard key={p.id} pool={p} onClick={() => onNavigate(`pool-${p.id}`)} />)}
        <DiscoverHintCard onClick={() => onNavigate('discover')} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent activity</div>
          <button className="btn-ghost text-sm" style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            View all <Icon name="chevron-right" size={12} />
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Pool</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {activity.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="row gap-10">
                    <ActivityIcon kind={a.kind} />
                    <span>{a.text}</span>
                  </div>
                </td>
                <td className="text-muted">{a.pool}</td>
                <td className="mono" style={{
                  color: a.kind === 'received' ? 'var(--good)' : a.kind === 'paid' ? 'var(--ink)' : 'var(--muted)'
                }}>
                  {a.amount || '—'}
                </td>
                <td style={{ textAlign: 'right' }} className="text-muted text-sm">{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: ActivityItem['kind'] }) {
  const map = {
    received: { icon: 'arrow-down',    color: 'var(--good)', bg: 'var(--accent-soft)' },
    paid:     { icon: 'arrow-up-right', color: 'var(--ink)',  bg: 'var(--surface-2)' },
    flagged:  { icon: 'alert',          color: 'var(--warn)', bg: 'var(--warn-soft)' },
    joined:   { icon: 'users',          color: 'var(--muted)', bg: 'var(--surface-2)' },
  } as const;
  const m = map[kind] ?? map.joined;
  return (
    <div style={{ width: 26, height: 26, borderRadius: 6, background: m.bg, color: m.color, display: 'grid', placeItems: 'center' }}>
      <Icon name={m.icon} size={13} />
    </div>
  );
}

export function PoolCard({ pool, onClick }: { pool: Pool; onClick: () => void }) {
  const pct = pool.status === 'recruiting'
    ? (pool.filled / pool.members) * 100
    : (pool.currentRound / pool.rounds) * 100;

  return (
    <div className="pool-card" onClick={onClick}>
      <div className="pool-card-head">
        <div>
          <div className="pool-name">{pool.name}</div>
          <div className="pool-sub">{pool.cycle} · {pool.members} members</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pool-amount">{fmt(pool.contribution, 0)}</div>
          <div className="pool-amount-sub">USDC / round</div>
        </div>
      </div>

      {pool.status === 'recruiting' ? (
        <>
          <div className="text-xs text-muted">{pool.filled} of {pool.members} joined</div>
          <div className="progress"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
        </>
      ) : (
        <>
          <div className="row-between">
            <div className="text-xs text-muted">Round {pool.currentRound} of {pool.rounds}</div>
            <div className="text-xs mono">{pool.contributedThisRound}/{pool.members} paid</div>
          </div>
          <div className="progress"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
        </>
      )}

      <div className="pool-meta">
        <div className="pool-meta-item">
          <span>{pool.status === 'recruiting' ? 'Starts' : 'Next payout'}</span>
          <span className="pool-meta-val">
            {new Date(pool.nextPayout).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="pool-meta-item">
          <span>Pot</span>
          <span className="pool-meta-val">{fmt(pool.pot, 0)}</span>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'center', display: 'flex', gap: 5, alignItems: 'center' }}>
          {pool.privateContributions && (
            <span className="badge no-dot" style={{ background: 'rgba(34,197,94,0.10)', color: 'var(--good)', borderColor: 'rgba(34,197,94,0.22)', fontSize: 9.5 }}>
              <Icon name="shield" size={9} /> PRIVATE
            </span>
          )}
          {pool.status === 'recruiting'
            ? <span className="badge no-dot">RECRUITING</span>
            : pool.yourPaid
              ? <span className="badge good no-dot">PAID</span>
              : <span className="badge warn no-dot">DUE</span>}
        </div>
      </div>
    </div>
  );
}

function DiscoverHintCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="pool-card"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px dashed var(--line-strong)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        color: 'var(--muted)',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
        <Icon name="compass" size={16} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Discover pools</div>
      <div className="text-xs text-muted" style={{ textAlign: 'center' }}>
        Browse open circles by reputation,<br />contribution size and cycle.
      </div>
    </div>
  );
}
